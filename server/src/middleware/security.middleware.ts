import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import { ApiError } from '../core/api-error';
import helmet from 'helmet';
import { cryptoService } from '../core/crypto.service';
import { ParsedQs } from 'qs';

/**
 * Middleware para adicionar cabeçalhos de segurança HTTP
 * Protege contra ataques comuns como XSS, clickjacking, etc.
 */
export const securityHeadersMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Necessário para Swagger UI
      styleSrc: ["'self'", "'unsafe-inline'"], // Necessário para Swagger UI
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  xssFilter: true,
  noSniff: true,
  referrerPolicy: { policy: 'same-origin' },
  hsts: {
    maxAge: 15552000, // 180 dias
    includeSubDomains: true,
    preload: true,
  },
  frameguard: {
    action: 'deny',
  },
  permittedCrossDomainPolicies: {
    permittedPolicies: 'none',
  },
});

/**
 * Middleware para validação de CORS
 * Verifica se a origem da requisição está na lista de origens permitidas
 */
export const corsSecurityMiddleware = (allowedOrigins: string[] = []) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const origin = req.headers.origin;
    
    // Se não houver origem ou for uma requisição do mesmo site, continuar
    if (!origin) {
      return next();
    }
    
    // Verificar se a origem está na lista de origens permitidas
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      
      // Lidar com requisições preflight
      if (req.method === 'OPTIONS') {
        res.status(204).end();
        return;
      }
    } else {
      // Origem não permitida
      next(new ApiError('Origem não permitida', 403));
      return;
    }
    
    next();
  };
};

/**
 * Middleware para limitar taxa de requisições
 * Protege contra ataques de força bruta e DoS
 */
export const rateLimitMiddleware = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // limite de 100 requisições por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Muitas requisições deste IP, tente novamente após 15 minutos',
  skip: (req) => {
    // Não aplicar limite para rotas de documentação
    return req.path.startsWith('/docs');
  },
});

/**
 * Middleware para verificação de chave de API
 * Requer que requisições incluam uma chave de API válida
 */
export const apiKeyMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Verificar se a rota deve ser protegida por chave de API
  if (req.path.startsWith('/docs') || req.path === '/api/v1/health') {
    return next();
  }
  
  const apiKey = req.headers['x-api-key'] as string;
  
  if (!apiKey) {
    return next(new ApiError('Chave de API ausente', 401));
  }
  
  // Verificar se a chave de API é válida
  // Em produção, isso deve verificar contra um banco de dados ou cache
  const validApiKey = process.env.API_KEY || 'dev-api-key';
  
  if (apiKey !== validApiKey) {
    return next(new ApiError('Chave de API inválida', 401));
  }
  
  next();
};

/**
 * Middleware para prevenção de ataques de falsificação de requisição entre sites (CSRF)
 * Requer um token CSRF válido para requisições mutantes (POST, PUT, DELETE)
 */
export const csrfProtectionMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Ignorar para rotas de documentação e requisições GET/HEAD/OPTIONS
  if (
    req.path.startsWith('/docs') ||
    ['GET', 'HEAD', 'OPTIONS'].includes(req.method)
  ) {
    return next();
  }
  
  const csrfToken = req.headers['x-csrf-token'] as string;
  
  if (!csrfToken) {
    return next(new ApiError('Token CSRF ausente', 403));
  }
  
  // Verificar se o token CSRF é válido
  // Em produção, isso deve verificar contra um token armazenado na sessão do usuário
  const sessionToken = req.headers['x-session-id'] as string;
  
  if (!sessionToken) {
    return next(new ApiError('ID de sessão ausente', 403));
  }
  
  // Verificar HMAC do token CSRF
  try {
    const expectedToken = cryptoService.generateHmac(sessionToken);
    
    if (!cryptoService.verifyHmac(sessionToken, csrfToken)) {
      return next(new ApiError('Token CSRF inválido', 403));
    }
  } catch (error) {
    return next(new ApiError('Erro ao validar token CSRF', 500));
  }
  
  next();
};

/**
 * Middleware para validação de payload JSON
 * Protege contra ataques de injeção JSON e payloads maliciosos
 */
export const jsonValidationMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  if (req.is('application/json') && req.body) {
    // Verificar tamanho do payload
    const payloadSize = JSON.stringify(req.body).length;
    const maxSize = 1024 * 1024; // 1MB
    
    if (payloadSize > maxSize) {
      return next(new ApiError('Payload muito grande', 413));
    }
    
    // Verificar profundidade do objeto JSON
    const checkDepth = (obj: any, currentDepth = 0): number => {
      if (currentDepth > 20) return currentDepth; // Limite de profundidade
      
      if (obj && typeof obj === 'object') {
        return Object.values(obj).reduce((maxDepth: number, value) => {
          if (value && typeof value === 'object') {
            return Math.max(maxDepth, checkDepth(value, currentDepth + 1));
          }
          return maxDepth;
        }, currentDepth);
      }
      
      return currentDepth;
    };
    
    const depth = checkDepth(req.body);
    if (depth > 20) {
      return next(new ApiError('Estrutura JSON muito complexa', 400));
    }
  }
  
  next();
};

