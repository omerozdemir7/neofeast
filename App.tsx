import React, { useEffect, useRef, useState } from 'react';
import { UserType, Restaurant, Order } from './src/types';
// API_URL artık kullanılmıyor, silebilirsin.
import { auth, db } from './src/firebaseConfig'; // Firebase import
import { collection, onSnapshot, doc, getDoc } from 'firebase/firestore'; 
import { onAuthStateChanged } from 'firebase/auth';

// Ekranları İçe Aktar
import AuthScreen from './src/screens/AuthScreen';
import CustomerDashboard from './src/screens/CustomerDashboard';
import AdminPanel from './src/screens/AdminPanel';
import SellerPanel from './src/screens/SellerPanel';
import ToastMessage from './src/components/ToastMessage';

type ToastType = 'success' | 'error' | 'info';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [toast, setToast] = useState<{ message: string; type: ToastType; visible: boolean }>({
    message: '',
    type: 'info',
    visible: false
  });
  const toastTimer = useRef<NodeJS.Timeout | null>(null);

  const showToast = (message: string, type: ToastType = 'info') => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, type, visible: true });
    toastTimer.current = setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 2400);
  };

  // Kullanıcı giriş durumunu dinle (Otomatik Giriş)
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Firestore'dan detayları çek
        const docRef = doc(db, "users", firebaseUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setCurrentUser(docSnap.data() as UserType);
        }
      } else {
        setCurrentUser(null);
      }
    });
    return () => unsubAuth();
  }, []);

  // Firebase Real-time Listeners (Veri değişince anında gelir)
  useEffect(() => {
    // 1. Restoranları Dinle
    const unsubRest = onSnapshot(collection(db, "restaurants"), (snapshot) => {
      const list = snapshot.docs.map(doc => ({ _id: doc.id, ...doc.data() } as Restaurant));
      setRestaurants(list);
    });

    // 2. Siparişleri Dinle
    const unsubOrder = onSnapshot(collection(db, "orders"), (snapshot) => {
      // Order ID'si döküman ID'si olsun
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      // Tarihe göre sırala (Yeni en üstte)
      list.sort((a, b) => (b.date > a.date ? 1 : -1)); 
      setOrders(list);
    });

    return () => {
      unsubRest();
      unsubOrder();
    };
  }, []);

  // --- EKRAN YÖNETİMİ ---
  let content: React.ReactElement;
  if (!currentUser) {
    content = <AuthScreen onLogin={(user) => setCurrentUser(user)} />;
  } else if (currentUser.role === 'admin') {
    content = <AdminPanel restaurants={restaurants} onLogout={() => auth.signOut()} refreshData={() => {}} />;
  } else if (currentUser.role === 'seller') {
    content = (
      <SellerPanel
        user={currentUser}
        restaurants={restaurants}
        orders={orders}
        onLogout={() => auth.signOut()}
        refreshData={() => {}}
      />
    );
  } else {
    content = (
      <CustomerDashboard
        user={currentUser}
        restaurants={restaurants}
        orders={orders}
        onLogout={() => auth.signOut()}
        refreshData={() => {}} // Firebase otomatik günceller, buna gerek yok
        onUpdateUser={(nextUser) => setCurrentUser(nextUser)}
        onNotify={showToast}
      />
    );
  }

  return (
    <>
      {content}
      <ToastMessage
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onHide={() => setToast((prev) => ({ ...prev, visible: false }))}
      />
    </>
  );
}