import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, Platform } from 'react-native';

type ToastType = 'success' | 'error' | 'info';

interface Props {
  message: string;
  type?: ToastType;
  visible: boolean;
  duration?: number;
  onHide: () => void;
}

const COLORS: Record<ToastType, string> = {
  success: '#16A34A',
  error: '#DC2626',
  info: '#1F2937'
};

export default function ToastMessage({ message, type = 'info', visible, duration = 2200, onHide }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    if (!visible) return;

    opacity.setValue(0);
    translateY.setValue(10);
    
    // HATA ÇÖZÜMÜ: Web'de native driver desteklenmez, false olmalı.
    const useNative = Platform.OS !== 'web';

    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: useNative }),
      Animated.timing(translateY, { toValue: 0, duration: 180, useNativeDriver: useNative })
    ]).start();

    const timer = setTimeout(() => onHide(), duration);
    return () => clearTimeout(timer);
  }, [visible, duration, onHide, opacity, translateY]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: COLORS[type], opacity, transform: [{ translateY }] }
      ]}
    >
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 90,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    zIndex: 999
  },
  text: { color: 'white', fontWeight: '600', textAlign: 'center' }
});