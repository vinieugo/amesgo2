import { Request, Response, NextFunction } from 'express';
import { EventBus } from '../core/event-bus';

/**
 * Interface para métricas de requisição
 */
export interface IRequestMetrics {
  /**
   * Método HTTP
   */
  method: string;
  
  /**
   * Caminho da requisição
   */
  path: string;
  
  /**
   * Código de status da resposta
   */
  statusCode: number;
  
  /**
   * Tempo de resposta em milissegundos
   */
  responseTime: number;
  
  /**
   * Tamanho da resposta em bytes
   */
  responseSize: number;
  
  /**
   * Timestamp da requisição
   */
  timestamp: number;
  
  /**
   * IP do cliente
   */
  clientIp: string;
  
  /**
   * User-Agent do cliente
   */
  userAgent: string;
  
  /**
   * ID do usuário (se autenticado)
   */
  userId?: number;
}

/**
 * Middleware para monitoramento de requisições
 * Registra métricas de desempenho e emite eventos
 */
export const monitoringMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Registrar o tempo de início
  const startTime = Date.now();
  
  // Interceptar o método end para capturar métricas antes da resposta ser enviada
  const originalEnd = res.end;
  
  // @ts-ignore - Ignorando erros de tipo para simplificar a implementação
  res.end = function(...args: any[]): any {
    // Calcular o tempo de resposta
    const responseTime = Date.now() - startTime;
    
    // Obter informações da requisição
    const metrics: IRequestMetrics = {
      method: req.method,
      path: req.originalUrl || req.url,
      statusCode: res.statusCode,
      responseTime,
      responseSize: 0, // Não calculamos o tamanho exato para evitar problemas de tipo
      timestamp: startTime,
      clientIp: req.ip || (req.socket && req.socket.remoteAddress) || '',
      userAgent: req.get('User-Agent') || '',
      userId: req.user?.id
    };
    
    // Emitir evento com as métricas
    const eventBus = EventBus.getInstance();
    eventBus.emit('api:request', metrics);
    
    // Registrar no console para depuração
    console.log(`[${new Date(startTime).toISOString()}] ${req.method} ${req.originalUrl || req.url} ${res.statusCode} ${responseTime}ms`);
    
    // Chamar a função original
    // @ts-ignore - Ignorando erros de tipo para simplificar a implementação
    return originalEnd.apply(res, args);
  };
  
  // Continuar para o próximo middleware
  next();
};

/**
 * Middleware para registrar erros
 */
export const errorMonitoringMiddleware = (err: Error, req: Request, res: Response, next: NextFunction): void => {
  // Registrar o erro
  console.error(`[ERROR] [${new Date().toISOString()}] ${req.method} ${req.originalUrl || req.url}:`, err);
  
  // Emitir evento de erro
  const eventBus = EventBus.getInstance();
  eventBus.emit('api:error', {
    error: err,
    method: req.method,
    path: req.originalUrl || req.url,
    timestamp: Date.now(),
    clientIp: req.ip || (req.socket && req.socket.remoteAddress) || '',
    userAgent: req.get('User-Agent') || '',
    userId: req.user?.id
  });
  
  // Passar para o próximo middleware de erro
  next(err);
};

/**
 * Classe para monitoramento de métricas da API
 */
export class ApiMetrics {
  private static instance: ApiMetrics;
  private metrics: {
    requestCount: number;
    errorCount: number;
    totalResponseTime: number;
    requestsByPath: Map<string, number>;
    errorsByPath: Map<string, number>;
    statusCodes: Map<number, number>;
  };
  
  private constructor() {
    this.metrics = {
      requestCount: 0,
      errorCount: 0,
      totalResponseTime: 0,
      requestsByPath: new Map(),
      errorsByPath: new Map(),
      statusCodes: new Map()
    };
    
    // Registrar ouvintes de eventos
    const eventBus = EventBus.getInstance();
    
    eventBus.on('api:request', (metrics: IRequestMetrics) => {
      this.recordRequest(metrics);
    });
    
    eventBus.on('api:error', (data: any) => {
      this.recordError(data.path);
    });
  }
  
  /**
   * Obtém a instância do monitor de métricas
   */
  public static getInstance(): ApiMetrics {
    if (!ApiMetrics.instance) {
      ApiMetrics.instance = new ApiMetrics();
    }
    return ApiMetrics.instance;
  }
  
  /**
   * Registra uma requisição
   * @param metrics Métricas da requisição
   */
  private recordRequest(metrics: IRequestMetrics): void {
    this.metrics.requestCount++;
    this.metrics.totalResponseTime += metrics.responseTime;
    
    // Incrementar contador para o caminho
    const path = this.normalizePath(metrics.path);
    const currentPathCount = this.metrics.requestsByPath.get(path) || 0;
    this.metrics.requestsByPath.set(path, currentPathCount + 1);
    
    // Incrementar contador para o código de status
    const currentStatusCount = this.metrics.statusCodes.get(metrics.statusCode) || 0;
    this.metrics.statusCodes.set(metrics.statusCode, currentStatusCount + 1);
  }
  
  /**
   * Registra um erro
   * @param path Caminho da requisição que gerou o erro
   */
  private recordError(path: string): void {
    this.metrics.errorCount++;
    
    // Incrementar contador para o caminho
    const normalizedPath = this.normalizePath(path);
    const currentPathCount = this.metrics.errorsByPath.get(normalizedPath) || 0;
    this.metrics.errorsByPath.set(normalizedPath, currentPathCount + 1);
  }
  
  /**
   * Normaliza um caminho para agrupar métricas
   * @param path Caminho original
   * @returns Caminho normalizado
   */
  private normalizePath(path: string): string {
    // Remover parâmetros de consulta
    const baseUrl = path.split('?')[0];
    
    // Substituir IDs numéricos por :id
    return baseUrl.replace(/\/\d+/g, '/:id');
  }
  
  /**
   * Obtém as métricas atuais
   */
  public getMetrics(): any {
    const avgResponseTime = this.metrics.requestCount > 0
      ? this.metrics.totalResponseTime / this.metrics.requestCount
      : 0;
    
    return {
      requestCount: this.metrics.requestCount,
      errorCount: this.metrics.errorCount,
      avgResponseTime,
      errorRate: this.metrics.requestCount > 0
        ? (this.metrics.errorCount / this.metrics.requestCount) * 100
        : 0,
      topPaths: Array.from(this.metrics.requestsByPath.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10),
      topErrorPaths: Array.from(this.metrics.errorsByPath.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10),
      statusCodes: Object.fromEntries(this.metrics.statusCodes)
    };
  }
  
  /**
   * Reinicia as métricas
   */
  public resetMetrics(): void {
    this.metrics = {
      requestCount: 0,
      errorCount: 0,
      totalResponseTime: 0,
      requestsByPath: new Map(),
      errorsByPath: new Map(),
      statusCodes: new Map()
    };
  }
} 