import React, { useMemo, useState } from 'react';
import axios from 'axios';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from './src/screens/LoginScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import GenerateScreen from './src/screens/GenerateScreen';
import PreviewPublishScreen from './src/screens/PreviewPublishScreen';
import AnalyticsScreen from './src/screens/AnalyticsScreen';
import ConnectAccountsScreen from './src/screens/ConnectAccountsScreen';
import { lightTheme, darkTheme } from './src/theme/colors';
import { AppProvider } from './src/context/AppContext';

const Stack = createNativeStackNavigator();

export default function App() {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [brand, setBrand] = useState(null);
  const baseURL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
  const api = axios.create({ baseURL });
  const [mode, setMode] = useState('light');
  const appTheme = useMemo(() => (mode === 'dark' ? darkTheme : lightTheme), [mode]);
  const navTheme = useMemo(() => {
    const base = mode === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        background: appTheme.background,
        card: appTheme.card,
        text: appTheme.text,
        border: appTheme.border,
        primary: appTheme.primary,
      },
    };
  }, [appTheme, mode]);

  const appContextValue = {
    api,
    token,
    setToken,
    user,
    setUser,
    brand,
    setBrand,
    mode,
    setMode,
  };

  return (
    <AppProvider value={appContextValue}>
      <NavigationContainer theme={navTheme}>
        <Stack.Navigator initialRouteName="Login">
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
          <Stack.Screen name="Generate" component={GenerateScreen} />
          <Stack.Screen name="PreviewPublish" component={PreviewPublishScreen} />
          <Stack.Screen name="Analytics" component={AnalyticsScreen} />
          <Stack.Screen name="ConnectAccounts" component={ConnectAccountsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </AppProvider>
  );
}
