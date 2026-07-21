import { Stack } from 'expo-router';
import { AuthProvider } from '../src/contexts/AuthContext';
import { CarrinhoProvider } from '../src/contexts/CarrinhoContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <CarrinhoProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="login" />
          <Stack.Screen name="item-detalhes" />
        </Stack>
      </CarrinhoProvider>
    </AuthProvider>
  );
}