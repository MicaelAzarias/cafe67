import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
} from 'react-native';
import { colors } from '../../src/theme/colors';
import HeaderUsuario from '../../src/components/HeaderUsuario';
import ModalEditarVenda from '../../src/components/ModalEditarVenda';
import { getResumoVendasPeriodo, getPedidosDetalhadosPeriodo } from '../../src/services/financeiroService';
import { subscribeToPedidosChanges, atualizarPedidoVenda, excluirVenda } from '../../src/services/pedidosService';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const FORMAS_PAGAMENTO_LABELS = {
  dinheiro: { label: 'Dinheiro', icon: '💵', cor: '#27AE60' },
  pix: { label: 'PIX', icon: '📱', cor: '#3498DB' },
  credito: { label: 'Crédito', icon: '💳', cor: '#9B59B6' },
  debito: { label: 'Débito', icon: '💳', cor: '#E67E22' },
  nao_pago: { label: 'Não Pago', icon: '⏳', cor: '#E74C3C' },
};

const hoje = () => {
  const data = new Date();
  data.setHours(0, 0, 0, 0);
  return data;
};

const formatarDataInput = (data) =>
  data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

const aplicarMascaraData = (texto) => {
  const digitos = texto.replace(/\D/g, '').slice(0, 8);
  if (digitos.length > 4) return `${digitos.slice(0, 2)}/${digitos.slice(2, 4)}/${digitos.slice(4)}`;
  if (digitos.length > 2) return `${digitos.slice(0, 2)}/${digitos.slice(2)}`;
  return digitos;
};

const parseDataBr = (texto) => {
  const match = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;

  const [, dia, mes, ano] = match;
  const data = new Date(Number(ano), Number(mes) - 1, Number(dia));
  data.setHours(0, 0, 0, 0);

  const dataValida = data.getDate() === Number(dia) && data.getMonth() === Number(mes) - 1;
  return dataValida ? data : null;
};

const formatarPeriodoExibicao = (inicio, fim) => {
  const opcoes = { day: '2-digit', month: 'long', year: 'numeric' };
  if (inicio.toDateString() === fim.toDateString()) {
    return inicio.toLocaleDateString('pt-BR', opcoes);
  }
  return `${inicio.toLocaleDateString('pt-BR', opcoes)} até ${fim.toLocaleDateString('pt-BR', opcoes)}`;
};

const PRESETS = [
  { id: 'hoje', label: 'Hoje' },
  { id: 'ontem', label: 'Ontem' },
  { id: '7dias', label: 'Últimos 7 dias' },
  { id: 'mes', label: 'Este mês' },
];

