import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  Edit, 
  Trash2, 
  Search,
  DollarSign,
  ShoppingCart,
  User,
  Eye,
} from 'lucide-react';
import { RotateCcw, Link, Unlink, Check, ChevronsUpDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';


import { UnknownProduct, unknownProductStorage, Product, productStorage } from '@/lib/storage';
import { format } from 'date-fns';

const UnknownProductManagement: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const [unknownProducts, setUnknownProducts] = useState<UnknownProduct[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'unlinked' | 'linked'>('unlinked');
  const [showConvertDialog, setShowConvertDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<UnknownProduct | null>(null);
  const [convertForm, setConvertForm] = useState({
    name: '',
    serialNumber: '',
    purchasePrice: '',
    tax: ''
  });
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editProduct, setEditProduct] = useState<UnknownProduct | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    price: '',
    quantity: '',
  });
  const [showAddToProductsDialog, setShowAddToProductsDialog] = useState(false);
  const [selectedProductForAdd, setSelectedProductForAdd] = useState<UnknownProduct | null>(null);
  const [addToProductsForm, setAddToProductsForm] = useState({
    targetProductName: ''
  });
  const [addToProductsError, setAddToProductsError] = useState('');
  const [popoverOpen, setPopoverOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  // مرجع خاص لحقل السعر في نموذج التحويل
  const unknownProductPriceRef = useRef<HTMLInputElement>(null);

  // التركيز تلقائيًا على حقل السعر عند فتح Dialog التحويل
  useEffect(() => {
    if (showConvertDialog) {
      setTimeout(() => {
        unknownProductPriceRef.current?.focus();
      }, 100);
    }
  }, [showConvertDialog]);
  const [related, setRelated] = useState<UnknownProduct[]>([]);
  const [unrelated, setUnrelated] = useState<UnknownProduct[]>([]);
  const [showRelated, setShowRelated] = useState(false);
  const [showUnrelated, setShowUnrelated] = useState(false);

  // دالة لجلب المنتجات المرتبطة وغير المرتبطة
  const fetchRelatedProducts = () => {
    const unknowns = unknownProductStorage.getAll();
    const products = productStorage.getAll();
    setRelated(
      unknowns.filter(up => products.some(p => p.name.toLowerCase() === up.name.toLowerCase()))
    );
    setUnrelated(
      unknowns.filter(up => !products.some(p => p.name.toLowerCase() === up.name.toLowerCase()))
    );
  };

  const loadUnknownProducts = useCallback(() => {
    let products = unknownProductStorage.getAll();
    setUnknownProducts(products);
  }, []);

  const reloadData = useCallback(() => {
    loadUnknownProducts();
    fetchRelatedProducts();
  }, [loadUnknownProducts]);

  useEffect(() => {
    reloadData();
  }, [reloadData]);

  const filteredProducts = [...unknownProducts]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .filter(product => {
      if (viewMode === 'linked') {
        return !!product.linkedProductId && !product.hidden;
      }
      // Default to 'unlinked'
      return !product.linkedProductId;
    })
    .filter(product => product.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter(product => product.id !== '1752065345097');

  const handleConvertToProduct = (product: UnknownProduct) => {
    setSelectedProduct(product);
    setConvertForm({
      name: product.name,
      serialNumber: '',
      purchasePrice: '',
      tax: ''
    });
    setShowConvertDialog(true);
  };

  const handleConfirmConvert = () => {
    if (!selectedProduct || !convertForm.name.trim() || !convertForm.serialNumber.trim()) {
      return;
    }

    const purchasePrice = parseFloat(convertForm.purchasePrice) || 0;
    const tax = parseFloat(convertForm.tax) || 0;

    try {
      // تحويل المنتج المجهول إلى منتج عادي
      const newProduct = unknownProductStorage.convertToProduct(
        selectedProduct.id,
        convertForm.name.trim(),
        convertForm.serialNumber.trim(),
        purchasePrice,
        tax
      );

      if (newProduct) {
        // **الإصلاح**: تحديث المنتج الجديد بالمبيعات والأرباح من المنتج المجهول
        const soldUnits = selectedProduct.price > 0 ? Math.round(selectedProduct.totalSales / selectedProduct.price) : 0;
        const profit = selectedProduct.totalSales - (soldUnits * purchasePrice);

        productStorage.update(newProduct.id, {
          sold: soldUnits,
          totalSales: selectedProduct.totalSales,
          profit: profit,
        });

        // حذف المنتج المجهول بعد تحويله بنجاح
        unknownProductStorage.delete(selectedProduct.id);

        // إعادة تحميل البيانات
        reloadData();
        setShowConvertDialog(false);
        setSelectedProduct(null);
        window.dispatchEvent(new Event('storage-updated'));
      }
    } catch (error) {
      console.error('Error converting product:', error);
    }
  };

  const handleEditProduct = (product: UnknownProduct) => {
    setEditProduct(product);
    setEditForm({
      name: product.name,
      price: String(product.price),
      quantity: String(product.quantity),
    });
    setShowEditDialog(true);
  };

  const handleSaveEdit = () => {
    if (!editProduct) return;
    
    try {
      const updatedProduct = {
        ...editProduct,
        name: editForm.name,
        price: parseFloat(editForm.price) || 0,
        quantity: parseInt(editForm.quantity) || 0,
      };
      
      // تحديث المنتج في التخزين
      unknownProductStorage.update(editProduct.id, {
        name: editForm.name,
        price: parseFloat(editForm.price) || 0,
        quantity: parseInt(editForm.quantity) || 0,
      });
      
      // إعادة تحميل البيانات
      reloadData();
      setShowEditDialog(false);
      setEditProduct(null);
      setEditForm({ name: '', price: '', quantity: '' });
      // إرسال حدث تحديث البيانات
      window.dispatchEvent(new Event('storage-updated'));
    } catch (error) {
      console.error('Error updating unknown product:', error);
    }
  };

  const handleViewProduct = (product: UnknownProduct) => {
    // يمكن إضافة نافذة منبثقة لعرض تفاصيل المنتج
    alert(`${t('productName')}: ${product.name}\n${t('price')}: ${product.price.toFixed(2)}\n${t('quantity')}: ${product.quantity}\n${t('totalSales')}: ${product.totalSales.toFixed(2)}`);
  };

  const handleDeleteProduct = (id: string) => {
    if (window.confirm(t('confirmDelete') || 'Are you sure you want to delete this item?')) {
      const productToDelete = unknownProductStorage.getById(id);
      if (!productToDelete) return;

      // إذا كان المنتج المجهول مرتبطًا بمنتج مسجل،
      // لا تقم بعكس التغييرات على المنتج المسجل.
      // فقط احذف سجل المنتج المجهول.
      const success = unknownProductStorage.delete(id);
  
      if (success) {
        console.log(`Unknown product with ID ${id} was deleted without affecting linked product sales/profit.`);
        reloadData();
        // إرسال حدث تحديث البيانات
        window.dispatchEvent(new Event('storage-updated'));
        window.dispatchEvent(new Event('admin-dashboard-force-update'));
      }
    }
  };

  const handleAddToProducts = (product: UnknownProduct) => {
    setSelectedProductForAdd(product);
    setAddToProductsForm({ targetProductName: '' });
    setAddToProductsError('');
    setShowAddToProductsDialog(true);
  };

  const handleConfirmAddToProducts = async () => {
    if (!selectedProductForAdd || !addToProductsForm.targetProductName.trim()) {
      setAddToProductsError('يرجى إدخال اسم المنتج المسجل.');
      return;
    }

    try {
      const existingProduct = productStorage.getAll().find(p => 
        p.name.toLowerCase() === addToProductsForm.targetProductName.toLowerCase()
      );

      if (existingProduct) {
        // التحقق من تطابق سعر البيع
        if (existingProduct.price !== selectedProductForAdd.price) {
          setAddToProductsError('Target product name not same selling price');
          return;
        }

        // 1. حساب الوحدات المباعة من المنتج المجهول (نفس ما كانت)
        const soldUnits = selectedProductForAdd.price > 0 
          ? Math.round(selectedProductForAdd.totalSales / selectedProductForAdd.price) 
          : 0;

        // 2. **الإصلاح**: حساب الربح المضاف بناءً على ربحية المنتج المسجل
        const profitPerUnit = existingProduct.price - (existingProduct.purchasePrice || 0);
        const addedProfit = soldUnits * profitPerUnit;

        // 3. تحديث المنتج المسجل
        productStorage.update(existingProduct.id, {
          ...existingProduct,
          sold: (existingProduct.sold || 0) + soldUnits,
          quantity: (existingProduct.quantity || 0) - soldUnits,
          totalSales: (existingProduct.totalSales || 0) + selectedProductForAdd.totalSales,
          profit: (existingProduct.profit || 0) + addedProfit,
        });

        // 4. تحديث المنتج المجهول لربطه بالمنتج المسجل وحذفه من القائمة
        unknownProductStorage.update(selectedProductForAdd.id, {
          ...selectedProductForAdd,
          linkedProductId: existingProduct.id,
          addedProfit: addedProfit, // **الإصلاح**: تسجيل الربح المضاف في سجل المنتج المجهول
        });

        // 5. إعادة تحميل البيانات لتحديث الواجهة فوراً
        reloadData();

        // 6. إغلاق النافذة وإعادة تعيين النماذج
        setShowAddToProductsDialog(false);
        setSelectedProductForAdd(null);
        setAddToProductsForm({ targetProductName: '' });
        setAddToProductsError('');

        // 7. إرسال حدث لتحديث البيانات في باقي أجزاء التطبيق
        window.dispatchEvent(new Event('storage-updated'));
        // إرسال حدث إضافي لإجبار تحديث لوحة التحكم الرئيسية
        window.dispatchEvent(new Event('admin-dashboard-force-update'));

      } else {
        setAddToProductsError('المنتج المسجل غير موجود. تأكد من كتابة الاسم بشكل صحيح.');
      }
    } catch (error) {
      console.error('Error linking products:', error);
      setAddToProductsError('حدث خطأ أثناء ربط المنتجات.');
    }
  };

  const handleCloseAddToProductsDialog = () => {
    setShowAddToProductsDialog(false);
    setAddToProductsForm({ targetProductName: '' });
    setAddToProductsError('');
    setSelectedProductForAdd(null);
  };

  const handleUnlinkProduct = (unknownProductId: string) => {
    const unknownProduct = unknownProductStorage.getById(unknownProductId);
    if (!unknownProduct || !unknownProduct.linkedProductId) return;

    const mainProduct = productStorage.getById(unknownProduct.linkedProductId);

    if (mainProduct) {
      // عكس التغييرات التي تم إجراؤها على المنتج الرئيسي
      const soldUnitsToSubtract = unknownProduct.price > 0 
        ? Math.round(unknownProduct.totalSales / unknownProduct.price) 
        : 0;
      
      const profitToSubtract = unknownProduct.addedProfit || 0;

      productStorage.update(mainProduct.id, {
        ...mainProduct,
        sold: Math.max(0, (mainProduct.sold || 0) - soldUnitsToSubtract),
        quantity: (mainProduct.quantity || 0) + soldUnitsToSubtract,
        totalSales: (mainProduct.totalSales || 0) - unknownProduct.totalSales,
        profit: (mainProduct.profit || 0) - profitToSubtract,
      });
    }

    // تحديث المنتج المجهول لإزالة الربط
    unknownProductStorage.update(unknownProductId, {
      ...unknownProduct,
      linkedProductId: undefined,
      addedProfit: undefined,
    });

    // إعادة تحميل البيانات وتحديث الواجهة
    reloadData();
    window.dispatchEvent(new Event('storage-updated'));
    window.dispatchEvent(new Event('admin-dashboard-force-update'));

    // toast({
    //   title: t('unlinkedSuccessfully'),
    // });
  };

  // Reset form when dialog opens
  useEffect(() => {
    if (showAddToProductsDialog && selectedProductForAdd) {
      setAddToProductsForm({ targetProductName: '' });
      setAddToProductsError('');
    }
  }, [showAddToProductsDialog, selectedProductForAdd]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {t('unknownProducts')}
          </CardTitle>
          <CardDescription>
            {t('unknownProductsDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* شريط التاريخ المبسط */}
          {/* تم حذف الأزرار هنا */}
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder={t('searchProducts')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* أزرار عرض المنتجات المرتبطة وغير المرتبطة */}
          <div className="flex justify-center gap-2 mb-4">
            <Button variant={viewMode === 'unlinked' ? 'default' : 'outline'} onClick={() => setViewMode('unlinked')}>
              {t('Unlinked')}
            </Button>
            <Button variant={viewMode === 'linked' ? 'default' : 'outline'} onClick={() => setViewMode('linked')}>
              {t('linked')}
            </Button>
          </div>

          {/* أزرار عرض المنتجات المرتبطة وغير المرتبطة */}
          {/* احذف كل ما يخص أزرار وجداول المنتجات المرتبطة وغير المرتبطة */}

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className={isRTL ? "text-right" : "text-left"}>{t('name')}</TableHead>
                  <TableHead className="text-center">{t('price')}</TableHead>
                  <TableHead className="text-center">{t('quantity')}</TableHead>
                  <TableHead className="text-center">{t('totalAmount')}</TableHead>
                  <TableHead className="text-center">{t('time')}</TableHead>
                  <TableHead className="text-center">{t('date')}</TableHead>
                  <TableHead className="text-center">{t('role') || 'Role'}</TableHead>
                  <TableHead className="text-center">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      {t('noUnknownProducts')}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => {
                    const createdAt = new Date(product.createdAt);
                    // Format time and date in English (Gregorian)
                    const time = format(createdAt, 'HH:mm');
                    const date = createdAt.toLocaleDateString('en-GB');
                    // Ensure product ID is shown in English digits
                    const productId = String(product.id);
                    return (
                      <TableRow key={product.id}>
                        <TableCell className={`font-medium ${isRTL ? "text-right" : "text-left"}`}>
                          <div className={`flex items-center ${isRTL ? "justify-end" : "justify-start"} gap-2`}>
                            <span>{product.name}</span>                           
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            {product.price.toFixed(2)}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{product.quantity}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <DollarSign className="h-4 w-4 text-blue-600" />
                            {product.totalSales.toFixed(2)}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {time}
                        </TableCell>
                        <TableCell className="text-center">
                          {date}
                        </TableCell>
                        <TableCell className="text-center">{product.cashierName || product.cashierId || '—'}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            {/* حذف زر التعديل */}
                            {/* <Button size="icon" variant="ghost" onClick={() => handleEditProduct(product)} title={t('edit')}>
                              <Edit className="h-4 w-4" />
                            </Button> */}
                            {/* Add to products button */}
                            <Button 
                              size="icon" 
                              variant="outline" 
                              onClick={() => handleAddToProducts(product)} 
                              title={viewMode === 'linked' ? (t('changeLink') || 'Change Link') : (('Add to products'))}
                            >
                              {viewMode === 'linked' ? (
                                <Unlink className="h-4 w-4" />
                              ) : (
                                <Link className="h-4 w-4" />
                              )}
                            </Button>
                            {viewMode === 'linked' && (
                            <Button size="icon" variant="outline" onClick={() => handleUnlinkProduct(product.id)} title={t('unlink') || 'Unlink'}>
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                            )}
                            {/* زر الحذف/الإخفاء */}
                            <Button 
                              size="icon" 
                              variant="destructive" 
                              onClick={() => handleDeleteProduct(product.id)} 
                              title={t('remove') || 'Remove'}>
                                <Trash2 className="h-4 w-4" />
                            </Button>                          
                          </div>
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

      {/* جدول المنتجات المرتبطة */}
      {/* احذف كل ما يخص أزرار وجداول المنتجات المرتبطة وغير المرتبطة */}

      {/* جدول المنتجات غير المرتبطة */}
      {/* احذف كل ما يخص أزرار وجداول المنتجات المرتبطة وغير المرتبطة */}

      {/* Convert Dialog */}
      <Dialog open={showConvertDialog} onOpenChange={setShowConvertDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('convertToProduct')}</DialogTitle>
            <DialogDescription>
              {t('convertToProductDescription')}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleConfirmConvert(); }} className="space-y-4">
            <div>
              <label htmlFor="productName" className="text-sm font-medium">{t('productName')}</label>
              <Input
                id="productName"
                type="text"
                autoComplete="off"
                value={convertForm.name}
                onChange={(e) => setConvertForm({ ...convertForm, name: e.target.value })}
                placeholder={t('enterProductName')}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const serialInput = document.getElementById('serialNumber');
                    if (serialInput) {
                      (serialInput as HTMLInputElement).focus();
                    }
                  }
                }}
              />
            </div>
            <div>
              <label htmlFor="serialNumber" className="text-sm font-medium">{t('serialNumber')}</label>
              <Input
                id="serialNumber"
                type="text"
                autoComplete="off"
                value={convertForm.serialNumber}
                onChange={(e) => setConvertForm({ ...convertForm, serialNumber: e.target.value })}
                placeholder={t('enterSerialNumber')}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const priceInput = document.getElementById('purchasePrice');
                    if (priceInput) {
                      (priceInput as HTMLInputElement).focus();
                    }
                  }
                }}
              />
            </div>
            <div>
              <label htmlFor="purchasePrice" className="text-sm font-medium">{t('purchasePrice')}</label>
              <Input
                id="purchasePrice"
                type="number"
                step="1"
                min="0"
                autoComplete="off"
                value={convertForm.purchasePrice}
                onChange={(e) => setConvertForm({ ...convertForm, purchasePrice: e.target.value })}
                placeholder={t('enterPurchasePrice')}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const taxInput = document.getElementById('tax');
                    if (taxInput) {
                      (taxInput as HTMLInputElement).focus();
                    }
                  }
                }}
              />
            </div>
            <div>
              <label htmlFor="tax" className="text-sm font-medium">{t('tax')}</label>
              <Input
                id="tax"
                type="number"
                step="1"
                min="0"
                autoComplete="off"
                value={convertForm.tax}
                onChange={(e) => setConvertForm({ ...convertForm, tax: e.target.value })}
                placeholder={t('enterTax')}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleConfirmConvert();
                  }
                }}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowConvertDialog(false)}>
                {t('cancel')}
              </Button>
              <Button 
                type="submit"
                disabled={!convertForm.name.trim() || !convertForm.serialNumber.trim()}
              >
                {t('convert')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('edit')} {editProduct?.name}</DialogTitle>
            <DialogDescription>
              {t('updateProductDescription') || 'Update the product details and save your changes.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">{t('productName')}</label>
              <Input
                value={editForm.name}
                onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                placeholder={t('enterProductName')}
              />
            </div>
            <div>
              <label className="text-sm font-medium">{t('price')}</label>
              <Input
                type="number"
                value={editForm.price}
                onChange={e => setEditForm({ ...editForm, price: e.target.value })}
                placeholder={t('price')}
              />
            </div>
            <div>
              <label className="text-sm font-medium">{t('quantity')}</label>
              <Input
                type="number"
                value={editForm.quantity}
                onChange={e => setEditForm({ ...editForm, quantity: e.target.value })}
                placeholder={t('quantity')}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>{t('cancel')}</Button>
              <Button onClick={handleSaveEdit}>{t('save')}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add to Products Dialog */}
      <Dialog open={showAddToProductsDialog} onOpenChange={handleCloseAddToProductsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{('Add to products')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">{t('unknownProduct')}</label>
              <p className="text-sm text-gray-600">{selectedProductForAdd?.name}</p>
              <div className="mt-1 text-sm text-gray-500">
                {t('price')}: {selectedProductForAdd?.price.toFixed(2)} | {t('quantity')}: {selectedProductForAdd?.quantity}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">{('Target product name')}</label>
              <Command shouldFilter={false}>
                <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={popoverOpen}
                      className="w-full justify-between h-10"
                    >
                      {addToProductsForm.targetProductName
                        ? productStorage.getAll()?.find(p => p.name === addToProductsForm.targetProductName)?.name
                        : t('searchProducts')}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandInput placeholder={t('searchProducts')} />
                      <CommandList>
                        <CommandEmpty>{t('noProductsFound')}</CommandEmpty>
                        <CommandGroup style={{ maxHeight: '12rem', overflowY: 'auto' }}>
                        {(productStorage.getAll() || [])
                          .map((p) => (
                            <CommandItem
                              key={p.id}
                              value={p.name}
                              onSelect={(currentValue) => {
                                setAddToProductsForm({ targetProductName: currentValue === addToProductsForm.targetProductName.toLowerCase() ? '' : p.name });
                                setPopoverOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  addToProductsForm.targetProductName.toLowerCase() === p.name.toLowerCase() ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {p.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </Command>
            </div>
            {addToProductsError && (
              <div className="text-red-600 text-sm">{addToProductsError}</div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleCloseAddToProductsDialog}>
                {t('cancel')}
              </Button>
              <Button 
                onClick={handleConfirmAddToProducts}
                disabled={!addToProductsForm.targetProductName.trim()}
              >
                {t('confirm')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UnknownProductManagement;