const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data
  await prisma.activityLog.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.staff.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.menuCategory.deleteMany();
  await prisma.table.deleteMany();
  await prisma.user.deleteMany();

  // 1. Create Users
  const hashedPassword = await bcrypt.hash('password123', 12);

  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@restaurant.com',
      password: hashedPassword,
      role: 'admin',
      phone: '+1-555-0100',
    },
  });

  const manager = await prisma.user.create({
    data: {
      name: 'Sarah Manager',
      email: 'sarah@restaurant.com',
      password: hashedPassword,
      role: 'manager',
      phone: '+1-555-0101',
    },
  });

  const staff1 = await prisma.user.create({
    data: {
      name: 'John Waiter',
      email: 'john@restaurant.com',
      password: hashedPassword,
      role: 'staff',
      phone: '+1-555-0102',
    },
  });

  console.log('✅ Users created');

  // 2. Create Tables
  const tableData = [
    { number: 1, capacity: 2, location: 'window' },
    { number: 2, capacity: 2, location: 'window' },
    { number: 3, capacity: 4, location: 'indoor' },
    { number: 4, capacity: 4, location: 'indoor' },
    { number: 5, capacity: 6, location: 'indoor' },
    { number: 6, capacity: 4, location: 'outdoor' },
    { number: 7, capacity: 4, location: 'outdoor' },
    { number: 8, capacity: 8, location: 'indoor' },
    { number: 9, capacity: 2, location: 'bar' },
    { number: 10, capacity: 6, location: 'window' },
  ];

  for (const t of tableData) {
    await prisma.table.create({ data: t });
  }
  console.log('✅ Tables created');

  // 3. Create Menu Categories
  const categories = await Promise.all([
    prisma.menuCategory.create({ data: { name: 'Appetizers', description: 'Starters and small plates', sortOrder: 1 } }),
    prisma.menuCategory.create({ data: { name: 'Main Course', description: 'Signature entrees', sortOrder: 2 } }),
    prisma.menuCategory.create({ data: { name: 'Pasta', description: 'Handmade pasta dishes', sortOrder: 3 } }),
    prisma.menuCategory.create({ data: { name: 'Pizza', description: 'Wood-fired pizzas', sortOrder: 4 } }),
    prisma.menuCategory.create({ data: { name: 'Salads', description: 'Fresh garden salads', sortOrder: 5 } }),
    prisma.menuCategory.create({ data: { name: 'Beverages', description: 'Drinks and refreshments', sortOrder: 6 } }),
    prisma.menuCategory.create({ data: { name: 'Desserts', description: 'Sweet treats', sortOrder: 7 } }),
  ]);
  console.log('✅ Menu categories created');

  // 4. Create Menu Items
  const menuItems = await Promise.all([
    // Appetizers
    prisma.menuItem.create({ data: { name: 'Bruschetta', description: 'Toasted bread with tomatoes, basil, and olive oil', price: 8.99, cost: 3.50, categoryId: categories[0].id, prepTime: 10, isPopular: true } }),
    prisma.menuItem.create({ data: { name: 'Calamari', description: 'Crispy fried squid with marinara sauce', price: 12.99, cost: 5.00, categoryId: categories[0].id, prepTime: 12, isPopular: true } }),
    prisma.menuItem.create({ data: { name: 'Garlic Bread', description: 'Oven-baked bread with garlic butter', price: 5.99, cost: 2.00, categoryId: categories[0].id, prepTime: 8 } }),
    prisma.menuItem.create({ data: { name: 'Soup of the Day', description: 'Chef\'s daily soup creation', price: 7.99, cost: 2.50, categoryId: categories[0].id, prepTime: 5 } }),
    // Main Course
    prisma.menuItem.create({ data: { name: 'Grilled Salmon', description: 'Atlantic salmon with lemon butter sauce', price: 24.99, cost: 10.00, categoryId: categories[1].id, prepTime: 20, isPopular: true } }),
    prisma.menuItem.create({ data: { name: 'Steak Frites', description: '8oz ribeye with herb butter and fries', price: 32.99, cost: 14.00, categoryId: categories[1].id, prepTime: 25 } }),
    prisma.menuItem.create({ data: { name: 'Chicken Parmesan', description: 'Breaded chicken with mozzarella and marinara', price: 18.99, cost: 7.00, categoryId: categories[1].id, prepTime: 22, isPopular: true } }),
    prisma.menuItem.create({ data: { name: 'Vegetable Stir-fry', description: 'Fresh seasonal vegetables in soy glaze', price: 15.99, cost: 5.00, categoryId: categories[1].id, prepTime: 15 } }),
    // Pasta
    prisma.menuItem.create({ data: { name: 'Spaghetti Carbonara', description: 'Classic with pancetta and parmesan', price: 16.99, cost: 6.00, categoryId: categories[2].id, prepTime: 18, isPopular: true } }),
    prisma.menuItem.create({ data: { name: 'Fettuccine Alfredo', description: 'Creamy parmesan sauce', price: 15.99, cost: 5.50, categoryId: categories[2].id, prepTime: 15 } }),
    prisma.menuItem.create({ data: { name: 'Penne Arrabbiata', description: 'Spicy tomato sauce with chili', price: 14.99, cost: 4.50, categoryId: categories[2].id, prepTime: 15 } }),
    // Pizza
    prisma.menuItem.create({ data: { name: 'Margherita Pizza', description: 'San Marzano tomatoes, mozzarella, basil', price: 13.99, cost: 5.00, categoryId: categories[3].id, prepTime: 20 } }),
    prisma.menuItem.create({ data: { name: 'Pepperoni Pizza', description: 'Classic pepperoni with mozzarella', price: 15.99, cost: 6.00, categoryId: categories[3].id, prepTime: 20, isPopular: true } }),
    prisma.menuItem.create({ data: { name: 'Vegetarian Pizza', description: 'Seasonal vegetables and goat cheese', price: 16.99, cost: 6.50, categoryId: categories[3].id, prepTime: 20 } }),
    // Salads
    prisma.menuItem.create({ data: { name: 'Caesar Salad', description: 'Romaine, croutons, parmesan, house dressing', price: 11.99, cost: 4.00, categoryId: categories[4].id, prepTime: 10, isPopular: true } }),
    prisma.menuItem.create({ data: { name: 'Greek Salad', description: 'Feta, olives, cucumber, tomato, oregano', price: 12.99, cost: 4.50, categoryId: categories[4].id, prepTime: 10 } }),
    // Beverages
    prisma.menuItem.create({ data: { name: 'Soft Drink', description: 'Choice of Coke, Sprite, or Fanta', price: 2.99, cost: 0.80, categoryId: categories[5].id, prepTime: 2 } }),
    prisma.menuItem.create({ data: { name: 'Fresh Lemonade', description: 'House-made with fresh lemons', price: 4.99, cost: 1.50, categoryId: categories[5].id, prepTime: 5 } }),
    prisma.menuItem.create({ data: { name: 'Coffee', description: 'Freshly brewed premium coffee', price: 3.99, cost: 1.00, categoryId: categories[5].id, prepTime: 5 } }),
    // Desserts
    prisma.menuItem.create({ data: { name: 'Tiramisu', description: 'Classic Italian coffee dessert', price: 8.99, cost: 3.00, categoryId: categories[6].id, prepTime: 5, isPopular: true } }),
    prisma.menuItem.create({ data: { name: 'Panna Cotta', description: 'Vanilla panna cotta with berry compote', price: 7.99, cost: 2.50, categoryId: categories[6].id, prepTime: 5 } }),
  ]);
  console.log('✅ Menu items created');

  // 5. Create Staff
  await Promise.all([
    prisma.staff.create({ data: { name: 'John Waiter', email: 'john@restaurant.com', phone: '+1-555-0102', role: 'waiter', shift: 'morning', salary: 32000, joinDate: new Date('2024-01-15'), userId: staff1.id } }),
    prisma.staff.create({ data: { name: 'Maria Chef', email: 'maria@restaurant.com', phone: '+1-555-0103', role: 'chef', shift: 'evening', salary: 48000, joinDate: new Date('2023-06-01') } }),
    prisma.staff.create({ data: { name: 'David Host', email: 'david@restaurant.com', phone: '+1-555-0104', role: 'host', shift: 'morning', salary: 28000, joinDate: new Date('2024-03-10') } }),
    prisma.staff.create({ data: { name: 'Lisa Bartender', email: 'lisa@restaurant.com', phone: '+1-555-0105', role: 'bartender', shift: 'evening', salary: 35000, joinDate: new Date('2023-09-20') } }),
    prisma.staff.create({ data: { name: 'Mike Cleaner', email: 'mike@restaurant.com', phone: '+1-555-0106', role: 'cleaner', shift: 'morning', salary: 24000, joinDate: new Date('2024-02-01') } }),
  ]);
  console.log('✅ Staff created');

  // 6. Create Inventory Items
  await Promise.all([
    prisma.inventoryItem.create({ data: { name: 'Tomatoes', sku: 'PRO-001', category: 'produce', quantity: 25, unit: 'kg', minStock: 10, maxStock: 50, costPerUnit: 3.00, supplier: 'Fresh Foods Co.' } }),
    prisma.inventoryItem.create({ data: { name: 'Chicken Breast', sku: 'MEA-001', category: 'meat', quantity: 15, unit: 'kg', minStock: 10, maxStock: 30, costPerUnit: 8.50, supplier: 'Quality Meats Ltd' } }),
    prisma.inventoryItem.create({ data: { name: 'Salmon Fillet', sku: 'MEA-002', category: 'meat', quantity: 8, unit: 'kg', minStock: 5, maxStock: 15, costPerUnit: 15.00, supplier: 'Ocean Fresh' } }),
    prisma.inventoryItem.create({ data: { name: 'Mozzarella Cheese', sku: 'DAI-001', category: 'dairy', quantity: 12, unit: 'kg', minStock: 5, maxStock: 20, costPerUnit: 8.00, supplier: 'Dairy Farm Inc' } }),
    prisma.inventoryItem.create({ data: { name: 'Pasta (Dry)', sku: 'DRY-001', category: 'dry-goods', quantity: 30, unit: 'kg', minStock: 10, maxStock: 50, costPerUnit: 2.50, supplier: 'Italian Imports' } }),
    prisma.inventoryItem.create({ data: { name: 'Olive Oil', sku: 'DRY-002', category: 'dry-goods', quantity: 20, unit: 'l', minStock: 5, maxStock: 30, costPerUnit: 12.00, supplier: 'Italian Imports' } }),
    prisma.inventoryItem.create({ data: { name: 'Coffee Beans', sku: 'BEV-001', category: 'beverages', quantity: 5, unit: 'kg', minStock: 3, maxStock: 10, costPerUnit: 20.00, supplier: 'Bean Roasters' } }),
    prisma.inventoryItem.create({ data: { name: 'Lettuce', sku: 'PRO-002', category: 'produce', quantity: 3, unit: 'kg', minStock: 5, maxStock: 15, costPerUnit: 2.00, supplier: 'Fresh Foods Co.' } }), // Low stock
    prisma.inventoryItem.create({ data: { name: 'Cleaning Solution', sku: 'CLN-001', category: 'cleaning', quantity: 8, unit: 'l', minStock: 3, maxStock: 15, costPerUnit: 5.00, supplier: 'Clean Supply Co.' } }),
    prisma.inventoryItem.create({ data: { name: 'Napkins', sku: 'DRY-003', category: 'dry-goods', quantity: 500, unit: 'pcs', minStock: 100, maxStock: 1000, costPerUnit: 0.10, supplier: 'Restaurant Supply' } }),
  ]);
  console.log('✅ Inventory created');

  // 7. Create Customers
  const customers = await Promise.all([
    prisma.customer.create({ data: { name: 'Alice Johnson', email: 'alice@email.com', phone: '+1-555-1001', totalVisits: 15, totalSpent: 450.50, lastVisit: new Date('2026-07-25'), isVip: true } }),
    prisma.customer.create({ data: { name: 'Bob Smith', email: 'bob@email.com', phone: '+1-555-1002', totalVisits: 8, totalSpent: 210.00, lastVisit: new Date('2026-07-20') } }),
    prisma.customer.create({ data: { name: 'Carol Davis', email: 'carol@email.com', phone: '+1-555-1003', totalVisits: 22, totalSpent: 890.75, lastVisit: new Date('2026-07-26'), isVip: true } }),
    prisma.customer.create({ data: { name: 'Dan Wilson', email: 'dan@email.com', phone: '+1-555-1004', totalVisits: 3, totalSpent: 85.00, lastVisit: new Date('2026-07-15') } }),
    prisma.customer.create({ data: { name: 'Eve Brown', email: 'eve@email.com', phone: '+1-555-1005', totalVisits: 12, totalSpent: 340.00, lastVisit: new Date('2026-07-22') } }),
  ]);
  console.log('✅ Customers created');

  // 8. Create Orders with items and sales
  const orderStatuses = ['completed', 'completed', 'completed', 'completed', 'completed', 'preparing', 'pending', 'ready'];
  const paymentMethods = ['cash', 'card', 'upi', 'card', 'cash', null, null, null];

  for (let i = 0; i < 8; i++) {
    const daysAgo = Math.floor(Math.random() * 7);
    const orderDate = new Date();
    orderDate.setDate(orderDate.getDate() - daysAgo);
    orderDate.setHours(11 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60));

    const orderItems = [];
    const numItems = 1 + Math.floor(Math.random() * 4);
    let subtotal = 0;

    for (let j = 0; j < numItems; j++) {
      const menuItem = menuItems[Math.floor(Math.random() * menuItems.length)];
      const qty = 1 + Math.floor(Math.random() * 2);
      const itemSubtotal = menuItem.price * qty;
      subtotal += itemSubtotal;
      orderItems.push({
        menuItemId: menuItem.id,
        quantity: qty,
        unitPrice: menuItem.price,
        subtotal: itemSubtotal,
      });
    }

    const tax = subtotal * 0.05;
    const serviceCharge = subtotal * 0.10;
    const total = subtotal + tax + serviceCharge;

    const order = await prisma.order.create({
      data: {
        tableId: tableData[i % 10].number.toString() ? (await prisma.table.findUnique({ where: { number: tableData[i % 10].number } }))?.id : null,
        customerId: customers[i % customers.length].id,
        userId: i % 2 === 0 ? admin.id : staff1.id,
        status: orderStatuses[i],
        type: i < 6 ? 'dine-in' : 'takeaway',
        subtotal,
        tax,
        serviceCharge,
        total,
        paymentMethod: paymentMethods[i],
        paymentStatus: paymentMethods[i] ? 'paid' : 'unpaid',
        createdAt: orderDate,
        items: { create: orderItems },
      },
    });

    if (paymentMethods[i]) {
      await prisma.sale.create({
        data: {
          orderId: order.id,
          userId: i % 2 === 0 ? admin.id : staff1.id,
          amount: total,
          paymentMethod: paymentMethods[i],
          status: 'completed',
          saleDate: orderDate,
        },
      });
    }
  }
  console.log('✅ Orders and sales created');

  console.log('\n🎉 Seeding complete!');
  console.log('📋 Login credentials:');
  console.log('   Admin: admin@restaurant.com / password123');
  console.log('   Manager: sarah@restaurant.com / password123');
  console.log('   Staff: john@restaurant.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
