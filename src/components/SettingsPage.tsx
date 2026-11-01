import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { AppSettings, settingsStorage } from '@/lib/storage';

const SettingsPage = () => {
  const [settings, setSettings] = useState<AppSettings>(settingsStorage.get());

  useEffect(() => {
    // Listen for changes from other tabs/windows if necessary
    const handleStorageChange = () => {
      setSettings(settingsStorage.get());
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleSettingChange = (key: keyof AppSettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    settingsStorage.set({ [key]: value });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>الإعدادات العامة</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border p-4">
          <Label htmlFor="allow-price-modification" className="flex flex-col space-y-1">
            <span>السماح بتعديل سعر البيع</span>
            <span className="font-normal leading-snug text-muted-foreground">تفعيل هذه الميزة يسمح للكاشير بتغيير سعر المنتج عند إضافته للفاتورة.</span>
          </Label>
          <Switch id="allow-price-modification" checked={settings.allowPriceModification} onCheckedChange={(value) => handleSettingChange('allowPriceModification', value)} />
        </div>
      </CardContent>

    </Card>
  );
};

export default SettingsPage;