import { Router } from 'express';
import { BaseApiModule } from '../../core/base-module';
import { authController } from './auth.controller';
import { asyncHandler } from '../../middleware/error-handler.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import { isAdmin } from '../../middleware/auth.middleware';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Middleware que tenta autenticar o usuário, mas não bloqueia a requisição se o token for inválido
const optionalAuthenticate = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log('Nenhum token fornecido, continuando sem autenticação');
    return next();
  }

  try {
    const secret = process.env.JWT_SECRET || 'default_secret';
    const decoded = jwt.verify(token, secret);
    req.user = decoded as any;
    console.log('Usuário autenticado:', req.user);
  } catch (error) {
    console.error('Token inválido, continuando sem autenticação:', error);
  }
  
  next();
};

/**
 * Módulo de Autenticação
 * Gerencia todas as operações relacionadas a autenticação e usuários
 */
export class AuthModule extends BaseApiModule {
  constructor() {
    super(
      'auth',
      'Autenticação e gerenciamento de usuários',
      '1.0.0',
      [] // Não tem dependências
    );
  }

  /**
   * Configura as rotas do módulo de autenticação
   */
  protected async configureRoutes(): Promise<void> {
    // Rota de login
    this.router.post(
      '/login',
      asyncHandler(authController.login)
    );

    // Rota de registro (com autenticação opcional)
    this.router.post(
      '/register',
      optionalAuthenticate,
      asyncHandler(authController.register)
    );

    // Rota para verificar token
    this.router.get(
      '/verify',
      authenticate,
      asyncHandler(authController.verifyToken)
    );

    // Rota para obter informações do usuário atual
    this.router.get(
      '/me',
      authenticate,
      asyncHandler(authController.getCurrentUser)
    );

    // Rota alternativa para obter informações do usuário atual (para compatibilidade com o cliente)
    this.router.get(
      '/profile',
      authenticate,
      asyncHandler(authController.getCurrentUser)
    );

    // Rota para atualizar informações do usuário
    this.router.put(
      '/me',
      authenticate,
      asyncHandler(authController.updateCurrentUser)
    );

    // Rota para alterar senha
    this.router.post(
      '/change-password',
      authenticate,
      asyncHandler(authController.changePassword)
    );

    // Rota para listar todos os usuários (somente admin)
    this.router.get(
      '/users',
      authenticate,
      isAdmin,
      asyncHandler(authController.getAllUsers)
    );

    // Rota alternativa para listar usuários básicos (acessível para todos os usuários autenticados)
    this.router.get(
      '/all-users',
      authenticate,
      asyncHandler(authController.getAllUsersBasic)
    );

    console.log('Rotas do módulo de autenticação configuradas');
  }

  /**
   * Limpeza específica do módulo
   */
  protected async performCleanup(): Promise<void> {
    // Implementação específica de limpeza, se necessário
    console.log('Limpeza do módulo de autenticação');
  }
}

// Exportar uma instância do módulo para uso no registro
export const authModule = new AuthModule(); 