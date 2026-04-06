import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet } from 'react-native';
import ClientDashboardScreen from '../screens/client/ClientDashboardScreen';
import ClientGalleryScreen from '../screens/client/ClientGalleryScreen';
import SettingsScreen from '../screens/photographer/SettingsScreen';
import { colors, fontFamily, shadows } from '../config/theme';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function GalleriesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ClientDashboardHome" component={ClientDashboardScreen} />
      <Stack.Screen name="ClientGallery" component={ClientGalleryScreen} />
    </Stack.Navigator>
  );
}

export default function ClientNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.textPrimary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused, color }) => {
          let iconName;
          if (route.name === 'GalleriesTab') iconName = focused ? 'images' : 'images-outline';
          else if (route.name === 'SettingsTab') iconName = focused ? 'settings' : 'settings-outline';
          return (
            <View style={[styles.tabIconContainer, focused && styles.tabIconContainerActive]}>
              <Ionicons name={iconName} size={20} color={focused ? colors.textPrimary : colors.textTertiary} />
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="GalleriesTab" component={GalleriesStack} options={{ tabBarLabel: 'Galleries' }} />
      <Tab.Screen name="SettingsTab" component={SettingsScreen} options={{ tabBarLabel: 'Settings' }} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: 'rgba(253, 249, 243, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
    paddingTop: 8,
    paddingBottom: 8,
    height: 80,
    ...shadows.sm,
  },
  tabLabel: {
    fontFamily: fontFamily.sansMedium,
    fontSize: 10,
    marginTop: 2,
  },
  tabIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconContainerActive: {
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
});
