const { GoogleGenerativeAI } = require('@google/generative-ai');

const analyticsController = {
  // Dashboard overview stats
  async getDashboardStats(req, res, next) {
    try {
      const prisma = req.app.get('prisma');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      const [
        todayOrders,
        todaySales,
        monthlySales,
        activeOrders,
        availableTables,
        totalTables,
        staffCount,
        lowStockCount,
        todayCustomers,
      ] = await Promise.all([
        prisma.order.findMany({ where: { createdAt: { gte: today, lt: tomorrow } } }),
        prisma.sale.aggregate({
          where: { saleDate: { gte: today, lt: tomorrow }, status: 'completed' },
          _sum: { amount: true },
          _count: { id: true },
        }),
        prisma.sale.aggregate({
          where: { saleDate: { gte: startOfMonth }, status: 'completed' },
          _sum: { amount: true },
        }),
        prisma.order.count({ where: { status: { notIn: ['completed', 'cancelled'] } } }),
        prisma.table.count({ where: { status: 'available' } }),
        prisma.table.count(),
        prisma.staff.count({ where: { isActive: true } }),
        prisma.inventoryItem.count({
          where: { isActive: true, quantity: { lte: prisma.inventoryItem.fields.minStock } },
        }),
        prisma.customer.count({ where: { createdAt: { gte: today } } }),
      ]);

      const orderStatusCounts = {
        pending: todayOrders.filter(o => o.status === 'pending').length,
        preparing: todayOrders.filter(o => o.status === 'preparing').length,
        ready: todayOrders.filter(o => o.status === 'ready').length,
        completed: todayOrders.filter(o => o.status === 'completed').length,
        cancelled: todayOrders.filter(o => o.status === 'cancelled').length,
      };

      res.json({
        stats: {
          todaySales: todaySales._sum.amount || 0,
          todayOrderCount: todaySales._count.id,
          monthlyRevenue: monthlySales._sum.amount || 0,
          activeOrders,
          availableTables,
          totalTables,
          tableOccupancy: totalTables ? ((totalTables - availableTables) / totalTables) * 100 : 0,
          staffCount,
          lowStockCount,
          newCustomers: todayCustomers,
          orderStatusCounts,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // Revenue data (daily/weekly/monthly)
  async getRevenueData(req, res, next) {
    try {
      const prisma = req.app.get('prisma');
      const { period = 'daily', days = 7 } = req.query;

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - parseInt(days));

      const sales = await prisma.sale.findMany({
        where: {
          saleDate: { gte: startDate, lte: endDate },
          status: 'completed',
        },
        orderBy: { saleDate: 'asc' },
      });

      // Group by date
      const revenueMap = {};
      const orderCountMap = {};
      sales.forEach(sale => {
        let key;
        const d = new Date(sale.saleDate);
        if (period === 'hourly') {
          key = `${d.toISOString().slice(0, 10)}T${d.getHours()}:00`;
        } else if (period === 'monthly') {
          key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        } else {
          key = d.toISOString().slice(0, 10);
        }
        revenueMap[key] = (revenueMap[key] || 0) + sale.amount;
        orderCountMap[key] = (orderCountMap[key] || 0) + 1;
      });

      // Fill missing dates
      const result = [];
      for (let i = 0; i < parseInt(days); i++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        const key = d.toISOString().slice(0, 10);
        result.push({
          date: key,
          revenue: revenueMap[key] || 0,
          orders: orderCountMap[key] || 0,
          label: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        });
      }

      const totalRevenue = Object.values(revenueMap).reduce((sum, v) => sum + v, 0);
      const avgOrderValue = sales.length ? totalRevenue / sales.length : 0;

      res.json({
        revenueData: result,
        summary: {
          totalRevenue,
          totalOrders: sales.length,
          averageOrderValue: avgOrderValue,
          period: { start: startDate.toISOString(), end: endDate.toISOString(), days: parseInt(days) },
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // Top selling items
  async getTopItems(req, res, next) {
    try {
      const prisma = req.app.get('prisma');
      const { limit = 10, days = 30 } = req.query;

      const since = new Date();
      since.setDate(since.getDate() - parseInt(days));

      const orderItems = await prisma.orderItem.findMany({
        where: {
          order: { createdAt: { gte: since }, status: { not: 'cancelled' } },
        },
        include: { menuItem: { select: { name: true, price: true, category: { select: { name: true } } } } },
      });

      const itemMap = {};
      orderItems.forEach(item => {
        const id = item.menuItemId;
        if (!itemMap[id]) {
          itemMap[id] = {
            id,
            name: item.menuItem.name,
            price: item.menuItem.price,
            category: item.menuItem.category.name,
            quantity: 0,
            revenue: 0,
          };
        }
        itemMap[id].quantity += item.quantity;
        itemMap[id].revenue += item.subtotal;
      });

      const topItems = Object.values(itemMap)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, parseInt(limit));

      res.json({ topItems });
    } catch (error) {
      next(error);
    }
  },

  // Payment method distribution
  async getPaymentDistribution(req, res, next) {
    try {
      const prisma = req.app.get('prisma');
      const { days = 30 } = req.query;

      const since = new Date();
      since.setDate(since.getDate() - parseInt(days));

      const result = await prisma.sale.groupBy({
        by: ['paymentMethod'],
        _sum: { amount: true },
        _count: { id: true },
        where: { saleDate: { gte: since }, status: 'completed' },
      });

      const distribution = result.map(r => ({
        method: r.paymentMethod,
        amount: r._sum.amount || 0,
        count: r._count.id,
      }));

      const total = distribution.reduce((sum, d) => sum + d.amount, 0);

      res.json({
        distribution: distribution.map(d => ({ ...d, percentage: total ? (d.amount / total) * 100 : 0 })),
        total,
      });
    } catch (error) {
      next(error);
    }
  },

  // Peak hours analysis
  async getPeakHours(req, res, next) {
    try {
      const prisma = req.app.get('prisma');
      const { days = 30 } = req.query;

      const since = new Date();
      since.setDate(since.getDate() - parseInt(days));

      const orders = await prisma.order.findMany({
        where: { createdAt: { gte: since }, status: { not: 'cancelled' } },
        select: { createdAt: true, total: true },
      });

      const hourMap = {};
      orders.forEach(order => {
        const hour = new Date(order.createdAt).getHours();
        if (!hourMap[hour]) hourMap[hour] = { orders: 0, revenue: 0 };
        hourMap[hour].orders++;
        hourMap[hour].revenue += order.total;
      });

      const peakHours = Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        label: `${i.toString().padStart(2, '0')}:00`,
        orders: hourMap[i]?.orders || 0,
        revenue: hourMap[i]?.revenue || 0,
      }));

      res.json({ peakHours });
    } catch (error) {
      next(error);
    }
  },

  // Orders trend
  async getOrderTrends(req, res, next) {
    try {
      const prisma = req.app.get('prisma');
      const { days = 30 } = req.query;
      const since = new Date();
      since.setDate(since.getDate() - parseInt(days));

      const orders = await prisma.order.findMany({
        where: { createdAt: { gte: since } },
        select: { createdAt: true, status: true, total: true },
        orderBy: { createdAt: 'asc' },
      });

      // Group by date
      const trendMap = {};
      orders.forEach(order => {
        const date = order.createdAt.toISOString().slice(0, 10);
        if (!trendMap[date]) trendMap[date] = { total: 0, completed: 0, cancelled: 0, revenue: 0 };
        trendMap[date].total++;
        if (order.status === 'completed') trendMap[date].completed++;
        if (order.status === 'cancelled') trendMap[date].cancelled++;
        trendMap[date].revenue += order.total;
      });

      const trends = Object.entries(trendMap).map(([date, data]) => ({ date, ...data }));

      res.json({ trends });
    } catch (error) {
      next(error);
    }
  },

  // AI-powered insights (using Gemini API)
  async getAIInsights(req, res, next) {
    try {
      const prisma = req.app.get('prisma');

      // Gather data for analysis
      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);

      const [recentOrders, topItems, inventoryAlerts, salesData] = await Promise.all([
        prisma.order.findMany({ where: { createdAt: { gte: thirtyDaysAgo } }, include: { items: { include: { menuItem: true } } } }),
        analyticsController.getTopItemsData(prisma, 5, 30),
        prisma.inventoryItem.findMany({ where: { isActive: true, quantity: { lte: 5 } } }),
        prisma.sale.aggregate({ where: { saleDate: { gte: thirtyDaysAgo } }, _sum: { amount: true }, _count: { id: true } }),
      ]);

      // If Gemini API key is not configured, return basic insights
      if (!process.env.GEMINI_API_KEY) {
        return res.json({
          insights: [
            {
              type: 'info',
              title: 'AI Insights Available',
              message: 'Configure GEMINI_API_KEY to enable AI-powered business insights and recommendations.',
            },
          ],
          isAIPowered: false,
        });
      }

      // Use Gemini for analysis
      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `You are a restaurant analytics expert. Analyze this data and provide 3-5 actionable insights:

- Total orders (30 days): ${recentOrders.length}
- Total revenue: $${salesData._sum.amount?.toFixed(2) || 0}
- Top items: ${topItems.map(i => `${i.name} (${i.quantity} sold)`).join(', ')}
- Low stock items: ${inventoryAlerts.map(i => i.name).join(', ') || 'None'}
- Order status breakdown: ${Object.entries(
          recentOrders.reduce((acc, o) => { acc[o.status] = (acc[o.status] || 0) + 1; return acc; }, {})
        ).map(([k, v]) => `${k}: ${v}`).join(', ')}

Return as JSON array: [{ "type": "positive|negative|action|trend", "title": "short title", "message": "detailed insight", "metric": { "label": "metric name", "value": "value" } }]`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const insights = JSON.parse(cleaned);

        res.json({ insights, isAIPowered: true });
      } catch (aiError) {
        console.error('Gemini API error:', aiError);
        res.json({
          insights: [
            { type: 'info', title: 'AI Analysis Unavailable', message: 'Could not generate AI insights at this time.' },
          ],
          isAIPowered: false,
          error: aiError.message,
        });
      }
    } catch (error) {
      next(error);
    }
  },

  // Helper: get top items data
  async getTopItemsData(prisma, limit = 10, days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const orderItems = await prisma.orderItem.findMany({
      where: { order: { createdAt: { gte: since }, status: { not: 'cancelled' } } },
      include: { menuItem: true },
    });

    const itemMap = {};
    orderItems.forEach(item => {
      const id = item.menuItemId;
      if (!itemMap[id]) {
        itemMap[id] = { id, name: item.menuItem.name, quantity: 0, revenue: 0 };
      }
      itemMap[id].quantity += item.quantity;
      itemMap[id].revenue += item.subtotal;
    });

    return Object.values(itemMap).sort((a, b) => b.quantity - a.quantity).slice(0, limit);
  },
};

module.exports = analyticsController;
