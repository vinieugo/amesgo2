@echo off
echo ===================================================
echo      AMESGO SYSTEM - CONFIGURACAO AUTOMATICA
echo ===================================================
echo.

echo Verificando se o Node.js esta instalado...
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Node.js nao encontrado! Por favor, instale o Node.js antes de continuar.
    echo Voce pode baixar o Node.js em: https://nodejs.org/
    echo Recomendamos a versao LTS (Suporte de Longo Prazo).
    pause
    exit /b 1
)

echo Node.js encontrado!
echo Versao do Node.js:
node --version
echo.

echo Verificando se o npm esta instalado...
where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo npm nao encontrado! Por favor, reinstale o Node.js.
    pause
    exit /b 1
)

echo npm encontrado!
echo Versao do npm:
npm --version
echo.

echo Instalando dependencias globais necessarias...
call npm install -g concurrently nodemon typescript ts-node
if %ERRORLEVEL% neq 0 (
    echo Falha ao instalar dependencias globais.
    pause
    exit /b 1
)
echo Dependencias globais instaladas com sucesso!
echo.

echo Instalando dependencias do projeto principal...
call npm install
if %ERRORLEVEL% neq 0 (
    echo Falha ao instalar dependencias do projeto principal.
    pause
    exit /b 1
)
echo Dependencias do projeto principal instaladas com sucesso!
echo.

echo Instalando dependencias do servidor...
cd server
call npm install
if %ERRORLEVEL% neq 0 (
    echo Falha ao instalar dependencias do servidor.
    cd ..
    pause
    exit /b 1
)
cd ..
echo Dependencias do servidor instaladas com sucesso!
echo.

echo Instalando dependencias do cliente...
cd client
call npm install
if %ERRORLEVEL% neq 0 (
    echo Falha ao instalar dependencias do cliente.
    cd ..
    pause
    exit /b 1
)
cd ..
echo Dependencias do cliente instaladas com sucesso!
echo.

echo Verificando se o MySQL esta instalado...
where mysql >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo AVISO: MySQL nao encontrado no PATH do sistema.
    echo Por favor, certifique-se de que o MySQL esta instalado e configurado.
    echo Voce pode baixar o MySQL em: https://dev.mysql.com/downloads/installer/
    echo.
    echo NOTA: Este script nao configura o banco de dados automaticamente.
    echo Voce precisara configurar o banco de dados manualmente conforme a documentacao.
) else (
    echo MySQL encontrado!
    echo Versao do MySQL:
    mysql --version
)
echo.

echo ===================================================
echo      INSTALACAO CONCLUIDA COM SUCESSO!
echo ===================================================
echo.
echo Para iniciar o servidor de desenvolvimento, execute:
echo     npm run dev
echo.
echo Para iniciar apenas o servidor backend:
echo     npm run server
echo.
echo Para iniciar apenas o cliente frontend:
echo     npm run client
echo.
echo Para inicializar o banco de dados (se necessario):
echo     cd server
echo     npm run init-db
echo.
echo Obrigado por usar o AMESGO SYSTEM!
echo.
pause 