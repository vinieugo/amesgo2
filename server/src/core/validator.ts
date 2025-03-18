/**
 * Interface para regras de validação
 */
export interface IValidationRule {
  /**
   * Valida um valor
   * @param value Valor a ser validado
   * @param field Nome do campo (para mensagens de erro)
   * @returns true se válido, string com mensagem de erro se inválido
   */
  validate(value: any, field: string): true | string;
}

/**
 * Interface para validadores
 */
export interface IValidator {
  /**
   * Valida um objeto
   * @param data Objeto a ser validado
   * @returns Objeto com erros de validação ou null se válido
   */
  validate(data: Record<string, any>): Record<string, string> | null;
}

/**
 * Classe base para regras de validação
 */
export abstract class ValidationRule implements IValidationRule {
  /**
   * Valida um valor
   * @param value Valor a ser validado
   * @param field Nome do campo (para mensagens de erro)
   * @returns true se válido, string com mensagem de erro se inválido
   */
  abstract validate(value: any, field: string): true | string;
}

/**
 * Regra de validação para campos obrigatórios
 */
export class RequiredRule extends ValidationRule {
  /**
   * Valida se um valor está presente
   * @param value Valor a ser validado
   * @param field Nome do campo
   * @returns true se válido, mensagem de erro se inválido
   */
  validate(value: any, field: string): true | string {
    if (value === undefined || value === null || value === '') {
      return `O campo ${field} é obrigatório`;
    }
    return true;
  }
}

/**
 * Regra de validação para strings com tamanho mínimo
 */
export class MinLengthRule extends ValidationRule {
  private minLength: number;
  
  /**
   * Construtor
   * @param minLength Tamanho mínimo da string
   */
  constructor(minLength: number) {
    super();
    this.minLength = minLength;
  }
  
  /**
   * Valida se uma string tem o tamanho mínimo
   * @param value Valor a ser validado
   * @param field Nome do campo
   * @returns true se válido, mensagem de erro se inválido
   */
  validate(value: any, field: string): true | string {
    if (value === undefined || value === null) {
      return true; // Deixar a regra RequiredRule lidar com valores ausentes
    }
    
    if (typeof value !== 'string') {
      return `O campo ${field} deve ser uma string`;
    }
    
    if (value.length < this.minLength) {
      return `O campo ${field} deve ter pelo menos ${this.minLength} caracteres`;
    }
    
    return true;
  }
}

/**
 * Regra de validação para strings com tamanho máximo
 */
export class MaxLengthRule extends ValidationRule {
  private maxLength: number;
  
  /**
   * Construtor
   * @param maxLength Tamanho máximo da string
   */
  constructor(maxLength: number) {
    super();
    this.maxLength = maxLength;
  }
  
  /**
   * Valida se uma string tem o tamanho máximo
   * @param value Valor a ser validado
   * @param field Nome do campo
   * @returns true se válido, mensagem de erro se inválido
   */
  validate(value: any, field: string): true | string {
    if (value === undefined || value === null) {
      return true; // Deixar a regra RequiredRule lidar com valores ausentes
    }
    
    if (typeof value !== 'string') {
      return `O campo ${field} deve ser uma string`;
    }
    
    if (value.length > this.maxLength) {
      return `O campo ${field} deve ter no máximo ${this.maxLength} caracteres`;
    }
    
    return true;
  }
}

/**
 * Regra de validação para emails
 */
export class EmailRule extends ValidationRule {
  private emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  /**
   * Valida se um valor é um email válido
   * @param value Valor a ser validado
   * @param field Nome do campo
   * @returns true se válido, mensagem de erro se inválido
   */
  validate(value: any, field: string): true | string {
    if (value === undefined || value === null || value === '') {
      return true; // Deixar a regra RequiredRule lidar com valores ausentes
    }
    
    if (typeof value !== 'string') {
      return `O campo ${field} deve ser uma string`;
    }
    
    if (!this.emailRegex.test(value)) {
      return `O campo ${field} deve ser um email válido`;
    }
    
    return true;
  }
}

/**
 * Regra de validação para números
 */
export class NumberRule extends ValidationRule {
  /**
   * Valida se um valor é um número
   * @param value Valor a ser validado
   * @param field Nome do campo
   * @returns true se válido, mensagem de erro se inválido
   */
  validate(value: any, field: string): true | string {
    if (value === undefined || value === null || value === '') {
      return true; // Deixar a regra RequiredRule lidar com valores ausentes
    }
    
    if (typeof value !== 'number' && isNaN(Number(value))) {
      return `O campo ${field} deve ser um número`;
    }
    
    return true;
  }
}

/**
 * Regra de validação para números com valor mínimo
 */
export class MinValueRule extends ValidationRule {
  private minValue: number;
  
  /**
   * Construtor
   * @param minValue Valor mínimo
   */
  constructor(minValue: number) {
    super();
    this.minValue = minValue;
  }
  
