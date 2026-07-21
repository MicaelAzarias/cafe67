import React, { useState } from 'react';
import { useAuth } from '../../src/contexts/AuthContext'; 

import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { colors } from '../../src/theme/colors';
import { useCarrinho } from '../../src/contexts/CarrinhoContext';
import { criarPedido } from '../../src/services/pedidosService';

const FORMAS_PAGAMENTO = [
  { id: 'dinheiro', label: '💵 Dinheiro', icon: '💵' },
  { id: 'pix', label: '📱 PIX', icon: '📱' },
  { id: 'credito', label: '💳 Crédito', icon: '💳' },
  { id: 'debito', label: '💳 Débito', icon: '💳' },
  { id: 'nao_pago', label: '⏳ Não Pagou', icon: '⏳' },
];

const PedidosTab = () => {
  const { usuario } = useAuth();
  const [modalNomeVisivel, setModalNomeVisivel] = useState(false);
  const [nomeCliente, setNomeCliente] = useState('');
  const [formaPagamento, setFormaPagamento] = useState('nao_pago');

  const {
    itens,
    removerItem,
    atualizarQuantidade,
    limparCarrinho,
    calcularTotal,
    getQuantidadeTotal,
  } = useCarrinho();

  const handleAbrirModalNome = () => {
    if (itens.length === 0) {
      Alert.alert('Carrinho vazio', 'Adicione itens antes de finalizar o pedido');
      return;
    }
    setModalNomeVisivel(true);
  };

  const handleFinalizarPedido = async () => {
    if (!nomeCliente || nomeCliente.trim() === '') {
      Alert.alert('Nome obrigatório', 'Por favor, informe o nome do cliente');
      return;
    }

    setModalNomeVisivel(false);

    try {
      // Preparar dados do pedido
      const pedidoData = {
        nome_cliente: nomeCliente.trim(),
        forma_pagamento: formaPagamento,
        itens: itens.map(item => ({
          menu_item_id: item.id,
          quantidade: item.quantidade,
          preco_unitario: item.preco,
          subtotal: item.preco * item.quantidade,
        })),
        total: calcularTotal(),
        observacao: '',
      };

      // Criar pedido no Supabase
      const resultado = await criarPedido(pedidoData, usuario?.id);

      if (resultado.success) {
        const formaPgtoLabel = FORMAS_PAGAMENTO.find(f => f.id === formaPagamento)?.label || '';
        Alert.alert(
          'Pedido Criado! 🎉',
          `Pedido #${resultado.data.numero_pedido} de ${nomeCliente}\n${formaPgtoLabel}\nEnviado para a cozinha!`,
          [
            {
              text: 'OK',
              onPress: () => {
                limparCarrinho();
                setNomeCliente('');
                setFormaPagamento('nao_pago');
              },
            },
          ]
        );
      } else {
        Alert.alert('Erro', 'Não foi possível criar o pedido: ' + resultado.error);
      }
    } catch (error) {
      Alert.alert('Erro', 'Erro ao finalizar pedido');
      console.error(error);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemNome}>{item.nome}</Text>
        <Text style={styles.itemCategoria}>
          {item.categoria === 'lanche' ? '🍽️ Lanche' : '☕ Bebida'}
        </Text>
        <Text style={styles.itemPreco}>R$ {item.preco.toFixed(2)} cada</Text>
      </View>

      <View style={styles.itemControles}>
        <View style={styles.quantidadeControle}>
          <TouchableOpacity
            style={styles.quantidadeButton}
            onPress={() => atualizarQuantidade(item.id, item.quantidade - 1)}
          >
            <Text style={styles.quantidadeButtonTexto}>−</Text>
          </TouchableOpacity>

          <Text style={styles.quantidadeTexto}>{item.quantidade}</Text>

          <TouchableOpacity
            style={styles.quantidadeButton}
            onPress={() => atualizarQuantidade(item.id, item.quantidade + 1)}
          >
            <Text style={styles.quantidadeButtonTexto}>+</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.itemSubtotal}>
          R$ {(item.preco * item.quantidade).toFixed(2)}
        </Text>

        <TouchableOpacity
          style={styles.removerButton}
          onPress={() => removerItem(item.id)}
        >
          <Text style={styles.removerTexto}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderVazio = () => (
    <View style={styles.vazioContainer}>
      <Text style={styles.vazioEmoji}>🛒</Text>
      <Text style={styles.vazioTexto}>Carrinho vazio</Text>
      <Text style={styles.vazioSubtexto}>
        Adicione itens do cardápio para começar um pedido
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.titulo}>Pedido Atual</Text>
        {itens.length > 0 && (
          <TouchableOpacity onPress={limparCarrinho}>
            <Text style={styles.limparTexto}>Limpar tudo</Text>
          </TouchableOpacity>
        )}
      </View>

      {itens.length === 0 ? (
        renderVazio()
      ) : (
        <>
          <FlatList
            data={itens}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />

          <View style={styles.footer}>
            <View style={styles.totalContainer}>
              <View>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalItens}>
                  {getQuantidadeTotal()} {getQuantidadeTotal() === 1 ? 'item' : 'itens'}
                </Text>
              </View>
              <Text style={styles.totalValor}>
                R$ {calcularTotal().toFixed(2)}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.finalizarButton}
              onPress={handleAbrirModalNome}
            >
              <Text style={styles.finalizarButtonTexto}>
                Finalizar Pedido
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Modal de Nome do Cliente e Forma de Pagamento */}
      <Modal
        visible={modalNomeVisivel}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalNomeVisivel(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContainer}>
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitulo}>Finalizar Pedido</Text>
                <Text style={styles.modalSubtitulo}>
                  Preencha os dados do pedido
                </Text>

                {/* Nome do Cliente */}
                <View style={styles.modalCampo}>
                  <Text style={styles.modalLabel}>Nome do Cliente *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Ex: João Silva"
                    placeholderTextColor={colors.textLight}
                    value={nomeCliente}
                    onChangeText={setNomeCliente}
                    autoFocus={true}
                    autoCapitalize="words"
                  />
                </View>

                {/* Forma de Pagamento */}
                <View style={styles.modalCampo}>
                  <Text style={styles.modalLabel}>Forma de Pagamento *</Text>
                  <View style={styles.formasPagamentoContainer}>
                    {FORMAS_PAGAMENTO.map((forma) => (
                      <TouchableOpacity
                        key={forma.id}
                        style={[
                          styles.formaPagamentoButton,
                          formaPagamento === forma.id && styles.formaPagamentoAtiva,
                        ]}
                        onPress={() => setFormaPagamento(forma.id)}
                      >
                        <Text
                          style={[
                            styles.formaPagamentoTexto,
                            formaPagamento === forma.id && styles.formaPagamentoTextoAtivo,
                          ]}
                        >
                          {forma.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Resumo */}
                <View style={styles.modalResumo}>
                  <Text style={styles.resumoLabel}>Resumo do Pedido:</Text>
                  <Text style={styles.resumoItens}>
                    {getQuantidadeTotal()} {getQuantidadeTotal() === 1 ? 'item' : 'itens'}
                  </Text>
                  <Text style={styles.resumoTotal}>
                    Total: R$ {calcularTotal().toFixed(2)}
                  </Text>
                </View>

                <View style={styles.modalBotoes}>
                  <TouchableOpacity
                    style={[styles.modalBotao, styles.modalBotaoCancelar]}
                    onPress={() => {
                      setModalNomeVisivel(false);
                      setNomeCliente('');
                    }}
                  >
                    <Text style={styles.modalBotaoTextoCancelar}>Cancelar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalBotao, styles.modalBotaoConfirmar]}
                    onPress={handleFinalizarPedido}
                  >
                    <Text style={styles.modalBotaoTextoConfirmar}>
                      Confirmar Pedido
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  titulo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
  },
  limparTexto: {
    fontSize: 14,
    color: colors.danger,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  itemContainer: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  itemInfo: {
    marginBottom: 12,
  },
  itemNome: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  itemCategoria: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: 4,
  },
  itemPreco: {
    fontSize: 14,
    color: colors.textLight,
  },
  itemControles: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quantidadeControle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantidadeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantidadeButtonTexto: {
    fontSize: 18,
    color: colors.white,
    fontWeight: 'bold',
  },
  quantidadeTexto: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginHorizontal: 16,
    minWidth: 30,
    textAlign: 'center',
  },
  itemSubtotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    flex: 1,
    textAlign: 'right',
    marginRight: 12,
  },
  removerButton: {
    padding: 8,
  },
  removerTexto: {
    fontSize: 20,
  },
  vazioContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  vazioEmoji: {
    fontSize: 80,
    marginBottom: 16,
  },
  vazioTexto: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  vazioSubtexto: {
    fontSize: 16,
    color: colors.textLight,
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.cardBackground,
    padding: 20,
    paddingBottom: 30,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    elevation: 8,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 16,
    color: colors.textLight,
    marginBottom: 4,
  },
  totalItens: {
    fontSize: 12,
    color: colors.textLight,
  },
  totalValor: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
  },
  finalizarButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  finalizarButtonTexto: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '100%',
    maxHeight: '90%',
    paddingHorizontal: 24,
  },
  modalScroll: {
    maxHeight: '100%',
  },
  modalContent: {
    backgroundColor: colors.cardBackground,
    borderRadius: 20,
    padding: 24,
    elevation: 5,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalTitulo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitulo: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 24,
    textAlign: 'center',
  },
  modalCampo: {
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    color: colors.text,
    borderWidth: 2,
    borderColor: colors.border,
  },
  formasPagamentoContainer: {
    gap: 8,
  },
  formaPagamentoButton: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: colors.border,
  },
  formaPagamentoAtiva: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  formaPagamentoTexto: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  formaPagamentoTextoAtivo: {
    color: colors.white,
  },
  modalResumo: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  resumoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textLight,
    marginBottom: 8,
  },
  resumoItens: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 4,
  },
  resumoTotal: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    marginTop: 4,
  },
  modalBotoes: {
    flexDirection: 'row',
    gap: 12,
  },
  modalBotao: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalBotaoCancelar: {
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.border,
  },
  modalBotaoConfirmar: {
    backgroundColor: colors.primary,
  },
  modalBotaoTextoCancelar: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  modalBotaoTextoConfirmar: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
  },
});

export default PedidosTab;