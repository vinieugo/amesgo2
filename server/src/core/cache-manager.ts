/**
 * Interface para implementações de cache
 */
export interface ICacheProvider {
  /**
   * Obtém um valor do cache
   * @param key Chave do item
   */
  get<T>(key: string): Promise<T | null>;
  
  /**
   * Armazena um valor no cache
   * @param key Chave do item
   * @param value Valor a ser armazenado
   * @param ttl Tempo de vida em segundos (opcional)
   */
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  
  /**
   * Verifica se uma chave existe no cache
   * @param key Chave a ser verificada
   */
  has(key: string): Promise<boolean>;
  
  /**
   * Remove um item do cache
   * @param key Chave do item a ser removido
   */
  delete(key: string): Promise<boolean>;
  
  /**
   * Limpa todo o cache
   */
  clear(): Promise<void>;
}

/**
 * Implementação de cache em memória
 */
export class MemoryCacheProvider implements ICacheProvider {
  private cache: Map<string, { value: any; expiry: number | null }>;
  
  constructor() {
    this.cache = new Map();
  }
  
  public async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }
    
    // Verificar se o item expirou
    if (item.expiry !== null && item.expiry < Date.now()) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value as T;
  }
  
  public async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const expiry = ttl ? Date.now() + (ttl * 1000) : null;
    this.cache.set(key, { value, expiry });
  }
  
  public async has(key: string): Promise<boolean> {
    const item = this.cache.get(key);
    
    if (!item) {
      return false;
    }
    
    // Verificar se o item expirou
    if (item.expiry !== null && item.expiry < Date.now()) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }
  
  public async delete(key: string): Promise<boolean> {
    return this.cache.delete(key);
  }
  
  public async clear(): Promise<void> {
    this.cache.clear();
  }
}

/**
 * Gerenciador de cache da aplicação
 */
export class CacheManager {
  private static instance: CacheManager;
  private provider: ICacheProvider;
  private defaultTtl: number;
  private enabled: boolean;
  
  private constructor(provider: ICacheProvider, defaultTtl: number = 300, enabled: boolean = true) {
    this.provider = provider;
    this.defaultTtl = defaultTtl;
    this.enabled = enabled;
  }
  
  /**
   * Obtém a instância do gerenciador de cache
   */
  public static getInstance(
    provider?: ICacheProvider,
    defaultTtl?: number,
    enabled?: boolean
  ): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager(
        provider || new MemoryCacheProvider(),
        defaultTtl,
        enabled
      );
    }
    return CacheManager.instance;
  }
  
  /**
   * Obtém um valor do cache
   * @param key Chave do item
   */
  public async get<T>(key: string): Promise<T | null> {
    if (!this.enabled) {
      return null;
    }
    return this.provider.get<T>(key);
  }
  
  /**
   * Armazena um valor no cache
   * @param key Chave do item
   * @param value Valor a ser armazenado
   * @param ttl Tempo de vida em segundos (opcional)
   */
  public async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    if (!this.enabled) {
      return;
    }
    return this.provider.set<T>(key, value, ttl || this.defaultTtl);
  }
  
  /**
   * Verifica se uma chave existe no cache
   * @param key Chave a ser verificada
   */
  public async has(key: string): Promise<boolean> {
    if (!this.enabled) {
      return false;
    }
    return this.provider.has(key);
  }
  
  /**
   * Remove um item do cache
   * @param key Chave do item a ser removido
   */
  public async delete(key: string): Promise<boolean> {
    if (!this.enabled) {
      return false;
    }
    return this.provider.delete(key);
  }
  
  /**
   * Limpa todo o cache
   */
  public async clear(): Promise<void> {
    return this.provider.clear();
  }
  
  /**
   * Habilita ou desabilita o cache
   * @param enabled true para habilitar, false para desabilitar
   */
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
  
  /**
   * Verifica se o cache está habilitado
   */
  public isEnabled(): boolean {
    return this.enabled;
  }
  
  /**
   * Define o tempo de vida padrão para itens do cache
   * @param ttl Tempo de vida em segundos
   */
  public setDefaultTtl(ttl: number): void {
    this.defaultTtl = ttl;
  }
  
  /**
   * Obtém o tempo de vida padrão para itens do cache
   */
  public getDefaultTtl(): number {
    return this.defaultTtl;
  }
  
  /**
   * Define o provedor de cache
   * @param provider Implementação de ICacheProvider
   */
  public setProvider(provider: ICacheProvider): void {
    this.provider = provider;
  }
}

/**
 * Decorator para cache de métodos
 * @param ttl Tempo de vida em segundos (opcional)
 * @param keyPrefix Prefixo para a chave de cache (opcional)
 */
export function Cacheable(ttl?: number, keyPrefix?: string): MethodDecorator {
  return function(
    target: Object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function(...args: any[]) {
      const cacheManager = CacheManager.getInstance();
      
      if (!cacheManager.isEnabled()) {
        return originalMethod.apply(this, args);
      }
      
      // Gerar chave de cache baseada no nome do método e argumentos
      const prefix = keyPrefix || target.constructor.name;
      const key = `${prefix}:${String(propertyKey)}:${JSON.stringify(args)}`;
      
      // Verificar se o resultado está em cache
      const cachedResult = await cacheManager.get(key);
      if (cachedResult !== null) {
        return cachedResult;
      }
      
      // Executar o método original
      const result = await originalMethod.apply(this, args);
      
      // Armazenar o resultado em cache
      await cacheManager.set(key, result, ttl);
      
      return result;
    };
    
    return descriptor;
  };
}

/**
 * Decorator para invalidar cache quando um método é chamado
 * @param patterns Padrões de chaves a serem invalidados (suporta glob)
 */
export function InvalidateCache(patterns: string[]): MethodDecorator {
  return function(
    target: Object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function(...args: any[]) {
      const result = await originalMethod.apply(this, args);
      
      const cacheManager = CacheManager.getInstance();
      
      // Implementação simplificada - em um cenário real, 
      // seria necessário um mecanismo para buscar chaves por padrão
      await cacheManager.clear();
      
      return result;
    };
    
    return descriptor;
  };
} 