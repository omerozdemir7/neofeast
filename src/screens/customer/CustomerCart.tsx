import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { CreditCard, Banknote, Trash2 } from 'lucide-react-native';
import { CartItem, UserType, Restaurant } from '../../types';
import { API_URL } from '../../utils/constants';

interface Props {
  user: UserType;
  cart: CartItem[];
  setCart: (items: CartItem[]) => void;
  restaurants: Restaurant[];
  refreshData: () => void;
  onNavigate: (tab: 'home' | 'search' | 'cart' | 'orders' | 'profile') => void;
  onNotify: (message: string, type?: 'success' | 'error' | 'info') => void;
}

type Discount = { code: string; type: 'percent' | 'amount'; value: number } | null;

export default function CustomerCart({ user, cart, setCart, restaurants, refreshData, onNavigate, onNotify }: Props) {
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
    } catch (e) {
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
      id: `o${Date.now()}`,
      restaurantId,
      restaurantName: restaurant?.name || restaurantName,
      customerId: user._id,
      customerName: user.name,
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
      date: new Date().toLocaleString(),
      paymentMethod: paymentMethod === 'Nakit' ? 'Kapida Nakit' : 'Kapida Kart'
    };

    try {
      await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      setCart([]);
      setOrderNote('');
      setPromoCode('');
      setAppliedDiscount(null);
      refreshData();
      onNavigate('orders');
      notify('Siparisiniz alindi.', 'success');
    } catch (e) {
      notify('Siparis olusturulamadi.', 'error');
    }
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={styles.title}>Sepetim</Text>
      <ScrollView>
        {cart.length === 0 && (
          <Text style={{ textAlign: 'center', color: 'gray', marginTop: 20 }}>Sepet bos.</Text>
        )}
        {cart.map((c, i) => (
          <View key={`${c.item.id}-${i}`} style={styles.rowCard}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: 'bold' }}>{c.item.name}</Text>
              <Text style={{ color: 'gray' }}>{c.item.price} TL</Text>
              <View style={styles.qtyRow}>
                <TouchableOpacity onPress={() => updateQuantity(i, c.quantity - 1)} style={styles.qtyBtn}>
                  <Text style={styles.qtyBtnText}>-</Text>
                </TouchableOpacity>
                <Text style={{ marginHorizontal: 10 }}>{c.quantity}</Text>
                <TouchableOpacity onPress={() => updateQuantity(i, c.quantity + 1)} style={styles.qtyBtn}>
                  <Text style={styles.qtyBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity onPress={() => updateQuantity(i, 0)}>
              <Trash2 color="red" size={20} />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {cart.length > 0 && (
        <View>
          <Text style={styles.sectionTitle}>Odeme (Kapida)</Text>
          <View style={styles.payRow}>
            <TouchableOpacity
              onPress={() => setPaymentMethod('Nakit')}
              style={[styles.payBtn, paymentMethod === 'Nakit' && styles.activePay]}
            >
              <Banknote color={paymentMethod === 'Nakit' ? 'white' : 'black'} />
              <Text style={{ color: paymentMethod === 'Nakit' ? 'white' : 'black' }}> Nakit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setPaymentMethod('Kart')}
              style={[styles.payBtn, paymentMethod === 'Kart' && styles.activePay]}
            >
              <CreditCard color={paymentMethod === 'Kart' ? 'white' : 'black'} />
              <Text style={{ color: paymentMethod === 'Kart' ? 'white' : 'black' }}> Kart</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Siparis Notu</Text>
          <TextInput
            placeholder="Siparis notu"
            style={styles.input}
            value={orderNote}
            onChangeText={setOrderNote}
          />

          <Text style={styles.sectionTitle}>Promosyon Kodu</Text>
          <View style={styles.promoRow}>
            <TextInput
              placeholder="Kod"
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              value={promoCode}
              onChangeText={setPromoCode}
            />
            <TouchableOpacity onPress={applyPromoCode} style={styles.promoBtn}>
              <Text style={{ color: 'white', fontWeight: 'bold' }}>Uygula</Text>
            </TouchableOpacity>
          </View>
          {appliedDiscount && (
            <Text style={{ color: 'green', marginTop: 6 }}>
              Indirim uygulandi: {appliedDiscount.type === 'percent' ? `${appliedDiscount.value}%` : `${appliedDiscount.value} TL`}
            </Text>
          )}

          <View style={styles.totalRow}>
            <Text style={{ color: 'gray' }}>Ara Toplam</Text>
            <Text>{subTotal.toFixed(2)} TL</Text>
          </View>
          {discountAmount > 0 && (
            <View style={styles.totalRow}>
              <Text style={{ color: 'green' }}>Indirim</Text>
              <Text style={{ color: 'green' }}>- {discountAmount.toFixed(2)} TL</Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={{ fontWeight: 'bold' }}>Toplam</Text>
            <Text style={{ fontWeight: 'bold' }}>{finalTotal.toFixed(2)} TL</Text>
          </View>

          <TouchableOpacity onPress={placeOrder} style={styles.primaryBtn}>
            <Text style={styles.btnText}>Siparisi Onayla</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
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
  qtyRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  qtyBtn: { backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  qtyBtnText: { fontWeight: 'bold' },
  sectionTitle: { fontWeight: 'bold', marginTop: 10, marginBottom: 8 },
  payRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  payBtn: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center'
  },
  activePay: { backgroundColor: '#1F2937', borderColor: '#1F2937' },
  input: { backgroundColor: '#F3F4F6', padding: 12, borderRadius: 8, marginBottom: 10 },
  promoRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  promoBtn: { backgroundColor: '#1F2937', paddingHorizontal: 12, paddingVertical: 12, borderRadius: 8 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  primaryBtn: { backgroundColor: '#EA580C', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 12 },
  btnText: { color: 'white', fontWeight: 'bold' }
});
