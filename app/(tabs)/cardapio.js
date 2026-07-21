import React from 'react';
import MenuScreen from '../../src/screens/MenuScreen';
import HeaderUsuario from '../../src/components/HeaderUsuario';
import { View } from 'react-native';

export default function CardapioTab() {
  return (
    <View style={{ flex: 1 }}>
      <HeaderUsuario />
      <MenuScreen />
    </View>
  );
}