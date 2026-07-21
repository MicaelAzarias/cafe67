import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  RefreshControl,
} from 'react-native';
import { colors } from '../../src/theme/colors';
import {
  getPedidos,
  atualizarStatusPedido,
  cancelarPedido,
  limparPedidosEntregues,
  subscribeToPedidosChanges,
} from '../../src/services/pedidosService';

const CozinhaTab = () => {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState('pendente');

  useEffect(() => {
    carregarPedidos();

    // Atualiza a lista automaticamente quando qualquer pedido muda no Supabase
    const unsubscribe = subscribeToPedidosChanges(() => {
      carregarPedidos();
    }, 'pedidos-changes-cozinha');

    return () => {
      unsubscribe();
    };
  }, [filtroStatus]);

  const carregarPedidos = async () => {
    try {
      setLoading(true);
      const resultado = await getPedidos(filtroStatus);

      if (resultado.success) {
        setPedidos(resultado.data);
      } else {
        Alert.alert('Erro', 'Não foi possível carregar pedidos');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarcarPronto = async (pedidoId) => {
    try {
      const resultado = await atualizarStatusPedido(pedidoId, 'pronto');
      if (resultado.success) {
        Alert.alert('✅ Pedido Pronto!', 'Cliente será notificado');
        carregarPedidos();
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível atualizar o pedido');
    }
  };

  const handleMarcarEntregue = async (pedidoId) => {
    try {
      const resultado = await atualizarStatusPedido(pedidoId, 'entregue');
      if (resultado.success) {
        Alert.alert('✅ Pedido Entregue!');
        carregarPedidos();
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível atualizar o pedido');
    }
  };

  const handleCancelar = (pedidoId, numeroPedido) => {
    Alert.alert(
      'Cancelar Pedido?',
      `Tem certeza que deseja cancelar o pedido #${numeroPedido}?\n\nEste pedido NÃO aparecerá no relatório de vendas.`,
      [
        { text: 'Não', style: 'cancel' },
        {
          text: 'Sim, Cancelar',
          style: 'destructive',
          onPress: async () => {
            const resultado = await cancelarPedido(pedidoId);
            if (resultado.success) {
              Alert.alert('Pedido Cancelado', 'O estoque foi devolvido.');
              carregarPedidos();
            } else {
              Alert.alert('Erro', resultado.error);
            }
          },
        },
      ]
    );
  };

  const handleLimparEntregues = () => {
    Alert.alert(
      'Limpar Pedidos Entregues?',
      'Isso vai DELETAR permanentemente todos os pedidos entregues.\n\nEsta ação não pode ser desfeita!',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpar Tudo',
          style: 'destructive',
          onPress: async () => {
            try {
              const resultado = await limparPedidosEntregues();
              if (resultado.success) {
                Alert.alert(
                  'Limpo! 🧹',
                  `${resultado.quantidade} pedidos foram removidos.`
                );
                carregarPedidos();
              } else {
                Alert.alert('Erro', resultado.error);
              }
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível limpar os pedidos');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status) => {
    if (!status) return colors.textLight;

    switch (status) {
      case 'pendente':
        return colors.warning;
      case 'em_preparo':
        return '#3498db';
      case 'pronto':
        return colors.success;
      case 'entregue':
        return colors.textLight;
      case 'cancelado':
        return colors.danger;
      default:
        return colors.textLight;
    }
  };

  const getStatusTexto = (status) => {
    if (!status) return 'Indefinido';

    switch (status) {
      case 'pendente':
        return '⏳ Pendente';
      case 'em_preparo':
        return '👨‍🍳 Em Preparo';
      case 'pronto':
        return '✅ Pronto';
      case 'entregue':
        return '🎉 Entregue';
      case 'cancelado':
        return '❌ Cancelado';
      default:
        return status;
    }
  };

  const formatarHora = (dataString) => {
    const data = new Date(dataString);
    return data.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderPedidoItem = ({ item: pedido }) => {
    const totalItens = pedido.pedido_items?.reduce(
      (sum, item) => sum + item.quantidade,
      0
    ) || 0;

    return (
      <View style={styles.pedidoCard}>
        {/* Header do Pedido */}
        <View style={styles.pedidoHeader}>
          <View>
            <Text style={styles.pedidoNumero}>Pedido #{pedido.numero_pedido}</Text>
            <Text style={styles.pedidoCliente}>👤 {pedido.nome_cliente || 'Cliente'}</Text>
            <Text style={styles.pedidoHora}>🕐 {formatarHora(pedido.created_at)}</Text>
          </View>
          <View style={styles.pedidoStatusContainer}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(pedido.status) },
              ]}
            >
              <Text style={styles.statusTexto}>{getStatusTexto(pedido.status)}</Text>
            </View>
            <Text style={styles.pedidoTotal}>R$ {pedido.total.toFixed(2)}</Text>
          </View>
        </View>

        {/* Itens do Pedido */}
        <View style={styles.itensContainer}>
          <Text style={styles.itensLabel}>
            📋 Itens ({totalItens} {totalItens === 1 ? 'item' : 'itens'})
          </Text>
          {pedido.pedido_items?.map((item, index) => (
            <View key={index} style={styles.itemLinha}>
              <Text style={styles.itemQuantidade}>{item.quantidade}x</Text>
              <Text style={styles.itemNome}>{item.menu_items?.nome}</Text>
              <Text style={styles.itemCategoria}>
                {item.menu_items?.categoria === 'lanche' ? '🍽️' : '☕'}
              </Text>
            </View>
          ))}
        </View>

        {/* Botões de Ação */}
        <View style={styles.acoesContainer}>
          {pedido.status === 'pendente' && (
            <>
              <TouchableOpacity
                style={[styles.acaoButton, styles.prepararButton]}
                onPress={() => atualizarStatusPedido(pedido.id, 'em_preparo').then(carregarPedidos)}
              >
                <Text style={styles.acaoButtonTexto}>👨‍🍳 Preparar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.acaoButton, styles.cancelarButton]}
                onPress={() => handleCancelar(pedido.id, pedido.numero_pedido)}
              >
                <Text style={styles.acaoButtonTexto}>❌ Cancelar</Text>
              </TouchableOpacity>
            </>
          )}

          {pedido.status === 'em_preparo' && (
            <>
              <TouchableOpacity
                style={[styles.acaoButton, styles.prontoButton]}
                onPress={() => handleMarcarPronto(pedido.id)}
              >
                <Text style={styles.acaoButtonTexto}>✅ Marcar como Pronto</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.acaoButton, styles.cancelarButton]}
                onPress={() => handleCancelar(pedido.id, pedido.numero_pedido)}
              >
                <Text style={styles.acaoButtonTexto}>❌ Cancelar</Text>
              </TouchableOpacity>
            </>
          )}

          {pedido.status === 'pronto' && (
            <>
              <TouchableOpacity
                style={[styles.acaoButton, styles.entregarButton]}
                onPress={() => handleMarcarEntregue(pedido.id)}
              >
                <Text style={styles.acaoButtonTexto}>🎉 Marcar como Entregue</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.acaoButton, styles.cancelarButton]}
                onPress={() => handleCancelar(pedido.id, pedido.numero_pedido)}
              >
                <Text style={styles.acaoButtonTexto}>❌ Cancelar</Text>
              </TouchableOpacity>
            </>
          )}

          {(pedido.status === 'entregue' || pedido.status === 'cancelado') && (
            <View style={styles.finalizadoInfo}>
              <Text style={styles.finalizadoTexto}>
                {pedido.status === 'entregue' ? '✅ Pedido finalizado' : '❌ Pedido cancelado'}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderVazio = () => (
    <View style={styles.vazioContainer}>
      <Text style={styles.vazioEmoji}>
        {filtroStatus === 'pendente' ? '✨' : '🎉'}
      </Text>
      <Text style={styles.vazioTexto}>
        Nenhum pedido {filtroStatus ? getStatusTexto(filtroStatus).toLowerCase() : ''}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.titulo}>Cozinha</Text>
          <Text style={styles.subtitulo}>{pedidos.length} pedidos</Text>
        </View>

        {/* Botão Limpar Entregues - sempre disponível, independente do filtro atual */}
        <TouchableOpacity
          style={styles.limparButton}
          onPress={handleLimparEntregues}
        >
          <Text style={styles.limparButtonTexto}>🧹 Limpar Entregues</Text>
        </TouchableOpacity>
      </View>

      {/* Filtros */}
      <View style={styles.filtrosContainer}>
        <TouchableOpacity
          style={[
            styles.filtroButton,
            filtroStatus === 'pendente' && styles.filtroAtivo,
          ]}
          onPress={() => setFiltroStatus('pendente')}
        >
          <Text
            style={[
              styles.filtroTexto,
              filtroStatus === 'pendente' && styles.filtroTextoAtivo,
            ]}
          >
            ⏳ Pendente
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filtroButton,
            filtroStatus === 'em_preparo' && styles.filtroAtivo,
          ]}
          onPress={() => setFiltroStatus('em_preparo')}
        >
          <Text
            style={[
              styles.filtroTexto,
              filtroStatus === 'em_preparo' && styles.filtroTextoAtivo,
            ]}
          >
            👨‍🍳 Preparo
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filtroButton,
            filtroStatus === 'pronto' && styles.filtroAtivo,
          ]}
          onPress={() => setFiltroStatus('pronto')}
        >
          <Text
            style={[
              styles.filtroTexto,
              filtroStatus === 'pronto' && styles.filtroTextoAtivo,
            ]}
          >
            ✅ Pronto
          </Text>
        </TouchableOpacity>
      </View>

      {/* Lista de Pedidos */}
      <FlatList
        data={pedidos}
        keyExtractor={(item) => item.id}
        renderItem={renderPedidoItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderVazio}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={carregarPedidos}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      />
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
    paddingBottom: 12,
  },
  titulo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
  },
  subtitulo: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 4,
  },
  limparButton: {
    backgroundColor: colors.danger,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  limparButtonTexto: {
    color: colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  filtrosContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  filtroButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filtroAtivo: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filtroTexto: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  filtroTextoAtivo: {
    color: colors.black,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  pedidoCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  pedidoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pedidoNumero: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  pedidoCliente: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 4,
  },
  pedidoHora: {
    fontSize: 14,
    color: colors.textLight,
  },
  pedidoStatusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 8,
  },
  statusTexto: {
    color: colors.black,
    fontSize: 12,
    fontWeight: 'bold',
  },
  pedidoTotal: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  itensContainer: {
    marginBottom: 16,
  },
  itensLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  itemLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  itemQuantidade: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    width: 40,
  },
  itemNome: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  itemCategoria: {
    fontSize: 18,
  },
  acoesContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  acaoButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  prepararButton: {
    backgroundColor: '#3498db',
  },
  prontoButton: {
    backgroundColor: colors.success,
  },
  entregarButton: {
    backgroundColor: colors.primary,
  },
  cancelarButton: {
    backgroundColor: colors.danger,
  },
  acaoButtonTexto: {
    color: colors.black,
    fontSize: 14,
    fontWeight: 'bold',
  },
  finalizadoInfo: {
    flex: 1,
    padding: 12,
    backgroundColor: colors.background,
    borderRadius: 8,
    alignItems: 'center',
  },
  finalizadoTexto: {
    fontSize: 14,
    color: colors.textLight,
    fontWeight: '600',
  },
  vazioContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  vazioEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  vazioTexto: {
    fontSize: 18,
    color: colors.textLight,
    textAlign: 'center',
  },
});

export default CozinhaTab;