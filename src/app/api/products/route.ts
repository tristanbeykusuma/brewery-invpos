import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Fetch all products with optional filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const lowStock = searchParams.get('lowStock');

    const where: Record<string, unknown> = {};

    if (category) {
      where.categoryId = category;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }

    const products = await db.product.findMany({
      where,
      include: {
        category: true,
        inventory: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Filter by low stock if requested
    let filteredProducts = products;
    if (lowStock === 'true') {
      filteredProducts = products.filter(
        (p) => p.inventory && p.inventory.quantity <= p.inventory.lowStockThreshold
      );
    }

    return NextResponse.json(filteredProducts);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// POST - Create a new product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, sku, description, price, cost, categoryId, imageUrl, initialStock, lowStockThreshold } = body;

    // Check if SKU already exists
    const existingProduct = await db.product.findUnique({
      where: { sku },
    });

    if (existingProduct) {
      return NextResponse.json(
        { error: 'Product with this SKU already exists' },
        { status: 400 }
      );
    }

    // Create product and inventory in a transaction
    const product = await db.$transaction(async (tx) => {
      const newProduct = await tx.product.create({
        data: {
          name,
          sku,
          description,
          price: parseFloat(price),
          cost: parseFloat(cost),
          categoryId,
          imageUrl,
        },
        include: {
          category: true,
        },
      });

      // Create inventory record
      await tx.inventory.create({
        data: {
          productId: newProduct.id,
          quantity: parseInt(initialStock) || 0,
          lowStockThreshold: parseInt(lowStockThreshold) || 10,
        },
      });

      return newProduct;
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}

// PUT - Update a product
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, sku, description, price, cost, categoryId, imageUrl } = body;

    // Check if product exists
    const existingProduct = await db.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Check if new SKU is already used by another product
    if (sku !== existingProduct.sku) {
      const skuExists = await db.product.findUnique({
        where: { sku },
      });
      if (skuExists) {
        return NextResponse.json(
          { error: 'Product with this SKU already exists' },
          { status: 400 }
        );
      }
    }

    const product = await db.product.update({
      where: { id },
      data: {
        name,
        sku,
        description,
        price: parseFloat(price),
        cost: parseFloat(cost),
        categoryId,
        imageUrl,
      },
      include: {
        category: true,
        inventory: true,
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a product
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    // Check if product has been sold
    const saleItems = await db.saleItem.findFirst({
      where: { productId: id },
    });

    if (saleItems) {
      return NextResponse.json(
        { error: 'Cannot delete product with sales history' },
        { status: 400 }
      );
    }

    // Delete inventory and product
    await db.$transaction([
      db.inventory.deleteMany({
        where: { productId: id },
      }),
      db.product.delete({
        where: { id },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}
