import fs from 'fs';
import path from 'path';
import { IApiModule } from '../types/api.types';
import { ApiManager } from './api';

/**
 * Classe responsável por carregar plugins dinamicamente
 */
export class PluginLoader {
  private pluginsDir: string;
  private apiManager: ApiManager;
  private loadedPlugins: Map<string, IApiModule>;

  /**
   * Construtor do carregador de plugins
   * @param apiManager Instância do gerenciador de API
   * @param pluginsDir Diretório onde os plugins estão localizados
   */
  constructor(apiManager: ApiManager, pluginsDir: string = path.join(process.cwd(), 'plugins')) {
    this.apiManager = apiManager;
    this.pluginsDir = pluginsDir;
    this.loadedPlugins = new Map();
  }

  /**
   * Verifica se o diretório de plugins existe e cria se necessário
   */
  private ensurePluginsDirectory(): void {
    if (!fs.existsSync(this.pluginsDir)) {
      try {
        fs.mkdirSync(this.pluginsDir, { recursive: true });
        console.log(`Diretório de plugins criado em: ${this.pluginsDir}`);
      } catch (error) {
        console.error(`Erro ao criar diretório de plugins: ${error}`);
        throw error;
      }
    }
  }

  /**
   * Carrega todos os plugins disponíveis no diretório de plugins
   */
  public async loadAllPlugins(): Promise<void> {
    this.ensurePluginsDirectory();
    
    try {
      const pluginDirs = fs.readdirSync(this.pluginsDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
      
      for (const pluginDir of pluginDirs) {
        await this.loadPlugin(pluginDir);
      }
      
      console.log(`Total de plugins carregados: ${this.loadedPlugins.size}`);
    } catch (error) {
      console.error(`Erro ao carregar plugins: ${error}`);
      throw error;
    }
  }

  /**
   * Carrega um plugin específico
   * @param pluginName Nome do plugin a ser carregado
   */
  public async loadPlugin(pluginName: string): Promise<boolean> {
    const pluginPath = path.join(this.pluginsDir, pluginName);
    
    if (!fs.existsSync(pluginPath)) {
      console.error(`Plugin não encontrado: ${pluginName}`);
      return false;
    }
    
    try {
      // Verificar se existe um arquivo de manifesto
      const manifestPath = path.join(pluginPath, 'manifest.json');
      if (!fs.existsSync(manifestPath)) {
        console.error(`Manifesto não encontrado para o plugin: ${pluginName}`);
        return false;
      }
      
      // Ler o manifesto
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      
      // Verificar se o manifesto contém as informações necessárias
      if (!manifest.name || !manifest.entryPoint) {
        console.error(`Manifesto inválido para o plugin: ${pluginName}`);
        return false;
      }
      
      // Carregar o módulo principal do plugin
      const entryPointPath = path.join(pluginPath, manifest.entryPoint);
      if (!fs.existsSync(entryPointPath)) {
        console.error(`Ponto de entrada não encontrado para o plugin: ${pluginName}`);
        return false;
      }
      
      // Importar dinamicamente o módulo
      const pluginModule = await import(entryPointPath);
      
      // Verificar se o módulo exporta um módulo de API
      if (!pluginModule.default || typeof pluginModule.default !== 'object') {
        console.error(`Plugin não exporta um módulo válido: ${pluginName}`);
        return false;
      }
      
      const apiModule: IApiModule = pluginModule.default;
      
      // Registrar o módulo no gerenciador de API
      this.apiManager.registerModule(manifest.name, apiModule);
      this.loadedPlugins.set(manifest.name, apiModule);
      
      console.log(`Plugin carregado com sucesso: ${manifest.name}`);
      return true;
    } catch (error) {
      console.error(`Erro ao carregar plugin ${pluginName}: ${error}`);
      return false;
    }
  }

  /**
   * Descarrega um plugin específico
   * @param pluginName Nome do plugin a ser descarregado
   */
  public unloadPlugin(pluginName: string): boolean {
    if (!this.loadedPlugins.has(pluginName)) {
      console.error(`Plugin não está carregado: ${pluginName}`);
      return false;
    }
    
    try {
      // Remover o módulo do gerenciador de API
      this.apiManager.unregisterModule(pluginName);
      this.loadedPlugins.delete(pluginName);
      
      console.log(`Plugin descarregado com sucesso: ${pluginName}`);
      return true;
    } catch (error) {
      console.error(`Erro ao descarregar plugin ${pluginName}: ${error}`);
      return false;
    }
  }

  /**
   * Obtém a lista de plugins carregados
   */
  public getLoadedPlugins(): string[] {
    return Array.from(this.loadedPlugins.keys());
  }

  /**
   * Verifica se um plugin está carregado
   * @param pluginName Nome do plugin
   */
  public isPluginLoaded(pluginName: string): boolean {
    return this.loadedPlugins.has(pluginName);
  }

  /**
   * Recarrega todos os plugins
   */
  public async reloadAllPlugins(): Promise<void> {
    // Descarregar todos os plugins
    const pluginNames = this.getLoadedPlugins();
    for (const pluginName of pluginNames) {
      this.unloadPlugin(pluginName);
    }
    
    // Carregar todos os plugins novamente
    await this.loadAllPlugins();
  }
} 