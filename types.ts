export type UserRole = 'admin' | 'seller' | 'customer';

export interface Address {
  id: string;
  title: string; // Ev, İş vb.
  fullAddress: string;
  isDefault: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string; // New field
  avatarUrl?: string;
  role: UserRole;
  managedRestaurantId?: string; 
  addresses: Address[]; // New field
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
}

export interface Restaurant {
  id: string;
  ownerId?: string;
  name: string;
  description: string;
  rating: number;
  deliveryTimeRange: string;
  minDeliveryTime: number;
  maxDeliveryTime: number;
  imageUrl: string;
  address: string;
  phone: string;
  category: string;
  menu: MenuItem[];
}

export interface CartItem {
  menuItem: MenuItem;
  restaurantId: string;
  quantity: number;
}

export interface Order {
  id: string;
  customerId: string;
  restaurantId: string;
  restaurantName: string;
  date: string;
  status: 'Beklemede' | 'Hazırlanıyor' | 'Yolda' | 'Teslim Edildi' | 'Reddedildi';
  items: { name: string; quantity: number; price: number }[];
  total: number;
  discount: number;
  finalTotal: number;
  address: string;
  customerName?: string;
  note?: string;
}

export interface Campaign {
  id: string;
  title: string;
  subtitle: string;
  code?: string;
  imageUrl: string;
}
