import React, { useState, useRef } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ArrowLeft, User } from 'lucide-react';
import { managedEmployeeStorage as employeeStorage } from '@/lib/managedStorage';
import { Employee, cleanPassword } from '@/lib/storage';

interface CashierRegistrationProps {
  onBack: () => void;
  onLogin: (employee: Employee) => void;
}

const CashierRegistration: React.FC<CashierRegistrationProps> = ({ onBack, onLogin }) => {
  const { t } = useLanguage();
  
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = () => {
    console.log('handleLogin called with:', { name, password });
    
    if (!name.trim() || !password.trim()) {
      console.log('Empty fields, returning');
      return;
    }

    setIsLoading(true);

    try {
      // تنظيف المدخلات
      const cleanedName = name.trim();
      const cleanedPassword = cleanPassword(password);
      
      console.log('Cleaned inputs:', { 
        originalName: name, 
        cleanedName, 
        originalPassword: password, 
        cleanedPassword 
      });

      // البحث عن الموظف بالاسم وكلمة المرور
      const employees = employeeStorage.getAll();
      console.log('All employees:', employees);
      
      const employee = employees.find(emp => 
        emp.name.toLowerCase() === cleanedName.toLowerCase() && 
        emp.password === cleanedPassword &&
        (emp.role === 'cashier' || emp.role === 'manager')
      );

      console.log('Found employee:', employee);

      if (employee) {
        console.log('Calling onLogin with employee:', employee);
        onLogin(employee);
      } else {
        console.log('No matching employee found');
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const nameInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={onBack}
                className="mr-4"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <User className="w-8 h-8 text-primary-600" />
            </div>
            <CardTitle className="text-2xl font-bold">
              {t('cashierLogin')}
            </CardTitle>
            <CardDescription>
              {t('cashierLoginDesc')}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-sm font-medium">
                  {t('employeeName')}
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder={t('enterEmployeeName')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1"
                  ref={nameInputRef}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      passwordInputRef.current?.focus();
                    }
                  }}
                />
              </div>
              
              <div>
                <Label htmlFor="password" className="text-sm font-medium">
                  {t('password')}
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={t('enterPassword')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1"
                  ref={passwordInputRef}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      handleLogin();
                    }
                  }}
                />
              </div>
              
              <Button
                onClick={handleLogin}
                disabled={isLoading || !name.trim() || !password.trim()}
                className="w-full"
              >
                {isLoading ? t('loggingIn') : t('login')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CashierRegistration;