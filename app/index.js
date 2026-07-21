import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useAuth } from '../src/contexts/AuthContext';
import { colors } from '../src/theme/colors';

export default function Index() {
  const { estaLogado, loading, logout } = useAuth();

  console.log('🏠 Index - estaLogado:', estaLogado, 'loading:', loading);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 16, color: colors.textLight }}>Carregando...</Text>
      </View>
    );
  }

  if (!estaLogado) {
    console.log('➡️ Redirecionando para login');
    return <Redirect href="/login" />;
  }

  console.log('➡️ Redirecionando para cardápio');
  return <Redirect href="/(tabs)/cardapio" />;
}