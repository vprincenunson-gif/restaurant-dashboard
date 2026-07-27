const tableController = {
  // List all tables
  async list(req, res, next) {
    try {
      const prisma = req.app.get('prisma');
      const { status } = req.query;

      const where = {};
      if (status) where.status = status;

      const tables = await prisma.table.findMany({
        where,
        include: {
          _count: { select: { orders: { where: { status: { notIn: ['completed', 'cancelled'] } } } } },
        },
        orderBy: { number: 'asc' },
      });

      // Enhance with active order info
      const enhancedTables = await Promise.all(
        tables.map(async (table) => {
          const activeOrder = await prisma.order.findFirst({
            where: {
              tableId: table.id,
              status: { notIn: ['completed', 'cancelled'] },
            },
            include: {
              _count: { select: { items: true } },
            },
            orderBy: { createdAt: 'desc' },
          });

          return {
            ...table,
            activeOrder: activeOrder
              ? { id: activeOrder.id, total: activeOrder.total, itemCount: activeOrder._count.items }
              : null,
          };
        })
      );

      res.json({ tables: enhancedTables });
    } catch (error) {
      next(error);
    }
  },

  // Get single table
  async getById(req, res, next) {
    try {
      const prisma = req.app.get('prisma');
      const table = await prisma.table.findUnique({
        where: { id: req.params.id },
        include: {
          orders: {
            where: { status: { notIn: ['completed', 'cancelled'] } },
            include: {
              items: { include: { menuItem: true } },
              customer: { select: { name: true } },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!table) {
        return res.status(404).json({ error: 'Table not found.' });
      }

      res.json({ table });
    } catch (error) {
      next(error);
    }
  },

  // Create table
  async create(req, res, next) {
    try {
      const prisma = req.app.get('prisma');
      const { number, capacity, location } = req.body;

      if (!number) {
        return res.status(400).json({ error: 'Table number is required.' });
      }

      const existing = await prisma.table.findUnique({ where: { number: parseInt(number) } });
      if (existing) {
        return res.status(409).json({ error: `Table ${number} already exists.` });
      }

      const table = await prisma.table.create({
        data: {
          number: parseInt(number),
          capacity: capacity ? parseInt(capacity) : 4,
          location: location || null,
        },
      });

      res.status(201).json({ table });
    } catch (error) {
      next(error);
    }
  },

  // Update table
  async update(req, res, next) {
    try {
      const prisma = req.app.get('prisma');
      const { number, capacity, status, location } = req.body;

      const data = {};
      if (number) data.number = parseInt(number);
      if (capacity) data.capacity = parseInt(capacity);
      if (status) data.status = status;
      if (location !== undefined) data.location = location;

      const table = await prisma.table.update({
        where: { id: req.params.id },
        data,
      });

      res.json({ table });
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Table not found.' });
      }
      next(error);
    }
  },

  // Delete table
  async delete(req, res, next) {
    try {
      const prisma = req.app.get('prisma');
      await prisma.table.delete({ where: { id: req.params.id } });
      res.json({ message: 'Table deleted.' });
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Table not found.' });
      }
      next(error);
    }
  },
};

module.exports = tableController;
