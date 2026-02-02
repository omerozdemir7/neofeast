import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, TextInput, ScrollView } from 'react-native';
import { LogOut, MapPin, User, Receipt, Trash2, Check } from 'lucide-react-native';
import { UserType, Address } from '../../types';
import { db } from '../../firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';
import { CustomerTheme } from './theme';

interface Props {
  user: UserType;
  onUpdateUser: (user: UserType) => void;
  onLogout: () => void;
  onNavigate: (tab: 'home' | 'search' | 'cart' | 'orders' | 'profile') => void;
  onNotify: (message: string, type?: 'success' | 'error' | 'info') => void;
  theme: CustomerTheme;
}

export default function CustomerProfile({ user, onUpdateUser, onLogout, onNavigate, onNotify, theme }: Props) {
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
      const userRef = doc(db, 'users', user._id);
      const cleanUpdates = JSON.parse(JSON.stringify(updates));

      await updateDoc(userRef, cleanUpdates);
      onUpdateUser({ ...user, ...updates });

      if (successMessage) notify(successMessage, 'success');
      return true;
    } catch (e: any) {
      console.error(e);
      notify(`Guncelleme basarisiz: ${e.message}`, 'error');
      return false;
    }
  };

  const saveProfile = async () => {
    const ok = await updateUser(
      {
        name: editUser.name || '',
        username: editUser.username || user.email?.split('@')[0] || 'kullanici',
        phone: editUser.phone || ''
      },
      'Profil kaydedildi.'
    );

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
    const next = (user.addresses || []).filter((address) => address.id !== id);
    await updateUser({ addresses: next }, 'Adres silindi.');
  };

  const setDefaultAddress = async (id: string) => {
    const next = (user.addresses || []).map((address) => ({ ...address, isDefault: address.id === id }));
    await updateUser({ addresses: next }, 'Varsayilan adres guncellendi.');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={[styles.avatar, { backgroundColor: theme.accent }]}>
          <User size={40} color={theme.accentContrast} />
        </View>
        <Text style={[styles.name, { color: theme.textPrimary }]}>{user.name}</Text>
        <Text style={[styles.muted, { color: theme.textMuted }]}>{user.email}</Text>
        <Text style={[styles.muted, { color: theme.textMuted }]}>@{user.username || 'misafir'}</Text>
      </View>

      <TouchableOpacity style={[styles.rowCard, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => setProfileModalVisible(true)}>
        <User size={20} color={theme.textSecondary} />
        <Text style={[styles.rowText, { color: theme.textSecondary }]}>Hesap Bilgileri</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.rowCard, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => onNavigate('orders')}>
        <Receipt size={20} color={theme.textSecondary} />
        <Text style={[styles.rowText, { color: theme.textSecondary }]}>Siparislerim</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.rowCard, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => setAddressModalVisible(true)}>
        <MapPin size={20} color={theme.textSecondary} />
        <Text style={[styles.rowText, { color: theme.textSecondary }]}>Adreslerim ({user.addresses?.length || 0})</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onLogout}
        style={[
          styles.rowCard,
          styles.logoutRow,
          { backgroundColor: theme.dangerBackground, borderColor: theme.dangerBorder }
        ]}
      >
        <LogOut size={20} color={theme.danger} />
        <Text style={[styles.rowText, { color: theme.danger }]}>Cikis Yap</Text>
      </TouchableOpacity>

      <Modal visible={profileModalVisible} transparent animationType="fade">
        <View style={[styles.modalOverlay, { backgroundColor: theme.modalOverlay }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Profili Duzenle</Text>

            <TextInput
              placeholder="Ad Soyad"
              placeholderTextColor={theme.textMuted}
              style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.textPrimary }]}
              value={editUser.name || ''}
              onChangeText={(t) => setEditUser({ ...editUser, name: t })}
            />

            <TextInput
              placeholder="E-posta"
              placeholderTextColor={theme.textMuted}
              style={[styles.input, { backgroundColor: theme.surfaceAlt, color: theme.textMuted }]}
              value={editUser.email || ''}
              editable={false}
            />

            <TextInput
              placeholder="Telefon"
              placeholderTextColor={theme.textMuted}
              style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.textPrimary }]}
              value={editUser.phone || ''}
              keyboardType="phone-pad"
              onChangeText={(t) => setEditUser({ ...editUser, phone: t })}
            />

            <TouchableOpacity onPress={saveProfile} style={[styles.primaryBtn, { backgroundColor: theme.accent }]}>
              <Text style={[styles.btnText, { color: theme.accentContrast }]}>Kaydet</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setProfileModalVisible(false)} style={styles.closeButton}>
              <Text style={{ color: theme.textMuted }}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={addressModalVisible} transparent animationType="fade">
        <View style={[styles.modalOverlay, { backgroundColor: theme.modalOverlay }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Adreslerim</Text>

            <ScrollView style={styles.addressScroll}>
              {(user.addresses || []).length === 0 && (
                <Text style={{ color: theme.textMuted, fontStyle: 'italic' }}>Kayitli adres yok.</Text>
              )}

              {(user.addresses || []).map((address) => (
                <View
                  key={address.id}
                  style={[
                    styles.addressItem,
                    { backgroundColor: theme.surfaceAlt, borderColor: theme.border }
                  ]}
                >
                  <TouchableOpacity style={styles.addressInfo} onPress={() => setDefaultAddress(address.id)}>
                    <View style={styles.addressHead}>
                      {address.isDefault ? (
                        <Check size={16} color={theme.accent} />
                      ) : (
                        <View style={[styles.dot, { borderColor: theme.border }]} />
                      )}
                      <Text style={[styles.addressTitle, { color: theme.textPrimary }]}>{address.title}</Text>
                    </View>
                    <Text style={[styles.addressText, { color: theme.textMuted }]}>{address.fullAddress}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => deleteAddress(address.id)} style={styles.deleteAddressButton}>
                    <Trash2 color={theme.danger} size={18} />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>

            <View style={[styles.addAddressSection, { borderColor: theme.border }]}>
              <Text style={[styles.addAddressTitle, { color: theme.textSecondary }]}>Yeni Adres Ekle</Text>

              <TextInput
                placeholder="Baslik (Ev, Is)"
                placeholderTextColor={theme.textMuted}
                style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.textPrimary }]}
                value={addressForm.title}
                onChangeText={(t) => setAddressForm({ ...addressForm, title: t })}
              />

              <TextInput
                placeholder="Acik Adres"
                placeholderTextColor={theme.textMuted}
                style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.textPrimary }]}
                value={addressForm.fullAddress}
                onChangeText={(t) => setAddressForm({ ...addressForm, fullAddress: t })}
              />

              <TouchableOpacity onPress={addAddress} style={[styles.primaryBtn, { backgroundColor: theme.accent }]}>
                <Text style={[styles.btnText, { color: theme.accentContrast }]}>Adres Ekle</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={() => setAddressModalVisible(false)} style={styles.closeButton}>
              <Text style={{ color: theme.textMuted }}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  card: {
    alignItems: 'center',
    marginBottom: 20,
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    borderWidth: 1
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10
  },
  name: { fontSize: 20, fontWeight: 'bold' },
  muted: { marginTop: 2, fontSize: 14 },
  rowCard: {
    flexDirection: 'row',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
    borderWidth: 1
  },
  rowText: { marginLeft: 12, fontWeight: '600', fontSize: 15 },
  logoutRow: {},
  modalOverlay: { flex: 1, justifyContent: 'center', padding: 20 },
  modalContent: {
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 1
  },
  modalTitle: { fontWeight: 'bold', fontSize: 18, marginBottom: 15, textAlign: 'center' },
  input: { padding: 12, borderRadius: 10, marginBottom: 12, fontSize: 15 },
  primaryBtn: { padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 5 },
  btnText: { fontWeight: 'bold', fontSize: 15 },
  closeButton: { marginTop: 15, alignSelf: 'center' },
  addressScroll: { maxHeight: 220, marginBottom: 15 },
  addressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1
  },
  addressInfo: { flex: 1 },
  addressHead: { flexDirection: 'row', alignItems: 'center' },
  addressTitle: { fontWeight: 'bold', marginLeft: 8 },
  addressText: { marginTop: 4, fontSize: 12 },
  deleteAddressButton: { padding: 5 },
  addAddressSection: { borderTopWidth: 1, paddingTop: 15 },
  addAddressTitle: { fontSize: 12, fontWeight: 'bold', marginBottom: 5 },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2 }
});
