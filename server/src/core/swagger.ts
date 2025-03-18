import { Application } from 'express';

// Usando require em vez de import para os módulos do swagger
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

/**
 * Configuração do Swagger para documentação da API
 */
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AMESGO API',
      version: '1.0.0',
      description: 'API do sistema AMESGO para gerenciamento de pacientes e controle de refeições',
      license: {
        name: 'ISC',
        url: 'https://opensource.org/licenses/ISC',
      },
      contact: {
        name: 'Suporte AMESGO',
        url: 'https://amesgo.com.br',
        email: 'suporte@amesgo.com.br',
      },
    },
    servers: [
      {
        url: '/api/v1',
        description: 'Servidor de API v1',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'error',
            },
            message: {
              type: 'string',
              example: 'Mensagem de erro',
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  example: 'ERROR_CODE',
                },
                details: {
                  type: 'object',
                  example: null,
                },
              },
            },
            meta: {
              type: 'object',
              properties: {
                timestamp: {
                  type: 'number',
                  example: 1625097600000,
                },
                apiVersion: {
                  type: 'string',
                  example: 'v1',
                },
              },
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1,
            },
            username: {
              type: 'string',
              example: 'usuario',
            },
            name: {
              type: 'string',
              example: 'Nome Completo',
            },
            email: {
              type: 'string',
              example: 'usuario@exemplo.com',
            },
            role: {
              type: 'string',
              enum: ['admin', 'client', 'user'],
              example: 'user',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Patient: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1,
            },
            name: {
              type: 'string',
              example: 'Nome do Paciente',
            },
            cpf: {
              type: 'string',
              example: '123.456.789-00',
            },
            contact_number: {
              type: 'string',
              example: '(11) 98765-4321',
            },
            authorizer: {
              type: 'string',
              example: 'Nome do Autorizador',
            },
            municipality: {
              type: 'string',
              example: 'São Paulo',
            },
            breakfast: {
              type: 'boolean',
              example: true,
            },
            lunch: {
              type: 'boolean',
              example: true,
            },
            dinner: {
              type: 'boolean',
              example: false,
            },
            start_date: {
              type: 'string',
              format: 'date-time',
            },
            end_date: {
              type: 'string',
              format: 'date-time',
            },
            status: {
              type: 'string',
              enum: ['ACTIVE', 'INACTIVE'],
              example: 'ACTIVE',
            },
            observation: {
              type: 'string',
              example: 'Observações sobre o paciente',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Token de acesso ausente, inválido ou expirado',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        NotFoundError: {
          description: 'Recurso não encontrado',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        ValidationError: {
          description: 'Erro de validação nos dados enviados',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        ServerError: {
          description: 'Erro interno do servidor',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/modules/**/*.ts', './src/routes/**/*.ts'],
};

const specs = swaggerJsdoc(options);

/**
 * Configura o Swagger na aplicação
 * @param app Aplicação Express
 * @param path Caminho para a documentação (padrão: /docs)
 */
export const setupSwagger = (app: Application, path: string = '/docs'): void => {
  app.use(path, swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'AMESGO API - Documentação',
  }));
  
  // Endpoint para obter a especificação OpenAPI em formato JSON
  app.get(`${path}.json`, (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });
  
  console.log(`Documentação Swagger disponível em: ${path}`);
}; 