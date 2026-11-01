import React, { useState } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Save } from 'lucide-react';
import { Product, Category, categoryStorage, productStorage, billStorage } from '@/lib/storage';

interface AddProductFormProps {
  onCancel: () => void;
  onSave: (product: any) => void;
}

const AddProductForm: React.FC<AddProductFormProps> = ({ onCancel, onSave }) => {
  const { t } = useLanguage();
  const [categories] = useState<Category[]>(categoryStorage.getAll());
  const [formData, setFormData] = useState({
    name: '',
    quantity: '',
    purchasePrice: '',
    price: '',
    tax: '',
    categoryId: ''
  });
  const [serialNumbers, setSerialNumbers] = useState<string[]>(['']);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.name.trim()) {
      alert(t('productNameRequired'));
      return;
    }

    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      alert(t('quantityRequired'));
      return;
    }

    if (!formData.purchasePrice || parseFloat(formData.purchasePrice) <= 0) {
      alert(t('purchasePriceRequired'));
      return;
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      alert(t('salePriceRequired'));
      return;
    }

    if (!formData.tax || parseFloat(formData.tax) < 0) {
      alert(t('taxRequired'));
      return;
    }

    setIsSubmitting(true);

    try {
      // Check for duplicate serial numbers
      const allProducts = productStorage.getAll();
      const newSerials = serialNumbers.filter(sn => sn.trim() !== '');

      const duplicate = allProducts.find(p => {
        const existingSerials = Array.isArray((p as any).serialNumbers)
          ? (p as any).serialNumbers
          : [p.serialNumber];
        return newSerials.some(sn => existingSerials.includes(sn));
      });

      if (duplicate) {
        alert(`${t('serialNumberAlreadyExists') || 'Serial number already exists'}: ${duplicate.name}`);
        setIsSubmitting(false);
        return;
      }

      // Create product object with proper data types
      const productData = {
        name: formData.name.trim(),
        quantity: parseInt(formData.quantity),
        purchasePrice: parseFloat(formData.purchasePrice),
        price: parseFloat(formData.price),
        tax: parseFloat(formData.tax),
        totalSales: 0,
        categoryId: formData.categoryId || undefined,
        serialNumbers: serialNumbers.filter(sn => sn.trim() !== '')
      };

      onSave(productData);

      // Create a bill for the product purchase (Cost of Goods)
      const totalCost = (parseFloat(formData.purchasePrice) || 0) * (parseInt(formData.quantity) || 0);
      if (totalCost > 0) {
        billStorage.add({
          title: 'Goods',
          amount: totalCost,
          dueDate: new Date().toISOString().split('T')[0],
          status: 'paid',
          description: `Purchase of ${formData.name.trim()} (Qty: ${formData.quantity})`,
          role: 'Admin' // Assuming Admin adds products usually, or we could fetch user context if needed
        });
      }

      // Reset form after successful save
      setFormData({
        name: '',
        quantity: '',
        purchasePrice: '',
        price: '',
        tax: '',
        categoryId: ''
      });
      setSerialNumbers(['']);

      // إرسال حدث تحديث البيانات
      window.dispatchEvent(new Event('storage-updated'));
    } catch (error) {
      console.error('Error saving product:', error);
      alert(t('errorSavingProduct'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSerialChange = (idx: number, value: string) => {
    setSerialNumbers(prev => prev.map((s, i) => i === idx ? value : s));
  };

  const handleAddSerial = () => setSerialNumbers(prev => [...prev, '']);

  const handleRemoveSerial = (idx: number) => setSerialNumbers(prev => prev.filter((_, i) => i !== idx));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Add new product</CardTitle>
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Product Name */}
            <div>
              <Label htmlFor="name">{t('productName')}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder={t('enterProductName')}
                required
              />
            </div>

            {/* Purchase Price and Sale Price - Side by Side */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="purchasePrice">{t('purchasePrice')}</Label>
                <Input
                  id="purchasePrice"
                  type="number"
                  step="1"
                  min="0"
                  value={formData.purchasePrice}
                  onChange={(e) => handleChange('purchasePrice', e.target.value)}
                  placeholder={t('enterPurchasePrice')}
                  required
                />
              </div>
              <div>
                <Label htmlFor="salePrice">{t('salePrice')}</Label>
                <Input
                  id="price"
                  type="number"
                  step="1"
                  min="0"
                  value={formData.price}
                  onChange={(e) => handleChange('price', e.target.value)}
                  placeholder={t('enterSalePrice')}
                  required
                />
              </div>
            </div>

            {/* Quantity and Tax - Side by Side */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quantity">{t('quantity')}</Label>
                <Input
                  id="quantity"
                  type="number"
                  step="1"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => handleChange('quantity', e.target.value)}
                  placeholder={t('enterQuantity')}
                  required
                />
              </div>
              <div>
                <Label htmlFor="tax">{t('tax')} (%)</Label>
                <Input
                  id="tax"
                  type="number"
                  step="1"
                  min="0"
                  value={formData.tax}
                  onChange={(e) => handleChange('tax', e.target.value)}
                  placeholder={t('enterTaxPercentage')}
                  required
                />
              </div>
            </div>

            {/* Category Selection */}
            <div>
              <Label htmlFor="category">{t('categories')}</Label>
              <select
                id="category"
                value={formData.categoryId}
                onChange={(e) => handleChange('categoryId', e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="">{t('noCategory') || 'No Category'}</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Serial Numbers */}
            <div className="border-2 border-black-25 p-3 rounded-lg bg-blue-50">
              <Label className="text-lg font-semibold text-blue-800">
                {t('serialNumber') || 'الرقم التسلسلي / Serial Number'}
              </Label>
              {serialNumbers.map((sn, idx) => (
                <div key={idx} className="flex gap-2 mb-2">
                  <Input
                    value={sn}
                    onChange={e => handleSerialChange(idx, e.target.value)}
                    placeholder={t('enterSerialNumber') || 'أدخل الرقم التسلسلي'}
                    className="flex-1"
                  />
                  {serialNumbers.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleRemoveSerial(idx)}
                      className="px-3"
                    >
                      -
                    </Button>
                  )}
                  {idx === serialNumbers.length - 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddSerial}
                      className="px-3"
                    >
                      +
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2 pt-4">
              <Button
                type="submit"
                className="flex-1"
                disabled={isSubmitting}
              >
                <Save className="w-4 h-4 mr-2" />
                {isSubmitting ? t('saving') : t('saveProduct')}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                {t('cancel')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddProductForm;
