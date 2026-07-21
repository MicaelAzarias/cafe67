// imports necessarios para configurar o cliente do Supabase
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://iwhuqhejhqfrjzxpqcms.supabase.co"; // url do projeto supabase
const SUPABASE_ANON_KEY = "sb_publishable_SI2SgMUvWFaArpRyNiHR0Q_1aAFi3U9"; // chave anonima do projeto supabase

// Criar cliente Supabase
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        storage: AsyncStorage, // Usar AsyncStorage para persistência de sessão
        autoRefreshToken: true, // Habilitar atualização automática do token
        persistSession: true, // Persistir sessão entre reinicializações do app
        detectSessionInUrl: false, // Não detectar sessão na URL (não necessário para React Native)
    },
});

// Helper para verificar conexão com o Supabase
export const testarConexao = async () => {
    try {
        const { data, error } = await supabase.from('menu_items').select('count');
        if (error) throw error;
        console.log('✅ Conectado ao Supabase!')
        return true;
    } catch (error) {
        console.error('❌ Erro ao conectar ao Supabase:', error.message);
        return false;
        }
    };