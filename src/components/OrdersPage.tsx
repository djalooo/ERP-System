import { addDays, isToday, isAfter, format, parseISO, isValid, startOfDay, endOfDay } from 'date-fns';
import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { UnknownProduct, Order } from '@/lib/storage';
import {
  managedUnknownProductStorage as unknownProductStorage,
  managedProductStorage as productStorage,
  managedOrderStorage as orderStorage
} from '@/lib/managedStorage';

const OrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [editingDate, setEditingDate] = useState<string>('');

  useEffect(() => {
    const allOrders = orderStorage.getAll();
    // Only show actual product orders, not financial bank transactions (payments / deposits)
    setOrders(allOrders.filter(o => !(o.type === 'bank' && (o.bankAction === 'payment' || o.bankAction === 'use_balance'))));
  }, []);

  // تحديث الطلبات عند أي تغيير في التخزين أو عند استقبال حدث تحديث
  useEffect(() => {
    const handleForceRefresh = () => {
      const allOrders = orderStorage.getAll();
      setOrders(allOrders.filter(o => !(o.type === 'bank' && (o.bankAction === 'payment' || o.bankAction === 'use_balance'))));
    };
    window.addEventListener('storage-updated', handleForceRefresh);
    window.addEventListener('storage', handleForceRefresh);
    return () => {
      window.removeEventListener('storage-updated', handleForceRefresh);
      window.removeEventListener('storage', handleForceRefresh);
    };
  }, []);

  // إصلاح المنتجات التي لا تحتوي على purchasePrice
  const fixMissingPurchasePrices = () => {
    const allProducts = productStorage.getAll();
    let fixedCount = 0;
    
    allProducts.forEach(product => {
      // تحسين التحقق من صحة سعر الشراء
      const isValidPrice = (price: any): price is number => {
        return typeof price === 'number' && !Number.isNaN(price) && Number.isFinite(price) && price > 0;
      };
      
      if (!isValidPrice(product.purchasePrice)) {
        // استخدام 70% من سعر البيع كسعر شراء افتراضي
        const defaultPurchasePrice = product.price * 0.7;
        productStorage.update(product.id, {
          ...product,
          purchasePrice: defaultPurchasePrice
        });
        fixedCount++;
        console.log(`Fixed product ${product.name}: set purchasePrice to ${defaultPurchasePrice}`);
      }
    });
    
    if (fixedCount > 0) {
      console.log(`Fixed ${fixedCount} products with missing purchasePrice`);
      window.dispatchEvent(new Event('storage-updated'));
    }
  };

  // إنشاء بيانات تجريبية لاختبار حساب الربح
  const createTestData = () => {
    // إنشاء منتج تجريبي
    const testProduct = productStorage.add({
      name: 'منتج تجريبي',
      serialNumber: 'TEST001',
      price: 100,
      purchasePrice: 70,
      tax: 5,
      quantity: 10,
      totalSales: 0
    });
    
    // إنشاء طلب تجريبي
    const testOrder = orderStorage.add({
      customerName: 'عميل تجريبي',
      items: [{
        productId: testProduct.id,
        productName: testProduct.name,
        quantity: 2,
        price: testProduct.price,
        total: testProduct.price * 2
      }],
      totalAmount: testProduct.price * 2,
      amountPaid: testProduct.price * 2,
      remainingAmount: 0,
      status: 'completed'
    });
    
    // تحديث قائمة الطلبات
    const allOrders = orderStorage.getAll();
    setOrders(allOrders);
    
    console.log('تم إنشاء بيانات تجريبية:', { testProduct, testOrder });
    alert('تم إنشاء بيانات تجريبية بنجاح!');
  };

  // إضافة حساب الربح لكل طلب
  const calculateOrderProfit = (order: Order) => {
    let totalProfit = 0;
    
    const productMap = new Map(productStorage.getAll().map(p => [p.id, p]));

    order.items.forEach(item => {
      // استخدام سعر الشراء المسجل في الفاتورة إن وجد (للبيانات الجديدة)
      const purchasePriceAtSale = item.purchasePrice;

      if (typeof purchasePriceAtSale === 'number') {
        const profitPerUnit = item.price - purchasePriceAtSale;
        totalProfit += profitPerUnit * item.quantity;
      } else {
        // استخدام سعر الشراء الحالي كحل بديل للبيانات القديمة
        const product = productMap.get(item.productId);
        if (product && typeof product.purchasePrice === 'number') {
          const profitPerUnit = item.price - product.purchasePrice;
          totalProfit += profitPerUnit * item.quantity;
        }
      }
    });
    
    return Math.max(0, totalProfit);
  };

  // تعديل تاريخ الطلب
  const handleDateEdit = (orderId: string, currentDate: string) => {
    setEditingOrderId(orderId);
    setEditingDate(format(new Date(currentDate), 'yyyy-MM-dd'));
  };

  // حفظ التاريخ المعدل
  const handleDateSave = (orderId: string) => {
    const newDate = parseISO(editingDate);
    if (!isValid(newDate)) {
      alert('تنسيق التاريخ غير صالح. يرجى استخدام YYYY-MM-DD.');
      return;
    }

    const orderToUpdate = orderStorage.getById(orderId);
      if (orderToUpdate) {
      const timePart = new Date(orderToUpdate.createdAt).toISOString().split('T')[1];
      const newIsoString = `${format(newDate, 'yyyy-MM-dd')}T${timePart}`;
      
      }
      setEditingOrderId(null);
      setEditingDate('');
  };

  // إلغاء تعديل التاريخ
  const handleDateCancel = () => {
    setEditingOrderId(null);
    setEditingDate('');
  };

  return (
    <div>
      <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <Button 
          onClick={fixMissingPurchasePrices}
          variant="outline"
          size="sm"
        >
          إصلاح أسعار الشراء المفقودة
        </Button>
        <Button 
          onClick={createTestData}
          variant="outline"
          size="sm"
        >
          إنشاء بيانات تجريبية
        </Button>
        <span style={{ fontSize: '0.875rem', color: '#666' }}>
          يستخدم 70% من سعر البيع كسعر شراء افتراضي
        </span>
      </div>
      <table>
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Date</th>
            <th>Total</th>
            <th>Profit</th>
            <th>Role</th>
          </tr>
        </thead>
        <tbody>
          {orders.length === 0 ? (
            <tr>
              <td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>No Orders Found</td>
            </tr>
          ) : (
            orders.map(order => (
              <tr key={order.id}>
                <td>{order.id}</td>
                <td>
                  {editingOrderId === order.id ? (
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <Input
                        type="text"
                        value={editingDate}
                        onChange={(e) => setEditingDate(e.target.value)}
                        style={{ width: '140px', fontSize: '12px' }}
                        placeholder="YYYY-MM-DD"
                        autoComplete="off"
                        autoFocus
                      />
                      <Button
                        size="sm"
                        onClick={() => handleDateSave(order.id)}
                        style={{ padding: '2px 6px', fontSize: '10px' }}
                      >
                        ✓
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleDateCancel}
                        style={{ padding: '2px 6px', fontSize: '10px' }}
                      >
                        ✕
                      </Button>
                    </div>
                  ) : (
                    <div
                      onClick={() => handleDateEdit(order.id, order.createdAt)}
                      className="cursor-pointer p-1 rounded-md hover:bg-gray-100 transition-colors"
                    >
                      {format(new Date(order.createdAt), 'yyyy-MM-dd HH:mm')}
                    </div>
                  )}
                </td>
                <td>${order.totalAmount.toFixed(2)}</td>
                <td className="font-medium">
                  ${calculateOrderProfit(order).toFixed(2)}
                </td>
                <td>{order.cashierName || order.cashierId || '—'}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default OrdersPage;