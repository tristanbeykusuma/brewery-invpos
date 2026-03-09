import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Sample product images (using placeholder images)
const productImages = [
  'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=999&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  'https://images.unsplash.com/photo-1621179817632-673648ea757b?q=80&w=1005&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  'https://images.unsplash.com/photo-1608270586620-248524c67de9?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  'https://images.unsplash.com/photo-1566633806327-68e152aaf26d?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
];

let transactionCounter = 0;

function generateTransactionNumber(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const timeStr = date.toTimeString().slice(0, 8).replace(/:/g, '');
  transactionCounter++;
  const counterStr = transactionCounter.toString().padStart(6, '0');
  return `TXN-${dateStr}-${timeStr}-${counterStr}`;
}

export async function POST() {
    try {
      // Check if data already exists
      const existingCategories = await db.category.count();
      if (existingCategories > 0) {
        return NextResponse.json({
          message: 'Database already seeded',
          status: 'skipped',
        });
      }

      // Create Beer Bar categories (main categories only - no subcategories)
      const categories = await Promise.all([
        db.category.create({
          data: { name: 'Cocktails', description: 'Mixed drinks and cocktails' },
        }),
        db.category.create({
          data: { name: 'Wines', description: 'Red, white, and sparkling wines' },
        }),
        db.category.create({
          data: { name: 'Non-Alcoholic', description: 'Soft drinks, juices, and mocktails' },
        }),
        db.category.create({
          data: { name: 'Food', description: 'Food items and snacks' },
        }),
        db.category.create({
          data: { name: 'Beer', description: 'Various beer styles and types' },
        }),
      ]);

      // Create products with inventory (using main category IDs only)
      const products = [
        // Cocktails
        { name: 'Mojito', sku: 'CTL-001', price: 12.99, cost: 4.00, categoryId: categories[0].id, stock: 50 },
        { name: 'Old Fashioned', sku: 'CTL-002', price: 14.99, cost: 6.00, categoryId: categories[0].id, stock: 40 },
        
        // Wines
        { name: 'Cabernet Sauvignon', sku: 'WN-001', price: 45.99, cost: 20.00, categoryId: categories[1].id, stock: 30 },
        { name: 'Chardonnay', sku: 'WN-002', price: 38.99, cost: 16.00, categoryId: categories[1].id, stock: 35 },
        
        // Non-Alcoholic
        { name: 'Lemonade', sku: 'NAB-001', price: 6.99, cost: 2.50, categoryId: categories[2].id, stock: 80 },
        { name: 'Iced Tea', sku: 'NAB-002', price: 5.99, cost: 2.00, categoryId: categories[2].id, stock: 60 },
        
        // Food
        { name: 'Nachos', sku: 'FD-001', price: 9.99, cost: 4.00, categoryId: categories[3].id, stock: 45 },
        { name: 'Chicken Wings', sku: 'FD-002', price: 14.99, cost: 7.00, categoryId: categories[3].id, stock: 30 },
        { name: 'Burger', sku: 'FD-003', price: 16.99, cost: 8.00, categoryId: categories[3].id, stock: 25 },
        { name: 'Steak Frites', sku: 'FD-004', price: 24.99, cost: 12.00, categoryId: categories[3].id, stock: 20 },
        { name: 'Grilled Salmon', sku: 'FD-005', price: 28.99, cost: 15.00, categoryId: categories[3].id, stock: 15 },
        { name: 'Pasta Primavera', sku: 'FD-006', price: 22.99, cost: 10.00, categoryId: categories[3].id, stock: 18 },
        { name: 'Caesar Salad', sku: 'FD-007', price: 8.99, cost: 4.00, categoryId: categories[3].id, stock: 40 },
        { name: 'Garlic Bread', sku: 'FD-008', price: 5.99, cost: 2.50, categoryId: categories[3].id, stock: 35 },
        
        // Beer
        { name: 'Corona Extra', sku: 'BR-001', price: 8.99, cost: 4.00, categoryId: categories[4].id, stock: 60 },
        { name: 'Heineken Light', sku: 'BR-002', price: 9.99, cost: 4.50, categoryId: categories[4].id, stock: 50 },
        { name: 'Pilsner Urquell', sku: 'BR-003', price: 11.99, cost: 5.50, categoryId: categories[4].id, stock: 40 },
        { name: 'Budweiser', sku: 'BR-004', price: 10.99, cost: 5.00, categoryId: categories[4].id, stock: 55 },
        { name: 'Sierra Nevada', sku: 'BR-005', price: 12.99, cost: 6.00, categoryId: categories[4].id, stock: 45 },
        { name: 'Blue Moon', sku: 'BR-006', price: 14.99, cost: 7.00, categoryId: categories[4].id, stock: 50 },
        { name: 'Stone IPA', sku: 'BR-007', price: 14.99, cost: 7.00, categoryId: categories[4].id, stock: 35 },
        { name: 'Dogfish Head IPA', sku: 'BR-008', price: 16.99, cost: 8.00, categoryId: categories[4].id, stock: 40 },
        { name: 'Blonde de Chimay', sku: 'BR-009', price: 13.99, cost: 6.50, categoryId: categories[4].id, stock: 45 },
        { name: 'Hoegaarden', sku: 'BR-010', price: 15.99, cost: 7.50, categoryId: categories[4].id, stock: 40 },
        { name: 'Guinness Draught', sku: 'BR-011', price: 13.99, cost: 6.00, categoryId: categories[4].id, stock: 50 },
        { name: 'Oatmeal Stout', sku: 'BR-012', price: 14.99, cost: 7.00, categoryId: categories[4].id, stock: 35 },
        { name: 'Hoegaarden White', sku: 'BR-013', price: 11.99, cost: 5.50, categoryId: categories[4].id, stock: 40 },
        { name: 'Paulaner Hefe-Weizen', sku: 'BR-014', price: 12.99, cost: 6.00, categoryId: categories[4].id, stock: 45 },
        { name: 'Founders Porter', sku: 'BR-015', price: 14.99, cost: 7.00, categoryId: categories[4].id, stock: 30 },
        { name: 'Fullers Porter', sku: 'BR-016', price: 15.99, cost: 8.00, categoryId: categories[4].id, stock: 25 },
      ];
      
      for (let i = 0; i < products.length; i++) {
        const p = products[i];
        const product = await db.product.create({
          data: {
            name: p.name,
            sku: p.sku,
            price: p.price,
            cost: p.cost,
            categoryId: p.categoryId,
            imageUrl: productImages[i % productImages.length],
          },
        });

        await db.inventory.create({
          data: {
            productId: product.id,
            quantity: p.stock,
            lowStockThreshold: 10,
          },
        });
      }

    // Create sample transactions for the last 7 days
    const paymentMethods = ['cash', 'card', 'digital'];
    const cashierNames = ['John Smith', 'Jane Doe', 'Mike Johnson', 'Sarah Wilson'];
    const allProducts = await db.product.findMany({
      include: { inventory: true },
    });

    for (let day = 0; day < 7; day++) {
      const transactionsPerDay = Math.floor(Math.random() * 8) + 5; // 5-12 transactions per day

      for (let t = 0; t < transactionsPerDay; t++) {
        const transactionDate = new Date();
        transactionDate.setDate(transactionDate.getDate() - day);
        transactionDate.setHours(
          Math.floor(Math.random() * 12) + 9, // 9 AM - 9 PM
          Math.floor(Math.random() * 60),
          Math.floor(Math.random() * 60)
        );

        // Select random products for this transaction
        const numItems = Math.floor(Math.random() * 4) + 1; // 1-4 items
        const selectedProducts = [...allProducts]
          .sort(() => Math.random() - 0.5)
          .slice(0, numItems);

        const saleItems = selectedProducts.map((product) => ({
          productId: product.id,
          quantity: Math.floor(Math.random() * 3) + 1,
          unitPrice: product.price,
          subtotal: 0,
        }));

        // Calculate subtotals
        let totalAmount = 0;
        saleItems.forEach((item) => {
          item.subtotal = item.unitPrice * item.quantity;
          totalAmount += item.subtotal;
        });

        // Create transaction first
        const transaction = await db.transaction.create({
          data: {
            transactionNumber: generateTransactionNumber(),
            status: 'completed',
            createdAt: transactionDate,
          },
        });

        // Then create sale with items
        await db.sale.create({
          data: {
            transactionId: transaction.id,
            totalAmount,
            paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
            cashierName: cashierNames[Math.floor(Math.random() * cashierNames.length)],
            createdAt: transactionDate,
            saleItems: {
              create: saleItems,
            },
          },
        });
      }
    }

    return NextResponse.json({
      message: 'Database seeded successfully',
      status: 'completed',
      data: {
        categories: categories.length,
        products: products.length,
      },
    });
  } catch (error) {
    console.error('Error seeding database:', error);
    return NextResponse.json(
      { error: 'Failed to seed database' },
      { status: 500 }
    );
  }
}
