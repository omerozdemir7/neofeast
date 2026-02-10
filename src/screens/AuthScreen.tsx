import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, Keyboard, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import { ChefHat, Eye, EyeOff } from 'lucide-react-native';
import { auth, db } from '../firebaseConfig';
import { createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function AuthScreen({ onLogin }: { onLogin: (user: any) => void }) {
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleAuth = async () => {
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) return Alert.alert('Hata', 'Lutfen e-posta ve sifre giriniz.');
    if (isRegister && !name.trim()) return Alert.alert('Hata', 'Lutfen isminizi giriniz.');

    setLoading(true);

    try {
      if (isRegister) {
        const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        const user = userCredential.user;
        const generatedUsername = cleanEmail.split('@')[0];

        const userData = {
          _id: user.uid,
          email: user.email,
          name: name.trim(),
          username: generatedUsername,
          role: 'customer',
          addresses: [],
          favorites: [],
          createdAt: new Date().toISOString()
        };

        await setDoc(doc(db, 'users', user.uid), userData);
        onLogin(userData);
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
        const user = userCredential.user;

        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          onLogin(docSnap.data());
        } else {
          Alert.alert('Hata', 'Kullanici profili bulunamadi.');
        }
      }
    } catch (error: any) {
      let msg = error.message;
      if (msg.includes('invalid-email')) msg = 'Gecersiz e-posta adresi.';
      if (msg.includes('user-not-found')) msg = 'Kullanici bulunamadi.';
      if (msg.includes('wrong-password')) msg = 'Sifre hatali.';
      if (msg.includes('email-already-in-use')) msg = 'Bu e-posta zaten kullanimda.';
      if (msg.includes('weak-password')) msg = 'Sifre en az 6 karakter olmali.';
      Alert.alert('Islem Basarisiz', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      Alert.alert('Bilgi', 'Sifre sifirlama icin once e-posta adresinizi girin.');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      Alert.alert('Basarili', 'Sifre sifirlama maili gonderildi. Lutfen e-postanizi kontrol edin.');
    } catch (error: any) {
      let msg = error.message || 'Sifre sifirlama maili gonderilemedi.';
      if (msg.includes('invalid-email')) msg = 'Gecersiz e-posta adresi.';
      if (msg.includes('user-not-found')) msg = 'Bu e-posta ile kayitli kullanici bulunamadi.';
      Alert.alert('Hata', msg);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        <View style={styles.logoContainer}>
          <ChefHat size={80} color="#EA580C" />
          <Text style={styles.title}>NEOFEAST</Text>
          <Text style={styles.subtitle}>{isRegister ? 'Yeni Hesap Olustur' : 'Tekrar Hos Geldiniz'}</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            placeholder="E-posta"
            placeholderTextColor="#6B7280"
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <View style={styles.passwordRow}>
            <TextInput
              placeholder="Sifre"
              placeholderTextColor="#6B7280"
              style={[styles.input, styles.passwordInput]}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity
              style={styles.showPasswordBtn}
              onPress={() => setShowPassword((prev) => !prev)}
              accessibilityRole="button"
              accessibilityLabel={showPassword ? 'Sifreyi gizle' : 'Sifreyi goster'}
            >
              {showPassword ? <EyeOff size={16} color="#4B5563" /> : <Eye size={16} color="#4B5563" />}
              <Text style={styles.showPasswordText}>{showPassword ? 'Gizle' : 'Goster'}</Text>
            </TouchableOpacity>
          </View>

          {!isRegister && (
            <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotBtn}>
              <Text style={styles.forgotText}>Sifreni mi unuttun?</Text>
            </TouchableOpacity>
          )}

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
            {loading ? <ActivityIndicator color="white" /> : <Text style={styles.btnText}>{isRegister ? 'KAYIT OL' : 'GIRIS YAP'}</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setIsRegister(!isRegister)} style={styles.switchBtn}>
            <Text style={styles.switchText}>
              {isRegister ? 'Zaten hesabin var mi? Giris Yap' : 'Hesabin yok mu? Kayit Ol'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: 'white' },
  logoContainer: { alignItems: 'center', marginBottom: 40 },
  title: { fontSize: 32, fontWeight: '900', color: '#1F2937', marginTop: 10 },
  subtitle: { fontSize: 16, color: 'gray', marginTop: 5 },
  form: { width: '100%' },
  input: { backgroundColor: '#F3F4F6', padding: 15, borderRadius: 12, marginBottom: 15, fontSize: 16, color: '#1F2937' },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    marginBottom: 6
  },
  passwordInput: { flex: 1, marginBottom: 0, backgroundColor: 'transparent' },
  showPasswordBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10 },
  showPasswordText: { marginLeft: 5, color: '#4B5563', fontWeight: '600', fontSize: 12 },
  forgotBtn: { alignSelf: 'flex-end', paddingVertical: 6, marginBottom: 8 },
  forgotText: { color: '#2563EB', fontWeight: '600', fontSize: 13 },
  btn: {
    backgroundColor: '#EA580C',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#EA580C',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5
  },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  switchBtn: { marginTop: 20, alignSelf: 'center', padding: 10 },
  switchText: { color: '#EA580C', fontWeight: '600' }
});
