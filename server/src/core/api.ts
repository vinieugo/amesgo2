// Usando require em vez de import para express
const express = require('express');
import { Router, Application } from 'express';
import { IApiModule } from '../types/api.types';

/**
 * Classe principal da API que gerencia módulos e extensões
 */
export class ApiManager {
  private app: Application;
  private modules: Map<string, IApiModule>;
  private baseApiPath: string;
  private apiVersion: string;

  constructor(app: Application, baseApiPath: string = '/api', apiVersion: string = 'v1') {
    this.app = app;
    this.modules = new Map();
    this.baseApiPath = baseApiPath;
    this.apiVersion = apiVersion;
  }

  /**
   * Registra um novo módulo na API
   * @param name Nome do módulo
   * @param module Módulo a ser registrado
   */
  public registerModule(name: string, module: IApiModule): void {
    if (this.modules.has(name)) {
      console.warn(`Módulo '${name}' já está registrado. Substituindo...`);
    }
    
    this.modules.set(name, module);
    console.log(`Módulo '${name}' registrado com sucesso.`);
  }

  /**
   * Remove um módulo da API
   * @param name Nome do módulo a ser removido
   */
  public unregisterModule(name: string): boolean {
    if (!this.modules.has(name)) {
      console.warn(`Módulo '${name}' não encontrado.`);
      return false;
    }
    
    this.modules.delete(name);
    console.log(`Módulo '${name}' removido com sucesso.`);
    return true;
  }

  /**
   * Inicializa todos os módulos registrados
   */
  public async initializeModules(): Promise<void> {
    // Convertendo para array para evitar problemas de iteração
    const moduleEntries = Array.from(this.modules.entries());
    
    for (const [name, module] of moduleEntries) {
      try {
        if (module.initialize) {
          await module.initialize();
        }
        console.log(`Módulo '${name}' inicializado com sucesso.`);
      } catch (error) {
        console.error(`Erro ao inicializar módulo '${name}':`, error);
      }
    }
  }

  /**
   * Configura as rotas de todos os módulos registrados
   */
  public setupRoutes(): void {
    // Criar router principal para a versão atual da API
    const apiRouter = Router();
    
    // Convertendo para array para evitar problemas de iteração
    const moduleEntries = Array.from(this.modules.entries());
    
    // Registrar rotas de cada módulo
    for (const [name, module] of moduleEntries) {
      if (module.router) {
        // Montar o router do módulo no caminho específico
        apiRouter.use(`/${name}`, module.router);
        console.log(`Rotas do módulo '${name}' configuradas.`);
      }
    }
    
    // Montar o router da API no app principal
    this.app.use(`${this.baseApiPath}/${this.apiVersion}`, apiRouter);
    console.log(`API v${this.apiVersion} configurada em ${this.baseApiPath}/${this.apiVersion}`);
    
    // Manter compatibilidade com versões anteriores (sem versionamento)
    // Isso permite que clientes antigos continuem funcionando
    this.app.use(this.baseApiPath, apiRouter);
  }

  /**
   * Obtém um módulo registrado pelo nome
   * @param name Nome do módulo
   */
  public getModule(name: string): IApiModule | undefined {
    return this.modules.get(name);
  }

  /**
   * Lista todos os módulos registrados
   */
  public listModules(): string[] {
    return Array.from(this.modules.keys());
  }
}

// Singleton para gerenciar a API em toda a aplicação
let apiManagerInstance: ApiManager | null = null;

/**
 * Obtém a instância do gerenciador de API
 * @param app Aplicação Express (necessário apenas na primeira chamada)
 * @param baseApiPath Caminho base da API (opcional)
 * @param apiVersion Versão da API (opcional)
 */
export const getApiManager = (
  app?: Application, 
  baseApiPath: string = '/api', 
  apiVersion: string = 'v1'
): ApiManager => {
  if (!apiManagerInstance) {
    if (!app) {
      throw new Error('A aplicação Express é necessária para criar o gerenciador de API');
    }
    apiManagerInstance = new ApiManager(app, baseApiPath, apiVersion);
  }
  return apiManagerInstance;
}; 