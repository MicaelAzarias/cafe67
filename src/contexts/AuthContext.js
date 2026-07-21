import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../config/supabase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);

  // Verificar se tem usuário salvo ao iniciar
  useEffect(() => {
    verificarUsuarioSalvo();
  }, []);

  const verificarUsuarioSalvo = async () => {
    try {
      const usuarioSalvo = await AsyncStorage.getItem('@usuario');
      console.log('📱 Verificando usuário salvo:', usuarioSalvo);
      
      if (usuarioSalvo) {
        setUsuario(JSON.parse(usuarioSalvo));
        console.log('✅ Usuário encontrado no storage');
      } else {
        console.log('❌ Nenhum usuário salvo');
      }
    } catch (error) {
      console.error('Erro ao verificar usuário salvo:', error);
    } finally {
      setLoading(false);
    }
  };

const login = async (idFuncionario, senha) => {
  try {
    console.log('🔐 Tentando login:', idFuncionario);

    // Limpar espaços em branco
    const idLimpo = idFuncionario.trim();
    const senhaLimpa = senha.trim();

    // Buscar usuário no banco
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, nome, id_funcionario')
      .eq('id_funcionario', idLimpo)
      .eq('senha', senhaLimpa)
      .eq('ativo', true)
      .single();

    if (error) {
      console.error('❌ Erro na query:', error);
      return {
        success: false,
        message: 'ID ou senha incorretos',
      };
    }

    if (!data) {
      console.log('❌ Usuário não encontrado');
      return {
        success: false,
        message: 'ID ou senha incorretos',
      };
    }

    // Salvar usuário
    const usuarioData = {
      id: data.id,
      nome: data.nome,
      id_funcionario: data.id_funcionario,
    };

    console.log('✅ Login bem-sucedido!', usuarioData);

    // Salvar no AsyncStorage
    try {
      await AsyncStorage.setItem('@usuario', JSON.stringify(usuarioData));
      console.log('💾 Salvo no AsyncStorage');
    } catch (storageError) {
      console.error('⚠️ Erro ao salvar no storage:', storageError);
      // Continua mesmo com erro no storage
    }

    setUsuario(usuarioData);

    return {
      success: true,
      usuario: usuarioData,
    };
  } catch (error) {
    console.error('❌ Erro no login:', error);
    return {
      success: false,
      message: 'Erro ao fazer login: ' + error.message,
    };
  }
};

  const logout = async () => {
    try {
      console.log('🚪 Fazendo logout...');
      await AsyncStorage.removeItem('@usuario');
      setUsuario(null);
      console.log('✅ Logout concluído');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        loading,
        login,
        logout,
        estaLogado: !!usuario,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};