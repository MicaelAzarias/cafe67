import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../theme/colors';

const HeaderUsuario = () => {
  const { usuario, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Sair',
      'Deseja realmente sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', style: 'destructive', onPress: logout },
      ]
    );
  };

  const handleForcarLogout = async () => {
    // Para debug - força limpeza total
    await AsyncStorage.clear();
    logout();
  };

  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.bemVindo}>Olá,</Text>
        <Text style={styles.nome}>{usuario?.nome || 'Usuário'}</Text>
        <Text style={styles.id}>ID: {usuario?.id_funcionario}</Text>
      </View>
      <TouchableOpacity 
        style={styles.botaoSair} 
        onPress={handleLogout}
        onLongPress={handleForcarLogout} // ← Segurar para forçar logout
      >
        <Text style={styles.botaoSairTexto}>🚪 Sair</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: colors.background,
  },
  bemVindo: {
    fontSize: 14,
    color: colors.textLight,
  },
  nome: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  id: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 2,
  },
  botaoSair: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  botaoSairTexto: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
});

export default HeaderUsuario;