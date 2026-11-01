import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import WelcomeScreen from "@/components/WelcomeScreen";
import AdminDashboard from "@/components/AdminDashboard";
import RoleSelectionScreen from "@/components/RoleSelectionScreen";
import CashierRegistration from "@/components/CashierRegistration";
import AdminLogin from "@/components/AdminLogin";
import { useAuth } from "@/hooks/use-auth";
import CashierDashboard from "@/components/CashierDashboard";
import { Employee, employeeStorage, storage } from "@/lib/storage";

const queryClient = new QueryClient();

const AppContent = () => {
  const [showWelcome, setShowWelcome] = useState(true);
  const [showCashierRegistration, setShowCashierRegistration] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [currentCashier, setCurrentCashier] = useState<Employee | null>(null);
  const { isAuthenticated, needsRoleSelection, setUserRole, user } = useAuth();

  console.log('AppContent render:', {
    showWelcome,
    isAuthenticated,
    needsRoleSelection,
    user,
    currentCashier,
    showCashierRegistration,
    showAdminLogin
  });

  const handleStart = () => {
    console.log('handleStart called');
    setShowWelcome(false);
  };

  const handleRoleSelect = (role: 'admin' | 'cashier') => {
    console.log('App: handleRoleSelect called with:', role);
    if (role === 'cashier') {
      // التحقق من وجود موظفين كاشير مسجلين
      const employees = employeeStorage.getAll();
      const cashierEmployees = employees.filter(emp => emp.role === 'cashier');

      console.log('Cashier role selected, checking for registered cashiers:', cashierEmployees.length);

      if (cashierEmployees.length === 0) {
        console.log('No cashier employees found, entering cashier interface directly');
        // إنشاء كاشير مؤقت للدخول المباشر
        const tempCashier: Employee = {
          id: 'temp_cashier',
          name: 'None',
          phone: '',
          role: 'cashier',
          password: '',
          createdAt: new Date().toISOString()
        };
        setCurrentCashier(tempCashier);
      } else {
        console.log('Cashier employees found, showing cashier login');
        setShowCashierRegistration(true);
      }
    } else if (role === 'admin') {
      // Check for manager employees before showing login
      const employees = employeeStorage.getAll();
      const managerEmployees = employees.filter(emp => emp.role === 'manager');

      if (managerEmployees.length > 0) {
        console.log('Manager employees found, showing admin login');
        setShowAdminLogin(true);
      } else {
        console.log('No manager employees found, entering admin dashboard directly');
        setUserRole('admin');
      }
    }
  };

  const handleCashierLogin = (employee: Employee) => {
    console.log('App: handleCashierLogin called with employee:', employee);
    setCurrentCashier(employee);
    setShowCashierRegistration(false);
    console.log('Cashier login completed, currentCashier set to:', employee);
  };

  const handleBackToRoleSelection = () => {
    console.log('Going back to role selection');
    setShowAdminLogin(false);
    setShowCashierRegistration(false);
    setCurrentCashier(null);
  };

  const handleAdminLogin = (employee: Employee) => {
    console.log('App: handleAdminLogin called with employee:', employee);
    setUserRole('admin');
    setShowAdminLogin(false);
  };

  const handleBackToRoleSelectionFromAdmin = () => {
    setShowAdminLogin(false);
  };

  const handleCashierLogout = () => {
    console.log('Cashier logout called');
    setCurrentCashier(null);
    setShowCashierRegistration(false);
  };

  // First, check if we should show welcome screen
  if (showWelcome) {
    console.log('Rendering WelcomeScreen');
    return <WelcomeScreen onStart={handleStart} />;
  }

  if (showAdminLogin) {
    console.log('Rendering AdminLogin');
    return <AdminLogin onBack={handleBackToRoleSelectionFromAdmin} onLogin={handleAdminLogin} />;
  }

  // Then, check if we should show cashier registration
  if (showCashierRegistration) {
    console.log('Rendering CashierRegistration');
    return <CashierRegistration onBack={handleBackToRoleSelection} onLogin={handleCashierLogin} />;
  }

  // Check if we have a logged in cashier
  if (currentCashier) {
    console.log('Rendering CashierDashboard for logged in cashier:', currentCashier);
    return <CashierDashboard currentCashier={currentCashier} onLogout={handleCashierLogout} />;
  }

  // Then, check if user is not authenticated or needs role selection
  if (!isAuthenticated || needsRoleSelection) {
    console.log('User needs role selection, showing RoleSelectionScreen');
    return <RoleSelectionScreen onRoleSelect={handleRoleSelect} />;
  }

  // Check if user is admin
  if (user?.role === 'admin') {
    console.log('Rendering AdminDashboard');
    return <AdminDashboard />;
  }

  // Check if user is cashier (from auth system)
  if (user?.role === 'cashier') {
    console.log('Rendering CashierDashboard for auth user');
    return <CashierDashboard currentCashier={null} />;
  }

  // Fallback to role selection
  console.log('Fallback to RoleSelectionScreen');
  return <RoleSelectionScreen onRoleSelect={handleRoleSelect} />;
};

const AppInit = ({ children }: { children: React.ReactNode }) => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        await storage.initialize();
        // Auto-migrate on first run with new logic
        // We'll trust the migration utility to handle duplicates safely
        await storage.migrate();
      } catch (e) {
        console.error("Storage initialization failed", e);
      } finally {
        setIsReady(true);
      }
    };
    init();
  }, []);

  if (!isReady) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-foreground">
        <div className="flex flex-col items-center gap-4">
          {/* Simple Loading Spinner */}
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p>Initializing Database...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <LanguageProvider>
        <AuthProvider>
          <AppInit>
            <AppContent />
          </AppInit>
        </AuthProvider>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
