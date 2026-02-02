import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, TextInput, ScrollView, Alert } from 'react-native';
import { LogOut, MapPin, User, Receipt, Trash2, Check } from 'lucide-react-native';
import { UserType, Address } from '../../types';
import { db } from '../../firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';

interface Props {
  user: UserType;
  onUpdateUser: (user: UserType) => void;
  onLogout: () => void;
  onNavigate: (tab: 'home' | 'search' | 'cart' | 'orders' | 'profile') => void;
  onNotify: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export default function CustomerProfile({ user, onUpdateUser, onLogout, onNavigate, onNotify }: Props) {
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [editUser, setEditUser] = useState<UserType>(user);
  const [addressForm, setAddressForm] = useState({ title: '', fullAddress: '' });

  const notify = (message: string, type: 'success' | 'error' | 'info' = 'info') => onNotify(message, type);

  useEffect(() => {
    setEditUser(user);
  }, [user]);

  const updateUser = async (updates: Partial<UserType>, successMessage?: string) => {
    try {
      const userRef = doc(db, "users", user._id);
      
      // HATA ÇÖZÜMÜ: undefined olan değerleri temizle
      const cleanUpdates = JSON.parse(JSON.stringify(updates));

      await updateDoc(userRef, cleanUpdates);
      onUpdateUser({ ...user, ...updates });
      
      if (successMessage) notify(successMessage, 'success');
      return true;
    } catch (e: any) {
      console.error(e);
      notify('Güncelleme başarısız: ' + e.message, 'error');
      return false;
    }
  };

  const saveProfile = async () => {
    // HATA ÇÖZÜMÜ: Eğer username yoksa boş string gönderemeyiz, o alanı hiç göndermeyelim veya e-postadan üretelim.
    // Burada || '' kullanarak undefined gitmesini engelliyoruz.
    const ok = await updateUser({
      name: editUser.name || '',
      username: editUser.username || user.email?.split('@')[0] || 'kullanici', 
      phone: editUser.phone || ''
    }, 'Profil kaydedildi.');
    
    if (ok) setProfileModalVisible(false);
  };

  const addAddress = async () => {
    if (!addressForm.title || !addressForm.fullAddress) {
      notify('Adres bilgileri eksik.', 'error');
      return;
    }
    const current = user.addresses || [];
    const next: Address[] = [
      ...current,
      {
        id: `a${Date.now()}`,
        title: addressForm.title,
        fullAddress: addressForm.fullAddress,
        isDefault: current.length === 0
      }
    ];
    const ok = await updateUser({ addresses: next }, 'Adres eklendi.');
    if (ok) setAddressForm({ title: '', fullAddress: '' });
  };

  const deleteAddress = async (id: string) => {
    const next = (user.addresses || []).filter((a) => a.id !== id);
    await updateUser({ addresses: next }, 'Adres silindi.');
  };

  const setDefaultAddress = async (id: string) => {
    const next = (user.addresses || []).map((a) => ({ ...a, isDefault: a.id === id }));
    await updateUser({ addresses: next }, 'Varsayılan adres güncellendi.');
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.avatar}>
          <User size={40} color="white" />
        </View>
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.muted}>{user.email}</Text>
        <Text style={styles.muted}>@{user.username || 'misafir'}</Text>
      </View>

