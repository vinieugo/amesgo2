# Guia de Instalação do AMESGO SYSTEM

Este documento fornece instruções detalhadas para instalar e configurar o AMESGO SYSTEM em um ambiente Windows.

## Requisitos do Sistema

Antes de iniciar a instalação, certifique-se de que seu sistema atende aos seguintes requisitos:

1. **Sistema Operacional**: Windows 10 ou superior
2. **Node.js**: Versão 16.x ou superior (recomendamos a versão LTS)
3. **MySQL**: Versão 8.0 ou superior
4. **Espaço em Disco**: Mínimo de 1GB disponível
5. **Memória RAM**: Mínimo de 4GB (recomendado 8GB ou mais)
6. **Conexão com a Internet**: Necessária para download das dependências

## Instalação Automática (Recomendada)

Para facilitar a instalação, criamos um script automatizado que configura todas as dependências necessárias.

### Passos para Instalação Automática:

1. Certifique-se de que o Node.js está instalado em seu sistema
   - Você pode baixar o Node.js em: [https://nodejs.org/](https://nodejs.org/)
   - Escolha a versão LTS (Long Term Support)

2. Certifique-se de que o MySQL está instalado e configurado
   - Você pode baixar o MySQL em: [https://dev.mysql.com/downloads/installer/](https://dev.mysql.com/downloads/installer/)
   - Durante a instalação, anote o usuário e senha do administrador

3. Faça o download ou clone este repositório para sua máquina local

4. Execute o arquivo `setup-windows.bat` com privilégios de administrador
   - Clique com o botão direito no arquivo e selecione "Executar como administrador"
   - O script verificará se as dependências necessárias estão instaladas e instalará os pacotes do projeto

5. Siga as instruções na tela para concluir a instalação

## Configuração do Banco de Dados

Após a instalação das dependências, você precisará configurar o banco de dados:

1. Crie um arquivo `.env` na pasta `server` com as seguintes informações:

```
DB_HOST=localhost
DB_USER=seu_usuario_mysql
DB_PASSWORD=sua_senha_mysql
DB_NAME=amesgo_db
JWT_SECRET=uma_chave_secreta_para_autenticacao
PORT=5000
```

2. Inicialize o banco de dados executando:

```
cd server
npm run init-db
```

## Iniciando a Aplicação

Após a instalação e configuração, você pode iniciar a aplicação:

1. Para iniciar tanto o servidor quanto o cliente simultaneamente:
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

## Solução de Problemas

Se você encontrar problemas durante a instalação:

1. **Erro de permissão**: Certifique-se de executar o script como administrador
2. **Erro de conexão com o banco de dados**: Verifique se o MySQL está em execução e se as credenciais no arquivo `.env` estão corretas
3. **Erro de porta em uso**: Verifique se as portas 3000 (cliente) e 5000 (servidor) não estão sendo usadas por outros aplicativos

## Suporte

Se precisar de ajuda adicional, entre em contato com a equipe de suporte em [suporte@amesgo.com.br](mailto:suporte@amesgo.com.br) ou abra uma issue no repositório do projeto.

---

© AMESGO SYSTEM - Todos os direitos reservados 