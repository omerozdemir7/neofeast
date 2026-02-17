import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert, Linking, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LogOut, Trash2, CheckCircle, Truck, Utensils, Phone } from 'lucide-react-native';
import { UserType, Restaurant, Order } from '../types';
import { db } from '../firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';

interface Props {
  user: UserType;
  restaurants: Restaurant[];
  orders: Order[];
  onLogout: () => void;
  refreshData: () => void;
}

export default function SellerPanel({ user, restaurants, orders, onLogout }: Props) {
  const [tab, setTab] = useState<'orders' | 'menu'>('orders');
  const [newItem, setNewItem] = useState({ name: '', price: '', description: '', imageUrl: '' });

  const myRest = restaurants.find((restaurant) => restaurant._id === user.restaurantId || restaurant.id === user.restaurantId);
  const restaurantDocId = myRest?._id || myRest?.id || '';
  const restaurantIds = [myRest?._id, myRest?.id, user.restaurantId].filter(Boolean) as string[];
  const myOrders = orders.filter((order) => restaurantIds.includes(order.restaurantId));
  const knownOrderIdsRef = useRef<string[]>([]);
  const restaurantKey = myRest?._id || myRest?.id || user.restaurantId || 'unknown';

  useEffect(() => {
    knownOrderIdsRef.current = [];
  }, [restaurantKey]);

  useEffect(() => {
    if (knownOrderIdsRef.current.length === 0) {
      knownOrderIdsRef.current = myOrders.map((order) => order.id);
      return;
    }

    const knownIds = new Set(knownOrderIdsRef.current);
    const incomingOrders = myOrders.filter((order) => !knownIds.has(order.id) && order.status === 'Beklemede');

    if (incomingOrders.length > 0) {
      const message = incomingOrders.length === 1 ? 'Yeni siparis geldi.' : `${incomingOrders.length} yeni siparis geldi.`;
      Alert.alert('Yeni Siparis', message);
    }

    knownOrderIdsRef.current = myOrders.map((order) => order.id);
  }, [myOrders]);

  const confirmLogout = () => {
    Alert.alert('Cikis Yap', 'Cikis yapmak istiyor musunuz?', [
      { text: 'Hayir', style: 'cancel' },
      { text: 'Evet', style: 'destructive', onPress: onLogout }
    ]);
  };

  const updateOrder = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, 'orders', id), { status });
    } catch (e: any) {
      Alert.alert('Hata', 'Durum guncellenemedi: ' + e.message);
    }
  };

  const callCustomer = async (phone?: string) => {
    const safePhone = (phone || '').replace(/[^+\d]/g, '');
    if (!safePhone) {
      Alert.alert('Bilgi', 'Bu sipariste telefon bilgisi yok.');
      return;
    }

    const phoneUrl = `tel:${safePhone}`;
    const canOpen = await Linking.canOpenURL(phoneUrl);

    if (!canOpen) {
      Alert.alert('Hata', 'Arama baslatilamadi.');
      return;
    }

    await Linking.openURL(phoneUrl);
  };

  const addItem = async () => {
    if (!myRest) {
      Alert.alert('Yetki Hatasi', 'Dukkan baglantisi bulunamadi.');
      return;
    }

    if (!newItem.name || !newItem.price) {
      Alert.alert('Eksik Bilgi', 'Lutfen urun adi ve fiyati giriniz.');
      return;
    }

    const rawPrice = parseFloat(newItem.price);
    if (Number.isNaN(rawPrice) || rawPrice <= 0) {
      Alert.alert('Gecersiz Fiyat', 'Lutfen gecerli bir fiyat giriniz.');
      return;
    }

    const commissionRate = 0.2;
    const finalPrice = rawPrice + rawPrice * commissionRate;
    const imageUrl = newItem.imageUrl.trim() || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400';

    const updatedMenu = [
      ...(myRest.menu || []),
      {
        id: `m${Date.now()}`,
        name: newItem.name,
        description: newItem.description,
        imageUrl,
        price: finalPrice,
        sellerPrice: rawPrice
      }
    ];

    try {
      await updateDoc(doc(db, 'restaurants', restaurantDocId), { menu: updatedMenu });
      setNewItem({ name: '', price: '', description: '', imageUrl: '' });
      Alert.alert('Basarili', `Urun eklendi! (Senin kazancin: ${rawPrice} TL, Musteri fiyati: ${finalPrice} TL)`);
    } catch (e: any) {
      Alert.alert('Hata', e.message);
    }
  };

  const delItem = async (itemId: string) => {
    if (!myRest) return;

    const updatedMenu = myRest.menu.filter((menuItem) => menuItem.id !== itemId);

    try {
      await updateDoc(doc(db, 'restaurants', restaurantDocId), { menu: updatedMenu });
    } catch (e: any) {
      Alert.alert('Hata', e.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{myRest?.name || 'Restoran Paneli'}</Text>
          <Text style={styles.sellerLabel}>Satici: {user.name}</Text>
        </View>
        <TouchableOpacity onPress={confirmLogout} style={styles.iconButton}>
          <LogOut color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity onPress={() => setTab('orders')} style={[styles.tabItem, tab === 'orders' && styles.activeTab]}>
          <Text style={[styles.tabText, tab === 'orders' && styles.activeTabText]}>
            Siparisler ({myOrders.filter((order) => order.status !== 'Teslim Edildi' && order.status !== 'İptal').length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setTab('menu')} style={[styles.tabItem, tab === 'menu' && styles.activeTab]}>
          <Text style={[styles.tabText, tab === 'menu' && styles.activeTabText]}>Menu</Text>
        </TouchableOpacity>
      </View>

      {tab === 'orders' ? (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
          {myOrders.length === 0 && <Text style={styles.emptyText}>Henuz siparis yok.</Text>}
          {myOrders.map((order) => (
            <View key={order.id} style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <Text style={styles.orderCustomer}>Musteri: {order.customerName}</Text>
                <Text style={[styles.orderStatus, { color: order.status === 'Beklemede' ? '#D97706' : '#059669' }]}>{order.status}</Text>
              </View>

              <View style={styles.orderBody}>
                {order.items.map((item, idx) => (
                  <Text key={`${order.id}-${idx}`} style={styles.orderItemText}>
                    {item.quantity}x {item.name}
                  </Text>
                ))}
                <Text style={styles.orderTotal}>Tutar: {order.finalTotal || order.total} TL</Text>
                <Text style={styles.orderInfo}>Adres: {order.address}</Text>
                <Text style={styles.orderInfo}>Telefon: {order.customerPhone || '-'}</Text>
              </View>

              <TouchableOpacity onPress={() => callCustomer(order.customerPhone)} style={styles.callBtn}>
                <Phone color="white" size={16} style={styles.callIcon} />
                <Text style={styles.btnText}>Musteriyi Ara</Text>
              </TouchableOpacity>

              <View style={styles.actionRow}>
                {order.status === 'Beklemede' && (
                  <>
                    <TouchableOpacity onPress={() => updateOrder(order.id, 'Hazırlanıyor')} style={[styles.actionBtn, { backgroundColor: '#2563EB' }]}>
                      <Text style={styles.btnText}>Onayla</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => updateOrder(order.id, 'İptal')} style={[styles.actionBtn, { backgroundColor: '#DC2626' }]}>
                      <Text style={styles.btnText}>Reddet</Text>
                    </TouchableOpacity>
                  </>
                )}
                {order.status === 'Hazırlanıyor' && (
                  <TouchableOpacity onPress={() => updateOrder(order.id, 'Yolda')} style={[styles.actionBtn, { backgroundColor: '#7C3AED' }]}>
                    <Truck color="white" size={16} style={styles.actionIcon} />
                    <Text style={styles.btnText}>Kuryeye Ver</Text>
                  </TouchableOpacity>
                )}
                {order.status === 'Yolda' && (
                  <TouchableOpacity onPress={() => updateOrder(order.id, 'Teslim Edildi')} style={[styles.actionBtn, { backgroundColor: '#059669' }]}>
                    <CheckCircle color="white" size={16} style={styles.actionIcon} />
                    <Text style={styles.btnText}>Teslim Edildi</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Menuye Ekle</Text>
            <TextInput placeholder="Ürün Adı" placeholderTextColor="#6B7280" style={styles.input} value={newItem.name} onChangeText={(text) => setNewItem({ ...newItem, name: text })} />
            <TextInput placeholder="Fiyat (TL)" placeholderTextColor="#6B7280" style={styles.input} keyboardType="numeric" value={newItem.price} onChangeText={(text) => setNewItem({ ...newItem, price: text })} />
            <TextInput placeholder="Açıklama" placeholderTextColor="#6B7280" style={styles.input} value={newItem.description} onChangeText={(text) => setNewItem({ ...newItem, description: text })} />
            <TextInput placeholder="Görsel Linki (https://...)" placeholderTextColor="#6B7280" style={styles.input} value={newItem.imageUrl} onChangeText={(text) => setNewItem({ ...newItem, imageUrl: text })} />
            <TouchableOpacity onPress={addItem} style={[styles.actionBtn, styles.addBtn]}>
              <Text style={styles.btnText}>Ekle</Text>
            </TouchableOpacity>
          </View>

          {(myRest?.menu || []).map((menuItem) => (
            <View key={menuItem.id} style={styles.menuItem}>
              {menuItem.imageUrl ? (
                <Image source={{ uri: menuItem.imageUrl }} style={styles.menuThumb} />
              ) : (
                <View style={styles.menuPlaceholder}>
                  <Utensils color="#9CA3AF" size={20} />
                </View>
              )}

              <View style={styles.menuInfo}>
                <Text style={styles.menuName}>{menuItem.name}</Text>
                <Text style={styles.menuDescription} numberOfLines={1}>
                  {menuItem.description || 'Aciklama yok'}
                </Text>
                <Text style={styles.menuPrice}>{menuItem.price} TL</Text>
              </View>

              <TouchableOpacity onPress={() => delItem(menuItem.id)} style={styles.iconButton}>
                <Trash2 color="#EF4444" size={20} />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: {
    backgroundColor: '#059669',
    padding: 20,
    paddingTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  title: { color: 'white', fontWeight: 'bold', fontSize: 20 },
  sellerLabel: { color: '#D1FAE5', fontSize: 12 },
  iconButton: { padding: 5 },
  tabBar: { flexDirection: 'row', backgroundColor: 'white', padding: 5 },
  tabItem: { flex: 1, padding: 10, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: '#059669' },
  tabText: { color: 'gray', fontWeight: 'bold' },
  activeTabText: { color: '#059669' },
  content: { padding: 15 },
  emptyText: { textAlign: 'center', color: 'gray', marginTop: 20 },
  orderCard: { backgroundColor: 'white', padding: 15, marginBottom: 15, borderRadius: 10, elevation: 2 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  orderCustomer: { fontWeight: 'bold', fontSize: 16 },
  orderStatus: { fontWeight: 'bold' },
  orderBody: { backgroundColor: '#F9FAFB', padding: 10, borderRadius: 5, marginBottom: 10 },
  orderItemText: { color: '#4B5563' },
  orderTotal: { marginTop: 5, fontWeight: 'bold' },
  orderInfo: { fontSize: 12, color: 'gray' },
  callBtn: {
    backgroundColor: '#0EA5E9',
    padding: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10
  },
  callIcon: { marginRight: 5 },
  actionRow: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, padding: 10, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  actionIcon: { marginRight: 5 },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 13 },
  formCard: { backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 20, elevation: 1 },
  formTitle: { fontWeight: 'bold', marginBottom: 10 },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', padding: 10, borderRadius: 8, marginBottom: 10 },
  addBtn: { backgroundColor: '#059669', marginTop: 5 },
  menuItem: {
    backgroundColor: 'white',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#059669'
  },
  menuThumb: {
    width: 56,
    height: 56,
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: '#E5E7EB'
  },
  menuPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center'
  },
  menuInfo: { flex: 1 },
  menuName: { fontWeight: 'bold' },
  menuDescription: { color: '#6B7280', fontSize: 12, marginTop: 2 },
  menuPrice: { color: '#059669', fontWeight: 'bold', marginTop: 3 }
});