/**
 * Middleware para prevenção de ataques de enumeração de usuários
 * Adiciona atrasos aleatórios para dificultar ataques de timing
 */
export const antiEnumerationMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Aplicar apenas a rotas sensíveis como login, recuperação de senha, etc.
  if (
    req.path.includes('/auth/login') ||
    req.path.includes('/auth/forgot-password') ||
    req.path.includes('/auth/reset-password')
  ) {
    // Adicionar atraso aleatório entre 100ms e 300ms
    const delay = 100 + Math.floor(Math.random() * 200);
    setTimeout(() => {
      next();
    }, delay);
  } else {
    next();
  }
};

/**
 * Middleware para detecção de ataques de força bruta
 * Bloqueia temporariamente IPs após múltiplas tentativas falhas
 */
const failedAttempts: Record<string, { count: number; lastAttempt: number }> = {};

export const bruteForceProtectionMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Aplicar apenas a rotas de autenticação
  if (!req.path.includes('/auth/login')) {
    return next();
  }
  
  const ip = req.ip || req.socket.remoteAddress || '';
  const now = Date.now();
  
  // Verificar se o IP está bloqueado
  if (failedAttempts[ip]) {
    const { count, lastAttempt } = failedAttempts[ip];
    
    // Calcular tempo de bloqueio baseado no número de tentativas
    // 5 tentativas: 5 minutos, 10 tentativas: 30 minutos, 15+ tentativas: 2 horas
    let blockDuration = 0;
    
    if (count >= 15) {
      blockDuration = 2 * 60 * 60 * 1000; // 2 horas
    } else if (count >= 10) {
      blockDuration = 30 * 60 * 1000; // 30 minutos
    } else if (count >= 5) {
      blockDuration = 5 * 60 * 1000; // 5 minutos
    }
    
    // Verificar se o tempo de bloqueio ainda não expirou
    if (blockDuration > 0 && now - lastAttempt < blockDuration) {
      const remainingTime = Math.ceil((blockDuration - (now - lastAttempt)) / 60000);
      return next(
        new ApiError(
          `Muitas tentativas de login. Tente novamente em ${remainingTime} minutos.`,
          429
        )
      );
    }
    
    // Se o bloqueio expirou, resetar contador após 24 horas
    if (now - lastAttempt > 24 * 60 * 60 * 1000) {
      delete failedAttempts[ip];
    }
  }
  
  // Interceptar a resposta para detectar falhas de login
  const originalSend = res.send;
  res.send = function (body) {
    // Restaurar o método original
    res.send = originalSend;
    
    // Verificar se é uma resposta de erro de autenticação
    if (res.statusCode === 401) {
      if (!failedAttempts[ip]) {
        failedAttempts[ip] = { count: 0, lastAttempt: now };
      }
      
      failedAttempts[ip].count += 1;
      failedAttempts[ip].lastAttempt = now;
    } else if (res.statusCode === 200 && failedAttempts[ip]) {
      // Login bem-sucedido, resetar contador
      delete failedAttempts[ip];
    }
    
    return originalSend.call(this, body);
  };
  
  next();
};

/**
 * Middleware para sanitização de entrada
 * Remove caracteres potencialmente perigosos da entrada do usuário
 */
export const inputSanitizationMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Função para sanitizar strings
  const sanitizeString = (str: string): string => {
    // Remover caracteres potencialmente perigosos
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '')
      .replace(/\b(alert|confirm|prompt|eval)\b/gi, '');
  };
  
  // Função recursiva para sanitizar objetos
  const sanitizeObject = (obj: any): any => {
    if (!obj) return obj;
    
    if (typeof obj === 'string') {
      return sanitizeString(obj);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => sanitizeObject(item));
    }
    
    if (typeof obj === 'object') {
      const sanitized: Record<string, any> = {};
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          sanitized[key] = sanitizeObject(obj[key]);
        }
      }
      return sanitized;
    }
    
    return obj;
  };
  
  // Sanitizar body, query e params
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  
  if (req.query) {
    for (const key in req.query) {
      if (typeof req.query[key] === 'string') {
        req.query[key] = sanitizeString(req.query[key] as string);
      }
    }
  }
  
  if (req.params) {
    for (const key in req.params) {
      if (typeof req.params[key] === 'string') {
        req.params[key] = sanitizeString(req.params[key]);
      }
    }
  }
  
  next();
};

