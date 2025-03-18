# Arquitetura da API AMESGO

Este documento descreve a arquitetura modular e extensível da API do sistema AMESGO.

## Visão Geral

A API AMESGO foi projetada com foco em:

- **Modularidade**: Organização em módulos independentes
- **Extensibilidade**: Facilidade para adicionar novas funcionalidades
- **Manutenibilidade**: Código limpo e bem estruturado
- **Escalabilidade**: Preparada para crescer com o sistema
- **Padronização**: Respostas e tratamento de erros consistentes

## Estrutura de Diretórios

```
server/
├── src/
│   ├── core/                  # Núcleo da API
│   │   ├── api.ts             # Gerenciador da API
│   │   ├── api-response.ts    # Padronização de respostas
│   │   ├── base-module.ts     # Classe base para módulos
│   │   └── swagger.ts         # Configuração do Swagger
│   ├── middleware/            # Middlewares globais
│   │   ├── auth.middleware.ts # Autenticação
│   │   └── error-handler.middleware.ts # Tratamento de erros
│   ├── models/                # Modelos de dados
│   ├── modules/               # Módulos da API
│   │   ├── auth/              # Módulo de autenticação
│   │   │   ├── auth.module.ts # Definição do módulo
│   │   │   └── auth.controller.ts # Controlador
│   │   ├── patients/          # Módulo de pacientes
│   │   │   ├── patients.module.ts # Definição do módulo
│   │   │   └── patients.controller.ts # Controlador
│   │   └── ...                # Outros módulos
│   ├── types/                 # Definições de tipos
│   │   └── api.types.ts       # Tipos da API
│   ├── config/                # Configurações
│   │   └── db.ts              # Configuração do banco de dados
│   └── index.ts               # Ponto de entrada da aplicação
└── package.json
```

## Componentes Principais

### 1. Gerenciador de API (`ApiManager`)

O `ApiManager` é o componente central que gerencia todos os módulos da API. Ele é responsável por:

- Registrar módulos
- Inicializar módulos
- Configurar rotas
- Gerenciar o ciclo de vida dos módulos

```typescript
// Exemplo de uso
const apiManager = getApiManager(app, '/api', 'v1');
apiManager.registerModule('auth', authModule);
apiManager.registerModule('patients', patientsModule);
await apiManager.initializeModules();
apiManager.setupRoutes();
```

### 2. Módulos

Cada módulo é uma unidade independente que encapsula uma funcionalidade específica da API. Os módulos são baseados na classe `BaseApiModule` e implementam a interface `IApiModule`.

```typescript
// Exemplo de módulo
export class PatientsModule extends BaseApiModule {
  constructor() {
    super(
      'patients',
      'Gerenciamento de pacientes',
      '1.0.0',
      ['auth'] // Dependências
    );
  }

  protected async configureRoutes(): Promise<void> {
    // Configuração de rotas
    this.router.get('/', asyncHandler(controller.getAllPatients));
    this.router.post('/', asyncHandler(controller.createPatient));
    // ...
  }
}
```

### 3. Controladores

Os controladores implementam a lógica de negócios para cada módulo. Eles são responsáveis por:

- Processar requisições
- Interagir com os modelos
- Retornar respostas padronizadas

```typescript
// Exemplo de controlador
class PatientsController {
  public getAllPatients = async (req: Request, res: Response): Promise<void> => {
    const patients = await getAllPatients();
    ApiResponse.sendSuccess(res, patients);
  };
  
  // ...
}
```

### 4. Respostas Padronizadas

A classe `ApiResponse` fornece métodos para padronizar as respostas da API:

```typescript
// Exemplo de resposta de sucesso
ApiResponse.sendSuccess(res, data, 'Operação realizada com sucesso');

// Exemplo de resposta de erro
ApiResponse.sendError(res, 'VALIDATION_ERROR', 'Dados inválidos', 422, details);
```

Formato das respostas:

```json
{
  "status": "success",
  "message": "Operação realizada com sucesso",
  "data": { ... },
  "meta": {
    "timestamp": 1625097600000,
    "apiVersion": "v1"
  }
}
```

### 5. Tratamento de Erros

A API possui um sistema centralizado de tratamento de erros:

- Classe `ApiError` para erros específicos da API
- Middleware `errorHandler` para capturar e tratar erros
- Função `asyncHandler` para capturar erros em handlers assíncronos

```typescript
// Exemplo de uso de ApiError
if (!user) {
  throw ApiError.notFound('Usuário não encontrado');
}

// Exemplo de uso de asyncHandler
router.get('/', asyncHandler(async (req, res) => {
  // Código assíncrono que pode lançar exceções
}));
```

### 6. Documentação com Swagger

A API é documentada automaticamente usando Swagger/OpenAPI:

- Configuração centralizada em `swagger.ts`
- Documentação acessível em `/docs`
- Especificação OpenAPI em `/docs.json`

## Versionamento da API

A API suporta versionamento através de prefixos de URL:

- `/api/v1/...` - Versão 1 (atual)
- `/api/v2/...` - Versão 2 (futura)

Isso permite evoluir a API sem quebrar clientes existentes.

## Como Adicionar um Novo Módulo

1. Crie um diretório para o módulo em `src/modules/nome-do-modulo/`
2. Crie um controlador (`nome-do-modulo.controller.ts`)
3. Crie um módulo (`nome-do-modulo.module.ts`) estendendo `BaseApiModule`
4. Registre o módulo no `ApiManager` em `index.ts`

```typescript
// 1. Criar controlador
export const meuModuloController = new MeuModuloController();

// 2. Criar módulo
export class MeuModuloModule extends BaseApiModule {
  constructor() {
    super('meu-modulo', 'Descrição do módulo', '1.0.0');
  }
  
  protected async configureRoutes(): Promise<void> {
    this.router.get('/', asyncHandler(meuModuloController.getAll));
    // ...
  }
}

// 3. Exportar instância
export const meuModulo = new MeuModuloModule();

// 4. Registrar no index.ts
apiManager.registerModule('meu-modulo', meuModulo);
```

## Boas Práticas

1. **Modularidade**: Mantenha cada módulo focado em uma única responsabilidade
2. **Tratamento de Erros**: Use `ApiError` e `asyncHandler` para tratar erros de forma consistente
3. **Respostas**: Use `ApiResponse` para padronizar todas as respostas
4. **Validação**: Valide dados de entrada no início dos controladores
5. **Documentação**: Documente suas APIs com comentários compatíveis com Swagger
6. **Testes**: Escreva testes para cada módulo e controlador

## Conclusão

Esta arquitetura modular e extensível permite que a API AMESGO evolua de forma organizada, facilitando a adição de novas funcionalidades sem comprometer a estabilidade do sistema existente. 