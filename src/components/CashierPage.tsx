import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { OrderItem, Product, productStorage, settingsStorage } from '@/lib/storage';
import { Edit } from 'lucide-react';

// This is a mock component. You should integrate this logic into your actual CashierPage.
const CashierPage = () => {
  const [currentOrder, setCurrentOrder] = useState<OrderItem[]>([]);
  const [allowPriceModification, setAllowPriceModification] = useState(false);
  const [editingItem, setEditingItem] = useState<OrderItem | null>(null);
  const [newPrice, setNewPrice] = useState('');

  useEffect(() => {
    const updateSettings = () => {
      const settings = settingsStorage.get();
      setAllowPriceModification(settings.allowPriceModification);
    };

    // Update settings on initial load
    updateSettings();

    // Listen for storage changes to update settings in real-time
    window.addEventListener('storage', updateSettings);

    // Cleanup listener on component unmount
    return () => {
      window.removeEventListener('storage', updateSettings);
    };
  }, []);

  // Mock function to add a product to the order
  const addProductToOrder = (product: Product) => {
    setCurrentOrder(prevOrder => {
      const existingItem = prevOrder.find(item => item.productId === product.id);
      if (existingItem) {
        // Increase quantity for an existing item
        return prevOrder.map(item =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1, total: item.price * (item.quantity + 1) }
            : item
        );
      } else {
        // Add a new item to the order
        const newItem: OrderItem = {
          productId: product.id,
          productName: product.name,
          quantity: 1,
          price: product.price,
          originalPrice: product.price,
          total: product.price,
          purchasePrice: product.purchasePrice,
        };
        return [...prevOrder, newItem];
      }
    });
  };

  const handleEditClick = (item: OrderItem) => {
    setEditingItem(item);
    setNewPrice(String(item.price));
  };

  const handleSavePrice = () => {
    if (!editingItem) return;

    const price = parseFloat(newPrice);
    if (isNaN(price) || price < 0) {
      alert('سعر غير صالح');
      return;
    }

    setCurrentOrder(prevOrder =>
      prevOrder.map(item =>
        item.productId === editingItem.productId
          ? {
              ...item,
              price: price,
              total: price * item.quantity,
              // originalPrice is already set when item is added
            }
          : item
      )
    );

    setEditingItem(null);
  };
  // Mock product list
  const mockProducts = productStorage.getAll().slice(0, 3);

  return (
    <div>
      <h2>واجهة الكاشير</h2>
      <div>
        <h3>المنتجات المتاحة (مثال)</h3>
        {mockProducts.map(p => (
          <Button key={p.id} onClick={() => addProductToOrder(p)} variant="outline" className="m-1">
            {p.name} - {p.price.toFixed(2)}
          </Button>
        ))}
      </div>

      <div className="mt-4">
        <h3>الفاتورة الحالية</h3>
        <ul>
          {currentOrder.map(item => (
            <li key={item.productId} className="flex items-center justify-between p-2 border-b">
              <span>{item.productName} (x{item.quantity})</span>
              <div className="flex items-center gap-2">
                <span>
                  {item.price.toFixed(2)}
                  {item.price !== item.originalPrice && <span className="text-xs text-muted-foreground line-through ml-1">{item.originalPrice?.toFixed(2)}</span>}
                </span>
                {allowPriceModification && (
                  <Button size="icon" variant="ghost" onClick={() => handleEditClick(item)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Edit Price Dialog */}
      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل سعر: {editingItem?.productName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Label htmlFor="new-price">السعر الجديد</Label>
            <Input
              id="new-price"
              type="number"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSavePrice()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button onClick={handleSavePrice}>حفظ</Button>
            <Button variant="outline" onClick={() => setEditingItem(null)}>إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CashierPage;