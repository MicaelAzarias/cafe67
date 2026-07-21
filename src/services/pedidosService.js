import { supabase } from '../config/supabase';
import { descontarEstoque, devolverEstoque } from './estoqueService';
import { descontarEstoqueMenuItem, devolverEstoqueMenuItem } from './menuService';

// ========================================
// SERVIÇO DE PEDIDOS
// ========================================

/**
 * Criar novo pedido
 */
export const criarPedido = async (pedidoData, usuarioId) => {
  try {
    // 1. Criar o pedido principal
    const { data: pedido, error: pedidoError } = await supabase
      .from('pedidos')
      .insert([
        {
          nome_cliente: pedidoData.nome_cliente,
          forma_pagamento: pedidoData.forma_pagamento,
          // atendente_id: usuarioId, ← DEVE ESTAR COMENTADO
          status: 'pendente',
          total: pedidoData.total,
          observacao: pedidoData.observacao || '',
        },
      ])
      .select()
      .single();
      
    if (pedidoError) throw pedidoError;

    // 2. Adicionar os itens do pedido
    const itensComPedidoId = pedidoData.itens.map((item) => ({
      ...item,
      pedido_id: pedido.id,
    }));

    const { error: itensError } = await supabase
      .from('pedido_items')
      .insert(itensComPedidoId);

    if (itensError) throw itensError;

    // 3. Descontar ingredientes do estoque automaticamente
    for (const item of pedidoData.itens) {
      const resultado = await descontarEstoque(item.menu_item_id, item.quantidade);

      if (!resultado.success && resultado.error === 'Estoque insuficiente') {
        console.warn('Estoque insuficiente para:', resultado.faltando);
        // Continua mesmo com estoque baixo (só avisa no log)
        // Você pode mudar isso para bloquear o pedido se preferir
      }

      // 3b. Descontar a quantidade em estoque do próprio item do cardápio
      await descontarEstoqueMenuItem(item.menu_item_id, item.quantidade);
    }

    return { success: true, data: pedido };
  } catch (error) {
    console.error('Erro ao criar pedido:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Buscar todos os pedidos
 */
export const getPedidos = async (filtroStatus = null) => {
  try {
    let query = supabase
      .from('pedidos')
      .select(`
        *,
        pedido_items (
          *,
          menu_items (
            nome,
            categoria
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (filtroStatus) {
      query = query.eq('status', filtroStatus);
    }

    const { data, error } = await query;

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Atualizar status do pedido
 */
export const atualizarStatusPedido = async (pedidoId, novoStatus) => {
  try {
    const updateData = { status: novoStatus };
    
    // Se marcar como entregue, adicionar timestamp
    if (novoStatus === 'entregue') {
      updateData.finalizado_em = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('pedidos')
      .update(updateData)
      .eq('id', pedidoId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Atualizar forma de pagamento e/ou observação de um pedido já existente
 * (usado na tela de Vendas para corrigir uma venda já feita)
 */
export const atualizarPedidoVenda = async (pedidoId, { forma_pagamento, observacao }) => {
  try {
    const updateData = {};
    if (forma_pagamento !== undefined) updateData.forma_pagamento = forma_pagamento;
    if (observacao !== undefined) updateData.observacao = observacao;

    const { data, error } = await supabase
      .from('pedidos')
      .update(updateData)
      .eq('id', pedidoId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Erro ao atualizar pedido:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Cancelar pedido
 */
export const cancelarPedido = async (pedidoId) => {
  try {
    // 1. Buscar itens do pedido para devolver ao estoque
    const { data: pedido, error: pedidoError } = await supabase
      .from('pedidos')
      .select(`
        *,
        pedido_items (
          menu_item_id,
          quantidade
        )
      `)
      .eq('id', pedidoId)
      .single();

    if (pedidoError) throw pedidoError;

    // 2. Devolver ingredientes ao estoque e a quantidade do item do cardápio
    for (const item of pedido.pedido_items) {
      await devolverEstoque(item.menu_item_id, item.quantidade);
      await devolverEstoqueMenuItem(item.menu_item_id, item.quantidade);
    }

    // 3. Marcar pedido como cancelado
    const { data, error } = await supabase
      .from('pedidos')
      .update({ status: 'cancelado' })
      .eq('id', pedidoId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Erro ao cancelar pedido:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Subscribe para mudanças em tempo real nos pedidos.
 * channelName deve ser único por tela para evitar conflito quando
 * mais de uma aba estiver montada ao mesmo tempo (React Navigation
 * mantém as abas montadas em segundo plano).
 */
export const subscribeToPedidosChanges = (callback, channelName = 'pedidos-changes') => {
  const subscription = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'pedidos',
      },
      (payload) => {
        console.log('Mudança nos pedidos:', payload);
        callback(payload);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
  };
};

/**
 * Excluir uma venda (pedido) permanentemente
 * Usado na tela de Vendas para remover um registro de venda.
 * Devolve ao estoque os ingredientes e itens do cardápio que foram
 * descontados quando a venda foi feita (igual ao cancelar pedido na Cozinha).
 */
export const excluirVenda = async (pedidoId) => {
  try {
    // 1. Buscar itens do pedido para devolver ao estoque
    const { data: pedido, error: pedidoError } = await supabase
      .from('pedidos')
      .select(`
        *,
        pedido_items (
          menu_item_id,
          quantidade
        )
      `)
      .eq('id', pedidoId)
      .single();

    if (pedidoError) throw pedidoError;

    // 2. Devolver ingredientes ao estoque e a quantidade do item do cardápio
    for (const item of pedido.pedido_items) {
      await devolverEstoque(item.menu_item_id, item.quantidade);
      await devolverEstoqueMenuItem(item.menu_item_id, item.quantidade);
    }

    // 3. Excluir o pedido permanentemente
    const { error } = await supabase
      .from('pedidos')
      .delete()
      .eq('id', pedidoId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Erro ao excluir venda:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Limpar todos os pedidos entregues
 */
export const limparPedidosEntregues = async () => {
  try {
    // Buscar pedidos entregues
    const { data: pedidosEntregues, error: buscarError } = await supabase
      .from('pedidos')
      .select('id')
      .eq('status', 'entregue');

    if (buscarError) throw buscarError;

    const quantidade = pedidosEntregues?.length || 0;

    if (quantidade === 0) {
      return { success: true, quantidade: 0 };
    }

    // Deletar pedidos entregues
    const { error: deleteError } = await supabase
      .from('pedidos')
      .delete()
      .eq('status', 'entregue');

    if (deleteError) throw deleteError;

    return { success: true, quantidade };
  } catch (error) {
    console.error('Erro ao limpar pedidos:', error);
    return { success: false, error: error.message };
  }
};