const menuController = {
  // List menu items
  async listItems(req, res, next) {
    try {
      const prisma = req.app.get('prisma');
      const { category, search, available, page = 1, limit = 100 } = req.query;

      const where = {};
      if (category) where.categoryId = category;
      if (available === 'true') where.available = true;
      if (search) where.name = { contains: search, mode: 'insensitive' };

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [items, total] = await Promise.all([
        prisma.menuItem.findMany({
          where,
          include: { category: true },
          orderBy: [{ category: { sortOrder: 'asc' } }, { name: 'asc' }],
          skip,
          take: parseInt(limit),
        }),
        prisma.menuItem.count({ where }),
      ]);

      res.json({ items, pagination: { total, page: parseInt(page), limit: parseInt(limit) } });
    } catch (error) {
      next(error);
    }
  },

  // Create menu item
  async createItem(req, res, next) {
    try {
      const prisma = req.app.get('prisma');
      const { name, description, price, cost, categoryId, image, prepTime, available } = req.body;

      if (!name || !price || !categoryId) {
        return res.status(400).json({ error: 'Name, price, and category are required.' });
      }

      const item = await prisma.menuItem.create({
        data: {
          name,
          description: description || null,
          price: parseFloat(price),
          cost: cost ? parseFloat(cost) : null,
          categoryId,
          image: image || null,
          prepTime: prepTime ? parseInt(prepTime) : null,
          available: available !== undefined ? available : true,
        },
        include: { category: true },
      });

      res.status(201).json({ item });
    } catch (error) {
      next(error);
    }
  },

  // Update menu item
  async updateItem(req, res, next) {
    try {
      const prisma = req.app.get('prisma');
      const data = {};
      const fields = ['name', 'description', 'image', 'notes'];
      fields.forEach(f => { if (req.body[f] !== undefined) data[f] = req.body[f]; });
      if (req.body.price !== undefined) data.price = parseFloat(req.body.price);
      if (req.body.cost !== undefined) data.cost = parseFloat(req.body.cost) || null;
      if (req.body.categoryId) data.categoryId = req.body.categoryId;
      if (req.body.prepTime !== undefined) data.prepTime = req.body.prepTime ? parseInt(req.body.prepTime) : null;
      if (req.body.available !== undefined) data.available = req.body.available;

      const item = await prisma.menuItem.update({
        where: { id: req.params.id },
        data,
        include: { category: true },
      });

      res.json({ item });
    } catch (error) {
      if (error.code === 'P2025') return res.status(404).json({ error: 'Item not found.' });
      next(error);
    }
  },

  // Delete menu item
  async deleteItem(req, res, next) {
    try {
      const prisma = req.app.get('prisma');
      await prisma.menuItem.update({ where: { id: req.params.id }, data: { available: false } });
      res.json({ message: 'Item deactivated.' });
    } catch (error) {
      if (error.code === 'P2025') return res.status(404).json({ error: 'Item not found.' });
      next(error);
    }
  },

  // List categories
  async listCategories(req, res, next) {
    try {
      const prisma = req.app.get('prisma');
      const categories = await prisma.menuCategory.findMany({
        include: { _count: { select: { items: true } } },
        orderBy: { sortOrder: 'asc' },
      });
      res.json({ categories });
    } catch (error) {
      next(error);
    }
  },

  // Create category
  async createCategory(req, res, next) {
    try {
      const prisma = req.app.get('prisma');
      const { name, description, sortOrder } = req.body;
      if (!name) return res.status(400).json({ error: 'Category name is required.' });

      const category = await prisma.menuCategory.create({
        data: { name, description, sortOrder: sortOrder ? parseInt(sortOrder) : 0 },
      });
      res.status(201).json({ category });
    } catch (error) {
      if (error.code === 'P2002') return res.status(409).json({ error: 'Category already exists.' });
      next(error);
    }
  },
};

module.exports = menuController;
