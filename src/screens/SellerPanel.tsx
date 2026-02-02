import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { LogOut, Trash2, CheckCircle, Truck, Utensils } from 'lucide-react-native';
import { UserType, Restaurant, Order } from '../types';
// Firebase importları
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
  const [newItem, setNewItem] = useState({ name: '', price: '', description: '' });

  // Satıcının restoranını bul
  const myRest = restaurants.find(r => r._id === user.restaurantId || r.id === user.restaurantId);
  
  // Sadece bu restorana ait siparişleri filtrele
  const myOrders = orders.filter(o => o.restaurantId === (myRest?._id || user.restaurantId));

  // --- SİPARİŞ GÜNCELLEME ---
  const updateOrder = async (id: string, status: string) => {
    try {
      // id, Firestore document ID'si olmalı
      await updateDoc(doc(db, "orders", id), { status });
    } catch (e: any) {
      Alert.alert("Hata", "Durum güncellenemedi: " + e.message);
    }
  };

  // --- MENÜ YÖNETİMİ (Ürün Ekle) ---
const addItem = async () => {
    if (!myRest) {
        Alert.alert("Yetki Hatası", "Dükkan bağlantısı bulunamadı.");
        return;
    }

    if (!newItem.name || !newItem.price) {
        Alert.alert("Eksik Bilgi", "Lütfen ürün adı ve fiyatını giriniz.");
        return;
    }
    
    // --- KOMİSYON HESAPLAMA MANTIĞI ---
    const rawPrice = parseFloat(newItem.price); // Satıcının girdiği (Örn: 100)
    const commissionRate = 0.20; // %20 Komisyon
    const finalPrice = rawPrice + (rawPrice * commissionRate); // Müşterinin göreceği (120)

    const updatedMenu = [
      ...(myRest.menu || []), 
      { 
        id: `m${Date.now()}`, 
        name: newItem.name,
        description: newItem.description,
        price: finalPrice, // Veritabanına komisyonlu fiyatı yazıyoruz
        sellerPrice: rawPrice // Opsiyonel: Satıcının kendi kazancını görmesi için saklayabilirsin
      }
    ];

    try {
        await updateDoc(doc(db, "restaurants", myRest._id), { menu: updatedMenu });
        setNewItem({ name: '', price: '', description: '' });
        Alert.alert("Başarılı", `Ürün eklendi! (Senin kazancın: ${rawPrice} TL, Müşteri fiyatı: ${finalPrice} TL)`);
    } catch (e: any) {
        Alert.alert("Hata", e.message);
    }
  };

  // --- MENÜ YÖNETİMİ (Ürün Sil) ---
  const delItem = async (itemId: string) => {
    if (!myRest) return;
    
    const updatedMenu = myRest.menu.filter(m => m.id !== itemId);
    
    try {
        await updateDoc(doc(db, "restaurants", myRest._id), { menu: updatedMenu });
    } catch (e: any) {
        Alert.alert("Hata", e.message);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F3F4F6' }}>
      <View style={styles.header}>
        <View>
            <Text style={styles.title}>{myRest?.name || 'Restoran Paneli'}</Text>
            <Text style={{color:'#D1FAE5', fontSize:12}}>Satıcı: {user.name}</Text>
        </View>
        <TouchableOpacity onPress={onLogout} style={{padding:5}}>
          <LogOut color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity onPress={() => setTab('orders')} style={[styles.tabItem, tab === 'orders' && styles.activeTab]}>
          <Text style={[styles.tabText, tab === 'orders' && styles.activeTabText]}>Siparişler ({myOrders.filter(o => o.status !== 'Teslim Edildi' && o.status !== 'İptal').length})</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setTab('menu')} style={[styles.tabItem, tab === 'menu' && styles.activeTab]}>
          <Text style={[styles.tabText, tab === 'menu' && styles.activeTabText]}>Menü</Text>
        </TouchableOpacity>
      </View>

      {tab === 'orders' ? (
        <ScrollView contentContainerStyle={{ padding: 15 }}>
          {myOrders.length === 0 && <Text style={{textAlign:'center', color:'gray', marginTop:20}}>Henüz sipariş yok.</Text>}
          {myOrders.map(o => (
            <View key={o.id} style={styles.orderCard}>
              <View style={{flexDirection:'row', justifyContent:'space-between', marginBottom:8}}>
                  <Text style={{fontWeight:'bold', fontSize:16}}>Müşteri: {o.customerName}</Text>
                  <Text style={{fontWeight:'bold', color: o.status === 'Beklemede' ? '#D97706' : '#059669'}}>{o.status}</Text>
              </View>
              
              <View style={{backgroundColor:'#F9FAFB', padding:10, borderRadius:5, marginBottom:10}}>
                  {o.items.map((item, idx) => (
                      <Text key={idx} style={{color:'#4B5563'}}>{item.quantity}x {item.name}</Text>
                  ))}
                  <Text style={{marginTop:5, fontWeight:'bold'}}>Tutar: {o.finalTotal || o.total} TL</Text>
                  <Text style={{fontSize:12, color:'gray'}}>Adres: {o.address}</Text>
              </View>

              <View style={{flexDirection:'row', gap:10}}>
                  {o.status === 'Beklemede' && (
                      <>
                        <TouchableOpacity onPress={() => updateOrder(o.id, 'Hazırlanıyor')} style={[styles.actionBtn, {backgroundColor:'#2563EB'}]}>
                            <Text style={styles.btnText}>Onayla</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => updateOrder(o.id, 'İptal')} style={[styles.actionBtn, {backgroundColor:'#DC2626'}]}>
                            <Text style={styles.btnText}>Reddet</Text>
                        </TouchableOpacity>
                      </>
                  )}
                  {o.status === 'Hazırlanıyor' && (
                      <TouchableOpacity onPress={() => updateOrder(o.id, 'Yolda')} style={[styles.actionBtn, {backgroundColor:'#7C3AED'}]}>
                          <Truck color="white" size={16} style={{marginRight:5}} />
                          <Text style={styles.btnText}>Kuryeye Ver</Text>
                      </TouchableOpacity>
                  )}
                  {o.status === 'Yolda' && (
                      <TouchableOpacity onPress={() => updateOrder(o.id, 'Teslim Edildi')} style={[styles.actionBtn, {backgroundColor:'#059669'}]}>
                          <CheckCircle color="white" size={16} style={{marginRight:5}} />
                          <Text style={styles.btnText}>Teslim Edildi</Text>
                      </TouchableOpacity>
                  )}
              </View>
            </View>
          ))}
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 15 }}>
          <View style={styles.formCard}>
            <Text style={{fontWeight:'bold', marginBottom:10}}>Menüye Ekle</Text>
            <TextInput placeholder="Ürün Adı" style={styles.input} value={newItem.name} onChangeText={t => setNewItem({ ...newItem, name: t })} />
            <TextInput placeholder="Fiyat (TL)" style={styles.input} keyboardType="numeric" value={newItem.price} onChangeText={t => setNewItem({ ...newItem, price: t })} />
            <TextInput placeholder="Açıklama" style={styles.input} value={newItem.description} onChangeText={t => setNewItem({ ...newItem, description: t })} />
            <TouchableOpacity onPress={addItem} style={[styles.actionBtn, {backgroundColor:'#059669', marginTop:5}]}>
              <Text style={styles.btnText}>Ekle</Text>
            </TouchableOpacity>
          </View>

          {(myRest?.menu || []).map(m => (
            <View key={m.id} style={styles.menuItem}>
              <View>
                  <Text style={{fontWeight:'bold'}}>{m.name}</Text>
                  <Text style={{color:'#059669', fontWeight:'bold'}}>{m.price} TL</Text>
              </View>
              <TouchableOpacity onPress={() => delItem(m.id)} style={{padding:5}}>
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
  header: { backgroundColor: '#059669', padding: 20, paddingTop: 40, flexDirection: 'row', justifyContent: 'space-between', alignItems:'center' },
  title: { color: 'white', fontWeight: 'bold', fontSize: 20 },
  tabBar: { flexDirection: 'row', backgroundColor: 'white', padding: 5 },
  tabItem: { flex: 1, padding: 10, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: '#059669' },
  tabText: { color: 'gray', fontWeight:'bold' },
  activeTabText: { color: '#059669' },
  orderCard: { backgroundColor: 'white', padding: 15, marginBottom: 15, borderRadius: 10, elevation: 2 },
  actionBtn: { flex: 1, padding: 10, borderRadius: 8, flexDirection:'row', alignItems:'center', justifyContent:'center' },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 13 },
  formCard: { backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 20, elevation: 1 },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', padding: 10, borderRadius: 8, marginBottom: 10 },
  menuItem: { backgroundColor: 'white', padding: 15, marginBottom: 8, borderRadius: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderLeftWidth: 4, borderLeftColor: '#059669' }
});