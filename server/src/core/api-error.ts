/**
 * Classe para padronizar erros da API
 */
export class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;
  
  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    // Capturar stack trace
    Error.captureStackTrace(this, this.constructor);
  }
  
  /**
   * Cria um erro de validação (400 Bad Request)
   */
  static badRequest(message: string): ApiError {
    return new ApiError(message, 400);
  }
  
  /**
   * Cria um erro de autenticação (401 Unauthorized)
   */
  static unauthorized(message: string): ApiError {
    return new ApiError(message, 401);
  }
  
  /**
   * Cria um erro de permissão (403 Forbidden)
   */
  static forbidden(message: string): ApiError {
    return new ApiError(message, 403);
  }
  
  /**
   * Cria um erro de recurso não encontrado (404 Not Found)
   */
  static notFound(message: string): ApiError {
    return new ApiError(message, 404);
  }
  
  /**
   * Cria um erro de conflito (409 Conflict)
   */
  static conflict(message: string): ApiError {
    return new ApiError(message, 409);
  }
  
  /**
   * Cria um erro de validação (422 Unprocessable Entity)
   */
  static validation(message: string): ApiError {
    return new ApiError(message, 422);
  }
  
  /**
   * Cria um erro interno do servidor (500 Internal Server Error)
   */
  static internal(message: string, error?: Error): ApiError {
    // Registrar o erro original para depuração
    if (error) {
      console.error('Erro interno:', error);
    }
    
    return new ApiError(message, 500, false);
  }
  
  /**
   * Cria um erro de serviço indisponível (503 Service Unavailable)
   */
  static serviceUnavailable(message: string): ApiError {
    return new ApiError(message, 503);
  }
} 