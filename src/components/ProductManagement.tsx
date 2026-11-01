import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Edit, Trash2, ArrowLeft, Package, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Product, Category, categoryStorage as defaultCategoryStorage } from '@/lib/storage';
import AddCategoryForm from './AddCategoryForm';
import EditCategoryForm from './EditCategoryForm';
import { managedProductStorage as productStorage, managedCategoryStorage as categoryStorage, managedBillStorage as billStorage } from '@/lib/managedStorage';
import { startOfDay, endOfDay } from 'date-fns';

interface ProductManagementProps {
  onBack: () => void;
}

const ProductManagement: React.FC<ProductManagementProps> = ({ onBack }) => {
  const { t, isRTL } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    serialNumber: '',
    price: '',
    purchasePrice: '',
    tax: '',
    quantity: '',
    categoryId: 'none',
    serialNumbers: ['']
  });

  const [serialNumbers, setSerialNumbers] = useState<string[]>(formData.serialNumbers ? formData.serialNumbers.map(String) : ['']);

  // Load products and categories on component mount
  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const loadProducts = () => {
    const allProducts = productStorage.getAll();
    setProducts(allProducts);
  };

  const loadCategories = () => {
    const allCategories = categoryStorage.getAll();
    setCategories(allCategories);
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.serialNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategoryId === 'all' ||
      product.categoryId === selectedCategoryId ||
      (!product.categoryId && selectedCategoryId === 'uncategorized');

    return matchesSearch && matchesCategory;
  });

  const handleAddProduct = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      serialNumber: '',
      price: '',
      purchasePrice: '',
      tax: '',
      quantity: '',
      categoryId: '',
      serialNumbers: ['']
    });
    setSerialNumbers(['']);
    setShowAddDialog(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      serialNumber: product.serialNumber,
      price: product.price.toString(),
      purchasePrice: product.purchasePrice.toString(),
      tax: product.tax.toString(),
      quantity: product.quantity.toString(),
      categoryId: product.categoryId || 'none',
      serialNumbers: Array.isArray(product.serialNumbers) && product.serialNumbers.length > 0
        ? [product.serialNumber].map(String)
        : (product.serialNumber ? [String(product.serialNumber)] : [''])
    });
    setSerialNumbers(Array.isArray(product.serialNumbers) && product.serialNumbers.length > 0
      ? product.serialNumbers.map(String)
      : (product.serialNumber ? [String(product.serialNumber)] : [''])
    );
    setShowAddDialog(true);
  };

  const handleDeleteProduct = (productId: string) => {
    const success = productStorage.delete(productId);
    if (success) {
      loadProducts();
      // إرسال حدث تحديث البيانات
      window.dispatchEvent(new Event('storage-updated'));
    }
  };

  const handleSerialChange = (idx: number, value: string) => {
    setSerialNumbers(prev => prev.map((s, i) => i === idx ? value : s));
  };

  // Update Product interface to include serialNumbers
  interface Product {
    id: string;
    name: string;
    serialNumber: string;
    serialNumbers?: string[];
    price: number;
    purchasePrice: number;
    tax: number;
    quantity: number;
    totalSales?: number;
    categoryId?: string;
  }

  const handleAddSerial = () => setSerialNumbers(prev => [...prev, '']);

  const handleRemoveSerial = (idx: number) => setSerialNumbers(prev => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Check for duplicate serial numbers
      const allProducts = productStorage.getAll();
      const currentSerials = serialNumbers.map(String).filter(s => s.trim() !== '');

      const duplicate = allProducts.find(p => {
        if (editingProduct && p.id === editingProduct.id) return false;
        const existingSerials = Array.isArray((p as any).serialNumbers)
          ? (p as any).serialNumbers
          : [p.serialNumber];
        return currentSerials.some(sn => existingSerials.includes(sn));
      });

      if (duplicate) {
        alert(`${t('serialNumberAlreadyExists') || 'Serial number already exists'}: ${duplicate.name}`);
        setIsLoading(false);
        return;
      }

      const productData = {
        ...formData,
        serialNumbers: serialNumbers.map(String),
        serialNumber: serialNumbers[0] || '',
        name: formData.name.trim(),
        price: parseFloat(formData.price) || 0,
        purchasePrice: parseFloat(formData.purchasePrice) || 0,
        tax: parseFloat(formData.tax) || 0,
        quantity: parseInt(formData.quantity) || 0,
        categoryId: formData.categoryId === 'none' ? undefined : formData.categoryId,
        totalSales: editingProduct ? editingProduct.totalSales || 0 : 0
      };

      if (editingProduct) {
        productStorage.update(editingProduct.id, productData);
      } else {
        productStorage.add(productData);

        // Create a bill for the new product purchase
        const totalCost = (productData.purchasePrice || 0) * (productData.quantity || 0);
        if (totalCost > 0) {
          billStorage.add({
            title: 'goods',
            amount: totalCost,
            dueDate: new Date().toISOString().split('T')[0],
            status: 'paid',
            description: `${productData.name} (Qty: ${productData.quantity})`,
            role: 'Admin'
          } as any);
        }
      }

      setShowAddDialog(false);
      loadProducts();
      // إرسال حدث تحديث البيانات
      window.dispatchEvent(new Event('storage-updated'));
    } catch (error) {
      // toast({
      //   title: t('error'),
      //   description: t('productSaveError'),
      //   variant: 'destructive'
      // });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === 'purchasePrice' && parseFloat(value) < 0) {
      return;
    }
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveCategory = (category: Category) => {
    loadCategories();
    setShowCategoryDialog(false);
    setEditingCategory(null);
    window.dispatchEvent(new Event('storage-updated'));
  };

  const handleDeleteCategory = (categoryId: string) => {
    categoryStorage.delete(categoryId);
    loadCategories(); // Reload categories
    setShowCategoryDialog(false); // Close the dialog
    setEditingCategory(null); // Reset editing state
  };

  const handleAddCategory = () => {
    setEditingCategory(null);
    setShowCategoryDialog(true);
  };

  const handleEditCategoryClick = (category: Category) => {
    setEditingCategory(category);
    setShowCategoryDialog(true);
  };





  const [showAddQuantityDialog, setShowAddQuantityDialog] = useState(false);
  const [addQuantityForm, setAddQuantityForm] = useState({
    productName: '',
    serialNumber: '',
    quantity: '',
    purchasePrice: '',
    price: '',
  });

  const handleAddQuantitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true); // This should be handled better, maybe a separate loading state

    try {
      const product = products.find(p => p.name === addQuantityForm.productName);
      if (!product) {
        alert(t('productNotFound'));
        setIsLoading(false);
        return;
      }

      const quantityToAdd = parseInt(addQuantityForm.quantity) || 0;
      const purchasePrice = parseFloat(addQuantityForm.purchasePrice) || 0;
      const price = parseFloat(addQuantityForm.price) || 0;
      const newSerial = addQuantityForm.serialNumber.trim();

      if (quantityToAdd <= 0) {
        alert(t('quantityMustBePositive'));
        setIsLoading(false);
        return;
      }

      // Check for duplicate serial number in other products
      if (newSerial) {
        const allProducts = productStorage.getAll();
        const duplicate = allProducts.find(p => {
          if (p.id === product.id) return false;
          const existingSerials = Array.isArray((p as any).serialNumbers)
            ? (p as any).serialNumbers
            : [p.serialNumber];
          return existingSerials.includes(newSerial);
        });

        if (duplicate) {
          alert(`${t('serialNumberAlreadyExists') || 'Serial number already exists'}: ${duplicate.name}`);
          setIsLoading(false);
          return;
        }
      }

      // تحديث مصفوفة serialNumbers
      const updatedSerialNumbers = Array.isArray(product.serialNumbers) ? [...product.serialNumbers] : [];
      if (newSerial && !updatedSerialNumbers.includes(newSerial)) {
        updatedSerialNumbers.push(newSerial);
      }

      const updatedProduct = {
        ...product,
        quantity: (product.quantity || 0) + quantityToAdd,
        purchasePrice: purchasePrice,
        price: price,
        serialNumbers: updatedSerialNumbers,
        serialNumber: updatedSerialNumbers[0] || product.serialNumber || ''
      };

      productStorage.update(product.id, updatedProduct);

      // Create a bill for the added quantity purchase
      const totalCost = (purchasePrice || 0) * (quantityToAdd || 0);
      if (totalCost > 0) {
        billStorage.add({
          title: 'goods',
          amount: totalCost,
          dueDate: new Date().toISOString().split('T')[0],
          status: 'paid',
          description: `${product.name} (Qty: ${quantityToAdd})`,
          role: 'Admin'
        } as any);
      }
      loadProducts();
      setShowAddQuantityDialog(false);
      setAddQuantityForm({
        productName: '',
        serialNumber: '',
        quantity: '',
        purchasePrice: '',
        price: '',
      });
      window.dispatchEvent(new Event('storage-updated'));
    } catch (error) {
      // toast({
      //   title: t('error'),
      //   description: t('productSaveError'),
      //   variant: 'destructive'
      // });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col items-center justify-center mb-6 gap-2">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 text-center">{t('productManagement')}</h1>
          <p className="text-gray-600 mt-1 text-center">{t('manageStoreProducts')}</p>
        </div>

        {/* أزرار العمليات */}
        <div className="flex flex-row justify-center gap-4 mb-4">
          <Button onClick={handleAddProduct} size="lg" className="bg-blue-600 hover:bg-blue-700 text-white min-h-[48px] min-w-[48px] touch-manipulation">
            <Plus className="w-5 h-5 mr-2" />
            <span className="hidden sm:inline">New product</span>
          </Button>
          <Button onClick={() => setShowAddQuantityDialog(true)} size="lg" className="bg-blue-600 hover:bg-blue-700 text-white min-h-[48px] min-w-[48px] touch-manipulation ml-2">
            <Package className="w-5 h-5 mr-2" />
            <span className="hidden sm:inline">{('Add quantity')}</span>
          </Button>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-4 md:p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder={t('searchProducts')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 text-lg touch-manipulation"
              />
            </div>
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <Label className="font-semibold">Category</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleAddCategory}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => setSelectedCategoryId('all')}
                  size="sm"
                  variant="outline"
                  className={`touch-manipulation min-w-[36px] justify-center ${selectedCategoryId === 'all' ? 'bg-blue-600 text-white hover:bg-blue-700 hover:text-white' : ''}`}
                >
                  {t('All')}
                </Button>
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    onDoubleClick={() => handleEditCategoryClick(category)}
                    onClick={() => setSelectedCategoryId(category.id)}
                    size="sm"
                    variant="outline"
                    className={`touch-manipulation min-w-[36px] justify-center ${selectedCategoryId === category.id ? 'bg-blue-600 text-white hover:bg-blue-700 hover:text-white' : ''}`}
                  >
                    {category.name}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-6 h-6" />
              {t('products')} ({filteredProducts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px]">{t('name')}</TableHead>
                    <TableHead className="min-w-[120px] text-center">{t('serialNumber')}</TableHead>
                    <TableHead className="min-w-[100px] text-center">{t('price')}</TableHead>
                    <TableHead className="min-w-[120px] text-center">{t('purchasePrice')}</TableHead>
                    <TableHead className="min-w-[80px] text-center">{t('tax')}</TableHead>
                    <TableHead className="min-w-[80px] text-center">{t('quantity')}</TableHead>
                    <TableHead className="min-w-[90px] text-center">Profit</TableHead>
                    <TableHead className="min-w-[120px] text-center">{t('actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        {t('noProductsFound')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProducts.map((product) => (
                      <TableRow key={product.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium min-w-[150px]">
                          {product.name}
                        </TableCell>
                        <TableCell className="font-mono text-sm text-center">
                          {product.serialNumber}
                        </TableCell>
                        <TableCell className="text-center font-medium">
                          {product.price.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center">
                          {product.purchasePrice.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center">
                          {product.tax.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={product.quantity > 0 ? "default" : "destructive"}>
                            {product.quantity}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center font-medium text-green-600">
                          ${(product.price - (product.purchasePrice || 0)).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditProduct(product)}
                              className="min-h-[36px] min-w-[36px] touch-manipulation"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteProduct(product.id)}
                              className="min-h-[36px] min-w-[36px] touch-manipulation text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Add/Edit Product Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-md w-full mx-4 max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? t('editProduct') : 'Add new product'}
              </DialogTitle>
              <DialogDescription>
                {editingProduct ? 'Update the details for this product.' : 'Fill in the form to add a new product to your inventory.'}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t('productName')}</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder={('name')}
                  className="h-12 touch-manipulation"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="serialNumber">{t('serialNumber')}</Label>
                {serialNumbers.map((sn, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <Input
                      placeholder={('number')}
                      value={sn} onChange={e => handleSerialChange(idx, e.target.value)} required className="flex-1" />
                    {serialNumbers.length > 1 && (
                      <Button type="button" variant="outline" onClick={() => handleRemoveSerial(idx)}>-</Button>
                    )}
                    {idx === serialNumbers.length - 1 && (
                      <Button type="button" variant="outline" onClick={handleAddSerial}>+</Button>
                    )}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">{t('price')}</Label>
                  <Input
                    id="price"
                    type="number"
                    step="1"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                    placeholder={('price')}
                    className="h-12 touch-manipulation"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purchasePrice">{t('purchasePrice')}</Label>
                  <Input
                    id="purchasePrice"
                    type="number"
                    step="1"
                    min="0"
                    value={formData.purchasePrice}
                    onChange={(e) => handleInputChange('purchasePrice', e.target.value)}
                    placeholder={('purchase price')}
                    className="h-12 touch-manipulation"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tax">{t('tax')}</Label>
                  <Input
                    id="tax"
                    type="number"
                    step="1"
                    value={formData.tax}
                    onChange={(e) => handleInputChange('tax', e.target.value)}
                    placeholder={('tax')}
                    className="h-12 touch-manipulation"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity">{t('quantity')}</Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="1"
                    value={formData.quantity}
                    onChange={(e) => handleInputChange('quantity', e.target.value)}
                    placeholder={('quantity')}
                    className="h-12 touch-manipulation"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={formData.categoryId} onValueChange={(value) => handleInputChange('categoryId', value)}>
                  <SelectTrigger className="h-12 touch-manipulation">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" className="text-xs">No Category</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddDialog(false)}
                  className="flex-1 h-12 touch-manipulation w-full"
                >
                  {t('cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 h-12 touch-manipulation w-full"
                >
                  {isLoading ? t('loading') : 'Save'}
                </Button>
              </div>
            </form>



          </DialogContent>
        </Dialog>

        {/* Add Quantity Dialog */}
        <Dialog open={showAddQuantityDialog} onOpenChange={setShowAddQuantityDialog}>
          <DialogContent className="max-w-md w-full mx-4">
            <DialogHeader>
              <DialogTitle>Add product quantity</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddQuantitySubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="productName">{t('productName')}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between"
                    >
                      {addQuantityForm.productName
                        ? products.find((p) => p.name.toLowerCase() === addQuantityForm.productName.toLowerCase())?.name
                        : t('searchProducts')}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandInput placeholder={t('searchProducts')} />
                      <CommandList>
                        <CommandEmpty>{t('noProductsFound')}</CommandEmpty>
                        <CommandGroup>
                          {(products || []).map((p) => (
                            <CommandItem
                              key={p.id}
                              value={p.name}
                              onSelect={(currentValue) => { setAddQuantityForm({ ...addQuantityForm, productName: currentValue === addQuantityForm.productName.toLowerCase() ? "" : p.name }) }}
                            >{p.name}</CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="serialNumber">{t('serialNumber')} (Optional)</Label>
                <Input
                  id="serialNumber"
                  value={addQuantityForm.serialNumber}
                  onChange={e => setAddQuantityForm({ ...addQuantityForm, serialNumber: e.target.value })}
                  placeholder={('number')}
                />
              </div>

              <div className="flex gap-4">
                <div className="space-y-2 flex-1">
                  <Label htmlFor="quantity">{t('quantity')}</Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="1"
                    value={addQuantityForm.quantity}
                    onChange={e => setAddQuantityForm({ ...addQuantityForm, quantity: e.target.value })}
                    placeholder={('quantity')}
                    required
                  />
                </div>
                <div className="space-y-2 flex-1">
                  <Label htmlFor="purchasePrice">{t('purchasePrice')}</Label>
                  <Input
                    id="purchasePrice"
                    type="number"
                    value={addQuantityForm.purchasePrice}
                    onChange={e => setAddQuantityForm({ ...addQuantityForm, purchasePrice: e.target.value })}
                    placeholder={('purchase price')}
                    required
                  />
                </div>
                <div className="space-y-2 flex-1">
                  <Label htmlFor="price">{t('price')}</Label>
                  <Input
                    id="price"
                    type="number"
                    step="1"
                    value={addQuantityForm.price}
                    onChange={e => setAddQuantityForm({ ...addQuantityForm, price: e.target.value })}
                    placeholder={('price')}
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowAddQuantityDialog(false)} className="flex-1 h-12 touch-manipulation">{t('cancel')}</Button>
                <Button type="submit" className="flex-1 h-12 touch-manipulation">{t('add')}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Add/Edit Category Dialog */}
        {showCategoryDialog && (
          <AddCategoryForm
            onSave={handleSaveCategory}
            onCancel={() => {
              setShowCategoryDialog(false);
              setEditingCategory(null);
            }}
            editingCategory={editingCategory}
            onDelete={handleDeleteCategory}
          />
        )}
      </div>
    </div>
  );
};

export default ProductManagement;