export default function VendasTab() {
  const [resumo, setResumo] = useState(null);
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dataInicio, setDataInicio] = useState(hoje());
  const [dataFim, setDataFim] = useState(hoje());
  const [inicioTexto, setInicioTexto] = useState(formatarDataInput(hoje()));
  const [fimTexto, setFimTexto] = useState(formatarDataInput(hoje()));
  const [presetAtivo, setPresetAtivo] = useState('hoje');
  const [pedidoSelecionado, setPedidoSelecionado] = useState(null);
  const [modalVisivel, setModalVisivel] = useState(false);

  useEffect(() => {
    carregarDados();

    // Atualiza o resumo automaticamente quando algum pedido muda no Supabase
    const unsubscribe = subscribeToPedidosChanges(() => {
      carregarDados();
    }, 'pedidos-changes-vendas');

    return () => {
      unsubscribe();
    };
  }, [dataInicio, dataFim]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const resultado = await getResumoVendasPeriodo(dataInicio, dataFim);

      if (resultado.success) {
        setResumo(resultado.data);
        setPedidos(resultado.pedidos);
      } else {
        Alert.alert('Erro', 'Não foi possível carregar dados');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const aplicarPreset = (presetId) => {
    const base = hoje();
    let inicio = base;
    let fim = base;

    if (presetId === 'ontem') {
      const ontem = new Date(base);
      ontem.setDate(ontem.getDate() - 1);
      inicio = ontem;
      fim = ontem;
    } else if (presetId === '7dias') {
      const seteDiasAtras = new Date(base);
      seteDiasAtras.setDate(seteDiasAtras.getDate() - 6);
      inicio = seteDiasAtras;
      fim = base;
    } else if (presetId === 'mes') {
      inicio = new Date(base.getFullYear(), base.getMonth(), 1);
      fim = base;
    }

    setPresetAtivo(presetId);
    setDataInicio(inicio);
    setDataFim(fim);
    setInicioTexto(formatarDataInput(inicio));
    setFimTexto(formatarDataInput(fim));
  };

  const handleAplicarFiltroCustom = () => {
    const inicio = parseDataBr(inicioTexto);
    const fim = parseDataBr(fimTexto);

    if (!inicio || !fim) {
      Alert.alert('Data inválida', 'Preencha as datas no formato DD/MM/AAAA');
      return;
    }

    if (inicio > fim) {
      Alert.alert('Período inválido', 'A data inicial não pode ser depois da data final');
      return;
    }

    setPresetAtivo(null);
    setDataInicio(inicio);
    setDataFim(fim);
  };

  const gerarPDF = async () => {
    try {
      if (!resumo || !pedidos) {
        Alert.alert('Erro', 'Nenhum dado para gerar relatório');
        return;
      }

      const dataFormatada = formatarPeriodoExibicao(dataInicio, dataFim);

      // Buscar pedidos detalhados do período filtrado
      const { data: pedidosDetalhados } = await getPedidosDetalhadosPeriodo(dataInicio, dataFim);

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Relatório de Vendas - ${dataFormatada}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              color: #333;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 3px solid #5C6E3E;
              padding-bottom: 20px;
            }
            .header h1 {
              color: #5C6E3E;
              margin: 0;
              font-size: 28px;
            }
            .header h2 {
              color: #6B7754;
              margin: 5px 0;
              font-size: 18px;
            }
            .resumo {
              margin: 20px 0;
              padding: 20px;
              background-color: #F5F1E3;
              border-radius: 8px;
            }
            .resumo-item {
              display: flex;
              justify-content: space-between;
              padding: 12px;
              margin: 8px 0;
              background-color: white;
              border-radius: 6px;
              border-left: 4px solid #5C6E3E;
            }
            .resumo-item.total {
              background-color: #5C6E3E;
              color: white;
              font-weight: bold;
              font-size: 18px;
              border: none;
            }
            .label {
              font-weight: 600;
            }
            .valor {
              font-weight: bold;
              color: #5C6E3E;
            }
            .resumo-item.total .valor {
              color: white;
            }
            .pedidos {
              margin-top: 30px;
            }
            .pedidos h3 {
              color: #5C6E3E;
              border-bottom: 2px solid #5C6E3E;
              padding-bottom: 10px;
            }
            .pedido {
              margin: 15px 0;
              padding: 15px;
              border: 1px solid #D4CCBA;
              border-radius: 8px;
              background-color: #FDFBF7;
            }
            .pedido-header {
              display: flex;
              justify-content: space-between;
              margin-bottom: 10px;
              font-weight: bold;
            }
            .pedido-items {
              margin-top: 10px;
              padding-left: 20px;
            }
            .pedido-item {
              padding: 5px 0;
              color: #6B7754;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              color: #6B7754;
              font-size: 12px;
              border-top: 1px solid #D4CCBA;
              padding-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>☕ Meia Sete Café</h1>
            <h2>Relatório de Vendas</h2>
            <p>${dataFormatada}</p>
          </div>

          <div class="resumo">
            <h3 style="margin-top: 0; color: #5C6E3E;">📊 Resumo por Forma de Pagamento</h3>
            
            <div class="resumo-item">
              <span class="label">💵 Dinheiro</span>
              <span class="valor">R$ ${resumo.dinheiro.toFixed(2)}</span>
            </div>

            <div class="resumo-item">
              <span class="label">📱 PIX</span>
              <span class="valor">R$ ${resumo.pix.toFixed(2)}</span>
            </div>

            <div class="resumo-item">
              <span class="label">💳 Cartão de Crédito</span>
              <span class="valor">R$ ${resumo.credito.toFixed(2)}</span>
            </div>

            <div class="resumo-item">
              <span class="label">💳 Cartão de Débito</span>
              <span class="valor">R$ ${resumo.debito.toFixed(2)}</span>
            </div>

            <div class="resumo-item">
              <span class="label">⏳ Ainda Não Pago</span>
              <span class="valor">R$ ${resumo.nao_pago.toFixed(2)}</span>
            </div>

            <div class="resumo-item total">
              <span class="label">TOTAL GERAL</span>
              <span class="valor">R$ ${resumo.total.toFixed(2)}</span>
            </div>

            <div class="resumo-item">
              <span class="label">📋 Total de Pedidos</span>
              <span class="valor">${resumo.quantidade_pedidos}</span>
            </div>

            <div class="resumo-item">
              <span class="label">📈 Ticket Médio</span>
              <span class="valor">R$ ${resumo.ticket_medio.toFixed(2)}</span>
            </div>
          </div>

          <div class="pedidos">
            <h3>📋 Pedidos Detalhados (${pedidosDetalhados?.length || 0})</h3>
            ${pedidosDetalhados?.map((pedido) => `
              <div class="pedido">
                <div class="pedido-header">
                  <span>Pedido #${pedido.numero_pedido} - ${pedido.nome_cliente}</span>
                  <span>R$ ${pedido.total.toFixed(2)}</span>
                </div>
                <div>
                  <strong>Pagamento:</strong> ${FORMAS_PAGAMENTO_LABELS[pedido.forma_pagamento]?.label || pedido.forma_pagamento}
                </div>
                <div>
                  <strong>Data/Hora:</strong> ${new Date(pedido.created_at).toLocaleString('pt-BR')}
                </div>
                <div class="pedido-items">
                  <strong>Itens:</strong>
                  ${pedido.pedido_items?.map(item => `
                    <div class="pedido-item">
                      • ${item.quantidade}x ${item.menu_items?.nome} - R$ ${item.subtotal.toFixed(2)}
                    </div>
                  `).join('') || ''}
                </div>
              </div>
            `).join('') || '<p>Nenhum pedido encontrado</p>'}
          </div>

          <div class="footer">
            <p>Relatório gerado em ${new Date().toLocaleString('pt-BR')}</p>
            <p>Meia Sete Café - Sistema de Gestão</p>
          </div>
        </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      
      // Compartilhar o PDF
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert('Sucesso', `PDF salvo em: ${uri}`);
      }
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      Alert.alert('Erro', 'Não foi possível gerar o PDF');
    }
  };

  const handleAbrirEdicaoVenda = (pedido) => {
    setPedidoSelecionado(pedido);
    setModalVisivel(true);
  };

  const handleSalvarEdicaoVenda = async (pedidoId, dados) => {
    try {
      const resultado = await atualizarPedidoVenda(pedidoId, dados);
      if (resultado.success) {
        setModalVisivel(false);
        setPedidoSelecionado(null);
        Alert.alert('Sucesso! ✅', 'Venda atualizada');
        carregarDados();
      } else {
        Alert.alert('Erro', resultado.error);
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível atualizar a venda');
      console.error(error);
    }
  };

  const handleExcluirVenda = async (pedidoId) => {
    try {
      const resultado = await excluirVenda(pedidoId);
      if (resultado.success) {
        setModalVisivel(false);
        setPedidoSelecionado(null);
        Alert.alert('Excluído! 🗑️', 'Venda removida com sucesso');
        carregarDados();
      } else {
        Alert.alert('Erro', resultado.error);
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível excluir a venda');
      console.error(error);
    }
  };

  const formatarMoeda = (valor) => {
    return `R$ ${valor.toFixed(2)}`;
  };

  const renderResumoCard = (forma, valor) => {
    const info = FORMAS_PAGAMENTO_LABELS[forma];
    if (!info) return null;

    return (
      <View key={forma} style={[styles.card, { borderLeftColor: info.cor }]}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardIcon}>{info.icon}</Text>
          <Text style={styles.cardLabel}>{info.label}</Text>
        </View>
        <Text style={[styles.cardValor, { color: info.cor }]}>
          {formatarMoeda(valor)}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <HeaderUsuario />
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={carregarDados}
            colors={[colors.primary]}
          />
        }
      >
        {/* Header */}
        <View style={styles.headerContent}>
          <Text style={styles.titulo}>💰 Fechamento</Text>
          <Text style={styles.data}>{formatarPeriodoExibicao(dataInicio, dataFim)}</Text>
        </View>

        {/* Filtro de período */}
        <View style={styles.filtroContainer}>
          <Text style={styles.filtroTitulo}>🔍 Filtrar Período</Text>

          <View style={styles.presetsContainer}>
            {PRESETS.map((preset) => (
              <TouchableOpacity
                key={preset.id}
                style={[
                  styles.presetButton,
                  presetAtivo === preset.id && styles.presetButtonAtivo,
                ]}
                onPress={() => aplicarPreset(preset.id)}
              >
                <Text
                  style={[
                    styles.presetTexto,
                    presetAtivo === preset.id && styles.presetTextoAtivo,
                  ]}
                >
                  {preset.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.datasContainer}>
            <View style={styles.dataCampo}>
              <Text style={styles.dataLabel}>De</Text>
              <TextInput
                style={styles.dataInput}
                value={inicioTexto}
                onChangeText={(texto) => setInicioTexto(aplicarMascaraData(texto))}
                placeholder="DD/MM/AAAA"
                placeholderTextColor={colors.textLight}
                keyboardType="numeric"
                maxLength={10}
              />
            </View>

            <View style={styles.dataCampo}>
              <Text style={styles.dataLabel}>Até</Text>
              <TextInput
                style={styles.dataInput}
                value={fimTexto}
                onChangeText={(texto) => setFimTexto(aplicarMascaraData(texto))}
                placeholder="DD/MM/AAAA"
                placeholderTextColor={colors.textLight}
                keyboardType="numeric"
                maxLength={10}
              />
            </View>
          </View>

          <TouchableOpacity style={styles.aplicarFiltroButton} onPress={handleAplicarFiltroCustom}>
            <Text style={styles.aplicarFiltroTexto}>Aplicar Filtro</Text>
          </TouchableOpacity>
        </View>

        {resumo && (
          <>
            {/* Cards de Formas de Pagamento */}
            <View style={styles.cardsContainer}>
              {renderResumoCard('dinheiro', resumo.dinheiro)}
              {renderResumoCard('pix', resumo.pix)}
              {renderResumoCard('credito', resumo.credito)}
              {renderResumoCard('debito', resumo.debito)}
              {renderResumoCard('nao_pago', resumo.nao_pago)}
            </View>

            {/* Total Geral */}
            <View style={styles.totalCard}>
              <Text style={styles.totalLabel}>TOTAL GERAL</Text>
              <Text style={styles.totalValor}>{formatarMoeda(resumo.total)}</Text>
              <View style={styles.totalInfo}>
                <Text style={styles.totalInfoTexto}>
                  📋 {resumo.quantidade_pedidos} pedidos
                </Text>
                <Text style={styles.totalInfoTexto}>
                  📈 Ticket médio: {formatarMoeda(resumo.ticket_medio)}
                </Text>
              </View>
            </View>

            {/* Botão Gerar PDF */}
            <TouchableOpacity
              style={styles.pdfButton}
              onPress={gerarPDF}
            >
              <Text style={styles.pdfButtonTexto}>📄 Gerar Relatório PDF</Text>
            </TouchableOpacity>

            {/* Lista de Pedidos */}
            <View style={styles.pedidosSection}>
              <Text style={styles.pedidosTitulo}>
                📋 Pedidos do Dia ({pedidos.length})
              </Text>
              {pedidos.map((pedido) => (
                <TouchableOpacity
                  key={pedido.id}
                  style={styles.pedidoCard}
                  activeOpacity={0.7}
                  onPress={() => handleAbrirEdicaoVenda(pedido)}
                >
                  <View style={styles.pedidoHeader}>
                    <Text style={styles.pedidoNumero}>#{pedido.numero_pedido}</Text>
                    <Text style={styles.pedidoValor}>
                      {formatarMoeda(pedido.total)}
                    </Text>
                  </View>
                  <Text style={styles.pedidoCliente}>
                    👤 {pedido.nome_cliente}
                  </Text>
                  <Text style={styles.pedidoPagamento}>
                    {FORMAS_PAGAMENTO_LABELS[pedido.forma_pagamento]?.icon}{' '}
                    {FORMAS_PAGAMENTO_LABELS[pedido.forma_pagamento]?.label}
                  </Text>
                  {!!pedido.observacao && (
                    <Text style={styles.pedidoObservacao} numberOfLines={2}>
                      📝 {pedido.observacao}
                    </Text>
                  )}
                  <Text style={styles.pedidoHora}>
                    🕐 {new Date(pedido.created_at).toLocaleString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                  <Text style={styles.pedidoEditarDica}>Toque para editar</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      <ModalEditarVenda
        visivel={modalVisivel}
        onFechar={() => {
          setModalVisivel(false);
          setPedidoSelecionado(null);
        }}
        onSalvar={handleSalvarEdicaoVenda}
        onExcluir={handleExcluirVenda}
        pedido={pedidoSelecionado}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  headerContent: {
    padding: 20,
    paddingTop: 10,
  },
  titulo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 8,
  },
  data: {
    fontSize: 16,
    color: colors.textLight,
  },
  filtroContainer: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    backgroundColor: colors.white,
    borderRadius: 12,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  filtroTitulo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 12,
  },
  presetsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  presetButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  presetButtonAtivo: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  presetTexto: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  presetTextoAtivo: {
    color: colors.white,
  },
  datasContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  dataCampo: {
    flex: 1,
  },
  dataLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  dataInput: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  aplicarFiltroButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  aplicarFiltroTexto: {
    color: colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  cardsContainer: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  cardLabel: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '600',
  },
  cardValor: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  totalCard: {
    margin: 16,
    marginTop: 8,
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    elevation: 4,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  totalLabel: {
    fontSize: 14,
    color: colors.white,
    fontWeight: '600',
    marginBottom: 8,
  },
  totalValor: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 16,
  },
  totalInfo: {
    flexDirection: 'row',
    gap: 20,
  },
  totalInfoTexto: {
    fontSize: 14,
    color: colors.white,
  },
  pdfButton: {
    margin: 16,
    marginTop: 8,
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    elevation: 3,
  },
  pdfButtonTexto: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
  },
  pedidosSection: {
    padding: 16,
  },
  pedidosTitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 12,
  },
  pedidoCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  pedidoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  pedidoNumero: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  pedidoValor: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  pedidoCliente: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 4,
  },
  pedidoPagamento: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 4,
  },
  pedidoHora: {
    fontSize: 12,
    color: colors.textLight,
  },
  pedidoObservacao: {
    fontSize: 13,
    color: colors.text,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  pedidoEditarDica: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 6,
    textAlign: 'right',
  },
});