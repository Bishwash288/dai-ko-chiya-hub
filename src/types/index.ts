// Types for the Dai Ko Chiya app

export interface Shop {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  numberOfTables: number;
  isOpen: boolean;
  soundAlerts: boolean;
  browserNotifications: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'tea' | 'snacks' | 'extra';
  image?: string;
  discount?: number;
  isBestSeller?: boolean;
  isTodaysSpecial?: boolean;
  isAvailable: boolean;
  shopId?: string;
}

export interface CartItem extends MenuItem {
  quantity: number;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  tableNumber: number;
  items: OrderItem[];
  status: 'pending' | 'started' | 'ready' | 'cancelled' | 'preparing';
  totalAmount: number;
  customerName?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  shopId?: string;
}

export interface ShopSettings {
  shopName: string;
  description: string;
  numberOfTables: number;
  isOpen: boolean;
  logoUrl?: string;
  shopUrl: string;
  soundAlerts: boolean;
  browserNotifications: boolean;
}

export interface Analytics {
  totalRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  averageOrderValue: number;
  topSellingItems: { name: string; count: number }[];
  ordersByStatus: { status: string; count: number }[];
  peakHours: { hour: string; revenue: number }[];
  dailyRevenue: { day: string; revenue: number }[];
}

export interface TableSession {
  tableNumber: number;
  shopId: string;
  shopSlug: string;
  timestamp: number;
}
