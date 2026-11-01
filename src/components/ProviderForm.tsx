import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Save } from 'lucide-react';
import { managedProviderStorage as providerStorage } from '@/lib/managedStorage';
import { Provider } from '@/lib/storage';

interface ProviderFormProps {
  provider?: Provider | null;
  onSave: (provider: Provider) => void;
  onCancel: () => void;
}

const ProviderForm: React.FC<ProviderFormProps> = ({ provider, onSave, onCancel }) => {
  const { t } = useLanguage();
  const isEditing = !!provider;

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: ''
  });

  useEffect(() => {
    if (isEditing && provider) {
      setFormData({
        name: provider.name,
        phone: provider.phone,
        email: provider.email || '',
        address: provider.address || ''
      });
    }
  }, [provider, isEditing]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      alert(t('fillAllFields'));
      return;
    }

    const providerData = {
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      address: formData.address.trim()
    };

    if (isEditing && provider) {
      const updatedProvider = { ...provider, ...providerData };
      providerStorage.update(provider.id, updatedProvider);
      onSave(updatedProvider);
    } else {
      const newProvider = providerStorage.add(providerData);
      onSave(newProvider);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{isEditing ? t('editSupplier') : 'Add New Provider'}</CardTitle>
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Provider Name</Label>
              <Input id="name" value={formData.name} onChange={(e) => handleChange('name', e.target.value)} placeholder="Enter Provider Name" required />
            </div>
            <div>
              <Label htmlFor="phone">{t('phoneNumber')}</Label>
              <Input id="phone" value={formData.phone} onChange={(e) => handleChange('phone', e.target.value)} placeholder={t('phoneNumber')} required />
            </div>
            <div>
              <Label htmlFor="email">{t('emailAddress')}</Label>
              <Input id="email" type="email" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} placeholder={t('emailAddress')} />
            </div>
            <div>
              <Label htmlFor="address">{t('address')}</Label>
              <Input id="address" value={formData.address} onChange={(e) => handleChange('address', e.target.value)} placeholder={t('address')} />
            </div>
            <div className="flex space-x-2 pt-4">
              <Button type="submit" className="flex-1">
                <Save className="w-4 h-4 mr-2" />
                {isEditing ? t('saveChanges') : 'Save Provider'}
              </Button>
              <Button type="button" variant="outline" onClick={onCancel}>
                {t('cancel')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProviderForm;