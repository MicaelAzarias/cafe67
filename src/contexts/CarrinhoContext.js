import React, { createContext, useContext, useState } from 'react';

const CarrinhoContext = createContext();

export const useCarrinho = () => {
  const context = useContext(CarrinhoContext);
  if (!context) {
    throw new Error('useCarrinho deve ser usado dentro de CarrinhoProvider');
  }
  return context;
};

export const CarrinhoProvider = ({ children }) => {
  const [itens, setItens] = useState([]);

  // Adicionar item ao carrinho
  const adicionarItem = (item, quantidade = 1) => {
    setItens(prevItens => {
      // Verificar se o item já está no carrinho
      const itemExistente = prevItens.find(i => i.id === item.id);
      
      if (itemExistente) {
        // Atualizar quantidade
        return prevItens.map(i =>
          i.id === item.id
            ? { ...i, quantidade: i.quantidade + quantidade }
            : i
        );
      } else {
        // Adicionar novo item
        return [...prevItens, { ...item, quantidade }];
      }
    });
  };

  // Remover item do carrinho
  const removerItem = (itemId) => {
    setItens(prevItens => prevItens.filter(i => i.id !== itemId));
  };

  // Atualizar quantidade de um item
  const atualizarQuantidade = (itemId, novaQuantidade) => {
    if (novaQuantidade <= 0) {
      removerItem(itemId);
      return;
    }
    
    setItens(prevItens =>
      prevItens.map(i =>
        i.id === itemId ? { ...i, quantidade: novaQuantidade } : i
      )
    );
  };

  // Limpar carrinho
  const limparCarrinho = () => {
    setItens([]);
  };

  // Calcular total
  const calcularTotal = () => {
    return itens.reduce((total, item) => {
      return total + (item.preco * item.quantidade);
    }, 0);
  };

  // Obter quantidade total de itens
  const getQuantidadeTotal = () => {
    return itens.reduce((total, item) => total + item.quantidade, 0);
  };

  return (
    <CarrinhoContext.Provider
      value={{
        itens,
        adicionarItem,
        removerItem,
        atualizarQuantidade,
        limparCarrinho,
        calcularTotal,
        getQuantidadeTotal,
      }}
    >
      {children}
    </CarrinhoContext.Provider>
  );
};