import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../core/api-response';
import { ApiError } from '../core/api-error';

/**
 * Middleware para tratamento de erros
 * Deve ser registrado após todas as rotas
 */
export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction): void => {
  console.error('Erro capturado pelo middleware:', err);

  // Se for um ApiError, usar suas propriedades
  if (err instanceof ApiError) {
    ApiResponse.error(res, err);
    return;
  }

  // Erros de JWT
  if (err.name === 'JsonWebTokenError') {
    ApiResponse.unauthorized(res, 'Token inválido');
    return;
  }

  if (err.name === 'TokenExpiredError') {
    ApiResponse.unauthorized(res, 'Token expirado');
    return;
  }

  // Erro padrão para outros tipos de erro
  ApiResponse.serverError(res, err);
};

/**
 * Middleware para tratar rotas não encontradas
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  ApiResponse.notFound(res, `Rota não encontrada: ${req.method} ${req.originalUrl}`);
};

/**
 * Middleware para capturar erros assíncronos
 * Envolve um handler de rota e captura exceções em Promises
 */
export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}; 