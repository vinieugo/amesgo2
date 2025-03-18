import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { getApiManager } from './core/api';
import { errorHandler, notFoundHandler } from './middleware/error-handler.middleware';
import { ApiResponse } from './core/api-response';
import { setupSwagger } from './core/swagger';
import { monitoringMiddleware, errorMonitoringMiddleware } from './middleware/monitoring.middleware';
import { securityMiddleware, corsSecurityMiddleware } from './middleware/security.middleware';
import { cryptoService } from './core/crypto.service';
import healthRouter from './health';

// Importar módulos
import { patientsModule } from './modules/patients/patients.module';
import { authModule } from './modules/auth/auth.module';
import { reportsModule } from './modules/reports/reports.module';
// Importar outros módulos conforme necessário

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;
const API_VERSION = process.env.API_VERSION || 'v1';

// Health check route - DEVE ser a primeira rota, antes de qualquer middleware
app.use('/health', healthRouter);

// Configurar versão da API para respostas padronizadas
ApiResponse.setApiVersion(API_VERSION);

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  credentials: true
}));
// Manter o middleware de segurança CORS para logs, mas não para bloquear
app.use(corsSecurityMiddleware(process.env.ALLOWED_ORIGINS ? 
  process.env.ALLOWED_ORIGINS.split(',') : 
  ['http://localhost:3000', 'http://localhost:8080', '*']));
app.use(helmet()); // Security headers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev')); // Logging

// Middleware de segurança
app.use(securityMiddleware);

// Middleware de monitoramento
app.use(monitoringMiddleware);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Inicializar o gerenciador de API
const apiManager = getApiManager(app, '/api', API_VERSION);

// Registrar módulos
apiManager.registerModule('auth', authModule);
apiManager.registerModule('patients', patientsModule);
apiManager.registerModule('reports', reportsModule);
// Registrar outros módulos conforme necessário

// Inicializar módulos
(async () => {
  try {
    await apiManager.initializeModules();
    console.log('Todos os módulos foram inicializados com sucesso');
    
    // Configurar rotas dos módulos
    apiManager.setupRoutes();
    
    // Configurar Swagger para documentação da API
    setupSwagger(app, '/docs');
    
    // Root route
    app.get('/', (req, res) => {
      ApiResponse.success(res, {
        name: 'Amesgo API',
        version: API_VERSION,
        modules: apiManager.listModules(),
        docs: `/docs`
      }, 'API está funcionando');
    });
    
    // Middleware para rotas não encontradas (deve vir após todas as rotas)
    app.use(notFoundHandler);
    
    // Middleware para monitoramento de erros
    app.use(errorMonitoringMiddleware);
    
    // Middleware para tratamento de erros (deve ser o último middleware)
    app.use(errorHandler);
    
    // Start server
    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
      console.log(`API v${API_VERSION} disponível em http://localhost:${PORT}/api/${API_VERSION}`);
      console.log(`Documentação disponível em http://localhost:${PORT}/docs`);
      console.log(`Health check disponível em http://localhost:${PORT}/health`);
      
      // Verificar se a chave de criptografia está configurada
      if (!process.env.ENCRYPTION_KEY) {
        console.warn('\x1b[33m%s\x1b[0m', 'AVISO DE SEGURANÇA: Nenhuma chave de criptografia encontrada no ambiente.');
        console.warn('\x1b[33m%s\x1b[0m', 'Defina a variável ENCRYPTION_KEY no arquivo .env para maior segurança.');
      } else {
        console.log('\x1b[32m%s\x1b[0m', 'Criptografia configurada corretamente.');
      }
    });
  } catch (error) {
    console.error('Erro ao inicializar a aplicação:', error);
    process.exit(1);
  }
})();

export default app; 