import React, { useState } from 'react';
import { managedBillStorage as billStorage } from '@/lib/managedStorage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Save } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import { Bill } from '@/lib/storage';
import { useAuth } from '@/hooks/use-auth';

interface AddBillFormProps {
  onCancel: () => void;
  onSave?: (bill?: Bill) => void;
}

const AddBillForm: React.FC<AddBillFormProps> = ({ onCancel, onSave }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    type: '',
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    description: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.type || !formData.amount || isNaN(Number(formData.amount)) || !formData.paymentDate) {
      alert(t('fillAllFields'));
      return;
    }
    const bill: Partial<Bill> = {
      title: formData.type,
      amount: parseFloat(formData.amount),
      dueDate: formData.paymentDate,
      status: 'pending',
      createdAt: new Date().toISOString(),
      description: formData.description || '',
      role: user?.role || 'Admin'
    };
    billStorage.add({
      title: formData.type,
      amount: parseFloat(formData.amount),
      dueDate: formData.paymentDate,
      status: 'pending' as const,
      description: formData.description || '',
      role: user?.role || 'Admin'
    } as any);
    if (onSave) onSave(bill as Bill);
    onCancel();
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t('addNew') || 'Add new'}</CardTitle>
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="type">{t('billType') || 'Bill type'}</Label>
              <Select onValueChange={(value) => handleChange('type', value)}>
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
            <div>
              <Label htmlFor="amount">{t('amount') || 'Amount'}</Label>
              <Input
                id="amount"
                type="number"
                step="1"
                value={formData.amount}
                onChange={(e) => handleChange('amount', e.target.value)}
                placeholder={t('enterPaymentAmount') || "Enter Payment Amount"}
                required
              />
            </div>
            <div>
              <Label htmlFor="paymentDate">{t('date') || 'Date'}</Label>
              <Input
                id="paymentDate"
                type="date"
                value={formData.paymentDate}
                onChange={(e) => handleChange('paymentDate', e.target.value)}
                required
              />
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

export default AddBillForm;
