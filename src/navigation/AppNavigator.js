import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { colors } from '../theme';
import AuthStack from './AuthStack';
import AppStack from './AppStack';

/**
 * Ana Navigation Container
 * Auth durumuna göre AuthStack veya AppStack gösterir
 */
const AppNavigator = () => {
  const { isAuthenticated, isLoading } = useContext(AuthContext);

  // Loading durumunda spinner göster
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
});

export default AppNavigator;

