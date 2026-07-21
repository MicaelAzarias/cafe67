import { Tabs } from 'expo-router';
import React from 'react';
import { Text } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#5C6E3E',
        tabBarInactiveTintColor: '#6B7754',
        tabBarStyle: {
          backgroundColor: '#FDFBF7',
          borderTopColor: '#D4CCBA',
        },
        headerShown: false,
      }}>
      <Tabs.Screen
        name="cardapio"
        options={{
          title: 'Cardápio',
          tabBarIcon: () => <Text style={{ fontSize: 24 }}>🍽️</Text>,
        }}
      />
      <Tabs.Screen
        name="pedidos"
        options={{
          title: 'Carrinho',
          tabBarIcon: () => <Text style={{ fontSize: 24 }}>🛒</Text>,
        }}
      />
      <Tabs.Screen
        name="cozinha"
        options={{
          title: 'Cozinha',
          tabBarIcon: () => <Text style={{ fontSize: 24 }}>👨‍🍳</Text>,
        }}
      />
      <Tabs.Screen
        name="vendas"
        options={{
          title: 'Vendas',
          tabBarIcon: () => <Text style={{ fontSize: 24 }}>💰</Text>,
        }}
      />
    </Tabs>
  );
}