import React, { useState, useEffect } from 'react';
import { 
  NavigationContainer, 
  DarkTheme, 
  DefaultTheme 
} from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { 
  View, 
  Text, 
  ActivityIndicator, 
  StyleSheet,
  useColorScheme 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import AsyncStorage from '@react-native-async-storage/async-storage';

// Import types for enhanced navigation
import { RootStackParamList, BottomTabParamList } from './src/types';

// Import contexts and providers
import { AuthProvider, useAuth } from './src/contexts/AuthContext';

// Import screens
import AuthScreen from './src/screens/AuthScreen';
import HomeScreen from './src/screens/HomeScreen';
import CollectionsScreen from './src/screens/CollectionsScreen';
import SearchScreen from './src/screens/SearchScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import AddLinkScreen from './src/screens/AddLinkScreen';
import LinkDetailScreen from './src/screens/LinkDetailScreen';
import CollectionDetailScreen from './src/screens/CollectionDetailScreen';

// Enhanced Navigation setup with TypeScript support
const Tab = createBottomTabNavigator<BottomTabParamList>();
const Stack = createStackNavigator<RootStackParamList>();

// Theme configuration
const theme = {
  colors: {
    primary: '#6366f1',
    secondary: '#8b5cf6',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    text: '#1f2937',
    background: '#ffffff',
    surface: '#f9fafb',
  },
};

// Loading Screen Component
const LoadingScreen = (): React.ReactElement => (
  <View style={styles.loadingContainer}>
    <Ionicons name="link" size={60} color="#6366f1" />
    <Text style={styles.loadingTitle}>LinkHive</Text>
    <ActivityIndicator size="large" color="#6366f1" style={styles.loader} />
    <Text style={styles.loadingText}>Loading your links...</Text>
  </View>
);

// Main Tab Navigator
function MainTabs(): React.ReactElement {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Collections') {
            iconName = focused ? 'library' : 'library-outline';
          } else if (route.name === 'Search') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Collections" component={CollectionsScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// Authenticated App Navigator
function AuthenticatedApp(): React.ReactElement {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen 
        name="AddLink" 
        component={AddLinkScreen}
        options={{
          headerShown: true,
          title: 'Add Link',
          presentation: 'modal',
          headerStyle: {
            backgroundColor: '#6366f1',
          },
          headerTintColor: 'white',
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      />
      <Stack.Screen 
        name="LinkDetail" 
        component={LinkDetailScreen}
        options={{
          headerShown: true,
          title: 'Link Details',
          headerStyle: {
            backgroundColor: '#6366f1',
          },
          headerTintColor: 'white',
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      />
      <Stack.Screen 
        name="CollectionDetail" 
        component={CollectionDetailScreen}
        options={{
          headerShown: true,
          title: 'Collection',
          headerStyle: {
            backgroundColor: '#6366f1',
          },
          headerTintColor: 'white',
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      />
    </Stack.Navigator>
  );
}

// App Content (inside AuthProvider)
function AppContent(): React.ReactElement {
  const { user, loading, initializing } = useAuth();
  const colorScheme = useColorScheme();

  if (initializing || loading) {
    return <LoadingScreen />;
  }

  const navigationTheme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;

  return (
    <NavigationContainer theme={navigationTheme}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      {user ? <AuthenticatedApp /> : <AuthScreen />}
    </NavigationContainer>
  );
}

// Main App Component
export default function App(): React.ReactElement {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

// Styles
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#6366f1',
    marginTop: 16,
    marginBottom: 32,
  },
  loader: {
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
});