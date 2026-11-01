import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

import { useLanguage } from '@/contexts/LanguageContext'; // No change here, it was correct
import { useAuth } from '@/contexts/AuthContext'; // No change here, it was correct
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  ArrowLeft,
  Search,
  Package,
  DollarSign,
  Receipt,
  User,
  Settings,
  LogOut,
  Globe,
  Eye,
  ArrowRight,
  Edit,
  ArrowLeft as ArrowLeftIcon,
  RotateCcw,
  HelpCircle,
  List,
  BarChart,
  Send,
  FileText,
  X,
  Clock,
  Calendar,
  Printer,
  History,
  AlertTriangle,
  Calculator,
  MoreVertical,
  ChevronRight,
  MoreHorizontal,
  Gift,
  ChevronDown,
  Wallet,
  CreditCard,
  Banknote,
  ArrowDownToLine,
  ArrowUpCircle,
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem 
} from '@/components/ui/dropdown-menu';
import { useCustomerStore } from '@/store/customerStore';
import { Product, productStorage, Order, orderStorage, OrderItem, returnsStorage, cashierActivityStorage, dailySalesStorage, unknownProductStorage, Category, categoryStorage, reportsStorage, settingsStorage, storage } from '@/lib/storage';
import { STORAGE_KEYS } from '@/lib/storageKeys';
import { format } from 'date-fns';


interface CashierDashboardProps {
  currentCashier?: any;
  onLogout?: () => void;
}

