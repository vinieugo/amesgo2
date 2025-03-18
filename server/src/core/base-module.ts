import { Router } from 'express';
import { IApiModule, IModuleHooks, IModuleConfig } from '../types/api.types';

/**
 * Classe base para módulos da API
 * Implementa a interface IApiModule e fornece funcionalidades comuns
 */
export abstract class BaseApiModule implements IApiModule {
  public name: string;
  public description: string;
  public router: Router;
  public version: string;
  public dependencies?: string[];
  public metadata?: Record<string, any>;
  protected config: IModuleConfig;
  protected hooks: IModuleHooks;

  /**
   * Construtor da classe base de módulo
   * @param name Nome do módulo
   * @param description Descrição do módulo
   * @param version Versão do módulo
   * @param dependencies Dependências do módulo
   * @param config Configuração do módulo
   * @param hooks Hooks do módulo
   */
  constructor(
    name: string,
    description: string,
    version: string = '1.0.0',
    dependencies: string[] = [],
    config: Partial<IModuleConfig> = {},
    hooks: Partial<IModuleHooks> = {}
  ) {
    this.name = name;
    this.description = description;
    this.version = version;
    this.dependencies = dependencies;
    this.router = Router();
    this.config = {
      enabled: true,
      ...config
    };
    this.hooks = hooks;
    this.metadata = {};
  }

  /**
   * Inicializa o módulo
   * Método chamado quando o módulo é registrado no ApiManager
   */
  public async initialize(): Promise<void> {
    if (!this.config.enabled) {
      console.log(`Módulo '${this.name}' está desabilitado. Pulando inicialização.`);
      return;
    }

    try {
      // Executar hook antes da inicialização
      if (this.hooks.beforeInitialize) {
        await this.hooks.beforeInitialize();
      }

      // Configurar rotas
      await this.configureRoutes();

      // Executar hook após a inicialização
      if (this.hooks.afterInitialize) {
        await this.hooks.afterInitialize();
      }

      console.log(`Módulo '${this.name}' v${this.version} inicializado com sucesso.`);
    } catch (error) {
      console.error(`Erro ao inicializar módulo '${this.name}':`, error);
      throw error;
    }
  }

  /**
   * Limpa recursos do módulo
   * Método chamado quando o módulo é removido do ApiManager
   */
  public async cleanup(): Promise<void> {
    try {
      // Executar hook antes da limpeza
      if (this.hooks.beforeCleanup) {
        await this.hooks.beforeCleanup();
      }

      // Implementação específica de limpeza
      await this.performCleanup();

      // Executar hook após a limpeza
      if (this.hooks.afterCleanup) {
        await this.hooks.afterCleanup();
      }

      console.log(`Módulo '${this.name}' limpo com sucesso.`);
    } catch (error) {
      console.error(`Erro ao limpar módulo '${this.name}':`, error);
      throw error;
    }
  }

  /**
   * Configura as rotas do módulo
   * Método abstrato que deve ser implementado por cada módulo
   */
  protected abstract configureRoutes(): Promise<void>;

  /**
   * Realiza a limpeza específica do módulo
   * Pode ser sobrescrito por módulos específicos
   */
  protected async performCleanup(): Promise<void> {
    // Implementação padrão vazia
  }

  /**
   * Adiciona metadados ao módulo
   * @param key Chave do metadado
   * @param value Valor do metadado
   */
  public setMetadata(key: string, value: any): void {
    if (!this.metadata) {
      this.metadata = {};
    }
    this.metadata[key] = value;
  }

  /**
   * Obtém um metadado do módulo
   * @param key Chave do metadado
   * @returns Valor do metadado ou undefined se não existir
   */
  public getMetadata(key: string): any {
    return this.metadata ? this.metadata[key] : undefined;
  }

  /**
   * Verifica se o módulo está habilitado
   * @returns true se o módulo estiver habilitado, false caso contrário
   */
  public isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Habilita ou desabilita o módulo
   * @param enabled true para habilitar, false para desabilitar
   */
  public setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
  }

  /**
   * Obtém a configuração do módulo
   * @returns Configuração do módulo
   */
  public getConfig(): IModuleConfig {
    return this.config;
  }

  /**
   * Atualiza a configuração do módulo
   * @param config Nova configuração
   */
  public updateConfig(config: Partial<IModuleConfig>): void {
    this.config = {
      ...this.config,
      ...config
    };
  }
} 