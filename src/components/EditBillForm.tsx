import React, { useState } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Save } from 'lucide-react';
import { Bill } from '@/lib/storage';

interface EditBillFormProps {
  bill: Bill;
  onCancel: () => void;
  onSave: (bill: Bill) => void;
}

const EditBillForm: React.FC<EditBillFormProps> = ({ bill, onCancel, onSave }) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    title: bill.title,
    amount: bill.amount.toString(),
    dueDate: bill.dueDate,
    description: bill.description || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.amount || isNaN(Number(formData.amount)) || !formData.dueDate) {
      alert(t('fillAllFields'));
      return;
    }

    const updatedBill: Bill = {
      ...bill,
      title: formData.title,
      amount: parseFloat(formData.amount),
      dueDate: formData.dueDate,
      description: formData.description
    };

    onSave(updatedBill);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t('editBill') || 'Edit Bill'}</CardTitle>
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">{t('billType') || 'Bill Type'}</Label>
              <Select value={formData.title} onValueChange={(value) => handleChange('title', value)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('selectBillType') || "Select Bill Type"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="electricity">{t('electricity') || 'Electricity'}</SelectItem>
                  <SelectItem value="water">{t('water') || 'Water'}</SelectItem>
                  <SelectItem value="gas">{t('gas') || 'Gas'}</SelectItem>
                  <SelectItem value="rent">{t('rent') || 'Rent'}</SelectItem>
                  <SelectItem value="goods">{t('goods') || 'Goods'}</SelectItem>
                  <SelectItem value="employees">{t('employees') || 'Employees'}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">{t('amount') || 'Price'}</Label>
                <Input
                  id="amount"
                  type="number"
                  step="1"
                  value={formData.amount}
                  onChange={(e) => handleChange('amount', e.target.value)}
                  placeholder={t('enterAmount') || "Enter Amount"}
                  required
                />
              </div>
              <div>
                <Label htmlFor="dueDate">{t('date') || 'Date'}</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => handleChange('dueDate', e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">{t('description') || 'Description'}</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder={t('enterDescription') || "Enter Description"}
              />
            </div>

            <div className="flex space-x-2 pt-4">
              <Button type="submit" className="flex-1">
                <Save className="w-4 h-4 mr-2" />
                {t('save') || 'Save'}
              </Button>
              <Button type="button" variant="outline" onClick={onCancel}>
                {t('cancel') || 'Cancel'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditBillForm;