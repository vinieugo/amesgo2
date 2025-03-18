# Guia de Instalação do AMESGO SYSTEM para Windows

Este documento fornece instruções detalhadas para instalar e configurar o AMESGO SYSTEM em um ambiente Windows.

## Opções de Instalação

Você tem três opções para instalar o AMESGO SYSTEM:

1. **Script PowerShell Interativo** (Recomendado)
2. **Script Batch Simples**
3. **Instalação Manual**

## 1. Instalação via Script PowerShell (Recomendado)

O script PowerShell oferece uma interface interativa com verificação de requisitos e opções de instalação personalizadas.

### Passos para Instalação via PowerShell:

1. Clique com o botão direito no arquivo `setup-windows.ps1`
2. Selecione "Executar com o PowerShell"
3. Se solicitado, confirme a execução do script
4. Siga as instruções na tela

**Nota**: Se você encontrar erros de permissão, execute o PowerShell como administrador:
1. Pressione `Win + X`
2. Selecione "Windows PowerShell (Admin)"
3. Navegue até a pasta do projeto
4. Execute: `.\setup-windows.ps1`

### Criando Atalho para Instalação Fácil:

Para criar atalhos na área de trabalho:
1. Clique duas vezes no arquivo `create-shortcut.vbs`
2. Dois atalhos serão criados na sua área de trabalho
3. Clique com o botão direito no atalho "Instalar AMESGO SYSTEM"
4. Selecione "Executar como administrador"

## 2. Instalação via Script Batch

O script batch é uma alternativa mais simples que instala todas as dependências automaticamente.

### Passos para Instalação via Batch:

1. Clique com o botão direito no arquivo `setup-windows.bat`
2. Selecione "Executar como administrador"
3. Siga as instruções na tela

## 3. Instalação Manual

Se preferir instalar manualmente, siga estes passos:

1. Instale o Node.js (versão LTS) de [nodejs.org](https://nodejs.org/)
2. Instale o MySQL (versão 8.0 ou superior) de [dev.mysql.com](https://dev.mysql.com/downloads/installer/)
3. Abra o Prompt de Comando como administrador
4. Navegue até a pasta do projeto
5. Execute os seguintes comandos:

```
npm install -g concurrently nodemon typescript ts-node
npm install
cd server && npm install
cd ..
cd client && npm install
cd ..
```

## Configuração do Banco de Dados

Após a instalação, configure o banco de dados:

1. Crie um arquivo `.env` na pasta `server` com as seguintes informações:

```
DB_HOST=localhost
DB_USER=seu_usuario_mysql
DB_PASSWORD=sua_senha_mysql
DB_NAME=amesgo_db
JWT_SECRET=uma_chave_secreta_para_autenticacao
PORT=5000
```

2. Inicialize o banco de dados:

```
cd server
npm run init-db
```

## Iniciando a Aplicação

Após a instalação e configuração:

1. Para iniciar o ambiente de desenvolvimento completo:
```
npm run dev
```

2. Para iniciar apenas o servidor backend:
```
npm run server
```

3. Para iniciar apenas o cliente frontend:
```
npm run client
```

## Solução de Problemas Comuns no Windows

### Erro de Execução de Scripts PowerShell

Se você receber um erro sobre a execução de scripts estar desabilitada:

1. Abra o PowerShell como administrador
2. Execute: `Set-ExecutionPolicy RemoteSigned`
3. Confirme a alteração
4. Tente executar o script novamente

### Erro de Permissão ao Instalar Pacotes Globais

Se você encontrar erros de permissão ao instalar pacotes globais:

1. Certifique-se de estar executando o prompt de comando ou PowerShell como administrador
2. Tente instalar os pacotes globais individualmente:
```
npm install -g concurrently
npm install -g nodemon
npm install -g typescript
npm install -g ts-node
```

### Erro de Conexão com o MySQL

Se você encontrar erros de conexão com o MySQL:

1. Verifique se o serviço MySQL está em execução:
   - Pressione `Win + R`, digite `services.msc` e pressione Enter
   - Localize o serviço MySQL e certifique-se de que está em execução
2. Verifique se as credenciais no arquivo `.env` estão corretas
3. Tente conectar-se ao MySQL usando o MySQL Workbench ou linha de comando para confirmar que está funcionando

### Erro de Porta em Uso

Se você receber um erro indicando que a porta já está em uso:

1. Identifique qual processo está usando a porta:
   - Para a porta 3000 (cliente): `netstat -ano | findstr :3000`
   - Para a porta 5000 (servidor): `netstat -ano | findstr :5000`
2. Encerre o processo usando o ID do processo (PID) mostrado:
   - `taskkill /F /PID [número_do_pid]`
3. Alternativamente, altere as portas no arquivo `.env` (servidor) ou no arquivo `package.json` do cliente

## Suporte

Se precisar de ajuda adicional, entre em contato com a equipe de suporte em [suporte@amesgo.com.br](mailto:suporte@amesgo.com.br) ou abra uma issue no repositório do projeto.

---

© AMESGO SYSTEM - Todos os direitos reservados 