import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { MenuItem, CartItem, Order, OrderItem, ShopSettings, Analytics } from '@/types';
import { mockShopSettings, mockAnalytics } from '@/data/mockData';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

interface AppContextType {
  // Menu
  menuItems: MenuItem[];
  setMenuItems: React.Dispatch<React.SetStateAction<MenuItem[]>>;
  loadingMenu: boolean;
  
  // Cart
  cart: CartItem[];
  addToCart: (item: MenuItem) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  
  // Orders
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  createOrder: (tableNumber: number) => Promise<Order | null>;
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>;
  loadingOrders: boolean;
  
  // Current order tracking (customer side)
  currentOrder: Order | null;
  setCurrentOrder: React.Dispatch<React.SetStateAction<Order | null>>;
  
  // Shop Settings
  shopSettings: ShopSettings;
  setShopSettings: React.Dispatch<React.SetStateAction<ShopSettings>>;
  
  // Analytics
  analytics: Analytics;
  
  // Auth
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  isAuthenticated: boolean;
  authLoading: boolean;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  signup: (email: string, password: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [shopSettings, setShopSettings] = useState<ShopSettings>(mockShopSettings);
  const [analytics] = useState<Analytics>(mockAnalytics);
  
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // Initialize auth
  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setAuthLoading(false);
        
        // Check admin role after auth change
        if (session?.user) {
          setTimeout(() => {
            checkAdminRole(session.user.id);
          }, 0);
        } else {
          setIsAdmin(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setAuthLoading(false);
      
      if (session?.user) {
        checkAdminRole(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Check if user is admin
  const checkAdminRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();
      
      if (!error && data) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    } catch {
      setIsAdmin(false);
    }
  };

  // Fetch menu items
  useEffect(() => {
    const fetchMenuItems = async () => {
      setLoadingMenu(true);
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        setMenuItems(data.map(item => ({
          id: item.id,
          name: item.name,
          price: Number(item.price),
          description: item.description || '',
          category: item.category as MenuItem['category'],
          image: item.image || undefined,
          isAvailable: item.is_available,
          isBestSeller: item.is_best_seller,
          isTodaysSpecial: item.is_todays_special,
          discount: item.discount || undefined,
        })));
      }
      setLoadingMenu(false);
    };

    fetchMenuItems();
  }, []);

  // Fetch orders and set up real-time subscription
  useEffect(() => {
    const fetchOrders = async () => {
      setLoadingOrders(true);
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!ordersError && ordersData) {
        // Fetch order items for each order
        const ordersWithItems = await Promise.all(
          ordersData.map(async (order) => {
            const { data: items } = await supabase
              .from('order_items')
              .select('*')
              .eq('order_id', order.id);
            
            const orderItems: OrderItem[] = (items || []).map(item => ({
              id: item.id,
              name: item.name,
              price: Number(item.price),
              quantity: item.quantity,
            }));

            const orderObj: Order = {
              id: order.id,
              tableNumber: order.table_number,
              items: orderItems,
              status: order.status as Order['status'],
              totalAmount: Number(order.total),
              customerName: order.customer_name || undefined,
              notes: order.notes || undefined,
              createdAt: new Date(order.created_at),
              updatedAt: new Date(order.updated_at),
            };

            return orderObj;
          })
        );
        setOrders(ordersWithItems);
      }
      setLoadingOrders(false);
    };

    fetchOrders();

    // Set up real-time subscription for orders
    const channel = supabase
      .channel('orders-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        async (payload) => {
          console.log('Order change received:', payload);
          
          if (payload.eventType === 'INSERT') {
            const newOrder = payload.new as any;
            const { data: items } = await supabase
              .from('order_items')
              .select('*')
              .eq('order_id', newOrder.id);
            
            const orderItems: OrderItem[] = (items || []).map(item => ({
              id: item.id,
              name: item.name,
              price: Number(item.price),
              quantity: item.quantity,
            }));

            const order: Order = {
              id: newOrder.id,
              tableNumber: newOrder.table_number,
              items: orderItems,
              status: newOrder.status as Order['status'],
              totalAmount: Number(newOrder.total),
              customerName: newOrder.customer_name || undefined,
              notes: newOrder.notes || undefined,
              createdAt: new Date(newOrder.created_at),
              updatedAt: new Date(newOrder.updated_at),
            };
            
            setOrders(prev => [order, ...prev.filter(o => o.id !== order.id)]);
            
            // Play notification sound for new orders
            if (shopSettings.soundAlerts) {
              playNotificationSound();
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedOrder = payload.new as any;
            setOrders(prev => 
              prev.map(o => 
                o.id === updatedOrder.id 
                  ? { 
                      ...o, 
                      status: updatedOrder.status as Order['status'],
                      updatedAt: new Date(updatedOrder.updated_at) 
                    } 
                  : o
              )
            );
            
            // Update current order if it's the one being updated
            if (currentOrder?.id === updatedOrder.id) {
              setCurrentOrder(prev => 
                prev ? { 
                  ...prev, 
                  status: updatedOrder.status as Order['status'],
                  updatedAt: new Date(updatedOrder.updated_at) 
                } : null
              );
            }
          } else if (payload.eventType === 'DELETE') {
            const deletedOrder = payload.old as any;
            setOrders(prev => prev.filter(o => o.id !== deletedOrder.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [shopSettings.soundAlerts, currentOrder?.id]);

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

  const createOrder = async (tableNumber: number): Promise<Order | null> => {
    if (cart.length === 0) return null;
    
    const totalAmount = cart.reduce((sum, item) => {
      const price = item.discount 
        ? item.price * (1 - item.discount / 100) 
        : item.price;
      return sum + price * item.quantity;
    }, 0);

    try {
      // Insert order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          table_number: tableNumber,
          total: totalAmount,
          status: 'pending',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Insert order items
      const orderItems = cart.map(item => ({
        order_id: orderData.id,
        menu_item_id: item.id,
        name: item.name,
        price: item.discount ? item.price * (1 - item.discount / 100) : item.price,
        quantity: item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      const newOrderItems: OrderItem[] = cart.map(item => ({
        id: item.id,
        name: item.name,
        price: item.discount ? item.price * (1 - item.discount / 100) : item.price,
        quantity: item.quantity,
      }));

      const newOrder: Order = {
        id: orderData.id,
        tableNumber,
        items: newOrderItems,
        status: 'pending',
        totalAmount,
        createdAt: new Date(orderData.created_at),
        updatedAt: new Date(orderData.updated_at),
      };

      setCurrentOrder(newOrder);
      clearCart();
      
      return newOrder;
    } catch (error) {
      console.error('Error creating order:', error);
      return null;
    }
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    const dbStatus = status === 'started' ? 'preparing' : status;
    
    const { error } = await supabase
      .from('orders')
      .update({ status: dbStatus })
      .eq('id', orderId);

    if (error) {
      console.error('Error updating order status:', error);
    }
  };

  const login = async (email: string, password: string): Promise<{ error: string | null }> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error: error.message };
    }

    // Check if user is admin
    if (data.user) {
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (roleError || !roleData) {
        await supabase.auth.signOut();
        return { error: 'You do not have admin access.' };
      }

      setIsAdmin(true);
    }

    return { error: null };
  };

  const signup = async (email: string, password: string): Promise<{ error: string | null }> => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
  };

  return (
    <AppContext.Provider value={{
      menuItems,
      setMenuItems,
      loadingMenu,
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      orders,
      setOrders,
      createOrder,
      updateOrderStatus,
      loadingOrders,
      currentOrder,
      setCurrentOrder,
      shopSettings,
      setShopSettings,
      analytics,
      user,
      session,
      isAdmin,
      isAuthenticated: !!session,
      authLoading,
      login,
      signup,
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
