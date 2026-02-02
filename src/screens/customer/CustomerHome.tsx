import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { Search } from 'lucide-react-native';
import { Restaurant } from '../../types';

interface Props {
  restaurants: Restaurant[];
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSelectRestaurant: (restaurant: Restaurant) => void;
  title?: string;
  autoFocus?: boolean;
}

export default function CustomerHome({
  restaurants,
  searchQuery,
  onSearchChange,
  onSelectRestaurant,
  title = 'Restoranlar',
  autoFocus = false
}: Props) {
  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.searchRow}>
        <Search color="#9CA3AF" size={18} />
        <TextInput
          placeholder="Restoran veya kategori ara"
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={onSearchChange}
          autoFocus={autoFocus}
        />
      </View>

      {restaurants.length === 0 && (
        <Text style={styles.emptyText}>Restoran bulunamadi.</Text>
      )}

      {restaurants.map((r) => (
        <TouchableOpacity
          key={r._id || r.id}
          style={styles.card}
          onPress={() => onSelectRestaurant(r)}
        >
          <Image source={{ uri: r.image }} style={styles.cardImage} />
          <View style={{ padding: 12 }}>
            <Text style={styles.cardTitle}>{r.name}</Text>
            <Text style={styles.cardSub}>
              {r.category} • {r.rating} • {r.deliveryTime}
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
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 16
  },
  searchInput: { flex: 1, paddingVertical: 10, marginLeft: 8 },
  emptyText: { color: 'gray', textAlign: 'center', marginTop: 20 },
  card: {
    backgroundColor: 'white',
    marginVertical: 8,
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 2
  },
  cardImage: { width: '100%', height: 150 },
  cardTitle: { fontSize: 16, fontWeight: 'bold' },
  cardSub: { color: 'gray', marginTop: 2 }
});
