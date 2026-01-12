import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { colors, typography } from '../theme';
import BusinessTabNavigator from './BusinessTabNavigator';

const Stack = createNativeStackNavigator();

/**
 * Business App Stack - İşletme (user role) kullanıcıları için navigation
 */
const BusinessAppStack = () => {
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
        name="BusinessTabs" 
        component={BusinessTabNavigator}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};

export default BusinessAppStack;

