import React, { useState } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Save, Eye, EyeOff } from 'lucide-react';
import { Employee, employeeStorage } from '@/lib/storage';
import { cleanPassword, validatePassword } from '@/lib/storage';

interface EditEmployeeFormProps {
  employee: Employee;
  onCancel: () => void;
  onSave: (employee: Employee) => void;
}

const EditEmployeeForm: React.FC<EditEmployeeFormProps> = ({ employee, onCancel, onSave }) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: employee.name,
    jobType: employee.role,
    phone: employee.phone,
    password: employee.password
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.jobType) {
      alert(t('fillAllFields'));
      return;
    }

    let cleanedPassword: string | undefined;
    if (formData.password) {
      const passwordValidation = validatePassword(formData.password);
      if (!passwordValidation.isValid) {
        alert(passwordValidation.error);
        return;
      }
      cleanedPassword = cleanPassword(formData.password);
    }
    
    const updatedEmployee: Employee = {
      ...employee,
      name: formData.name,
      role: formData.jobType,
      phone: formData.phone,
      password: cleanedPassword || employee.password
    };
    
    employeeStorage.update(employee.id, updatedEmployee);
    onSave(updatedEmployee);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t('editEmployee')}</CardTitle>
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
                required
              />
            </div>
            <div>
              <Label htmlFor="jobType">Job type</Label>
              <Select value={formData.jobType} onValueChange={(value) => handleChange('jobType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('selectJobType')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cashier">Cashier</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="phone">Phone number</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder={('number')}
                required
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
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

export default EditEmployeeForm;