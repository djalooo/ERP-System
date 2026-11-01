import React from 'react';
import { useLanguage } from '@/hooks/use-language';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe, Store } from 'lucide-react';

interface WelcomeScreenProps {
  onStart: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart }) => {
  const { language, setLanguage, t, isRTL } = useLanguage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Language Selector */}
        <div className={`flex ${isRTL ? 'justify-start' : 'justify-end'} mb-8`}>
          <Select value={language} onValueChange={(value) => setLanguage(value as 'en' | 'ar' | 'fr')}>
            <SelectTrigger className="w-40 bg-white/80 backdrop-blur-sm">
              <Globe className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="en">{t('english')}</SelectItem>
              <SelectItem value="ar">{t('arabic')}</SelectItem>
              <SelectItem value="fr">{t('french')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Main Welcome Card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8 text-center animate-fade-in">
          {/* Logo */}
          <div className="mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-primary-600 to-emerald-500 rounded-2xl mx-auto flex items-center justify-center mb-4">
              <Store className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-primary-800 mb-2">
              {t('appName')}
            </h1>
            <p className="text-lg text-primary-600 font-medium">
              {t('appSubtitle')}
            </p>
          </div>

          {/* Welcome Message */}
          <p className="text-gray-600 text-lg mb-8 leading-relaxed">
            {t('welcomeMessage')}
          </p>

          {/* Start Button */}
          <Button 
            onClick={onStart}
            size="lg"
            className="w-full bg-gradient-to-r from-primary-600 to-emerald-500 hover:from-primary-700 hover:to-emerald-600 text-white font-semibold py-4 text-lg shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {t('startNow')}
          </Button>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-primary-600/80">
          <p className="text-sm">
            © 2025 MPM - Money Project Manager
          </p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
