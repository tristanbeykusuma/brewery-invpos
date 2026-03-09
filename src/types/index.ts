export interface Category {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  price: number;
  cost: number;
  categoryId: string;
  category?: Category;
  imageUrl: string | null;
  inventory?: Inventory;
  createdAt: Date;
  updatedAt: Date;
}

export interface Inventory {
  id: string;
  productId: string;
  quantity: number;
  lowStockThreshold: number;
  lastRestocked: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  transactionNumber: string;
  tableNumber?: string; // For Beer Bar table number assignment
  status: string;
  sales: Sale[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Sale {
  id: string;
  transactionId: string;
  transaction?: Transaction;
  totalAmount: number;
  paymentMethod: string;
  cashierName: string;
  saleItems: SaleItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  product?: Product;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface ProductWithInventory extends Omit<Product, 'inventory' | 'category'> {
  inventory: Inventory | null;
  category: Category | null;
}

export interface DashboardStats {
  todaySales: number;
  todayTransactions: number;
  weekSales: number;
  weekTransactions: number;
  topProducts: TopProduct[];
  lowStockProducts: ProductWithInventory[];
  recentTransactions: SaleWithDetails[];
  salesChart: SalesChartData[];
}

export interface TopProduct {
  productId: string;
  productName: string;
  totalQuantity: number;
  totalRevenue: number;
}

export interface SalesChartData {
  date: string;
  totalSales: number;
  transactionCount: number;
}

export interface SaleWithDetails extends Omit<Sale, 'transaction'> {
  transaction: Transaction;
  saleItems: (SaleItem & {
    product: Product;
  })[];
}

export type PaymentMethod = 'cash' | 'card' | 'digital';

export interface CreateSaleRequest {
  items: {
    productId: string;
    quantity: number;
  }[];
  paymentMethod: PaymentMethod;
  cashierName: string;
}

export interface ProductFormData {
  name: string;
  sku: string;
  description: string;
  price: number;
  cost: number;
  categoryId: string;
  imageUrl: string;
}

export interface InventoryAdjustment {
  productId: string;
  adjustment: number;
  type: 'add' | 'remove' | 'set';
}
