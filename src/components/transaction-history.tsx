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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  Search,
  CalendarIcon,
  Eye,
  Printer,
  CreditCard,
  Banknote,
  Smartphone,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import type { SaleWithDetails } from '@/types';

interface TransactionHistoryProps {
  onRefresh: () => void;
}

export function TransactionHistory({ onRefresh }: TransactionHistoryProps) {
  const [sales, setSales] = useState<SaleWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const [selectedSale, setSelectedSale] = useState<SaleWithDetails | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/sales');
      if (response.ok) {
        const data = await response.json();
        setSales(data);
      }
    } catch (error) {
      console.error('Error fetching sales:', error);
      toast.error('Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  // Filter sales
  const filteredSales = sales.filter((sale) => {
    const matchesSearch =
      sale.transaction?.transactionNumber
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      sale.cashierName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPayment =
      paymentFilter === 'all' || sale.paymentMethod === paymentFilter;

    let matchesDate = true;
    if (dateFilter) {
      const saleDate = new Date(sale.createdAt).toDateString();
      const filterDate = dateFilter.toDateString();
      matchesDate = saleDate === filterDate;
    }

    return matchesSearch && matchesPayment && matchesDate;
  });

  // Pagination
  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);
  const paginatedSales = filteredSales.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatDateTime = (date: Date | string) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'cash':
        return <Banknote className="h-4 w-4" />;
      case 'card':
        return <CreditCard className="h-4 w-4" />;
      case 'digital':
        return <Smartphone className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getPaymentLabel = (method: string) => {
    switch (method) {
      case 'cash':
        return 'Cash';
      case 'card':
        return 'Card';
      case 'digital':
        return 'Digital';
      default:
        return method;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      case 'refunded':
        return <Badge variant="secondary">Refunded</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const openDetail = (sale: SaleWithDetails) => {
    setSelectedSale(sale);
    setIsDetailOpen(true);
  };

  const printReceipt = (sale: SaleWithDetails) => {
    // Create a printable receipt
    const receiptWindow = window.open('', '_blank');
    if (!receiptWindow) {
      toast.error('Failed to open print window');
      return;
    }

    const receiptContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - ${sale.transaction?.transactionNumber}</title>
          <style>
            body {
              font-family: 'Courier New', monospace;
              padding: 20px;
              max-width: 300px;
              margin: 0 auto;
            }
            h2, h3 { text-align: center; margin: 5px 0; }
            hr { border: none; border-top: 1px dashed #000; margin: 10px 0; }
            .row { display: flex; justify-content: space-between; margin: 5px 0; }
            .total { font-weight: bold; font-size: 1.2em; }
            .footer { text-align: center; margin-top: 20px; font-size: 0.8em; }
          </style>
        </head>
        <body>
          <h2>RECEIPT</h2>
          <p style="text-align: center; font-size: 0.8em;">${sale.transaction?.transactionNumber}</p>
          <hr>
          <div class="row">
            <span>Date:</span>
            <span>${formatDateTime(sale.createdAt)}</span>
          </div>
          <div class="row">
            <span>Table:</span>
            <span>${sale.transaction?.tableNumber ? `Table ${sale.transaction.tableNumber}` : '-'}</span>
          </div>
          <div class="row">
            <span>Cashier:</span>
            <span>${sale.cashierName}</span>
          </div>
          <div class="row">
            <span>Payment:</span>
            <span>${getPaymentLabel(sale.paymentMethod)}</span>
          </div>
          <hr>
          <div>
            ${sale.saleItems
              .map(
                (item) => `
                <div class="row">
                  <span>${item.quantity}x ${item.product?.name || 'Unknown'}</span>
                  <span>${formatCurrency(item.subtotal)}</span>
                </div>
                `
              )
              .join('')}
          </div>
          <hr>
          <div class="row total">
            <span>TOTAL</span>
            <span>${formatCurrency(sale.totalAmount)}</span>
          </div>
          <div class="footer">
            <p>Thank you for your purchase!</p>
          </div>
        </body>
      </html>
    `;

    receiptWindow.document.write(receiptContent);
    receiptWindow.document.close();
    receiptWindow.print();
  };

  const clearFilters = () => {
    setSearchQuery('');
    setPaymentFilter('all');
    setDateFilter(undefined);
    setCurrentPage(1);
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Transaction History</h2>
        </div>
        <Button variant="outline" onClick={() => { fetchSales(); onRefresh(); }}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by transaction # or cashier..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10"
          />
        </div>

        <Select
          value={paymentFilter}
          onValueChange={(value) => {
            setPaymentFilter(value);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Payment Method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Methods</SelectItem>
            <SelectItem value="cash">Cash</SelectItem>
            <SelectItem value="card">Card</SelectItem>
            <SelectItem value="digital">Digital</SelectItem>
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[180px]">
              <CalendarIcon className="h-4 w-4 mr-2" />
              {dateFilter ? format(dateFilter, 'PPP') : 'Filter by Date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={dateFilter}
              onSelect={(date) => {
                setDateFilter(date);
                setCurrentPage(1);
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {(searchQuery || paymentFilter !== 'all' || dateFilter) && (
          <Button variant="ghost" onClick={clearFilters}>
            Clear Filters
          </Button>
        )}
      </div>

      {/* Transactions Table */}
      <Card className="flex-1 overflow-hidden">
        <CardContent className="p-0 h-full">
          <ScrollArea className="h-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction #</TableHead>
                  <TableHead>Table</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Cashier</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : paginatedSales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="flex flex-col items-center text-muted-foreground">
                        <ShoppingCart className="h-12 w-12 mb-2" />
                        <p>No transactions found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedSales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-medium">
                        {sale.transaction?.transactionNumber}
                      </TableCell>
                      <TableCell className="text-sm">
                        {sale.transaction?.tableNumber ? (
                          <Badge variant="secondary">Table {sale.transaction.tableNumber}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDateTime(sale.createdAt)}
                      </TableCell>
                      <TableCell>{sale.cashierName}</TableCell>
                      <TableCell>{sale.saleItems.length} items</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {getPaymentIcon(sale.paymentMethod)}
                          <span className="text-sm">
                            {getPaymentLabel(sale.paymentMethod)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(sale.transaction?.status)}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(sale.totalAmount)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDetail(sale)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => printReceipt(sale)}
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
            {Math.min(currentPage * itemsPerPage, filteredSales.length)} of{' '}
            {filteredSales.length} transactions
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Transaction Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
          </DialogHeader>

          {selectedSale && (
            <div className="space-y-4">
              {/* Transaction Info */}
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Transaction #</p>
                    <p className="font-medium">
                      {selectedSale.transaction?.transactionNumber}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Table</p>
                    <p className="font-medium">
                      {selectedSale.transaction?.tableNumber ? (
                        <Badge variant="secondary">Table {selectedSale.transaction.tableNumber}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Date & Time</p>
                    <p className="font-medium">
                      {formatDateTime(selectedSale.createdAt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Cashier</p>
                    <p className="font-medium">{selectedSale.cashierName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Payment Method</p>
                    <p className="font-medium flex items-center gap-1">
                      {getPaymentIcon(selectedSale.paymentMethod)}
                      {getPaymentLabel(selectedSale.paymentMethod)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    {getStatusBadge(selectedSale.transaction?.status)}
                  </div>
                </div>
              </div>

              {/* Items */}
              <div>
                <h4 className="font-medium mb-2">Items</h4>
                <div className="border rounded-lg divide-y">
                  {selectedSale.saleItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between p-3 text-sm"
                    >
                      <div>
                        <p className="font-medium">{item.product?.name}</p>
                        <p className="text-muted-foreground">
                          {item.quantity} x {formatCurrency(item.unitPrice)}
                        </p>
                      </div>
                      <p className="font-medium">
                        {formatCurrency(item.subtotal)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-lg font-bold">Total</span>
                <span className="text-xl font-bold text-primary">
                  {formatCurrency(selectedSale.totalAmount)}
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setIsDetailOpen(false);
                    printReceipt(selectedSale);
                  }}
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print Receipt
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
