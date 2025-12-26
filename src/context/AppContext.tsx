import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { MenuItem, CartItem, Order, OrderItem, ShopSettings, Analytics, Shop, TableSession } from '@/types';
import { mockAnalytics } from '@/data/mockData';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

interface AppContextType {
  // Shop
  currentShop: Shop | null;
  setCurrentShop: React.Dispatch<React.SetStateAction<Shop | null>>;
  loadingShop: boolean;
  
  // Menu
  menuItems: MenuItem[];
  setMenuItems: React.Dispatch<React.SetStateAction<MenuItem[]>>;
  loadingMenu: boolean;
  addMenuItem: (item: Omit<MenuItem, 'id'>) => Promise<MenuItem | null>;
  updateMenuItem: (id: string, item: Partial<MenuItem>) => Promise<boolean>;
  deleteMenuItem: (id: string) => Promise<boolean>;
  
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
  
  // Table Session (for table locking)
  tableSession: TableSession | null;
  setTableSession: (session: TableSession | null) => void;
  clearTableSession: () => void;
  
  // Shop Settings (derived from currentShop for backward compatibility)
  shopSettings: ShopSettings;
  setShopSettings: React.Dispatch<React.SetStateAction<ShopSettings>>;
  updateShopSettings: (settings: Partial<Shop>) => Promise<boolean>;
  uploadShopLogo: (file: File) => Promise<string | null>;
  
  // Analytics
  analytics: Analytics;
  
