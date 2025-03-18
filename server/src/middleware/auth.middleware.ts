import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '../models/user.model';
import { ApiError } from '../core/api-error';
import { ApiResponse } from '../core/api-response';

interface JwtPayload {
  id: number;
  username: string;
  role: UserRole;
}

// Estendendo o objeto Request para incluir o usuário
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

// Middleware de autenticação geral
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    ApiResponse.error(res, new ApiError('Token de autenticação não fornecido', 401, true));
    return;
  }

  try {
    const secret = process.env.JWT_SECRET || 'default_secret';
    const decoded = jwt.verify(token, secret) as JwtPayload;
    req.user = decoded;
    next();
  } catch (error) {
    ApiResponse.error(res, new ApiError('Token de autenticação inválido', 403, true));
    return;
  }
};

// Verificação de função para diferentes níveis de acesso
export const authorize = (roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      ApiResponse.error(res, new ApiError('Usuário não autenticado', 401, true));
      return;
    }

    if (!roles.includes(req.user.role)) {
      ApiResponse.error(res, new ApiError('Acesso negado: Você não tem permissão para acessar este recurso', 403, true));
      return;
    }

    next();
  };
};

// Helper que permite acesso apenas a administradores
export const isAdmin = authorize([UserRole.ADMIN]);

// Helper que permite acesso a administradores e clientes (visualização)
export const isAdminOrClient = authorize([UserRole.ADMIN, UserRole.CLIENT, UserRole.REGISTER]);

// Helper que permite acesso a todos os usuários autenticados
export const isAuthenticated = authorize([
  UserRole.ADMIN, 
  UserRole.USER, 
  UserRole.MANAGER, 
  UserRole.GUEST, 
  UserRole.SUPPORT, 
  UserRole.CLIENT, 
  UserRole.REGISTER
]); 