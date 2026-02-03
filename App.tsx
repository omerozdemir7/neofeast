import React, { useEffect, useRef, useState } from 'react';
import { UserType, Restaurant, Order, Promotion } from './src/types';
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
  const [promotions, setPromotions] = useState<Promotion[]>([]);
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
      const list = snapshot.docs.map((restaurantDoc) => {
        const data = restaurantDoc.data() as Omit<Restaurant, '_id'>;
        return { ...data, _id: restaurantDoc.id } as Restaurant;
      });
      setRestaurants(list);
    });

    // 2. Siparişleri Dinle
    const unsubOrder = onSnapshot(collection(db, "orders"), (snapshot) => {
      // Order ID'si döküman ID'si olsun
      const list = snapshot.docs.map((orderDoc) => {
        const data = orderDoc.data() as Omit<Order, 'id'>;
        return { ...data, id: orderDoc.id } as Order;
      });
      // Tarihe göre sırala (Yeni en üstte)
      list.sort((a, b) => {
        const aTime = typeof a.createdAt === 'number' ? a.createdAt : Date.parse(a.date || '') || 0;
        const bTime = typeof b.createdAt === 'number' ? b.createdAt : Date.parse(b.date || '') || 0;
        return bTime - aTime;
      });
      setOrders(list);
    });

    const unsubPromo = onSnapshot(collection(db, "promos"), (snapshot) => {
      const list = snapshot.docs
        .map((promoDoc) => {
          const data = promoDoc.data() as Partial<Promotion> & {
            startsAt?: { toMillis?: () => number };
            endsAt?: { toMillis?: () => number };
          };

          return {
            id: promoDoc.id,
            title: data.title || "Kampanya",
            code: (data.code || promoDoc.id).toUpperCase(),
            imageUrl: data.imageUrl || "https://images.unsplash.com/photo-1556740749-887f6717d7e4?w=1200",
            type: data.type === "amount" ? "amount" : "percent",
            value: typeof data.value === "number" ? data.value : 0,
            active: data.active !== false,
            minOrderTotal: typeof data.minOrderTotal === "number" ? data.minOrderTotal : 0,
            maxDiscountAmount: typeof data.maxDiscountAmount === "number" ? data.maxDiscountAmount : undefined,
            targetUserIds: Array.isArray(data.targetUserIds) ? data.targetUserIds.filter((id): id is string => typeof id === "string") : [],
            startsAt: data.startsAt?.toMillis?.(),
            endsAt: data.endsAt?.toMillis?.(),
            createdAt: typeof data.createdAt === "string" ? data.createdAt : undefined
          } as Promotion;
        })
        .filter((promo) => promo.value > 0)
        .sort((a, b) => {
          const aTime = Date.parse(a.createdAt || '') || 0;
          const bTime = Date.parse(b.createdAt || '') || 0;
          return bTime - aTime;
        });

      setPromotions(list);
    });

    return () => {
      unsubRest();
      unsubOrder();
      unsubPromo();
    };
  }, []);

  // --- EKRAN YÖNETİMİ ---
  let content: React.ReactElement;
  if (!currentUser) {
    content = <AuthScreen onLogin={(user) => setCurrentUser(user)} />;
  } else if (currentUser.role === 'admin') {
    content = (
      <AdminPanel
        restaurants={restaurants}
        orders={orders}
        promotions={promotions}
        onLogout={() => auth.signOut()}
        refreshData={() => {}}
      />
    );
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
        promotions={promotions}
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
