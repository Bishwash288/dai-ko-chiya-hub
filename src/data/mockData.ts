import { MenuItem, Order, ShopSettings, Analytics } from '@/types';

// Mock Menu Items
export const mockMenuItems: MenuItem[] = [
  {
    id: '1',
    name: 'Masala Tea',
    description: 'Traditional spiced tea with ginger, cardamom, and cloves',
    price: 40,
    category: 'tea',
    isBestSeller: true,
    isAvailable: true,
  },
  {
    id: '2',
    name: 'Black Tea',
    description: 'Strong Nepali black tea served hot',
    price: 25,
    category: 'tea',
    isAvailable: true,
  },
  {
    id: '3',
    name: 'Milk Tea',
    description: 'Creamy tea with fresh milk',
    price: 35,
    category: 'tea',
    isTodaysSpecial: true,
    isAvailable: true,
  },
  {
    id: '4',
    name: 'Green Tea',
    description: 'Refreshing green tea from the hills',
    price: 45,
    category: 'tea',
    isAvailable: true,
  },
  {
    id: '5',
    name: 'Samosa',
    description: 'Crispy pastry filled with spiced potatoes',
    price: 30,
    category: 'snacks',
    isBestSeller: true,
    isAvailable: true,
  },
  {
    id: '6',
    name: 'Pakoda',
    description: 'Deep fried vegetable fritters',
    price: 50,
    category: 'snacks',
    isAvailable: true,
  },
  {
    id: '7',
    name: 'Bread Butter',
    description: 'Toasted bread with butter',
    price: 35,
    category: 'snacks',
    isAvailable: true,
  },
  {
    id: '8',
    name: 'Cookies',
    description: 'Assorted homemade cookies',
    price: 20,
    category: 'snacks',
    isTodaysSpecial: true,
    isAvailable: true,
  },
  {
    id: '9',
    name: 'Extra Sugar',
    description: 'Additional sugar packet',
    price: 5,
    category: 'extra',
    isAvailable: true,
  },
  {
    id: '10',
    name: 'Extra Milk',
    description: 'Extra portion of milk',
    price: 10,
    category: 'extra',
    isAvailable: true,
  },
];

// Mock Orders
export const mockOrders: Order[] = [
  {
    id: 'ORD001',
    tableNumber: 3,
    items: [
      { ...mockMenuItems[0], quantity: 2 },
      { ...mockMenuItems[4], quantity: 1 },
    ],
    status: 'pending',
    totalAmount: 110,
    createdAt: new Date(Date.now() - 5 * 60 * 1000),
    updatedAt: new Date(Date.now() - 5 * 60 * 1000),
  },
  {
    id: 'ORD002',
    tableNumber: 7,
    items: [
      { ...mockMenuItems[2], quantity: 3 },
      { ...mockMenuItems[5], quantity: 2 },
    ],
    status: 'started',
    totalAmount: 205,
    createdAt: new Date(Date.now() - 15 * 60 * 1000),
    updatedAt: new Date(Date.now() - 10 * 60 * 1000),
  },
  {
    id: 'ORD003',
    tableNumber: 1,
    items: [
      { ...mockMenuItems[1], quantity: 4 },
      { ...mockMenuItems[6], quantity: 2 },
    ],
    status: 'ready',
    totalAmount: 170,
    createdAt: new Date(Date.now() - 25 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 60 * 1000),
  },
];

// Mock Shop Settings
export const mockShopSettings: ShopSettings = {
  shopName: 'Dai Ko Chiya',
  description: 'Authentic Nepali tea and snacks served with love',
  numberOfTables: 15,
  isOpen: true,
  shopUrl: '/menu',
  soundAlerts: true,
  browserNotifications: false,
};

// Mock Analytics
export const mockAnalytics: Analytics = {
  totalRevenue: 45680,
  totalOrders: 342,
  pendingOrders: 8,
  averageOrderValue: 134,
  topSellingItems: [
    { name: 'Masala Tea', count: 156 },
    { name: 'Samosa', count: 98 },
    { name: 'Milk Tea', count: 87 },
    { name: 'Pakoda', count: 65 },
    { name: 'Black Tea', count: 54 },
  ],
  ordersByStatus: [
    { status: 'Completed', count: 320 },
    { status: 'Pending', count: 8 },
    { status: 'Started', count: 10 },
    { status: 'Cancelled', count: 4 },
  ],
  peakHours: [
    { hour: '8 AM', revenue: 2500 },
    { hour: '9 AM', revenue: 4200 },
    { hour: '10 AM', revenue: 3800 },
    { hour: '11 AM', revenue: 2900 },
    { hour: '12 PM', revenue: 3500 },
    { hour: '1 PM', revenue: 4800 },
    { hour: '2 PM', revenue: 3200 },
    { hour: '3 PM', revenue: 2800 },
    { hour: '4 PM', revenue: 5200 },
    { hour: '5 PM', revenue: 6100 },
    { hour: '6 PM', revenue: 4500 },
    { hour: '7 PM', revenue: 3200 },
  ],
  dailyRevenue: [
    { day: 'Mon', revenue: 6200 },
    { day: 'Tue', revenue: 5800 },
    { day: 'Wed', revenue: 7100 },
    { day: 'Thu', revenue: 6500 },
    { day: 'Fri', revenue: 8200 },
    { day: 'Sat', revenue: 9500 },
    { day: 'Sun', revenue: 8100 },
  ],
};
