import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { colors, typography } from '../theme';
import BottomTabNavigator from './BottomTabNavigator';
import LoyaltyDetailsScreen from '../screens/loyalty/LoyaltyDetailsScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import PastPromotionsScreen from '../screens/promotions/PastPromotionsScreen';

const Stack = createNativeStackNavigator();

/**
 * App Stack - Giriş yapmış kullanıcılar için navigation
 */
const AppStack = () => {
  const { t } = useTranslation();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: colors.white,
        headerTitleStyle: {
          fontWeight: typography.fontWeight.bold,
        },
      }}
    >
      <Stack.Screen 
        name="MainTabs" 
        component={BottomTabNavigator}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="LoyaltyDetails" 
        component={LoyaltyDetailsScreen}
        options={{
          headerShown: false, // Header'ı kaldır
        }}
      />
      <Stack.Screen 
        name="Notifications" 
        component={NotificationsScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="PastPromotions" 
        component={PastPromotionsScreen}
        options={{
          headerShown: false, // Header'ı kaldır
        }}
      />
    </Stack.Navigator>
  );
};

export default AppStack;

