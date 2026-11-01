import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  Activity,
  ShoppingCart,
  Package,
  Truck,
  UserCheck,
  Receipt,
  RotateCcw,
  BarChart3,
  Settings as SettingsIcon,
  Plus,
  Edit,
  Trash2,
  ArrowLeft,
  LogOut,
  Globe,
  TrendingUp,
  DollarSign,
  Users,
  Calendar,
  CalendarDays,
  Search,
  Filter,
  Download,
  Save,
  X,
  Eye,
  Check,
  ChevronDown,
  ChevronRight,
  FileText,
  Wallet,
  Landmark,
  HelpCircle,
  Phone,
  ArrowUpRight
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { format, isValid, addDays, parse as parseDate } from 'date-fns';
import {
  Product,
  Order,
  Provider,
  Employee,
  Bill,
  Return,
  UnknownRequest,
  TopReturn,
  UnknownProduct,
  Category,
  OrderItem,
  analytics,
  diagnoseAndFixData,
  createTestReturns,
  debugStorage,
  rebuildTopReturns,
  settingsStorage,
  storage
} from '@/lib/storage';
import {
  managedProductStorage as productStorage,
  managedOrderStorage as orderStorage,
  managedProviderStorage as providerStorage,
  managedEmployeeStorage as employeeStorage,
  managedBillStorage as billStorage,
  managedReturnsStorage as returnsStorage,
  managedDailySalesStorage as dailySalesStorage,
  managedCashierActivityStorage as cashierActivityStorage,
  managedUnknownProductStorage as unknownProductStorage,
  managedUnknownRequestStorage as unknownRequestStorage,
  managedTopReturnStorage as topReturnStorage,
  managedCategoryStorage as categoryStorage,
  ManagedStorage,
} from '@/lib/managedStorage'; // استيراد المكون الموحد الجديد
import AddEmployeeForm from './AddEmployeeForm';
import EditEmployeeForm from './EditEmployeeForm';
import AddProductForm from './AddProductForm';
import AddBillForm from './AddBillForm';
import ProviderForm from './ProviderForm';
import EditBillForm from './EditBillForm';
import ProductManagement from './ProductManagement';
import ReturnManagement from './ReturnManagement';
import Reports from '@/pages/Reports';
import { BarChart } from '@/components/ui/chart';
import DynamicCalendar from './DynamicCalendar';
import UnknownProductManagement from './UnknownProductManagement';
import CustomerManagement from './CustomerManagement';

import { arSA, fr, enUS } from 'date-fns/locale';

type ActiveSection = 'dashboard' | 'providers' | 'orders' | 'employees' | 'products' | 'settings' | 'bills' | 'returns' | 'reports' | 'unknownProducts' | 'customers';

