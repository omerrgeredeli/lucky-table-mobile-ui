import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../theme';

/**
 * Debug Button Component
 * Sadece debug/preview modunda görünür
 * Ekranın sağ alt köşesinde floating button
 */
const DebugButton = ({ onPress, onLongPress }) => {
  // Sadece development/preview modunda göster
  if (!__DEV__ && process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <TouchableOpacity
      style={styles.debugButton}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      <Text style={styles.debugButtonText}>🔍</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  debugButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(52, 152, 219, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  debugButtonText: {
    fontSize: 24,
  },
});

export default DebugButton;
