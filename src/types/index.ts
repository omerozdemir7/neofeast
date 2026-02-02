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
  address?: string;
  note?: string;
  status: string;
  date: string;
  paymentMethod: string;
}
