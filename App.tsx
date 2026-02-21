import React, { useEffect, useRef, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { UserType, Restaurant, Order, Promotion, AppNotification } from './src/types';
// API_URL artık kullanılmıyor, silebilirsin.
import { auth, db } from './src/firebaseConfig'; // Firebase import
import { collection, onSnapshot, doc, getDoc, query, orderBy, limit } from 'firebase/firestore'; 
import { onAuthStateChanged } from 'firebase/auth';

// Ekranları İçe Aktar
import AuthScreen from './src/screens/AuthScreen';
import CustomerDashboard from './src/screens/CustomerDashboard';
import AdminPanel from './src/screens/AdminPanel';
import SellerPanel from './src/screens/SellerPanel';
import ToastMessage from './src/components/ToastMessage';
import { registerUserPushToken } from './src/services/pushNotifications';

type ToastType = 'success' | 'error' | 'info';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showLaunchSplash, setShowLaunchSplash] = useState(true);
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

  useEffect(() => {
    const timer = setTimeout(() => setShowLaunchSplash(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!currentUser?._id) return;
    registerUserPushToken(currentUser._id).catch(() => {});
  }, [currentUser?._id]);

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
          const data = promoDoc.data() as Omit<Partial<Promotion>, 'startsAt' | 'endsAt'> & {
            startsAt?: number | { toMillis?: () => number };
            endsAt?: number | { toMillis?: () => number };
          };

          let startsAtValue: number | undefined;
          if (typeof data.startsAt === "number") {
            startsAtValue = data.startsAt;
          } else if (
            data.startsAt &&
            typeof data.startsAt === "object" &&
            typeof data.startsAt.toMillis === "function"
          ) {
            startsAtValue = data.startsAt.toMillis();
          }

          let endsAtValue: number | undefined;
          if (typeof data.endsAt === "number") {
            endsAtValue = data.endsAt;
          } else if (
            data.endsAt &&
            typeof data.endsAt === "object" &&
            typeof data.endsAt.toMillis === "function"
          ) {
            endsAtValue = data.endsAt.toMillis();
          }

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
            startsAt: startsAtValue,
            endsAt: endsAtValue,
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

    const notificationQuery = query(collection(db, "notifications"), orderBy("createdAt", "desc"), limit(150));
    const unsubNotification = onSnapshot(notificationQuery, (snapshot) => {
      const list = snapshot.docs
        .map((notificationDoc) => {
          const data = notificationDoc.data() as Omit<Partial<AppNotification>, 'createdAt'> & {
            createdAt?: number | string | { toMillis?: () => number };
          };

          let createdAtValue = 0;
          if (typeof data.createdAt === "number") {
            createdAtValue = data.createdAt;
          } else if (typeof data.createdAt === "string") {
            createdAtValue = Date.parse(data.createdAt) || 0;
          } else if (
            data.createdAt &&
            typeof data.createdAt === "object" &&
            typeof data.createdAt.toMillis === "function"
          ) {
            createdAtValue = data.createdAt.toMillis();
          }

          return {
            id: notificationDoc.id,
            title: typeof data.title === "string" ? data.title : "Bildirim",
            message: typeof data.message === "string" ? data.message : "",
            type: data.type === "promotion"
              ? "promotion"
              : data.type === "order_status"
                ? "order_status"
                : "manual",
            targetType: data.targetType === "users" ? "users" : "all",
            targetUserIds: Array.isArray(data.targetUserIds) ? data.targetUserIds.filter((id): id is string => typeof id === "string") : [],
            relatedPromoCode: typeof data.relatedPromoCode === "string" ? data.relatedPromoCode : null,
            relatedOrderId: typeof data.relatedOrderId === "string" ? data.relatedOrderId : null,
            createdAt: createdAtValue,
            createdBy: typeof data.createdBy === "string" ? data.createdBy : undefined,
            readBy: Array.isArray(data.readBy) ? data.readBy.filter((id): id is string => typeof id === "string") : []
          } as AppNotification;
        })
        .sort((a, b) => b.createdAt - a.createdAt);

      setNotifications(list);
    });

    return () => {
      unsubRest();
      unsubOrder();
      unsubPromo();
      unsubNotification();
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
        notifications={notifications}
        onLogout={() => auth.signOut()}
        refreshData={() => {}} // Firebase otomatik günceller, buna gerek yok
        onUpdateUser={(nextUser) => setCurrentUser(nextUser)}
        onNotify={showToast}
      />
    );
  }

  return (
    <SafeAreaProvider>
      <View style={styles.root}>
        {content}
        <ToastMessage
          message={toast.message}
          type={toast.type}
          visible={toast.visible}
          onHide={() => setToast((prev) => ({ ...prev, visible: false }))}
        />
        {showLaunchSplash && (
          <View style={styles.launchSplash}>
            <Image source={require('./assets/splash1.png')} resizeMode="contain" style={styles.launchLogo} />
          </View>
        )}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  launchSplash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24
  },
  launchLogo: {
    width: '100%',
    maxWidth: 400,
    maxHeight: 400,
    aspectRatio: 1, // Logonun orantısını koru
  }
});
