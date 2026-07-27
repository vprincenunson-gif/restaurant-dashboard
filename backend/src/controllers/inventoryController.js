const inventoryController = {
  // List inventory items
  async list(req, res, next) {
    try {
      const prisma = req.app.get('prisma');
      const { category, search, lowStock, page = 1, limit = 50 } = req.query;

      const where = { isActive: true };
      if (category) where.category = category;
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
        ];
      }
      if (lowStock === 'true') {
        where.quantity = { lte: prisma.inventoryItem.fields.minStock };
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [items, total] = await Promise.all([
        prisma.inventoryItem.findMany({
          where,
          orderBy: { name: 'asc' },
          skip,
          take: parseInt(limit),
        }),
        prisma.inventoryItem.count({ where }),
      ]);

      // Add low stock flag
      const enhancedItems = items.map(item => ({
        ...item,
        isLowStock: item.quantity <= item.minStock,
        stockPercentage: item.maxStock ? (item.quantity / item.maxStock) * 100 : null,
      }));

      res.json({
        items: enhancedItems,
        pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) },
      });
    } catch (error) {
      next(error);
    }
  },

  // Get single inventory item
  async getById(req, res, next) {
    try {
      const prisma = req.app.get('prisma');
      const item = await prisma.inventoryItem.findUnique({ where: { id: req.params.id } });
      if (!item) return res.status(404).json({ error: 'Item not found.' });
      res.json({ item });
    } catch (error) {
      next(error);
    }
  },

  // Create inventory item
  async create(req, res, next) {
    try {
      const prisma = req.app.get('prisma');
      const { name, sku, category, quantity, unit, minStock, maxStock, costPerUnit, supplier, location, expiryDate, notes } = req.body;

      if (!name) return res.status(400).json({ error: 'Item name is required.' });

      const item = await prisma.inventoryItem.create({
        data: {
          name,
          sku: sku || null,
          category: category || 'other',
          quantity: quantity ? parseFloat(quantity) : 0,
          unit: unit || 'pcs',
          minStock: minStock ? parseFloat(minStock) : 10,
          maxStock: maxStock ? parseFloat(maxStock) : null,
          costPerUnit: costPerUnit ? parseFloat(costPerUnit) : null,
          supplier: supplier || null,
          location: location || null,
          expiryDate: expiryDate ? new Date(expiryDate) : null,
          notes: notes || null,
        },
      });

      await prisma.activityLog.create({
        data: { userId: req.user.id, action: 'create', entity: 'inventory', entityId: item.id, details: { name } },
      });

      res.status(201).json({ item });
    } catch (error) {
      next(error);
    }
  },

  // Update inventory item
  async update(req, res, next) {
    try {
      const prisma = req.app.get('prisma');
      const { name, sku, category, quantity, unit, minStock, maxStock, costPerUnit, supplier, location, expiryDate, notes, isActive } = req.body;

      const data = {};
      if (name !== undefined) data.name = name;
      if (sku !== undefined) data.sku = sku;
      if (category) data.category = category;
      if (quantity !== undefined) data.quantity = parseFloat(quantity);
      if (unit) data.unit = unit;
      if (minStock !== undefined) data.minStock = parseFloat(minStock);
      if (maxStock !== undefined) data.maxStock = maxStock ? parseFloat(maxStock) : null;
      if (costPerUnit !== undefined) data.costPerUnit = costPerUnit ? parseFloat(costPerUnit) : null;
      if (supplier !== undefined) data.supplier = supplier;
      if (location !== undefined) data.location = location;
      if (expiryDate !== undefined) data.expiryDate = expiryDate ? new Date(expiryDate) : null;
      if (notes !== undefined) data.notes = notes;
      if (isActive !== undefined) data.isActive = isActive;

      const item = await prisma.inventoryItem.update({
        where: { id: req.params.id },
        data,
      });

      res.json({ item });
    } catch (error) {
      if (error.code === 'P2025') return res.status(404).json({ error: 'Item not found.' });
      next(error);
    }
  },

  // Adjust stock (add or remove quantity)
  async adjustStock(req, res, next) {
    try {
      const prisma = req.app.get('prisma');
      const { quantity, operation = 'add' } = req.body;

      if (quantity === undefined) return res.status(400).json({ error: 'Quantity is required.' });

      const item = await prisma.inventoryItem.findUnique({ where: { id: req.params.id } });
      if (!item) return res.status(404).json({ error: 'Item not found.' });

      const adjustment = parseFloat(quantity);
      const newQuantity = operation === 'add' ? item.quantity + adjustment : item.quantity - adjustment;

      if (newQuantity < 0) return res.status(400).json({ error: 'Insufficient stock.' });

      const updated = await prisma.inventoryItem.update({
        where: { id: req.params.id },
        data: { quantity: newQuantity },
      });

      res.json({ item: updated });
    } catch (error) {
      next(error);
    }
  },

  // Delete inventory item
  async delete(req, res, next) {
    try {
      const prisma = req.app.get('prisma');
      await prisma.inventoryItem.update({
        where: { id: req.params.id },
        data: { isActive: false },
      });
      res.json({ message: 'Item deactivated.' });
    } catch (error) {
      if (error.code === 'P2025') return res.status(404).json({ error: 'Item not found.' });
      next(error);
    }
  },

  // Get low stock alerts
  async getLowStockAlerts(req, res, next) {
    try {
      const prisma = req.app.get('prisma');
      const items = await prisma.inventoryItem.findMany({
        where: {
          isActive: true,
          quantity: { lte: prisma.inventoryItem.fields.minStock },
        },
        orderBy: { quantity: 'asc' },
      });

      const alerts = items.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        minStock: item.minStock,
        unit: item.unit,
        shortage: item.minStock - item.quantity,
        severity: item.quantity === 0 ? 'critical' : item.quantity <= item.minStock * 0.5 ? 'high' : 'low',
      }));

      res.json({ alerts, count: alerts.length });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = inventoryController;
