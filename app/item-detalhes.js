import { useLocalSearchParams } from 'expo-router';
import ItemDetalhesScreen from '../src/screens/ItemDetalhesScreen';

export default function ItemDetalhesRoute() {
  const params = useLocalSearchParams();
  
  // Reconstruir o objeto item dos parâmetros
  const item = {
    id: params.id,
    nome: params.nome,
    preco: parseFloat(params.preco),
    categoria: params.categoria,
    disponivel: params.disponivel === 'true',
    quantidade_estoque:
      params.quantidadeEstoque === undefined || params.quantidadeEstoque === ''
        ? null
        : parseInt(params.quantidadeEstoque, 10),
  };

  return <ItemDetalhesScreen item={item} />;
}