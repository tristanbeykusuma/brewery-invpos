'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  Smartphone,
  Printer,
  Package,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Product, Category, CartItem, PaymentMethod } from '@/types';
import { useCurrency } from '@/contexts/currency-context';

interface POSTerminalProps {
  products: Product[];
  categories: Category[];
  onSaleComplete: () => void;
}

export function POSTerminal({ products, categories, onSaleComplete }: POSTerminalProps) {
  const { formatCurrency } = useCurrency();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [tableNumber, setTableNumber] = useState('');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [cashierName, setCashierName] = useState('Admin');
  const [isProcessing, setIsProcessing] = useState(false);
  const [receiptData, setReceiptData] = useState<SaleWithTransaction | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  interface SaleWithTransaction {
    id: string;
    transactionId: string;
    transaction: {
      transactionNumber: string;
      createdAt: Date | string;
      tableNumber?: string | null;
    };
    totalAmount: number;
    paymentMethod: string;
    cashierName: string;
    saleItems: {
      product: {
        name: string;
      };
      quantity: number;
      unitPrice: number;
      subtotal: number;
    }[];
    createdAt: Date | string;
  }

  // Filter products based on search and category
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Handle category filtering
      const matchesCategory = selectedCategory === 'all' || 
        product.categoryId === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory, categories]);

  // Calculate cart totals
  const cartTotals = useMemo(() => {
    const subtotal = cart.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    return { subtotal, itemCount };
  }, [cart]);

  // Add product to cart
  const addToCart = (product: Product) => {
    // Check inventory
    const availableStock = product.inventory?.quantity ?? 0;
    const currentInCart = cart.find((item) => item.product.id === product.id)?.quantity ?? 0;

    if (currentInCart >= availableStock) {
      toast.error('Insufficient stock', {
        description: `Only ${availableStock} units available`,
      });
      return;
    }

    setCart((prev) => {
      const existingItem = prev.find((item) => item.product.id === product.id);
      if (existingItem) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    toast.success('Added to cart', { description: product.name });
  };

  // Update cart item quantity
  const updateQuantity = (productId: string, delta: number) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    const availableStock = product.inventory?.quantity ?? 0;
    const currentInCart = cart.find((item) => item.product.id === productId)?.quantity ?? 0;
    const newQuantity = currentInCart + delta;

    if (newQuantity > availableStock) {
      toast.error('Insufficient stock', {
        description: `Only ${availableStock} units available`,
      });
      return;
    }

    if (newQuantity <= 0) {
      setCart((prev) => prev.filter((item) => item.product.id !== productId));
    } else {
      setCart((prev) =>
        prev.map((item) =>
          item.product.id === productId
            ? { ...item, quantity: newQuantity }
            : item
        )
      );
    }
  };

  // Remove item from cart
  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  // Clear cart
  const clearCart = () => {
    setCart([]);
  };

  // Process checkout
  const processCheckout = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    setIsProcessing(true);

    try {
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
          })),
          paymentMethod,
          cashierName,
          tableNumber,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to process sale');
      }

      const sale = await response.json();
      setReceiptData(sale);
      setIsCheckoutOpen(false);
      setIsReceiptOpen(true);
      setCart([]);
      setTableNumber('');
      onSaleComplete();
      toast.success('Sale completed successfully');
    } catch (error) {
      toast.error('Failed to process sale', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Print receipt
  const printReceipt = () => {
    if (!receiptData) return;
    window.print();
  };

  return (
    <div className="flex flex-col md:flex-row h-full gap-4">
      {/* Product Grid */}
      <div className="flex-1 flex flex-col min-w-0 md:w-1/2">
        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products by name or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Table #"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              className="w-full sm:w-32 text-center font-mono"
            />
          </div>
        </div>

        {/* Products Grid */}
        <ScrollArea className="flex-1">
          <div className="px-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filteredProducts.map((product) => {
              const stock = product.inventory?.quantity ?? 0;
              const isLowStock = stock <= (product.inventory?.lowStockThreshold ?? 10);
              const isOutOfStock = stock === 0;

              return (
                <Card
                  key={product.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    isOutOfStock
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:border-primary'
                  }`}
                  onClick={() => !isOutOfStock && addToCart(product)}
                >
                  <CardContent className="p-3">
                    <div className="aspect-square bg-muted rounded-md mb-2 overflow-hidden relative">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                      {isOutOfStock && (
                        <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                          <Badge variant="destructive">Out of Stock</Badge>
                        </div>
                      )}
                      {!isOutOfStock && isLowStock && (
                        <Badge
                          variant="secondary"
                          className="absolute top-1 right-1 bg-amber-500 text-white"
                        >
                          Low Stock
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-medium text-sm truncate">{product.name}</h3>
                    <p className="text-xs text-muted-foreground">{product.sku}</p>
                    <div className="flex justify-between items-center mt-1">
                      <span className="font-bold text-primary">
                        {formatCurrency(product.price)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Stock: {stock}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Shopping Cart */}
      <Card className="w-full md:w-80 flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Cart
            </CardTitle>
            {cart.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearCart}>
                Clear
              </Button>
            )}
          </div>
         </CardHeader>
        <CardContent className="flex-1 flex flex-col gap-4">
          <ScrollArea className="flex-1 h-[calc(100vh-280px)]">
            <div className="px-6">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                  <ShoppingCart className="h-8 w-8 mb-2" />
                  <p className="text-sm">Cart is empty</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => {
                    const isLongName = item.product.name.length > 8 || item.product.name.includes(' ');
                    
                    return (
                      <div
                        key={item.product.id}
                        className={`flex flex-col items-start gap-2 sm:gap-3 p-2 bg-muted/50 rounded-lg overflow-hidden`}
                      >
                        <div className={`flex flex-row items-center gap-2 sm:gap-3 w-full`}>
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-muted rounded overflow-hidden flex-shrink-0">
                            {item.product.imageUrl ? (
                              <img
                                src={item.product.imageUrl}
                                alt={item.product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0 overflow-hidden">
                            <p className="text-sm font-medium truncate" title={item.product.name}>
                              {item.product.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatCurrency(item.product.price)} each
                            </p>
                          </div>
                        </div>
                        <div className={`flex flex-row items-center justify-between w-full flex-shrink-0`}>
                          <div className="flex items-center gap-1 sm:gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7 sm:h-8 sm:w-8"
                              onClick={() => updateQuantity(item.product.id, -1)}
                            >
                              <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                            <span className="w-6 sm:w-8 text-center text-sm font-medium">
                              {item.quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7 sm:h-8 sm:w-8"
                              onClick={() => updateQuantity(item.product.id, 1)}
                            >
                              <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 sm:h-8 sm:w-8 text-destructive hover:text-destructive flex-shrink-0"
                            onClick={() => removeFromCart(item.product.id)}
                          >
                            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </ScrollArea>

          <Separator />

          {/* Cart Summary */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Items</span>
              <span>{cartTotals.itemCount}</span>
            </div>
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-primary">
                {formatCurrency(cartTotals.subtotal)}
              </span>
            </div>
          </div>

          <Button
            className="w-full"
            size="lg"
            disabled={cart.length === 0}
            onClick={() => setIsCheckoutOpen(true)}
          >
            Checkout
          </Button>
        </CardContent>
      </Card>

      {/* Checkout Dialog */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Checkout</DialogTitle>
            <DialogDescription>
              Complete the sale by selecting a payment method
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Order Summary */}
            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium mb-2">Order Summary</h4>
              <ScrollArea className="max-h-32">
                {cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex justify-between text-sm py-1"
                  >
                    <span>
                      {item.quantity}x {item.product.name}
                    </span>
                    <span>{formatCurrency(item.product.price * item.quantity)}</span>
                  </div>
                ))}
              </ScrollArea>
              <Separator className="my-2" />
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>{formatCurrency(cartTotals.subtotal)}</span>
              </div>
            </div>

            {/* Table Number */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Table Number</label>
              <Input
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                placeholder="Enter table number"
                className="text-center font-mono"
              />
            </div>

            {/* Cashier Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Cashier Name</label>
              <Input
                value={cashierName}
                onChange={(e) => setCashierName(e.target.value)}
                placeholder="Enter cashier name"
              />
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Payment Method</label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                  className="flex flex-col h-auto py-3"
                  onClick={() => setPaymentMethod('cash')}
                >
                  <Banknote className="h-5 w-5 mb-1" />
                  <span className="text-xs">Cash</span>
                </Button>
                <Button
                  variant={paymentMethod === 'card' ? 'default' : 'outline'}
                  className="flex flex-col h-auto py-3"
                  onClick={() => setPaymentMethod('card')}
                >
                  <CreditCard className="h-5 w-5 mb-1" />
                  <span className="text-xs">Card</span>
                </Button>
                <Button
                  variant={paymentMethod === 'digital' ? 'default' : 'outline'}
                  className="flex flex-col h-auto py-3"
                  onClick={() => setPaymentMethod('digital')}
                >
                  <Smartphone className="h-5 w-5 mb-1" />
                  <span className="text-xs">Digital</span>
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCheckoutOpen(false)}>
              Cancel
            </Button>
            <Button onClick={processCheckout} disabled={isProcessing}>
              {isProcessing ? 'Processing...' : 'Complete Sale'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={isReceiptOpen} onOpenChange={setIsReceiptOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-green-500" />
              Sale Complete
            </DialogTitle>
          </DialogHeader>

          {receiptData && (
            <div className="bg-white text-black p-4 rounded-lg font-mono text-sm">
              <div className="text-center mb-4">
                <h3 className="font-bold text-lg">RECEIPT</h3>
                <p className="text-xs text-gray-500">
                  {receiptData.transaction?.transactionNumber}
                </p>
              </div>

              <div className="text-xs text-gray-500 mb-4">
                <p>Date: {new Date(receiptData.createdAt).toLocaleString()}</p>
                <p>Table: {receiptData.transaction?.tableNumber ? `Table ${receiptData.transaction.tableNumber}` : '-'}</p>
                <p>Cashier: {receiptData.cashierName}</p>
                <p>Payment: {receiptData.paymentMethod.toUpperCase()}</p>
              </div>

              <Separator className="my-2 bg-gray-300" />

              <div className="space-y-1 my-2">
                {receiptData.saleItems?.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-xs">
                    <span>
                      {item.quantity}x {item.product?.name}
                    </span>
                    <span>{formatCurrency(item.subtotal)}</span>
                  </div>
                ))}
              </div>

              <Separator className="my-2 bg-gray-300" />

              <div className="flex justify-between font-bold text-lg mt-2">
                <span>TOTAL</span>
                <span>{formatCurrency(receiptData.totalAmount)}</span>
              </div>

              <div className="text-center mt-4 text-xs text-gray-500">
                <p>Thank you for your purchase!</p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReceiptOpen(false)}>
              Close
            </Button>
            <Button onClick={printReceipt}>
              <Printer className="h-4 w-4 mr-2" />
              Print Receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
