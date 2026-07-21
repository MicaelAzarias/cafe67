import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from '../theme/colors';

const FORMAS_PAGAMENTO = [
  { id: 'dinheiro', label: 'Dinheiro', icon: '💵' },
  { id: 'pix', label: 'PIX', icon: '📱' },
  { id: 'credito', label: 'Crédito', icon: '💳' },
  { id: 'debito', label: 'Débito', icon: '💳' },
  { id: 'nao_pago', label: 'Não Pago', icon: '⏳' },
];

const ModalEditarVenda = ({ visivel, onFechar, onSalvar, onExcluir, pedido }) => {
  const [formaPagamento, setFormaPagamento] = useState('dinheiro');
  const [observacao, setObservacao] = useState('');

  useEffect(() => {
    if (pedido) {
      setFormaPagamento(pedido.forma_pagamento || 'dinheiro');
      setObservacao(pedido.observacao || '');
    }
  }, [pedido, visivel]);

  const handleSalvar = () => {
    if (!pedido) return;

    onSalvar(pedido.id, {
      forma_pagamento: formaPagamento,
      observacao: observacao.trim(),
    });
  };

  const handleExcluir = () => {
    if (!pedido) return;

    Alert.alert(
      'Excluir Venda?',
      `Tem certeza que deseja excluir permanentemente a venda #${pedido.numero_pedido}?\n\nEssa ação não pode ser desfeita, o valor sairá do relatório de vendas e o estoque será devolvido.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => onExcluir(pedido.id),
        },
      ]
    );
  };

  if (!pedido) return null;

  return (
    <Modal visible={visivel} animationType="slide" transparent onRequestClose={onFechar}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalContainer}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.titulo}>Pedido #{pedido.numero_pedido}</Text>
            <Text style={styles.subtitulo}>{pedido.nome_cliente}</Text>

            <Text style={styles.label}>Forma de Pagamento</Text>
            <View style={styles.formasContainer}>
              {FORMAS_PAGAMENTO.map((forma) => (
                <TouchableOpacity
                  key={forma.id}
                  style={[
                    styles.formaButton,
                    formaPagamento === forma.id && styles.formaButtonAtiva,
                  ]}
                  onPress={() => setFormaPagamento(forma.id)}
                >
                  <Text style={styles.formaIcon}>{forma.icon}</Text>
                  <Text
                    style={[
                      styles.formaTexto,
                      formaPagamento === forma.id && styles.formaTextoAtivo,
                    ]}
                  >
                    {forma.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Observação</Text>
            <TextInput
              style={styles.observacaoInput}
              value={observacao}
              onChangeText={setObservacao}
              placeholder="Ex: cliente pediu para trocar o troco, pagou parte em PIX..."
              placeholderTextColor={colors.textLight}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <View style={styles.botoesContainer}>
              <TouchableOpacity style={styles.botaoCancelar} onPress={onFechar}>
                <Text style={styles.botaoCancelarTexto}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.botaoSalvar} onPress={handleSalvar}>
                <Text style={styles.botaoSalvarTexto}>Salvar</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.botaoExcluir} onPress={handleExcluir}>
              <Text style={styles.botaoExcluirTexto}>🗑️ Excluir Venda</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
  },
  titulo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  subtitulo: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    marginTop: 8,
  },
  formasContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  formaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  formaButtonAtiva: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  formaIcon: {
    fontSize: 16,
  },
  formaTexto: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  formaTextoAtivo: {
    color: colors.white,
  },
  observacaoInput: {
    backgroundColor: colors.cardBackground,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 90,
    marginBottom: 16,
  },
  botoesContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  botaoCancelar: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
  },
  botaoCancelarTexto: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  botaoSalvar: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  botaoSalvarTexto: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
  },
  botaoExcluir: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: colors.danger,
    marginBottom: Platform.OS === 'ios' ? 20 : 8,
  },
  botaoExcluirTexto: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.white,
  },
});

export default ModalEditarVenda;
