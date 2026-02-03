import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { Search } from 'lucide-react-native';
import { Promotion, Restaurant } from '../../types';
import { CustomerTheme } from './theme';

interface Props {
  restaurants: Restaurant[];
  promotions: Promotion[];
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSelectRestaurant: (restaurant: Restaurant) => void;
  title?: string;
  autoFocus?: boolean;
  showCampaigns?: boolean;
  theme: CustomerTheme;
}

export default function CustomerHome({
  restaurants,
  promotions,
  searchQuery,
  onSearchChange,
  onSelectRestaurant,
  title = 'Restoranlar',
  autoFocus = false,
  showCampaigns = true,
  theme
}: Props) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
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

      {showCampaigns && promotions.length > 0 && (
        <View style={styles.campaignSection}>
          <Text style={[styles.campaignTitle, { color: theme.textPrimary }]}>Kampanyalar</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {promotions.map((promo) => (
              <View key={promo.id} style={[styles.campaignCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Image source={{ uri: promo.imageUrl }} style={styles.campaignImage} />
                <View style={styles.campaignOverlay}>
                  <Text style={styles.campaignName} numberOfLines={1}>
                    {promo.title}
                  </Text>
                  <Text style={styles.campaignDiscount}>
                    {promo.type === 'percent' ? `%${promo.value} indirim` : `${promo.value} TL indirim`}
                  </Text>
                  <View style={styles.codeBadge}>
                    <Text style={styles.codeBadgeText}>Kod: {promo.code}</Text>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

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
  container: { padding: 20, paddingBottom: 24 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 16
  },
  searchInput: { flex: 1, paddingVertical: 10, marginLeft: 8 },
  campaignSection: { marginBottom: 8 },
  campaignTitle: { fontWeight: 'bold', fontSize: 16, marginBottom: 10 },
  campaignCard: {
    width: 250,
    height: 130,
    marginRight: 12,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1
  },
  campaignImage: { width: '100%', height: '100%' },
  campaignOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 10,
    backgroundColor: 'rgba(15,23,42,0.65)'
  },
  campaignName: { color: 'white', fontSize: 14, fontWeight: '700' },
  campaignDiscount: { color: '#FDBA74', fontWeight: '600', marginTop: 2 },
  codeBadge: {
    marginTop: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#EA580C',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  codeBadgeText: { color: 'white', fontSize: 12, fontWeight: '700' },
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
