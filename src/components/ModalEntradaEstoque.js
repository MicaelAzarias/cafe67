import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  Alert,
  FlatList,
} from 'react-native';
import { colors } from '../theme/colors';

const ModalEntradaEstoque = ({ visivel, onFechar, ingredientes, onSalvar }) => {
  const [ingredienteSelecionado, setIngredienteSelecionado] = useState(null);
  const [quantidade, setQuantidade] = useState('');

  const handleSalvar = () => {
    if (!ingredienteSelecionado) {
      Alert.alert('Erro', 'Selecione um ingrediente');
      return;
    }

    if (!quantidade || parseFloat(quantidade) <= 0) {
      Alert.alert('Erro', 'Digite uma quantidade válida');
      return;
    }

    onSalvar({
      ingredienteId: ingredienteSelecionado.id,
      quantidade: parseFloat(quantidade),
    });

    // Limpar
    setIngredienteSelecionado(null);
    setQuantidade('');
  };

  const handleCancelar = () => {
    setIngredienteSelecionado(null);
    setQuantidade('');
    onFechar();
  };

  const renderIngrediente = ({ item }) => {
    const selecionado = ingredienteSelecionado?.id === item.id;

    return (
      <TouchableOpacity
        style={[styles.ingredienteItem, selecionado && styles.ingredienteSelecionado]}
        onPress={() => setIngredienteSelecionado(item)}
      >
        <View>
          <Text style={styles.ingredienteNome}>{item.nome}</Text>
          <Text style={styles.ingredienteInfo}>
            Estoque: {item.quantidade_atual} {item.unidade}
          </Text>
        </View>
        {selecionado && <Text style={styles.checkMark}>✓</Text>}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visivel}
      transparent={true}
      animationType="slide"
      onRequestClose={handleCancelar}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.titulo}>➕ Entrada de Estoque</Text>
            <TouchableOpacity onPress={handleCancelar}>
              <Text style={styles.fechar}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Seleção de Ingrediente */}
          <View style={styles.secao}>
            <Text style={styles.label}>Selecione o ingrediente:</Text>
            <FlatList
              data={ingredientes}
              keyExtractor={(item) => item.id}
              renderItem={renderIngrediente}
              style={styles.lista}
              contentContainerStyle={styles.listaContent}
            />
          </View>

          {/* Ingrediente Selecionado */}
          {ingredienteSelecionado && (
            <View style={styles.selecaoInfo}>
              <Text style={styles.selecaoTexto}>
                📦 {ingredienteSelecionado.nome}
              </Text>
              <Text style={styles.selecaoSubtexto}>
                Estoque atual: {ingredienteSelecionado.quantidade_atual}{' '}
                {ingredienteSelecionado.unidade}
              </Text>
            </View>
          )}

          {/* Input de Quantidade */}
          {ingredienteSelecionado && (
            <View style={styles.secao}>
              <Text style={styles.label}>
                Quantidade a adicionar ({ingredienteSelecionado.unidade}):
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: 50"
                placeholderTextColor={colors.textLight}
                value={quantidade}
                onChangeText={setQuantidade}
                keyboardType="decimal-pad"
              />
            </View>
          )}

          {/* Botões */}
          <View style={styles.botoesContainer}>
            <TouchableOpacity
              style={[styles.botao, styles.botaoCancelar]}
              onPress={handleCancelar}
            >
              <Text style={styles.botaoTextoCancelar}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.botao, styles.botaoSalvar]}
              onPress={handleSalvar}
            >
              <Text style={styles.botaoTextoSalvar}>Adicionar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.cardBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  fechar: {
    fontSize: 28,
    color: colors.textLight,
    fontWeight: 'bold',
  },
  secao: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  lista: {
    maxHeight: 200,
  },
  listaContent: {
    paddingBottom: 8,
  },
  ingredienteItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: colors.border,
  },
  ingredienteSelecionado: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  ingredienteNome: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  ingredienteInfo: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 4,
  },
  checkMark: {
    fontSize: 24,
    color: colors.white,
    fontWeight: 'bold',
  },
  selecaoInfo: {
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  selecaoTexto: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  selecaoSubtexto: {
    fontSize: 14,
    color: colors.textLight,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    color: colors.text,
    borderWidth: 2,
    borderColor: colors.border,
  },
  botoesContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  botao: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  botaoCancelar: {
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.border,
  },
  botaoSalvar: {
    backgroundColor: colors.primary,
  },
  botaoTextoCancelar: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  botaoTextoSalvar: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
  },
});

export default ModalEntradaEstoque;