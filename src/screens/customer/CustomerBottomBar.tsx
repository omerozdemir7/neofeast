import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Home, Search, ShoppingCart, Receipt, User } from 'lucide-react-native';
import { CustomerTheme } from './theme';

type Tab = 'home' | 'search' | 'cart' | 'orders' | 'profile';

interface Props {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  cartCount: number;
  theme: CustomerTheme;
}

export default function CustomerBottomBar({ activeTab, onTabChange, cartCount, theme }: Props) {
  const tabs: { id: Tab; label: string; Icon: any }[] = [
    { id: 'home', label: 'Ana Sayfa', Icon: Home },
    { id: 'search', label: 'Ara', Icon: Search },
    { id: 'cart', label: 'Sepet', Icon: ShoppingCart },
    { id: 'orders', label: 'Siparis', Icon: Receipt },
    { id: 'profile', label: 'Profil', Icon: User }
  ];

  return (
    <View style={[styles.bottomBar, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
      {tabs.map(({ id, label, Icon }) => {
        const isActive = activeTab === id;
        return (
          <TouchableOpacity key={id} onPress={() => onTabChange(id)} style={styles.tabItem}>
            <View style={styles.iconWrap}>
              <Icon color={isActive ? theme.accent : theme.textMuted} />
              {id === 'cart' && cartCount > 0 && (
                <View style={[styles.badge, { backgroundColor: theme.danger }]}>
                  <Text style={[styles.badgeText, { color: theme.accentContrast }]}>{cartCount}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.tabText, { color: isActive ? theme.accent : theme.textMuted }]}>{label}</Text>
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
    borderTopWidth: 1
  },
  tabItem: { flex: 1, alignItems: 'center' },
  iconWrap: { position: 'relative' },
  tabText: { fontSize: 10, marginTop: 4 },
  badge: {
    position: 'absolute',
    top: -6,
    right: -10,
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center'
  },
  badgeText: { fontSize: 10, fontWeight: 'bold' }
});
