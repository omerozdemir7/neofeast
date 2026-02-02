import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { CreditCard, Banknote, Trash2 } from 'lucide-react-native';
import { CartItem, UserType, Restaurant } from '../../types';
import { API_URL } from '../../utils/constants';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { CustomerTheme } from './theme';

interface Props {
  user: UserType;
  cart: CartItem[];
  setCart: (items: CartItem[]) => void;
  restaurants: Restaurant[];
  refreshData: () => void;
  onNavigate: (tab: 'home' | 'search' | 'cart' | 'orders' | 'profile') => void;
  onNotify: (message: string, type?: 'success' | 'error' | 'info') => void;
  theme: CustomerTheme;
}

type Discount = { code: string; type: 'percent' | 'amount'; value: number } | null;

export default function CustomerCart({
  user,
  cart,
  setCart,
  restaurants,
  refreshData,
  onNavigate,
  onNotify,
  theme
}: Props) {
  const [paymentMethod, setPaymentMethod] = useState<'Nakit' | 'Kart'>('Nakit');
  const [orderNote, setOrderNote] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<Discount>(null);
  const notify = (message: string, type: 'success' | 'error' | 'info' = 'info') => onNotify(message, type);

  const subTotal = cart.reduce((a, b) => a + b.item.price * b.quantity, 0);
  let discountAmount = 0;
  if (appliedDiscount) {
    discountAmount =
      appliedDiscount.type === 'percent'
        ? (subTotal * appliedDiscount.value) / 100
        : appliedDiscount.value;
  }
  discountAmount = Math.min(discountAmount, subTotal);
  const finalTotal = subTotal - discountAmount;

  const applyPromoCode = async () => {
    if (!promoCode) {
      notify('Indirim kodu giriniz.', 'error');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/promos/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCode })
      });
      const data = await res.json();
      if (data.valid) {
        setAppliedDiscount({ code: promoCode, type: data.type, value: data.value });
        notify('Indirim kodu uygulandi.', 'success');
      } else {
        setAppliedDiscount(null);
        notify('Gecersiz indirim kodu.', 'error');
      }
    } catch {
      notify('Indirim kodu kontrol edilemedi.', 'error');
    }
  };

  const updateQuantity = (index: number, nextQty: number) => {
    if (nextQty <= 0) {
      setCart(cart.filter((_, i) => i !== index));
      return;
    }
    setCart(cart.map((c, i) => (i === index ? { ...c, quantity: nextQty } : c)));
  };

  const placeOrder = async () => {
    if (cart.length === 0) {
      notify('Sepet bos.', 'error');
      return;
    }

    const restaurantId = cart[0].restaurantId;
    const restaurantName = cart[0].restaurantName;
    const restaurant = restaurants.find((r) => r._id === restaurantId || r.id === restaurantId);
    const address =
      user.addresses?.find((a) => a.isDefault)?.fullAddress ||
      user.addresses?.[0]?.fullAddress ||
      'Adres belirtilmedi';

    const orderData = {
      restaurantId,
      restaurantName: restaurant?.name || restaurantName,
      customerId: user._id,
      customerName: user.name,
      customerPhone: user.phone || '',
      items: cart.map((c) => ({
        id: c.item.id,
        name: c.item.name,
        price: c.item.price,
        quantity: c.quantity
      })),
      total: subTotal,
      discount: discountAmount,
      finalTotal,
      address,
      note: orderNote,
      status: 'Beklemede',
      date: new Date().toLocaleString('tr-TR'),
      createdAt: Date.now(),
      paymentMethod: paymentMethod === 'Nakit' ? 'Kapida Nakit' : 'Kapida Kart'
    };

    try {
      await addDoc(collection(db, 'orders'), orderData);
      setCart([]);
      setOrderNote('');
      setPromoCode('');
      setAppliedDiscount(null);
      refreshData();
      onNavigate('orders');
      notify('Siparisiniz alindi.', 'success');
    } catch {
      notify('Siparis olusturulamadi.', 'error');
    }
  };

  const isCashActive = paymentMethod === 'Nakit';
  const isCardActive = paymentMethod === 'Kart';

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.textPrimary }]}>Sepetim</Text>

      <ScrollView>
        {cart.length === 0 && (
          <Text style={[styles.emptyText, { color: theme.textMuted }]}>Sepet bos.</Text>
        )}

        {cart.map((c, i) => (
          <View key={`${c.item.id}-${i}`} style={[styles.rowCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.itemInfo}>
              <Text style={[styles.itemName, { color: theme.textPrimary }]}>{c.item.name}</Text>
              <Text style={[styles.itemPrice, { color: theme.textMuted }]}>{c.item.price} TL</Text>
              <View style={styles.qtyRow}>
                <TouchableOpacity onPress={() => updateQuantity(i, c.quantity - 1)} style={[styles.qtyBtn, { backgroundColor: theme.inputBackground }]}>
                  <Text style={[styles.qtyBtnText, { color: theme.textPrimary }]}>-</Text>
                </TouchableOpacity>
                <Text style={[styles.qtyText, { color: theme.textPrimary }]}>{c.quantity}</Text>
                <TouchableOpacity onPress={() => updateQuantity(i, c.quantity + 1)} style={[styles.qtyBtn, { backgroundColor: theme.inputBackground }]}>
                  <Text style={[styles.qtyBtnText, { color: theme.textPrimary }]}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity onPress={() => updateQuantity(i, 0)}>
              <Trash2 color={theme.danger} size={20} />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {cart.length > 0 && (
        <View>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Odeme (Kapida)</Text>
          <View style={styles.payRow}>
            <TouchableOpacity
              onPress={() => setPaymentMethod('Nakit')}
              style={[
                styles.payBtn,
                { borderColor: theme.border, backgroundColor: isCashActive ? theme.accent : theme.surface }
              ]}
            >
              <Banknote color={isCashActive ? theme.accentContrast : theme.textPrimary} />
              <Text style={{ color: isCashActive ? theme.accentContrast : theme.textPrimary }}> Nakit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setPaymentMethod('Kart')}
              style={[
                styles.payBtn,
                { borderColor: theme.border, backgroundColor: isCardActive ? theme.accent : theme.surface }
              ]}
            >
              <CreditCard color={isCardActive ? theme.accentContrast : theme.textPrimary} />
              <Text style={{ color: isCardActive ? theme.accentContrast : theme.textPrimary }}> Kart</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Siparis Notu</Text>
          <TextInput
            placeholder="Siparis notu"
            placeholderTextColor={theme.textMuted}
            style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.textPrimary }]}
            value={orderNote}
            onChangeText={setOrderNote}
          />

          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Promosyon Kodu</Text>
          <View style={styles.promoRow}>
            <TextInput
              placeholder="Kod"
              placeholderTextColor={theme.textMuted}
              style={[styles.input, styles.promoInput, { backgroundColor: theme.inputBackground, color: theme.textPrimary }]}
              value={promoCode}
              onChangeText={setPromoCode}
            />
            <TouchableOpacity onPress={applyPromoCode} style={[styles.promoBtn, { backgroundColor: theme.accent }]}>
              <Text style={[styles.applyText, { color: theme.accentContrast }]}>Uygula</Text>
            </TouchableOpacity>
          </View>

          {appliedDiscount && (
            <Text style={{ color: theme.success, marginTop: 6 }}>
              Indirim uygulandi: {appliedDiscount.type === 'percent' ? `${appliedDiscount.value}%` : `${appliedDiscount.value} TL`}
            </Text>
          )}

          <View style={styles.totalRow}>
            <Text style={{ color: theme.textMuted }}>Ara Toplam</Text>
            <Text style={{ color: theme.textPrimary }}>{subTotal.toFixed(2)} TL</Text>
          </View>

          {discountAmount > 0 && (
            <View style={styles.totalRow}>
              <Text style={{ color: theme.success }}>Indirim</Text>
              <Text style={{ color: theme.success }}>- {discountAmount.toFixed(2)} TL</Text>
            </View>
          )}

          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: theme.textPrimary }]}>Toplam</Text>
            <Text style={[styles.totalLabel, { color: theme.textPrimary }]}>{finalTotal.toFixed(2)} TL</Text>
          </View>

          <TouchableOpacity onPress={placeOrder} style={[styles.primaryBtn, { backgroundColor: theme.accent }]}>
            <Text style={[styles.btnText, { color: theme.accentContrast }]}>Siparisi Onayla</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
  emptyText: { textAlign: 'center', marginTop: 20 },
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
  itemInfo: { flex: 1 },
  itemName: { fontWeight: 'bold' },
  itemPrice: { marginTop: 2 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  qtyBtn: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  qtyBtnText: { fontWeight: 'bold' },
  qtyText: { marginHorizontal: 10 },
  sectionTitle: { fontWeight: 'bold', marginTop: 10, marginBottom: 8 },
  payRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  payBtn: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center'
  },
  input: { padding: 12, borderRadius: 8, marginBottom: 10 },
  promoRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  promoInput: { flex: 1, marginBottom: 0 },
  promoBtn: { paddingHorizontal: 12, paddingVertical: 12, borderRadius: 8 },
  applyText: { fontWeight: 'bold' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  totalLabel: { fontWeight: 'bold' },
  primaryBtn: { padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 12 },
  btnText: { fontWeight: 'bold' }
});