/**
 * Middleware para prevenção de ataques de HTTP Parameter Pollution
 * Converte parâmetros duplicados em arrays
 */
export const httpParameterPollutionMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Processar parâmetros de consulta
  if (req.query) {
    const cleanQuery: Record<string, string | string[]> = {};
    
    for (const key in req.query) {
      const value = req.query[key];
      
      if (Array.isArray(value)) {
        // Se já for um array, manter apenas o primeiro valor
        cleanQuery[key] = value[0] as string;
      } else if (typeof value === 'string') {
        cleanQuery[key] = value;
      }
    }
    
    // Converter para o tipo esperado pelo Express
    req.query = cleanQuery as unknown as ParsedQs;
  }
  
  next();
};

/**
 * Middleware para validação de cabeçalhos HTTP
 * Verifica se os cabeçalhos estão em conformidade com as expectativas
 */
export const headerValidationMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Verificar Content-Type para requisições POST/PUT
  if (['POST', 'PUT'].includes(req.method) && req.body) {
    const contentType = req.headers['content-type'];
    
    if (!contentType) {
      return next(new ApiError('Cabeçalho Content-Type ausente', 400));
    }
    
    if (!contentType.includes('application/json') && !contentType.includes('multipart/form-data')) {
      return next(new ApiError('Content-Type não suportado', 415));
    }
  }
  
  next();
};

/**
 * Middleware para prevenção de ataques de SQL Injection
 * Verifica parâmetros em busca de padrões suspeitos de SQL Injection
 */
export const sqlInjectionProtectionMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Padrões suspeitos de SQL Injection
  const sqlPatterns = [
    /(\b|')SELECT(\b|')/i,
    /(\b|')INSERT(\b|')/i,
    /(\b|')UPDATE(\b|')/i,
    /(\b|')DELETE(\b|')/i,
    /(\b|')DROP(\b|')/i,
    /(\b|')UNION(\b|')/i,
    /(\b|')OR 1=1(\b|')/i,
    /(\b|')OR '1'='1(\b|')/i,
    /--/,
    /;/,
  ];
  
  // Função para verificar padrões de SQL Injection
  const checkSqlInjection = (value: string): boolean => {
    if (typeof value !== 'string') return false;
    
    return sqlPatterns.some(pattern => pattern.test(value));
  };
  
  // Verificar parâmetros de consulta
  for (const key in req.query) {
    const value = req.query[key];
    if (typeof value === 'string' && checkSqlInjection(value)) {
      return next(new ApiError('Parâmetro de consulta inválido', 400));
    }
  }
  
  // Verificar parâmetros de rota
  for (const key in req.params) {
    if (checkSqlInjection(req.params[key])) {
      return next(new ApiError('Parâmetro de rota inválido', 400));
    }
  }
  
  // Verificar campos do corpo da requisição
  const checkBodyFields = (obj: any): boolean => {
    if (!obj) return false;
    
    if (typeof obj === 'string') {
      return checkSqlInjection(obj);
    }
    
    if (Array.isArray(obj)) {
      return obj.some(item => checkBodyFields(item));
    }
    
    if (typeof obj === 'object') {
      return Object.values(obj).some(value => checkBodyFields(value));
    }
    
    return false;
  };
  
  if (req.body && checkBodyFields(req.body)) {
    return next(new ApiError('Corpo da requisição inválido', 400));
  }
  
  next();
};

/**
 * Middleware para prevenção de ataques de Path Traversal
 * Verifica parâmetros em busca de tentativas de acessar arquivos fora do diretório permitido
 */
export const pathTraversalProtectionMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Padrões suspeitos de Path Traversal
  const pathTraversalPatterns = [
    /\.\.\//,
    /\.\.\\/, 
    /%2e%2e%2f/i,
    /%2e%2e\//i,
    /\.\.%2f/i,
    /%252e%252e%252f/i,
    /etc\/passwd/i,
    /\/proc\//i,
    /\/var\/log\//i,
    /\/windows\/system32\//i,
  ];
  
  // Função para verificar padrões de Path Traversal
  const checkPathTraversal = (value: string): boolean => {
    if (typeof value !== 'string') return false;
    
    return pathTraversalPatterns.some(pattern => pattern.test(value));
  };
  
  // Verificar URL
  if (checkPathTraversal(req.path)) {
    return next(new ApiError('URL inválida', 400));
  }
  
  // Verificar parâmetros de consulta
  for (const key in req.query) {
    const value = req.query[key];
    if (typeof value === 'string' && checkPathTraversal(value)) {
      return next(new ApiError('Parâmetro de consulta inválido', 400));
    }
  }
  
  // Verificar parâmetros de rota
  for (const key in req.params) {
    if (checkPathTraversal(req.params[key])) {
      return next(new ApiError('Parâmetro de rota inválido', 400));
    }
  }
  
  next();
};

