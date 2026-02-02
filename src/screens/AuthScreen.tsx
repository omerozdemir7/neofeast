import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { ChefHat } from 'lucide-react-native';
import { auth, db } from '../firebaseConfig'; 
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export default function AuthScreen({ onLogin }: { onLogin: (user: any) => void }) {
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Form Verileri
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleAuth = async () => {
    if (!email || !password) return Alert.alert('Hata', 'Lütfen e-posta ve şifre giriniz.');
    if (isRegister && !name) return Alert.alert('Hata', 'Lütfen isminizi giriniz.');
    
    setLoading(true);

    try {
      if (isRegister) {
        // --- KAYIT OLMA ---
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // E-postadan kullanıcı adı üret (örn: ahmet@gmail.com -> ahmet)
        const generatedUsername = email.split('@')[0];

        const userData = {
          _id: user.uid,
          email: user.email,
          name: name,
          username: generatedUsername, // EKLENDİ: Artık undefined olmayacak
          role: 'customer',
          addresses: [],
          favorites: [],
          createdAt: new Date().toISOString()
        };
        
        await setDoc(doc(db, "users", user.uid), userData);
        onLogin(userData);

      } else {
        // --- GİRİŞ YAPMA ---
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          onLogin(docSnap.data());
        } else {
          Alert.alert("Hata", "Kullanıcı profili bulunamadı.");
        }
      }
    } catch (error: any) {
      let msg = error.message;
      if (msg.includes('invalid-email')) msg = 'Geçersiz e-posta adresi.';
      if (msg.includes('user-not-found')) msg = 'Kullanıcı bulunamadı.';
      if (msg.includes('wrong-password')) msg = 'Şifre hatalı.';
      if (msg.includes('email-already-in-use')) msg = 'Bu e-posta zaten kullanımda.';
      if (msg.includes('weak-password')) msg = 'Şifre en az 6 karakter olmalı.';
      Alert.alert("İşlem Başarısız", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <ChefHat size={80} color="#EA580C" />
        <Text style={styles.title}>NEOFEAST</Text>
        <Text style={styles.subtitle}>{isRegister ? 'Yeni Hesap Oluştur' : 'Tekrar Hoş Geldiniz'}</Text>
      </View>
      
      <View style={styles.form}>
        <TextInput 
          placeholder="E-posta" 
          placeholderTextColor="#6B7280" 
          style={styles.input} 
          autoCapitalize="none" 
          value={email}
          onChangeText={setEmail} 
          keyboardType="email-address"
        />
        
        <TextInput 
          placeholder="Şifre" 
          placeholderTextColor="#6B7280" 
          style={styles.input} 
          secureTextEntry 
          value={password}
          onChangeText={setPassword} 
        />
        
        {isRegister && (
          <TextInput 
            placeholder="Ad Soyad" 
            placeholderTextColor="#6B7280" 
            style={styles.input} 
            value={name}
            onChangeText={setName} 
          />
        )}

        <TouchableOpacity style={styles.btn} onPress={handleAuth} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.btnText}>{isRegister ? 'KAYIT OL' : 'GİRİŞ YAP'}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setIsRegister(!isRegister)} style={styles.switchBtn}>
          <Text style={styles.switchText}>
            {isRegister ? 'Zaten hesabın var mı? Giriş Yap' : 'Hesabın yok mu? Kayıt Ol'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: 'white' },
  logoContainer: { alignItems: 'center', marginBottom: 40 },
  title: { fontSize: 32, fontWeight: '900', color: '#1F2937', marginTop: 10 },
  subtitle: { fontSize: 16, color: 'gray', marginTop: 5 },
  form: { width: '100%' },
  input: { backgroundColor: '#F3F4F6', padding: 15, borderRadius: 12, marginBottom: 15, fontSize: 16, color: '#1F2937' },
  btn: { backgroundColor: '#EA580C', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10, shadowColor: '#EA580C', shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  switchBtn: { marginTop: 20, alignSelf: 'center', padding: 10 },
  switchText: { color: '#EA580C', fontWeight: '600' }
});