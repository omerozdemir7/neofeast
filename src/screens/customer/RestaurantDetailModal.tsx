import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, Modal, SafeAreaView, StyleSheet } from 'react-native';
import { Plus, X } from 'lucide-react-native';
import { Restaurant, MenuItem } from '../../types';

interface Props {
  visible: boolean;
  restaurant: Restaurant | null;
  onClose: () => void;
  onAddToCart: (item: MenuItem, restaurant: Restaurant) => void;
}

export default function RestaurantDetailModal({ visible, restaurant, onClose, onAddToCart }: Props) {
  if (!restaurant) return null;

  return (
    <Modal visible={visible} animationType="slide">
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ alignItems: 'flex-end', padding: 10 }}>
          <TouchableOpacity onPress={onClose}>
            <X size={30} />
          </TouchableOpacity>
        </View>
        <ScrollView>
          <Image source={{ uri: restaurant.image }} style={{ width: '100%', height: 200 }} />
          <View style={{ padding: 20 }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold' }}>{restaurant.name}</Text>
            <Text style={{ color: 'gray', marginBottom: 10 }}>{restaurant.category}</Text>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>Menu</Text>
            {restaurant.menu.map((m) => (
              <View key={m.id} style={styles.rowCard}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: 'bold' }}>{m.name}</Text>
                  <Text style={{ fontSize: 12, color: 'gray' }}>{m.description}</Text>
                  <Text style={{ color: '#EA580C', fontWeight: 'bold' }}>{m.price} TL</Text>
                </View>
                <TouchableOpacity onPress={() => onAddToCart(m, restaurant)} style={styles.addBtn}>
                  <Plus color="white" />
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
  rowCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 1
  },
  addBtn: { backgroundColor: '#EA580C', padding: 8, borderRadius: 20 }
});
