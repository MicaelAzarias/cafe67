import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { colors } from '../theme/colors';

const MenuItem = ({ item, onPress, onEditar, onDeletar, onExcluirPermanente, modoGerenciar = false }) => {
const handleLongPress = () => {
  if (!modoGerenciar) return;

  const opcoes = [
    {
      text: 'Cancelar',
      style: 'cancel',
    },
    {
      text: '✏️ Editar',
      onPress: () => onEditar(item),
    },
  ];

  // Se o item está inativo, adiciona opção de reativar
  if (!item.disponivel) {
    opcoes.push({
      text: '✅ Reativar',
      onPress: () => handleReativar(),
    });
  } else {
    // Se está ativo, adiciona opção de desativar
    opcoes.push({
      text: '❌ Desativar',
      onPress: () => handleConfirmarExclusao(),
      style: 'destructive',
    });
  }

  // Excluir permanentemente sempre disponível, ativo ou inativo
  opcoes.push({
    text: '🗑️ Excluir Permanentemente',
    onPress: () => handleConfirmarExclusaoPermanente(),
    style: 'destructive',
  });

  Alert.alert(item.nome, 'O que deseja fazer?', opcoes);
};

const handleReativar = () => {
  Alert.alert(
    'Reativar Item?',
    `Deseja reativar "${item.nome}"?`,
    [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Reativar',
        onPress: () => onDeletar(item.id), // Vai chamar a mesma função mas ela agora desativa/ativa
      },
    ]
  );
};

const handleConfirmarExclusao = () => {
  Alert.alert(
    'Desativar Item?',
    `Tem certeza que deseja desativar "${item.nome}"?\n\nO item não aparecerá mais no cardápio, mas pedidos antigos não serão afetados.`,
    [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Desativar',
        style: 'destructive',
        onPress: () => onDeletar(item.id),
      },
    ]
  );
};

const handleConfirmarExclusaoPermanente = () => {
  Alert.alert(
    'Excluir Permanentemente?',
    `Tem certeza que deseja EXCLUIR "${item.nome}" para sempre?\n\nEssa ação não pode ser desfeita. Se o item já foi usado em algum pedido, a exclusão será bloqueada.`,
    [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir para Sempre',
        style: 'destructive',
        onPress: () => onExcluirPermanente(item.id),
      },
    ]
  );
};
  return (
    <TouchableOpacity 
      style={[
      styles.container,
      !item.disponivel && styles.containerInativo, // ← ADICIONAR
    ]}
      onPress={() => onPress(item)}
      onLongPress={handleLongPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View style={styles.info}>
          <Text style={styles.nome}>
          {item.nome}
          {!item.disponivel && ' (Inativo)'}
          </Text>
          <Text style={styles.categoria}>
            {item.categoria === 'lanche' ? '🍽️ Lanche' : '☕ Bebida'}
          </Text>
          {(item.quantidade_estoque !== null && item.quantidade_estoque !== undefined) && (
            <Text style={item.quantidade_estoque > 0 ? styles.estoque : styles.estoqueEsgotado}>
              {item.quantidade_estoque > 0
                ? `📦 Restam ${item.quantidade_estoque}`
                : '📦 Esgotado'}
            </Text>
          )}
        </View>

        <View style={styles.priceContainer}>
          <Text style={styles.preco}>
            R$ {item.preco.toFixed(2)}
          </Text>
          {!item.disponivel && (
            <Text style={styles.indisponivel}>Indisponível</Text>
          )}
        </View>
      </View>
      
      {/* Indicador visual de disponibilidade */}
      <View style={[
        styles.indicator,
        { backgroundColor: item.disponivel ? colors.success : colors.danger }
      ]} />

      {/* Indicador de modo gerenciar */}
      {modoGerenciar && (
        <View style={styles.gerenciarBadge}>
          <Text style={styles.gerenciarTexto}>Segurar para editar</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({

  containerInativo: {
  opacity: 0.5,
  borderWidth: 2,
  borderColor: colors.danger,
  borderStyle: 'dashed',
},

  container: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    elevation: 3,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  info: {
    flex: 1,
  },
  nome: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  categoria: {
    fontSize: 14,
    color: colors.textLight,
  },
  estoque: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 4,
  },
  estoqueEsgotado: {
    fontSize: 12,
    color: colors.danger,
    fontWeight: '600',
    marginTop: 4,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  preco: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  indisponivel: {
    fontSize: 12,
    color: colors.danger,
    marginTop: 4,
  },
  indicator: {
    height: 4,
    width: '100%',
  },
  gerenciarBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.warning,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  gerenciarTexto: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.white,
  },
});

export default MenuItem;