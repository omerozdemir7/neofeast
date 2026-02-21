export interface Address {
  id: string;
  title: string;
  fullAddress: string;
  isDefault?: boolean;
}

export interface UserType {
  _id: string;
  username: string;
  role: 'admin' | 'seller' | 'customer';
  restaurantId?: string;
  name: string;
  email?: string;
  phone?: string;
  expoPushTokens?: string[];
  addresses: Address[];
  favorites: string[];
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  description: string;
  imageUrl?: string;
}

export interface CartItem {
  item: MenuItem;
  restaurantId: string;
  restaurantName: string;
  quantity: number;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity?: number;
}

export interface Restaurant {
  _id: string;
  id: string;
  name: string;
  category: string;
  rating: number;
  deliveryTime: string;
  image: string;
  menu: MenuItem[];
  ownerId?: string;
}

export interface Promotion {
  id: string;
  title: string;
  code: string;
  imageUrl: string;
  type: 'percent' | 'amount';
  value: number;
  active: boolean;
  minOrderTotal?: number;
  maxDiscountAmount?: number;
  targetUserIds?: string[];
  startsAt?: number;
  endsAt?: number;
  createdAt?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'manual' | 'promotion' | 'order_status';
  targetType: 'all' | 'users';
  targetUserIds?: string[];
  relatedPromoCode?: string | null;
  relatedOrderId?: string | null;
  createdAt: number;
  createdBy?: string;
  readBy?: string[];
}

export interface Order {
  id: string;
  createdAt?: number;
  restaurantId: string;
  restaurantName: string;
  customerId: string;
  customerName?: string;
  customerPhone?: string;
  items: OrderItem[];
  total: number;
  discount?: number;
  finalTotal?: number;
  promoCode?: string | null;
  promoType?: 'percent' | 'amount' | null;
  promoValue?: number | null;
  address?: string;
  note?: string;
  status: string;
  date: string;
  paymentMethod: string;
}
