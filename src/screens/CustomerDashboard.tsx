import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Moon, Sun, User } from 'lucide-react-native';
import { Restaurant, Order, UserType, CartItem, MenuItem, Promotion } from '../types';
import CustomerHome from './customer/CustomerHome';
import CustomerCart from './customer/CustomerCart';
import CustomerOrders from './customer/CustomerOrders';
import CustomerProfile from './customer/CustomerProfile';
import RestaurantDetailModal from './customer/RestaurantDetailModal';
import CustomerBottomBar from './customer/CustomerBottomBar';
import { customerThemes, ThemeMode, themeStorageKey } from './customer/theme';

type Tab = 'home' | 'search' | 'cart' | 'orders' | 'profile';

const cartStorageKeyPrefix = 'customer_cart_v1';

const getCartStorageKey = (userId: string) => `${cartStorageKeyPrefix}:${userId}`;

const parseStoredCart = (raw: string | null): CartItem[] => {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const nextCart: CartItem[] = [];
    parsed.forEach((entry) => {
      if (!entry || typeof entry !== 'object') return;
      const record = entry as Record<string, unknown>;

      const restaurantId = typeof record.restaurantId === 'string' ? record.restaurantId : null;
      if (!restaurantId) return;

      const restaurantName = typeof record.restaurantName === 'string' ? record.restaurantName : '';

      const itemUnknown = record.item;
      if (!itemUnknown || typeof itemUnknown !== 'object') return;
      const itemRecord = itemUnknown as Record<string, unknown>;

      const id = typeof itemRecord.id === 'string' ? itemRecord.id : null;
      const name = typeof itemRecord.name === 'string' ? itemRecord.name : null;
      const description = typeof itemRecord.description === 'string' ? itemRecord.description : '';
      const priceValue = typeof itemRecord.price === 'number' ? itemRecord.price : Number(itemRecord.price);
      const price = Number.isFinite(priceValue) ? priceValue : null;
      if (!id || !name || price === null) return;

      const imageUrl = typeof itemRecord.imageUrl === 'string' ? itemRecord.imageUrl : undefined;

      const quantityValue = typeof record.quantity === 'number' ? record.quantity : Number(record.quantity);
      const quantity = Number.isFinite(quantityValue) ? Math.max(1, Math.floor(quantityValue)) : 1;

      nextCart.push({
        restaurantId,
        restaurantName,
        quantity,
        item: {
          id,
          name,
          description,
          price,
          imageUrl
        }
      });
    });

    return nextCart;
  } catch {
    return [];
  }
};

