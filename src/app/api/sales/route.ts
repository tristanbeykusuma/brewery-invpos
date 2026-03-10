import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Generate a unique transaction number
function generateTransactionNumber(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const timeStr = date.toTimeString().slice(0, 8).replace(/:/g, '');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `TXN-${dateStr}-${timeStr}-${random}`;
}

// GET - Fetch sales history
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const transactionId = searchParams.get('transactionId');
    const date = searchParams.get('date');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (transactionId) {
      // Fetch specific transaction
      const sale = await db.sale.findFirst({
        where: { transactionId },
        include: {
          transaction: true,
          saleItems: {
            include: {
              product: {
                include: { category: true },
              },
            },
          },
        },
      });

      if (!sale) {
        return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
      }

      return NextResponse.json(sale);
    }

    // Build date filter
    let dateFilter: Record<string, Date> = {};
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      dateFilter = {
        createdAt: {
          gte: start,
          lte: end,
        } as unknown as Date,
      };
    } else if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        } as unknown as Date,
      };
    }

    const sales = await db.sale.findMany({
      where: dateFilter,
      include: {
        transaction: true,
        saleItems: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(sales);
  } catch (error) {
    console.error('Error fetching sales:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sales' },
      { status: 500 }
    );
  }
}

// POST - Create a new sale
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, paymentMethod, cashierName, tableNumber } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No items in sale' }, { status: 400 });
    }

    // Validate inventory for all items
    for (const item of items) {
      const inventory = await db.inventory.findUnique({
        where: { productId: item.productId },
      });

      if (!inventory) {
        return NextResponse.json(
          { error: `Inventory not found for product ${item.productId}` },
          { status: 400 }
        );
      }

      if (inventory.quantity < item.quantity) {
        const product = await db.product.findUnique({
          where: { id: item.productId },
        });
        return NextResponse.json(
          { error: `Insufficient stock for ${product?.name}. Available: ${inventory.quantity}` },
          { status: 400 }
        );
      }
    }

    // Calculate total
    let totalAmount = 0;
    const saleItems: Array<{
      productId: string;
      quantity: number;
      unitPrice: number;
      subtotal: number;
    }> = [];

    for (const item of items) {
      const product = await db.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        return NextResponse.json(
          { error: `Product not found: ${item.productId}` },
          { status: 400 }
        );
      }

      const subtotal = product.price * item.quantity;
      totalAmount += subtotal;

      saleItems.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: product.price,
        subtotal,
      });
    }

    // Create transaction, sale, and update inventory in a transaction
    const result = await db.$transaction(async (tx) => {
      // Create transaction
      const transaction = await tx.transaction.create({
        data: {
          transactionNumber: generateTransactionNumber(),
          status: 'completed',
          tableNumber: tableNumber || null,
        },
      });

      // Create sale
      const sale = await tx.sale.create({
        data: {
          transactionId: transaction.id,
          totalAmount,
          paymentMethod,
          cashierName,
          saleItems: {
            create: saleItems,
          },
        },
        include: {
          transaction: true,
          saleItems: {
            include: {
              product: {
                include: { category: true },
              },
            },
          },
        },
      });

      // Update inventory for each item
      for (const item of items) {
        await tx.inventory.update({
          where: { productId: item.productId },
          data: {
            quantity: {
              decrement: item.quantity,
            },
          },
        });
      }

      return sale;
    }, {
      maxWait: 10000,
      timeout: 10000,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error creating sale:', error);
    return NextResponse.json(
      { error: 'Failed to create sale' },
      { status: 500 }
    );
  }
}