      <TouchableOpacity style={styles.rowCard} onPress={() => setProfileModalVisible(true)}>
        <User size={20} color="#374151" />
        <Text style={styles.rowText}>Hesap Bilgileri</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.rowCard} onPress={() => onNavigate('orders')}>
        <Receipt size={20} color="#374151" />
        <Text style={styles.rowText}>Siparişlerim</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.rowCard} onPress={() => setAddressModalVisible(true)}>
        <MapPin size={20} color="#374151" />
        <Text style={styles.rowText}>Adreslerim ({user.addresses?.length || 0})</Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={onLogout} style={[styles.rowCard, styles.logoutRow]}>
        <LogOut size={20} color="#EF4444" />
        <Text style={[styles.rowText, { color: '#EF4444' }]}>Çıkış Yap</Text>
      </TouchableOpacity>

      {/* Profil Düzenleme Modalı */}
      <Modal visible={profileModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Profili Düzenle</Text>
            
            <TextInput 
              placeholder="Ad Soyad" 
              placeholderTextColor="#6B7280"
              style={styles.input} 
              value={editUser.name || ''} 
              onChangeText={(t) => setEditUser({ ...editUser, name: t })} 
            />
            <TextInput 
              placeholder="E-posta" 
              placeholderTextColor="#6B7280"
              style={[styles.input, { backgroundColor: '#E5E7EB' }]} 
              value={editUser.email || ''} 
              editable={false}
            />
            <TextInput 
              placeholder="Telefon" 
              placeholderTextColor="#6B7280"
              style={styles.input} 
              value={editUser.phone || ''} 
              keyboardType="phone-pad" 
              onChangeText={(t) => setEditUser({ ...editUser, phone: t })} 
            />
            
            <TouchableOpacity onPress={saveProfile} style={styles.primaryBtn}>
              <Text style={styles.btnText}>Kaydet</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setProfileModalVisible(false)} style={{ marginTop: 15, alignSelf: 'center' }}>
              <Text style={{color:'#6B7280'}}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Adres Modalı */}
      <Modal visible={addressModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Adreslerim</Text>
            <ScrollView style={{ maxHeight: 220, marginBottom: 15 }}>
              {(user.addresses || []).length === 0 && <Text style={{ color: '#6B7280', fontStyle:'italic' }}>Kayıtlı adres yok.</Text>}
              {(user.addresses || []).map((a) => (
                <View key={a.id} style={styles.addressItem}>
                  <TouchableOpacity style={{ flex: 1 }} onPress={() => setDefaultAddress(a.id)}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      {a.isDefault ? <Check size={16} color="#EA580C" /> : <View style={styles.dot} />}
                      <Text style={{ fontWeight: 'bold', marginLeft: 8, color: '#1F2937' }}>{a.title}</Text>
                    </View>
                    <Text style={{ color: '#6B7280', marginTop: 4, fontSize: 12 }}>{a.fullAddress}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteAddress(a.id)} style={{padding: 5}}>
                    <Trash2 color="#EF4444" size={18} />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
            
            <View style={{borderTopWidth:1, borderColor:'#E5E7EB', paddingTop:15}}>
              <Text style={{fontSize:12, fontWeight:'bold', marginBottom:5, color:'#374151'}}>Yeni Adres Ekle</Text>
              <TextInput 
                placeholder="Başlık (Ev, İş)" 
                placeholderTextColor="#6B7280"
                style={styles.input} 
                value={addressForm.title} 
                onChangeText={(t) => setAddressForm({ ...addressForm, title: t })} 
              />
              <TextInput 
                placeholder="Açık Adres" 
                placeholderTextColor="#6B7280"
                style={styles.input} 
                value={addressForm.fullAddress} 
                onChangeText={(t) => setAddressForm({ ...addressForm, fullAddress: t })} 
              />
              <TouchableOpacity onPress={addAddress} style={styles.primaryBtn}>
                <Text style={styles.btnText}>Adres Ekle</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={() => setAddressModalVisible(false)} style={{ marginTop: 15, alignSelf: 'center' }}>
              <Text style={{color:'#6B7280'}}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  card: { alignItems: 'center', marginBottom: 20, padding: 20, backgroundColor: 'white', borderRadius: 15, shadowColor:'#000', shadowOpacity:0.05, shadowRadius:5, elevation:2 },
  avatar: { width: 80, height: 80, backgroundColor: '#EA580C', borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  name: { fontSize: 20, fontWeight: 'bold', color: '#1F2937' },
  muted: { color: '#6B7280', marginTop: 2, fontSize: 14 },
  rowCard: { flexDirection: 'row', backgroundColor: 'white', padding: 15, borderRadius: 12, marginBottom: 10, alignItems: 'center', shadowColor:'#000', shadowOpacity:0.03, shadowRadius:3, elevation:1 },
  rowText: { marginLeft: 12, fontWeight: '600', color: '#374151', fontSize: 15 },
  logoutRow: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: 'white', padding: 24, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 10, elevation: 5 },
  modalTitle: { fontWeight: 'bold', fontSize: 18, marginBottom: 15, color: '#1F2937', textAlign:'center' },
  input: { backgroundColor: '#F3F4F6', padding: 12, borderRadius: 10, marginBottom: 12, color: '#1F2937', fontSize: 15 },
  primaryBtn: { backgroundColor: '#EA580C', padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 5 },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 15 },
  addressItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', padding: 12, borderRadius: 10, marginBottom: 8, borderWidth:1, borderColor:'#F3F4F6' },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: '#D1D5DB' }
});