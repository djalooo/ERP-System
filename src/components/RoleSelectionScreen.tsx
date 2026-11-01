import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { User, UserCog } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import { UserRole } from '@/contexts/AuthContext';

interface RoleSelectionScreenProps {
  onRoleSelect: (role: UserRole) => void;
}

const RoleSelectionScreen: React.FC<RoleSelectionScreenProps> = ({ onRoleSelect }) => {
  const { t } = useLanguage();

  const handleRoleSelect = (role: UserRole) => {
    console.log('RoleSelectionScreen: Role selected:', role);
    onRoleSelect(role);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-8">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {t('selectRole')}
          </h1>
        </div>
        
        <div className="flex gap-8 justify-center">
          {/* Cashier Card */}
          <Card 
            className="w-48 h-48 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 bg-white border-2 border-black-25-role-card"
            onClick={() => handleRoleSelect('cashier')}
          >
            <CardContent className="flex flex-col items-center justify-center h-full p-6">
              <User className="w-16 h-16 text-primary-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-800">
                {t('cashier')}
              </h3>
            </CardContent>
          </Card>

          {/* Admin Card */}
          <Card 
            className="w-48 h-48 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 bg-white border-2 border-black-25-role-card"
            onClick={() => handleRoleSelect('admin')}
          >
            <CardContent className="flex flex-col items-center justify-center h-full p-6">
              <UserCog className="w-16 h-16 text-primary-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-800">
                {t('admin')}
              </h3>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RoleSelectionScreen;
