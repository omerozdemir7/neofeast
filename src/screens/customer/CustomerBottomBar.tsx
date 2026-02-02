import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Home, Search, ShoppingCart, Receipt, User } from 'lucide-react-native';

type Tab = 'home' | 'search' | 'cart' | 'orders' | 'profile';

interface Props {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  cartCount: number;
}

export default function CustomerBottomBar({ activeTab, onTabChange, cartCount }: Props) {
  const tabs: { id: Tab; label: string; Icon: any }[] = [
    { id: 'home', label: 'Ana Sayfa', Icon: Home },
    { id: 'search', label: 'Ara', Icon: Search },
    { id: 'cart', label: 'Sepet', Icon: ShoppingCart },
    { id: 'orders', label: 'Siparis', Icon: Receipt },
    { id: 'profile', label: 'Profil', Icon: User }
  ];

  return (
    <View style={styles.bottomBar}>
      {tabs.map(({ id, label, Icon }) => {
        const isActive = activeTab === id;
        return (
          <TouchableOpacity key={id} onPress={() => onTabChange(id)} style={styles.tabItem}>
            <View style={{ position: 'relative' }}>
              <Icon color={isActive ? '#EA580C' : 'gray'} />
              {id === 'cart' && cartCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{cartCount}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomBar: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderColor: '#eee'
  },
  tabItem: { flex: 1, alignItems: 'center' },
  tabText: { fontSize: 10, marginTop: 4, color: 'gray' },
  tabTextActive: { color: '#EA580C' },
  badge: {
    position: 'absolute',
    top: -6,
    right: -10,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center'
  },
  badgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' }
});
