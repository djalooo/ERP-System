// تحديث البيانات المحفوظة لتغيير 'مستخدم مؤقت' إلى 'None'
console.log('بدء تحديث البيانات...');

// تحديث الطلبات
const orders = JSON.parse(localStorage.getItem('mpm_orders') || '[]');
let updatedCount = 0;

const updatedOrders = orders.map(order => {
  if (order.cashierName === 'مستخدم مؤقت') {
    updatedCount++;
    return { ...order, cashierName: 'None' };
  }
  return order;
});

localStorage.setItem('mpm_orders', JSON.stringify(updatedOrders));

// تحديث المنتجات المجهولة إذا وجدت
const unknownProducts = JSON.parse(localStorage.getItem('mpm_unknown_products') || '[]');
let unknownUpdatedCount = 0;

const updatedUnknownProducts = unknownProducts.map(product => {
  if (product.cashierName === 'مستخدم مؤقت') {
    unknownUpdatedCount++;
    return { ...product, cashierName: 'None' };
  }
  return product;
});

localStorage.setItem('mpm_unknown_products', JSON.stringify(updatedUnknownProducts));

console.log(`تم تحديث ${updatedCount} طلب و ${unknownUpdatedCount} منتج مجهول`);
alert(`تم تحديث البيانات بنجاح!\nالطلبات المحدثة: ${updatedCount}\nالمنتجات المجهولة المحدثة: ${unknownUpdatedCount}\n\nسيتم إعادة تحميل الصفحة الآن.`);

// إعادة تحميل الصفحة لعرض التحديثات
setTimeout(() => {
  location.reload();
}, 1000);