import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Order, UserType } from '../../types';

interface Props {
  user: UserType;
  orders: Order[];
}

export default function CustomerOrders({ user, orders }: Props) {
  const myOrders = orders
    .filter((o) => o.customerId === user._id)
    .slice()
    .reverse();

  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.title}>Siparislerim</Text>
      {myOrders.length === 0 && (
        <Text style={{ color: 'gray', textAlign: 'center', marginTop: 20 }}>Henuz siparis yok.</Text>
      )}
      {myOrders.map((o) => (
        <View key={o.id} style={styles.card}>
          <View style={styles.cardRow}>
            <View>
              <Text style={{ fontWeight: 'bold' }}>{o.restaurantName}</Text>
              <Text style={{ color: o.status === 'Teslim Edildi' ? 'green' : 'orange' }}>{o.status}</Text>
              <Text style={{ fontSize: 10, color: 'gray' }}>{o.date}</Text>
            </View>
            <Text style={{ fontWeight: 'bold' }}>
              {(o.finalTotal ?? o.total).toFixed(2)} TL
            </Text>
          </View>
          {o.items?.length > 0 && (
            <View style={styles.itemsBlock}>
              {o.items.map((it, idx) => {
                const qty = it.quantity ?? 1;
                return (
                  <Text key={`${o.id}-${idx}`} style={styles.itemText}>
                    {qty}x {it.name}
                  </Text>
                );
              })}
            </View>
          )}
          {o.note ? <Text style={styles.noteText}>Not: {o.note}</Text> : null}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
  card: { backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 12, elevation: 1 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between' },
  itemsBlock: { marginTop: 8, borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 8 },
  itemText: { color: '#4B5563', fontSize: 12 },
  noteText: { marginTop: 6, color: '#6B7280', fontSize: 12 }
});
