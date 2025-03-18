/**
 * Tipo para funções de callback de eventos
 */
export type EventCallback = (data: any) => void | Promise<void>;

/**
 * Interface para o barramento de eventos
 */
export interface IEventBus {
  /**
   * Registra um ouvinte para um evento
   * @param event Nome do evento
   * @param callback Função a ser chamada quando o evento ocorrer
   */
  on(event: string, callback: EventCallback): void;
  
  /**
   * Remove um ouvinte de um evento
   * @param event Nome do evento
   * @param callback Função registrada anteriormente
   */
  off(event: string, callback: EventCallback): void;
  
  /**
   * Registra um ouvinte para um evento que será executado apenas uma vez
   * @param event Nome do evento
   * @param callback Função a ser chamada quando o evento ocorrer
   */
  once(event: string, callback: EventCallback): void;
  
  /**
   * Emite um evento com dados opcionais
   * @param event Nome do evento
   * @param data Dados a serem passados para os ouvintes
   */
  emit(event: string, data?: any): Promise<void>;
  
  /**
   * Lista todos os eventos registrados
   */
  listEvents(): string[];
}

/**
 * Implementação do barramento de eventos
 */
export class EventBus implements IEventBus {
  private static instance: EventBus;
  private listeners: Map<string, Set<EventCallback>>;
  private onceListeners: Map<string, Set<EventCallback>>;
  
  private constructor() {
    this.listeners = new Map();
    this.onceListeners = new Map();
  }
  
  /**
   * Obtém a instância do barramento de eventos
   */
  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }
  
  /**
   * Registra um ouvinte para um evento
   * @param event Nome do evento
   * @param callback Função a ser chamada quando o evento ocorrer
   */
  public on(event: string, callback: EventCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    
    this.listeners.get(event)!.add(callback);
  }
  
  /**
   * Remove um ouvinte de um evento
   * @param event Nome do evento
   * @param callback Função registrada anteriormente
   */
  public off(event: string, callback: EventCallback): void {
    if (!this.listeners.has(event)) {
      return;
    }
    
    this.listeners.get(event)!.delete(callback);
    
    // Remover o conjunto se estiver vazio
    if (this.listeners.get(event)!.size === 0) {
      this.listeners.delete(event);
    }
  }
  
  /**
   * Registra um ouvinte para um evento que será executado apenas uma vez
   * @param event Nome do evento
   * @param callback Função a ser chamada quando o evento ocorrer
   */
  public once(event: string, callback: EventCallback): void {
    if (!this.onceListeners.has(event)) {
      this.onceListeners.set(event, new Set());
    }
    
    this.onceListeners.get(event)!.add(callback);
  }
  
  /**
   * Emite um evento com dados opcionais
   * @param event Nome do evento
   * @param data Dados a serem passados para os ouvintes
   */
  public async emit(event: string, data?: any): Promise<void> {
    const regularListeners = this.listeners.get(event);
    const onceListeners = this.onceListeners.get(event);
    
    const promises: Promise<void>[] = [];
    
    // Chamar ouvintes regulares
    if (regularListeners) {
      for (const callback of regularListeners) {
        const result = callback(data);
        if (result instanceof Promise) {
          promises.push(result);
        }
      }
    }
    
    // Chamar ouvintes de execução única
    if (onceListeners) {
      for (const callback of onceListeners) {
        const result = callback(data);
        if (result instanceof Promise) {
          promises.push(result);
        }
      }
      
      // Limpar ouvintes de execução única
      this.onceListeners.delete(event);
    }
    
    // Aguardar todas as promessas serem resolvidas
    await Promise.all(promises);
  }
  
  /**
   * Lista todos os eventos registrados
   */
  public listEvents(): string[] {
    const regularEvents = Array.from(this.listeners.keys());
    const onceEvents = Array.from(this.onceListeners.keys());
    
    // Combinar e remover duplicatas
    return [...new Set([...regularEvents, ...onceEvents])];
  }
  
  /**
   * Limpa todos os ouvintes
   */
  public clear(): void {
    this.listeners.clear();
    this.onceListeners.clear();
  }
  
  /**
   * Limpa todos os ouvintes de um evento específico
   * @param event Nome do evento
   */
  public clearEvent(event: string): void {
    this.listeners.delete(event);
    this.onceListeners.delete(event);
  }
}

/**
 * Decorator para métodos que emitem eventos
 * @param eventName Nome do evento a ser emitido
 * @param dataFactory Função para extrair dados do resultado do método
 */
export function EmitEvent(eventName: string, dataFactory?: (result: any) => any): MethodDecorator {
  return function(
    target: Object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function(...args: any[]) {
      const result = await originalMethod.apply(this, args);
      
      const eventBus = EventBus.getInstance();
      const eventData = dataFactory ? dataFactory(result) : result;
      
      await eventBus.emit(eventName, eventData);
      
      return result;
    };
    
    return descriptor;
  };
}

/**
 * Decorator para métodos que escutam eventos
 * @param eventName Nome do evento a ser escutado
 * @param once Se true, o método será chamado apenas uma vez
 */
export function OnEvent(eventName: string, once: boolean = false): MethodDecorator {
  return function(
    target: Object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    
    // Registrar o método como ouvinte quando a classe for instanciada
    const eventBus = EventBus.getInstance();
    
    if (once) {
      eventBus.once(eventName, (data) => {
        originalMethod.call(target, data);
      });
    } else {
      eventBus.on(eventName, (data) => {
        originalMethod.call(target, data);
      });
    }
    
    return descriptor;
  };
} 