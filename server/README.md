# API do Sistema AMESGO

API modular e extensível para o sistema AMESGO de gerenciamento de pacientes e controle de refeições.

## Características

- Arquitetura modular e extensível
- Sistema de plugins dinâmicos
- Cache para melhorar desempenho
- Sistema de eventos para comunicação entre módulos
- Validação robusta de dados
- Monitoramento e métricas
- Documentação automática com Swagger

## Requisitos

- Node.js 14+
- MySQL 5.7+

## Instalação

1. Clone o repositório
2. Instale as dependências:

```bash
cd server
npm install
```

3. Configure as variáveis de ambiente:

```bash
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

4. Inicialize o banco de dados:

```bash
npm run init-db
```

5. Inicie o servidor:

```bash
# Desenvolvimento
npm run dev

# Produção
npm run build
npm start
```

## Documentação da API

A documentação da API está disponível em `/docs` quando o servidor está em execução.

## Arquitetura

A API é construída com uma arquitetura modular baseada em plugins. Cada funcionalidade é encapsulada em um módulo independente que pode ser registrado no gerenciador de API.

### Componentes Principais

- **ApiManager**: Gerencia módulos e suas dependências
- **BaseApiModule**: Classe base para todos os módulos
- **ApiResponse**: Padronização de respostas
- **ApiError**: Tratamento centralizado de erros
- **EventBus**: Comunicação entre módulos
- **CacheManager**: Gerenciamento de cache
- **Validator**: Validação de dados
- **ApiMetrics**: Monitoramento e métricas

## Exemplos de Uso

### 1. Criação de um Novo Módulo

```typescript
// modules/example/example.module.ts
import { BaseApiModule } from '../../core/base-module';
import { exampleController } from './example.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { asyncHandler } from '../../middleware/error-handler.middleware';

export class ExampleModule extends BaseApiModule {
  constructor() {
    super('example', 'Módulo de exemplo', '1.0.0');
  }

  protected async configureRoutes(): Promise<void> {
    this.router.get('/', asyncHandler(exampleController.getAll));
    this.router.post('/', authenticate, asyncHandler(exampleController.create));
    this.router.get('/:id', asyncHandler(exampleController.getById));
    this.router.put('/:id', authenticate, asyncHandler(exampleController.update));
    this.router.delete('/:id', authenticate, asyncHandler(exampleController.delete));
  }
}

export const exampleModule = new ExampleModule();
```

### 2. Uso do Sistema de Cache

```typescript
// Exemplo de uso do cache
import { CacheManager } from '../../core/cache-manager';

async function getDataWithCache() {
  const cacheManager = CacheManager.getInstance();
  const cacheKey = 'example:data';
  
  // Tentar obter do cache
  let data = await cacheManager.get(cacheKey);
  
  if (!data) {
    // Se não estiver em cache, buscar da fonte
    data = await fetchDataFromSource();
    
    // Armazenar em cache por 5 minutos
    await cacheManager.set(cacheKey, data, 300);
  }
  
  return data;
}
```

### 3. Uso do Sistema de Eventos

```typescript
// Publicador de eventos
import { EventBus } from '../../core/event-bus';

function publishEvent() {
  const eventBus = EventBus.getInstance();
  
  // Publicar um evento
  eventBus.emit('user:created', { id: 123, name: 'João Silva' });
}

// Assinante de eventos
function subscribeToEvents() {
  const eventBus = EventBus.getInstance();
  
  // Assinar um evento
  eventBus.on('user:created', (data) => {
    console.log(`Novo usuário criado: ${data.name}`);
  });
}
```

### 4. Uso do Sistema de Validação

```typescript
// Exemplo de validação
import { Validation, createValidator } from '../../core/validator';

// Criar um validador
const userValidator = createValidator({
  username: [
    Validation.required(),
    Validation.minLength(3),
    Validation.maxLength(50)
  ],
  email: [
    Validation.required(),
    Validation.email()
  ],
  age: [
    Validation.number(),
    Validation.minValue(18)
  ]
});

// Usar o validador
function validateUser(userData) {
  const errors = userValidator.validate(userData);
  
  if (errors) {
    throw new Error('Dados de usuário inválidos');
  }
  
  return userData;
}
```

### 5. Uso do Sistema de Monitoramento

```typescript
// Obter métricas da API
import { ApiMetrics } from '../../middleware/monitoring.middleware';

function getApiMetrics() {
  const metrics = ApiMetrics.getInstance().getMetrics();
  
  console.log(`Total de requisições: ${metrics.requestCount}`);
  console.log(`Tempo médio de resposta: ${metrics.avgResponseTime}ms`);
  console.log(`Taxa de erro: ${metrics.errorRate}%`);
}
```

## Estrutura de Diretórios

```
server/
├── src/
│   ├── core/                  # Núcleo da API
│   │   ├── api.ts             # Gerenciador da API
│   │   ├── api-response.ts    # Padronização de respostas
│   │   ├── base-module.ts     # Classe base para módulos
│   │   ├── cache-manager.ts   # Gerenciamento de cache
│   │   ├── event-bus.ts       # Sistema de eventos
│   │   ├── plugin-loader.ts   # Carregador de plugins
│   │   ├── swagger.ts         # Configuração do Swagger
│   │   └── validator.ts       # Sistema de validação
│   ├── middleware/            # Middlewares globais
│   │   ├── auth.middleware.ts # Autenticação
│   │   ├── error-handler.middleware.ts # Tratamento de erros
│   │   └── monitoring.middleware.ts # Monitoramento
│   ├── models/                # Modelos de dados
│   ├── modules/               # Módulos da API
│   │   ├── auth/              # Módulo de autenticação
│   │   ├── patients/          # Módulo de pacientes
│   │   └── reports/           # Módulo de relatórios
│   ├── types/                 # Definições de tipos
│   ├── config/                # Configurações
│   └── index.ts               # Ponto de entrada da aplicação
├── plugins/                   # Diretório para plugins externos
├── .env                       # Variáveis de ambiente
├── package.json
└── tsconfig.json
```

## Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Faça commit das suas alterações (`git commit -m 'Adiciona nova feature'`)
4. Faça push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## Licença

Este projeto está licenciado sob a licença ISC. 