import { supabase } from '../config/supabase';

// ========================================
// SERVIÇO DE ESTOQUE
// ========================================

/**
 * Buscar todos os ingredientes
 */
export const getIngredientes = async () => {
  try {
    const { data, error } = await supabase
      .from('ingredientes')
      .select('*')
      .order('nome', { ascending: true });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Erro ao buscar ingredientes:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Buscar receita de um item (ingredientes necessários)
 */
export const getReceitaItem = async (menuItemId) => {
  try {
    const { data, error } = await supabase
      .from('receitas')
      .select(`
        quantidade_necessaria,
        ingredientes (
          id,
          nome,
          unidade,
          quantidade_atual
        )
      `)
      .eq('menu_item_id', menuItemId);

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Erro ao buscar receita:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Descontar ingredientes do estoque (quando faz pedido)
 */
export const descontarEstoque = async (menuItemId, quantidade) => {
  try {
    // 1. Buscar receita do item
    const { data: receita, error: receitaError } = await supabase
      .from('receitas')
      .select(`
        quantidade_necessaria,
        ingrediente_id,
        ingredientes (
          nome,
          quantidade_atual
        )
      `)
      .eq('menu_item_id', menuItemId);

    if (receitaError) throw receitaError;

    if (!receita || receita.length === 0) {
      console.log('Item sem receita cadastrada, pulando desconto de estoque');
      return { success: true, message: 'Item sem receita' };
    }

    // 2. Verificar se tem estoque suficiente
    const faltando = [];
    for (const item of receita) {
      const quantidadeNecessaria = item.quantidade_necessaria * quantidade;
      if (item.ingredientes.quantidade_atual < quantidadeNecessaria) {
        faltando.push({
          ingrediente: item.ingredientes.nome,
          necessario: quantidadeNecessaria,
          disponivel: item.ingredientes.quantidade_atual,
        });
      }
    }

    if (faltando.length > 0) {
      return {
        success: false,
        error: 'Estoque insuficiente',
        faltando,
      };
    }

    // 3. Descontar cada ingrediente
    for (const item of receita) {
      const quantidadeTotal = item.quantidade_necessaria * quantidade;

      const { error } = await supabase.rpc('descontar_ingrediente', {
        p_ingrediente_id: item.ingrediente_id,
        p_quantidade: quantidadeTotal,
      });

      if (error) {
        // Se não existe a função, usar UPDATE normal
        const { error: updateError } = await supabase
          .from('ingredientes')
          .update({
            quantidade_atual: item.ingredientes.quantidade_atual - quantidadeTotal,
          })
          .eq('id', item.ingrediente_id);

        if (updateError) throw updateError;
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Erro ao descontar estoque:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Devolver ingredientes ao estoque (quando cancela pedido)
 */
export const devolverEstoque = async (menuItemId, quantidade) => {
  try {
    // 1. Buscar receita do item
    const { data: receita, error: receitaError } = await supabase
      .from('receitas')
      .select(`
        quantidade_necessaria,
        ingrediente_id,
        ingredientes (
          quantidade_atual
        )
      `)
      .eq('menu_item_id', menuItemId);

    if (receitaError) throw receitaError;

    if (!receita || receita.length === 0) {
      return { success: true, message: 'Item sem receita' };
    }

    // 2. Devolver cada ingrediente
    for (const item of receita) {
      const quantidadeTotal = item.quantidade_necessaria * quantidade;

      const { error } = await supabase
        .from('ingredientes')
        .update({
          quantidade_atual: item.ingredientes.quantidade_atual + quantidadeTotal,
        })
        .eq('id', item.ingrediente_id);

      if (error) throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Erro ao devolver estoque:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Adicionar entrada de estoque (compra)
 */
export const adicionarEntradaEstoque = async (ingredienteId, quantidade) => {
  try {
    // 1. Atualizar quantidade
    const { data: ingrediente, error: getError } = await supabase
      .from('ingredientes')
      .select('quantidade_atual')
      .eq('id', ingredienteId)
      .single();

    if (getError) throw getError;

    const { error } = await supabase
      .from('ingredientes')
      .update({
        quantidade_atual: ingrediente.quantidade_atual + quantidade,
      })
      .eq('id', ingredienteId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Erro ao adicionar entrada:', error);
    return { success: false, error: error.message };
  }
};