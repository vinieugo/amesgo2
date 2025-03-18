import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';
import {
  User,
  AuthState,
  LoginCredentials,
  AuthResponse
} from '../types/auth';
import { api } from '../services/api';

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
  isAuthenticated: localStorage.getItem('token') ? true : false,
  loading: true,
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
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; user?: User; error?: string }>;
  logout: () => void;
  clearError: () => void;
  checkAuth: () => Promise<boolean>;
}

// Criar o contexto
const AuthContext = createContext<AuthContextProps | undefined>(undefined);

// Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  
  // Obter a URL base da API do arquivo de serviço
  const API_URL = process.env.REACT_APP_API_URL || '/api';

  // Carregar usuário se houver token
  useEffect(() => {
    const loadUser = async () => {
      if (!state.token) {
        console.log('Nenhum token encontrado, pulando carregamento do usuário.');
        dispatch({ type: 'LOGOUT' });
        return;
      }

      try {
        const res = await axios.get(`${API_URL}/v1/auth/profile`);
        
        if (res.data && res.data.data && res.data.data.user) {
          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: {
              user: res.data.data.user,
              token: state.token || ''
            }
          });
        } else {
          console.error('Formato de resposta inesperado:', res.data);
          dispatch({ type: 'LOGOUT' });
        }
      } catch (error: any) {
        console.error('Erro ao carregar usuário:', error);
        localStorage.removeItem('token');
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
      
      // Atualizar o estado com os dados do usuário
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user, token }
      });
      
      return { success: true, user };
    } catch (error: any) {
      console.error('Erro no login:', error.response?.status, error.response?.data);
      
      const errorMessage = error.response?.data?.message || 'Erro ao fazer login';
      dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
      
      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    // Remover o token do localStorage
    localStorage.removeItem('token');
    
    // Remover o header de autenticação
    delete axios.defaults.headers.common['Authorization'];
    
    // Atualizar o estado
    dispatch({ type: 'LOGOUT' });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // Verificar autenticação
  const checkAuth = async () => {
    // Verificar se há token
    const token = state.token;
    if (!token) return false;
    
    try {
      // Configurar o header de autenticação
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Verificar se o token é válido
      const response = await axios.get(`${API_URL}/v1/auth/profile`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      return !!response.data;
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      return false;
    }
  };

  // Retornar o provider com o valor do contexto
  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        clearError,
        checkAuth
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook para usar o contexto de autenticação
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}; 