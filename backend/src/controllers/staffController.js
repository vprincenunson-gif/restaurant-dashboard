const staffController = {
  // List all staff
  async list(req, res, next) {
    try {
      const prisma = req.app.get('prisma');
      const { role, isActive, page = 1, limit = 50 } = req.query;

      const where = {};
      if (role) where.role = role;
      if (isActive !== undefined) where.isActive = isActive === 'true';

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [staff, total] = await Promise.all([
        prisma.staff.findMany({
          where,
          include: { user: { select: { email: true, avatar: true } } },
          orderBy: { name: 'asc' },
          skip,
          take: parseInt(limit),
        }),
        prisma.staff.count({ where }),
      ]);

      res.json({
        staff,
        pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) },
      });
    } catch (error) {
      next(error);
    }
  },

  // Get single staff
  async getById(req, res, next) {
    try {
      const prisma = req.app.get('prisma');
      const member = await prisma.staff.findUnique({
        where: { id: req.params.id },
        include: { user: { select: { email: true, avatar: true, createdAt: true } } },
      });
      if (!member) return res.status(404).json({ error: 'Staff not found.' });
      res.json({ staff: member });
    } catch (error) {
      next(error);
    }
  },

  // Create staff
  async create(req, res, next) {
    try {
      const prisma = req.app.get('prisma');
      const { name, email, phone, role, shift, salary, hourlyRate, address, emergencyContact, notes } = req.body;

      if (!name) return res.status(400).json({ error: 'Name is required.' });

      // If email is provided, create user account too
      let userId = null;
      if (email) {
        const user = await prisma.user.upsert({
          where: { email },
          update: {},
          create: { email, name, role: 'staff' },
        });
        userId = user.id;
      }

      const member = await prisma.staff.create({
        data: {
          name,
          email,
          phone,
          role: role || 'waiter',
          shift: shift || null,
          salary: salary ? parseFloat(salary) : null,
          hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
          address: address || null,
          emergencyContact: emergencyContact || null,
          notes: notes || null,
          userId,
        },
      });

      await prisma.activityLog.create({
        data: { userId: req.user.id, action: 'create', entity: 'staff', entityId: member.id, details: { name, role } },
      });

      res.status(201).json({ staff: member });
    } catch (error) {
      next(error);
    }
  },

  // Update staff
  async update(req, res, next) {
    try {
      const prisma = req.app.get('prisma');
      const { name, email, phone, role, shift, salary, hourlyRate, address, emergencyContact, isActive, notes } = req.body;

      const data = {};
      if (name !== undefined) data.name = name;
      if (email !== undefined) data.email = email;
      if (phone !== undefined) data.phone = phone;
      if (role) data.role = role;
      if (shift !== undefined) data.shift = shift;
      if (salary !== undefined) data.salary = salary ? parseFloat(salary) : null;
      if (hourlyRate !== undefined) data.hourlyRate = hourlyRate ? parseFloat(hourlyRate) : null;
      if (address !== undefined) data.address = address;
      if (emergencyContact !== undefined) data.emergencyContact = emergencyContact;
      if (isActive !== undefined) data.isActive = isActive;
      if (notes !== undefined) data.notes = notes;

      const member = await prisma.staff.update({
        where: { id: req.params.id },
        data,
      });

      res.json({ staff: member });
    } catch (error) {
      if (error.code === 'P2025') return res.status(404).json({ error: 'Staff not found.' });
      next(error);
    }
  },

  // Delete staff (soft delete)
  async delete(req, res, next) {
    try {
      const prisma = req.app.get('prisma');
      await prisma.staff.update({
        where: { id: req.params.id },
        data: { isActive: false },
      });
      res.json({ message: 'Staff deactivated.' });
    } catch (error) {
      if (error.code === 'P2025') return res.status(404).json({ error: 'Staff not found.' });
      next(error);
    }
  },

  // Get staff stats
  async getStats(req, res, next) {
    try {
      const prisma = req.app.get('prisma');
      const [total, byRole, byShift] = await Promise.all([
        prisma.staff.count({ where: { isActive: true } }),
        prisma.staff.groupBy({ by: ['role'], _count: { id: true }, where: { isActive: true } }),
        prisma.staff.groupBy({ by: ['shift'], _count: { id: true }, where: { isActive: true, shift: { not: null } } }),
      ]);

      res.json({ stats: { total, byRole, byShift } });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = staffController;
