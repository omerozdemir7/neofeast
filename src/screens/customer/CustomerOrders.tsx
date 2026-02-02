import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Order, UserType } from '../../types';
import { CustomerTheme } from './theme';

interface Props {
  user: UserType;
  orders: Order[];
  theme: CustomerTheme;
}

export default function CustomerOrders({ user, orders, theme }: Props) {
  const myOrders = orders
    .filter((order) => order.customerId === user._id)
    .slice()
    .reverse();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={[styles.title, { color: theme.textPrimary }]}>Siparislerim</Text>

      {myOrders.length === 0 && (
        <Text style={[styles.emptyText, { color: theme.textMuted }]}>Henuz siparis yok.</Text>
      )}

      {myOrders.map((order) => (
        <View key={order.id} style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.cardRow}>
            <View>
              <Text style={[styles.restaurantName, { color: theme.textPrimary }]}>{order.restaurantName}</Text>
              <Text style={{ color: order.status === 'Teslim Edildi' ? theme.success : theme.warning }}>{order.status}</Text>
              <Text style={[styles.dateText, { color: theme.textMuted }]}>{order.date}</Text>
            </View>
            <Text style={[styles.totalText, { color: theme.textPrimary }]}>
              {(order.finalTotal ?? order.total).toFixed(2)} TL
            </Text>
          </View>

          {order.items?.length > 0 && (
            <View style={[styles.itemsBlock, { borderTopColor: theme.border }]}>
              {order.items.map((item, idx) => {
                const qty = item.quantity ?? 1;
                return (
                  <Text key={`${order.id}-${idx}`} style={[styles.itemText, { color: theme.textSecondary }]}>
                    {qty}x {item.name}
                  </Text>
                );
              })}
            </View>
          )}

          {order.note ? <Text style={[styles.noteText, { color: theme.textMuted }]}>Not: {order.note}</Text> : null}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
  emptyText: { textAlign: 'center', marginTop: 20 },
  card: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 12,
    elevation: 1,
    borderWidth: 1
  },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between' },
  restaurantName: { fontWeight: 'bold' },
  dateText: { fontSize: 10 },
  totalText: { fontWeight: 'bold' },
  itemsBlock: { marginTop: 8, borderTopWidth: 1, paddingTop: 8 },
  itemText: { fontSize: 12 },
  noteText: { marginTop: 6, fontSize: 12 }
});
