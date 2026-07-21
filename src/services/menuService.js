import { supabase } from '../config/supabase';

// ========================================
// SERVIÇO DE CARDÁPIO
// ========================================

/**
 * Buscar todos os itens do cardápio
 */
export const getMenuItems = async () => {
  try {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .order('categoria', { ascending: true })
      .order('nome', { ascending: true });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Erro ao buscar itens:', error);
    return { success: false, error: error.message };
  }
};


/**
 * Buscar itens por categoria
 */
export const getMenuItemsByCategory = async (categoria) => {
  try {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('categoria', categoria)
      .order('nome', { ascending: true });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Erro ao buscar itens:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Buscar item com seus ingredientes
 */
export const getMenuItemWithIngredients = async (itemId) => {
  try {
    // Buscar item
    const { data: item, error: itemError } = await supabase
      .from('menu_items')
      .select('*')
      .eq('id', itemId)
      .single();

    if (itemError) throw itemError;

    // Buscar receita (ingredientes necessários)
    const { data: receita, error: receitaError } = await supabase
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
      .eq('menu_item_id', itemId);

    if (receitaError) throw receitaError;

    return {
      success: true,
      data: {
        ...item,
        ingredientes: receita,
      },
    };
  } catch (error) {
    console.error('Erro ao buscar item com ingredientes:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Verificar se há estoque suficiente para um item
 */
export const verificarEstoqueDisponivel = async (itemId, quantidade = 1) => {
  try {
    const { data: receita, error } = await supabase
      .from('receitas')
      .select(`
        quantidade_necessaria,
        ingredientes (
          nome,
          quantidade_atual
        )
      `)
      .eq('menu_item_id', itemId);

    if (error) throw error;

    // Verificar cada ingrediente
    const estoqueInsuficiente = receita.filter((r) => {
      const quantidadeNecessaria = r.quantidade_necessaria * quantidade;
      return r.ingredientes.quantidade_atual < quantidadeNecessaria;
    });

    return {
      success: true,
      disponivel: estoqueInsuficiente.length === 0,
      faltando: estoqueInsuficiente.map((r) => r.ingredientes.nome),
    };
  } catch (error) {
    console.error('Erro ao verificar estoque:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Atualizar disponibilidade de um item
 */
export const updateMenuItemDisponibilidade = async (itemId, disponivel) => {
  try {
    const { data, error } = await supabase
      .from('menu_items')
      .update({ disponivel })
      .eq('id', itemId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Erro ao atualizar disponibilidade:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Adicionar novo item ao cardápio
 */
export const addMenuItem = async (item) => {
  try {
    const { data, error } = await supabase
      .from('menu_items')
      .insert([
        {
          nome: item.nome,
          categoria: item.categoria,
          preco: item.preco,
          disponivel: item.disponivel ?? true,
          quantidade_estoque: item.quantidade_estoque ?? null,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Erro ao adicionar item:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Subscribe para mudanças em tempo real no cardápio
 */
export const subscribeToMenuChanges = (callback) => {
  const subscription = supabase
    .channel('menu-changes')
    .on(
      'postgres_changes',
      {
        event: '*', // INSERT, UPDATE, DELETE
        schema: 'public',
        table: 'menu_items',
      },
      (payload) => {
        console.log('Mudança no cardápio:', payload);
        callback(payload);
      }
    )
    .subscribe();

  // Retornar função para cancelar subscription
  return () => {
    supabase.removeChannel(subscription);
  };
};

/**
 * Deletar item do cardápio (na verdade, apenas desativa)
 */
export const deletarMenuItem = async (itemId) => {
  try {
    // Ao invés de deletar, vamos desativar o item
    // Isso evita problemas com pedidos antigos que usaram esse item
    const { data, error } = await supabase
      .from('menu_items')
      .update({ disponivel: false }) // ← Apenas marca como indisponível
      .eq('id', itemId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Erro ao desativar item:', error);
    return { success: false, error: error.message };
  }
};
/**
 * Atualizar item do cardápio
 */
export const atualizarMenuItem = async (itemId, dados) => {
  try {
    const { data, error } = await supabase
      .from('menu_items')
      .update(dados)
      .eq('id', itemId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Erro ao atualizar item:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Reativar item do cardápio
 */
export const reativarMenuItem = async (itemId) => {
  try {
    const { data, error } = await supabase
      .from('menu_items')
      .update({ disponivel: true })
      .eq('id', itemId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Erro ao reativar item:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Excluir item do cardápio PERMANENTEMENTE (remove do banco de dados).
 * Diferente de deletarMenuItem, que apenas desativa o item.
 * Falha com uma mensagem amigável se o item já foi usado em pedidos
 * (restrição de chave estrangeira), já que isso quebraria o histórico.
 */
export const excluirMenuItemPermanentemente = async (itemId) => {
  try {
    // A receita (ingredientes vinculados) não é histórico, pode remover direto
    await supabase.from('receitas').delete().eq('menu_item_id', itemId);

    const { error } = await supabase.from('menu_items').delete().eq('id', itemId);

    if (error) {
      if (error.code === '23503') {
        return {
          success: false,
          error:
            'Este item já foi usado em pedidos e não pode ser excluído permanentemente. Mantenha-o desativado.',
        };
      }
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Erro ao excluir item permanentemente:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Descontar 1 (ou mais) unidades do estoque de um item do cardápio
 * quando ele é vendido. Itens com quantidade_estoque nula não têm
 * controle de estoque e são ignorados.
 */
export const descontarEstoqueMenuItem = async (itemId, quantidade) => {
  try {
    const { data: item, error: getError } = await supabase
      .from('menu_items')
      .select('quantidade_estoque')
      .eq('id', itemId)
      .single();

    if (getError) throw getError;
    if (item.quantidade_estoque === null || item.quantidade_estoque === undefined) {
      return { success: true, message: 'Item sem controle de estoque' };
    }

    const { error } = await supabase
      .from('menu_items')
      .update({ quantidade_estoque: Math.max(item.quantidade_estoque - quantidade, 0) })
      .eq('id', itemId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Erro ao descontar estoque do item:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Devolver unidades ao estoque de um item do cardápio quando o
 * pedido correspondente é cancelado.
 */
export const devolverEstoqueMenuItem = async (itemId, quantidade) => {
  try {
    const { data: item, error: getError } = await supabase
      .from('menu_items')
      .select('quantidade_estoque')
      .eq('id', itemId)
      .single();

    if (getError) throw getError;
    if (item.quantidade_estoque === null || item.quantidade_estoque === undefined) {
      return { success: true, message: 'Item sem controle de estoque' };
    }

    const { error } = await supabase
      .from('menu_items')
      .update({ quantidade_estoque: item.quantidade_estoque + quantidade })
      .eq('id', itemId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Erro ao devolver estoque do item:', error);
    return { success: false, error: error.message };
  }
};