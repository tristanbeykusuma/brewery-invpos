'use client';

import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Database,
  LayoutDashboard,
  Package,
  ShoppingCart,
  History,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { POSTerminal } from '@/components/pos-terminal';
import { InventoryManagement } from '@/components/inventory-management';
import { Dashboard } from '@/components/dashboard';
import { TransactionHistory } from '@/components/transaction-history';
import { PurchaseOrder } from '@/components/purchase-order';
import type { Product, Category } from '@/types';

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [isSeeded, setIsSeeded] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isPurchaseOrderOpen, setIsPurchaseOrderOpen] = useState(false);

  // Fetch all data
  const fetchData = useCallback(async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/categories'),
      ]);

      if (productsRes.ok) {
        const productsData = await productsRes.json();
        setProducts(productsData);
      }

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Check if database is seeded
  useEffect(() => {
    const checkSeed = async () => {
      try {
        const response = await fetch('/api/categories');
        if (response.ok) {
          const data = await response.json();
          setIsSeeded(data.length > 0);
        }
      } catch {
        // Ignore error
      }
    };

    checkSeed();
    fetchData();
  }, [fetchData]);

  // Seed database
  const handleSeed = async () => {
    setSeeding(true);
    try {
      const response = await fetch('/api/seed', {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'completed') {
          toast.success('Database seeded successfully!');
          setIsSeeded(true);
          fetchData();
        } else {
          toast.info('Database already seeded');
          setIsSeeded(true);
        }
      } else {
        throw new Error('Failed to seed database');
      }
    } catch (error) {
      toast.error('Failed to seed database');
    } finally {
      setSeeding(false);
    }
  };

  // Show seed prompt if no data
  if (!loading && !isSeeded && products.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="flex justify-center">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Package className="h-10 w-10 text-primary" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold mb-2">Welcome to POS System</h1>
            <p className="text-muted-foreground">
              Your Point-of-Sales & Inventory Management System
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-6 text-left space-y-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Database className="h-5 w-5" />
              Setup Required
            </h2>
            <p className="text-sm text-muted-foreground">
              The database is empty. Click the button below to populate it with
              sample data including categories, products, and sample transactions.
            </p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• 5 Categories (Electronics, Food, Clothing, etc.)</li>
              <li>• 25 Sample Products with inventory</li>
              <li>• Demo transactions for the last 7 days</li>
            </ul>
            <Button className="w-full" onClick={handleSeed} disabled={seeding}>
              {seeding ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Seeding Database...
                </>
              ) : (
                <>
                  <Database className="h-4 w-4 mr-2" />
                  Seed Demo Data
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <ShoppingCart className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">POS System</h1>
              <p className="text-xs text-muted-foreground">
                Point of Sales & Inventory
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Low stock indicator */}
            {products.filter(
              (p) =>
                p.inventory &&
                p.inventory.quantity <= p.inventory.lowStockThreshold
            ).length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="text-amber-600 border-amber-200 hover:bg-amber-50"
                onClick={() => setActiveTab('inventory')}
              >
                <AlertTriangle className="h-4 w-4 mr-1" />
                {
                  products.filter(
                    (p) =>
                      p.inventory &&
                      p.inventory.quantity <= p.inventory.lowStockThreshold
                  ).length
                }{' '}
                Low Stock
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-4">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex flex-col h-[calc(100vh-100px)]"
        >
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="pos" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">POS Terminal</span>
            </TabsTrigger>
            <TabsTrigger value="inventory" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Inventory</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">History</span>
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden">
            <TabsContent value="dashboard" className="h-full mt-0">
              <Dashboard onRefresh={fetchData} />
            </TabsContent>

             <TabsContent value="pos" className="h-full mt-0">
               {loading ? (
                 <div className="flex items-center justify-center h-full">
                   <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                 </div>
               ) : (
                 <POSTerminal
                   products={products}
                   categories={categories}
                   onSaleComplete={fetchData}
                 />
               )}
             </TabsContent>

             <TabsContent value="inventory" className="h-full mt-0">
               {loading ? (
                 <div className="flex items-center justify-center h-full">
                   <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                 </div>
               ) : (
                 <InventoryManagement
                   products={products}
                   categories={categories}
                   onDataChange={fetchData}
                   onOpenPurchaseOrder={() => setIsPurchaseOrderOpen(true)}
                 />
               )}
             </TabsContent>

            <TabsContent value="history" className="h-full mt-0">
              <TransactionHistory onRefresh={fetchData} />
            </TabsContent>
           </div>
         </Tabs>
       </main>
       
       {/* Purchase Order Dialog */}
       <PurchaseOrder
         products={products}
         categories={categories}
         isOpen={isPurchaseOrderOpen}
         onClose={() => setIsPurchaseOrderOpen(false)}
       />
     </div>
   );
 }
