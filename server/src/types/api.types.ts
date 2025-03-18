import { Router } from 'express';

/**
 * Interface para módulos da API
 */
export interface IApiModule {
  /**
   * Nome do módulo
   */
  name: string;
  
  /**
   * Descrição do módulo
   */
  description: string;
  
  /**
   * Router Express com as rotas do módulo
   */
  router: Router;
  
  /**
   * Versão do módulo
   */
  version: string;
  
  /**
   * Função de inicialização do módulo
   * Chamada quando o módulo é registrado
   */
  initialize?: () => Promise<void>;
  
  /**
   * Função de limpeza do módulo
   * Chamada quando o módulo é removido
   */
  cleanup?: () => Promise<void>;
  
  /**
   * Dependências do módulo
   * Lista de nomes de outros módulos que este módulo depende
   */
  dependencies?: string[];
  
  /**
   * Metadados adicionais do módulo
   */
  metadata?: Record<string, any>;
}

/**
 * Interface para configuração de um módulo
 */
export interface IModuleConfig {
  /**
   * Habilitar ou desabilitar o módulo
   */
  enabled: boolean;
  
  /**
   * Configurações específicas do módulo
   */
  options?: Record<string, any>;
}

/**
 * Interface para resposta padrão da API
 */
export interface IApiResponse<T = any> {
  /**
   * Status da resposta (success ou error)
   */
  status: 'success' | 'error';
  
  /**
   * Mensagem descritiva
   */
  message?: string;
  
  /**
   * Dados da resposta
   */
  data?: T;
  
  /**
   * Informações de erro (se status for error)
   */
  error?: {
    /**
     * Código do erro
     */
    code: string;
    
    /**
     * Detalhes do erro
     */
    details?: any;
  };
  
  /**
   * Metadados adicionais
   */
  meta?: {
    /**
     * Timestamp da resposta
     */
    timestamp: number;
    
    /**
     * Versão da API
     */
    apiVersion: string;
    
    /**
     * Informações de paginação (se aplicável)
     */
    pagination?: {
      /**
       * Página atual
       */
      page: number;
      
      /**
       * Limite de itens por página
       */
      limit: number;
      
      /**
       * Total de itens
       */
      total: number;
      
      /**
       * Total de páginas
       */
      totalPages: number;
    };
  };
}

/**
 * Tipo para funções de middleware
 */
export type MiddlewareFunction = (req: any, res: any, next: any) => void | Promise<void>;

/**
 * Interface para hooks de módulo
 */
export interface IModuleHooks {
  /**
   * Hook executado antes da inicialização do módulo
   */
  beforeInitialize?: () => Promise<void>;
  
  /**
   * Hook executado após a inicialização do módulo
   */
  afterInitialize?: () => Promise<void>;
  
  /**
   * Hook executado antes do registro de rotas
   */
  beforeRouteSetup?: () => Promise<void>;
  
  /**
   * Hook executado após o registro de rotas
   */
  afterRouteSetup?: () => Promise<void>;
  
  /**
   * Hook executado antes da limpeza do módulo
   */
  beforeCleanup?: () => Promise<void>;
  
  /**
   * Hook executado após a limpeza do módulo
   */
  afterCleanup?: () => Promise<void>;
} 