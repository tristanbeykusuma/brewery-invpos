'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Plus,
  Minus,
  Trash2,
  Download,
  FileText,
  Package,
  Search,
  Printer,
  Mail,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Product, Category } from '@/types';

interface PurchaseOrderItem {
  product: Product;
  quantity: number;
  cost: number;
  subtotal: number;
}

interface PurchaseOrderProps {
  products: Product[];
  categories: Category[];
  isOpen?: boolean;
  onClose?: () => void;
}

export function PurchaseOrder({ products, categories, isOpen: controlledIsOpen, onClose }: PurchaseOrderProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  
  const handleOpenChange = (open: boolean) => {
    if (controlledIsOpen === undefined) {
      setInternalIsOpen(open);
    }
    if (!open && onClose) {
      onClose();
    }
  };
  
  const [items, setItems] = useState<PurchaseOrderItem[]>([]);
  const [supplierName, setSupplierName] = useState('');
  const [supplierEmail, setSupplierEmail] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [purchaseOrderData, setPurchaseOrderData] = useState<{
    orderNumber: string;
    orderDate: string;
    supplierName: string;
    supplierEmail: string;
    items: PurchaseOrderItem[];
    total: number;
    itemCount: number;
    notes: string;
  } | null>(null);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || 
        product.categoryId === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  // Calculate totals
  const orderTotals = useMemo(() => {
    const total = items.reduce((sum, item) => sum + item.subtotal, 0);
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    return { total, itemCount };
  }, [items]);

  // Add product to order
  const addToOrder = (product: Product) => {
    setItems((prev) => {
      const existingItem = prev.find((item) => item.product.id === product.id);
      if (existingItem) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.cost }
            : item
        );
      }
      return [...prev, { product, quantity: 1, cost: product.cost, subtotal: product.cost }];
    });
    toast.success(`Added ${product.name} to purchase order`);
  };

  // Update item quantity
  const updateQuantity = (productId: string, delta: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.product.id !== productId) return item;
        const newQuantity = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQuantity, subtotal: newQuantity * item.cost };
      })
    );
  };

  // Remove item from order
  const removeFromOrder = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  // Generate and display purchase order for printing
  const generatePDF = () => {
    if (items.length === 0) {
      toast.error('Purchase order is empty');
      return;
    }

    const orderNumber = `PO-${Date.now()}`;
    const orderDate = new Date().toLocaleDateString();

    setPurchaseOrderData({
      orderNumber,
      orderDate,
      supplierName,
      supplierEmail,
      items,
      total: orderTotals.total,
      itemCount: orderTotals.itemCount,
      notes: orderNotes,
    });
    setIsReceiptOpen(true);
    handleOpenChange(false);
    toast.success('Purchase order created');

    // Clear form inputs after creating purchase order
    setItems([]);
    setSupplierName('');
    setSupplierEmail('');
    setOrderNotes('');
    setSearchQuery('');
    setSelectedCategory('all');
  };

  // Print purchase order
  const printPurchaseOrder = () => {
    // Add print styles to hide everything except the receipt
    const printStyles = `
      @media print {
        body * {
          visibility: hidden;
        }
        #purchase-order-receipt, #purchase-order-receipt * {
          visibility: visible;
        }
        #purchase-order-receipt {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          margin: 0;
          padding: 20px;
        }
      }
    `;
    
    const styleElement = document.createElement('style');
    styleElement.textContent = printStyles;
    document.head.appendChild(styleElement);
    
    window.print();
    
    // Remove the print styles after printing
    setTimeout(() => {
      document.head.removeChild(styleElement);
    }, 1000);
  };

  // Send purchase order via email
  const sendEmail = () => {
    if (items.length === 0) {
      toast.error('Purchase order is empty');
      return;
    }

    if (!supplierEmail) {
      toast.error('Please enter supplier email');
      return;
    }

    const orderNumber = `PO-${Date.now()}`;
    const orderDate = new Date().toLocaleDateString();

    // Build email body
    let emailBody = `PURCHASE ORDER\n`;
    emailBody += `Order Number: ${orderNumber}\n`;
    emailBody += `Date: ${orderDate}\n`;
    emailBody += `Supplier: ${supplierName || 'N/A'}\n\n`;
    emailBody += `--------------------------------\n`;
    emailBody += `ITEMS:\n\n`;

    items.forEach((item) => {
      emailBody += `${item.quantity}x ${item.product.name} (${item.product.sku})\n`;
      emailBody += `  Cost: $${item.cost.toFixed(2)} | Subtotal: $${item.subtotal.toFixed(2)}\n`;
    });

    emailBody += `\n--------------------------------\n`;
    emailBody += `Total Items: ${orderTotals.itemCount}\n`;
    emailBody += `TOTAL: $${orderTotals.total.toFixed(2)}\n\n`;

    if (orderNotes) {
      emailBody += `NOTES:\n${orderNotes}\n\n`;
    }

    emailBody += `Thank you for your business!`;

    // Create mailto link
    const subject = encodeURIComponent(`Purchase Order ${orderNumber} - ${supplierName || 'N/A'}`);
    const body = encodeURIComponent(emailBody);
    const mailtoLink = `mailto:${supplierEmail}?subject=${subject}&body=${body}`;

    // Open email client
    window.location.href = mailtoLink;
    toast.success('Opening email client...');
  };

  // Send purchase order via email from receipt dialog
  const sendEmailFromReceipt = () => {
    if (!purchaseOrderData) {
      toast.error('No purchase order data available');
      return;
    }

    if (!purchaseOrderData.supplierEmail) {
      toast.error('No supplier email available');
      return;
    }

    // Build email body
    let emailBody = `PURCHASE ORDER\n`;
    emailBody += `Order Number: ${purchaseOrderData.orderNumber}\n`;
    emailBody += `Date: ${purchaseOrderData.orderDate}\n`;
    emailBody += `Supplier: ${purchaseOrderData.supplierName || 'N/A'}\n`;
    if (purchaseOrderData.supplierEmail) {
      emailBody += `Email: ${purchaseOrderData.supplierEmail}\n`;
    }
    emailBody += `\n--------------------------------\n`;
    emailBody += `ITEMS:\n\n`;

    purchaseOrderData.items.forEach((item) => {
      emailBody += `${item.quantity}x ${item.product.name} (${item.product.sku})\n`;
      emailBody += `  Cost: $${item.cost.toFixed(2)} | Subtotal: $${item.subtotal.toFixed(2)}\n`;
    });

    emailBody += `\n--------------------------------\n`;
    emailBody += `Total Items: ${purchaseOrderData.itemCount}\n`;
    emailBody += `TOTAL: $${purchaseOrderData.total.toFixed(2)}\n\n`;

    if (purchaseOrderData.notes) {
      emailBody += `NOTES:\n${purchaseOrderData.notes}\n\n`;
    }

    emailBody += `Thank you for your business!`;

    // Create mailto link
    const subject = encodeURIComponent(`Purchase Order ${purchaseOrderData.orderNumber} - ${purchaseOrderData.supplierName || 'N/A'}`);
    const body = encodeURIComponent(emailBody);
    const mailtoLink = `mailto:${purchaseOrderData.supplierEmail}?subject=${subject}&body=${body}`;

    // Open email client
    window.location.href = mailtoLink;
    toast.success('Opening email client...');
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Create Purchase Order</DialogTitle>
            <DialogDescription>
              Create a purchase order for suppliers. The order will be downloaded as a file.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4">
            {/* Supplier Information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supplierName">Supplier Name</Label>
                <Input
                  id="supplierName"
                  placeholder="Enter supplier name"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplierEmail">Supplier Email</Label>
                <Input
                  id="supplierEmail"
                  type="email"
                  placeholder="Enter supplier email"
                  value={supplierEmail}
                  onChange={(e) => setSupplierEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Product Search */}
            <div className="space-y-2">
              <Label>Search Products</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products by name or SKU..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[180px]">
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
              </div>

              {/* Product List */}
              <div className="border rounded-lg max-h-48 overflow-y-auto">
                {filteredProducts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <Package className="h-8 w-8 mb-2" />
                    <p>No products found</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredProducts.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => addToOrder(product)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{product.name}</div>
                          <div className="text-sm text-muted-foreground">{product.sku}</div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="font-bold">${product.cost.toFixed(2)}</div>
                            <div className="text-xs text-muted-foreground">
                              {categories.find(cat => cat.id === product.categoryId)?.name}
                            </div>
                          </div>
                          <Button size="sm" variant="ghost">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Order Items Table */}
            <div className="space-y-2">
              <Label>Order Items ({items.length})</Label>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Cost</TableHead>
                      <TableHead className="text-center">Qty</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <div className="flex flex-col items-center text-muted-foreground">
                            <Package className="h-8 w-8 mb-2" />
                            <p>No items in order</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      items.map((item) => (
                        <TableRow key={item.product.id}>
                          <TableCell className="text-muted-foreground">{item.product.sku}</TableCell>
                          <TableCell className="font-medium">{item.product.name}</TableCell>
                          <TableCell>
                            {categories.find(cat => cat.id === item.product.categoryId)?.name || 'N/A'}
                          </TableCell>
                          <TableCell className="text-right">${item.cost.toFixed(2)}</TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => updateQuantity(item.product.id, -1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center font-medium">{item.quantity}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => updateQuantity(item.product.id, 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ${item.subtotal.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeFromOrder(item.product.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Order Summary */}
            <div className="space-y-2">
              <Label>Order Summary</Label>
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Items:</span>
                    <span className="font-bold">{orderTotals.itemCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Order Total:</span>
                    <span className="font-bold text-lg">$${orderTotals.total.toFixed(2)}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Order Date:</span>
                    <span>{new Date().toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Supplier:</span>
                    <span className="font-medium">{supplierName || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Notes */}
            <div className="space-y-2">
              <Label htmlFor="orderNotes">Order Notes</Label>
              <Textarea
                id="orderNotes"
                placeholder="Add any notes for this purchase order..."
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button variant="outline" onClick={sendEmail} disabled={items.length === 0}>
              <Mail className="h-4 w-4 mr-2" />
              Send Email
            </Button>
            <Button onClick={generatePDF} disabled={items.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Create Purchase Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Purchase Order Receipt Dialog */}
      <Dialog open={isReceiptOpen} onOpenChange={setIsReceiptOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-green-500" />
              Purchase Order Created
            </DialogTitle>
          </DialogHeader>

          {purchaseOrderData && (
            <div id="purchase-order-receipt" className="bg-white text-black p-4 rounded-lg font-mono text-sm">
              <div className="text-center mb-4">
                <h3 className="font-bold text-lg">PURCHASE ORDER</h3>
                <p className="text-xs text-gray-500">{purchaseOrderData.orderNumber}</p>
              </div>

              <div className="text-xs text-gray-500 mb-4">
                <p>Date: {purchaseOrderData.orderDate}</p>
                <p>Supplier: {purchaseOrderData.supplierName || 'N/A'}</p>
                {purchaseOrderData.supplierEmail && (
                  <p>Email: {purchaseOrderData.supplierEmail}</p>
                )}
              </div>

              <Separator className="my-2 bg-gray-300" />

              <div className="space-y-1 my-2">
                {purchaseOrderData.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-xs">
                    <span>
                      {item.quantity}x {item.product.name}
                    </span>
                    <span>${item.subtotal.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <Separator className="my-2 bg-gray-300" />

              <div className="flex justify-between font-bold mt-2">
                <span>Total Items:</span>
                <span>{purchaseOrderData.itemCount}</span>
              </div>
              <div className="flex justify-between font-bold text-lg mt-1">
                <span>TOTAL</span>
                <span>${purchaseOrderData.total.toFixed(2)}</span>
              </div>

              {purchaseOrderData.notes && (
                <div className="mt-4 p-2 bg-gray-100 rounded text-xs">
                  <p className="font-bold">Notes:</p>
                  <p>{purchaseOrderData.notes}</p>
                </div>
              )}

              <div className="text-center mt-4 text-xs text-gray-500">
                <p>Thank you for your business!</p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReceiptOpen(false)}>
              Close
            </Button>
            <Button variant="outline" onClick={sendEmailFromReceipt} disabled={!purchaseOrderData?.supplierEmail}>
              <Mail className="h-4 w-4 mr-2" />
              Send Email
            </Button>
            <Button onClick={printPurchaseOrder}>
              <Printer className="h-4 w-4 mr-2" />
              Print Purchase Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
