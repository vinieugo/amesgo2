import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';
import {
  User,
  AuthState,
  LoginCredentials,
  AuthResponse
} from '../types/auth';
import api from '../services/api';

// Definição das ações do reducer
type AuthAction =
  | { type: 'LOGIN_REQUEST' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' };

// Estado inicial
const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  loading: false,
  error: null
};

// Reducer para gerenciar o estado de autenticação
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_REQUEST':
      return {
        ...state,
        loading: true,
        error: null
      };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
        error: null
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: action.payload
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };
    default:
      return state;
  }
};

// Definir a interface para o contexto
interface AuthContextProps {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  checkAndRenewToken: () => Promise<boolean>;
}

// Criar o contexto
const AuthContext = createContext<AuthContextProps | undefined>(undefined);

// API base URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Verificar se o usuário está logado ao carregar a página
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        // Configurar o header de autenticação
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        console.log('Tentando obter perfil do usuário com token:', token);
        
        // Obter os dados do usuário
        const res = await axios.get(`${API_URL}/v1/auth/profile`);
        
        console.log('Resposta do perfil:', res.data);
        
        // Extrair o usuário da resposta da API
        const user = res.data.data;
        
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: { user, token }
        });
      } catch (error: any) {
        console.error('Erro ao carregar usuário:', error.response?.status, error.response?.data);
        
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
        
        dispatch({ type: 'LOGOUT' });
      }
    };

    loadUser();
  }, []);

  // Funções de autenticação
  const login = async (credentials: LoginCredentials) => {
    dispatch({ type: 'LOGIN_REQUEST' });

    try {
      console.log('Tentando fazer login com:', credentials.username);
      
      const res = await axios.post<any>(`${API_URL}/v1/auth/login`, credentials);
      
      // Extrair dados da resposta da API
      const { user, token, csrfToken } = res.data.data;
      
      console.log('Login bem-sucedido. Usuário:', user);
      
      // Salvar o token no localStorage
      localStorage.setItem('token', token);
      
      // Configurar o header de autenticação para todas as requisições futuras
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Configurar o header de autenticação para a instância api
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user, token }
      });
    } catch (error: any) {
      console.error('Erro ao fazer login:', error);
      
      const errorMessage = error.response?.data?.message || 'Falha na autenticação';
      
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: errorMessage
      });
      
      throw new Error(errorMessage);
    }
  };

  // Verificar e renovar token se necessário
  const checkAndRenewToken = async (): Promise<boolean> => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.warn('Nenhum token encontrado para autenticação');
      return false;
    }
    
    try {
      // Tentar verificar o token atual usando a rota de perfil que já existe
      console.log('Verificando token usando a rota de perfil...');
      const response = await axios.get(`${API_URL}/v1/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Se a requisição for bem-sucedida, o token é válido
      if (response.data && response.data.data) {
        console.log('Token válido, usuário autenticado');
        return true;
      }
      
      return false;
    } catch (error: any) {
      console.error('Erro ao verificar token:', error);
      
      // Se o erro for 401 ou 403, o token é inválido
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        console.log('Token inválido ou expirado, fazendo logout');
        logout(); // Fazer logout automaticamente
      }
      
      return false;
    }
  };

  const logout = () => {
    // Remover o token do localStorage
    localStorage.removeItem('token');
    
    // Remover o header de autenticação
    delete axios.defaults.headers.common['Authorization'];
    
    dispatch({ type: 'LOGOUT' });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  return (
    <AuthContext.Provider
      value={{
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        loading: state.loading,
        error: state.error,
        login,
        logout,
        clearError,
        checkAndRenewToken
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para usar o contexto
export const useAuth = (): AuthContextProps => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 