import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import MenuCard from '@/components/customer/MenuCard';
import CartItemCard from '@/components/customer/CartItemCard';
import OrderStatusCard from '@/components/customer/OrderStatusCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { ShoppingCart, Coffee, Store, ChevronRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const CustomerMenu = () => {
  const [searchParams] = useSearchParams();
  const tableFromUrl = searchParams.get('table');
  
  const { 
    menuItems, 
    loadingMenu,
    cart, 
    createOrder, 
    currentOrder, 
    shopSettings,
  } = useApp();
  
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [tableNumber, setTableNumber] = useState(tableFromUrl || '');
  const [showOrderStatus, setShowOrderStatus] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Show order status when order is created
  useEffect(() => {
    if (currentOrder) {
      setShowOrderStatus(true);
    }
  }, [currentOrder]);

  const categories = [
    { id: 'all', label: 'All', icon: '🍽️' },
    { id: 'tea', label: 'Tea', icon: '🍵' },
    { id: 'snacks', label: 'Snacks', icon: '🥟' },
    { id: 'extra', label: 'Extra', icon: '✨' },
  ];

  const filteredItems = activeCategory === 'all' 
    ? menuItems.filter(item => item.isAvailable)
    : menuItems.filter(item => item.category === activeCategory && item.isAvailable);

  const cartTotal = cart.reduce((sum, item) => {
    const price = item.discount ? item.price * (1 - item.discount / 100) : item.price;
    return sum + price * item.quantity;
  }, 0);

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = async () => {
    if (!tableNumber || isNaN(parseInt(tableNumber))) {
      toast.error('Please enter a valid table number');
      return;
    }

    setIsSubmitting(true);
    const order = await createOrder(parseInt(tableNumber));
    setIsSubmitting(false);

    if (order) {
      setIsCheckoutOpen(false);
      setIsCartOpen(false);
      toast.success('Order placed successfully!');
    } else {
      toast.error('Failed to place order. Please try again.');
    }
  };

  if (!shopSettings.isOpen) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <Store className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">Shop is Closed</h1>
          <p className="text-muted-foreground">We are currently not accepting orders. Please check back later.</p>
        </div>
      </div>
    );
  }

  if (showOrderStatus && currentOrder) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="bg-card border-b border-border sticky top-0 z-40">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coffee className="w-6 h-6 text-primary" />
                <span className="font-display font-bold text-xl text-foreground">
                  {shopSettings.shopName}
                </span>
              </div>
              <Button 
                variant="outline" 
                onClick={() => setShowOrderStatus(false)}
              >
                Order More
              </Button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 max-w-md">
          <OrderStatusCard order={currentOrder} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coffee className="w-6 h-6 text-primary" />
              <span className="font-display font-bold text-xl text-foreground">
                {shopSettings.shopName}
              </span>
            </div>
            {tableFromUrl && (
              <Badge variant="secondary" className="font-medium">
                Table {tableFromUrl}
              </Badge>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-secondary to-background py-8 px-4">
        <div className="container mx-auto text-center">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
            Welcome to {shopSettings.shopName}
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            {shopSettings.description}
          </p>
        </div>
      </section>

      {/* Category Tabs */}
      <div className="sticky top-[73px] bg-background z-30 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex gap-2 py-3 overflow-x-auto scrollbar-thin">
            {categories.map(cat => (
              <Button
                key={cat.id}
                variant={activeCategory === cat.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveCategory(cat.id)}
                className={`flex-shrink-0 ${
                  activeCategory === cat.id 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-secondary'
                }`}
              >
                <span className="mr-1">{cat.icon}</span>
                {cat.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Grid */}
      <main className="container mx-auto px-4 py-6">
        {loadingMenu ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-32 w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredItems.map(item => (
              <MenuCard key={item.id} item={item} />
            ))}
          </div>
        )}

        {!loadingMenu && filteredItems.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No items available in this category</p>
          </div>
        )}
      </main>

      {/* Floating Cart Button */}
      {cartItemCount > 0 && (
        <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
          <SheetTrigger asChild>
            <Button 
              className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 shadow-warm-lg bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-6 rounded-full animate-bounce-gentle"
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              <span className="font-semibold">{cartItemCount} items</span>
              <span className="mx-2">•</span>
              <span className="font-bold">Rs. {Math.round(cartTotal)}</span>
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
            <SheetHeader className="pb-4">
              <SheetTitle className="font-display text-xl">Your Cart</SheetTitle>
            </SheetHeader>
            
            <div className="flex flex-col h-full">
              <div className="flex-1 overflow-y-auto space-y-3 pb-4">
                {cart.map(item => (
                  <CartItemCard key={item.id} item={item} />
                ))}
              </div>

              <div className="border-t border-border pt-4 pb-6">
                <div className="flex justify-between mb-4">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-bold text-foreground">Rs. {Math.round(cartTotal)}</span>
                </div>
                <Button 
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-6 text-lg font-semibold"
                  onClick={() => setIsCheckoutOpen(true)}
                >
                  Proceed to Checkout
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* Checkout Dialog */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Confirm Order</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="table">Table Number</Label>
              <Input
                id="table"
                type="number"
                placeholder="Enter your table number"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                className="mt-1.5"
                min={1}
                max={shopSettings.numberOfTables}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Tables 1-{shopSettings.numberOfTables} available
              </p>
            </div>

            <div className="bg-secondary/50 rounded-lg p-4">
              <div className="space-y-2 text-sm">
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between">
                    <span className="text-muted-foreground">{item.name} × {item.quantity}</span>
                    <span className="text-foreground">
                      Rs. {Math.round((item.discount ? item.price * (1 - item.discount / 100) : item.price) * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t border-border mt-3 pt-3 flex justify-between font-semibold">
                <span>Total</span>
                <span className="text-primary">Rs. {Math.round(cartTotal)}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCheckoutOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCheckout} 
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Placing Order...
                </>
              ) : (
                'Place Order'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerMenu;
