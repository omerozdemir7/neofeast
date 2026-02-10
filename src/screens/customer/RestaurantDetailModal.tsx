import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, Modal, StyleSheet, PanResponder, Animated, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, X } from 'lucide-react-native';
import { Restaurant, MenuItem } from '../../types';
import { CustomerTheme } from './theme';

interface Props {
  visible: boolean;
  restaurant: Restaurant | null;
  onClose: () => void;
  onAddToCart: (item: MenuItem, restaurant: Restaurant) => void;
  theme: CustomerTheme;
}

export default function RestaurantDetailModal({ visible, restaurant, onClose, onAddToCart, theme }: Props) {
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const scrollOffsetRef = useRef(0);
  const isClosingRef = useRef(false);
  const translateY = useRef(new Animated.Value(0)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const sheetHeight = useMemo(() => {
    const preferred = screenHeight * 0.82;
    const maxAllowed = screenHeight - Math.max(insets.top + 24, 32);
    return Math.min(Math.max(420, preferred), maxAllowed);
  }, [insets.top, screenHeight]);

  const closeSheet = useCallback(() => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: sheetHeight,
        duration: 220,
        useNativeDriver: true
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true
      })
    ]).start(() => {
      isClosingRef.current = false;
      onClose();
    });
  }, [backdropOpacity, onClose, sheetHeight, translateY]);

  useEffect(() => {
    if (!visible) return;

    isClosingRef.current = false;
    translateY.setValue(sheetHeight);
    backdropOpacity.setValue(0);

    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        speed: 16,
        bounciness: 2
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0.45,
        duration: 180,
        useNativeDriver: true
      })
    ]).start();
  }, [backdropOpacity, sheetHeight, translateY, visible]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) => {
          const isVerticalSwipe = Math.abs(gesture.dy) > Math.abs(gesture.dx);
          const pullingDownFromTop = scrollOffsetRef.current <= 0 && gesture.dy > 10;
          return isVerticalSwipe && pullingDownFromTop;
        },
        onPanResponderMove: (_, gesture) => {
          const nextTranslate = Math.max(0, gesture.dy);
          translateY.setValue(nextTranslate);

          const nextOpacity = Math.max(0, 0.45 - nextTranslate / (sheetHeight * 1.25));
          backdropOpacity.setValue(nextOpacity);
        },
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dy > 110 || gesture.vy > 1.25) {
            closeSheet();
            return;
          }

          Animated.parallel([
            Animated.spring(translateY, {
              toValue: 0,
              useNativeDriver: true,
              speed: 18,
              bounciness: 1
            }),
            Animated.timing(backdropOpacity, {
              toValue: 0.45,
              duration: 120,
              useNativeDriver: true
            })
          ]).start();
        }
      }),
    [backdropOpacity, closeSheet, sheetHeight, translateY]
  );

  if (!restaurant) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={closeSheet}>
      <View style={styles.overlay}>
        <TouchableOpacity activeOpacity={1} style={StyleSheet.absoluteFill} onPress={closeSheet}>
          <Animated.View style={[styles.backdrop, { opacity: backdropOpacity, backgroundColor: theme.modalOverlay }]} />
        </TouchableOpacity>

        <Animated.View
          style={[
            styles.sheet,
            {
              height: sheetHeight + insets.bottom,
              backgroundColor: theme.background,
              transform: [{ translateY }]
            }
          ]}
          {...panResponder.panHandlers}
        >
          <SafeAreaView edges={['bottom']} style={styles.safeBottom}>
            <View style={styles.sheetHeader}>
              <View style={[styles.grabHandle, { backgroundColor: theme.border }]} />
              <TouchableOpacity
                onPress={closeSheet}
                style={[styles.closeBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
                accessibilityRole="button"
                accessibilityLabel="Detay ekranini kapat"
              >
                <X size={20} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              onScroll={(event) => {
                scrollOffsetRef.current = Math.max(0, event.nativeEvent.contentOffset.y);
              }}
              scrollEventThrottle={16}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.scrollContent}
            >
              <Image source={{ uri: restaurant.image }} style={styles.heroImage} />
              <View style={styles.content}>
                <Text style={[styles.title, { color: theme.textPrimary }]}>{restaurant.name}</Text>
                <Text style={[styles.category, { color: theme.textMuted }]}>{restaurant.category}</Text>
                <Text style={[styles.menuTitle, { color: theme.textPrimary }]}>Menu</Text>

                {(restaurant.menu || []).map((menuItem) => (
                  <View key={menuItem.id} style={[styles.rowCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    {menuItem.imageUrl ? <Image source={{ uri: menuItem.imageUrl }} style={styles.menuThumb} /> : null}
                    <View style={styles.menuInfo}>
                      <Text style={[styles.menuName, { color: theme.textPrimary }]}>{menuItem.name}</Text>
                      <Text style={[styles.menuDescription, { color: theme.textMuted }]}>{menuItem.description}</Text>
                      <Text style={[styles.menuPrice, { color: theme.accent }]}>{menuItem.price} TL</Text>
                    </View>
                    <TouchableOpacity onPress={() => onAddToCart(menuItem, restaurant)} style={[styles.addBtn, { backgroundColor: theme.accent }]}>
                      <Plus color={theme.accentContrast} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </ScrollView>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { flex: 1 },
  sheet: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    overflow: 'hidden'
  },
  safeBottom: { flex: 1 },
  sheetHeader: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
    paddingBottom: 8
  },
  grabHandle: { width: 52, height: 5, borderRadius: 3 },
  closeBtn: {
    position: 'absolute',
    right: 14,
    top: 4,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1
  },
  scrollContent: { paddingBottom: 24 },
  heroImage: { width: '100%', height: 180 },
  content: { padding: 18, paddingTop: 14 },
  title: { fontSize: 24, fontWeight: 'bold' },
  category: { marginBottom: 10 },
  menuTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  rowCard: {
    flexDirection: 'row',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 1,
    borderWidth: 1
  },
  menuInfo: { flex: 1 },
  menuThumb: { width: 56, height: 56, borderRadius: 8, marginRight: 10, backgroundColor: '#E5E7EB' },
  menuName: { fontWeight: 'bold' },
  menuDescription: { fontSize: 12 },
  menuPrice: { fontWeight: 'bold' },
  addBtn: { padding: 8, borderRadius: 20 }
});