const AdminDashboard: React.FC = () => {
  const { t, isRTL, language, setLanguage } = useLanguage();
  const localeString = language === 'ar' ? 'ar-SA' : language === 'fr' ? 'fr-FR' : 'en-US';
  const locale = language === 'ar' ? arSA : language === 'fr' ? fr : enUS;
  const [settings, setSettings] = useState(settingsStorage.get());

  useEffect(() => {
    const handleSettingsChange = () => {
      setSettings(settingsStorage.get());
    };
    window.addEventListener('storage', handleSettingsChange);
    window.addEventListener('storage-updated', handleSettingsChange);
    return () => {
      window.removeEventListener('storage', handleSettingsChange);
      window.removeEventListener('storage-updated', handleSettingsChange);
    };
  }, []);

  const { user, logout, resetRoleSelection, updateUser } = useAuth();
  const [activeSection, setActiveSection] = useState<ActiveSection>('dashboard');
  const [isProviderFormOpen, setProviderFormOpen] = useState(false);
  const [isEmployeeFormOpen, setEmployeeFormOpen] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);

  const [showBillForm, setShowBillForm] = useState(false);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('day'); // تغيير من '7d' إلى 'day'
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [returns, setReturns] = useState<Return[]>([]);
  const [unknownRequests, setUnknownRequests] = useState<UnknownRequest[]>([]);
  const [topReturns, setTopReturns] = useState<TopReturn[]>([]);
  const [unknownProducts, setUnknownProducts] = useState<UnknownProduct[]>([]);
  const [isUpdatingStorage, setIsUpdatingStorage] = useState(false);
  const [forceUpdateCounter, setForceUpdateCounter] = useState(0);
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [showTopProductsDialog, setShowTopProductsDialog] = useState(false);
  const [topProductsSortBy, setTopProductsSortBy] = useState<'quantity' | 'sales' | 'profit'>('quantity');

  // New states for date inputs
  const [mainDateInput, setMainDateInput] = useState('');
  const [customDateInput, setCustomDateInput] = useState({ start: '', end: '' });

  // Edit states
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [showEditAccount, setShowEditAccount] = useState(false);
  const [editFormData, setEditFormData] = useState({ fullName: '', phoneNumber: '', storeName: '' });


  // New state for selected order
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedDayForBreakdown, setSelectedDayForBreakdown] = useState<string | null>(null);
  const [showBreakdownDialog, setShowBreakdownDialog] = useState(false);

  // ترتيب الطلبات من الأحدث إلى الأقدم
  const sortedOrders = [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // فلترة حسب الفترة الزمنية
  const currentDayOffsetRef = useRef(0);
  const [, forceUpdate] = useState(0); // لإجبار إعادة التصيير
  const setCurrentDayOffset = (val: number) => {
    currentDayOffsetRef.current = val;
    forceUpdate((x: number) => x + 1);
  };
  const currentDayOffset = currentDayOffsetRef.current;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDay = new Date(today);
  targetDay.setDate(today.getDate() + currentDayOffset);

  // Sync input fields with date state
  useEffect(() => {
    if (isValid(targetDay)) {
      setMainDateInput(format(targetDay, 'dd/MM/yyyy'));
    } else {
      setMainDateInput('');
    }
  }, [targetDay]);

  useEffect(() => {
    setCustomDateInput({
      start: customDateRange.start ? format(new Date(customDateRange.start), 'dd/MM/yyyy') : '',
      end: customDateRange.end ? format(new Date(customDateRange.end), 'dd/MM/yyyy') : ''
    });
  }, [customDateRange]);

  const handleDateInputFormat = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 2) return cleaned;
    if (cleaned.length <= 4) return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4, 8)}`;
  };

  const handleMainDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = handleDateInputFormat(e.target.value);
    setMainDateInput(formatted);

    if (formatted.length === 10) {
      const [, , year] = formatted.split('/').map(Number);
      if (year >= 2025) {
        const parsedDate = parseDate(formatted, 'dd/MM/yyyy', new Date());
        if (isValid(parsedDate)) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const diffTime = parsedDate.getTime() - today.getTime();
          const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
          setCurrentDayOffset(diffDays);
        }
      }
    }
  };

  const handleCustomDateChange = (field: 'start' | 'end', value: string) => {
    const formatted = handleDateInputFormat(value);
    setCustomDateInput(prev => ({ ...prev, [field]: formatted }));

    if (formatted.length === 10) {
      const [, , year] = formatted.split('/').map(Number);
      if (year >= 2025) {
        const parsedDate = parseDate(formatted, 'dd/MM/yyyy', new Date());
        if (isValid(parsedDate)) {
          setCustomDateRange(prev => ({ ...prev, [field]: format(parsedDate, 'yyyy-MM-dd') }));
        }
      }
    }
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate();
  };

  // Find the earliest order date
  const earliestOrderDate = orders.length > 0 ? new Date(Math.min(...orders.map((o: Order) => new Date(o.createdAt).getTime()))) : today;
  earliestOrderDate.setHours(0, 0, 0, 0);

  const ordersOfTheDay = sortedOrders.filter(order => isSameDay(new Date(order.createdAt), targetDay));

  // Generic period filter function for all data types - corrected generic
  const filterItemsByPeriod = <T extends { createdAt?: string; date?: string; processedAt?: string }>(items: T[]): T[] => {
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date(); // 'now' for most ranges

    if (selectedPeriod === 'custom') {
      if (customDateRange.start && customDateRange.end) {
        startDate = new Date(customDateRange.start);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(customDateRange.end);
        endDate.setHours(23, 59, 59, 999);
      } else {
        return items; // No custom range set, return all
      }
    } else {
      switch (selectedPeriod) {
        case 'day':
        case '1d':
          startDate.setDate(now.getDate() - 0);
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);
          break;
        case '2days':
          startDate.setDate(now.getDate() - 1);
          startDate.setHours(0, 0, 0, 0);
          break;
        case '3days':
          startDate.setDate(now.getDate() - 2);
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 6);
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'month':
          startDate.setDate(now.getDate() - 29);
          startDate.setHours(0, 0, 0, 0);
          break;
        case '3months':
          startDate.setDate(now.getDate() - 89);
          startDate.setHours(0, 0, 0, 0);
          break;
        case '6months':
          startDate.setMonth(now.getMonth() - 6);
          startDate.setHours(0, 0, 0, 0);
          break;
        default:
          return items;
      }
    }

    return items.filter(item => {
      const itemDateStr = item.createdAt || item.date || item.processedAt;
      if (!itemDateStr) return false;
      const itemDate = new Date(itemDateStr);
      return itemDate >= startDate && itemDate <= endDate;
    });
  };

  // Filtered orders by selected period
  const filteredOrders = filterItemsByPeriod<Order>(orders);

  // Filtered returns by selected period
  const filteredReturns = filterItemsByPeriod<Return>(returns);

  // Filtered unknown products by selected period
  const filteredUnknownProducts = filterItemsByPeriod<UnknownProduct>(unknownProducts);

  // Aggregate Top Returns by selected period
  const topReturnsByPeriod = React.useMemo(() => {
    const aggregated = new Map<string, { productId: string; productName: string; quantity: number }>();
    filteredReturns.forEach((ret: Return) => {
      const key = ret.productId || ret.productName;
      const prevValue = aggregated.get(key) || { productId: ret.productId, productName: ret.productName, quantity: 0 };
      prevValue.quantity += Number(ret.quantity);
      aggregated.set(key, prevValue);
    });
    return Array.from(aggregated.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);
  }, [filteredReturns]);

  // حساب أعلى المنتجات المباعة حسب الفترة المختارة
  const topProducts = useMemo(() => analytics.getTopProducts(filteredOrders, filteredReturns, 5, filteredUnknownProducts), [filteredOrders, filteredReturns, filteredUnknownProducts]);

  // قائمة كاملة بالمنتجات الأكثر مبيعًا للنافذة المنبثقة
  const allTopProducts = useMemo(() => analytics.getTopProducts(filteredOrders, filteredReturns, undefined, filteredUnknownProducts), [filteredOrders, filteredReturns, filteredUnknownProducts]);

  const sortedTopProducts = useMemo(() => {
    return [...allTopProducts].sort((a, b) => {
      if (topProductsSortBy === 'profit') {
        return (b.profit || 0) - (a.profit || 0);
      }
      if (topProductsSortBy === 'sales') {
        return b.sales - a.sales;
      }
      // default to quantity
      return b.quantity - a.quantity;
    });
  }, [allTopProducts, topProductsSortBy]);

  // إعادة حساب topProducts عند تغيير البيانات
  useEffect(() => {
    // هذا سيؤدي إلى إعادة حساب topProducts عند تغيير orders أو returns
    console.log('Data changed, recalculating topProducts:', {
      ordersCount: orders.length,
      returnsCount: returns.length,
      filteredOrdersCount: filteredOrders.length,
      filteredReturnsCount: filteredReturns.length
    });
  }, [orders, returns, filteredOrders, filteredReturns]);

  // إضافة فحص مفصل للبيانات
  useEffect(() => {
    console.log('=== DETAILED DATA ANALYSIS ===');
    console.log('All orders:', orders);
    console.log('All returns:', returns);
  });

  // حساب إجمالي القطع المباعة لجميع المنتجات
  const totalSoldQuantity = useMemo(() => topProducts.reduce((sum: number, p) => sum + p.quantity, 0), [topProducts]);

  // Use filteredOrders and filteredReturns in analytics and lists
  // Calculate financials for 'Cash Flow'
  // Calculate financials for 'Cash Flow' page specifically (ALL TIME DATA)
  // Logic: Deduct bills from Profit first, then from Capital if Profit hits 0.
  // "Cash Flow page is not linked to 'last day' statistics, it is a record of all financial operations"
  const cashFlowFinancials = useMemo(() => {
    // A. Base Values (All Time)
    const currentTotalSales = analytics.getTotalSales(orders, returns);
    const currentGrossProfit = analytics.getTotalProfit(orders, returns, unknownProducts.filter(up => up.linkedProductId));
    const currentRecoveredCost = currentTotalSales - currentGrossProfit; // Base Capital

    // B. Total Bills (Expenses) - All Time
    const totalBillsAmount = bills.reduce((acc, bill) => acc + (Number(bill.amount) || 0), 0);

    // C. Deduction Logic
    // 1. Deduct from Profit
    // FinalProfit = max(0, GrossProfit - TotalBills)
    // We keep Profit >= 0 as per "Waterfall" logic requests, but allow Capital/Sales to go negative.
    const finalProfit = Math.max(0, currentGrossProfit - totalBillsAmount);

    // 2. Calculate what couldn't be covered by Profit
    // ExcessBill = max(0, TotalBills - GrossProfit)
    const excessBill = Math.max(0, totalBillsAmount - currentGrossProfit);

    // 3. Deduct remainder from Capital
    // FinalCapital = BaseCapital - ExcessBill (Can be negative)
    const finalCapital = currentRecoveredCost - excessBill;

    // 4. Final 'Total Sales' (Net Balance)
    // Should equal FinalProfit + FinalCapital
    // If Profit is 0, NetBalance = FinalCapital.
    const finalTotalSales = finalProfit + finalCapital;

    return {
      grossProfit: currentGrossProfit,
      totalBills: totalBillsAmount,
      displayProfit: finalProfit,
      displayCapital: finalCapital,
      totalSales: finalTotalSales
    };
  }, [orders, returns, bills, unknownProducts]);

  const analyticsCards = useMemo(() => [
    {
      title: t('totalSales'),
      value: analytics.getTotalSales(filteredOrders, filteredReturns).toFixed(2),
      icon: DollarSign,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      change: '+12.5%',
      changeType: 'positive' as const
    },
    {
      title: t('totalOrders'),
      value: filteredOrders.length,
      icon: ShoppingCart,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      change: '+8.2%',
      changeType: 'positive' as const
    },
    {
      title: t('profits'),
      value: analytics.getTotalProfit(filteredOrders, filteredReturns, filteredUnknownProducts.filter(up => up.linkedProductId)).toFixed(2),
      icon: TrendingUp,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      change: '+15.3%',
      changeType: 'positive' as const
    },
    {
      title: t('returns'),
      value: filteredReturns.length,
      icon: RotateCcw,
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      change: '-2.1%',
      changeType: 'negative' as const
    },
    {
      title: 'Debt',
      value: (() => {
        const grossDebt = filteredOrders.filter(o => o.type === 'bank' && o.bankAction === 'debt').reduce((acc, o) => acc + o.totalAmount, 0);
        const payments = filteredOrders.filter(o => o.type === 'bank' && o.bankAction === 'payment').reduce((acc, o) => acc + o.totalAmount, 0);
        return (grossDebt - payments).toFixed(2);
      })(),
      icon: Wallet,
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
      change: (() => {
        const grossDebt = filteredOrders.filter(o => o.type === 'bank' && o.bankAction === 'debt').reduce((acc, o) => acc + o.totalAmount, 0);
        const payments = filteredOrders.filter(o => o.type === 'bank' && o.bankAction === 'payment').reduce((acc, o) => acc + o.totalAmount, 0);
        return `Debt: $${grossDebt.toFixed(0)} | Paid: $${payments.toFixed(0)}`;
      })(),
      changeType: 'positive' as const
    }
  ], [filteredOrders, filteredReturns, filteredUnknownProducts, t]);

  // بيانات الرسم البياني للمرتجعات الحقيقية
  const generateReturnsChartData = () => {
    const last7Days = [];
    const returnsData = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      last7Days.push(date.toLocaleDateString('en-US', { weekday: 'short' }));

      // حساب المرتجعات لهذا اليوم
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      // استخدم filteredReturns فقط
      const dayReturns = filteredReturns.filter(ret => {
        const returnDate = new Date(ret.processedAt || ret.date);
        return returnDate >= dayStart && returnDate <= dayEnd;
      });

      const dayReturnsValue = dayReturns.reduce((total, ret) => {
        const product = products.find(p => p.id === ret.productId);
        return total + (product ? product.price * ret.quantity : 0);
      }, 0);

      returnsData.push(dayReturnsValue);
    }

    return {
      labels: last7Days,
      datasets: [
        {
          label: t('returns'),
          data: returnsData,
          backgroundColor: 'rgba(239, 68, 68, 0.5)',
          borderColor: 'rgba(239, 68, 68, 1)',
          borderWidth: 1,
        },
      ],
    };
  };

  // بيانات الرسم البياني للمبيعات اليومية فقط - دائماً آخر 30 يوم
  const generateSalesChartData = () => {
    const last30Days = [];
    const salesData = [];
    const dateMap = []; // Store the actual date string for each point
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      last30Days.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      // FIX: Use local date parts to avoid timezone conversion issues with toISOString()
      const year = dayStart.getFullYear();
      const month = String(dayStart.getMonth() + 1).padStart(2, '0');
      const day = String(dayStart.getDate()).padStart(2, '0');
      dateMap.push(`${year}-${month}-${day}`);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      const dayOrders = orders.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= dayStart && orderDate <= dayEnd;
      });
      const dayReturns = returns.filter(ret => {
        const returnDate = new Date(ret.date);
        return returnDate >= dayStart && returnDate <= dayEnd;
      });
      const daySales = dayOrders
        .filter(order => !(order.status === 'cancelled' && order.totalAmount < 0))
        .reduce((total, order) => total + order.totalAmount, 0);
      const dayReturnsValue = dayReturns.reduce((total, ret) => {
        const product = products.find(p => p.id === ret.productId);
        return total + (product ? product.price * ret.quantity : 0);
      }, 0);

      salesData.push(daySales - dayReturnsValue);
    }
    return {
      labels: last30Days,
      datasets: [
        {
          label: t('sales'),
          _dateMap: dateMap, // Attach the date map to the dataset
          data: salesData,
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 1,
        },
      ],
    };
  };

  const generateHourlyChartData = (dateStr: string) => {
    const hourlySales = new Array(24).fill(0);
    const hourlyLabels = Array.from({ length: 24 }, (_, i) => `${i}:00`);

    const [year, month, day] = dateStr.split('-').map(Number);
    const targetDate = new Date(year, month - 1, day);
    targetDate.setHours(0, 0, 0, 0);
    const nextDate = new Date(targetDate);
    nextDate.setDate(targetDate.getDate() + 1);

    const dayOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= targetDate && orderDate < nextDate;
    });

    dayOrders.forEach(order => {
      const hour = new Date(order.createdAt).getHours();
      hourlySales[hour] += order.totalAmount;
    });

    return {
      labels: hourlyLabels,
      datasets: [
        {
          label: `${t('sales')} - ${format(targetDate, 'dd/MM/yyyy')}`,
          data: hourlySales,
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 1,
        },
      ],
    };
  };

  const handleChartClick = (event: any, elements: any[]) => {
    if (elements.length > 0) {
      const firstElement = elements[0];
      const dataIndex = firstElement.index;
      const dateStr = salesChartData.datasets[0]._dateMap?.[dataIndex];
      if (dateStr) {
        setSelectedDayForBreakdown(dateStr);
        setShowBreakdownDialog(true);
      }
    }
  };

  const salesChartData = useMemo(() => generateSalesChartData(), [orders, returns, t]);

  // دالة تحميل البيانات
  const loadData = useCallback(async () => {
    if (isUpdatingStorage) {
      console.log('Storage update in progress, skipping loadData. isUpdatingStorage:', isUpdatingStorage);
      return;
    }

    try {
      console.log('=== بداية تحميل البيانات ===', 'isUpdatingStorage before:', isUpdatingStorage);

      // تعيين حالة التحديث قبل أي عملية
      setIsUpdatingStorage(true);
      console.log('Set isUpdatingStorage to true');

      // تشخيص وإصلاح البيانات أولاً
      const fixedData = diagnoseAndFixData();

      // إعادة إنشاء top returns إذا كانت البيانات موجودة
      if (fixedData.returns.length > 0) {
        rebuildTopReturns();
      }

      // تنظيف البيانات المتلفة
      cleanupCorruptedData();

      // تحميل البيانات المحدثة مع التأكد من أنها مصفوفات
      const productsData = productStorage.getAll() || [];
      const ordersData = orderStorage.getAll() || [];
      const providersData = providerStorage.getAll() || [];
      const employeesData = employeeStorage.getAll() || [];
      const billsData = billStorage.getAll() || [];
      const returnsData = returnsStorage.getAll() || [];
      const unknownRequestsData = unknownRequestStorage.getAll() || [];
      const topReturnsData = topReturnStorage.getAll().slice(0, 10) || [];
      const unknownProductsData = unknownProductStorage.getAll() || [];

      // Update state with loaded data
      setProducts([...productsData]);
      setOrders([...ordersData]);
      setProviders([...providersData]);
      setEmployees([...employeesData]);
      setBills([...billsData]); // Ensure new reference
      setReturns([...returnsData]);
      setUnknownRequests([...unknownRequestsData]);
      setTopReturns([...topReturnsData]);
      setUnknownProducts([...unknownProductsData]);

      console.log('Data loaded successfully:', {
        products: productsData.length,
        orders: ordersData.length,
        providers: providersData.length,
        employees: employeesData.length,
        bills: billsData.length,
        returns: returnsData.length,
        unknownProducts: unknownProductsData.length,
      });

      // إجبار إعادة حساب الفائدة المضافة بعد تحميل البيانات
      setTimeout(() => {
        setForceUpdateCounter(prev => prev + 1);
      }, 100);
    } catch (error) {
      console.error('Error loading data:', error);
      // تحسين معالجة الأخطاء مع رسائل أكثر وضوحاً
      const errorMessage = error instanceof Error ? error.message : 'خطأ غير معروف';
      console.warn(`فشل في تحميل البيانات: ${errorMessage}`);

      // في حالة الخطأ، تعيين مصفوفات فارغة
      setProducts([]);
      setOrders([]);
      setProviders([]);
      setEmployees([]);
      setBills([]);
      setReturns([]);
    } finally {
      console.log('=== انتهاء تحميل البيانات ===', 'Setting isUpdatingStorage to false');
      setIsUpdatingStorage(false);
    }
  }, []);

  // دالة لتنظيف البيانات القديمة والمتكررة (بدون إظهار alert)
  const cleanupOldDataSilently = useCallback(() => {
    if (isUpdatingStorage) {
      console.log('Storage update in progress, skipping cleanup');
      return;
    }

    console.log('Cleaning up old data silently...');
    setIsUpdatingStorage(true);

    try {
      // تنظيف المنتجات المتكررة
      const allProducts = productStorage.getAll();
      const uniqueProducts = allProducts.filter((product: Product, index: number, self: Product[]) =>
        index === self.findIndex((p: Product) => p.id === product.id)
      );

      if (uniqueProducts.length !== allProducts.length) {
        console.log(`Removed ${allProducts.length - uniqueProducts.length} duplicate products`);
        storage.set('products', uniqueProducts);
      }

      // تنظيف الطلبات المتكررة
      const allOrders = orderStorage.getAll();
      const uniqueOrders = allOrders.filter((order: Order, index: number, self: Order[]) =>
        index === self.findIndex((o: Order) => o.id === order.id)
      );

      if (uniqueOrders.length !== allOrders.length) {
        console.log(`Removed ${allOrders.length - uniqueOrders.length} duplicate orders`);
        storage.set('orders', uniqueOrders);
      }

      // تنظيف المرتجعات المتكررة
      const allReturns = returnsStorage.getAll();
      const uniqueReturns = allReturns.filter((ret: Return, index: number, self: Return[]) =>
        index === self.findIndex((r: Return) => r.id === ret.id)
      );

      if (uniqueReturns.length !== allReturns.length) {
        console.log(`Removed ${allReturns.length - uniqueReturns.length} duplicate returns`);
        storage.set('returns', uniqueReturns);
      }

      // تنظيف الموردين المتكررين
      const allProviders = providerStorage.getAll();
      const uniqueProviders = allProviders.filter((provider: Provider, index: number, self: Provider[]) =>
        index === self.findIndex((p: Provider) => p.id === provider.id)
      );

      if (uniqueProviders.length !== allProviders.length) {
        console.log(`Removed ${allProviders.length - uniqueProviders.length} duplicate providers`);
        storage.set('providers', uniqueProviders);
      }

      // تنظيف الموظفين المتكررين
      const allEmployees = employeeStorage.getAll();
      const uniqueEmployees = allEmployees.filter((employee: Employee, index: number, self: Employee[]) =>
        index === self.findIndex((e: Employee) => e.id === employee.id)
      );

      if (uniqueEmployees.length !== allEmployees.length) {
        console.log(`Removed ${allEmployees.length - uniqueEmployees.length} duplicate employees`);
        storage.set('employees', uniqueEmployees);
      }

      // تنظيف الفواتير المتكررة
      const allBills = billStorage.getAll();
      const uniqueBills = allBills.filter((bill: Bill, index: number, self: Bill[]) =>
        index === self.findIndex((b: Bill) => b.id === bill.id)
      );

      if (uniqueBills.length !== allBills.length) {
        console.log(`Removed ${allBills.length - uniqueBills.length} duplicate bills`);
        storage.set('bills', uniqueBills);
      }

      console.log('Data cleanup completed silently');
    } catch (error) {
      console.error('Error during silent cleanup:', error);
    } finally {
      setIsUpdatingStorage(false);
    }
  }, [isUpdatingStorage]);

  // Load data on component mount
  useEffect(() => {
    // إصلاح البيانات أولاً
    const fixedData = diagnoseAndFixData();
    console.log('Data fixed on mount:', fixedData);

    // إعادة إنشاء top returns إذا كانت البيانات موجودة
    if (fixedData.returns.length > 0) {
      rebuildTopReturns();
    }

    loadData();
    // تنظيف البيانات القديمة بدون إظهار alert
    cleanupOldDataSilently();
  }, [loadData, cleanupOldDataSilently]);



  // دالة لتنظيف البيانات القديمة والمتكررة (مع إظهار alert)
  const cleanupOldData = () => {
    if (isUpdatingStorage) {
      console.log('Storage update in progress, skipping cleanup');
      return;
    }

    console.log('Cleaning up old data...');
    setIsUpdatingStorage(true);

    try {
      // تنظيف المنتجات المتكررة
      const allProducts = productStorage.getAll();
      const uniqueProducts = allProducts.filter((product: Product, index: number, self: Product[]) =>
        index === self.findIndex((p: Product) => p.id === product.id)
      );

      if (uniqueProducts.length !== allProducts.length) {
        console.log(`Removed ${allProducts.length - uniqueProducts.length} duplicate products`);
        storage.set('products', uniqueProducts);
      }

      // تنظيف الطلبات المتكررة
      const allOrders = orderStorage.getAll();
      const uniqueOrders = allOrders.filter((order: Order, index: number, self: Order[]) =>
        index === self.findIndex((o: Order) => o.id === order.id)
      );

      if (uniqueOrders.length !== allOrders.length) {
        console.log(`Removed ${allOrders.length - uniqueOrders.length} duplicate orders`);
        storage.set('orders', uniqueOrders);
      }

      // تنظيف المرتجعات المتكررة
      const allReturns = returnsStorage.getAll();
      const uniqueReturns = allReturns.filter((ret: Return, index: number, self: Return[]) =>
        index === self.findIndex((r: Return) => r.id === ret.id)
      );

      if (uniqueReturns.length !== allReturns.length) {
        console.log(`Removed ${allReturns.length - uniqueReturns.length} duplicate returns`);
        storage.set('returns', uniqueReturns);
      }

      // تنظيف الموردين المتكررين
      const allProviders = providerStorage.getAll();
      const uniqueProviders = allProviders.filter((provider: Provider, index: number, self: Provider[]) =>
        index === self.findIndex((p: Provider) => p.id === provider.id)
      );

      if (uniqueProviders.length !== allProviders.length) {
        console.log(`Removed ${allProviders.length - uniqueProviders.length} duplicate providers`);
        storage.set('providers', uniqueProviders);
      }

      // تنظيف الموظفين المتكررين
      const allEmployees = employeeStorage.getAll();
      const uniqueEmployees = allEmployees.filter((employee: Employee, index: number, self: Employee[]) =>
        index === self.findIndex((e: Employee) => e.id === employee.id)
      );

      if (uniqueEmployees.length !== allEmployees.length) {
        console.log(`Removed ${allEmployees.length - uniqueEmployees.length} duplicate employees`);
        storage.set('employees', uniqueEmployees);
      }

      // تنظيف الفواتير المتكررة
      const allBills = billStorage.getAll();
      const uniqueBills = allBills.filter((bill: Bill, index: number, self: Bill[]) =>
        index === self.findIndex((b: Bill) => b.id === bill.id)
      );

      if (uniqueBills.length !== allBills.length) {
        console.log(`Removed ${allBills.length - uniqueBills.length} duplicate bills`);
        storage.set('bills', uniqueBills);
      }

      console.log('Data cleanup completed');

      // إظهار رسالة نجاح
      alert('تم تنظيف البيانات بنجاح!');
    } catch (error) {
      console.error('Error during cleanup:', error);
      alert('حدث خطأ أثناء تنظيف البيانات');
    } finally {
      setIsUpdatingStorage(false);
    }
  };

  // دالة لمسح جميع البيانات
  const clearAllData = () => {
    if (confirm('هل أنت متأكد من مسح جميع البيانات؟ هذا الإجراء لا يمكن التراجع عنه!')) {
      console.log('Clearing all data...');

      // مسح جميع البيانات من localStorage
      localStorage.removeItem('mpm_products');
      localStorage.removeItem('mpm_orders');
      localStorage.removeItem('mpm_returns');
      localStorage.removeItem('mpm_providers');
      localStorage.removeItem('mpm_employees');
      localStorage.removeItem('mpm_bills');

      console.log('All data cleared');

      // إعادة تحميل البيانات
      loadData();

      // إظهار رسالة نجاح
      alert('تم مسح جميع البيانات بنجاح!');
    }
  };



  // دالة تنظيف البيانات المتلفة
  const cleanupCorruptedData = () => {
    try {
      // التحقق من صحة البيانات وتنظيفها إذا كانت متلفة
      const products = productStorage.getAll();
      const orders = orderStorage.getAll();
      const returns = returnsStorage.getAll();
      const providers = providerStorage.getAll();
      const employees = employeeStorage.getAll();
      const bills = billStorage.getAll();

      console.log('Data validation completed');
    } catch (error) {
      console.error('Error during data cleanup:', error);

      // تحسين معالجة أخطاء تنظيف البيانات
      const errorMessage = error instanceof Error ? error.message : '';
      console.warn(`خطأ أثناء تنظيف البيانات: ${errorMessage}`);

      if (error instanceof Error) {
        // معالجة أكثر دقة للأخطاء المختلفة
        const storageKeys = [
          { key: 'products', item: 'mpm_products' },
          { key: 'orders', item: 'mpm_orders' },
          { key: 'returns', item: 'mpm_returns' },
          { key: 'providers', item: 'mpm_providers' },
          { key: 'employees', item: 'mpm_employees' },
          { key: 'bills', item: 'mpm_bills' }
        ];

        storageKeys.forEach(({ key, item }) => {
          if (errorMessage.includes(key)) {
            try {
              localStorage.removeItem(item);
              console.log(`تم حذف البيانات التالفة: ${key}`);
            } catch (removeError) {
              console.error(`فشل في حذف ${key}:`, removeError);
            }
          }
        });
      }
    }
  };

  // Reload data when period changes
  useEffect(() => {
    // This will trigger re-render with filtered data
  }, [selectedPeriod, customDateRange]);

  // Add event listener to reload data when localStorage changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      // Reload data when any MPM storage key changes
      if (e.key && e.key.startsWith('mpm_')) {
        console.log('Storage changed, reloading data:', e.key);
        loadData();
      }
    };

    // Listen for storage events (when data changes in other tabs/windows)
    window.addEventListener('storage', handleStorageChange);

    // Also listen for custom storage events (for same-tab updates)
    const handleCustomStorageChange = () => {
      if (isUpdatingStorage) {
        console.log('Storage update in progress, ignoring custom storage change event. isUpdatingStorage:', isUpdatingStorage);
        return;
      }
      console.log('Custom storage change detected, reloading data. isUpdatingStorage:', isUpdatingStorage);
      loadData();
    };

    // معالج قوي لإجبار التحديث الفوري (يتجاهل isUpdatingStorage)
    const handleForceStorageUpdate = () => {
      console.log('FORCE storage update triggered - bypassing isUpdatingStorage check');
      // إجبار إعادة تحميل البيانات مع تجاهل حالة isUpdatingStorage
      const forceLoadData = async () => {
        try {
          console.log('=== إجبار تحميل البيانات ===');

          // تشخيص وإصلاح البيانات أولاً
          const fixedData = diagnoseAndFixData();

          // إعادة إنشاء top returns إذا كانت البيانات موجودة
          if (fixedData.returns.length > 0) {
            rebuildTopReturns();
          }

          // تنظيف البيانات المتلفة
          cleanupCorruptedData();

          // تحميل البيانات المحدثة مع التأكد من أنها مصفوفات
          const productsData = productStorage.getAll() || [];
          const ordersData = orderStorage.getAll() || [];
          const providersData = providerStorage.getAll() || [];
          const employeesData = employeeStorage.getAll() || [];
          const billsData = billStorage.getAll() || [];
          const returnsData = returnsStorage.getAll() || [];
          const unknownRequestsData = unknownRequestStorage.getAll() || [];
          const topReturnsData = topReturnStorage.getAll().slice(0, 10) || [];
          const unknownProductsData = unknownProductStorage.getAll() || [];
          // تحديث حالة التطبيق
          setProducts(productsData);
          setOrders(ordersData);
          setProviders(providersData);
          setEmployees(employeesData);
          setBills(billsData);
          setReturns(returnsData);
          setUnknownRequests(unknownRequestsData);
          setTopReturns(topReturnsData);
          setUnknownProducts(unknownProductsData);

          // إجبار إعادة حساب الفائدة المضافة
          setForceUpdateCounter(prev => prev + 1);

          console.log('Force data reload completed successfully');
        } catch (error) {
          console.error('Error in force data reload:', error);
        }
      };

      forceLoadData();
    };

    window.addEventListener('storage-updated', handleCustomStorageChange);
    window.addEventListener('force-storage-update', handleForceStorageUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('storage-updated', handleCustomStorageChange);
      window.removeEventListener('force-storage-update', handleForceStorageUpdate);
    };
  }, [loadData, isUpdatingStorage]);

  const handleClearAllData = () => {
    if (confirm(t('confirmEraseAllData'))) {
      try {
        console.log('Starting comprehensive data clearing...');

        // حذف جميع النسخ الاحتياطية من النظام
        ManagedStorage.clearAllSystemBackups();

        // مسح البيانات من localStorage باستخدام الدالة المحسنة
        storage.clearAllData();

        // مسح إضافي للتأكد من حذف جميع البيانات
        window.localStorage.clear();

        // إعادة تعيين حالة التطبيق إلى مصفوفات فارغة
        setProducts([]);
        setOrders([]);
        setProviders([]);
        setEmployees([]);
        setBills([]);
        setReturns([]);
        setUnknownRequests([]);
        setTopReturns([]);

        // إعادة تعيين الحالات الأخرى
        setSelectedPeriod('7d');
        setCustomDateRange({ start: '', end: '' });
        setCurrentDayOffset(0);

        // إرسال حدث تحديث البيانات
        window.dispatchEvent(new Event('storage-updated'));

        console.log('Data clearing completed successfully');
        alert('تم مسح جميع البيانات والنسخ الاحتياطية بنجاح!');

        // إعادة تحميل الصفحة بعد ثانيتين لضمان التحديث الكامل
        setTimeout(() => {
          window.location.reload();
        }, 2000);

      } catch (error) {
        console.error('Error clearing data:', error);
        const errorMessage = error instanceof Error ? error.message : 'خطأ غير معروف';
        console.warn(`فشل في مسح البيانات: ${errorMessage}`);
        alert(`حدث خطأ أثناء مسح البيانات: ${errorMessage}. يرجى المحاولة مرة أخرى.`);
      }
    }
  };



  const checkStorageStatus = () => {
    const status = storage.getStorageStatus();
    const message = `
