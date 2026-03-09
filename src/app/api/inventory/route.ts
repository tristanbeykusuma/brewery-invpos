import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Fetch inventory data
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const lowStock = searchParams.get('lowStock');

    const inventory = await db.inventory.findMany({
      include: {
        product: {
          include: {
            category: true,
          },
        },
      },
      orderBy: {
        product: {
          name: 'asc',
        },
      },
    });

    // Filter by low stock if requested
    let filteredInventory = inventory;
    if (lowStock === 'true') {
      filteredInventory = inventory.filter(
        (item) => item.quantity <= item.lowStockThreshold
      );
    }

    // Transform to include calculated fields
    const result = filteredInventory.map((item) => ({
      ...item,
      isLowStock: item.quantity <= item.lowStockThreshold,
      stockValue: item.quantity * item.product.cost,
      retailValue: item.quantity * item.product.price,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory' },
      { status: 500 }
    );
  }
}

// PUT - Adjust inventory
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, adjustment, type, lowStockThreshold } = body;

    // Check if inventory exists
    const existingInventory = await db.inventory.findUnique({
      where: { productId },
    });

    if (!existingInventory) {
      return NextResponse.json({ error: 'Inventory not found' }, { status: 404 });
    }

    let newQuantity = existingInventory.quantity;

    switch (type) {
      case 'add':
        newQuantity = existingInventory.quantity + parseInt(adjustment);
        break;
      case 'remove':
        newQuantity = Math.max(0, existingInventory.quantity - parseInt(adjustment));
        break;
      case 'set':
        newQuantity = parseInt(adjustment);
        break;
    }

    const inventory = await db.inventory.update({
      where: { productId },
      data: {
        quantity: newQuantity,
        lowStockThreshold: lowStockThreshold ?? existingInventory.lowStockThreshold,
        lastRestocked: new Date(),
      },
      include: {
        product: {
          include: {
            category: true,
          },
        },
      },
    });

    return NextResponse.json(inventory);
  } catch (error) {
    console.error('Error adjusting inventory:', error);
    return NextResponse.json(
      { error: 'Failed to adjust inventory' },
      { status: 500 }
    );
  }
}

// POST - Create inventory for a product (if not exists)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, quantity, lowStockThreshold } = body;

    // Check if inventory already exists
    const existingInventory = await db.inventory.findUnique({
      where: { productId },
    });

    if (existingInventory) {
      return NextResponse.json(
        { error: 'Inventory already exists for this product' },
        { status: 400 }
      );
    }

    const inventory = await db.inventory.create({
      data: {
        productId,
        quantity: parseInt(quantity) || 0,
        lowStockThreshold: parseInt(lowStockThreshold) || 10,
      },
      include: {
        product: true,
      },
    });

    return NextResponse.json(inventory, { status: 201 });
  } catch (error) {
    console.error('Error creating inventory:', error);
    return NextResponse.json(
      { error: 'Failed to create inventory' },
      { status: 500 }
    );
  }
}
