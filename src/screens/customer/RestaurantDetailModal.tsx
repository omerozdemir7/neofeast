import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, Modal, SafeAreaView, StyleSheet } from 'react-native';
import { Plus, X } from 'lucide-react-native';
import { Restaurant, MenuItem } from '../../types';
import { CustomerTheme } from './theme';

interface Props {
  visible: boolean;
  restaurant: Restaurant | null;
  onClose: () => void;
  onAddToCart: (item: MenuItem, restaurant: Restaurant) => void;
  theme: CustomerTheme;
}

export default function RestaurantDetailModal({ visible, restaurant, onClose, onAddToCart, theme }: Props) {
  if (!restaurant) return null;

  return (
    <Modal visible={visible} animationType="slide">
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} accessibilityRole="button" accessibilityLabel="Detay ekranini kapat">
            <X size={30} color={theme.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView>
          <Image source={{ uri: restaurant.image }} style={styles.heroImage} />
          <View style={styles.content}>
            <Text style={[styles.title, { color: theme.textPrimary }]}>{restaurant.name}</Text>
            <Text style={[styles.category, { color: theme.textMuted }]}>{restaurant.category}</Text>
            <Text style={[styles.menuTitle, { color: theme.textPrimary }]}>Menu</Text>

            {restaurant.menu.map((menuItem) => (
              <View key={menuItem.id} style={[styles.rowCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                {menuItem.imageUrl ? <Image source={{ uri: menuItem.imageUrl }} style={styles.menuThumb} /> : null}
                <View style={styles.menuInfo}>
                  <Text style={[styles.menuName, { color: theme.textPrimary }]}>{menuItem.name}</Text>
                  <Text style={[styles.menuDescription, { color: theme.textMuted }]}>{menuItem.description}</Text>
                  <Text style={[styles.menuPrice, { color: theme.accent }]}>{menuItem.price} TL</Text>
                </View>
                <TouchableOpacity onPress={() => onAddToCart(menuItem, restaurant)} style={[styles.addBtn, { backgroundColor: theme.accent }]}>
                  <Plus color={theme.accentContrast} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { alignItems: 'flex-end', padding: 10 },
  heroImage: { width: '100%', height: 200 },
  content: { padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold' },
  category: { marginBottom: 10 },
  menuTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  rowCard: {
    flexDirection: 'row',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 1,
    borderWidth: 1
  },
  menuInfo: { flex: 1 },
  menuThumb: { width: 56, height: 56, borderRadius: 8, marginRight: 10, backgroundColor: '#E5E7EB' },
  menuName: { fontWeight: 'bold' },
  menuDescription: { fontSize: 12 },
  menuPrice: { fontWeight: 'bold' },
  addBtn: { padding: 8, borderRadius: 20 }
});
