import { Response } from 'express';
import { IApiResponse } from '../types/api.types';
import { ApiError } from './api-error';

/**
 * Classe utilitária para padronizar respostas da API
 */
export class ApiResponse {
  /**
   * Versão atual da API
   */
  private static apiVersion: string = 'v1';

  /**
   * Define a versão da API
   * @param version Versão da API
   */
  public static setApiVersion(version: string): void {
    ApiResponse.apiVersion = version;
  }

  /**
   * Cria um objeto de resposta de sucesso
   * @param data Dados da resposta
   * @param message Mensagem descritiva
   * @param meta Metadados adicionais
   * @returns Objeto de resposta padronizado
   */
  public static createSuccessResponse<T>(data?: T, message?: string, meta?: any): IApiResponse<T> {
    return {
      status: 'success',
      message,
      data,
      meta: {
        timestamp: Date.now(),
        apiVersion: ApiResponse.apiVersion,
        ...meta
      }
    };
  }

  /**
   * Cria um objeto de resposta de erro
   * @param code Código do erro
   * @param message Mensagem de erro
   * @param details Detalhes do erro
   * @returns Objeto de resposta padronizado
   */
  public static createErrorResponse(code: string, message: string, details?: any): IApiResponse {
    return {
      status: 'error',
      message,
      error: {
        code,
        details
      },
      meta: {
        timestamp: Date.now(),
        apiVersion: ApiResponse.apiVersion
      }
    };
  }

  /**
   * Envia uma resposta de sucesso
   * @param res Objeto de resposta do Express
   * @param data Dados a serem enviados na resposta
   * @param message Mensagem de sucesso
   * @param statusCode Código de status HTTP (padrão: 200)
   */
  public static success(
    res: Response,
    data: any = null,
    message: string = 'Operação realizada com sucesso',
    statusCode: number = 200
  ): Response {
    return res.status(statusCode).json({
      status: 'success',
      message,
      data,
      meta: {
        timestamp: Date.now(),
        apiVersion: ApiResponse.apiVersion
      }
    });
  }

  /**
   * Envia uma resposta de recurso criado
   * @param res Objeto de resposta do Express
   * @param data Dados do recurso criado
   * @param message Mensagem de sucesso
   */
  public static created(
    res: Response,
    data: any = null,
    message: string = 'Recurso criado com sucesso'
  ): Response {
    return ApiResponse.success(res, data, message, 201);
  }

  /**
   * Envia uma resposta sem conteúdo
   * @param res Objeto de resposta do Express
   */
  public static noContent(res: Response): Response {
    return res.status(204).end();
  }

  /**
   * Envia uma resposta de erro
   * @param res Objeto de resposta do Express
   * @param error Objeto de erro
   */
  public static error(
    res: Response, 
    error: ApiError
  ): Response {
    return res.status(error.statusCode).json({
      status: 'error',
      message: error.message,
      error: {
        code: error.name,
        details: error.isOperational ? error : null
      },
      meta: {
        timestamp: Date.now(),
        apiVersion: ApiResponse.apiVersion
      }
    });
  }

  /**
   * Envia uma resposta de erro de validação
   * @param res Objeto de resposta do Express
   * @param message Mensagem de erro
   * @param errors Detalhes dos erros de validação
   */
  public static validationError(
    res: Response,
    message: string = 'Erro de validação',
    errors: any = null
  ): Response {
    return res.status(422).json({
      status: 'error',
      message,
      error: {
        code: 'VALIDATION_ERROR',
        details: errors
      },
      meta: {
        timestamp: Date.now(),
        apiVersion: ApiResponse.apiVersion
      }
    });
  }

  /**
   * Envia uma resposta de erro interno do servidor
   * @param res Objeto de resposta do Express
   * @param error Objeto de erro
   */
  public static serverError(
    res: Response,
    error: Error
  ): Response {
    console.error('Erro interno do servidor:', error);
    
    return res.status(500).json({
      status: 'error',
      message: 'Erro interno do servidor',
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : null
      },
      meta: {
        timestamp: Date.now(),
        apiVersion: ApiResponse.apiVersion
      }
    });
  }

  /**
   * Envia uma resposta de erro de não encontrado
   * @param res Objeto de resposta do Express
   * @param message Mensagem de erro
   */
  public static notFound(
    res: Response,
    message: string = 'Recurso não encontrado'
  ): Response {
    const error = new ApiError(message, 404, true);
    return ApiResponse.error(res, error);
  }

  /**
   * Envia uma resposta de erro de não autorizado
   * @param res Objeto de resposta do Express
   * @param message Mensagem de erro
   */
  public static unauthorized(
    res: Response,
    message: string = 'Não autorizado'
  ): Response {
    const error = new ApiError(message, 401, true);
    return ApiResponse.error(res, error);
  }

  /**
   * Envia uma resposta de erro de acesso proibido
   * @param res Objeto de resposta do Express
   * @param message Mensagem de erro
   */
  public static forbidden(
    res: Response,
    message: string = 'Acesso proibido'
  ): Response {
    const error = new ApiError(message, 403, true);
    return ApiResponse.error(res, error);
  }
} 