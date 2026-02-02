import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StyleSheet, Platform, Alert } from 'react-native';
import { User } from 'lucide-react-native';
import { Restaurant, Order, UserType, CartItem, MenuItem } from '../types';
import CustomerHome from './customer/CustomerHome';
import CustomerCart from './customer/CustomerCart';
import CustomerOrders from './customer/CustomerOrders';
import CustomerProfile from './customer/CustomerProfile';
import RestaurantDetailModal from './customer/RestaurantDetailModal';
import CustomerBottomBar from './customer/CustomerBottomBar';

type Tab = 'home' | 'search' | 'cart' | 'orders' | 'profile';

interface Props {
  user: UserType;
  restaurants: Restaurant[];
  orders: Order[];
  onLogout: () => void;
  refreshData: () => void;
  onUpdateUser: (user: UserType) => void;
  onNotify: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export default function CustomerDashboard({ user, restaurants, orders, onLogout, refreshData, onUpdateUser, onNotify }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [restaurantModalVisible, setRestaurantModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const notify = (message: string, type: 'success' | 'error' | 'info' = 'info') => onNotify(message, type);

  const filteredRestaurants = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return restaurants;
    return restaurants.filter((r) => {
      const name = r.name?.toLowerCase() || '';
      const category = r.category?.toLowerCase() || '';
      return name.includes(query) || category.includes(query);
    });
  }, [restaurants, searchQuery]);

  const handleSelectRestaurant = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setRestaurantModalVisible(true);
  };

  const handleAddToCart = (item: MenuItem, restaurant: Restaurant) => {
    const restaurantId = restaurant.id || restaurant._id;
    const restaurantName = restaurant.name;

    setCart((prev) => {
      if (prev.length > 0 && prev[0].restaurantId !== restaurantId) {
        Alert.alert(
          'Sepet',
          'Farkli bir restorandan urun ekliyorsun. Sepet temizlensin mi?',
          [
            { text: 'Iptal', style: 'cancel' },
            {
              text: 'Temizle',
              onPress: () => {
                setCart([{ item, restaurantId, restaurantName, quantity: 1 }]);
                notify('Sepete eklendi', 'success');
              }
            }
          ]
        );
        return prev;
      }

      const existing = prev.find((c) => c.item.id === item.id);
      if (existing) {
        notify('Sepette urun sayisi artirildi', 'success');
        return prev.map((c) => (c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
      }
      notify('Sepete eklendi', 'success');
      return [...prev, { item, restaurantId, restaurantName, quantity: 1 }];
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.brand}>NEOFEAST</Text>
        <TouchableOpacity onPress={() => setActiveTab('profile')}>
          <User color="#333" />
        </TouchableOpacity>
      </View>

      {activeTab === 'home' && (
        <CustomerHome
          title="Restaurants"
          restaurants={filteredRestaurants}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSelectRestaurant={handleSelectRestaurant}
        />
      )}
      {activeTab === 'search' && (
        <CustomerHome
          title="Ara"
          restaurants={filteredRestaurants}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSelectRestaurant={handleSelectRestaurant}
          autoFocus
        />
      )}
      {activeTab === 'cart' && (
        <CustomerCart
          user={user}
          cart={cart}
          setCart={setCart}
          restaurants={restaurants}
          refreshData={refreshData}
          onNavigate={(tab) => setActiveTab(tab)}
          onNotify={notify}
        />
      )}
      {activeTab === 'orders' && <CustomerOrders user={user} orders={orders} />}
      {activeTab === 'profile' && (
        <CustomerProfile
          user={user}
          onUpdateUser={onUpdateUser}
          onLogout={onLogout}
          onNavigate={(tab) => setActiveTab(tab)}
          onNotify={notify}
        />
      )}

      <CustomerBottomBar
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        cartCount={cart.reduce((acc, item) => acc + item.quantity, 0)}
      />

      <RestaurantDetailModal
        visible={restaurantModalVisible}
        restaurant={selectedRestaurant}
        onClose={() => setRestaurantModalVisible(false)}
        onAddToCart={handleAddToCart}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', paddingTop: Platform.OS === 'android' ? 30 : 0 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, backgroundColor: 'white', alignItems: 'center' },
  brand: { fontSize: 24, fontWeight: '900', color: '#1F2937' }
});
