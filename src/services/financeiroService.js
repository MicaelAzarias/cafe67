import { supabase } from '../config/supabase';

// ========================================
// SERVIÇO FINANCEIRO
// ========================================

/**
 * Buscar resumo de vendas de um período (dataInicio até dataFim, inclusive)
 */
export const getResumoVendasPeriodo = async (dataInicio = new Date(), dataFim = new Date()) => {
  try {
    const inicioPeriodo = new Date(dataInicio);
    inicioPeriodo.setHours(0, 0, 0, 0);

    const fimPeriodo = new Date(dataFim);
    fimPeriodo.setHours(23, 59, 59, 999);

    // Buscar pedidos do período (apenas entregues, NÃO cancelados)
    const { data: pedidos, error } = await supabase
      .from('pedidos')
      .select('*')
      .eq('status', 'entregue') // ← Só entregues
      .neq('status', 'cancelado') // ← Garantir que não pega cancelados
      .gte('created_at', inicioPeriodo.toISOString())
      .lte('created_at', fimPeriodo.toISOString());

    if (error) throw error;

    // Calcular totais por forma de pagamento
    const resumo = {
      dinheiro: 0,
      pix: 0,
      credito: 0,
      debito: 0,
      nao_pago: 0,
      total: 0,
      quantidade_pedidos: pedidos.length,
    };

    pedidos.forEach((pedido) => {
      const valor = parseFloat(pedido.total);
      resumo[pedido.forma_pagamento] += valor;
      resumo.total += valor;
    });

    // Calcular ticket médio
    resumo.ticket_medio = resumo.quantidade_pedidos > 0 
      ? resumo.total / resumo.quantidade_pedidos 
      : 0;

    return { success: true, data: resumo, pedidos };
  } catch (error) {
    console.error('Erro ao buscar resumo:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Buscar resumo de vendas de um único dia (atalho para getResumoVendasPeriodo)
 */
export const getResumoVendasDia = async (data = new Date()) => {
  return getResumoVendasPeriodo(data, data);
};

/**
 * Buscar vendas por período
 */
export const getVendasPeriodo = async (dataInicio, dataFim) => {
  try {
    const { data: pedidos, error } = await supabase
      .from('pedidos')
      .select('*')
      .eq('status', 'entregue')
      .gte('created_at', dataInicio.toISOString())
      .lte('created_at', dataFim.toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { success: true, data: pedidos };
  } catch (error) {
    console.error('Erro ao buscar vendas:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Buscar pedidos detalhados de um período (dataInicio até dataFim, inclusive)
 */
export const getPedidosDetalhadosPeriodo = async (dataInicio = new Date(), dataFim = new Date()) => {
  try {
    const inicioPeriodo = new Date(dataInicio);
    inicioPeriodo.setHours(0, 0, 0, 0);

    const fimPeriodo = new Date(dataFim);
    fimPeriodo.setHours(23, 59, 59, 999);

    const { data: pedidos, error } = await supabase
      .from('pedidos')
      .select(`
        *,
        pedido_items (
          quantidade,
          preco_unitario,
          subtotal,
          menu_items (
            nome,
            categoria
          )
        )
      `)
      .eq('status', 'entregue') // ← Só entregues
      .neq('status', 'cancelado') // ← Não pegar cancelados
      .gte('created_at', inicioPeriodo.toISOString())
      .lte('created_at', fimPeriodo.toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { success: true, data: pedidos };
  } catch (error) {
    console.error('Erro ao buscar pedidos detalhados:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Buscar pedidos detalhados de um único dia (atalho para getPedidosDetalhadosPeriodo)
 */
export const getPedidosDetalhadosDia = async (data = new Date()) => {
  return getPedidosDetalhadosPeriodo(data, data);
};