  // Auth
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  isAuthenticated: boolean;
  authLoading: boolean;
  login: (email: string, password: string) => Promise<{ error: string | null; shopSlug?: string }>;
  signup: (email: string, password: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  
  // Shop loading by slug
  loadShopBySlug: (slug: string) => Promise<Shop | null>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const TABLE_SESSION_KEY = 'dkc_table_session';

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [currentShop, setCurrentShop] = useState<Shop | null>(null);
  const [loadingShop, setLoadingShop] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [analytics] = useState<Analytics>(mockAnalytics);
  
  // Table session for locking
  const [tableSession, setTableSessionState] = useState<TableSession | null>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(TABLE_SESSION_KEY);
      if (stored) {
        try {
          const session = JSON.parse(stored);
          // Session expires after 24 hours
          if (Date.now() - session.timestamp < 24 * 60 * 60 * 1000) {
            return session;
          }
          localStorage.removeItem(TABLE_SESSION_KEY);
        } catch {
          localStorage.removeItem(TABLE_SESSION_KEY);
        }
      }
    }
    return null;
  });
  
  // Shop settings (derived from currentShop or defaults)
  const [shopSettings, setShopSettings] = useState<ShopSettings>({
    shopName: 'Dai Ko Chiya',
    description: 'Experience the warmth of authentic Nepali tea culture',
    numberOfTables: 10,
    isOpen: true,
    soundAlerts: true,
    browserNotifications: false,
    shopUrl: '',
  });
  
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // Set table session with localStorage persistence
  const setTableSession = (session: TableSession | null) => {
    setTableSessionState(session);
    if (session) {
      localStorage.setItem(TABLE_SESSION_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(TABLE_SESSION_KEY);
    }
  };

  const clearTableSession = () => {
    setTableSessionState(null);
    localStorage.removeItem(TABLE_SESSION_KEY);
  };

  // Update shopSettings when currentShop changes
  useEffect(() => {
    if (currentShop) {
      setShopSettings({
        shopName: currentShop.name,
        description: currentShop.description || '',
        numberOfTables: currentShop.numberOfTables,
        isOpen: currentShop.isOpen,
        logoUrl: currentShop.logoUrl,
        soundAlerts: currentShop.soundAlerts,
        browserNotifications: currentShop.browserNotifications,
        shopUrl: `${window.location.origin}/shop/${currentShop.slug}/menu`,
      });
    }
  }, [currentShop]);

  // Initialize auth
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setAuthLoading(false);
        
        if (session?.user) {
          setTimeout(() => {
            checkAdminRole(session.user.id);
          }, 0);
        } else {
          setIsAdmin(false);
          setCurrentShop(null);
        }
      }
    );

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

  // Check if user is admin and load their shop
  const checkAdminRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role, shop_id')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();
      
      if (!error && data) {
        setIsAdmin(true);
        // Load the admin's shop
        if (data.shop_id) {
          const { data: shopData } = await supabase
            .from('shops')
            .select('*')
            .eq('id', data.shop_id)
            .single();
          
          if (shopData) {
            setCurrentShop({
              id: shopData.id,
              name: shopData.name,
              slug: shopData.slug,
              description: shopData.description || undefined,
              logoUrl: shopData.logo_url || undefined,
              numberOfTables: shopData.number_of_tables,
              isOpen: shopData.is_open,
              soundAlerts: shopData.sound_alerts,
              browserNotifications: shopData.browser_notifications,
              createdAt: new Date(shopData.created_at),
              updatedAt: new Date(shopData.updated_at),
            });
          }
        }
      } else {
        setIsAdmin(false);
      }
    } catch {
      setIsAdmin(false);
    }
  };

  // Load shop by slug (for customer menu)
  const loadShopBySlug = async (slug: string): Promise<Shop | null> => {
    setLoadingShop(true);
    try {
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .eq('slug', slug)
        .single();
      
      if (error || !data) {
        setLoadingShop(false);
        return null;
      }
      
      const shop: Shop = {
        id: data.id,
        name: data.name,
        slug: data.slug,
        description: data.description || undefined,
        logoUrl: data.logo_url || undefined,
        numberOfTables: data.number_of_tables,
        isOpen: data.is_open,
        soundAlerts: data.sound_alerts,
        browserNotifications: data.browser_notifications,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };
      
      setCurrentShop(shop);
      setLoadingShop(false);
      return shop;
    } catch {
      setLoadingShop(false);
      return null;
    }
  };

  // Fetch menu items for current shop
  useEffect(() => {
    const fetchMenuItems = async () => {
      if (!currentShop) {
        setLoadingMenu(false);
        return;
      }
      
      setLoadingMenu(true);
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('shop_id', currentShop.id)
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
          shopId: item.shop_id || undefined,
        })));
      }
      setLoadingMenu(false);
    };

    fetchMenuItems();

    // Set up real-time subscription for menu items
    if (currentShop) {
      const channel = supabase
        .channel('menu-items-realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'menu_items',
            filter: `shop_id=eq.${currentShop.id}`
          },
          () => {
            fetchMenuItems();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [currentShop]);

  // Fetch orders for current shop
  useEffect(() => {
    const fetchOrders = async () => {
      if (!currentShop) {
        setLoadingOrders(false);
        return;
      }
      
      setLoadingOrders(true);
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('shop_id', currentShop.id)
        .order('created_at', { ascending: false });
      
      if (!ordersError && ordersData) {
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
              shopId: order.shop_id || undefined,
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
    if (currentShop) {
      const channel = supabase
        .channel('orders-realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
            filter: `shop_id=eq.${currentShop.id}`
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
                shopId: newOrder.shop_id || undefined,
              };
              
              setOrders(prev => [order, ...prev.filter(o => o.id !== order.id)]);
              
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
    }
  }, [currentShop, shopSettings.soundAlerts, currentOrder?.id]);

  // Menu CRUD operations
  const addMenuItem = async (item: Omit<MenuItem, 'id'>): Promise<MenuItem | null> => {
    if (!currentShop) return null;
    
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .insert({
          name: item.name,
          description: item.description,
          price: item.price,
          category: item.category,
          image: item.image,
          discount: item.discount || 0,
          is_best_seller: item.isBestSeller || false,
          is_todays_special: item.isTodaysSpecial || false,
          is_available: item.isAvailable,
          shop_id: currentShop.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      const newItem: MenuItem = {
        id: data.id,
        name: data.name,
        price: Number(data.price),
        description: data.description || '',
        category: data.category as MenuItem['category'],
        image: data.image || undefined,
        isAvailable: data.is_available,
        isBestSeller: data.is_best_seller,
        isTodaysSpecial: data.is_todays_special,
        discount: data.discount || undefined,
        shopId: data.shop_id || undefined,
      };
      
      setMenuItems(prev => [newItem, ...prev]);
      return newItem;
    } catch (error) {
      console.error('Error adding menu item:', error);
      return null;
    }
  };

  const updateMenuItem = async (id: string, item: Partial<MenuItem>): Promise<boolean> => {
    try {
      const updateData: any = {};
      if (item.name !== undefined) updateData.name = item.name;
      if (item.description !== undefined) updateData.description = item.description;
      if (item.price !== undefined) updateData.price = item.price;
      if (item.category !== undefined) updateData.category = item.category;
      if (item.image !== undefined) updateData.image = item.image;
      if (item.discount !== undefined) updateData.discount = item.discount;
      if (item.isBestSeller !== undefined) updateData.is_best_seller = item.isBestSeller;
      if (item.isTodaysSpecial !== undefined) updateData.is_todays_special = item.isTodaysSpecial;
      if (item.isAvailable !== undefined) updateData.is_available = item.isAvailable;
      
      const { error } = await supabase
        .from('menu_items')
        .update(updateData)
        .eq('id', id);
      
      if (error) throw error;
      
      setMenuItems(prev => 
        prev.map(menuItem => 
          menuItem.id === id ? { ...menuItem, ...item } : menuItem
        )
      );
      return true;
    } catch (error) {
      console.error('Error updating menu item:', error);
      return false;
    }
  };

  const deleteMenuItem = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setMenuItems(prev => prev.filter(item => item.id !== id));
      return true;
    } catch (error) {
      console.error('Error deleting menu item:', error);
      return false;
    }
  };

  // Shop settings update
  const updateShopSettings = async (settings: Partial<Shop>): Promise<boolean> => {
    if (!currentShop) return false;
    
    try {
      const updateData: any = {};
      if (settings.name !== undefined) updateData.name = settings.name;
      if (settings.description !== undefined) updateData.description = settings.description;
      if (settings.numberOfTables !== undefined) updateData.number_of_tables = settings.numberOfTables;
      if (settings.isOpen !== undefined) updateData.is_open = settings.isOpen;
      if (settings.logoUrl !== undefined) updateData.logo_url = settings.logoUrl;
      if (settings.soundAlerts !== undefined) updateData.sound_alerts = settings.soundAlerts;
      if (settings.browserNotifications !== undefined) updateData.browser_notifications = settings.browserNotifications;
      
      const { error } = await supabase
        .from('shops')
        .update(updateData)
        .eq('id', currentShop.id);
      
      if (error) throw error;
      
      setCurrentShop(prev => prev ? { ...prev, ...settings } : null);
      return true;
    } catch (error) {
      console.error('Error updating shop settings:', error);
      return false;
    }
  };

  // Upload shop logo
  const uploadShopLogo = async (file: File): Promise<string | null> => {
    if (!currentShop) return null;
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${currentShop.id}/logo.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('shop-logos')
        .upload(fileName, file, { upsert: true });
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('shop-logos')
        .getPublicUrl(fileName);
      
      // Update shop with new logo URL
      await updateShopSettings({ logoUrl: publicUrl });
      
      return publicUrl;
    } catch (error) {
      console.error('Error uploading logo:', error);
      return null;
    }
  };

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
    if (cart.length === 0 || !currentShop) return null;
    
    const totalAmount = cart.reduce((sum, item) => {
      const price = item.discount 
        ? item.price * (1 - item.discount / 100) 
        : item.price;
      return sum + price * item.quantity;
    }, 0);

    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          table_number: tableNumber,
          total: totalAmount,
          status: 'pending',
          shop_id: currentShop.id,
        })
        .select()
        .single();

      if (orderError) throw orderError;

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
        shopId: currentShop.id,
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

  const login = async (email: string, password: string): Promise<{ error: string | null; shopSlug?: string }> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error: error.message };
    }

    if (data.user) {
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role, shop_id')
        .eq('user_id', data.user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (roleError || !roleData) {
        await supabase.auth.signOut();
        return { error: 'You do not have admin access.' };
      }

      setIsAdmin(true);
      
      // Load the admin's shop
      if (roleData.shop_id) {
        const { data: shopData } = await supabase
          .from('shops')
          .select('*')
          .eq('id', roleData.shop_id)
          .single();
        
        if (shopData) {
          setCurrentShop({
            id: shopData.id,
            name: shopData.name,
            slug: shopData.slug,
            description: shopData.description || undefined,
            logoUrl: shopData.logo_url || undefined,
            numberOfTables: shopData.number_of_tables,
            isOpen: shopData.is_open,
            soundAlerts: shopData.sound_alerts,
            browserNotifications: shopData.browser_notifications,
            createdAt: new Date(shopData.created_at),
            updatedAt: new Date(shopData.updated_at),
          });
          return { error: null, shopSlug: shopData.slug };
        }
      }
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
    setCurrentShop(null);
  };

  return (
    <AppContext.Provider value={{
      currentShop,
      setCurrentShop,
      loadingShop,
      menuItems,
      setMenuItems,
      loadingMenu,
      addMenuItem,
      updateMenuItem,
      deleteMenuItem,
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
      tableSession,
      setTableSession,
      clearTableSession,
      shopSettings,
      setShopSettings,
      updateShopSettings,
      uploadShopLogo,
      analytics,
      user,
      session,
      isAdmin,
      isAuthenticated: !!session,
      authLoading,
      login,
      signup,
      logout,
      loadShopBySlug,
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
