import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MenuItem from '../components/MenuItem';
import ModalAdicionarItem from '../components/ModalAdicionarItem';
import {
  addMenuItem,
  atualizarMenuItem,
  deletarMenuItem,
  excluirMenuItemPermanentemente,
  getMenuItems,
  subscribeToMenuChanges,
} from '../services/menuService';
import { colors } from '../theme/colors';

const MenuScreen = () => {
  const [categoriaAtiva, setCategoriaAtiva] = useState('todos');
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modoGerenciar, setModoGerenciar] = useState(false);
  const [modalVisivel, setModalVisivel] = useState(false);
  const [itemEditando, setItemEditando] = useState(null);
  const router = useRouter();
  
// Carregar itens do Supabase ao montar o componente
useEffect(() => {
  carregarMenu();
  
  // Inscrever-se para mudanças em tempo real
  const unsubscribe = subscribeToMenuChanges((payload) => {
    console.log('Mudança detectada:', payload.eventType);
    carregarMenu(); // Recarregar menu quando houver mudanças
  });
  
  // Cleanup: cancelar subscription quando desmontar
  return () => {
    unsubscribe();
  };
}, [modoGerenciar]); // ← ADICIONE modoGerenciar aqui
  

const carregarMenu = async () => {
  try {
    setLoading(true);
    const resultado = await getMenuItems();
    
    if (resultado.success) {
      // Filtrar apenas itens disponíveis no modo normal
      // No modo gerenciar, mostra todos
      const itensFiltrados = modoGerenciar 
        ? resultado.data 
        : resultado.data.filter(item => item.disponivel);
      
      setMenuItems(itensFiltrados);
    } else {
      Alert.alert('Erro', 'Não foi possível carregar o cardápio: ' + resultado.error);
    }
  } catch (error) {
    Alert.alert('Erro', 'Erro ao conectar com o servidor');
    console.error(error);
  } finally {
    setLoading(false);
  }
};
  
  // Filtrar itens baseado na categoria selecionada
  const getItensExibidos = () => {
    if (categoriaAtiva === 'todos') {
      return menuItems;
    }
    return menuItems.filter(item => item.categoria === categoriaAtiva.replace('s', '')); // lanches -> lanche
  };

  const handleItemPress = (item) => {
    // Se está em modo gerenciar, não navega
    if (modoGerenciar) return;
    
    // Navegar para tela de detalhes
    router.push({
      pathname: '/item-detalhes',
      params: {
        id: item.id,
        nome: item.nome,
        preco: item.preco,
        categoria: item.categoria,
        disponivel: item.disponivel,
        quantidadeEstoque:
          item.quantidade_estoque === null || item.quantidade_estoque === undefined
            ? ''
            : item.quantidade_estoque,
      },
    });
  };

  const handleAbrirModalAdicionar = () => {
    setItemEditando(null);
    setModalVisivel(true);
  };

  const handleAbrirModalEditar = (item) => {
    setItemEditando(item);
    setModalVisivel(true);
  };

  const handleSalvarItem = async (itemData) => {
    try {
      let resultado;

      if (itemEditando) {
        // Editar item existente
        resultado = await atualizarMenuItem(itemEditando.id, itemData);
        if (resultado.success) {
          Alert.alert('Sucesso! ✅', 'Item atualizado com sucesso');
        }
      } else {
        // Adicionar novo item
        resultado = await addMenuItem(itemData);
        if (resultado.success) {
          Alert.alert('Sucesso! ✅', 'Item adicionado ao cardápio');
        }
      }

      if (!resultado.success) {
        Alert.alert('Erro', resultado.error);
      } else {
        setModalVisivel(false);
        carregarMenu();
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível salvar o item');
      console.error(error);
    }
  };

  const handleDeletarItem = async (itemId) => {
    try {
      const resultado = await deletarMenuItem(itemId);

      if (resultado.success) {
        Alert.alert('Sucesso! 🗑️', 'Item removido do cardápio');
        carregarMenu();
      } else {
        Alert.alert('Erro', resultado.error);
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível deletar o item');
      console.error(error);
    }
  };

  const handleExcluirPermanente = async (itemId) => {
    try {
      const resultado = await excluirMenuItemPermanentemente(itemId);

      if (resultado.success) {
        Alert.alert('Excluído! 🗑️', 'Item removido permanentemente do cardápio');
        carregarMenu();
      } else {
        Alert.alert('Erro', resultado.error);
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível excluir o item');
      console.error(error);
    }
  };

  const renderHeader = () => (
    <View style={styles.headerInterno}>
      <View style={styles.tituloContainer}>
        <Text style={styles.titulo}>Cardápio</Text>
        <View style={styles.botoesHeader}>
          <TouchableOpacity
            style={[styles.botaoHeader, modoGerenciar && styles.botaoHeaderAtivo]}
            onPress={() => setModoGerenciar(!modoGerenciar)}
          >
            <Text style={[
              styles.botaoHeaderTexto,
              modoGerenciar && styles.botaoHeaderTextoAtivo
            ]}>
              {modoGerenciar ? '✓ Gerenciar' : '✏️ Gerenciar'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.botaoHeader, styles.botaoAdicionar]}
            onPress={handleAbrirModalAdicionar}
          >
            <Text style={[styles.botaoHeaderTexto, styles.botaoAdicionarTexto]}>➕</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Filtros de categoria */}
      <View style={styles.filtros}>
        <TouchableOpacity
          style={[
            styles.filtroButton,
            categoriaAtiva === 'todos' && styles.filtroButtonAtivo
          ]}
          onPress={() => setCategoriaAtiva('todos')}
        >
          <Text style={[
            styles.filtroTexto,
            categoriaAtiva === 'todos' && styles.filtroTextoAtivo
          ]}>
            Todos
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filtroButton,
            categoriaAtiva === 'lanches' && styles.filtroButtonAtivo
          ]}
          onPress={() => setCategoriaAtiva('lanches')}
        >
          <Text style={[
            styles.filtroTexto,
            categoriaAtiva === 'lanches' && styles.filtroTextoAtivo
          ]}>
            🍽️ Lanches
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filtroButton,
            categoriaAtiva === 'bebidas' && styles.filtroButtonAtivo
          ]}
          onPress={() => setCategoriaAtiva('bebidas')}
        >
          <Text style={[
            styles.filtroTexto,
            categoriaAtiva === 'bebidas' && styles.filtroTextoAtivo
          ]}>
            ☕ Bebidas
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Carregando cardápio...</Text>
        </View>
      ) : (
        <FlatList
          data={getItensExibidos()}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MenuItem
              item={item}
              onPress={handleItemPress}
              onEditar={handleAbrirModalEditar}
              onDeletar={handleDeletarItem}
              onExcluirPermanente={handleExcluirPermanente}
              modoGerenciar={modoGerenciar}
            />
          )}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
      
      {/* Modal de Adicionar/Editar */}
      <ModalAdicionarItem
        visivel={modalVisivel}
        onFechar={() => setModalVisivel(false)}
        onSalvar={handleSalvarItem}
        itemEditar={itemEditando}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textLight,
  },
  listContent: {
    paddingBottom: 20,
  },
  headerInterno: {
    padding: 16,
    paddingTop: 8,
  },
  tituloContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  botoesHeader: {
    flexDirection: 'row',
    gap: 8,
  },
  botaoHeader: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.border,
  },
  botaoHeaderAtivo: {
    backgroundColor: colors.warning,
    borderColor: colors.warning,
  },
  botaoAdicionar: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  botaoHeaderTexto: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
  },
  botaoHeaderTextoAtivo: {
    color: colors.white,
  },
  botaoAdicionarTexto: {
    color: colors.white,
  },
  filtros: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  filtroButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.white,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filtroButtonAtivo: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filtroTexto: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  filtroTextoAtivo: {
    color: colors.white,
  },
});

export default MenuScreen;