${t('storageStatus')}:
- ${t('products')}: ${status.products}
- ${t('orders')}: ${status.orders}
- ${t('returns')}: ${status.returns}
- ${t('providers')}: ${status.providers}
- ${t('employees')}: ${status.employees}
- ${t('bills')}: ${status.bills}
- ${t('unknownProducts')}: ${status.unknownProducts}
- ${t('unknownRequests')}: ${status.unknownRequests}
- ${t('topReturns')}: ${status.topReturns}
- ${t('totalSize')}: ${(status.totalSize / 1024).toFixed(2)} KB
`;
    alert(message);
  };

  const periods = [
    { value: '1d', label: t('lastDay') },
    { value: '2d', label: t('last2Days') },
    { value: '3d', label: t('last3Days') },
    { value: '7d', label: t('lastWeek') },
    { value: '30d', label: t('lastMonth') },
    { value: '90d', label: t('last3Months') },
    { value: '180d', label: t('last6Months') },
    { value: 'custom', label: t('customPeriod') }
  ];

  const handleEditAccount = () => {
    setEditFormData({
      fullName: user?.fullName || '',
      phoneNumber: user?.phoneNumber || '',
      storeName: user?.storeName || ''
    });
    setShowEditAccount(true);
  };

  const handleSaveAccount = () => {
    // Update user data using the context function
    updateUser({
      fullName: editFormData.fullName,
      phoneNumber: editFormData.phoneNumber,
      storeName: editFormData.storeName
    });

    console.log('Saving account data:', editFormData);
    setShowEditAccount(false);
    // إرسال حدث تحديث البيانات
    window.dispatchEvent(new Event('storage-updated'));
  };

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    if (period !== 'custom') {
      setCustomDateRange({ start: '', end: '' });
    }
    // إرسال حدث تحديث البيانات
    window.dispatchEvent(new Event('storage-updated'));
  };

  const sidebarItems = [
    { id: 'dashboard', label: t('dashboard'), icon: Activity },
    { id: 'customers', label: language === 'ar' ? 'العملاء' : 'Customers', icon: Users },
    { id: 'orders', label: t('orders'), icon: ShoppingCart },
    { id: 'products', label: t('products'), icon: Package },
    { id: 'unknownProducts', label: t('unknownProducts'), icon: HelpCircle },
    { id: 'providers', label: t('providers'), icon: Truck },
    { id: 'employees', label: t('employees'), icon: UserCheck },
    { id: 'bills', label: language === 'ar' ? 'التدفق النقدي' : 'Cash Flow', icon: Receipt },
    { id: 'returns', label: t('returns'), icon: RotateCcw },
    { id: 'reports', label: t('reports'), icon: FileText },
    { id: 'settings', label: t('settings'), icon: SettingsIcon },
  ];


  const handleSaveEmployee = (employee: Employee) => {
    loadData();
    setEmployeeFormOpen(false);
    setEditingEmployee(null);
    window.dispatchEvent(new Event('storage-updated'));
  };


  const handleSaveProduct = (product: Product) => {
    // Save the product to storage
    const productData = {
      name: product.name,
      serialNumber: product.serialNumber || '',
      price: Number(product.price || 0), // Sale Price is stored as 'price'
      purchasePrice: Number(product.purchasePrice || 0),
      tax: Number(product.tax || 0),
      quantity: Number(product.quantity || 0),
      totalSales: 0
    };
    productStorage.add({
      ...productData,
      quantity: Number(productData.quantity)
    });
    loadData();
    setShowProductForm(false);
    // إرسال حدث تحديث البيانات
    window.dispatchEvent(new Event('storage-updated'));
  };

  const handleUpdateBill = (updatedBill: Bill) => {
    billStorage.update(updatedBill.id, updatedBill);
    try {
      const allBills = billStorage.getAll();
      setBills([...allBills]);
    } catch (e) {
      console.error("Error fetching bills directly:", e);
    }
    loadData();
    setEditingBill(null);
    window.dispatchEvent(new Event('storage-updated'));
  };

  const handleSaveBill = (bill: Bill) => {
    // Force immediate update of bills state from storage to ensure UI reflects changes instantly
    // preventing any race conditions with loadData or isUpdatingStorage
    try {
      const allBills = billStorage.getAll();
      setBills([...allBills]); // Spread to ensure new array reference for React state update
    } catch (e) {
      console.error("Error fetching bills directly:", e);
    }

    // Trigger full data reload
    loadData();
    setShowBillForm(false);

    // Notify other components
    window.dispatchEvent(new Event('storage-updated'));
  };




  const handleEditProvider = (provider: Provider) => {
    setEditingProvider(provider);
    setProviderFormOpen(true); // فتح النموذج عند التعديل
  };

  const handleDeleteProvider = (id: string) => {
    providerStorage.delete(id);
    loadData();
    // إرسال حدث تحديث البيانات
    window.dispatchEvent(new Event('storage-updated'));
  };

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
    setEmployeeFormOpen(true);
  };

  const handleDeleteEmployee = (id: string) => {
    employeeStorage.delete(id);
    loadData();
    // إرسال حدث تحديث البيانات
    window.dispatchEvent(new Event('storage-updated'));
  };

  const handleEditBill = (bill: Bill) => {
    setEditingBill(bill);
  };

  const handleDeleteBill = (id: string) => {
    billStorage.delete(id);
    loadData();
    // إرسال حدث تحديث البيانات
    window.dispatchEvent(new Event('storage-updated'));
  };

  const handleBackToMain = () => {
    resetRoleSelection();
  };

  // State for clear by date dialog
  const [showClearByDateDialog, setShowClearByDateDialog] = useState(false);
  const [clearDateRange, setClearDateRange] = useState({ start: '', end: '' });

  const handleOpenClearByDateDialog = () => {
    setShowClearByDateDialog(true);
  };

  const handleConfirmClearByDate = () => {
    if (!clearDateRange.start || !clearDateRange.end) {
      alert('Please select a start and end date.');
      return;
    }
    if (confirm(t('confirmClearByDate'))) {
      const startDate = new Date(clearDateRange.start);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(clearDateRange.end);
      endDate.setHours(23, 59, 59, 999);

      const filterByDate = (items: any[]) => items.filter((item: any) => {
        const itemDateStr = item.createdAt || item.date || item.timestamp;
        if (!itemDateStr) return true; // Keep items without a date
        const itemDate = new Date(itemDateStr);
        return itemDate < startDate || itemDate > endDate;
      });

      storage.set('orders', filterByDate(orderStorage.getAll()));
      storage.set('returns', filterByDate(returnsStorage.getAll()));
      storage.set('bills', filterByDate(billStorage.getAll()));
      storage.set('unknown_products', filterByDate(unknownProductStorage.getAll()));
      storage.set('unknown_requests', filterByDate(unknownRequestStorage.getAll()));
      storage.set('cashier_activities', filterByDate(cashierActivityStorage.getAll()));
      storage.set('daily_sales', filterByDate(dailySalesStorage.getAll()));

      alert(t('dataClearedByDate'));
      setShowClearByDateDialog(false);
      setClearDateRange({ start: '', end: '' });
      loadData(); // Reload data to reflect changes
    }
  };

  interface AppSettings {
    showUnknownProductButton: boolean;
    allowPriceModification: boolean;
  }

  const handleFeatureToggle = (feature: keyof AppSettings, value: boolean) => {
    const newSettings = { ...settings, [feature]: value };
    setSettings(newSettings);
    settingsStorage.set(newSettings);
    window.dispatchEvent(new Event('storage-updated')); // Notify same tab and other tabs
  };

  const renderSettingsContent = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-primary-800 mb-2">
          {t('settings')}
        </h2>
        <p className="text-gray-600">
          {t('manageSettingsDescription')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Language Settings */}
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="text-primary-800 flex items-center">
              <Globe className="w-5 h-5 mr-2" />
              {t('languages')}
            </CardTitle>
            <CardDescription>{t('chooseLanguage')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button
                variant={language === 'en' ? 'default' : 'outline'}
                className="w-full justify-start touch-manipulation min-h-[48px]"
                onClick={() => {
                  setLanguage('en');
                  window.dispatchEvent(new Event('storage-updated'));
                }}
              >
                English
              </Button>
              <Button
                variant={language === 'ar' ? 'default' : 'outline'}
                className="w-full justify-start touch-manipulation min-h-[48px]"
                onClick={() => {
                  setLanguage('ar');
                  window.dispatchEvent(new Event('storage-updated'));
                }}
              >
                العربية
              </Button>
              <Button
                variant={language === 'fr' ? 'default' : 'outline'}
                className="w-full justify-start touch-manipulation min-h-[48px]"
                onClick={() => {
                  setLanguage('fr');
                  window.dispatchEvent(new Event('storage-updated'));
                }}
              >
                Français
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Feature Management */}
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="text-primary-800 flex items-center">
              <SettingsIcon className="w-5 h-5 mr-2" />
              {t('featureManagement')}
            </CardTitle>
            <CardDescription>Enable or disable application features</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                <Label htmlFor="unknown-product-toggle" className="font-medium">Show "Unknown Product" Button</Label>
                <Switch id="unknown-product-toggle" checked={settings.showUnknownProductButton} onCheckedChange={(checked: boolean) => handleFeatureToggle('showUnknownProductButton', checked)} />
              </div>
              <div className="flex items-center justify-between p-3 bg-background rounded-lg border">
                <Label htmlFor="price-modification-toggle" className="font-medium">Show "change price" board</Label>
                <Switch id="price-modification-toggle" checked={settings.allowPriceModification} onCheckedChange={(checked: boolean) => handleFeatureToggle('allowPriceModification', checked)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Support */}
        <Card className="bg-card shadow-lg">
          <CardHeader>
            <CardTitle className="text-primary-800 flex items-center">
              <HelpCircle className="w-5 h-5 mr-2" />
              {t('support')}
            </CardTitle>
            <CardDescription>Get help and support</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button
                variant="outline"
                className="w-full justify-start border-primary-200 hover:bg-primary-50"
              >
                <Phone className="w-4 h-4 mr-2" />
                {t('contactTeam')}
              </Button>
              <Button
                variant="outline"
                onClick={handleOpenClearByDateDialog}
                className="w-full justify-start border-yellow-200 hover:bg-yellow-50 text-yellow-700"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {t('clearDataByDate')}
              </Button>
              <Button
                variant="outline"
                onClick={handleClearAllData}
                className="w-full justify-start border-red-200 hover:bg-red-50 text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All Data
              </Button>
              <div className="text-sm text-gray-500 text-center pt-2">
                MPM 2.0.0
              </div>
            </div>
          </CardContent>
        </Card>
      </div>


    </div>
  );

  const renderOrdersContent = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-primary-800 mb-2">
          {t('orders')}
        </h2>
        <p className="text-primary-600">
          <span className="text-gray-600">Manage orders</span>
        </p>
      </div>
      <div className="flex justify-center gap-2 items-center mb-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentDayOffset(currentDayOffset - 1)} className="h-10 bg-white"
        >
          &larr;
        </Button>
        <div className="flex items-center gap-1">
          <Input
            placeholder="dd/mm/yyyy"
            value={mainDateInput}
            onChange={handleMainDateChange}
            className="w-36 justify-center text-center font-normal h-10 bg-white"
          />
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className="h-10 w-10 shrink-0 bg-white">
                <CalendarDays className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <DynamicCalendar
                selected={targetDay}
                onDateSelect={(date: Date | undefined) => {
                  if (date) {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const diffTime = date.getTime() - today.getTime();
                    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
                    setCurrentDayOffset(diffDays);
                  }
                }}
                t={t}
                locale={locale}
              />
            </PopoverContent>
          </Popover>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentDayOffset(currentDayOffset + 1)} className="h-10 bg-white"
          disabled={currentDayOffset >= 0}
        >
          &rarr;
        </Button>
      </div>
      {/* تم حذف شريط التنقل بين التواريخ هنا */}
      <Card>
        <CardHeader>
          <CardTitle>{t('recentOrders')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center">Order</TableHead>
                  <TableHead className="text-center">Items</TableHead>
                  <TableHead className="text-center">{t('totalAmount')}</TableHead>
                  <TableHead className="text-center">Time</TableHead>
                  <TableHead className="text-center">{t('role') || 'Role'}</TableHead>
                  <TableHead className="text-center">View Order</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ordersOfTheDay.map((order) => (
                  <TableRow key={order.id} className={order.status === 'cancelled' ? 'bg-red-50' : ''}>
                    <TableCell className={`font-mono text-center ${order.totalAmount < 0 ? 'bg-[#ffe4e5] text-[#ff1f28]' : ''}`}>#{order.id.slice(-6)}</TableCell>
                    <TableCell className={`text-center ${order.totalAmount < 0 ? 'bg-[#ffe4e5] text-[#ff1f28]' : ''}`}>{order.items.length}</TableCell>
                    <TableCell className={`text-center ${order.totalAmount < 0 ? 'bg-[#ffe4e5] text-[#ff1f28]' : ''}`}>{order.totalAmount.toFixed(2)}</TableCell>
                    <TableCell className={`text-center ${order.totalAmount < 0 ? 'bg-[#ffe4e5] text-[#ff1f28]' : ''}`}>{format(new Date(order.createdAt), 'HH:mm')}</TableCell>
                    <TableCell className={`text-center ${order.totalAmount < 0 ? 'bg-[#ffe4e5] text-[#ff1f28]' : ''}`}>{order.cashierName || order.cashierId || 'None'}</TableCell>
                    <TableCell className={`text-center ${order.totalAmount < 0 ? 'bg-[#ffe4e5] text-[#ff1f28]' : ''}`}>
                      <Button size="sm" variant="outline" onClick={() => {
                        setSelectedOrder(order);
                        window.dispatchEvent(new Event('storage-updated'));
                      }}><Eye className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {ordersOfTheDay.length === 0 && <div className="text-center text-gray-500 py-8">{t('noOrdersToday')}</div>}
          </div>
        </CardContent>
      </Card>
      {/* نافذة تفاصيل الطلب */}
      {selectedOrder && (
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold mb-2 text-blue-700">Order Details</DialogTitle>
              <DialogDescription>
                View detailed information about the selected order including items, quantities, and totals.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Order ID: <span className="font-mono font-bold text-black">#{selectedOrder.id.slice(-6)}</span></span>
                <span>Date: {new Date(selectedOrder.createdAt).toLocaleString()}</span>
              </div>
              <div className="border-2 border-black-25 rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-100">
                      <TableHead>Product</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedOrder.items.map((item: OrderItem, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell>{item.productName}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{item.price.toFixed(2)}</TableCell>
                        <TableCell>{item.total.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex justify-end text-lg font-bold text-blue-700">
                Total: {selectedOrder.totalAmount.toFixed(2)}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );

  const [billSearchTerm, setBillSearchTerm] = useState('');
  const [searchColumn, setSearchColumn] = useState('all');
  const [viewingBill, setViewingBill] = useState<Bill | null>(null);

  const renderBillsContent = () => {
    // Filter the list by search term and selected column
    const filteredBills = bills.filter(bill => {
      // If no search term, return all
      if (!billSearchTerm) return true;

      const term = billSearchTerm.toLowerCase();

      if (searchColumn === 'all') {
        return (
          bill.title.toLowerCase().includes(term) ||
          bill.description?.toLowerCase().includes(term) ||
          bill.amount.toString().includes(term) ||
          (bill.role && bill.role.toLowerCase().includes(term))
        );
      } else if (searchColumn === 'type') {
        return bill.title.toLowerCase().includes(term);
      } else if (searchColumn === 'amount') {
        return bill.amount.toString().includes(term);
      } else if (searchColumn === 'role') {
        return bill.role && bill.role.toLowerCase().includes(term);
      } else if (searchColumn === 'description') {
        return bill.description && bill.description.toLowerCase().includes(term);
      } else if (searchColumn === 'date') {
        return bill.dueDate && bill.dueDate.includes(term);
      }
      return true;
    });

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-primary-800 mb-2">
              {t('cashFlow')}
            </h2>
            <p className="text-gray-600">
              {t('manageBudgets')}
            </p>
          </div>
          <Button
            onClick={() => setShowBillForm(true)}
            className="bg-primary-600 hover:bg-primary-700 text-white"
          >
            <Plus className="w-5 h-5 mr-2" />
            {t('add')}
          </Button>
        </div>

        {/* Cash Flow Statistics (Always All Time) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{t('totalSales')}</p>
                  <p className={`text-2xl font-bold ${cashFlowFinancials.totalSales < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                    {cashFlowFinancials.totalSales.toFixed(2)}
                  </p>
                </div>
                <Receipt className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{t('profits')}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {cashFlowFinancials.displayProfit.toFixed(2)}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{t('capital')}</p>
                  <p className={`text-2xl font-bold ${cashFlowFinancials.displayCapital < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                    {cashFlowFinancials.displayCapital.toFixed(2)}
                  </p>
                </div>
                <div className="p-2 bg-yellow-100 rounded-full">
                  <Landmark className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder={t('search')}
              value={billSearchTerm}
              onChange={(e) => setBillSearchTerm(e.target.value)}
              className="pl-10 bg-white"
            />
          </div>
          <Select value={searchColumn} onValueChange={setSearchColumn}>
            <SelectTrigger className="w-[180px] bg-white">
              <SelectValue placeholder={t('filterBy')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('all') || 'All Columns'}</SelectItem>
              <SelectItem value="type">{t('billType')}</SelectItem>
              <SelectItem value="amount">{t('amount')}</SelectItem>
              <SelectItem value="role">{t('role') || 'Role'}</SelectItem>
              <SelectItem value="description">{t('description') || 'Description'}</SelectItem>
              <SelectItem value="date">{t('date') || 'Date'}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bills List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="w-6 h-6" />
              {t('cashFlow')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center">{t('billType')}</TableHead>
                    <TableHead className="text-center">{t('amount')}</TableHead>
                    <TableHead className="text-center">{t('time')}</TableHead>
                    <TableHead className="text-center">{t('date')}</TableHead>
                    <TableHead className="text-center">{t('role')}</TableHead>
                    <TableHead className="text-center">{t('actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBills.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        {t('noBills')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredBills
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .map((bill) => (
                        <TableRow key={bill.id} className="hover:bg-gray-50 text-center">
                          <TableCell className="font-medium text-center">
                            <div className="flex items-center justify-center">
                              <div className={`w-3 h-3 rounded-full mr-3 ${bill.title === 'Goods' ? 'bg-orange-500' : 'bg-blue-500'}`}></div>
                              {bill.title}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium text-center">
                            <span className="text-lg font-bold text-green-600">
                              {bill.amount.toFixed(2)}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-gray-500 text-center">
                            {bill.paymentTime || format(new Date(bill.createdAt), 'HH:mm')}
                          </TableCell>
                          <TableCell className="text-sm text-gray-500 text-center">
                            {bill.paymentDate || new Date(bill.createdAt).toLocaleDateString('en-GB')}
                          </TableCell>
                          <TableCell className="text-center">
                            {bill.role || 'Admin'}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setViewingBill(bill)}
                                title={t('view')}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditBill(bill)}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteBill(bill.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* View Bill Dialog */}
        <Dialog open={!!viewingBill} onOpenChange={(open) => !open && setViewingBill(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{t('details')}</DialogTitle>
            </DialogHeader>
            {viewingBill && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-500">{t('billType')}</Label>
                    <p className="font-medium">{viewingBill.title}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">{t('amount')}</Label>
                    <p className="font-bold text-green-600 text-lg">{viewingBill.amount.toFixed(2)}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">{t('time')}</Label>
                    <p>{new Date(viewingBill.createdAt).toLocaleTimeString()}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">{t('role')}</Label>
                    <p>{viewingBill.role || 'Admin'}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-gray-500">{t('description')}</Label>
                  <p className="bg-gray-50 p-3 rounded-md mt-1 min-h-[60px]">
                    {viewingBill.description || t('noData')}
                  </p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  };

  const renderReturnsContent = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-primary-800 mb-2">
            {t('returns')}
          </h2>
          <p className="text-gray-600">
            {t('returnManagement')}
          </p>
        </div>
      </div>

      {/* Returns Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('totalReturns')}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {returns.reduce((total: number, ret: Return) => total + Number(ret.quantity), 0)}
                </p>
              </div>
              <RotateCcw className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('returnsAmount')}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {returns.reduce((total: number, ret: Return) => {
                    const product = products.find((p: Product) => p.id === ret.productId);
                    return total + (product ? product.price * Number(ret.quantity) : 0);
                  }, 0).toFixed(2)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>


      </div>

      {/* Recent Returns */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RotateCcw className="w-6 h-6" />
            {t('returns')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('productName')}</TableHead>
                  <TableHead className="text-right">{t('quantity')}</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {returns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      {t('noReturns')}
                    </TableCell>
                  </TableRow>
                ) : (
                  returns
                    .sort((a: Return, b: Return) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .slice(0, 5)
                    .map((ret: Return) => {
                      const product = products.find((p: Product) => p.id === ret.productId);
                      const returnValue = product ? product.price * Number(ret.quantity) : 0;

                      return (
                        <TableRow key={ret.id} className="hover:bg-gray-50">
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              <div className="w-2 h-2 rounded-full bg-red-500 mr-3"></div>
                              <div>
                                <div className="font-semibold">{ret.productName}</div>
                                <div className="text-xs text-gray-500">ID: #{ret.orderId?.slice(-6)}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm font-bold">
                              {Number(ret.quantity)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            <span className="text-lg font-bold text-red-600">
                              {returnValue.toFixed(2)}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {format(new Date(ret.date), 'HH:mm')}
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {new Date(ret.date).toLocaleDateString('en-GB')}
                          </TableCell>
                        </TableRow>
                      );
                    })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSectionWithAddButton = (sectionName: string, sectionKey: ActiveSection, onAddClick: () => void) => {
    switch (sectionKey) {
      case 'employees': {
        // Sort employees by creation date (newest first)
        const sortedEmployees = [...employees].sort((a: Employee, b: Employee) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-primary-800 mb-2">
                  {sectionName}
                </h2>
                <p className="text-gray-600">
                  {t(`manage${sectionName}`)}
                </p>
              </div>
              <Button onClick={onAddClick} className="bg-primary-600 hover:bg-primary-700 touch-manipulation min-h-[48px]">
                <Plus className="w-4 h-4 mr-2" />
                {t(`add${sectionName.slice(0, -1)}`)}
              </Button>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>{t('employees')}</CardTitle>
              </CardHeader>
              <CardContent>
                {sortedEmployees.length > 0 ? (
                  <div className="space-y-4">
                    {sortedEmployees.map((employee: Employee) => (
                      <div key={`employee-${employee.id}`} className="flex items-center justify-between p-4 border-2 border-black-25 rounded-lg hover:bg-gray-50">
                        <div className="flex-1">
                          <h3 className="font-medium text-lg">{employee.name}</h3>
                          <p className="text-sm text-gray-600">Job type: {t(employee.role)}</p>
                          <p className="text-sm text-gray-600">{t('phone')}: {employee.phone}</p>
                          <p className="text-xs text-gray-500">Added date: 30/08/2025</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => handleEditEmployee(employee)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="destructive"
                            onClick={() => handleDeleteEmployee(employee.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    {t('noEmployees')}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );
      }

      case 'providers': {
        // Sort providers by creation date (newest first)
        const sortedProviders = [...providers].sort((a: Provider, b: Provider) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-primary-800 mb-2">
                  {sectionName}
                </h2>
                <p className="text-primary-600">
                  {t(`manage${sectionName}`)}
                </p>
              </div>
              <Button onClick={onAddClick} className="bg-primary-600 hover:bg-primary-700 touch-manipulation min-h-[48px]">
                <Plus className="w-4 h-4 mr-2" />
                {t(`add${sectionName.slice(0, -1)}`)}
              </Button>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>{t('providers')}</CardTitle>
              </CardHeader>
              <CardContent>
                {sortedProviders.length > 0 ? (
                  <div className="space-y-4">
                    {sortedProviders.map((provider: Provider) => (
                      <div key={`provider-${provider.id}`} className="flex items-center justify-between p-4 border-2 border-black-25-provider-item rounded-lg hover:bg-gray-50">
                        <div className="flex-1">
                          <h3 className="font-medium text-lg">{provider.name}</h3>
                          <p className="text-sm text-gray-600">{t('phone')}: {provider.phone}</p>
                          <p className="text-xs text-gray-500">Added date: 31/08/2025</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => handleEditProvider(provider)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="destructive"
                            onClick={() => handleDeleteProvider(provider.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    {t('noProviders')}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );
      }


      case 'bills':
        return renderBillsContent();

      default:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-primary-800 mb-2">
                  {sectionName}
                </h2>
                <p className="text-primary-600">
                  {t(`manage${sectionName}`)}
                </p>
              </div>
              <Button onClick={onAddClick} className="bg-primary-600 hover:bg-primary-700 touch-manipulation min-h-[48px]">
                <Plus className="w-4 h-4 mr-2" />
                {t(`add${sectionName.slice(0, -1)}`)}
              </Button>
            </div>
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-gray-500 py-8">
                  {t('underDevelopment')}
                </p>
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  const renderDashboardContent = () => (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-primary-800 mb-2">
          {t('dashboard')}
        </h2>
        Overview of your business
      </div>


      {/* Period Filter - Horizontal design */}
      <div className="bg-white p-4 rounded-lg shadow-lg">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-gray-900 whitespace-nowrap">Select period</h3>
          <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-48 h-10">
              <SelectValue defaultValue={t('lastDay')}>
                {selectedPeriod === 'day' ? t('lastDay') :
                  selectedPeriod === '2days' ? t('last2Days') :
                    selectedPeriod === '3days' ? t('last3Days') :
                      selectedPeriod === 'week' ? t('lastWeek') :
                        selectedPeriod === 'month' ? t('lastMonth') :
                          selectedPeriod === '3months' ? t('last3Months') :
                            selectedPeriod === '6months' ? t('last6Months') :
                              selectedPeriod === 'custom' ? t('customPeriod') :
                                t('lastDay')}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">{t('lastDay')}</SelectItem>
              <SelectItem value="2days">{t('last2Days')}</SelectItem>
              <SelectItem value="3days">{t('last3Days')}</SelectItem>
              <SelectItem value="week">{t('lastWeek')}</SelectItem>
              <SelectItem value="month">{t('lastMonth')}</SelectItem>
              <SelectItem value="3months">{t('last3Months')}</SelectItem>
              <SelectItem value="6months">{t('last6Months')}</SelectItem>
              <SelectItem value="custom">{t('customPeriod')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Custom Date Range */}
        {selectedPeriod === 'custom' && (
          <div className="mt-4 pt-4 border-t border-black-25 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">{('Start date')}</label>
              <div className="flex items-center gap-1">
                <Input
                  placeholder="dd/mm/yyyy"
                  value={customDateInput.start}
                  onChange={(e) => handleCustomDateChange('start', e.target.value)}
                  className="w-full justify-start text-left font-normal h-10"
                />
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="icon" className="h-10 w-10 shrink-0">
                      <CalendarDays className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <DynamicCalendar
                      selected={customDateRange.start ? new Date(customDateRange.start) : undefined}
                      onDateSelect={(date: Date | undefined) => {
                        if (date) {
                          setCustomDateRange(prev => ({ ...prev, start: format(date, 'yyyy-MM-dd') }));
                        }
                      }}
                      t={t}
                      locale={locale}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">{('End date')}</label>
              <div className="flex items-center gap-1">
                <Input
                  placeholder="dd/mm/yyyy"
                  value={customDateInput.end}
                  onChange={(e) => handleCustomDateChange('end', e.target.value)}
                  className="w-full justify-start text-left font-normal h-10"
                />
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="icon" className="h-10 w-10 shrink-0">
                      <CalendarDays className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <DynamicCalendar
                      selected={customDateRange.end ? new Date(customDateRange.end) : undefined}
                      onDateSelect={(date: Date | undefined) => {
                        if (date) {
                          setCustomDateRange(prev => ({ ...prev, end: format(date, 'yyyy-MM-dd') }));
                        }
                      }}
                      t={t}
                      locale={locale}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        )}
      </div>


      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {analyticsCards.map((card, index) => (
          <Card key={index} className="bg-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                </div>
                <div className={`p-3 rounded-full ${card.iconBg}`}>
                  <card.icon className={`h-6 w-6 ${card.iconColor}`} />
                </div>
              </div>
              {/* تم إزالة النسبة المئوية */}
            </CardContent>
          </Card>
        ))}
      </div>


      {/* Recent Orders & Unknown Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Recent Orders
            </CardTitle>

          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sortedOrders
                .slice(0, 5)
                .map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 ${order.totalAmount < 0 ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'} rounded-full flex items-center justify-center text-sm font-medium mr-3`}>
                        #{order.id.slice(-4)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{order.customerName}</p>
                        <p className="text-sm text-gray-600">{format(new Date(order.createdAt), 'HH:mm')}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${order.totalAmount < 0 ? 'text-red-600' : 'text-blue-600'}`}>{order.totalAmount.toFixed(2)}</p>
                      <p className="text-sm text-gray-600">{order.items.length} {t('items')}</p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
        {/* Unknown Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5" />
              Unknown Requests
            </CardTitle>

          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {unknownProducts.slice(0, 5).map((req) => (
                <div key={req.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-medium mr-3">
                      ?
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{req.name}</p>
                      <p className="text-sm text-gray-600">{format(new Date(req.createdAt), 'HH:mm')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-orange-600">{req.price.toFixed(2)}</p>
                  </div>
                </div>
              ))}
              {unknownProducts.length === 0 && (
                <div className="text-center text-gray-500 py-4">
                  <p>{t('noData')}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales Trend Chart - Last 30 days */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Sales Tend
          </CardTitle>

        </CardHeader>
        <CardContent>
          <BarChart
            {...{
              data: salesChartData,
              onClick: handleChartClick,
              options: {
                plugins: {
                  tooltip: {
                    callbacks: {
                      label: (context: any) => {
                        const dateStr = context.dataset._dateMap?.[context.dataIndex];
                        const dailyProfits = analytics.getDailyProfit(orders, returns);
                        const profitValue = dateStr ? (dailyProfits[dateStr] || 0) : 0;
                        return `${t('sales')}: ${context.parsed.y.toFixed(2)} | ${t('profit')}: ${profitValue.toFixed(2)}`;
                      }
                    }
                  }
                }
              }
            }}
          />
        </CardContent>
      </Card>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Returns */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5" />
              Top Returns
            </CardTitle>

          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topReturnsByPeriod.length > 0 ? (
                <div className="space-y-3">
                  {topReturnsByPeriod.map((topReturn, index) => (
                    <div key={`${topReturn.productId || topReturn.productName}-${index}`} className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                      <div className="flex items-center">
                        <span className="w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-sm font-medium mr-3">
                          {index + 1}
                        </span>
                        <span className="font-medium">{topReturn.productName}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-red-600">{topReturn.quantity} {t('returned')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-4">
                  {t('noReturns')}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-between h-6">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Top Products
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowTopProductsDialog(true)} title={('Show All')}>
                <ArrowUpRight className="h-24" />
              </Button>
            </CardTitle>

          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.length > 0 ? (
                topProducts
                  .filter(product => {
                    // تحقق أن المنتج مسجل فعليًا في صفحة المنتجات
                    if (!product || typeof product.name !== 'string') {
                      return false;
                    }
                    const topProductName = product.name.trim().toLowerCase();
                    return products.some(p => p && typeof p.name === 'string' && p.name.trim().toLowerCase() === topProductName);
                  })
                  .filter(product => !!product.name && !/unknown|مجهول/i.test(product.name))
                  .slice(0, 10)
                  .map((product, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg border hover:shadow-md transition-all duration-200">
                      <div className="flex items-center flex-1">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3 border-2 bg-primary-100 text-primary-600`}>
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-600">
                            {product.sold} Sold
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg text-primary-600">
                          {(product.sales ?? 0).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="text-center text-gray-500 py-4">
                  noProducts
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );


  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return renderDashboardContent();
      case 'customers':
        return <CustomerManagement />;
      case 'providers':
        return renderSectionWithAddButton(t('providers'), 'providers', () => setProviderFormOpen(true));
      case 'orders':
        return renderOrdersContent(); // setShowProviderForm(true) should be setProviderFormOpen(true)
      case 'employees':
        return renderSectionWithAddButton(t('employees'), 'employees', () => setEmployeeFormOpen(true));
      case 'products':
        return <ProductManagement onBack={() => setActiveSection('dashboard')} />;

      case 'unknownProducts':
        return <UnknownProductManagement />;
      case 'bills':
        return renderSectionWithAddButton(t('bills'), 'bills', () => setShowBillForm(true));
      case 'returns':
        return <ReturnManagement onBack={() => setActiveSection('dashboard')} />;
      case 'reports':
        return <Reports />;
      case 'settings':
        return renderSettingsContent();
      default:
        return renderDashboardContent();
    }
  };

  // أضف هذا بعد تعريف filteredReturns مباشرةً
  const debugReturns = () => {
    try {
      const raw = localStorage.getItem('mpm_returns');
      const parsed = raw ? JSON.parse(raw) : [];
      return parsed;
    } catch {
      return [];
    }
  };
  const debugTopReturns = () => {
    try {
      const raw = localStorage.getItem('mpm_top_returns');
      const parsed = raw ? JSON.parse(raw) : [];
      return parsed;
    } catch {
      return [];
    }
  };

  useEffect(() => {
    const handleForceRefresh = () => {
      if (isUpdatingStorage) return;
      setOrders(orderStorage.getAll());
      console.log('Force refreshed orders (AdminDashboard):', orderStorage.getAll());
    };
    window.addEventListener('storage-updated', handleForceRefresh);
    window.addEventListener('storage', handleForceRefresh);
    return () => {
      window.removeEventListener('storage-updated', handleForceRefresh);
      window.removeEventListener('storage', handleForceRefresh);
    };
  }, []);

  // في useEffect عند تحميل البيانات - تم دمجه مع loadData الرئيسي
  useEffect(() => {
    // استماع لأحداث تحديث التخزين
    const handleStorageUpdate = () => {
      if (isUpdatingStorage) {
        console.log('Storage update in progress, ignoring handleStorageUpdate. isUpdatingStorage:', isUpdatingStorage);
        return;
      }
      console.log('Storage updated, reloading all data including products profit. isUpdatingStorage:', isUpdatingStorage);
      // إعادة تحميل جميع البيانات بما في ذلك الأرباح المحدثة
      loadData();
    };

    // إضافة مستمع للحدث المخصص الجديد لإجبار التحديث الفوري
    const handleForceAdminUpdate = () => {
      console.log('Force admin dashboard update triggered');
      // تجاهل حالة isUpdatingStorage للتحديث الفوري
      loadData();
    };

    window.addEventListener('storage-updated', handleStorageUpdate);
    window.addEventListener('admin-dashboard-force-update', handleForceAdminUpdate);

    return () => {
      window.removeEventListener('storage-updated', handleStorageUpdate);
      window.removeEventListener('admin-dashboard-force-update', handleForceAdminUpdate);
    };
  }, [loadData]);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg flex flex-col border-r fixed h-screen">
        {/* Header */}
        <div className="p-4 border-b border-black-25">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">{t('admin')}</h1>
          </div>

          {showLanguageSelector && (
            <div className="space-y-2 mb-4 bg-background p-2 rounded-md">
              <Button
                variant={language === 'en' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setLanguage('en')}
                className="w-full justify-start touch-manipulation"
              >
                English
              </Button>
              <Button
                variant={language === 'ar' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setLanguage('ar')}
                className="w-full justify-start touch-manipulation"
              >
                العربية
              </Button>
              <Button
                variant={language === 'fr' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setLanguage('fr')}
                className="w-full justify-start touch-manipulation"
              >
                Français
              </Button>
            </div>
          )}

        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-2">
            {sidebarItems.map(item => (
              <Button
                key={item.id}
                variant={activeSection === item.id ? 'default' : 'outline'}
                className="w-full justify-start touch-manipulation min-h-[48px]"
                onClick={() => setActiveSection(item.id as ActiveSection)}
              >
                <item.icon className="w-4 h-4 mr-2" />
                {item.label}
              </Button>
            ))}
          </div>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-black-25">
          <Button
            variant="destructive"
            className="w-full touch-manipulation min-h-[48px]"
            onClick={logout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Log out
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-auto ml-64">
        <div className="flex-1 p-4 sm:p-6 bg-background">
          {renderContent()}
        </div>
      </main>

      {/* Forms */}
      {isProviderFormOpen && (
        <ProviderForm
          provider={editingProvider}
          onSave={() => {
            loadData();
            setProviderFormOpen(false);
            setEditingProvider(null);
          }}
          onCancel={() => {
            setProviderFormOpen(false);
            setEditingProvider(null);
          }} />
      )}

      {isEmployeeFormOpen && (
        editingEmployee ? (
          <EditEmployeeForm
            employee={editingEmployee}
            onSave={handleSaveEmployee}
            onCancel={() => { setEmployeeFormOpen(false); setEditingEmployee(null); }}
          />
        ) : (
          <AddEmployeeForm
            onSave={handleSaveEmployee}
            onCancel={() => { setEmployeeFormOpen(false); setEditingEmployee(null); }}
          />
        )
      )}

      {showProductForm && (
        <AddProductForm
          onSave={handleSaveProduct}
          onCancel={() => setShowProductForm(false)}
        />
      )}

      {showBillForm && (
        <AddBillForm
          onSave={handleSaveBill}
          onCancel={() => setShowBillForm(false)}
        />
      )}

      {editingBill && (
        <EditBillForm
          bill={editingBill}
          onSave={handleUpdateBill}
          onCancel={() => setEditingBill(null)}
        />
      )}


      {/* Top Products Dialog */}
      <Dialog open={showTopProductsDialog} onOpenChange={setShowTopProductsDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Top Selling Products</DialogTitle>
            <DialogDescription>
              A list of your top selling products sorted by quantity, sales, or profit.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center gap-2 mb-4">
            <Button variant={topProductsSortBy === 'quantity' ? 'default' : 'outline'} onClick={() => setTopProductsSortBy('quantity')}>
              Sold
            </Button>
            <Button variant={topProductsSortBy === 'sales' ? 'default' : 'outline'} onClick={() => setTopProductsSortBy('sales')}>
              Sales
            </Button>
            <Button variant={topProductsSortBy === 'profit' ? 'default' : 'outline'} onClick={() => setTopProductsSortBy('profit')}>
              Profit
            </Button>
          </div>
          <div className="max-h-[60vh] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[60px]">Rank</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-center">Quantity Sold</TableHead>
                  <TableHead className="text-right">Total Sales</TableHead>
                  <TableHead className="text-right">Total Profit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedTopProducts.length > 0 ? (
                  sortedTopProducts
                    .filter(product => products.some(p => p.name.trim().toLowerCase() === product.name.trim().toLowerCase()))
                    .map((product, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell>{product.name}</TableCell>
                        <TableCell className="text-center">{product.sold}</TableCell>
                        <TableCell className="text-right font-mono">{product.sales.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-mono">{(product.profit || 0).toFixed(2)}</TableCell>
                      </TableRow>
                    ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">noProducts</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowTopProductsDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sales Breakdown Dialog */}
      <Dialog open={showBreakdownDialog} onOpenChange={setShowBreakdownDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>24-Hour Sales Breakdown</DialogTitle>
            <DialogDescription>
              Hourly sales distribution for {selectedDayForBreakdown ? format(new Date(`${selectedDayForBreakdown}T00:00:00`), 'dd/MM/yyyy') : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="h-[400px]">
            {selectedDayForBreakdown && (
              <BarChart
                data={generateHourlyChartData(selectedDayForBreakdown)}
                height={400}
              />
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowBreakdownDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear Data By Date Dialog */}
      <Dialog open={showClearByDateDialog} onOpenChange={setShowClearByDateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Clear Data by Date Range</DialogTitle>
            <DialogDescription>
              This will permanently delete transactional data within the selected dates.
              Earliest data from: {earliestOrderDate ? format(earliestOrderDate, 'PPP') : 'N/A'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Start Date</Label>
              <Input
                type="date"
                value={clearDateRange.start}
                onChange={(e) => setClearDateRange(prev => ({ ...prev, start: e.target.value }))}
              />
            </div>
            <div>
              <Label>End Date</Label>
              <Input
                type="date"
                value={clearDateRange.end}
                onChange={(e) => setClearDateRange(prev => ({ ...prev, end: e.target.value }))}
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowClearByDateDialog(false)} className="flex-1">
                {t('cancel')}
              </Button>
              <Button variant="destructive" onClick={handleConfirmClearByDate} className="flex-1">
                Clear Data
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
