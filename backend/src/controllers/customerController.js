const customerController = {
  // List customers
  async list(req, res, next) {
    try {
      const prisma = req.app.get('prisma');
      const { search, isVip, page = 1, limit = 50 } = req.query;

      const where = {};
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
        ];
      }
      if (isVip === 'true') where.isVip = true;

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [customers, total] = await Promise.all([
        prisma.customer.findMany({
          where,
          orderBy: { totalSpent: 'desc' },
          skip,
          take: parseInt(limit),
          include: { _count: { select: { orders: true } } },
        }),
        prisma.customer.count({ where }),
      ]);

      res.json({
        customers,
        pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) },
      });
    } catch (error) {
      next(error);
    }
  },

  // Get single customer with order history
  async getById(req, res, next) {
    try {
      const prisma = req.app.get('prisma');
      const customer = await prisma.customer.findUnique({
        where: { id: req.params.id },
        include: {
          orders: {
            orderBy: { createdAt: 'desc' },
            take: 20,
            include: {
              items: { include: { menuItem: { select: { name: true } } } },
              table: { select: { number: true } },
            },
          },
          _count: { select: { orders: true } },
        },
      });

      if (!customer) return res.status(404).json({ error: 'Customer not found.' });
      res.json({ customer });
    } catch (error) {
      next(error);
    }
  },

  // Create customer
  async create(req, res, next) {
    try {
      const prisma = req.app.get('prisma');
      const { name, email, phone, address, notes } = req.body;

      if (!name) return res.status(400).json({ error: 'Name is required.' });

      const customer = await prisma.customer.create({
        data: { name, email, phone, address, notes },
      });

      res.status(201).json({ customer });
    } catch (error) {
      if (error.code === 'P2002') {
        return res.status(409).json({ error: `Customer with this ${error.meta?.target?.[0]} already exists.` });
      }
      next(error);
    }
  },

  // Update customer
  async update(req, res, next) {
    try {
      const prisma = req.app.get('prisma');
      const { name, email, phone, address, notes, isVip } = req.body;

      const data = {};
      if (name !== undefined) data.name = name;
      if (email !== undefined) data.email = email;
      if (phone !== undefined) data.phone = phone;
      if (address !== undefined) data.address = address;
      if (notes !== undefined) data.notes = notes;
      if (isVip !== undefined) data.isVip = isVip;

      const customer = await prisma.customer.update({
        where: { id: req.params.id },
        data,
      });

      res.json({ customer });
    } catch (error) {
      if (error.code === 'P2025') return res.status(404).json({ error: 'Customer not found.' });
      next(error);
    }
  },

  // Delete customer
  async delete(req, res, next) {
    try {
      const prisma = req.app.get('prisma');
      await prisma.customer.delete({ where: { id: req.params.id } });
      res.json({ message: 'Customer deleted.' });
    } catch (error) {
      if (error.code === 'P2025') return res.status(404).json({ error: 'Customer not found.' });
      next(error);
    }
  },
};

module.exports = customerController;