/**
 * Middleware para prevenção de ataques de Command Injection
 * Verifica parâmetros em busca de tentativas de injeção de comandos do sistema
 */
export const commandInjectionProtectionMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Padrões suspeitos de Command Injection
  const commandInjectionPatterns = [
    /\b(exec|spawn|fork|execFile|execSync|spawnSync|forkSync|execFileSync)\b/i,
    /\b(eval|setTimeout|setInterval|Function)\s*\(/i,
    /\b(bash|sh|cmd|powershell|cmd\.exe|\/bin\/sh)\b/i,
    /[;&|`]/,
    /\$\(/,
    />\s*[a-zA-Z0-9]+/,
    /<\s*[a-zA-Z0-9]+/,
  ];
  
  // Função para verificar padrões de Command Injection
  const checkCommandInjection = (value: string): boolean => {
    if (typeof value !== 'string') return false;
    
    return commandInjectionPatterns.some(pattern => pattern.test(value));
  };
  
  // Verificar parâmetros de consulta
  for (const key in req.query) {
    const value = req.query[key];
    if (typeof value === 'string' && checkCommandInjection(value)) {
      return next(new ApiError('Parâmetro de consulta inválido', 400));
    }
  }
  
  // Verificar parâmetros de rota
  for (const key in req.params) {
    if (checkCommandInjection(req.params[key])) {
      return next(new ApiError('Parâmetro de rota inválido', 400));
    }
  }
  
  // Verificar campos do corpo da requisição
  const checkBodyFields = (obj: any): boolean => {
    if (!obj) return false;
    
    if (typeof obj === 'string') {
      return checkCommandInjection(obj);
    }
    
    if (Array.isArray(obj)) {
      return obj.some(item => checkBodyFields(item));
    }
    
    if (typeof obj === 'object') {
      return Object.values(obj).some(value => checkBodyFields(value));
    }
    
    return false;
  };
  
  if (req.body && checkBodyFields(req.body)) {
    return next(new ApiError('Corpo da requisição inválido', 400));
  }
  
  next();
};

/**
 * Middleware para prevenção de ataques de NoSQL Injection
 * Verifica parâmetros em busca de padrões suspeitos de NoSQL Injection
 */
export const noSqlInjectionProtectionMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Padrões suspeitos de NoSQL Injection
  const noSqlPatterns = [
    /\$where\s*:/i,
    /\$ne\s*:/i,
    /\$gt\s*:/i,
    /\$lt\s*:/i,
    /\$gte\s*:/i,
    /\$lte\s*:/i,
    /\$in\s*:/i,
    /\$nin\s*:/i,
    /\$or\s*:/i,
    /\$and\s*:/i,
    /\$regex\s*:/i,
    /\$exists\s*:/i,
    /\$elemMatch\s*:/i,
  ];
  
  // Função para verificar padrões de NoSQL Injection
  const checkNoSqlInjection = (value: string): boolean => {
    if (typeof value !== 'string') return false;
    
    return noSqlPatterns.some(pattern => pattern.test(value));
  };
  
  // Verificar parâmetros de consulta
  for (const key in req.query) {
    const value = req.query[key];
    if (typeof value === 'string' && checkNoSqlInjection(value)) {
      return next(new ApiError('Parâmetro de consulta inválido', 400));
    }
  }
  
  // Verificar parâmetros de rota
  for (const key in req.params) {
    if (checkNoSqlInjection(req.params[key])) {
      return next(new ApiError('Parâmetro de rota inválido', 400));
    }
  }
  
  // Verificar campos do corpo da requisição
  const checkBodyFields = (obj: any): boolean => {
    if (!obj) return false;
    
    if (typeof obj === 'string') {
      return checkNoSqlInjection(obj);
    }
    
    if (Array.isArray(obj)) {
      return obj.some(item => checkBodyFields(item));
    }
    
    if (typeof obj === 'object') {
      return Object.values(obj).some(value => checkBodyFields(value));
    }
    
    return false;
  };
  
  if (req.body && checkBodyFields(req.body)) {
    return next(new ApiError('Corpo da requisição inválido', 400));
  }
  
  next();
};

// Exportar um middleware combinado para facilitar o uso
export const securityMiddleware = [
  securityHeadersMiddleware,
  rateLimitMiddleware,
  jsonValidationMiddleware,
  inputSanitizationMiddleware,
  headerValidationMiddleware,
  httpParameterPollutionMiddleware,
  sqlInjectionProtectionMiddleware,
  pathTraversalProtectionMiddleware,
  commandInjectionProtectionMiddleware,
  noSqlInjectionProtectionMiddleware,
  antiEnumerationMiddleware,
  bruteForceProtectionMiddleware,
]; 