  /**
   * Valida se um número tem o valor mínimo
   * @param value Valor a ser validado
   * @param field Nome do campo
   * @returns true se válido, mensagem de erro se inválido
   */
  validate(value: any, field: string): true | string {
    if (value === undefined || value === null || value === '') {
      return true; // Deixar a regra RequiredRule lidar com valores ausentes
    }
    
    const numValue = Number(value);
    if (isNaN(numValue)) {
      return `O campo ${field} deve ser um número`;
    }
    
    if (numValue < this.minValue) {
      return `O campo ${field} deve ser maior ou igual a ${this.minValue}`;
    }
    
    return true;
  }
}

/**
 * Regra de validação para números com valor máximo
 */
export class MaxValueRule extends ValidationRule {
  private maxValue: number;
  
  /**
   * Construtor
   * @param maxValue Valor máximo
   */
  constructor(maxValue: number) {
    super();
    this.maxValue = maxValue;
  }
  
  /**
   * Valida se um número tem o valor máximo
   * @param value Valor a ser validado
   * @param field Nome do campo
   * @returns true se válido, mensagem de erro se inválido
   */
  validate(value: any, field: string): true | string {
    if (value === undefined || value === null || value === '') {
      return true; // Deixar a regra RequiredRule lidar com valores ausentes
    }
    
    const numValue = Number(value);
    if (isNaN(numValue)) {
      return `O campo ${field} deve ser um número`;
    }
    
    if (numValue > this.maxValue) {
      return `O campo ${field} deve ser menor ou igual a ${this.maxValue}`;
    }
    
    return true;
  }
}

/**
 * Regra de validação para expressões regulares
 */
export class RegexRule extends ValidationRule {
  private regex: RegExp;
  private message: string;
  
  /**
   * Construtor
   * @param regex Expressão regular
   * @param message Mensagem de erro personalizada
   */
  constructor(regex: RegExp, message: string) {
    super();
    this.regex = regex;
    this.message = message;
  }
  
  /**
   * Valida se um valor corresponde à expressão regular
   * @param value Valor a ser validado
   * @param field Nome do campo
   * @returns true se válido, mensagem de erro se inválido
   */
  validate(value: any, field: string): true | string {
    if (value === undefined || value === null || value === '') {
      return true; // Deixar a regra RequiredRule lidar com valores ausentes
    }
    
    if (typeof value !== 'string') {
      return `O campo ${field} deve ser uma string`;
    }
    
    if (!this.regex.test(value)) {
      return this.message.replace('{field}', field);
    }
    
    return true;
  }
}

/**
 * Regra de validação para valores em um conjunto
 */
export class EnumRule extends ValidationRule {
  private allowedValues: any[];
  
  /**
   * Construtor
   * @param allowedValues Valores permitidos
   */
  constructor(allowedValues: any[]) {
    super();
    this.allowedValues = allowedValues;
  }
  
  /**
   * Valida se um valor está no conjunto de valores permitidos
   * @param value Valor a ser validado
   * @param field Nome do campo
   * @returns true se válido, mensagem de erro se inválido
   */
  validate(value: any, field: string): true | string {
    if (value === undefined || value === null || value === '') {
      return true; // Deixar a regra RequiredRule lidar com valores ausentes
    }
    
    if (!this.allowedValues.includes(value)) {
      return `O campo ${field} deve ser um dos seguintes valores: ${this.allowedValues.join(', ')}`;
    }
    
    return true;
  }
}

/**
 * Validador de objetos
 */
export class Validator implements IValidator {
  private rules: Record<string, IValidationRule[]>;
  
  /**
   * Construtor
   * @param rules Regras de validação para cada campo
   */
  constructor(rules: Record<string, IValidationRule[]> = {}) {
    this.rules = rules;
  }
  
  /**
   * Adiciona uma regra de validação para um campo
   * @param field Nome do campo
   * @param rule Regra de validação
   */
  public addRule(field: string, rule: IValidationRule): void {
    if (!this.rules[field]) {
      this.rules[field] = [];
    }
    
    this.rules[field].push(rule);
  }
  
  /**
   * Valida um objeto
   * @param data Objeto a ser validado
   * @returns Objeto com erros de validação ou null se válido
   */
  public validate(data: Record<string, any>): Record<string, string> | null {
    const errors: Record<string, string> = {};
    
    for (const field in this.rules) {
      for (const rule of this.rules[field]) {
        const result = rule.validate(data[field], field);
        
        if (result !== true) {
          errors[field] = result;
          break; // Parar na primeira regra que falhar para este campo
        }
      }
    }
    
    return Object.keys(errors).length > 0 ? errors : null;
  }
}

/**
 * Cria um validador para um objeto
 * @param schema Esquema de validação
 * @returns Validador configurado
 */
export function createValidator(schema: Record<string, IValidationRule[]>): Validator {
  return new Validator(schema);
}

/**
 * Funções auxiliares para criar regras de validação
 */
export const Validation = {
  required: () => new RequiredRule(),
  minLength: (length: number) => new MinLengthRule(length),
  maxLength: (length: number) => new MaxLengthRule(length),
  email: () => new EmailRule(),
  number: () => new NumberRule(),
  minValue: (value: number) => new MinValueRule(value),
  maxValue: (value: number) => new MaxValueRule(value),
  regex: (regex: RegExp, message: string) => new RegexRule(regex, message),
  enum: (values: any[]) => new EnumRule(values)
}; 