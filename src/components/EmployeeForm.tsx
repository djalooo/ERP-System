import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Save, Eye, EyeOff } from 'lucide-react';
import { managedEmployeeStorage as employeeStorage } from '@/lib/managedStorage';
import { Employee, cleanPassword, validatePassword } from '@/lib/storage';
import { useLanguage } from '@/hooks/use-language';

interface EmployeeFormProps {
  employee?: Employee | null;
  onSave: (employee: Employee) => void;
  onCancel: () => void;
}

const EmployeeForm: React.FC<EmployeeFormProps> = ({ employee, onSave, onCancel }) => {
  const { t } = useLanguage();
  const isEditing = !!employee;

  const [formData, setFormData] = useState({
    name: '',
    role: '',
    phone: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isEditing && employee) {
      setFormData({
        name: employee.name,
        role: employee.role,
        phone: employee.phone,
        password: '' // Do not pre-fill password for security
      });
    }
  }, [employee, isEditing]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.phone || !formData.role || (!isEditing && !formData.password)) {
      alert(t('fillAllFields'));
      return;
    }

    const cleanedPassword = formData.password ? cleanPassword(formData.password) : undefined;

    if (isEditing && employee) {
      const updatedEmployee = {
        ...employee,
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        role: formData.role,
        ...(cleanedPassword && { password: cleanedPassword }) // Only update password if a new one is provided
      };
      employeeStorage.update(employee.id, updatedEmployee);
      onSave(updatedEmployee);
    } else {
      if (!cleanedPassword) {
        alert(t('passwordIsRequired'));
        return;
      }
      const newEmployee = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        role: formData.role,
        password: cleanedPassword
      };
      const savedEmployee = employeeStorage.add(newEmployee);
      onSave(savedEmployee);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{isEditing ? t('editEmployee') : t('addEmployee')}</CardTitle>
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">{t('employeeName')}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder={('name')}
                className="text-sm"
                required
              />
            </div>
            <div>
              <Label htmlFor="role">Job type</Label>
              <Select value={formData.role} onValueChange={(value) => handleChange('role', value)} required>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Select job type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cashier">{('cashier')}</SelectItem>
                  <SelectItem value="manager">{('manager')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="phone">{t('phoneNumber')}</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder={t('mumber')}
                className="text-sm"
                required
              />
            </div>
            <div>
              <Label htmlFor="password">{t('password')}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  placeholder={isEditing ? t('leaveBlankToKeepOld') : t('password')}
                  className="text-sm"
                  required={!isEditing}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <div className="flex space-x-2 pt-4">
              <Button type="submit" className="flex-1">
                <Save className="w-4 h-4 mr-2" />
                {t('save')}
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

export default EmployeeForm;