import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { MenuItem, CartItem, Order, ShopSettings, Analytics } from '@/types';
import { mockMenuItems, mockOrders, mockShopSettings, mockAnalytics } from '@/data/mockData';

interface AppContextType {
  // Menu
  menuItems: MenuItem[];
  setMenuItems: React.Dispatch<React.SetStateAction<MenuItem[]>>;
  
  // Cart
  cart: CartItem[];
  addToCart: (item: MenuItem) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  
  // Orders
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  createOrder: (tableNumber: number) => Order | null;
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
  
  // Current order tracking (customer side)
  currentOrder: Order | null;
  setCurrentOrder: React.Dispatch<React.SetStateAction<Order | null>>;
  
  // Shop Settings
  shopSettings: ShopSettings;
  setShopSettings: React.Dispatch<React.SetStateAction<ShopSettings>>;
  
  // Analytics
  analytics: Analytics;
  
  // Auth
  isAuthenticated: boolean;
  login: (email: string, password: string) => boolean;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>(mockMenuItems);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [shopSettings, setShopSettings] = useState<ShopSettings>(mockShopSettings);
  const [analytics] = useState<Analytics>(mockAnalytics);
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('dkc_auth') === 'true';
  });

  // Persist auth state
  useEffect(() => {
    localStorage.setItem('dkc_auth', isAuthenticated.toString());
  }, [isAuthenticated]);

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => 
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(i => i.id !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart(prev => 
      prev.map(i => i.id === itemId ? { ...i, quantity } : i)
    );
  };

  const clearCart = () => setCart([]);

  const createOrder = (tableNumber: number): Order | null => {
    if (cart.length === 0) return null;
    
    const totalAmount = cart.reduce((sum, item) => {
      const price = item.discount 
        ? item.price * (1 - item.discount / 100) 
        : item.price;
      return sum + price * item.quantity;
    }, 0);

    const newOrder: Order = {
      id: `ORD${String(orders.length + 1).padStart(3, '0')}`,
      tableNumber,
      items: [...cart],
      status: 'pending',
      totalAmount,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setOrders(prev => [newOrder, ...prev]);
    setCurrentOrder(newOrder);
    clearCart();
    
    // Play sound if enabled
    if (shopSettings.soundAlerts) {
      playNotificationSound();
    }
    
    return newOrder;
  };

  const updateOrderStatus = (orderId: string, status: Order['status']) => {
    setOrders(prev => 
      prev.map(o => 
        o.id === orderId 
          ? { ...o, status, updatedAt: new Date() } 
          : o
      )
    );
    
    // Update current order if it's the one being updated
    if (currentOrder?.id === orderId) {
      setCurrentOrder(prev => prev ? { ...prev, status, updatedAt: new Date() } : null);
    }
  };

  const login = (email: string, password: string): boolean => {
    // Simple mock auth - in production, use proper auth
    if (email === 'admin@daikochiya.com' && password === 'admin123') {
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('dkc_auth');
  };

  return (
    <AppContext.Provider value={{
      menuItems,
      setMenuItems,
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      orders,
      setOrders,
      createOrder,
      updateOrderStatus,
      currentOrder,
      setCurrentOrder,
      shopSettings,
      setShopSettings,
      analytics,
      isAuthenticated,
      login,
      logout,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

// Utility function to play notification sound
const playNotificationSound = () => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.value = 800;
  oscillator.type = 'sine';
  
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.5);
};
