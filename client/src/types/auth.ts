export enum UserRole {
  ADMIN = 'admin',        // Administrador: acesso total
  CLIENT = 'client',      // Cliente: visualização apenas
  REGISTER = 'register'   // Cadastro: acesso apenas ao módulo de cadastro
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  created_at?: string;
  updated_at?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  message: string;
} 