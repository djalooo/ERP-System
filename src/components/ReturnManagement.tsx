import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import DynamicCalendar from './DynamicCalendar';
import {
  RotateCcw,
  Search,
  Plus,
  Edit,
  Trash2,
  ArrowLeft,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  Package,
  User,
  Calendar,
  Filter,
  Eye,
  TrendingDown,
  CalendarDays,
  BarChart3
} from 'lucide-react';
import {
  Return,
  Order,
  Product,
  UnknownProduct
} from '@/lib/storage';
import {
  managedReturnsStorage as returnsStorage,
  managedOrderStorage as orderStorage,
  managedProductStorage as productStorage,
  managedUnknownProductStorage as unknownProductStorage
} from '@/lib/managedStorage';
import { BarChart } from './ui/chart';
import { addDays, format, isValid, parse as parseDate } from 'date-fns';

interface ReturnManagementProps {
  onBack: () => void;
}

interface ExtendedReturn extends Return {
  productDetails?: Product | UnknownProduct;
  refundAmount?: number;
  createdAt?: string;
}

import { arSA, fr, enUS } from 'date-fns/locale';

const ReturnManagement: React.FC<ReturnManagementProps> = ({ onBack }) => {
  const { t, isRTL, language } = useLanguage();
  const dateFnsLocale = language === 'ar' ? arSA : language === 'fr' ? fr : enUS;
  const [returns, setReturns] = useState<ExtendedReturn[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [unknownProducts, setUnknownProducts] = useState<UnknownProduct[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<ExtendedReturn | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [returnForm, setReturnForm] = useState({
    reason: '',
    notes: '',
    returnQuantity: 1,
    refundAmount: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [currentDayOffset, setCurrentDayOffset] = useState<number | null>(0);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [mainDateInput, setMainDateInput] = useState('');

  const dailyTotalsForChart: number[] = [];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const allReturns = returnsStorage.getAll();
    const allOrders = orderStorage.getAll();
    const allProducts = productStorage.getAll();
    const allUnknownProducts = unknownProductStorage.getAll();

    // Optimization: Create a map for quick product lookups (O(P+U))
    const productMap = new Map<string, Product | UnknownProduct>();
    allProducts.forEach(p => productMap.set(p.id, p));
    allUnknownProducts.forEach(p => productMap.set(p.id, p));

    const extendedReturns = allReturns.map(returnItem => {
      // O(1) lookup instead of O(P+U) .find()
      const productDetails = productMap.get(returnItem.productId);

      const extendedReturn: ExtendedReturn = {
        ...returnItem,
        productDetails,
      };
      if (!extendedReturn.refundAmount && productDetails) {
        extendedReturn.refundAmount = productDetails.price * returnItem.quantity;
      }
      return extendedReturn;
    });

    setReturns(extendedReturns);
    setOrders(allOrders);
    setProducts(allProducts);
    setUnknownProducts(allUnknownProducts);
  };

  const getCurrentDate = () => {
    if (currentDayOffset === null) {
      // This case should ideally not be used for date calculation, but as a fallback.
      return new Date();
    }
    const today = new Date();
    return addDays(today, currentDayOffset);
  };

  // Sync input field with date state
  useEffect(() => {
    const date = getCurrentDate();
    if (isValid(date)) {
      setMainDateInput(format(date, 'dd/MM/yyyy'));
    } else {
      setMainDateInput('');
    }
  }, [currentDayOffset]);

  const handleDateInputFormat = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 2) return cleaned;
    if (cleaned.length <= 4) return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4, 8)}`;
  };

  const handleMainDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = handleDateInputFormat(e.target.value);
    setMainDateInput(formatted);

    if (formatted.length === 10) {
      const [, , year] = formatted.split('/').map(Number);
      if (year >= 2025) { // Basic validation for year
        const parsedDate = parseDate(formatted, 'dd/MM/yyyy', new Date());
        if (isValid(parsedDate)) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const diffTime = parsedDate.getTime() - today.getTime();
          const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
          setCurrentDayOffset(diffDays);
        }
      }
    }
  };
  const filteredReturns = returns.filter(returnItem => {
    // If no date filter is active (currentDayOffset is null), show all returns.
    if (currentDayOffset === null) {
      return true;
    }

    // Apply date filter if a day offset is set.
    const selectedDate = getCurrentDate();
    selectedDate.setHours(0, 0, 0, 0);

    const returnDateStr = returnItem.createdAt || returnItem.date;
    if (!returnDateStr || !isValid(new Date(returnDateStr))) return false;
    const returnDate = new Date(returnDateStr);
    return returnDate.getFullYear() === selectedDate.getFullYear() &&
      returnDate.getMonth() === selectedDate.getMonth() &&
      returnDate.getDate() === selectedDate.getDate();
  });


  const totalReturnedQuantity = filteredReturns.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const totalReturnValue = filteredReturns.reduce((sum, returnItem) => sum + (returnItem.refundAmount ?? 0), 0);

  const handleAddReturn = () => {
    setSelectedOrder(null);
    setSelectedProductId(null);
    setReturnForm({
      reason: '',
      notes: '',
      returnQuantity: 1,
      refundAmount: 0
    });
    setShowAddDialog(true);
  };

  const handleSelectOrder = (order: Order) => {
    setSelectedOrder(order);
    setSelectedProductId(null); // Reset product selection when order changes
    // Reset form as well, or set based on a default/first product if desired
    setReturnForm({ reason: '', notes: '', returnQuantity: 1, refundAmount: 0 });
  };

  const handleSelectProduct = (productId: string) => {
    setSelectedProductId(productId);
    const selectedItem = selectedOrder?.items.find(item => item.productId === productId);
    if (selectedItem) {
      setReturnForm(prev => ({
        ...prev,
        returnQuantity: selectedItem.quantity,
        refundAmount: selectedItem.price * selectedItem.quantity
      }));
    }
  };

  const handleSubmitReturn = () => {
    if (!selectedOrder || !selectedProductId) {
      alert(t('pleaseSelectOrder'));
      return;
    }

    const selectedItem = selectedOrder.items.find(item => item.productId === selectedProductId);
    if (!selectedItem) {
      alert("Selected product not found in the order."); // Should not happen
      return;
    }

    if (!returnForm.reason.trim()) {
      alert(t('pleaseEnterReason'));
      return;
    }

    const newReturn: Return & { refundAmount: number } = {
      id: `${Date.now()}-${selectedItem.productId}`,
      orderId: selectedOrder.id,
      productId: selectedItem.productId,
      productName: selectedItem.productName,
      quantity: returnForm.returnQuantity,
      refundAmount: returnForm.refundAmount,
      reason: returnForm.reason,
      notes: returnForm.notes,
      status: 'pending',
      date: new Date().toISOString(),
      processedBy: 'current-user',
      processedAt: new Date().toISOString()
    };
    returnsStorage.add(newReturn);

    loadData();
    setShowAddDialog(false);
  };

  const handleEditReturn = (returnItem: ExtendedReturn) => {
    setSelectedReturn(returnItem);
    setReturnForm({
      reason: returnItem.reason || '',
      notes: returnItem.notes || '',
      returnQuantity: returnItem.quantity || 1,
      refundAmount: returnItem.refundAmount || 0
    });
    setShowEditDialog(true);
  };

  const handleUpdateReturn = () => {
    if (!selectedReturn) return;

    const updatedReturn = {
      ...selectedReturn,
      reason: returnForm.reason,
      notes: returnForm.notes,
      quantity: returnForm.returnQuantity,
      refundAmount: returnForm.refundAmount, // Ensure this is correct
      processedAt: new Date().toISOString()
    };

    returnsStorage.update(selectedReturn.id, updatedReturn);
    loadData();
    setShowEditDialog(false);
    setSelectedReturn(null);
  };

  const handleViewReturn = (returnItem: ExtendedReturn) => {
    setSelectedReturn(returnItem);
    setShowViewDialog(true);
  };

  const handleDeleteReturn = (id: string) => {
    returnsStorage.delete(id);
    loadData();
  };

  const handleApproveReturn = (id: string) => {
    const returnItem = returns.find(r => r.id === id);
    if (returnItem) {
      returnsStorage.update(id, { ...returnItem, status: 'approved' });
      loadData();
    }
  };

  const handleRejectReturn = (id: string) => {
    const returnItem = returns.find(r => r.id === id);
    if (returnItem) {
      returnsStorage.update(id, { ...returnItem, status: 'rejected' });
      loadData();
    }
  };

  const getReturnsChartData = () => {
    const labels: string[] = [];
    const data: number[] = [];
    dailyTotalsForChart.length = 0; // Clear for re-calculation
    const today = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      labels.push(dateLabel);

      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      const dayReturns = returns.filter(ret => {
        const returnDateStr = ret.createdAt || ret.date;
        if (!returnDateStr || isNaN(new Date(returnDateStr).getTime())) return false;
        const returnDate = new Date(returnDateStr);
        return returnDate >= dayStart && returnDate <= dayEnd;
      });

      const dailyTotalQuantity = dayReturns.reduce((sum, item) => sum + (item.quantity || 0), 0);
      const dailyTotalValue = dayReturns.reduce((sum, item) => sum + (item.refundAmount ?? 0), 0);

      data.push(dailyTotalQuantity);
      dailyTotalsForChart.push(dailyTotalValue);
    }
    return {
      labels,
      datasets: [{
        label: t('returns'),
        data: data,
        backgroundColor: 'rgba(239, 68, 68, 0.5)', borderColor: 'rgba(239, 68, 68, 1)', borderWidth: 1,
      }],
    };
  };

  const returnsChartData = getReturnsChartData();

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-primary-800 mb-2" data-lov-id="src/components/ReturnManagement.tsx:266:13">
              Returns
            </h2>
            <p className="text-gray-600" data-lov-id="src/components/ReturnManagement.tsx:269:13">
              Manage returns
            </p>
          </div>

        </div>

        {/* Date Navigation */}
        <div className="flex justify-center gap-2 items-center mb-2">
          <Button
            variant="outline"
            size="sm" className="h-10 bg-white"
            onClick={() => setCurrentDayOffset((currentDayOffset ?? 0) - 1)}
          >
            &larr;
          </Button>
          <div className="flex items-center gap-1">
            <Input
              placeholder="dd/mm/yyyy"
              value={mainDateInput}
              onChange={handleMainDateChange}
              className="w-36 justify-center text-center font-normal h-10 bg-white"
            />
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon" className="h-10 w-10 shrink-0 bg-white">
                  <CalendarDays className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <DynamicCalendar
                  selected={getCurrentDate()}
                  onDateSelect={(date) => {
                    if (date) {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const diffTime = date.getTime() - today.getTime();
                      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
                      setCurrentDayOffset(diffDays);
                    }
                  }}
                  t={t}
                  locale={dateFnsLocale}
                />
              </PopoverContent>
            </Popover>
          </div>
          <Button
            variant="outline"
            size="sm" className="h-10 bg-white"
            onClick={() => setCurrentDayOffset((currentDayOffset ?? -1) + 1)}
            disabled={currentDayOffset !== null && currentDayOffset >= 0}
          >
            &rarr;
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4"></div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('totalReturns')}</CardTitle>
              <RotateCcw className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalReturnedQuantity}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('totalReturnValue')}</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{totalReturnValue.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Returns Chart */}
        <Card>
          <CardHeader>
            <CardTitle>{t('monthlyReturnsStatistics')}</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart data={returnsChartData} options={{
              scales: {
                y: {
                  ticks: {
                    precision: 0
                  }
                }
              },
              plugins: {
                tooltip: {
                  callbacks: {
                    label: (context) => {
                      const returnsCount = context.parsed.y;
                      return `${t('returns')}: ${returnsCount}`;
                    },
                    afterLabel: (context) => `${t('totalReturnValue')}: ${dailyTotalsForChart[context.dataIndex].toFixed(2)}`
                  }
                }
              }
            }} />
          </CardContent>
        </Card>

        {/* Returns Table */}
        <Card>
          <CardHeader>
            <CardTitle>{t('returns')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center">Name</TableHead>
                    <TableHead className="text-center">{t('quantity')}</TableHead>
                    <TableHead className="text-center">Amount</TableHead>
                    <TableHead className="text-center">Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReturns.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-gray-500">
                        {t('noReturns')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    [...filteredReturns].sort((a, b) => {
                      const dateA = new Date(a.processedAt || a.createdAt || a.date);
                      const dateB = new Date(b.processedAt || b.createdAt || b.date);
                      if (!isValid(dateA) || !isValid(dateB)) return 0;
                      return dateB.getTime() - dateA.getTime();
                    })
                      .map((returnItem) => {
                        const returnValue = returnItem.refundAmount || 0;
                        return (
                          <TableRow key={returnItem.id} className="hover:bg-gray-50">
                            <TableCell className="text-center">
                              <div className="font-medium">
                                {returnItem.productDetails?.name || t('unknownProduct')}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="secondary" className="text-sm font-medium">
                                {parseInt(String(returnItem.quantity), 10)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="font-medium text-red-600">
                                {returnValue.toFixed(2)}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              {isValid(new Date(returnItem.processedAt || returnItem.createdAt || returnItem.date))
                                ? format(new Date(returnItem.processedAt || returnItem.createdAt || returnItem.date), 'HH:mm')
                                : 'N/A'
                              }
                            </TableCell>
                          </TableRow>
                        );
                      })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Return Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('addReturn')}</DialogTitle>
            <DialogDescription>{t('selectOrderForReturn')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Order Selection */}
            <div>
              <Label>{t('selectOrder')}</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 max-h-60 overflow-y-auto">
                {orders
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .slice(0, 20)
                  .map((order) => (
                    <Card
                      key={order.id}
                      className={`cursor-pointer transition-colors ${selectedOrder?.id === order.id ? 'ring-2 ring-primary' : 'hover:bg-gray-50'
                        }`}
                      onClick={() => handleSelectOrder(order)}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-medium">#{order.id}</div>
                          <div className="text-sm text-gray-500">
                            {format(new Date(order.createdAt), 'dd/MM HH:mm')}
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          {order.items.length} {t('items')}
                        </div>
                        <div className="font-bold">
                          {order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                }
              </div>
            </div>

            {/* Product Selection */}
            {selectedOrder && (
              <div>
                <Label>{t('selectProduct')}</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 max-h-40 overflow-y-auto">
                  {selectedOrder.items.map(item => (
                    <Card
                      key={item.productId}
                      className={`cursor-pointer transition-colors ${selectedProductId === item.productId ? 'ring-2 ring-primary' : 'hover:bg-gray-50'
                        }`}
                      onClick={() => handleSelectProduct(item.productId)}
                    >
                      <CardContent className="p-3">
                        <div className="font-medium">{item.productName}</div>
                        <div className="text-sm text-gray-500">
                          {t('quantity')}: {item.quantity} | {t('price')}: {item.price.toFixed(2)}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            {/* Return Details */}
            {selectedOrder && (
              <div className="space-y-4">
                <div>
                  <Label>{t('reason')}</Label>
                  <Select
                    value={returnForm.reason}
                    onValueChange={(value) => setReturnForm(prev => ({ ...prev, reason: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('selectReason')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="defective">{t('defective')}</SelectItem>
                      <SelectItem value="wrong-item">{t('wrongItem')}</SelectItem>
                      <SelectItem value="customer-request">{t('customerRequest')}</SelectItem>
                      <SelectItem value="damaged">{t('damaged')}</SelectItem>
                      <SelectItem value="other">{t('other')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>{t('returnQuantity')}</Label>
                  <Input
                    type="number"
                    min="1"
                    max={selectedOrder.items.find(i => i.productId === selectedProductId)?.quantity || 1}
                    value={returnForm.returnQuantity}
                    onChange={(e) => {
                      const newQuantity = parseInt(e.target.value) || 1;
                      const price = selectedOrder.items.find(i => i.productId === selectedProductId)?.price || 0;
                      setReturnForm(prev => ({ ...prev, returnQuantity: newQuantity, refundAmount: newQuantity * price }));
                    }}
                  />
                </div>

                <div>
                  <Label>{t('refundAmount')}</Label>
                  <Input
                    type="number"
                    step="1"
                    value={returnForm.refundAmount}
                    onChange={(e) => setReturnForm(prev => ({ ...prev, refundAmount: parseFloat(e.target.value) || 0 }))}
                  />
                </div>

                <div>
                  <Label>{t('notes')}</Label>
                  <Textarea
                    value={returnForm.notes}
                    onChange={(e) => setReturnForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder={t('additionalNotes')}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={handleSubmitReturn} disabled={!selectedOrder || !selectedProductId}>
              {t('submitReturn')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Return Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('editReturn')}</DialogTitle>
            <DialogDescription>
              Edit the return details including reason, quantity, and notes.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>{t('reason')}</Label>
              <Input
                value={returnForm.reason}
                onChange={(e) => setReturnForm(prev => ({ ...prev, reason: e.target.value }))}
              />
            </div>

            <div>
              <Label>{t('returnQuantity')}</Label>
              <Input
                type="number"
                min="1"
                value={returnForm.returnQuantity}
                onChange={(e) => setReturnForm(prev => ({ ...prev, returnQuantity: parseInt(e.target.value) || 1 }))}
              />
            </div>

            <div>
              <Label>{t('refundAmount')}</Label>
              <Input
                type="number"
                step="1"
                value={returnForm.refundAmount}
                onChange={(e) => setReturnForm(prev => ({ ...prev, refundAmount: parseFloat(e.target.value) || 0 }))}
              />
            </div>

            <div>
              <Label>{t('notes')}</Label>
              <Textarea
                value={returnForm.notes}
                onChange={(e) => setReturnForm(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={handleUpdateReturn}>
              {t('save')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Return Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('returnDetails')}</DialogTitle>
            <DialogDescription>
              View detailed information about this return including product, order, and processing details.
            </DialogDescription>
          </DialogHeader>

          {selectedReturn && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">{t('product')}</Label>
                  <div className="font-medium">{selectedReturn.productDetails?.name || t('unknownProduct')}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">{t('order')}</Label>
                  <div className="font-medium">#{selectedReturn.orderId}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">{t('quantity')}</Label>
                  <div className="font-medium">{selectedReturn.quantity}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">{t('refundAmount')}</Label>
                  <div className="font-medium">{selectedReturn.refundAmount?.toFixed(2) || '0.00'}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">{t('status')}</Label>
                  <Badge
                    variant={selectedReturn.status === 'approved' ? 'default' :
                      selectedReturn.status === 'rejected' ? 'destructive' : 'secondary'}
                  >
                    {t(selectedReturn.status || 'pending')}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">{t('date')}</Label>
                  <div className="font-medium">
                    {format(new Date(selectedReturn.createdAt || selectedReturn.date), 'yyyy-MM-dd HH:mm')}
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">{t('reason')}</Label>
                <div className="font-medium">{selectedReturn.reason || '—'}</div>
              </div>

              {selectedReturn.notes && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">{t('notes')}</Label>
                  <div className="font-medium">{selectedReturn.notes}</div>
                </div>
              )}

              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setShowViewDialog(false)}>
                  {t('close')}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ReturnManagement;