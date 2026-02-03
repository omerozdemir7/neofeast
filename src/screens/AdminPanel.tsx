import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, SafeAreaView, Alert, Modal, Image } from 'react-native';
import { LogOut, Trash2, Plus, TicketPercent, Pencil } from 'lucide-react-native';
import { Order, Promotion, Restaurant } from '../types';
import { db } from '../firebaseConfig';
import { collection, addDoc, deleteDoc, doc, setDoc, updateDoc } from 'firebase/firestore';

interface Props {
  restaurants: Restaurant[];
  orders: Order[];
  promotions: Promotion[];
  onLogout: () => void;
  refreshData: () => void;
}

type PromoFormState = {
  title: string;
  code: string;
  imageUrl: string;
  type: 'percent' | 'amount';
  value: string;
  minOrderTotal: string;
  maxDiscountAmount: string;
};

type PromoMode = 'global' | 'special';

type TopCustomer = {
  id: string;
  name: string;
  orderCount: number;
};

const defaultPromoImage = 'https://images.unsplash.com/photo-1556740749-887f6717d7e4?w=1200';

export default function AdminPanel({ restaurants, orders, promotions, onLogout }: Props) {
  const [restaurantModalVisible, setRestaurantModalVisible] = useState(false);
  const [promoModalVisible, setPromoModalVisible] = useState(false);
  const [editingRestaurantId, setEditingRestaurantId] = useState<string | null>(null);
  const [promoMode, setPromoMode] = useState<PromoMode>('global');
  const [selectedTargetUserIds, setSelectedTargetUserIds] = useState<string[]>([]);
  const [newRest, setNewRest] = useState({ name: '', category: '', deliveryTime: '', image: '' });
  const [newPromo, setNewPromo] = useState<PromoFormState>({
    title: '',
    code: '',
    imageUrl: '',
    type: 'percent',
    value: '10',
    minOrderTotal: '',
    maxDiscountAmount: ''
  });

  const topCustomers = useMemo<TopCustomer[]>(() => {
    const customerMap = new Map<string, { name: string; orderCount: number }>();

    orders.forEach((order) => {
      if (!order.customerId) return;
      const previous = customerMap.get(order.customerId);
      customerMap.set(order.customerId, {
        name: order.customerName || previous?.name || order.customerId,
        orderCount: (previous?.orderCount || 0) + 1
      });
    });

    return Array.from(customerMap.entries())
      .map(([id, info]) => ({ id, name: info.name, orderCount: info.orderCount }))
      .sort((a, b) => b.orderCount - a.orderCount);
  }, [orders]);

  const openCreateRestaurantModal = () => {
    setEditingRestaurantId(null);
    setNewRest({ name: '', category: '', deliveryTime: '', image: '' });
    setRestaurantModalVisible(true);
  };

  const openEditRestaurantModal = (restaurant: Restaurant) => {
    const restaurantId = restaurant._id || restaurant.id;
    setEditingRestaurantId(restaurantId);
    setNewRest({
      name: restaurant.name || '',
      category: restaurant.category || '',
      deliveryTime: restaurant.deliveryTime || '',
      image: restaurant.image || ''
    });
    setRestaurantModalVisible(true);
  };

  const saveRestaurant = async () => {
    if (!newRest.name.trim() || !newRest.category.trim()) {
      Alert.alert('Hata', 'Lutfen isim ve kategori girin.');
      return;
    }

    try {
      if (editingRestaurantId) {
        await updateDoc(doc(db, 'restaurants', editingRestaurantId), {
          name: newRest.name.trim(),
          category: newRest.category.trim(),
          deliveryTime: newRest.deliveryTime.trim(),
          image: newRest.image.trim(),
          updatedAt: new Date().toISOString()
        });
        Alert.alert('Basarili', 'Restoran guncellendi.');
      } else {
        await addDoc(collection(db, 'restaurants'), {
          ...newRest,
          name: newRest.name.trim(),
          category: newRest.category.trim(),
          deliveryTime: newRest.deliveryTime.trim(),
          image: newRest.image.trim(),
          rating: 5,
          menu: [],
          createdAt: new Date().toISOString()
        });
        Alert.alert('Basarili', 'Restoran eklendi.');
      }

      setRestaurantModalVisible(false);
      setEditingRestaurantId(null);
      setNewRest({ name: '', category: '', deliveryTime: '', image: '' });
    } catch (e: any) {
      Alert.alert('Hata', e.message);
    }
  };

  const deleteRest = async (id: string) => {
    Alert.alert('Sil', 'Bu restorani silmek istiyor musun?', [
      { text: 'Iptal', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDoc(doc(db, 'restaurants', id));
          } catch (e: any) {
            Alert.alert('Hata', 'Silinemedi: ' + e.message);
          }
        }
      }
    ]);
  };

  const openPromoModal = (mode: PromoMode) => {
    setPromoMode(mode);
    setSelectedTargetUserIds([]);
    setPromoModalVisible(true);
  };

  const toggleTargetUser = (userId: string) => {
    setSelectedTargetUserIds((previous) => (
      previous.includes(userId) ? previous.filter((id) => id !== userId) : [...previous, userId]
    ));
  };

  const addPromo = async () => {
    const code = newPromo.code.trim().toUpperCase();
    const title = newPromo.title.trim();
    const parsedValue = Number(newPromo.value);
    const parsedMinOrder = Number(newPromo.minOrderTotal || 0);
    const parsedMaxDiscount = Number(newPromo.maxDiscountAmount || 0);

    if (!title || !code) {
      Alert.alert('Hata', 'Lutfen promosyon adi ve kodu girin.');
      return;
    }

    if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
      Alert.alert('Hata', 'Lutfen gecerli bir indirim degeri girin.');
      return;
    }

    if (newPromo.type === 'percent' && parsedValue > 100) {
      Alert.alert('Hata', 'Yuzde indirim 100den buyuk olamaz.');
      return;
    }

    if (promoMode === 'special' && selectedTargetUserIds.length === 0) {
      Alert.alert('Hata', 'Ozel promosyon icin en az bir musteri secmelisin.');
      return;
    }

    try {
      await setDoc(doc(db, 'promos', code), {
        title,
        code,
        imageUrl: newPromo.imageUrl.trim() || defaultPromoImage,
        type: newPromo.type,
        value: parsedValue,
        active: true,
        minOrderTotal: parsedMinOrder > 0 ? parsedMinOrder : 0,
        maxDiscountAmount: parsedMaxDiscount > 0 ? parsedMaxDiscount : null,
        targetUserIds: promoMode === 'special' ? selectedTargetUserIds : [],
        createdAt: new Date().toISOString()
      });

      Alert.alert('Basarili', 'Promosyon kaydedildi.');
      setPromoModalVisible(false);
      setSelectedTargetUserIds([]);
      setNewPromo({
        title: '',
        code: '',
        imageUrl: '',
        type: 'percent',
        value: '10',
        minOrderTotal: '',
        maxDiscountAmount: ''
      });
    } catch (e: any) {
      Alert.alert('Hata', e.message);
    }
  };

  const deletePromo = async (promoId: string) => {
    Alert.alert('Sil', 'Bu promosyonu silmek istiyor musun?', [
      { text: 'Iptal', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDoc(doc(db, 'promos', promoId));
          } catch (e: any) {
            Alert.alert('Hata', 'Silinemedi: ' + e.message);
          }
        }
      }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Admin Paneli</Text>
        <TouchableOpacity onPress={onLogout}>
          <LogOut color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Restoranlar ({restaurants.length})</Text>
          <TouchableOpacity onPress={openCreateRestaurantModal} style={styles.addBtn}>
            <Plus color="white" size={16} />
            <Text style={styles.addBtnText}>Ekle</Text>
          </TouchableOpacity>
        </View>

        {restaurants.map((restaurant) => {
          const restaurantId = restaurant._id || restaurant.id;
          return (
            <View key={restaurantId} style={styles.card}>
              <View style={styles.cardTextBlock}>
                <Text style={styles.cardTitle}>{restaurant.name}</Text>
                <Text style={styles.cardSub}>{restaurant.category} - {restaurant.deliveryTime}</Text>
              </View>
              <TouchableOpacity onPress={() => openEditRestaurantModal(restaurant)} style={styles.iconBtn}>
                <Pencil color="#2563EB" size={20} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deleteRest(restaurantId)} style={styles.iconBtn}>
                <Trash2 color="#EF4444" size={20} />
              </TouchableOpacity>
            </View>
          );
        })}

        <View style={[styles.sectionHeader, styles.promoSectionHeader]}>
          <Text style={styles.sectionTitle}>Promosyonlar ({promotions.length})</Text>
          <View style={styles.promoActionRow}>
            <TouchableOpacity onPress={() => openPromoModal('global')} style={[styles.addBtn, styles.promoBtn]}>
              <Plus color="white" size={16} />
              <Text style={styles.addBtnText}>Promosyon Ekle</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => openPromoModal('special')} style={[styles.addBtn, styles.specialPromoBtn]}>
              <TicketPercent color="white" size={16} />
              <Text style={styles.addBtnText}>Ozel Promosyon</Text>
            </TouchableOpacity>
          </View>
        </View>

        {promotions.map((promo) => {
          const targetCount = promo.targetUserIds?.length || 0;
          const audienceText = targetCount > 0 ? `${targetCount} musteride gorunur` : 'Herkese acik';
          return (
            <View key={promo.id} style={styles.promoCard}>
              <Image source={{ uri: promo.imageUrl }} style={styles.promoImage} />
              <View style={styles.cardTextBlock}>
                <Text style={styles.cardTitle}>{promo.title}</Text>
                <Text style={styles.cardSub}>Kod: {promo.code}</Text>
                <Text style={styles.promoDiscount}>
                  Indirim: {promo.type === 'percent' ? `%${promo.value}` : `${promo.value} TL`}
                </Text>
                <Text style={styles.audienceText}>{audienceText}</Text>
              </View>
              <TouchableOpacity onPress={() => deletePromo(promo.id)} style={styles.iconBtn}>
                <Trash2 color="#EF4444" size={20} />
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>

      <Modal visible={restaurantModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingRestaurantId ? 'Restoran Duzenle' : 'Yeni Restoran Ekle'}</Text>
            <TextInput
              placeholder="Restoran Adi"
              style={styles.input}
              value={newRest.name}
              onChangeText={(name) => setNewRest((prev) => ({ ...prev, name }))}
            />
            <TextInput
              placeholder="Kategori (Orn: Burger)"
              style={styles.input}
              value={newRest.category}
              onChangeText={(category) => setNewRest((prev) => ({ ...prev, category }))}
            />
            <TextInput
              placeholder="Teslimat (Orn: 30 dk)"
              style={styles.input}
              value={newRest.deliveryTime}
              onChangeText={(deliveryTime) => setNewRest((prev) => ({ ...prev, deliveryTime }))}
            />
            <TextInput
              placeholder="Resim URL"
              style={styles.input}
              value={newRest.image}
              onChangeText={(image) => setNewRest((prev) => ({ ...prev, image }))}
            />

            <TouchableOpacity onPress={saveRestaurant} style={styles.saveBtn}>
              <Text style={styles.saveBtnText}>{editingRestaurantId ? 'Guncelle' : 'Kaydet'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setRestaurantModalVisible(false);
                setEditingRestaurantId(null);
              }}
              style={styles.cancelBtn}
            >
              <Text style={styles.cancelBtnText}>Iptal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={promoModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{promoMode === 'special' ? 'Ozel Promosyon' : 'Yeni Promosyon'}</Text>

            <TextInput
              placeholder="Promosyon adi"
              style={styles.input}
              value={newPromo.title}
              onChangeText={(title) => setNewPromo((prev) => ({ ...prev, title }))}
            />
            <TextInput
              placeholder="Kod (Orn: NEO10)"
              autoCapitalize="characters"
              style={styles.input}
              value={newPromo.code}
              onChangeText={(code) => setNewPromo((prev) => ({ ...prev, code }))}
            />
            <TextInput
              placeholder="Gorsel URL (opsiyonel)"
              style={styles.input}
              value={newPromo.imageUrl}
              onChangeText={(imageUrl) => setNewPromo((prev) => ({ ...prev, imageUrl }))}
            />

            <View style={styles.typeRow}>
              <TouchableOpacity
                onPress={() => setNewPromo((prev) => ({ ...prev, type: 'percent' }))}
                style={[styles.typeBtn, newPromo.type === 'percent' && styles.typeBtnActive]}
              >
                <Text style={[styles.typeBtnText, newPromo.type === 'percent' && styles.typeBtnTextActive]}>Yuzde</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setNewPromo((prev) => ({ ...prev, type: 'amount' }))}
                style={[styles.typeBtn, newPromo.type === 'amount' && styles.typeBtnActive]}
              >
                <Text style={[styles.typeBtnText, newPromo.type === 'amount' && styles.typeBtnTextActive]}>TL</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              placeholder={newPromo.type === 'percent' ? 'Indirim yuzdesi (Orn: 10)' : 'Indirim tutari (Orn: 50)'}
              style={styles.input}
              keyboardType="numeric"
              value={newPromo.value}
              onChangeText={(value) => setNewPromo((prev) => ({ ...prev, value }))}
            />
            <TextInput
              placeholder="Min sepet tutari (opsiyonel)"
              style={styles.input}
              keyboardType="numeric"
              value={newPromo.minOrderTotal}
              onChangeText={(minOrderTotal) => setNewPromo((prev) => ({ ...prev, minOrderTotal }))}
            />
            <TextInput
              placeholder="Max indirim (opsiyonel)"
              style={styles.input}
              keyboardType="numeric"
              value={newPromo.maxDiscountAmount}
              onChangeText={(maxDiscountAmount) => setNewPromo((prev) => ({ ...prev, maxDiscountAmount }))}
            />

            {promoMode === 'special' && (
              <>
                <Text style={styles.specialTitle}>En cok siparis veren musteriler</Text>
                {topCustomers.length === 0 ? (
                  <Text style={styles.emptyTopCustomerText}>Henuz siparis yok, ozel promosyon secimi yapilamiyor.</Text>
                ) : (
                  <>
                    <View style={styles.quickSelectRow}>
                      <TouchableOpacity
                        onPress={() => setSelectedTargetUserIds(topCustomers.slice(0, 5).map((customer) => customer.id))}
                        style={styles.quickBtn}
                      >
                        <Text style={styles.quickBtnText}>Ilk 5</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => setSelectedTargetUserIds(topCustomers.map((customer) => customer.id))}
                        style={styles.quickBtn}
                      >
                        <Text style={styles.quickBtnText}>Tumunu Sec</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => setSelectedTargetUserIds([])} style={styles.quickBtn}>
                        <Text style={styles.quickBtnText}>Temizle</Text>
                      </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.customerList} nestedScrollEnabled>
                      {topCustomers.map((customer) => {
                        const selected = selectedTargetUserIds.includes(customer.id);
                        return (
                          <TouchableOpacity
                            key={customer.id}
                            onPress={() => toggleTargetUser(customer.id)}
                            style={[styles.customerRow, selected && styles.customerRowSelected]}
                          >
                            <Text style={[styles.customerName, selected && styles.customerNameSelected]} numberOfLines={1}>
                              {customer.name}
                            </Text>
                            <Text style={[styles.customerCount, selected && styles.customerNameSelected]}>
                              {customer.orderCount} siparis
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </>
                )}
              </>
            )}

            <TouchableOpacity onPress={addPromo} style={styles.saveBtn}>
              <Text style={styles.saveBtnText}>Kaydet</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setPromoModalVisible(false);
                setSelectedTargetUserIds([]);
              }}
              style={styles.cancelBtn}
            >
              <Text style={styles.cancelBtnText}>Iptal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: {
    padding: 20,
    paddingTop: 40,
    backgroundColor: '#1F2937',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  title: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  content: { padding: 20, paddingBottom: 40 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  promoSectionHeader: { marginTop: 12 },
  sectionTitle: { fontWeight: 'bold', fontSize: 18, color: '#1F2937' },
  addBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center'
  },
  promoBtn: { backgroundColor: '#EA580C' },
  specialPromoBtn: { backgroundColor: '#7C3AED', marginLeft: 8 },
  addBtnText: { color: 'white', fontWeight: 'bold', marginLeft: 6 },
  promoActionRow: { flexDirection: 'row', alignItems: 'center' },
  card: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 10,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 1
  },
  promoCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 12,
    marginBottom: 10,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 1
  },
  promoImage: { width: 56, height: 56, borderRadius: 10, marginRight: 10, backgroundColor: '#E5E7EB' },
  cardTextBlock: { flex: 1 },
  cardTitle: { fontWeight: 'bold', fontSize: 16 },
  cardSub: { color: '#6B7280', marginTop: 2 },
  promoDiscount: { color: '#EA580C', marginTop: 3, fontWeight: '600' },
  audienceText: { color: '#475569', marginTop: 2, fontSize: 12 },
  iconBtn: { padding: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: 'white', padding: 20, borderRadius: 15, maxHeight: '92%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 14 },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#F9FAFB'
  },
  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  typeBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center'
  },
  typeBtnActive: { backgroundColor: '#EA580C', borderColor: '#EA580C' },
  typeBtnText: { color: '#374151', fontWeight: '600' },
  typeBtnTextActive: { color: 'white' },
  specialTitle: { fontWeight: '700', color: '#1F2937', marginBottom: 8 },
  emptyTopCustomerText: { color: '#6B7280', marginBottom: 12 },
  quickSelectRow: { flexDirection: 'row', marginBottom: 8 },
  quickBtn: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    marginRight: 8
  },
  quickBtnText: { color: '#334155', fontWeight: '600', fontSize: 12 },
  customerList: {
    maxHeight: 180,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 6,
    marginBottom: 12
  },
  customerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 6
  },
  customerRowSelected: { backgroundColor: '#EA580C' },
  customerName: { flex: 1, color: '#334155', fontWeight: '600', marginRight: 8 },
  customerCount: { color: '#64748B', fontSize: 12, fontWeight: '600' },
  customerNameSelected: { color: '#FFFFFF' },
  saveBtn: { backgroundColor: '#10B981', padding: 15, borderRadius: 8, alignItems: 'center' },
  saveBtnText: { color: 'white', fontWeight: 'bold' },
  cancelBtn: { marginTop: 12, alignSelf: 'center', padding: 8 },
  cancelBtnText: { color: '#DC2626' }
});
