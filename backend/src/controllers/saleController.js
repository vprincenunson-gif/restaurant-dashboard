const saleController = {
  // List sales
  async list(req, res, next) {
    try {
      const prisma = req.app.get('prisma');
      const { status, paymentMethod, dateFrom, dateTo, page = 1, limit = 50 } = req.query;

      const where = {};
      if (status) where.status = status;
      if (paymentMethod) where.paymentMethod = paymentMethod;
      if (dateFrom || dateTo) {
        where.saleDate = {};
        if (dateFrom) where.saleDate.gte = new Date(dateFrom);
        if (dateTo) where.saleDate.lte = new Date(dateTo);
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [sales, total, totals] = await Promise.all([
        prisma.sale.findMany({
          where,
          include: {
            order: {
              select: { orderNumber: true, type: true },
              include: { items: { include: { menuItem: { select: { name: true } } } } },
            },
            user: { select: { name: true } },
          },
          orderBy: { saleDate: 'desc' },
          skip,
          take: parseInt(limit),
        }),
        prisma.sale.count({ where }),
        prisma.sale.aggregate({ where, _sum: { amount: true }, _count: { id: true } }),
      ]);

      res.json({
        sales,
        summary: {
          totalAmount: totals._sum.amount || 0,
          totalSales: totals._count.id,
        },
        pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) },
      });
    } catch (error) {
      next(error);
    }
  },

  // Get single sale
  async getById(req, res, next) {
    try {
      const prisma = req.app.get('prisma');
      const sale = await prisma.sale.findUnique({
        where: { id: req.params.id },
        include: {
          order: { include: { items: { include: { menuItem: true } }, table: true, customer: true } },
          user: { select: { name: true } },
        },
      });
      if (!sale) return res.status(404).json({ error: 'Sale not found.' });
      res.json({ sale });
    } catch (error) {
      next(error);
    }
  },

  // Create manual sale
  async create(req, res, next) {
    try {
      const prisma = req.app.get('prisma');
      const { orderId, amount, paymentMethod, transactionId, notes } = req.body;

      if (!amount) return res.status(400).json({ error: 'Amount is required.' });

      // Validate order if provided
      if (orderId) {
        const order = await prisma.order.findUnique({ where: { id: orderId } });
        if (!order) return res.status(404).json({ error: 'Order not found.' });

        const existingSale = await prisma.sale.findUnique({ where: { orderId } });
        if (existingSale) return res.status(409).json({ error: 'Sale already exists for this order.' });
      }

      const sale = await prisma.sale.create({
        data: {
          orderId: orderId || null,
          userId: req.user.id,
          amount: parseFloat(amount),
          paymentMethod: paymentMethod || 'cash',
          transactionId: transactionId || null,
          notes: notes || null,
        },
        include: { order: { select: { orderNumber: true } } },
      });

      // Update order payment status if linked
      if (orderId) {
        await prisma.order.update({
          where: { id: orderId },
          data: { paymentStatus: 'paid', paymentMethod: paymentMethod || 'cash', status: 'completed' },
        });
      }

      res.status(201).json({ sale });
    } catch (error) {
      next(error);
    }
  },

  // Update sale
  async update(req, res, next) {
    try {
      const prisma = req.app.get('prisma');
      const { amount, paymentMethod, status, transactionId, notes } = req.body;

      const data = {};
      if (amount !== undefined) data.amount = parseFloat(amount);
      if (paymentMethod) data.paymentMethod = paymentMethod;
      if (status) data.status = status;
      if (transactionId !== undefined) data.transactionId = transactionId;
      if (notes !== undefined) data.notes = notes;

      const sale = await prisma.sale.update({
        where: { id: req.params.id },
        data,
      });

      res.json({ sale });
    } catch (error) {
      if (error.code === 'P2025') return res.status(404).json({ error: 'Sale not found.' });
      next(error);
    }
  },

  // Get sales summary for today
  async getTodaySummary(req, res, next) {
    try {
      const prisma = req.app.get('prisma');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const sales = await prisma.sale.findMany({
        where: { saleDate: { gte: today, lt: tomorrow }, status: 'completed' },
      });

      const totalAmount = sales.reduce((sum, s) => sum + s.amount, 0);
      const byMethod = {};
      sales.forEach(s => {
        byMethod[s.paymentMethod] = (byMethod[s.paymentMethod] || 0) + s.amount;
      });

      res.json({
        summary: {
          totalSales: sales.length,
          totalAmount,
          averageOrder: sales.length ? totalAmount / sales.length : 0,
          byPaymentMethod: byMethod,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // Void/refund sale
  async voidSale(req, res, next) {
    try {
      const prisma = req.app.get('prisma');
      const sale = await prisma.sale.update({
        where: { id: req.params.id },
        data: { status: 'refunded' },
      });

      if (sale.orderId) {
        await prisma.order.update({
          where: { id: sale.orderId },
          data: { paymentStatus: 'refunded' },
        });
      }

      res.json({ sale });
    } catch (error) {
      if (error.code === 'P2025') return res.status(404).json({ error: 'Sale not found.' });
      next(error);
    }
  },
};

module.exports = saleController;
