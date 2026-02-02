import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, SafeAreaView, Alert, Modal } from 'react-native';
import { LogOut, Trash2, Plus } from 'lucide-react-native';
import { Restaurant } from '../types';
// Firebase importları
import { db } from '../firebaseConfig';
import { collection, addDoc, deleteDoc, doc } from 'firebase/firestore';

interface Props {
  restaurants: Restaurant[];
  onLogout: () => void;
  refreshData: () => void; // Firebase'de buna gerek kalmadı ama prop hatası vermesin diye tutuyoruz
}

export default function AdminPanel({ restaurants, onLogout }: Props) {
  const [modalVisible, setModalVisible] = useState(false);
  const [newRest, setNewRest] = useState({ name: '', category: '', deliveryTime: '', image: '' });

  const addRest = async () => {
    if(!newRest.name || !newRest.category) {
        Alert.alert("Hata", "Lütfen isim ve kategori girin.");
        return;
    }

    try {
        // Firestore 'restaurants' koleksiyonuna ekle
        await addDoc(collection(db, "restaurants"), {
            ...newRest,
            rating: 5,
            menu: [], // Boş menü ile başlatıyoruz
            createdAt: new Date().toISOString()
        });
        
        Alert.alert("Başarılı", "Restoran eklendi.");
        setModalVisible(false);
        setNewRest({ name: '', category: '', deliveryTime: '', image: '' });
    } catch (e: any) {
        Alert.alert("Hata", e.message);
    }
  };

  const deleteRest = async (id: string) => {
    Alert.alert("Sil", "Bu restoranı silmek istiyor musun?", [
        { text: "İptal", style: "cancel" },
        { text: "Sil", style: "destructive", onPress: async () => {
            try {
                // Firestore'dan sil (id burada document ID olmalı)
                await deleteDoc(doc(db, "restaurants", id));
            } catch (e: any) {
                Alert.alert("Hata", "Silinemedi: " + e.message);
            }
        }}
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor:'#F3F4F6' }}>
      <View style={styles.header}>
        <Text style={styles.title}>Admin Paneli (Firebase)</Text>
        <TouchableOpacity onPress={onLogout}><LogOut color="white" /></TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:20}}>
            <Text style={{fontWeight:'bold', fontSize:18, color:'#1F2937'}}>Restoranlar ({restaurants.length})</Text>
            <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addBtn}>
                <Plus color="white" size={16} />
                <Text style={{ color: 'white', fontWeight:'bold', marginLeft: 4 }}>Ekle</Text>
            </TouchableOpacity>
        </View>

        {restaurants.map(r => (
          <View key={r._id} style={styles.card}>
            <View style={{flex:1}}>
                <Text style={{ fontWeight: 'bold', fontSize:16 }}>{r.name}</Text>
                <Text style={{color:'gray'}}>{r.category} • {r.deliveryTime}</Text>
            </View>
            <TouchableOpacity onPress={() => deleteRest(r._id)} style={{padding:10}}>
                <Trash2 color="#EF4444" size={20} />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* Restoran Ekle Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={{ fontSize:18, fontWeight: 'bold', marginBottom: 15 }}>Yeni Restoran Ekle</Text>
            
            <TextInput placeholder="Restoran Adı" style={styles.input} onChangeText={t => setNewRest({ ...newRest, name: t })} />
            <TextInput placeholder="Kategori (Örn: Burger)" style={styles.input} onChangeText={t => setNewRest({ ...newRest, category: t })} />
            <TextInput placeholder="Teslimat (Örn: 30 dk)" style={styles.input} onChangeText={t => setNewRest({ ...newRest, deliveryTime: t })} />
            <TextInput placeholder="Resim URL (https://...)" style={styles.input} onChangeText={t => setNewRest({ ...newRest, image: t })} />
            
            <TouchableOpacity onPress={addRest} style={styles.saveBtn}>
                <Text style={{ color: 'white', fontWeight:'bold' }}>Kaydet</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={{ marginTop: 15, alignSelf: 'center' }}>
                <Text style={{color:'red'}}>İptal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { padding: 20, paddingTop:40, backgroundColor: '#1F2937', flexDirection: 'row', justifyContent: 'space-between', alignItems:'center' },
  title: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  card: { flexDirection: 'row', backgroundColor: 'white', padding: 15, marginBottom: 10, borderRadius: 10, alignItems: 'center', elevation:1 },
  addBtn: { backgroundColor: '#2563EB', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: 'white', padding: 20, borderRadius: 15 },
  input: { borderWidth: 1, borderColor: '#E5E7EB', padding: 12, borderRadius: 8, marginBottom: 12, backgroundColor:'#F9FAFB' },
  saveBtn: { backgroundColor: '#10B981', padding: 15, borderRadius: 8, alignItems: 'center' }
});