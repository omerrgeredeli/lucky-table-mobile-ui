import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { colors } from '../theme';
import AuthStack from './AuthStack';
import AppStack from './AppStack';
import BusinessAppStack from './BusinessAppStack';
import LanguageSelectionScreen from '../screens/onboarding/LanguageSelectionScreen';

const Stack = createNativeStackNavigator();

/**
 * Ana Navigation Container
 * Önce dil seçimi kontrolü, sonra Auth durumuna göre AuthStack veya AppStack gösterir
 * Role bazlı routing: customer → AppStack, user → BusinessAppStack
 */
const AppNavigator = () => {
  const { isAuthenticated, isLoading, userRole } = useContext(AuthContext);
  const { isLanguageSelected, isCheckingLanguage } = useLanguage();

  // Loading durumunda spinner göster
  if (isLoading || isCheckingLanguage) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isLanguageSelected ? (
          // Dil seçilmemişse dil seçimi ekranını göster
          <Stack.Screen
            name="LanguageSelection"
            component={LanguageSelectionScreen}
          />
        ) : isAuthenticated ? (
          // Dil seçilmiş ve giriş yapılmışsa role'e göre routing
          userRole === 'user' ? (
            // Business (user role) → BusinessAppStack
            <Stack.Screen name="BusinessApp" component={BusinessAppStack} />
          ) : (
            // Customer (customer role veya varsayılan) → AppStack
            <Stack.Screen name="App" component={AppStack} />
          )
        ) : (
          // Dil seçilmiş ama giriş yapılmamışsa AuthStack
          <Stack.Screen name="Auth" component={AuthStack} />
        )}
      </Stack.Navigator>
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

