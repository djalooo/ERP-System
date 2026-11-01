import React, { useState, useRef } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ArrowLeft, UserCog } from 'lucide-react';
import { managedEmployeeStorage as employeeStorage } from '@/lib/managedStorage';
import { Employee, cleanPassword } from '@/lib/storage';

interface AdminLoginProps {
  onBack: () => void;
  onLogin: (employee: Employee) => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onBack, onLogin }) => {
  const { t } = useLanguage();
  
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (!name.trim() || !password.trim()) {
      setError(t('fillAllFields'));
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const cleanedName = name.trim();
      const cleanedPassword = cleanPassword(password);
      
      const employees = employeeStorage.getAll();
      
      const employee = employees.find(emp => 
        emp.name.toLowerCase() === cleanedName.toLowerCase() && 
        emp.password === cleanedPassword &&
        emp.role === 'manager' // Only allow managers to log in
      );

      if (employee) {
        onLogin(employee);
      } else {
        setError(t('invalidCredentials') || 'Invalid name, password, or role.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(t('loginError') || 'An error occurred during login.');
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
              <UserCog className="w-8 h-8 text-primary-600" />
            </div>
            <CardTitle className="text-2xl font-bold">
              {t('adminLogin') || 'Admin Login'}
            </CardTitle>
            <CardDescription>
              {t('adminLoginDesc') || 'Enter your credentials to access the admin dashboard.'}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-sm font-medium">{t('employeeName')}</Label>
                <Input id="name" type="text" placeholder={t('enterEmployeeName')} value={name} onChange={(e) => setName(e.target.value)} className="mt-1" ref={nameInputRef} onKeyDown={e => { if (e.key === 'Enter') { passwordInputRef.current?.focus(); } }} />
              </div>
              
              <div>
                <Label htmlFor="password" className="text-sm font-medium">{t('password')}</Label>
                <Input id="password" type="password" placeholder={t('enterPassword')} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1" ref={passwordInputRef} onKeyDown={e => { if (e.key === 'Enter') { handleLogin(); } }} />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}
              
              <Button onClick={handleLogin} disabled={isLoading || !name.trim() || !password.trim()} className="w-full">
                {isLoading ? t('loggingIn') : t('login')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminLogin;