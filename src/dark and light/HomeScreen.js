import { StyleSheet, Text, View, useColorScheme } from 'react-native';

export default function App() {
  // 1. Telefonun temasını öğren (sonuç 'light' veya 'dark' döner)
  const colorScheme = useColorScheme();

  // 2. Renkleri temaya göre belirle
  const themeContainerStyle =
    colorScheme === 'light' ? styles.lightContainer : styles.darkContainer;
  
  const themeTextStyle =
    colorScheme === 'light' ? styles.lightText : styles.darkText;

  return (
    <View style={[styles.container, themeContainerStyle]}>
      <Text style={[styles.text, themeTextStyle]}>
        Şu an {colorScheme === 'light' ? 'Aydınlık' : 'Karanlık'} Moddasın!
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  // Aydınlık Mod Renkleri
  lightContainer: {
    backgroundColor: '#ffffff',
  },
  lightText: {
    color: '#000000',
  },
  // Karanlık Mod Renkleri
  darkContainer: {
    backgroundColor: '#1c1c1e', // Tam siyah yerine koyu gri daha şık durur
  },
  darkText: {
    color: '#ffffff',
  },
});