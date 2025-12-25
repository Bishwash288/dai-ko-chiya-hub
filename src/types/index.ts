// Types for the Dai Ko Chiya app

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
}

export interface CartItem extends MenuItem {
  quantity: number;
}

export interface Order {
  id: string;
  tableNumber: number;
  items: CartItem[];
  status: 'pending' | 'started' | 'ready' | 'cancelled';
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
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
