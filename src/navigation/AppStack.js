import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors, typography } from '../theme';
import BottomTabNavigator from './BottomTabNavigator';
import LoyaltyDetailsScreen from '../screens/loyalty/LoyaltyDetailsScreen';

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
          title: 'Sadakat Bilgileri',
        }}
      />
    </Stack.Navigator>
  );
};

export default AppStack;