interface Props {
  user: UserType;
  restaurants: Restaurant[];
  orders: Order[];
  promotions: Promotion[];
  onLogout: () => void;
  refreshData: () => void;
  onUpdateUser: (user: UserType) => void;
  onNotify: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export default function CustomerDashboard({
  user,
  restaurants,
  orders,
  promotions,
  onLogout,
  refreshData,
  onUpdateUser,
  onNotify
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [restaurantModalVisible, setRestaurantModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');
  const notify = (message: string, type: 'success' | 'error' | 'info' = 'info') => onNotify(message, type);
  const theme = useMemo(() => customerThemes[themeMode], [themeMode]);
  const cartStorageKey = useMemo(() => getCartStorageKey(user._id), [user._id]);
  const cartHydratedRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    const loadThemePreference = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(themeStorageKey);
        if (mounted && (savedTheme === 'light' || savedTheme === 'dark')) {
          setThemeMode(savedTheme);
        }
      } catch {
        // Tema okunamazsa varsayilan tema kullanilir.
      }
    };

    loadThemePreference();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    cartHydratedRef.current = false;
    setCart([]);

    const loadCart = async () => {
      try {
        const stored = await AsyncStorage.getItem(cartStorageKey);
        const restored = parseStoredCart(stored);
        if (mounted) {
          setCart(restored);
        }
      } catch {
        if (mounted) {
          setCart([]);
        }
      } finally {
        if (mounted) {
          cartHydratedRef.current = true;
        }
      }
    };

    loadCart();
    return () => {
      mounted = false;
    };
  }, [cartStorageKey]);

  useEffect(() => {
    if (!cartHydratedRef.current) return;

    try {
      AsyncStorage.setItem(cartStorageKey, JSON.stringify(cart)).catch(() => {});
    } catch {
      // JSON parse/stringify beklenmedik sekilde hata verirse sepet kaydi atlanir.
    }
  }, [cart, cartStorageKey]);

  const filteredRestaurants = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return restaurants;
    return restaurants.filter((r) => {
      const name = r.name?.toLowerCase() || '';
      const category = r.category?.toLowerCase() || '';
      return name.includes(query) || category.includes(query);
    });
  }, [restaurants, searchQuery]);

  const activePromotions = useMemo(() => {
    const now = Date.now();
    return promotions.filter((promo) => {
      if (!promo.active) return false;
      if (promo.startsAt && now < promo.startsAt) return false;
      if (promo.endsAt && now > promo.endsAt) return false;
      if ((promo.targetUserIds?.length || 0) > 0 && !promo.targetUserIds?.includes(user._id)) return false;
      return true;
    });
  }, [promotions, user._id]);

  const handleSelectRestaurant = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setRestaurantModalVisible(true);
  };

  const handleAddToCart = (item: MenuItem, restaurant: Restaurant) => {
    const restaurantId = restaurant._id || restaurant.id;
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

  const toggleTheme = () => {
    const nextTheme: ThemeMode = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(nextTheme);
    AsyncStorage.setItem(themeStorageKey, nextTheme).catch(() => {});
    notify(nextTheme === 'dark' ? 'Karanlik mod acildi' : 'Aydinlik mod acildi', 'info');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.topBar, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <Text style={[styles.brand, { color: theme.textPrimary }]}>NEOFEAST</Text>
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={toggleTheme}
            style={[styles.iconButton, { backgroundColor: theme.inputBackground }]}
            accessibilityRole="button"
            accessibilityLabel={themeMode === 'light' ? 'Karanlik moda gec' : 'Aydinlik moda gec'}
          >
            {themeMode === 'light' ? <Moon color={theme.textPrimary} size={20} /> : <Sun color={theme.textPrimary} size={20} />}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('profile')}
            style={[styles.iconButton, styles.profileButton, { backgroundColor: theme.inputBackground }]}
            accessibilityRole="button"
            accessibilityLabel="Profil sekmesine git"
          >
            <User color={theme.textPrimary} size={20} />
          </TouchableOpacity>
        </View>
      </View>

      {activeTab === 'home' && (
        <CustomerHome
          title="Restaurants"
          restaurants={filteredRestaurants}
          promotions={activePromotions}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSelectRestaurant={handleSelectRestaurant}
          showCampaigns
          theme={theme}
        />
      )}
      {activeTab === 'search' && (
        <CustomerHome
          title="Ara"
          restaurants={filteredRestaurants}
          promotions={activePromotions}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSelectRestaurant={handleSelectRestaurant}
          autoFocus
          showCampaigns={false}
          theme={theme}
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
          theme={theme}
        />
      )}
      {activeTab === 'orders' && <CustomerOrders user={user} orders={orders} theme={theme} />}
      {activeTab === 'profile' && (
        <CustomerProfile
          user={user}
          onUpdateUser={onUpdateUser}
          onLogout={onLogout}
          onNavigate={(tab) => setActiveTab(tab)}
          onNotify={notify}
          theme={theme}
        />
      )}

      <CustomerBottomBar
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        cartCount={cart.reduce((acc, item) => acc + item.quantity, 0)}
        theme={theme}
      />

      <RestaurantDetailModal
        visible={restaurantModalVisible}
        restaurant={selectedRestaurant}
        onClose={() => setRestaurantModalVisible(false)}
        onAddToCart={handleAddToCart}
        theme={theme}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: Platform.OS === 'android' ? 30 : 0 },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 1
  },
  brand: { fontSize: 24, fontWeight: '900' },
  actions: { flexDirection: 'row', alignItems: 'center' },
  iconButton: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  profileButton: { marginLeft: 10 }
});
