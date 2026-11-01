import React, { useState } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Save } from 'lucide-react';
import { Provider } from '@/lib/storage';

interface EditProviderFormProps {
  provider: Provider;
  onCancel: () => void;
  onSave: (provider: Provider) => void;
}

const EditProviderForm: React.FC<EditProviderFormProps> = ({ provider, onCancel, onSave }) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: provider.name,
    phone: provider.phone,
    email: provider.email || '',
    address: provider.address || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      alert(t('fillAllFields'));
      return;
    }
    
    const updatedProvider: Provider = {
      ...provider,
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      address: formData.address
    };
    
    onSave(updatedProvider);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t('editSupplier')}</CardTitle>
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Provider Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                                  placeholder={t('supplierName')}
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">{t('phoneNumber')}</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                                  placeholder={t('phoneNumber')}
                required
              />
            </div>
            <div>
              <Label htmlFor="email">{t('emailAddress')}</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                                  placeholder={t('emailAddress')}
              />
            </div>
            <div>
              <Label htmlFor="address">{t('address')}</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                                  placeholder={t('address')}
              />
            </div>
            <div className="flex space-x-2 pt-4">
              <Button type="submit" className="flex-1">
                <Save className="w-4 h-4 mr-2" />
                Save
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

export default EditProviderForm;