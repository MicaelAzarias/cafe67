import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useCarrinho } from '../contexts/CarrinhoContext';
import { colors } from '../theme/colors';

const ItemDetalhesScreen = ({ item }) => {
  const [quantidade, setQuantidade] = useState(1);
  const { adicionarItem } = useCarrinho();
  const router = useRouter();

  const temControleEstoque = item.quantidade_estoque !== null && item.quantidade_estoque !== undefined;
  const estoqueEsgotado = temControleEstoque && item.quantidade_estoque <= 0;

  const aumentarQuantidade = () => {
    if (temControleEstoque && quantidade >= item.quantidade_estoque) {
      Alert.alert('Estoque insuficiente', `Só há ${item.quantidade_estoque} unidade(s) disponível(is)`);
      return;
    }
    setQuantidade(prev => prev + 1);
  };

  const diminuirQuantidade = () => {
    if (quantidade > 1) {
      setQuantidade(prev => prev - 1);
    }
  };

  const handleAdicionarCarrinho = () => {
    if (estoqueEsgotado) {
      Alert.alert('Estoque esgotado', `"${item.nome}" não tem unidades disponíveis no momento`);
      return;
    }

    adicionarItem(item, quantidade);
    Alert.alert(
      'Sucesso! 🎉',
      `${quantidade}x ${item.nome} adicionado ao pedido!`,
      [
        {
          text: 'Ver Carrinho',
          onPress: () => router.push('/(tabs)/pedidos'),
        },
        {
          text: 'Continuar',
          style: 'cancel',
          onPress: () => router.back(),
        },
      ]
    );
  };

  const subtotal = item.preco * quantidade;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.voltarButton}
            onPress={() => router.back()}
          >
            <Text style={styles.voltarTexto}>← Voltar</Text>
          </TouchableOpacity>
        </View>

        {/* Detalhes do Item */}
        <View style={styles.itemCard}>
          <View style={styles.itemEmoji}>
            <Text style={styles.emojiTexto}>
              {item.categoria === 'lanche' ? '🍽️' : '☕'}
            </Text>
          </View>
          
          <Text style={styles.itemNome}>{item.nome}</Text>
          <Text style={styles.itemCategoria}>
            {item.categoria === 'lanche' ? 'Lanche' : 'Bebida'}
          </Text>
          
          <View style={styles.precoContainer}>
            <Text style={styles.precoLabel}>Preço unitário</Text>
            <Text style={styles.preco}>R$ {item.preco.toFixed(2)}</Text>
          </View>
        </View>

        {/* Seletor de Quantidade */}
        <View style={styles.quantidadeContainer}>
          <Text style={styles.quantidadeLabel}>Quantidade</Text>

          {temControleEstoque && (
            <Text style={estoqueEsgotado ? styles.estoqueEsgotadoTexto : styles.estoqueTexto}>
              {estoqueEsgotado
                ? '📦 Esgotado'
                : `📦 ${item.quantidade_estoque} disponível(is)`}
            </Text>
          )}

          <View style={styles.quantidadeControle}>
            <TouchableOpacity
              style={styles.quantidadeButton}
              onPress={diminuirQuantidade}
            >
              <Text style={styles.quantidadeButtonTexto}>−</Text>
            </TouchableOpacity>
            
            <View style={styles.quantidadeDisplay}>
              <Text style={styles.quantidadeTexto}>{quantidade}</Text>
            </View>
            
            <TouchableOpacity
              style={styles.quantidadeButton}
              onPress={aumentarQuantidade}
            >
              <Text style={styles.quantidadeButtonTexto}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Subtotal */}
        <View style={styles.subtotalContainer}>
          <Text style={styles.subtotalLabel}>Subtotal</Text>
          <Text style={styles.subtotalValor}>R$ {subtotal.toFixed(2)}</Text>
        </View>
      </View>

      {/* Botão Adicionar */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.adicionarButton, estoqueEsgotado && styles.adicionarButtonDesabilitado]}
          onPress={handleAdicionarCarrinho}
          disabled={estoqueEsgotado}
        >
          <Text style={styles.adicionarButtonTexto}>
            {estoqueEsgotado ? 'Esgotado' : 'Adicionar ao Pedido'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  voltarButton: {
    padding: 8,
  },
  voltarTexto: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  itemCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  itemEmoji: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emojiTexto: {
    fontSize: 48,
  },
  itemNome: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  itemCategoria: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 16,
  },
  precoContainer: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    width: '100%',
  },
  precoLabel: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: 4,
  },
  preco: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
  },
  quantidadeContainer: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  quantidadeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  estoqueTexto: {
    fontSize: 13,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: 12,
  },
  estoqueEsgotadoTexto: {
    fontSize: 13,
    color: colors.danger,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  quantidadeControle: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantidadeButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantidadeButtonTexto: {
    fontSize: 24,
    color: colors.white,
    fontWeight: 'bold',
  },
  quantidadeDisplay: {
    marginHorizontal: 40,
    minWidth: 60,
    alignItems: 'center',
  },
  quantidadeTexto: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
  },
  subtotalContainer: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subtotalLabel: {
    fontSize: 18,
    color: colors.text,
    fontWeight: '600',
  },
  subtotalValor: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  footer: {
    padding: 20,
    paddingBottom: 30,
  },
  adicionarButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    elevation: 4,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  adicionarButtonDesabilitado: {
    backgroundColor: colors.textLight,
    elevation: 0,
    shadowOpacity: 0,
  },
  adicionarButtonTexto: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ItemDetalhesScreen;