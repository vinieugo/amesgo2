# Sistema Amesgo

Sistema web robusto e seguro para gerenciamento de pacientes e controle de refeições.

## Características

- **Autenticação segura** com diferentes níveis de acesso
- **Cadastro de pacientes** com informações detalhadas
- **Controle de refeições** (café da manhã, almoço e janta)
- **Dashboard** para visualização de estatísticas
- **Responsivo** para computadores e dispositivos móveis
- **Tema escuro e claro**
- **Segurança avançada** com autenticação JWT e proteção contra ataques comuns

## Arquitetura

O sistema foi construído usando uma arquitetura de camadas:

- **Frontend**: React.js com Material-UI e TypeScript
- **Backend**: Node.js com Express e TypeScript
- **Banco de dados**: MySQL

## Requisitos

- Node.js 14+ e npm/yarn
- MySQL 5.7+

## Instalação

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/amesgo-system.git
cd amesgo-system
```

### 2. Configuração do Backend

```bash
cd server
npm install

# Configurar variáveis de ambiente
cp .env.example .env

# Edite o arquivo .env com suas configurações
```

### 3. Configuração do Banco de Dados

```bash
# Inicialize o banco de dados
npm run init-db
```

### 4. Configuração do Frontend

```bash
cd ../client
npm install
```

## Execução

### Iniciar o Backend

```bash
cd server
npm run dev
```

### Iniciar o Frontend

```bash
cd client
npm start
```

Acesse o sistema em [http://localhost:3000](http://localhost:3000)

## Tipos de Usuários

O sistema possui três tipos de usuários:

1. **Administrador**: acesso total, pode gerenciar usuários e todos os recursos
2. **Cliente**: visualização de todas as informações, sem permissão para edição
3. **Cadastro**: acesso apenas ao módulo de cadastro de pacientes

Para o primeiro acesso, utilize:
- Usuário: `admin`
- Senha: `admin123`

## Funcionalidades

### Módulo de Cadastro de Pacientes

Permite o registro de pacientes com:

- Nome completo
- CPF
- Número de contato
- Autorizador
- Opções de refeições (café da manhã, almoço e janta)

### Dashboard

- Visualização de estatísticas sobre os pacientes cadastrados
- Filtros por data para análise específica
- Gráficos interativos para melhor compreensão dos dados

### Módulo de Acompanhamento

Área em branco para implementação futura conforme necessidade.

## Segurança

O sistema implementa:

- Autenticação JWT
- Proteção de rotas por nível de acesso
- Hash de senhas com bcrypt
- Proteção contra ataques de injeção SQL
- Limitação de taxa para evitar ataques de força bruta
- Proteção contra CSRF e XSS

## Suporte

Para dúvidas ou suporte, entre em contato com a equipe de desenvolvimento.

---

© 2025 Sistema Amesgo. Todos os direitos reservados. 