import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    // Today's sales
    const todaySales = await db.sale.aggregate({
      where: {
        createdAt: {
          gte: today,
        },
      },
      _sum: {
        totalAmount: true,
      },
      _count: true,
    });

    // Week sales
    const weekSales = await db.sale.aggregate({
      where: {
        createdAt: {
          gte: weekAgo,
        },
      },
      _sum: {
        totalAmount: true,
      },
      _count: true,
    });

    // Sales chart data (last 7 days)
    const salesChartData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const daySales = await db.sale.aggregate({
        where: {
          createdAt: {
            gte: date,
            lt: nextDate,
          },
        },
        _sum: {
          totalAmount: true,
        },
        _count: true,
      });

      salesChartData.push({
        date: date.toISOString().slice(0, 10),
        totalSales: daySales._sum.totalAmount || 0,
        transactionCount: daySales._count,
      });
    }

    // Top selling products (last 30 days)
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const topProducts = await db.saleItem.groupBy({
      by: ['productId'],
      where: {
        sale: {
          createdAt: {
            gte: thirtyDaysAgo,
          },
        },
      },
      _sum: {
        quantity: true,
        subtotal: true,
      },
      orderBy: {
        _sum: {
          subtotal: 'desc',
        },
      },
      take: 5,
    });

    // Get product details for top products
    const topProductsWithDetails = await Promise.all(
      topProducts.map(async (item) => {
        const product = await db.product.findUnique({
          where: { id: item.productId },
        });
        return {
          productId: item.productId,
          productName: product?.name || 'Unknown',
          totalQuantity: item._sum.quantity || 0,
          totalRevenue: item._sum.subtotal || 0,
        };
      })
    );

    // Low stock products
    const lowStockProducts = await db.product.findMany({
      include: {
        category: true,
        inventory: true,
      },
    });

    const lowStockFiltered = lowStockProducts.filter(
      (p) => p.inventory && p.inventory.quantity <= p.inventory.lowStockThreshold
    );

    // Recent transactions
    const recentTransactions = await db.sale.findMany({
      take: 10,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        transaction: true,
        saleItems: {
          include: {
            product: true,
          },
        },
      },
    });

    return NextResponse.json({
      todaySales: todaySales._sum.totalAmount || 0,
      todayTransactions: todaySales._count,
      weekSales: weekSales._sum.totalAmount || 0,
      weekTransactions: weekSales._count,
      topProducts: topProductsWithDetails,
      lowStockProducts: lowStockFiltered,
      recentTransactions,
      salesChart: salesChartData,
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
