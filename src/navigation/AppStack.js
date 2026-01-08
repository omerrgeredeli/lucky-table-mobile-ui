import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors, typography } from '../theme';
import BottomTabNavigator from './BottomTabNavigator';
import LoyaltyDetailsScreen from '../screens/loyalty/LoyaltyDetailsScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';

const Stack = createNativeStackNavigator();

/**
 * App Stack - Giriş yapmış kullanıcılar için navigation
 */
const AppStack = () => {
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
          title: 'Favori Mekanlar',
        }}
      />
      <Stack.Screen 
        name="Notifications" 
        component={NotificationsScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};

export default AppStack;

