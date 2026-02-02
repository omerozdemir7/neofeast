import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { Search } from 'lucide-react-native';
import { Restaurant } from '../../types';
import { CustomerTheme } from './theme';

interface Props {
  restaurants: Restaurant[];
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSelectRestaurant: (restaurant: Restaurant) => void;
  title?: string;
  autoFocus?: boolean;
  theme: CustomerTheme;
}

export default function CustomerHome({
  restaurants,
  searchQuery,
  onSearchChange,
  onSelectRestaurant,
  title = 'Restoranlar',
  autoFocus = false,
  theme
}: Props) {
  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>

      <View style={[styles.searchRow, { backgroundColor: theme.inputBackground }]}>
        <Search color={theme.textMuted} size={18} />
        <TextInput
          placeholder="Restoran veya kategori ara"
          placeholderTextColor={theme.textMuted}
          style={[styles.searchInput, { color: theme.textPrimary }]}
          value={searchQuery}
          onChangeText={onSearchChange}
          autoFocus={autoFocus}
        />
      </View>

      {restaurants.length === 0 && (
        <Text style={[styles.emptyText, { color: theme.textMuted }]}>Restoran bulunamadi.</Text>
      )}

      {restaurants.map((restaurant) => (
        <TouchableOpacity
          key={restaurant._id || restaurant.id}
          style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
          onPress={() => onSelectRestaurant(restaurant)}
        >
          <Image source={{ uri: restaurant.image }} style={styles.cardImage} />
          <View style={styles.cardBody}>
            <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>{restaurant.name}</Text>
            <Text style={[styles.cardSub, { color: theme.textSecondary }]}>
              {restaurant.category} - {restaurant.rating} - {restaurant.deliveryTime}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 16
  },
  searchInput: { flex: 1, paddingVertical: 10, marginLeft: 8 },
  emptyText: { textAlign: 'center', marginTop: 20 },
  card: {
    marginVertical: 8,
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 2,
    borderWidth: 1
  },
  cardImage: { width: '100%', height: 150 },
  cardBody: { padding: 12 },
  cardTitle: { fontSize: 16, fontWeight: 'bold' },
  cardSub: { marginTop: 2 }
});
