import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Order, UserType } from '../../types';
import { db } from '../../firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';
import { CustomerTheme } from './theme';

interface Props {
  user: UserType;
  orders: Order[];
  theme: CustomerTheme;
  onNotify: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const CANCEL_WINDOW_MS = 60_000;

const formatRemaining = (remainingMs: number) => {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export default function CustomerOrders({ user, orders, theme, onNotify }: Props) {
  const [now, setNow] = useState(() => Date.now());
  const notify = (message: string, type: 'success' | 'error' | 'info' = 'info') => onNotify(message, type);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const cancelOrder = async (order: Order) => {
    const createdAt = typeof order.createdAt === 'number' ? order.createdAt : undefined;
    const remainingMs = createdAt ? createdAt + CANCEL_WINDOW_MS - Date.now() : 0;

    if (order.status !== 'Beklemede') {
      notify('Bu siparis artik iptal edilemez.', 'error');
      return;
    }

    if (!createdAt || remainingMs <= 0) {
      notify('Iptal suresi doldu.', 'error');
      return;
    }

    try {
      await updateDoc(doc(db, 'orders', order.id), { status: 'İptal', cancelledAt: Date.now() });
      notify('Siparis iptal edildi.', 'success');
    } catch (e: any) {
      notify(`Siparis iptal edilemedi: ${e?.message || 'Bilinmeyen hata'}`, 'error');
    }
  };

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

            {order.status === 'Beklemede' && typeof order.createdAt === 'number' && order.createdAt + CANCEL_WINDOW_MS > now ? (
              <View style={[styles.cancelRow, { borderTopColor: theme.border }]}>
                <Text style={[styles.cancelText, { color: theme.warning }]}>
                  Siparisinizi iptal etmek icin son {formatRemaining(order.createdAt + CANCEL_WINDOW_MS - now)}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    Alert.alert('Siparisi Iptal Et', 'Siparisi iptal etmek istiyor musunuz?', [
                      { text: 'Hayir', style: 'cancel' },
                      { text: 'Evet', style: 'destructive', onPress: () => cancelOrder(order) }
                    ]);
                  }}
                  style={[styles.cancelBtn, { backgroundColor: theme.danger }]}
                >
                  <Text style={styles.cancelBtnText}>Iptal Et</Text>
                </TouchableOpacity>
              </View>
            ) : null}

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
  cancelRow: {
    marginTop: 10,
    borderTopWidth: 1,
    paddingTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10
  },
  cancelText: { flex: 1, fontSize: 12, fontWeight: '600' },
  cancelBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10 },
  cancelBtnText: { color: 'white', fontWeight: '800', fontSize: 12 },
  itemsBlock: { marginTop: 8, borderTopWidth: 1, paddingTop: 8 },
  itemText: { fontSize: 12 },
  noteText: { marginTop: 6, fontSize: 12 }
});
