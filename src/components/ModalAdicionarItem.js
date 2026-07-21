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

const ModalAdicionarItem = ({ visivel, onFechar, onSalvar, itemEditar = null }) => {
  const [nome, setNome] = useState('');
  const [preco, setPreco] = useState('');
  const [categoria, setCategoria] = useState('lanche');
  const [quantidadeEstoque, setQuantidadeEstoque] = useState('');

  useEffect(() => {
    if (itemEditar) {
      setNome(itemEditar.nome);
      setPreco(itemEditar.preco.toString());
      setCategoria(itemEditar.categoria);
      setQuantidadeEstoque(
        itemEditar.quantidade_estoque === null || itemEditar.quantidade_estoque === undefined
          ? ''
          : String(itemEditar.quantidade_estoque)
      );
    } else {
      limparCampos();
    }
  }, [itemEditar, visivel]);

  const limparCampos = () => {
    setNome('');
    setPreco('');
    setCategoria('lanche');
    setQuantidadeEstoque('');
  };

  const handleSalvar = () => {
    // Validações
    if (!nome || nome.trim() === '') {
      Alert.alert('Erro', 'Nome do item é obrigatório');
      return;
    }

    if (!preco || isNaN(parseFloat(preco)) || parseFloat(preco) <= 0) {
      Alert.alert('Erro', 'Preço inválido');
      return;
    }

    const quantidadeEstoqueTexto = quantidadeEstoque.trim();
    if (quantidadeEstoqueTexto !== '' && (!/^\d+$/.test(quantidadeEstoqueTexto))) {
      Alert.alert('Erro', 'Quantidade em estoque deve ser um número inteiro (0 ou mais)');
      return;
    }

    const itemData = {
      nome: nome.trim(),
      preco: parseFloat(preco),
      categoria,
      disponivel: true,
      quantidade_estoque: quantidadeEstoqueTexto === '' ? null : parseInt(quantidadeEstoqueTexto, 10),
    };

    onSalvar(itemData);
    limparCampos();
  };

  const handleCancelar = () => {
    limparCampos();
    onFechar();
  };

  return (
    <Modal
      visible={visivel}
      transparent={true}
      animationType="slide"
      onRequestClose={handleCancelar}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.container}>
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.titulo}>
                {itemEditar ? '✏️ Editar Item' : '➕ Novo Item'}
              </Text>
              <TouchableOpacity onPress={handleCancelar}>
                <Text style={styles.fecharTexto}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Formulário */}
            <View style={styles.form}>
              {/* Nome */}
              <View style={styles.campo}>
                <Text style={styles.label}>Nome do Item *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Pão de Queijo"
                  placeholderTextColor={colors.textLight}
                  value={nome}
                  onChangeText={setNome}
                  autoCapitalize="words"
                />
              </View>

              {/* Preço */}
              <View style={styles.campo}>
                <Text style={styles.label}>Preço (R$) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 5.50"
                  placeholderTextColor={colors.textLight}
                  value={preco}
                  onChangeText={setPreco}
                  keyboardType="decimal-pad"
                />
              </View>

              {/* Categoria */}
              <View style={styles.campo}>
                <Text style={styles.label}>Categoria *</Text>
                <View style={styles.categoriaContainer}>
                  <TouchableOpacity
                    style={[
                      styles.categoriaButton,
                      categoria === 'lanche' && styles.categoriaButtonAtivo,
                    ]}
                    onPress={() => setCategoria('lanche')}
                  >
                    <Text
                      style={[
                        styles.categoriaTexto,
                        categoria === 'lanche' && styles.categoriaTextoAtivo,
                      ]}
                    >
                      🍽️ Lanche
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.categoriaButton,
                      categoria === 'bebida' && styles.categoriaButtonAtivo,
                    ]}
                    onPress={() => setCategoria('bebida')}
                  >
                    <Text
                      style={[
                        styles.categoriaTexto,
                        categoria === 'bebida' && styles.categoriaTextoAtivo,
                      ]}
                    >
                      ☕ Bebida
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Quantidade em Estoque */}
              <View style={styles.campo}>
                <Text style={styles.label}>Quantidade em Estoque (opcional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 10"
                  placeholderTextColor={colors.textLight}
                  value={quantidadeEstoque}
                  onChangeText={(texto) => setQuantidadeEstoque(texto.replace(/\D/g, ''))}
                  keyboardType="number-pad"
                />
                <Text style={styles.ajuda}>
                  Deixe em branco se não quiser controlar a quantidade (ex: bebidas feitas na hora).
                  Quando preenchido, o número diminui a cada venda e volta se o pedido for cancelado.
                </Text>
              </View>
            </View>

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
                <Text style={styles.botaoTextoSalvar}>
                  {itemEditar ? 'Salvar' : 'Adicionar'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
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
    maxHeight: '85%',
  },
  scrollView: {
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  fecharTexto: {
    fontSize: 28,
    color: colors.textLight,
    fontWeight: 'bold',
  },
  form: {
    marginBottom: 24,
  },
  campo: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    borderWidth: 2,
    borderColor: colors.border,
  },
  ajuda: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 6,
  },
  categoriaContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  categoriaButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
  },
  categoriaButtonAtivo: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoriaTexto: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  categoriaTextoAtivo: {
    color: colors.white,
  },
  botoesContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 20,
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

export default ModalAdicionarItem;