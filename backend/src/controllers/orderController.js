const orderController = {
  // List all orders with optional filtering
  async list(req, res, next) {
    try {
      const prisma = req.app.get('prisma');
      const { status, type, page = 1, limit = 20, dateFrom, dateTo } = req.query;

      const where = {};
      if (status) where.status = status;
      if (type) where.type = type;
      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) where.createdAt.gte = new Date(dateFrom);
        if (dateTo) where.createdAt.lte = new Date(dateTo);
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where,
          include: {
            table: { select: { number: true } },
            customer: { select: { name: true, phone: true } },
            user: { select: { name: true } },
            items: {
              include: {
                menuItem: { select: { name: true, price: true } },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: parseInt(limit),
        }),
        prisma.order.count({ where }),
      ]);

      res.json({
        orders,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // Get single order
  async getById(req, res, next) {
    try {
      const prisma = req.app.get('prisma');
      const order = await prisma.order.findUnique({
        where: { id: req.params.id },
        include: {
          table: true,
          customer: true,
          user: { select: { id: true, name: true } },
          items: {
            include: {
              menuItem: { include: { category: true } },
            },
          },
          sale: true,
        },
      });

      if (!order) {
        return res.status(404).json({ error: 'Order not found.' });
      }

      res.json({ order });
    } catch (error) {
      next(error);
    }
  },

  // Create order
  async create(req, res, next) {
    try {
      const prisma = req.app.get('prisma');
      const { tableId, customerId, type, items, notes } = req.body;

      if (!items || !items.length) {
        return res.status(400).json({ error: 'Order must have at least one item.' });
      }

      // Validate menu items and calculate totals
      const menuItemIds = items.map(i => i.menuItemId);
      const menuItems = await prisma.menuItem.findMany({
        where: { id: { in: menuItemIds } },
      });

      const menuItemMap = new Map(menuItems.map(m => [m.id, m]));
      let subtotal = 0;
      const orderItems = items.map(item => {
        const menuItem = menuItemMap.get(item.menuItemId);
        if (!menuItem) throw new Error(`Menu item ${item.menuItemId} not found`);
        const itemSubtotal = menuItem.price * item.quantity;
        subtotal += itemSubtotal;
        return {
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          unitPrice: menuItem.price,
          subtotal: itemSubtotal,
          notes: item.notes || null,
        };
      });

      const tax = subtotal * 0.05; // 5% tax
      const serviceCharge = subtotal * 0.10; // 10% service charge
      const total = subtotal + tax + serviceCharge;

      const order = await prisma.order.create({
        data: {
          tableId: tableId || null,
          customerId: customerId || null,
          userId: req.user.id,
          type: type || 'dine-in',
          subtotal,
          tax,
          serviceCharge,
          total,
          notes,
          items: { create: orderItems },
        },
        include: {
          table: true,
          items: { include: { menuItem: true } },
        },
      });

      // Update table status if dine-in
      if (tableId && type !== 'takeaway') {
        await prisma.table.update({
          where: { id: tableId },
          data: { status: 'occupied' },
        });
      }

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId: req.user.id,
          action: 'create',
          entity: 'order',
          entityId: order.id,
          details: { orderNumber: order.orderNumber, total },
        },
      });

      res.status(201).json({ order });
    } catch (error) {
      next(error);
    }
  },

  // Update order status
  async updateStatus(req, res, next) {
    try {
      const prisma = req.app.get('prisma');
      const { status } = req.body;
      const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled'];

      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: `Invalid status. Valid: ${validStatuses.join(', ')}` });
      }

      const order = await prisma.order.update({
        where: { id: req.params.id },
        data: { status },
        include: {
          table: { select: { number: true } },
          items: { include: { menuItem: true } },
        },
      });

      // Free table when order is completed or cancelled
      if ((status === 'completed' || status === 'cancelled') && order.tableId) {
        await prisma.table.update({
          where: { id: order.tableId },
          data: { status: 'available' },
        });
      }

      // Create sale if completed
      if (status === 'completed' && !order.sale) {
        await prisma.sale.create({
          data: {
            orderId: order.id,
            userId: req.user.id,
            amount: order.total,
            paymentMethod: order.paymentMethod || 'cash',
            status: 'completed',
          },
        });
      }

      await prisma.activityLog.create({
        data: {
          userId: req.user.id,
          action: 'update',
          entity: 'order',
          entityId: order.id,
          details: { status },
        },
      });

      res.json({ order });
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Order not found.' });
      }
      next(error);
    }
  },

  // Update order (add items, modify)
  async update(req, res, next) {
    try {
      const prisma = req.app.get('prisma');
      const { items, notes, paymentMethod } = req.body;

      const order = await prisma.order.findUnique({
        where: { id: req.params.id },
        include: { items: true },
      });

      if (!order) {
        return res.status(404).json({ error: 'Order not found.' });
      }

      if (['completed', 'cancelled'].includes(order.status)) {
        return res.status(400).json({ error: 'Cannot modify completed or cancelled orders.' });
      }

      let updateData = {};
      if (items) {
        // Delete existing items and recreate
        await prisma.orderItem.deleteMany({ where: { orderId: order.id } });

        const menuItemIds = items.map(i => i.menuItemId);
        const menuItems = await prisma.menuItem.findMany({
          where: { id: { in: menuItemIds } },
        });

        const menuItemMap = new Map(menuItems.map(m => [m.id, m]));
        let subtotal = 0;
        const newItems = items.map(item => {
          const menuItem = menuItemMap.get(item.menuItemId);
          const itemSubtotal = menuItem.price * item.quantity;
          subtotal += itemSubtotal;
          return {
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            unitPrice: menuItem.price,
            subtotal: itemSubtotal,
            notes: item.notes || null,
          };
        });

        const tax = subtotal * 0.05;
        const serviceCharge = subtotal * 0.10;
        updateData = {
          subtotal,
          tax,
          serviceCharge,
          total: subtotal + tax + serviceCharge,
          items: { create: newItems },
        };
      }

      if (notes !== undefined) updateData.notes = notes;
      if (paymentMethod) updateData.paymentMethod = paymentMethod;

      const updatedOrder = await prisma.order.update({
        where: { id: req.params.id },
        data: updateData,
        include: {
          table: true,
          items: { include: { menuItem: true } },
        },
      });

      res.json({ order: updatedOrder });
    } catch (error) {
      next(error);
    }
  },

  // Get order status counts
  async getStatusCounts(req, res, next) {
    try {
      const prisma = req.app.get('prisma');
      const counts = await prisma.order.groupBy({
        by: ['status'],
        _count: { id: true },
        where: {
          createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      });

      const result = {
        pending: 0,
        confirmed: 0,
        preparing: 0,
        ready: 0,
        served: 0,
        completed: 0,
        cancelled: 0,
      };

      counts.forEach(c => { result[c.status] = c._count.id; });
      res.json({ counts: result });
    } catch (error) {
      next(error);
    }
  },

  // Delete order
  async delete(req, res, next) {
    try {
      const prisma = req.app.get('prisma');
      await prisma.order.delete({ where: { id: req.params.id } });
      res.json({ message: 'Order deleted successfully.' });
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Order not found.' });
      }
      next(error);
    }
  },
};

module.exports = orderController;