const CashierDashboard: React.FC<CashierDashboardProps> = ({ currentCashier, onLogout }) => {
  const { t, isRTL, language, setLanguage } = useLanguage();
  const { user, logout, resetRoleSelection } = useAuth();
  const customers = useCustomerStore(state => state.customers);
  const addPurchase = useCustomerStore(state => state.addPurchase);

  // Refs
  const unknownProductPriceRef = useRef<HTMLInputElement>(null);

  // State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [pendingOrders, setPendingOrders] = useState<OrderItem[][]>(() => {
    return storage.get<OrderItem[][]>(STORAGE_KEYS.PENDING_ORDERS) || [[]];
  });
  const [pendingOrderTimes, setPendingOrderTimes] = useState<string[]>(() => {
    return storage.get<string[]>(STORAGE_KEYS.PENDING_ORDER_TIMES) || [new Date().toISOString()];
  });
  const [activeOrderIndex, setActiveOrderIndex] = useState(0);
  const [amountPaid, setAmountPaid] = useState('');
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [showOrderHistory, setShowOrderHistory] = useState(false);
  const [orderHistory, setOrderHistory] = useState<Order[]>([]);
  const [currentOrderIndex, setCurrentOrderIndex] = useState(0);
  const appSettings = settingsStorage.get();

  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [selectedOrderForReturn, setSelectedOrderForReturn] = useState<Order | null>(null);
  const [selectedProductsForReturn, setSelectedProductsForReturn] = useState<{ [productId: string]: number }>({});
  const [returnSuccess, setReturnSuccess] = useState(false);
  const [showUnknownProductDialog, setShowUnknownProductDialog] = useState(false);
  const [unknownProductName, setUnknownProductName] = useState('');
  const [unknownProductPrice, setUnknownProductPrice] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');

  // Search Optimization (useMemo for efficiency)
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.serialNumber && product.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        product.id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = 
        selectedCategoryId === 'all' ||
        product.categoryId === selectedCategoryId ||
        (!product.categoryId && selectedCategoryId === 'uncategorized');

      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategoryId]);
  const [showReportsDialog, setShowReportsDialog] = useState(false);
  const [reportMessage, setReportMessage] = useState('');
  const [showPendingOrders, setShowPendingOrders] = useState(false);
  const [showUnknownProductButton, setShowUnknownProductButton] = useState(true);
  const [dialogFocusIndex, setDialogFocusIndex] = useState(activeOrderIndex);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [orderType, setOrderType] = useState<'regular' | 'bank'>('regular');
  const [bankAction, setBankAction] = useState<'debt' | 'payment' | 'use_balance'>('use_balance');
  const [showFinancialDialog, setShowFinancialDialog] = useState(false);
  const [financialType, setFinancialType] = useState<'payment' | null>(null);
  const [financialAmount, setFinancialAmount] = useState('');
  const [showInsufficientBalanceDialog, setShowInsufficientBalanceDialog] = useState(false);
  const [insufficientBalanceInfo, setInsufficientBalanceInfo] = useState<{ amount: number, balance: number } | null>(null);
  const [showCustomerInfoDialog, setShowCustomerInfoDialog] = useState(false);
  const [viewingCustomerData, setViewingCustomerData] = useState<any>(null);
  const [showRewardDialog, setShowRewardDialog] = useState(false);
  const [showDebtOverflowDialog, setShowDebtOverflowDialog] = useState(false);
  const [debtOverflowInfo, setDebtOverflowInfo] = useState<{ remaining: number, amount: number, customerId: string } | null>(null);

  const [editingTotals, setEditingTotals] = useState<Record<string, string>>({});
  // States for price modification feature
  const [allowPriceModification, setAllowPriceModification] = useState(false);
  const [editingItem, setEditingItem] = useState<OrderItem | null>(null);
  const [newPrice, setNewPrice] = useState('');
  const [selectedOrderItem, setSelectedOrderItem] = useState<OrderItem | null>(null);
  const [showProductDetailsDialog, setShowProductDetailsDialog] = useState(false);

  // Derived state for the current active order
  const currentOrder = pendingOrders[activeOrderIndex] ?? [];

  // Persist pending orders when they change
  useEffect(() => {
    storage.set(STORAGE_KEYS.PENDING_ORDERS, pendingOrders);
  }, [pendingOrders]);

  useEffect(() => {
    storage.set(STORAGE_KEYS.PENDING_ORDER_TIMES, pendingOrderTimes);
  }, [pendingOrderTimes]);

  // Helper to update the active order
  const setCurrentOrder = (newOrder: OrderItem[] | ((prevOrder: OrderItem[]) => OrderItem[])) => {
    setPendingOrders(prev => {
      const newPendingOrders = [...prev];
      const currentItems = newPendingOrders[activeOrderIndex] ?? [];
      // Apply the update function or set the new value
      newPendingOrders[activeOrderIndex] = typeof newOrder === 'function' ? newOrder(currentItems) : newOrder;
      return newPendingOrders;
    });
  };

  // Refs for continuous increment/decrement
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Function to get category icon based on category name
  const getCategoryIcon = (categoryName: string): string => {
    const name = categoryName.toLowerCase();
    if (name.includes('main') || name.includes('رئيسي')) return '🍖';
    if (name.includes('dessert') || name.includes('حلو')) return '🍰';
    if (name.includes('drink') || name.includes('مشروب')) return '🍹';
    if (name.includes('asian') || name.includes('آسيوي')) return '🍜';
    if (name.includes('western') || name.includes('غربي')) return '🍔';
    if (name.includes('side') || name.includes('جانبي')) return '🍟';
    return '🍽️';
  };

  // Continuous increment/decrement functions
  const startContinuousUpdate = useCallback((productId: string, increment: boolean) => {
    // Clear any existing intervals
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    // Initial delay before starting continuous updates
    timeoutRef.current = setTimeout(() => {
      intervalRef.current = setInterval(() => {
        setCurrentOrder(prevOrder => {
          const existingItem = prevOrder.find(item => item.productId === productId);
          if (!existingItem) return prevOrder;

          const newQuantity = increment ? existingItem.quantity + 1 : existingItem.quantity - 1;

          return prevOrder.map(item =>
            item.productId === productId
              ? { ...item, quantity: newQuantity }
              : item
          );
        });
      }, 100); // Fast interval - 100ms
    }, 300); // Initial delay - 300ms
  }, []);

  const stopContinuousUpdate = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Load products and orders on component mount
  useEffect(() => {
    loadProducts();
    loadOrders();
    loadCategories();

    // Log cashier login activity
    if (currentCashier) {
      cashierActivityStorage.add({
        cashierId: currentCashier.id,
        cashierName: currentCashier.name,
        activityType: 'login',
        description: 'Cashier logged in',
        timestamp: new Date().toISOString(),
        orderId: undefined,
        productId: undefined,
        productName: undefined,
        amount: undefined
      });
    }

    // Load feature toggles
    const savedTogglesJSON = localStorage.getItem('feature_toggles');
    if (savedTogglesJSON) {
      try {
        const savedToggles = JSON.parse(savedTogglesJSON);
        if (savedToggles.showUnknownProductButton !== undefined) {
          setShowUnknownProductButton(savedToggles.showUnknownProductButton);
        }
      } catch (error) { console.error(error); }
    }
  }, [currentCashier]);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Effect for price modification setting
  useEffect(() => {
    const updateSettings = () => {
      const currentSettings = settingsStorage.get();
      setAllowPriceModification(currentSettings.allowPriceModification);
      setShowUnknownProductButton(currentSettings.showUnknownProductButton);
    };

    updateSettings(); // Initial load

    const handleStorageChange = () => {
      updateSettings();
      loadCategories(); // Reload categories when storage changes
      loadProducts();   // Also reload products to reflect categorization changes
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('storage-updated', handleStorageChange); // Listen for same-tab updates

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('storage-updated', handleStorageChange);
    };
  }, []);

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Keyboard navigation for order history
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!showOrderHistory) return;

      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        if (event.key === 'ArrowLeft') {
          setCurrentOrderIndex(prev => prev > 0 ? prev - 1 : orderHistory.length - 1);
        } else {
          setCurrentOrderIndex(prev => prev < orderHistory.length - 1 ? prev + 1 : 0);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showOrderHistory, orderHistory.length]);

  const loadProducts = () => {
    const allProducts = productStorage.getAll();
    setProducts(allProducts);
  };

  const loadOrders = () => {
    console.log('Loading orders...');
    const allOrders = orderStorage.getAll();
    console.log('Total orders in storage:', allOrders.length);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // فلترة الطلبات لتظهر فقط طلبيات اليوم
    const todayOrders = allOrders.filter(order => {
      const orderDate = new Date(order.createdAt);
      orderDate.setHours(0, 0, 0, 0);
      return orderDate.getTime() === today.getTime();
    });
    console.log('Today orders:', todayOrders.length);

    // ترتيب من الأحدث إلى الأقدم
    const sortedOrders = todayOrders.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    setOrderHistory(sortedOrders);
    console.log('Loaded orders:', sortedOrders.length, 'orders for today');
    console.log('Order IDs:', sortedOrders.map(o => o.id.slice(-6))); // No change needed here
    console.log('Order dates:', sortedOrders.map(o => format(new Date(o.createdAt), 'HH:mm')));
  };

  const loadCategories = () => {
    const allCategories = categoryStorage.getAll();
    setCategories(allCategories);
  };


  // دالة للتحقق من صحة المبلغ المدفوع
  const isValidAmount = (amount: string): boolean => {
    const num = parseFloat(amount);
    return amount.trim() !== '' && !Number.isNaN(num) && Number.isFinite(num) && num >= 0;
  };

  const totalAmount = currentOrder.reduce((sum, item) => sum + item.total, 0);
  const paidAmount = isValidAmount(amountPaid) ? parseFloat(amountPaid) : 0;
  const remainingAmount = totalAmount - paidAmount;

  const logActivity = (activityType: string, description: string, orderId?: string, productId?: string, productName?: string, amount?: number) => {
    if (currentCashier) {
      cashierActivityStorage.add({
        cashierId: currentCashier.id,
        cashierName: currentCashier.name,
        activityType: activityType as any,
        description,
        orderId,
        productId,
        productName,
        amount,
        timestamp: new Date().toISOString()
      });
    }
  };

  const handleAddToOrder = (product: Product) => {
    const existingItem = currentOrder.find(item => item.productId === product.id);

    if (existingItem) {
      // Update quantity if product already in order
      const updatedOrder = currentOrder.map(item =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price }
          : item
      );
      setCurrentOrder(updatedOrder);
    } else {
      // Add new item to order
      const newItem: OrderItem = {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        price: product.price,
        originalPrice: product.price, // Store original price
        total: product.price,
        purchasePrice: product.purchasePrice || 0 // Store the purchase price
      };
      setCurrentOrder([...currentOrder, newItem]);
    }

    // Log activity if cashier is logged in
    logActivity('order_completed', `Added ${product.name} to order`, undefined, product.id, product.name, product.price);
  };

  const handleEditPriceClick = (item: OrderItem) => {
    setEditingItem(item);
    setShowProductDetailsDialog(true);
    setSelectedOrderItem(item);
    setNewPrice(String(item.price));
  };

  const handleSavePrice = () => {
    if (!editingItem) return;

    const price = parseFloat(newPrice);
    if (isNaN(price) || price < 0) {
      alert('سعر غير صالح');
      return;
    }

    setCurrentOrder(currentItems =>
      currentItems.map(item =>
        item.productId === selectedOrderItem.productId
          ? { ...item, price: price, total: price * item.quantity }
          : item
      )
    );

    setShowProductDetailsDialog(false); // Close dialog on save
    setSelectedOrderItem(null); // Clear selected item
    setEditingItem(null); // Also clear editing item for consistency
  };



  const handleUpdateQuantity = (productId: string, newQuantity: number) => {
    const updatedOrder = currentOrder.map(item =>
      item.productId === productId
        ? { ...item, quantity: newQuantity, total: newQuantity * item.price }
        : item
    );
    setCurrentOrder(updatedOrder);
  };

  const handleRemoveFromOrder = (productId: string) => {
    // حذف المنتج من الطلب الحالي
    setCurrentOrder(currentOrder.filter(item => item.productId !== productId));
  };



  const handleCompleteOrder = async () => {
    if (currentOrder.length === 0) {
      return;
    }
    if (!currentCashier || !currentCashier.id || !currentCashier.name) {
      alert('يجب تسجيل الدخول بكاشير صالح قبل إتمام الطلب.');
      return;
    }

    try {
      const orderId = Date.now().toString();
      const finalOrderItems: OrderItem[] = [];

      // Process all items in the current order
      for (const item of currentOrder) {
        let processedItem = { ...item };

        // Handle returns for items with negative quantity
        if (item.quantity < 0) {
          const returnQuantity = Math.abs(item.quantity);
          returnsStorage.add({
            date: new Date().toISOString(),
            orderId: orderId,
            productId: item.productId,
            productName: item.productName,
            returnPrice: item.price,
            purchasePrice: item.purchasePrice || 0, // **The Fix**: Use purchase price from the order item
            quantity: returnQuantity,
            reason: 'pos_return',
            notes: `Return processed at Point of Sale.`,
            status: 'completed',
            processedBy: 'cashier',
            processedAt: new Date().toISOString(),
            cashierId: currentCashier?.id,
            cashierName: currentCashier?.name,
          });
        }

        // Handle temporary unknown products
        if (item.productId.startsWith('temp_')) { // This is an unknown product
          // **THE FIX**: Check if an unknown product with the same name already exists
          const existingUnknown = unknownProductStorage.getAll().find(p => p.name.toLowerCase() === item.productName.toLowerCase());

          if (existingUnknown) {
            // If it exists, update its sales and quantity
            unknownProductStorage.update(existingUnknown.id, {
              quantity: (existingUnknown.quantity || 0) + item.quantity,
              totalSales: (existingUnknown.totalSales || 0) + item.total,
            });
            processedItem.productId = existingUnknown.id; // Use the existing ID
          } else {
            // If it does not exist, create a new one
            const newUnknownProduct = unknownProductStorage.add({ name: item.productName, price: item.price, quantity: item.quantity, totalSales: item.total, cashierId: currentCashier?.id, cashierName: currentCashier?.name });
            processedItem.productId = newUnknownProduct.id;
          }
        }
        finalOrderItems.push(processedItem);
      }

      // Check for insufficient balance if using balance
      if (selectedCustomerId && orderType === 'bank' && bankAction === 'use_balance') {
        const customer = customers.find(c => c.id === selectedCustomerId);
        if (customer && totalAmount > (customer.balance || 0)) {
          setInsufficientBalanceInfo({ amount: totalAmount, balance: customer.balance || 0 });
          setShowInsufficientBalanceDialog(true);
          return;
        }
      }


      // Pre-calculate profit for debt orders (to be allocated proportionally on payment)
      const isDebtOrderNow = orderType === 'bank' && bankAction === 'debt';
      let calculatedDebtProfit: number | undefined = undefined;
      if (isDebtOrderNow) {
        calculatedDebtProfit = finalOrderItems.reduce((sum, item) => {
          const product = productStorage.getById(item.productId);
          const purchasePrice = item.purchasePrice ?? product?.purchasePrice ?? 0;
          return sum + (item.price - purchasePrice) * item.quantity;
        }, 0);
      }

      // Create the order record
      const paid = isValidAmount(amountPaid) ? parseFloat(amountPaid) : 0;
      const finalCustomerName = selectedCustomerId ? customers.find(c => c.id === selectedCustomerId)?.name || t('anonymousCustomer') : t('anonymousCustomer');
      const newOrder: Order = {
        id: orderId,
        customerName: finalCustomerName,
        items: finalOrderItems,
        totalAmount,
        amountPaid: paid,
        remainingAmount: remainingAmount,
        status: totalAmount >= 0 ? 'completed' : 'cancelled',
        type: orderType,
        bankAction: orderType === 'bank' ? bankAction : undefined,
        debtProfit: calculatedDebtProfit,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        cashierId: currentCashier.id,
        cashierName: currentCashier.name
      };

      orderStorage.add(newOrder);

      // Update stock, sales, and profit for all items
      finalOrderItems.forEach(item => {
        const product = productStorage.getById(item.productId);
        if (product) {
          const isDebtOrder = orderType === 'bank' && bankAction === 'debt';
          const saleProfit = (item.price - (product.purchasePrice || 0)) * item.quantity;
          productStorage.update(product.id, {
            quantity: product.quantity - item.quantity,
            sold: (product.sold || 0) + item.quantity,
            totalSales: isDebtOrder ? (product.totalSales || 0) : (product.totalSales || 0) + item.total,
            profit: isDebtOrder ? (product.profit || 0) : (product.profit || 0) + saleProfit
          });
        }
      });

      // Daily Sales Accounting
      // Regular or Use Balance or Payment adds to sales
      // Debt Order DOES NOT add to sales
      const isDebtOrder = orderType === 'bank' && bankAction === 'debt';
      if (!isDebtOrder) {
        dailySalesStorage.add({ 
          date: new Date().toISOString().split('T')[0], 
          totalAmount: newOrder.totalAmount, 
          orderCount: 1 
        });
      }

      if (currentCashier) {
        cashierActivityStorage.add({
          cashierId: currentCashier.id,
          cashierName: currentCashier.name,
          activityType: 'order_completed',
          description: `Completed ${orderType} order #${newOrder.id} for ${newOrder.customerName}`,
          orderId: newOrder.id,
          amount: (orderType === 'bank' && bankAction === 'debt') ? 0 : newOrder.totalAmount,
          timestamp: new Date().toISOString()
        });
      }

      if (selectedCustomerId) {
        if (orderType === 'bank') {
          if (bankAction === 'debt') {
            useCustomerStore.getState().addPurchase(selectedCustomerId, totalAmount, 'debt_order');
          } else if (bankAction === 'use_balance') {
            useCustomerStore.getState().addPurchase(selectedCustomerId, totalAmount, 'use_balance');
          }
        } else {
          // Regular order
          useCustomerStore.getState().addPurchase(selectedCustomerId, totalAmount, 'regular');
        }
      }

      setCurrentOrder([]);
      setAmountPaid('');
      setSelectedCustomerId(null);

      loadOrders();

      if (showOrderHistory) {
        setTimeout(() => setCurrentOrderIndex(0), 0);
      }

      window.dispatchEvent(new Event('storage-updated'));
    } catch (error) {
      console.error('Error completing order:', error);
    }
  };

  const handleClearOrder = () => {
    // If it's the only pending order, just clear its items.
    if (pendingOrders.length === 1) {
      setCurrentOrder([]);
      setPendingOrderTimes([new Date().toISOString()]);
    } else {
      // Remove the current order and its time from the list
      setPendingOrders(prev => prev.filter((_, index) => index !== activeOrderIndex));
      setPendingOrderTimes(prev => prev.filter((_, index) => index !== activeOrderIndex));
      // Adjust the active index to not be out of bounds
      setActiveOrderIndex(prev => Math.max(0, prev - 1));
    }
    setAmountPaid('');
  };

  const handleFinancialAction = () => {
    const customer = customers.find(c => c.id === selectedCustomerId);
    if (!customer || !financialAmount || isNaN(parseFloat(financialAmount))) return;
    
    const amount = parseFloat(financialAmount);
    const { updateBalance } = useCustomerStore.getState();

    if (financialType === 'payment') {
      updateBalance(customer.id, amount);
      
      // Create a Payment Order for tracking
      const paymentOrder: Order = {
        id: `PAY-${Date.now()}`,
        customerName: customer.name,
        items: [], // No products for a payment
        totalAmount: amount,
        amountPaid: amount,
        remainingAmount: 0,
        status: 'completed',
        type: 'bank',
        bankAction: 'payment',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        cashierId: currentCashier?.id,
        cashierName: currentCashier?.name
      };
      orderStorage.add(paymentOrder);

      // Financial record in daily sales
      dailySalesStorage.add({ 
          date: new Date().toISOString().split('T')[0], 
          totalAmount: amount, 
          orderCount: 0 
      });

      // Log activity
      if (currentCashier) {
        cashierActivityStorage.add({
          cashierId: currentCashier.id,
          cashierName: currentCashier.name,
          activityType: 'order_completed',
          description: `Captured payment of ${amount.toFixed(2)} for ${customer.name}`,
          orderId: paymentOrder.id,
          amount: amount,
          timestamp: new Date().toISOString()
        });
      }
    }

    setShowFinancialDialog(false);
    setFinancialAmount('');
    setFinancialType(null);
  };

  const processDebtOverflow = (addToBalance: boolean) => {
    // This function is for handling payments that exceed debt.
    // In the new system, all payments just add to balance.
    // So if a customer owes -30 and pays 50, balance becomes +20.
    // The previous complex logic is no longer needed.
    handleFinancialAction();
    setShowDebtOverflowDialog(false);
    setDebtOverflowInfo(null);
  };

  const handleWithdrawReward = () => {
    setShowRewardDialog(true);
  };

  const executeRewardWithdraw = () => {
    const customer = customers.find(c => c.id === selectedCustomerId);
    if (!customer) return;

    const settings = useCustomerStore.getState().settings;
    const isPurchases = settings.rewardMethod === 'purchases';
    const currentVal = isPurchases ? customer.totalPurchases : customer.points;
    const required = isPurchases ? settings.purchasesRequiredForReward : settings.pointsRequiredForReward;
    const rewardsAvailable = Math.floor(currentVal / required);

    if (rewardsAvailable <= 0) return;
    
    const rewardTitle = isPurchases ? settings.purchaseRewardValue : settings.pointsRewardValue;

    // Debt restriction check
    if (customer.balance < 0) {
      const debt = Math.abs(customer.balance);
      const rewardValue = parseFloat(rewardTitle.replace(/[^0-9.]/g, '')) || 0;

      if (debt >= rewardValue) {
        alert("Rewards are locked because your debt exceeds the reward value.");
        return;
      } else {
        const remainingBonus = rewardValue - debt;
        if (confirm(`Debt of $${debt} will be deducted from your reward. Remaining bonus: $${remainingBonus.toFixed(2)}. Continue?`)) {
          if (settings.rewardMethod === 'purchases') {
            useCustomerStore.getState().redeemPurchases(customer.id);
          } else {
            useCustomerStore.getState().redeemPoints(customer.id);
          }
          // Clear current debt
          useCustomerStore.getState().updateBalance(customer.id, debt);
        } else {
          return;
        }
      }
    } else {
      if (settings.rewardMethod === 'purchases') {
        useCustomerStore.getState().redeemPurchases(customer.id);
      } else {
        useCustomerStore.getState().redeemPoints(customer.id);
      }
      
      // Add the reward as a 0-price item to current order
      const rewardItem: OrderItem = {
        productId: `reward-${Date.now()}`,
        productName: `Gift: ${rewardTitle}`,
        price: 0,
        originalPrice: 0,
        purchasePrice: 0,
        quantity: 1,
        total: 0
      };
      
      setCurrentOrder(prev => [...prev, rewardItem]);
    }
    setShowRewardDialog(false);
  };

  const handleNewOrder = () => {
    // Only add a new pending order if the current one isn't empty
    if (currentOrder.length > 0) {
      setPendingOrders(prev => {
        const newOrders = [...prev, []];
        setActiveOrderIndex(newOrders.length - 1);
        return newOrders;
      });
      setPendingOrderTimes(prev => [...prev, new Date().toISOString()]);
    }
    setAmountPaid('');
    setShowOrderHistory(false); // Close order history if open
    // Reload orders to ensure we have the latest data
    loadOrders();
    // Reset to first order (most recent) if viewing order history
    setTimeout(() => setCurrentOrderIndex(0), 0);
  };

  const handleBackToMain = () => {
    // Log cashier logout activity
    if (currentCashier) {
      cashierActivityStorage.add({
        cashierId: currentCashier.id,
        cashierName: currentCashier.name,
        activityType: 'logout',
        description: 'Cashier logged out',
        timestamp: new Date().toISOString(),
        orderId: undefined,
        productId: undefined,
        productName: undefined,
        amount: undefined
      });
    }

    // Call the logout function from parent
    if (onLogout) {
      onLogout();
    } else {
      // Fallback to reset role selection
      resetRoleSelection();
    }
  };

  const handleViewOrderHistory = () => {
    setShowOrderHistory(!showOrderHistory);
    console.log(showOrderHistory ? 'Closing order history' : 'Opening order history');
    // Reload orders to ensure we have the latest data
    if (!showOrderHistory) {
      loadOrders();
      // Reset to first order (most recent) after loading
      setTimeout(() => {
        setCurrentOrderIndex(0);
        console.log('Reset to first order in history');
      }, 100);
    }
  };

  const handleViewPendingOrders = () => {
    setShowPendingOrders(prev => !prev);
    setShowOrderHistory(false); // Ensure order history is closed
  };

  const handleReturnProduct = () => {
    // TODO: Implement return product functionality
    console.log('Return product functionality to be implemented.');
  };

  const handleReturnSelectedProduct = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      productStorage.update(productId, { quantity: product.quantity + 1 });
    }
    setShowReturnDialog(false);
  };

  const handleOpenReturnDialog = () => {
    setShowReturnDialog(true);
    setSelectedOrderForReturn(null);
    setSelectedProductsForReturn({});
    setReturnSuccess(false);
  };

  const handleViewReports = () => {
    setShowReportsDialog(true);
    setReportMessage('');
  };

  const handleSendReport = () => {
    if (reportMessage.trim()) {
      // حفظ التقرير في نظام التخزين
      const reportData: any = {
        content: reportMessage.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // إضافة معلومات الكاشير فقط إذا كان مسجلاً (ليس temp_cashier)
      if (currentCashier && currentCashier.id !== 'temp_cashier') {
        reportData.cashierId = currentCashier.id;
        reportData.cashierName = currentCashier.name;
      }

      const report = reportsStorage.add(reportData);

      console.log('Report saved:', report);
      setShowReportsDialog(false);
      setReportMessage('');

      // إرسال حدث تحديث التخزين
      window.dispatchEvent(new Event('storage-updated'));
    }
  };

  const handleSelectOrderForReturn = (order: Order) => {
    setSelectedOrderForReturn(order);
    setSelectedProductsForReturn({});
  };

  const handleSelectProductForReturn = (item: OrderItem) => {
    setSelectedProductsForReturn(prev => ({
      ...prev,
      [item.productId]: prev[item.productId] || 1
    }));
  };

  const handleSetReturnQuantity = (productId: string, maxQty: number, value: number) => {
    setSelectedProductsForReturn(prev => ({
      ...prev,
      [productId]: Math.max(0, Math.min(maxQty, value))
    }));
  };

  const handleConfirmReturn = () => {
    if (!selectedOrderForReturn) return;
    const itemsToReturn = selectedOrderForReturn.items.filter(item => selectedProductsForReturn[item.productId] > 0);
    if (itemsToReturn.length === 0) return;

    let totalReturn = 0;
    itemsToReturn.forEach(item => {
      const qty = selectedProductsForReturn[item.productId];
      if (qty > 0 && qty <= item.quantity) {
        // تحديث المخزون
        const product = productStorage.getById(item.productId); // <-- إصلاح: جلب أحدث بيانات المنتج
        if (product) {
          // حساب قيمة المبيعات والأرباح المراد خصمها
          const salesToDeduct = item.price * qty; // استخدام سعر الفاتورة للدقة
          const profitToDeduct = (item.price - (product.purchasePrice || 0)) * qty;

          // تحديث المنتج: زيادة الكمية، خصم المبيعات والأرباح
          productStorage.update(product.id, {
            quantity: product.quantity + qty,
            totalSales: Math.max(0, (product.totalSales || 0) - salesToDeduct),
            profit: (product.profit || 0) - profitToDeduct, // يمكن أن يكون الربح سالبًا
            sold: Math.max(0, (product.sold || 0) - qty),
          });
        }

        // تسجيل عملية الإرجاع مع معلومات إضافية
        returnsStorage.add({
          date: new Date().toISOString(),
          orderId: selectedOrderForReturn.id,
          productId: item.productId,
          productName: item.productName,
          quantity: qty,
          returnPrice: item.price, // تسجيل سعر المنتج وقت البيع
          purchasePrice: product.purchasePrice || 0, // **The Fix**: Store purchase price at time of return
          reason: 'customer_return', // يمكن إضافة حقل لاختيار السبب
          notes: `إرجاع من فاتورة #${selectedOrderForReturn.id.slice(-6)}`,
          status: 'pending',
          processedBy: 'cashier',
          processedAt: new Date().toISOString(),
          cashierId: currentCashier?.id,
          cashierName: currentCashier?.name
        });

        totalReturn += item.price * qty;
      }
    });

    // Log activity if cashier is logged in
    logActivity('return_processed', `Processed return for order #${selectedOrderForReturn.id.slice(-6)}`, selectedOrderForReturn.id, undefined, undefined, totalReturn);

    // Create a single return order
    const returnOrderItems = itemsToReturn.map(item => ({
      productId: item.productId,
      productName: item.productName,
      quantity: selectedProductsForReturn[item.productId],
      price: -item.price, // Negative price for returns
      total: -item.price * selectedProductsForReturn[item.productId]
    }));

    const newReturnOrder: Omit<Order, 'id' | 'createdAt' | 'updatedAt'> = {
      customerName: `${t('returnFor')} #${selectedOrderForReturn.id.slice(-6)}`,
      items: returnOrderItems,
      totalAmount: -totalReturn,
      amountPaid: -totalReturn, // Usually returns are paid back immediately
      remainingAmount: 0,
      status: 'cancelled', // 'cancelled' is often used for return orders
      cashierId: currentCashier?.id,
      cashierName: currentCashier?.name,
    };
    orderStorage.add(newReturnOrder);

    // إغلاق النافذة وتحديث البيانات مباشرة
    setShowReturnDialog(false);
    setSelectedOrderForReturn(null);
    setSelectedProductsForReturn({});
    loadProducts();
    loadOrders();
    if (showOrderHistory) {
      setTimeout(() => setCurrentOrderIndex(0), 0);
    }
    window.dispatchEvent(new Event('storage-updated'));
  };

  const handleOpenUnknownProductDialog = () => {
    setShowUnknownProductDialog(true);
    setUnknownProductName('');
    setUnknownProductPrice('');
  };

  const handleCloseUnknownProductDialog = () => {
    setShowUnknownProductDialog(false);
    setUnknownProductName('');
    setUnknownProductPrice('');
  };

  const handleAddUnknownProduct = () => {
    if (!unknownProductName.trim() || !unknownProductPrice.trim()) {
      return;
    }

    // دالة للتحقق من صحة السعر
    const isValidPrice = (priceStr: string): boolean => {
      const num = parseFloat(priceStr);
      return priceStr.trim() !== '' && !Number.isNaN(num) && Number.isFinite(num) && num > 0;
    };

    if (!isValidPrice(unknownProductPrice)) {
      return;
    }

    const price = parseFloat(unknownProductPrice);

    // إنشاء معرف مؤقت للمنتج المجهول (لا يتم حفظه في التخزين بعد)
    const tempId = `temp_${Date.now()}`;

    // Add to order with temporary ID
    const newItem: OrderItem = {
      productId: tempId,
      productName: unknownProductName.trim(),
      quantity: 1,
      price: price,
      total: price
    };
    setCurrentOrder([...currentOrder, newItem]);

    // Log activity if cashier is logged in
    logActivity('unknown_product_added', `Added unknown product: ${unknownProductName.trim()}`, undefined, tempId, unknownProductName.trim(), price);

    // Close dialog
    handleCloseUnknownProductDialog();

    // Reload orders to ensure we have the latest data
    loadOrders();

    // If user is viewing order history, reset to first order (most recent)
    if (showOrderHistory) {
      setTimeout(() => setCurrentOrderIndex(0), 0);
    }

    // إرسال حدث تحديث البيانات
    window.dispatchEvent(new Event('storage-updated'));
  };

  const handlePrintInvoice = () => {
    if (currentOrder.length === 0) {
      return;
    }
    const invoiceWindow = window.open('', 'PRINT', 'height=600,width=800');
    if (!invoiceWindow) return;
    const invoiceHtml = `
      <html>
        <head>
          <title>Invoice</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; }
            h2 { text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
            th { background: #f5f5f5; }
            .total { font-weight: bold; font-size: 1.2em; }
          </style>
        </head>
        <body>
          <h2>${t('invoice')}</h2>
          <table>
            <thead>
              <tr>
                <th>${t('productName')}</th>
                <th>${t('quantity')}</th>
                <th>${t('price')}</th>
                <th>${t('total')}</th>
              </tr>
            </thead>
            <tbody>
              ${currentOrder.map(item => `
                <tr>
                  <td>${item.productName}</td>
                  <td>${item.quantity}</td>
                  <td>${item.price.toFixed(2)}</td>
                  <td>${item.total.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div style="margin-top: 24px; text-align: right;">
            <span class="total">${t('totalAmount')}: ${totalAmount.toFixed(2)}</span>
          </div>
        </body>
      </html>
    `;
    invoiceWindow.document.write(invoiceHtml);
    invoiceWindow.document.close();
    invoiceWindow.focus();
    invoiceWindow.print();

    // تم حذف إشعار النجاح
  };

  const renderOrderHistory = () => {
    console.log('Rendering order history:', orderHistory.length, 'orders, current index:', currentOrderIndex);
    if (orderHistory.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <p>{t('noOrdersFound')}</p>
        </div>
      );
    }

    const currentOrder = orderHistory[currentOrderIndex];
    console.log('Current order:', currentOrder?.id.slice(-6));

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{t('orderHistory')}</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {currentOrderIndex + 1} / {orderHistory.length}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentOrderIndex(prev => prev > 0 ? prev - 1 : orderHistory.length - 1)}
              className="min-h-[32px] min-w-[32px] touch-manipulation"
            >
              <ArrowLeftIcon className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentOrderIndex(prev => prev < orderHistory.length - 1 ? prev + 1 : 0)}
              className="min-h-[32px] min-w-[32px] touch-manipulation"
            >
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">#{currentOrder.id.slice(-6)}</CardTitle>
                <CardDescription>{currentOrder.customerName}</CardDescription>
                <div className="text-xs text-gray-500 mt-1">{format(new Date(currentOrder.createdAt), 'dd/MM/yyyy HH:mm')}</div>
              </div>
              <Badge variant={currentOrder.status === 'completed' ? 'default' : 'secondary'}>
                {currentOrder.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {currentOrder.items.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">{item.productName}</p>
                    <p className="text-sm text-gray-600">{item.quantity} x {item.price.toFixed(2)}</p>
                  </div>
                  <p className="font-semibold">{item.total.toFixed(2)}</p>
                </div>
              ))}
              <div className="border-t pt-3">
                <div className="flex justify-between font-semibold">
                  <span>{t('totalAmount')}:</span>
                  <span className={`font-bold ${currentOrder.totalAmount < 0 ? 'text-red-600' : ''}`}>{currentOrder.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-gray-500">
          {t('useArrowKeys')} ← →
        </div>
      </div>
    );
  };

  const renderPendingOrders = () => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Open Orders</h3>
            <Button variant="outline" size="sm" onClick={() => setShowPendingOrders(false)}>
              ✕
            </Button>
          </div>
          <div className="space-y-3">
            {pendingOrders.map((order, index) => ({ order, index })).filter(({ order }) => order.length > 0).map(({ order, index }) => (
              <div
                key={index}
                className={`p-4 rounded-lg cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${index === dialogFocusIndex
                  ? 'bg-blue-100 border-2 border-blue-500'
                  : 'bg-gray-50 hover:bg-gray-100 border'
                  }`}
                onClick={() => {
                  setActiveOrderIndex(index);
                  setShowPendingOrders(false);
                }}
              >
                <div className="flex justify-between items-center">
                  <div className="font-semibold text-gray-800" data-lov-id="src\components\CashierDashboard.tsx:847:18">
                    {t('order')} #{index + 1}
                    <div className="text-xs text-gray-500 font-normal mt-1">
                      {pendingOrderTimes[index] ? format(new Date(pendingOrderTimes[index]), 'dd/MM/yyyy HH:mm:ss') : ''}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    {order.length} {t('items')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };
  return (
    <div className="min-h-screen bg-gray-50 flex flex-row">
      {/* Sidebar - Icons Only */}
      <div className="w-[70px] bg-white shadow-lg flex flex-col flex-shrink-0">
        {showLanguageSelector && (
          <div className="absolute left-16 top-4 bg-white shadow-lg rounded-lg p-2 space-y-1 z-50">
            <Button
              variant={language === 'en' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setLanguage('en')}
              className="w-full justify-start touch-manipulation text-xs"
            >
              EN
            </Button>
            <Button
              variant={language === 'ar' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setLanguage('ar')}
              className="w-full justify-start touch-manipulation text-xs"
            >
              عربي
            </Button>
            <Button
              variant={language === 'fr' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setLanguage('fr')}
              className="w-full justify-start touch-manipulation text-xs"
            >
              FR
            </Button>
          </div>
        )}

        {/* Navigation - Icons Only */}
        <nav className="w-[65px] p-2">
          <div className="space-y-2">
            <Button
              variant="destructive"
              className="w-[50px] h-[50px] touch-manipulation p-1"
              onClick={handleBackToMain}
              title={t('back')}
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <Button
              variant="outline"
              className="w-[50px] h-[50px] touch-manipulation p-2"
              onClick={handleNewOrder}
              title={t('newOrder')}
            >
              <Plus className="w-6 h-6" />
            </Button>
            <Button
              variant="outline"
              className="w-[50px] h-[50px] touch-manipulation p-2"
              onClick={handleViewPendingOrders}
              title={t('openOrders')}
            >
              <List className="w-6 h-6" />
            </Button>

            <Button
              variant={selectedCustomerId ? "default" : "outline"}
              className="w-[50px] h-[50px] touch-manipulation p-2"
              onClick={() => setShowCustomerDialog(true)}
              title="Select Customer"
            >
              <User className="w-6 h-6" />
            </Button>

            <Button
              variant="outline"
              className="w-[50px] h-[50px] touch-manipulation p-2"
              onClick={handleOpenReturnDialog}
              title={t('returnProduct')}
            >
              <RotateCcw className="w-6 h-6" />
            </Button>
            <Button
              variant="outline"
              className="w-[50px] h-[50px] touch-manipulation p-2"
              onClick={handleViewReports}
              title="Reports"
            >
              <FileText className="w-6 h-6" />
            </Button>
            <Button
              variant="outline"
              className="w-[50px] h-[50px] touch-manipulation p-2"
              onClick={handleViewOrderHistory}
              title="Orders History"
            >
              <Clock className="w-6 h-6" />
            </Button>
          </div>
        </nav>

        {/* Logout */}
        <div className="p-2 border-t mt-auto">
          <Button
            variant="ghost"
            className="w-[50px] h-[50px] flex items-center justify-center text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={onLogout}
            title={t('logout')}
          >
            <LogOut className="w-6 h-6" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header with Time/Date and Search */}
        {!showOrderHistory && (
          <div className="w-full flex flex-col pt-2 sm:pt-4 pb-2 px-2 sm:px-4 gap-2 sm:gap-3">
            {selectedCustomerId && (
              <div className="flex flex-col w-full gap-2 px-1">
                <div className="flex items-center justify-between py-1 w-full bg-transparent px-3 border-none shadow-none">
                  <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8 gap-1 capitalize font-semibold text-blue-600 border-blue-100 hover:bg-blue-50">
                          {orderType === 'regular' ? <><Receipt className="h-4 w-4" /> Regular</> : 
                           <><Wallet className="h-4 w-4" /> Bank Account</>}
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-40">
                        <DropdownMenuItem onClick={() => setOrderType('regular')} className="cursor-pointer gap-2">
                          <Receipt className="h-4 w-4" /> Regular
                        </DropdownMenuItem>
                        {selectedCustomerId && (
                          <DropdownMenuItem onClick={() => { setOrderType('bank'); setBankAction('debt'); }} className="cursor-pointer gap-2">
                            <Wallet className="h-4 w-4" /> Bank Account
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100 font-semibold"
                      onClick={handleWithdrawReward}
                    >
                      <Gift className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="flex-1 text-center truncate px-2 flex flex-col items-center justify-center">
                    <span className="text-sm sm:text-base font-bold text-gray-900 truncate leading-tight">
                      {customers.find(c => c.id === selectedCustomerId)?.name}
                    </span>
                    <div className="flex gap-1 mt-0.5 overflow-x-auto no-scrollbar">
                      {(() => {
                        const customer = customers.find(c => c.id === selectedCustomerId);
                        if (!customer) return null;
                        const bal = customer.balance || 0;
                        return (
                          <Badge 
                            variant="outline" 
                            className={`h-4 text-[9px] px-1 whitespace-nowrap ${
                              bal > 0 ? 'bg-green-50 text-green-600 border-green-100' : 
                              bal < 0 ? 'bg-red-50 text-red-600 border-red-100' : 
                              'bg-gray-50 text-gray-600 border-gray-100'
                            }`}
                          >
                            Balance: ${bal.toFixed(2)}
                          </Badge>
                        );
                      })()}
                    </div>
                  </div>

                  {(() => {
                    const customer = customers.find(c => c.id === selectedCustomerId);
                    const settings = useCustomerStore.getState().settings;
                    const isPurchases = settings.rewardMethod === 'purchases';
                    return (
                      <Badge variant="outline" className="border-yellow-200 bg-yellow-400 text-white font-bold py-1 px-2 text-[10px] whitespace-nowrap shadow-sm min-w-[50px] justify-center">
                        {isPurchases ? `${customer?.totalPurchases || 0} VISITS` : `${customer?.points || 0} PTS`}
                      </Badge>
                    );
                  })()}
                </div>

                {/* Sub-buttons for Bank Actions - Simpler Design */}
                {orderType === 'bank' && (
                  <div className="grid grid-cols-3 bg-gray-100 p-1 rounded-xl gap-1 mt-1 animate-in fade-in slide-in-from-top-1 duration-200">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-7 text-[10px] font-bold rounded-lg transition-all ${bankAction === 'debt' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-400 hover:text-red-500 hover:bg-white'}`}
                      onClick={() => setBankAction('debt')}
                    >
                      <List className="w-3 h-3 mr-1" />
                      Debt
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-7 text-[10px] font-bold rounded-lg transition-all ${bankAction === 'payment' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-400 hover:text-green-500 hover:bg-white'}`}
                      onClick={() => { setBankAction('payment'); setFinancialType('payment'); setShowFinancialDialog(true); }}
                    >
                      <ArrowUpCircle className="w-3 h-3 mr-1" />
                      Pay
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-7 text-[10px] font-bold rounded-lg transition-all ${bankAction === 'use_balance' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-blue-500 hover:bg-white'}`}
                      onClick={() => setBankAction('use_balance')}
                    >
                      <Wallet className="w-3 h-3 mr-1" />
                      Use
                    </Button>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-2 sm:gap-3 w-full">
              <div className="flex items-center bg-white rounded-full shadow px-3 sm:px-6 py-2 flex-1 min-w-0 relative">
                <input
                  type="text"
                  placeholder="Search products or serial number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-gray-700 placeholder-gray-400 text-sm sm:text-base rounded-full pl-2 pr-8 sm:pr-10 min-w-0"
                  style={{ border: 'none', boxShadow: 'none' }}
                />
                <span className="absolute right-2 sm:right-4 flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white">
                  <Search className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                </span>
              </div>
              {showUnknownProductButton && (
                <Button
                  onClick={handleOpenUnknownProductDialog}
                  variant="outline"
                  className="bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100 hover:border-orange-300 px-2 sm:px-4 py-2 h-8 sm:h-10 text-xs sm:text-sm flex-shrink-0 whitespace-nowrap"
                >
                  <HelpCircle className="w-4 h-4 sm:mr-2" />
                  <span className="hidden md:inline">{t('unknownProduct')}</span>
                  <span className="hidden sm:inline md:hidden">{'Unkown'}</span>
                </Button>
              )}
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Products Section */}
          <div className="flex-1 flex flex-col">
            {/* Category Buttons */}
            {!showOrderHistory && (
              <div className="p-3 bg-gray-50">
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => setSelectedCategoryId('all')}
                    className={`px-4 py-2 rounded-full font-medium text-sm transition-all duration-150 ${selectedCategoryId === 'all'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                      }`}
                  >
                    {t('All') || 'All Menu'}
                  </Button>
                  {categories.map((category) => (
                    <Button
                      key={category.id}
                      onClick={() => setSelectedCategoryId(category.id)}
                      className={`px-4 py-2 rounded-full font-medium text-sm transition-all duration-150 ${selectedCategoryId === category.id
                        ? 'bg-blue-500 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                        }`}
                    >
                      {category.name}
                    </Button>
                  ))}

                </div>
              </div>
            )}
            {/* Products Grid */}
            <div className="flex-1 overflow-y-auto p-4">
              {showOrderHistory ? (
                renderOrderHistory()
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
                  {filteredProducts.map((product) => (
                    <Card
                      key={product.id}
                      className="cursor-pointer hover:shadow-lg transition-shadow touch-manipulation flex flex-col"
                      onClick={() => handleAddToOrder(product)}
                    >
                      <CardContent className="p-3 flex flex-col flex-grow">
                        <div className="flex-grow">
                          <h3 className="font-semibold text-base leading-tight mb-1 break-words">
                            {product.name.length > 30 ? `${product.name.substring(0, 30)}...` : product.name}
                          </h3>
                          <p className="text-xs text-gray-500 font-mono truncate">{product.serialNumber}</p>
                        </div>
                        <p className="text-lg font-bold text-primary-600 mt-2 self-end">{product.price.toFixed(2)}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}


            </div>
          </div>

        </div>
      </div>
      {/* Order Section */}
      <div className="w-[320px] bg-white flex flex-col p-0 m-0 flex-shrink-0 h-screen border-l">
        {/* Order Header */}
        <div className="m-0 p-0">
          <div className="flex justify-center items-center gap-4 py-2 text-sm text-white bg-blue-600 border border-blue-700 m-2 rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-white" />
              <span className="font-semibold">{format(currentTime, 'HH:mm:ss')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-white" />
              <span className="font-semibold">{format(currentTime, 'dd/MM/yyyy')}</span>
            </div>
          </div>
          <div className="flex items-center justify-between px-2 sm:px-4 pt-1 pb-2">
            <h3 className="text-base sm:text-lg font-semibold">Current Order</h3>
            <div className="flex items-center">
              <span className="rounded-full bg-white text-gray-800 text-xs sm:text-base font-semibold px-2 sm:px-3 py-1" title={`${t('items')}`}>
                {currentOrder.length} {t('items')}
              </span>
            </div>
          </div>
        </div>

        {/* Order Items - Fixed Height */}
        <div className="h-80 sm:h-96 lg:h-[400px] overflow-y-auto p-0 m-0">
          {currentOrder.length === 0 ? (
            <div className="p-4 text-center text-gray-500 h-full flex items-center justify-center">
              <div>
                <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>{t('noItems')}</p>
              </div>
            </div>
          ) : (
            <div className="p-0 space-y-2 sm:space-y-3">
              {currentOrder.map((item) => (
                <div
                  key={item.productId}
                  className={`flex items-center justify-between p-1 sm:p-2 gap-1 sm:gap-2 rounded-md ${item.quantity < 0 ? 'bg-red-50' : 'hover:bg-gray-50'} ${allowPriceModification ? 'cursor-pointer' : ''}`}
                >
                  <div
                    className="flex-1 min-w-0"
                    onClick={() => allowPriceModification && handleEditPriceClick(item)}
                  >
                    <h4 className="font-medium text-xs sm:text-sm truncate">{item.productName}</h4>
                    <p className="text-xs text-gray-500">
                      {item.price.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center gap-0.5 sm:gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                      onMouseDown={(e) => { e.stopPropagation(); startContinuousUpdate(item.productId, false); }}
                      onMouseUp={stopContinuousUpdate}
                      onMouseLeave={stopContinuousUpdate}
                      className="h-[20px] w-[20px] sm:h-[24px] sm:w-[24px] p-0 rounded-full bg-gray-200 hover:bg-gray-300"
                    >
                      <Minus className="w-2 h-2 sm:w-3 sm:h-3" />
                    </Button>
                    <input
                      type="number" className={`w-8 sm:w-10 text-center font-medium h-5 sm:h-6 text-xs ${item.quantity < 0 ? 'bg-red-50' : ''}`} value={item.quantity} onChange={e => handleUpdateQuantity(item.productId, Number(e.target.value))} min={-999} max={999} step={1} style={{ direction: 'ltr' }} />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                      onMouseDown={(e) => { e.stopPropagation(); startContinuousUpdate(item.productId, true); }}
                      onMouseUp={stopContinuousUpdate}
                      onMouseLeave={stopContinuousUpdate}
                      className="h-[20px] w-[20px] sm:h-[24px] sm:w-[24px] p-0 rounded-full bg-gray-200 hover:bg-gray-300"
                    >
                      <Plus className="w-2 h-2 sm:w-3 sm:h-3" />
                    </Button>
                  </div>
                  <div className="text-right ml-0.5 sm:ml-1 min-w-[40px] sm:min-w-[48px] flex items-center justify-end gap-1">
                    <p className={`font-semibold text-xs w-16 text-center ${item.quantity < 0 ? 'text-red-600' : 'text-black'}`}>
                      {item.total.toFixed(2)}
                    </p>
                    <Button size="sm" variant="ghost" onClick={() => handleRemoveFromOrder(item.productId)} className="h-[20px] w-[20px] sm:h-[24px] sm:w-[24px] p-0 rounded-full bg-white hover:bg-gray-100"><X className="w-2 h-2 sm:w-3 sm:h-3" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div className="p-2 sm:p-4 bg-white border-t space-y-3 pt-0">
          <div className="space-y-2 pt-0">
            <div className="flex justify-between text-lg sm:text-2xl pt-0">
              <span className="font-medium">{t('totalAmount')}:</span>
              <span className={`font-bold ${totalAmount < 0 ? 'text-red-600' : 'text-blue-600'}`}>{totalAmount.toFixed(2)}</span>
            </div>
            {orderType === 'bank' && bankAction === 'use_balance' && selectedCustomerId && (() => {
               const customer = customers.find(c => c.id === selectedCustomerId);
               const balance = customer?.balance || 0;
               if (balance < totalAmount) {
                 return (
                   <div className="flex items-center gap-2 p-2 bg-red-50 text-red-700 rounded-lg border border-red-100 animate-pulse">
                     <AlertTriangle className="w-4 h-4" />
                     <p className="text-xs font-bold">الرصيد لا يكفي! المتبقي يجب دفعه نقداً (${(totalAmount - balance).toFixed(2)})</p>
                   </div>
                 );
               }
               return null;
            })()}
            {orderType === 'regular' && (
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">{t('amountPaid') || 'Amount Paid'}</label>
                <div className="relative">
                  <Input
                    type="number"
                    step="1"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    placeholder="0.00"
                    className="h-10 text-lg font-bold text-green-600 pr-10"
                  />
                  <Banknote className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-400" />
                </div>
              </div>
            )}
            {orderType === 'regular' && amountPaid && (
              <div className="flex justify-between text-sm bg-gray-50 p-2 rounded">
                <span className="text-gray-600">{t('remainingAmount')}:</span>
                <span className={`font-bold ${remainingAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {Math.abs(remainingAmount).toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleClearOrder}
                className="flex-1 h-12 border-gray-200 text-gray-600 hover:bg-gray-50"
                disabled={currentOrder.length === 0}
              >
                {t('clear')}
              </Button>
              <Button
                onClick={handleCompleteOrder}
                className={`flex-1 h-12 text-white font-bold shadow-lg shadow-blue-100 ${currentOrder.some(item => item.quantity < 0)
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                disabled={currentOrder.length === 0}
              >
                {orderType === 'regular' ? (
                  currentOrder.some(item => item.quantity < 0) ? t('return') : t('complete')
                ) : (
                  bankAction === 'debt' ? 'Debt Order' :
                  bankAction === 'payment' ? 'Payment' : 'Use Balance'
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Price Dialog */}
      <Dialog open={showProductDetailsDialog} onOpenChange={() => { setShowProductDetailsDialog(false); setSelectedOrderItem(null); }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{selectedOrderItem?.productName || <>&nbsp;</>}</DialogTitle>
            <DialogDescription>
              Modify the unit price for this item in the current order.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-price" className="text-right">Unit price</Label>
              <Input
                id="new-price"
                type="number"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSavePrice()}
                className="col-span-3"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter className="flex flex-row gap-2">
            <Button variant="outline" className="flex-1" onClick={() => { setShowProductDetailsDialog(false); setSelectedOrderItem(null); }}>{t('cancel')}</Button>
            <Button onClick={handleSavePrice} className="flex-1">{t('save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Pending Orders Dialog */}
      {showPendingOrders && renderPendingOrders()}

      {/* Unknown Product Dialog */}
      {showUnknownProductDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">{t('addUnknownProduct')}</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCloseUnknownProductDialog}
              >
                ✕
              </Button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('productName')}
              </label>
              <Input
                type="text"
                value={unknownProductName}
                onChange={(e) => setUnknownProductName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    unknownProductPriceRef.current?.focus();
                  }
                }}
                placeholder="Enter product name..."
                className="w-full mb-4"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('price')}
              </label>
              <Input
                type="number"
                step="1"
                min="0"
                value={unknownProductPrice}
                ref={unknownProductPriceRef}
                onChange={(e) => setUnknownProductPrice(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (unknownProductName.trim() && unknownProductPrice.trim()) {
                      handleAddUnknownProduct();
                    }
                  }
                }}
                placeholder="0.00"
                className="w-full"
              />
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleCloseUnknownProductDialog}
              >
                {t('cancel')}
              </Button>
              <Button
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                onClick={handleAddUnknownProduct}
                disabled={!unknownProductName.trim() || !unknownProductPrice.trim()}
              >
                {t('add')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showReturnDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {!selectedOrderForReturn && !returnSuccess && (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">{t('returnProducts')}</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowReturnDialog(false)}
                  >
                    ✕
                  </Button>
                </div>

                <div className="space-y-3 max-h-64 overflow-y-auto p-3">
                  {orderHistory.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      <p>{t('noBillsForReturn')}</p>
                    </div>
                  ) : (
                    [...orderHistory]
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .filter(order => {
                        if (order.totalAmount < 0) return false; // Filter out return orders themselves

                        const allReturns = returnsStorage.getAll();
                        const orderReturns = allReturns.filter(r => r.orderId === order.id);
                        if (orderReturns.length === 0) return true; // No returns for this order, so show it.

                        const totalOriginalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
                        const totalReturnedItems = orderReturns.reduce((sum, r) => sum + r.quantity, 0);
                        return totalOriginalItems > totalReturnedItems;
                      })
                      .map((order) => (
                        (() => {
                          const allReturns = returnsStorage.getAll();
                          const orderReturns = allReturns.filter(r => r.orderId === order.id);
                          const totalReturnValue = orderReturns.reduce((sum, ret) => {
                            const originalItem = order.items.find(item => item.productId === ret.productId);
                            return sum + (originalItem ? originalItem.price * ret.quantity : 0);
                          }, 0);
                          const remainingItemsCount = order.items.filter(item => {
                            const returnedQty = orderReturns
                              .filter(r => r.productId === item.productId)
                              .reduce((sum, r) => sum + r.quantity, 0);
                            return item.quantity - returnedQty > 0;
                          }).length;

                          return (
                            <div
                              key={order.id}
                              className="flex items-center justify-between p-4 cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors rounded-lg border"
                              onClick={() => handleSelectOrderForReturn(order)}
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-3">
                                  <div className="bg-blue-100 p-2 rounded-full">
                                    <Receipt className="w-5 h-5 text-blue-600" />
                                  </div>
                                  <div>
                                    <div className="font-medium text-gray-900">#{order.id.slice(-6)}</div>
                                    <div className="text-sm text-gray-600">{remainingItemsCount} {t('items')}</div>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold text-gray-900">{(order.totalAmount - totalReturnValue).toFixed(2)}</div>
                                <div className="text-sm text-gray-500">{format(new Date(order.createdAt), 'HH:mm')}</div>
                              </div>
                            </div>
                          );
                        })()
                      ))
                  )}
                </div>
              </>
            )}

            {selectedOrderForReturn && !returnSuccess && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{t('returnProducts')}</h3>
                    <p className="text-sm text-gray-600">
                      #{selectedOrderForReturn.id.slice(-6)} - {selectedOrderForReturn.customerName}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowReturnDialog(false)}
                  >
                    ✕
                  </Button>
                </div>

                <div className="space-y-0">
                  <div className="bg-white p-[10px] rounded-lg" data-lov-id="src\components\CashierDashboard.tsx:1427:19">
                    <div className="space-y-3">
                      {(() => {
                        const allReturns = returnsStorage.getAll();
                        const orderReturns = allReturns.filter(r => r.orderId === selectedOrderForReturn.id);

                        const displayItems = selectedOrderForReturn.items.map(item => {
                          const returnedQty = orderReturns
                            .filter(r => r.productId === item.productId)
                            .reduce((sum, r) => sum + r.quantity, 0);
                          return { ...item, remainingQty: item.quantity - returnedQty };
                        }).filter(item => item.remainingQty > 0);

                        return displayItems.map(item => (
                          <div key={item.productId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{item.productName}</div>
                              <div className="text-sm text-gray-600">
                                {item.remainingQty} x {item.price.toFixed(2)} | {(item.remainingQty * item.price).toFixed(2)}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {selectedProductsForReturn[item.productId] > 0 && (
                                <div className="text-right">
                                  <div className="text-sm font-medium text-red-600">
                                    -{((selectedProductsForReturn[item.productId] || 0) * item.price).toFixed(2)}
                                  </div>
                                </div>
                              )}
                              <div className="text-center">
                                <Input
                                  type="number"
                                  min={0}
                                  max={item.remainingQty}
                                  value={selectedProductsForReturn[item.productId] || 0}
                                  onChange={e => handleSetReturnQuantity(item.productId, item.remainingQty, Number(e.target.value))}
                                  className="w-24 text-center"
                                />
                              </div>
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>

                  <div className="bg-white p-[10px] rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{t('totalReturnValue')}:</div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-red-600">
                          -{Object.entries(selectedProductsForReturn).reduce((total, [productId, qty]) => {
                            const item = selectedOrderForReturn.items.find(i => i.productId === productId);
                            return total + (item ? item.price * qty : 0);
                          }, 0).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-0">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setSelectedOrderForReturn(null)}
                  >
                    {t('back')}
                  </Button>
                  <Button
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                    onClick={handleConfirmReturn}
                    disabled={Object.values(selectedProductsForReturn).every(qty => qty === 0)}
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    {t('Complete')}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Reports Dialog */}
      {showReportsDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4">
              <h3 className="text-lg font-semibold">Send Report to Admin</h3>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowReportsDialog(false)}
                className="h-8 w-8"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="p-4 space-y-4">
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">Report Message</label>
                  <textarea
                    value={reportMessage}
                    onChange={(e) => setReportMessage(e.target.value)}
                    placeholder="Write your report here..."
                    className="w-full h-32 p-3 rounded-md resize-none"
                  />
                </div>

                <div className="flex gap-3" data-lov-id="src\components\CashierDashboard.tsx:1330:19">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowReportsDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={handleSendReport}
                    disabled={!reportMessage.trim()}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send Report
                  </Button>
                </div>
              </>
            </div>
          </div>
        </div>
      )}

      <Dialog open={showCustomerDialog} onOpenChange={setShowCustomerDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-700">
              <User className="w-5 h-5" />
              Select Customer for Order
            </DialogTitle>
            <DialogDescription>
              Choose a customer from the list below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by name..."
                className="pl-10"
                value={customerSearchTerm}
                onChange={(e) => setCustomerSearchTerm(e.target.value)}
              />
            </div>

            <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-2 custom-scrollbar">
              {customers
                .filter(c => c.name.toLowerCase().includes(customerSearchTerm.toLowerCase()))
                .length === 0 ? (
                <div className="text-center py-8 text-gray-500 italic">
                  No customers found
                </div>
              ) : (
                customers
                  .filter(c => c.name.toLowerCase().includes(customerSearchTerm.toLowerCase()))
                  .map(c => (
                    <div key={c.id} className="flex gap-2">
                      <Button
                        variant={selectedCustomerId === c.id ? "default" : "outline"}
                        className={`flex-1 justify-between h-12 px-4 shadow-sm border-gray-100 ${selectedCustomerId === c.id ? 'bg-blue-600 hover:bg-blue-700' : 'hover:bg-blue-50'}`}
                        onClick={() => {
                          setSelectedCustomerId(c.id);
                          setOrderType('regular');
                          setShowCustomerDialog(false);
                          setCustomerSearchTerm('');
                        }}
                      >
                        <span className="font-semibold">{c.name}</span>
                        <Badge variant="secondary" className={selectedCustomerId === c.id ? "bg-blue-400 text-white border-none" : "bg-blue-50 text-blue-700 border-none"}>
                          {useCustomerStore.getState().settings.rewardMethod === 'purchases' ? `${c.totalPurchases} VISITS` : `${c.points} PTS`}
                        </Badge>
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-12 w-12 border-gray-100 text-blue-600 hover:bg-blue-50"
                        onClick={() => { setViewingCustomerData(c); setShowCustomerInfoDialog(true); }}
                      >
                        <Eye className="w-5 h-5" />
                      </Button>
                    </div>
                  ))
              )
              }
            </div>

            {selectedCustomerId && (
              <Button
                variant="outline"
                className="w-full mt-2 text-red-600 border-red-100 hover:bg-red-50"
                onClick={() => { setSelectedCustomerId(null); setShowCustomerDialog(false); }}
              >
                Cancel Selection
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={showCustomerInfoDialog} onOpenChange={setShowCustomerInfoDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-700 text-xl">
              <User className="w-6 h-6" />
              Customer Information
            </DialogTitle>
            <DialogDescription>
              View detailed account information for this customer.
            </DialogDescription>
          </DialogHeader>
          {(() => {
            const customer = customers.find(c => c.id === viewingCustomerData?.id);
            if (!customer) return null;
            const settings = useCustomerStore.getState().settings;
            const isPurchases = settings.rewardMethod === 'purchases';
            const currentVal = isPurchases ? customer.totalPurchases : customer.points;
            const requiredNum = isPurchases ? settings.purchasesRequiredForReward : settings.pointsRequiredForReward;
            const rewardsCount = Math.floor(currentVal / (requiredNum || 1));

            return (
              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 p-3 border rounded">
                    <p className="text-xs text-gray-500 uppercase font-bold">Name</p>
                    <p className="font-bold text-lg">{customer.name}</p>
                  </div>
                  <div className="bg-gray-50 p-3 border rounded text-right">
                    <p className="text-xs text-gray-500 uppercase font-bold">Available Rewards</p>
                    <p className="font-bold text-lg text-yellow-600">{rewardsCount} {t('gifts') || 'Gifts'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <div className="bg-blue-50 p-3 border border-blue-100 rounded flex justify-between items-center text-sm">
                    <span className="font-semibold">Total Purchases / Points</span>
                    <span className="font-bold text-blue-700">{currentVal}</span>
                  </div>
                  <div className={`p-3 border rounded flex justify-between items-center text-sm ${customer.balance >= 0 ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                    <span className={`font-semibold ${customer.balance >= 0 ? 'text-green-700' : 'text-red-700'}`}>Current Balance</span>
                    <span className={`font-bold ${customer.balance >= 0 ? 'text-green-700' : 'text-red-700'}`}>${(customer.balance || 0).toFixed(2)}</span>
                  </div>
                  {customer.pendingVisits > 0 && settings.rewardMethod === 'purchases' && (
                    <div className="bg-amber-50 p-2.5 border border-amber-100 rounded flex justify-between items-center text-xs">
                      <span className="font-semibold text-amber-700">Pending Visits (Unpaid Debt)</span>
                      <span className="font-bold text-amber-700">{customer.pendingVisits} {t('visits') || 'Visits'}</span>
                    </div>
                  )}
                </div>
                
                <Button className="w-full h-11" onClick={() => setShowCustomerInfoDialog(false)}>
                  Close
                </Button>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
      <Dialog 
        open={showFinancialDialog} 
        onOpenChange={(open) => {
          if (!open) {
            setFinancialAmount('');
            setFinancialType(null);
            // Requirement: Reset to Debt if Cancel is pressed
            if (bankAction === 'payment') setBankAction('debt');
          }
          setShowFinancialDialog(open);
        }}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-green-600" />
              Payment to Bank Account
            </DialogTitle>
            <DialogDescription>
              Enter the amount the customer wants to pay into their bank account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 p-0">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-gray-500">Amount</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={financialAmount}
                onChange={(e) => setFinancialAmount(e.target.value)}
                className="text-center text-2xl font-black h-12"
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => {
                setShowFinancialDialog(false);
                setBankAction('debt');
              }}>Cancel</Button>
              <Button 
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                onClick={handleFinancialAction}
                disabled={!financialAmount || parseFloat(financialAmount) <= 0}
              >
                Confirm
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showRewardDialog} onOpenChange={setShowRewardDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-yellow-600">
              <Gift className="w-6 h-6" />
              Withdraw Reward
            </DialogTitle>
            <DialogDescription>
              Review available rewards and points for this customer.
            </DialogDescription>
          </DialogHeader>
          {(() => {
            const customer = customers.find(c => c.id === selectedCustomerId);
            if (!customer) return null;
            const settings = useCustomerStore.getState().settings;
            const isPurchases = settings.rewardMethod === 'purchases';
            const currentVal = isPurchases ? customer.totalPurchases : customer.points;
            const requiredNum = isPurchases ? settings.purchasesRequiredForReward : settings.pointsRequiredForReward;
            const rewardsCount = Math.floor(currentVal / (requiredNum || 1));
            
            return (
              <div className="space-y-6 pt-4">
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border">
                  <div>
                    <p className="text-sm text-gray-500 uppercase font-bold">{isPurchases ? 'Total Visits' : 'Current Points'}</p>
                    <p className="text-3xl font-black">{currentVal}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500 uppercase font-bold">Available Gifts</p>
                    <p className="text-3xl font-black text-yellow-600">{rewardsCount}</p>
                  </div>
                </div>

                <div className="space-y-2">
                   <p className="text-sm font-medium text-gray-700">Required per reward: <span className="font-bold">{requiredNum} {isPurchases ? 'visits' : 'points'}</span></p>
                   <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-yellow-400 h-full transition-all" 
                        style={{ width: `${Math.min(100, (currentVal % requiredNum) / requiredNum * 100)}%` }} 
                      />
                   </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1 h-12" onClick={() => setShowRewardDialog(false)}>
                    Close
                  </Button>
                  <Button 
                    className="flex-1 h-12 bg-yellow-500 hover:bg-yellow-600 text-white font-bold"
                    onClick={executeRewardWithdraw}
                    disabled={rewardsCount <= 0}
                  >
                    Withdraw Gift
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      <Dialog open={showInsufficientBalanceDialog} onOpenChange={setShowInsufficientBalanceDialog}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Insufficient Balance
            </DialogTitle>
            <DialogDescription>
              The customer's balance is not enough to cover this order.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="p-4 bg-orange-50 text-orange-800 rounded-lg border border-orange-100">
              <p className="font-medium">
                Customer Balance: <span className="font-bold">${(insufficientBalanceInfo?.balance || 0).toFixed(2)}</span>
              </p>
              <p className="font-medium">
                Order Total: <span className="font-bold">${(insufficientBalanceInfo?.amount || 0).toFixed(2)}</span>
              </p>
              <p className="text-xl font-black mt-2">
                Remainder: <span className="text-red-600">${((insufficientBalanceInfo?.amount || 0) - (insufficientBalanceInfo?.balance || 0)).toFixed(2)}</span>
              </p>
            </div>
            
            <p className="text-sm font-medium text-gray-700">How would you like to handle the remainder?</p>
            
            <div className="grid grid-cols-1 gap-2">
              <Button 
                variant="outline" 
                className="h-12 justify-start px-4 gap-3 border-red-100 hover:bg-red-50 text-red-700 font-bold"
                onClick={() => {
                  setShowInsufficientBalanceDialog(false);
                  setBankAction('debt');
                  handleCompleteOrder();
                }}
              >
                <ArrowDownToLine className="w-5 h-5" />
                Record everything as a Debt Order
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CashierDashboard;
