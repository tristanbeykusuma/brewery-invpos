'use client';

import { useState, useEffect } from 'react';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Plus,
  Search,
  Package,
  MoreHorizontal,
  Edit,
  Trash2,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Filter,
  RefreshCw,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Product, Category, ProductWithInventory } from '@/types';

interface InventoryManagementProps {
  products: Product[];
  categories: Category[];
  onDataChange: () => void;
  onOpenPurchaseOrder?: () => void;
}

export function InventoryManagement({
  products,
  categories,
  onDataChange,
  onOpenPurchaseOrder,
}: InventoryManagementProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [isStockDialogOpen, setIsStockDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Product form state
  const [productForm, setProductForm] = useState({
    name: '',
    sku: '',
    description: '',
    price: '',
    cost: '',
    categoryId: '',
    imageUrl: '',
    initialStock: '',
    lowStockThreshold: '',
  });

  // Stock adjustment state
  const [stockAdjustment, setStockAdjustment] = useState({
    type: 'add' as 'add' | 'remove' | 'set',
    quantity: '',
    newThreshold: '',
  });

  // Filter products
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = categoryFilter === 'all' || 
      product.categoryId === categoryFilter;

    const stock = product.inventory?.quantity ?? 0;
    const threshold = product.inventory?.lowStockThreshold ?? 10;

    let matchesStock = true;
    if (stockFilter === 'low') {
      matchesStock = stock <= threshold && stock > 0;
    } else if (stockFilter === 'out') {
      matchesStock = stock === 0;
    } else if (stockFilter === 'instock') {
      matchesStock = stock > threshold;
    }

    return matchesSearch && matchesCategory && matchesStock;
  });

  // Reset form
  const resetProductForm = () => {
    setProductForm({
      name: '',
      sku: '',
      description: '',
      price: '',
      cost: '',
      categoryId: categories[0]?.id || '',
      imageUrl: '',
      initialStock: '0',
      lowStockThreshold: '10',
    });
  };

  // Open add product dialog
  const openAddProduct = () => {
    setSelectedProduct(null);
    resetProductForm();
    setIsProductDialogOpen(true);
  };

  // Open edit product dialog
  const openEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setProductForm({
      name: product.name,
      sku: product.sku,
      description: product.description || '',
      price: product.price.toString(),
      cost: product.cost.toString(),
      categoryId: product.categoryId,
      imageUrl: product.imageUrl || '',
      initialStock: product.inventory?.quantity.toString() || '0',
      lowStockThreshold: product.inventory?.lowStockThreshold.toString() || '10',
    });
    setIsProductDialogOpen(true);
  };

  // Open stock adjustment dialog
  const openStockAdjustment = (product: Product) => {
    setSelectedProduct(product);
    setStockAdjustment({
      type: 'add',
      quantity: '',
      newThreshold: product.inventory?.lowStockThreshold.toString() || '10',
    });
    setIsStockDialogOpen(true);
  };

  // Open delete confirmation
  const openDeleteConfirm = (product: Product) => {
    setSelectedProduct(product);
    setIsDeleteDialogOpen(true);
  };

  // Save product (create or update)
  const saveProduct = async () => {
    if (!productForm.name || !productForm.sku || !productForm.price || !productForm.cost) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const url = '/api/products';
      const method = selectedProduct ? 'PUT' : 'POST';
      const body = selectedProduct
        ? { ...productForm, id: selectedProduct.id }
        : productForm;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save product');
      }

      toast.success(
        selectedProduct ? 'Product updated successfully' : 'Product created successfully'
      );
      setIsProductDialogOpen(false);
      onDataChange();
    } catch (error) {
      toast.error('Failed to save product', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Adjust stock
  const adjustStock = async () => {
    if (!selectedProduct || !stockAdjustment.quantity) {
      toast.error('Please enter a quantity');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/inventory', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct.id,
          adjustment: parseInt(stockAdjustment.quantity),
          type: stockAdjustment.type,
          lowStockThreshold: parseInt(stockAdjustment.newThreshold),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to adjust stock');
      }

      toast.success('Stock adjusted successfully');
      setIsStockDialogOpen(false);
      onDataChange();
    } catch (error) {
      toast.error('Failed to adjust stock', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete product
  const deleteProduct = async () => {
    if (!selectedProduct) return;

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/products?id=${selectedProduct.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete product');
      }

      toast.success('Product deleted successfully');
      setIsDeleteDialogOpen(false);
      onDataChange();
    } catch (error) {
      toast.error('Failed to delete product', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get stock status
  const getStockStatus = (product: Product) => {
    const stock = product.inventory?.quantity ?? 0;
    const threshold = product.inventory?.lowStockThreshold ?? 10;

    if (stock === 0) {
      return { label: 'Out of Stock', variant: 'destructive' as const };
    }
    if (stock <= threshold) {
      return { label: 'Low Stock', variant: 'secondary' as const };
    }
    return { label: 'In Stock', variant: 'default' as const };
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Inventory Management</h2>
        </div>
        <div className="flex gap-2">
          <Button onClick={openAddProduct}>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
          {onOpenPurchaseOrder && (
            <Button onClick={onOpenPurchaseOrder} variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Create Purchase Order
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
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
        <Select value={stockFilter} onValueChange={setStockFilter}>
          <SelectTrigger className="w-[150px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Stock Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="instock">In Stock</SelectItem>
            <SelectItem value="low">Low Stock</SelectItem>
            <SelectItem value="out">Out of Stock</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={onDataChange}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Products Table */}
      <Card className="flex-1 overflow-hidden">
        <CardContent className="p-0 h-full">
          <ScrollArea className="h-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">Image</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-center">Stock</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="flex flex-col items-center text-muted-foreground">
                        <Package className="h-12 w-12 mb-2" />
                        <p>No products found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => {
                    const status = getStockStatus(product);
                    const stock = product.inventory?.quantity ?? 0;
                    const threshold = product.inventory?.lowStockThreshold ?? 10;

                    return (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="w-10 h-10 rounded bg-muted overflow-hidden">
                            {product.imageUrl ? (
                              <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {product.sku}
                        </TableCell>
                        <TableCell>
                          {product.category?.name || (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          ${product.price.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          ${product.cost.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center">
                          <span
                            className={
                              stock <= threshold ? 'text-amber-600 font-medium' : ''
                            }
                          >
                            {stock}
                          </span>
                          {stock <= threshold && stock > 0 && (
                            <AlertTriangle className="inline h-4 w-4 text-amber-500 ml-1" />
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditProduct(product)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openStockAdjustment(product)}>
                                <ArrowUp className="h-4 w-4 mr-2" />
                                Adjust Stock
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => openDeleteConfirm(product)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Product Dialog */}
      <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedProduct ? 'Edit Product' : 'Add New Product'}
            </DialogTitle>
            <DialogDescription>
              {selectedProduct
                ? 'Update the product information below'
                : 'Fill in the product details below'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={productForm.name}
                  onChange={(e) =>
                    setProductForm({ ...productForm, name: e.target.value })
                  }
                  placeholder="Product name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sku">SKU *</Label>
                <Input
                  id="sku"
                  value={productForm.sku}
                  onChange={(e) =>
                    setProductForm({ ...productForm, sku: e.target.value })
                  }
                  placeholder="SKU-001"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={productForm.description}
                onChange={(e) =>
                  setProductForm({ ...productForm, description: e.target.value })
                }
                placeholder="Product description"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={productForm.price}
                  onChange={(e) =>
                    setProductForm({ ...productForm, price: e.target.value })
                  }
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost">Cost *</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  value={productForm.cost}
                  onChange={(e) =>
                    setProductForm({ ...productForm, cost: e.target.value })
                  }
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={productForm.categoryId}
                onValueChange={(value) =>
                  setProductForm({ ...productForm, categoryId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input
                id="imageUrl"
                value={productForm.imageUrl}
                onChange={(e) =>
                  setProductForm({ ...productForm, imageUrl: e.target.value })
                }
                placeholder="https://example.com/image.jpg"
              />
            </div>

            {!selectedProduct && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="initialStock">Initial Stock</Label>
                  <Input
                    id="initialStock"
                    type="number"
                    value={productForm.initialStock}
                    onChange={(e) =>
                      setProductForm({ ...productForm, initialStock: e.target.value })
                    }
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
                  <Input
                    id="lowStockThreshold"
                    type="number"
                    value={productForm.lowStockThreshold}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        lowStockThreshold: e.target.value,
                      })
                    }
                    placeholder="10"
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsProductDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={saveProduct} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Product'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stock Adjustment Dialog */}
      <Dialog open={isStockDialogOpen} onOpenChange={setIsStockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Stock</DialogTitle>
            <DialogDescription>
              Adjust stock for {selectedProduct?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-muted rounded-lg p-3">
              <p className="text-sm text-muted-foreground">Current Stock</p>
              <p className="text-2xl font-bold">
                {selectedProduct?.inventory?.quantity ?? 0} units
              </p>
            </div>

            <div className="space-y-2">
              <Label>Adjustment Type</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={stockAdjustment.type === 'add' ? 'default' : 'outline'}
                  className="flex flex-col h-auto py-2"
                  onClick={() => setStockAdjustment({ ...stockAdjustment, type: 'add' })}
                >
                  <ArrowUp className="h-4 w-4 mb-1" />
                  <span className="text-xs">Add</span>
                </Button>
                <Button
                  variant={stockAdjustment.type === 'remove' ? 'default' : 'outline'}
                  className="flex flex-col h-auto py-2"
                  onClick={() =>
                    setStockAdjustment({ ...stockAdjustment, type: 'remove' })
                  }
                >
                  <ArrowDown className="h-4 w-4 mb-1" />
                  <span className="text-xs">Remove</span>
                </Button>
                <Button
                  variant={stockAdjustment.type === 'set' ? 'default' : 'outline'}
                  className="flex flex-col h-auto py-2"
                  onClick={() => setStockAdjustment({ ...stockAdjustment, type: 'set' })}
                >
                  <span className="text-xs">Set To</span>
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">
                {stockAdjustment.type === 'set' ? 'New Stock Level' : 'Quantity'}
              </Label>
              <Input
                id="quantity"
                type="number"
                value={stockAdjustment.quantity}
                onChange={(e) =>
                  setStockAdjustment({ ...stockAdjustment, quantity: e.target.value })
                }
                placeholder="Enter quantity"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="threshold">Low Stock Threshold</Label>
              <Input
                id="threshold"
                type="number"
                value={stockAdjustment.newThreshold}
                onChange={(e) =>
                  setStockAdjustment({ ...stockAdjustment, newThreshold: e.target.value })
                }
                placeholder="10"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStockDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={adjustStock} disabled={isSubmitting}>
              {isSubmitting ? 'Adjusting...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{selectedProduct?.name}&quot;? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={deleteProduct}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
