# AMESGO SYSTEM - Script de Instalação para Windows
# Este script configura automaticamente todas as dependências necessárias para o AMESGO SYSTEM

# Função para verificar se está sendo executado como administrador
function Test-Administrator {
    $user = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal $user
    $principal.IsInRole([Security.Principal.WindowsBuiltinRole]::Administrator)
}

# Função para exibir mensagens coloridas
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    else {
        $input | Write-Output
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

# Função para exibir o cabeçalho
function Show-Header {
    Clear-Host
    Write-ColorOutput Green "======================================================================"
    Write-ColorOutput Green "                 AMESGO SYSTEM - CONFIGURAÇÃO AUTOMÁTICA              "
    Write-ColorOutput Green "======================================================================"
    Write-Output ""
}

# Verificar se está sendo executado como administrador
if (-not (Test-Administrator)) {
    Write-ColorOutput Red "Este script precisa ser executado como Administrador."
    Write-ColorOutput Red "Por favor, feche esta janela e execute o PowerShell como Administrador."
    Write-Output ""
    Write-Output "Pressione qualquer tecla para sair..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit
}

# Exibir cabeçalho
Show-Header

# Verificar se o Node.js está instalado
Write-Output "Verificando se o Node.js está instalado..."
try {
    $nodeVersion = node --version
    Write-ColorOutput Green "Node.js encontrado! Versão: $nodeVersion"
}
catch {
    Write-ColorOutput Red "Node.js não encontrado! Por favor, instale o Node.js antes de continuar."
    Write-Output "Você pode baixar o Node.js em: https://nodejs.org/"
    Write-Output "Recomendamos a versão LTS (Suporte de Longo Prazo)."
    Write-Output ""
    Write-Output "Pressione qualquer tecla para sair..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit
}

# Verificar se o npm está instalado
Write-Output ""
Write-Output "Verificando se o npm está instalado..."
try {
    $npmVersion = npm --version
    Write-ColorOutput Green "npm encontrado! Versão: $npmVersion"
}
catch {
    Write-ColorOutput Red "npm não encontrado! Por favor, reinstale o Node.js."
    Write-Output ""
    Write-Output "Pressione qualquer tecla para sair..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit
}

# Menu de opções
function Show-Menu {
    Write-Output ""
    Write-ColorOutput Cyan "Selecione uma opção de instalação:"
    Write-Output "1. Instalação completa (recomendado)"
    Write-Output "2. Instalar apenas dependências globais"
    Write-Output "3. Instalar apenas dependências do projeto principal"
    Write-Output "4. Instalar apenas dependências do servidor"
    Write-Output "5. Instalar apenas dependências do cliente"
    Write-Output "6. Verificar requisitos do sistema"
    Write-Output "7. Sair"
    Write-Output ""
    $option = Read-Host "Digite o número da opção desejada"
    return $option
}

# Função para instalar dependências globais
function Install-GlobalDependencies {
    Write-Output ""
    Write-Output "Instalando dependências globais necessárias..."
    try {
        npm install -g concurrently nodemon typescript ts-node
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput Green "Dependências globais instaladas com sucesso!"
        }
        else {
            Write-ColorOutput Red "Falha ao instalar dependências globais."
            return $false
        }
    }
    catch {
        Write-ColorOutput Red "Erro ao instalar dependências globais: $_"
        return $false
    }
    return $true
}

# Função para instalar dependências do projeto principal
function Install-MainDependencies {
    Write-Output ""
    Write-Output "Instalando dependências do projeto principal..."
    try {
        npm install
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput Green "Dependências do projeto principal instaladas com sucesso!"
        }
        else {
            Write-ColorOutput Red "Falha ao instalar dependências do projeto principal."
            return $false
        }
    }
    catch {
        Write-ColorOutput Red "Erro ao instalar dependências do projeto principal: $_"
        return $false
    }
    return $true
}

# Função para instalar dependências do servidor
function Install-ServerDependencies {
    Write-Output ""
    Write-Output "Instalando dependências do servidor..."
    try {
        Push-Location -Path "server"
        npm install
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput Green "Dependências do servidor instaladas com sucesso!"
            Pop-Location
        }
        else {
            Write-ColorOutput Red "Falha ao instalar dependências do servidor."
            Pop-Location
            return $false
        }
    }
    catch {
        Write-ColorOutput Red "Erro ao instalar dependências do servidor: $_"
        if ((Get-Location).Path -like "*server") {
            Pop-Location
        }
        return $false
    }
    return $true
}

# Função para instalar dependências do cliente
function Install-ClientDependencies {
    Write-Output ""
    Write-Output "Instalando dependências do cliente..."
    try {
        Push-Location -Path "client"
        npm install
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput Green "Dependências do cliente instaladas com sucesso!"
            Pop-Location
        }
        else {
            Write-ColorOutput Red "Falha ao instalar dependências do cliente."
            Pop-Location
            return $false
        }
    }
    catch {
        Write-ColorOutput Red "Erro ao instalar dependências do cliente: $_"
        if ((Get-Location).Path -like "*client") {
            Pop-Location
        }
        return $false
    }
    return $true
}

# Função para verificar requisitos do sistema
function Check-SystemRequirements {
    Show-Header
    Write-ColorOutput Cyan "VERIFICAÇÃO DE REQUISITOS DO SISTEMA"
    Write-Output ""
    
    # Verificar Node.js
    Write-Output "Verificando Node.js..."
    try {
        $nodeVersion = node --version
        Write-ColorOutput Green "✓ Node.js encontrado! Versão: $nodeVersion"
    }
    catch {
        Write-ColorOutput Red "✗ Node.js não encontrado!"
    }
    
    # Verificar npm
    Write-Output ""
    Write-Output "Verificando npm..."
    try {
        $npmVersion = npm --version
        Write-ColorOutput Green "✓ npm encontrado! Versão: $npmVersion"
    }
    catch {
        Write-ColorOutput Red "✗ npm não encontrado!"
    }
    
    # Verificar MySQL
    Write-Output ""
    Write-Output "Verificando MySQL..."
    try {
        $mysqlPath = (Get-Command mysql -ErrorAction SilentlyContinue).Source
        if ($mysqlPath) {
            $mysqlVersion = & mysql --version
            Write-ColorOutput Green "✓ MySQL encontrado! Versão: $mysqlVersion"
        }
        else {
            Write-ColorOutput Yellow "! MySQL não encontrado no PATH do sistema."
            # Tentar encontrar em locais comuns
            $commonPaths = @(
                "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe",
                "C:\Program Files (x86)\MySQL\MySQL Server 8.0\bin\mysql.exe",
                "C:\xampp\mysql\bin\mysql.exe"
            )
            
            $found = $false
            foreach ($path in $commonPaths) {
                if (Test-Path $path) {
                    Write-ColorOutput Yellow "  Porém, MySQL foi encontrado em: $path"
                    Write-ColorOutput Yellow "  Considere adicionar este diretório ao PATH do sistema."
                    $found = $true
                    break
                }
            }
            
            if (-not $found) {
                Write-ColorOutput Red "✗ MySQL não encontrado! Por favor, instale o MySQL."
            }
        }
    }
    catch {
        Write-ColorOutput Red "✗ Erro ao verificar MySQL: $_"
    }
    
    # Verificar espaço em disco
    Write-Output ""
    Write-Output "Verificando espaço em disco..."
    $drive = (Get-Location).Drive
    $freeSpace = (Get-PSDrive $drive.Name).Free / 1GB
    if ($freeSpace -ge 1) {
        Write-ColorOutput Green "✓ Espaço em disco suficiente: $([math]::Round($freeSpace, 2)) GB livre"
    }
    else {
        Write-ColorOutput Red "✗ Espaço em disco insuficiente: $([math]::Round($freeSpace, 2)) GB livre (mínimo recomendado: 1 GB)"
    }
    
    # Verificar memória RAM
    Write-Output ""
    Write-Output "Verificando memória RAM..."
    $totalMemory = (Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory / 1GB
    if ($totalMemory -ge 4) {
        Write-ColorOutput Green "✓ Memória RAM suficiente: $([math]::Round($totalMemory, 2)) GB"
    }
    elseif ($totalMemory -ge 2) {
        Write-ColorOutput Yellow "! Memória RAM abaixo do recomendado: $([math]::Round($totalMemory, 2)) GB (recomendado: 4 GB ou mais)"
    }
    else {
        Write-ColorOutput Red "✗ Memória RAM insuficiente: $([math]::Round($totalMemory, 2)) GB (mínimo recomendado: 4 GB)"
    }
    
    # Verificar conexão com a internet
    Write-Output ""
    Write-Output "Verificando conexão com a internet..."
    try {
        $connection = Test-Connection -ComputerName www.google.com -Count 1 -Quiet
        if ($connection) {
            Write-ColorOutput Green "✓ Conexão com a internet disponível"
        }
        else {
            Write-ColorOutput Red "✗ Sem conexão com a internet"
        }
    }
    catch {
        Write-ColorOutput Red "✗ Erro ao verificar conexão com a internet: $_"
    }
    
    Write-Output ""
    Write-Output "Pressione qualquer tecla para voltar ao menu principal..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

# Função para exibir mensagem de conclusão
function Show-CompletionMessage {
    Show-Header
    Write-ColorOutput Green "INSTALAÇÃO CONCLUÍDA COM SUCESSO!"
    Write-Output ""
    Write-Output "Para iniciar o servidor de desenvolvimento, execute:"
    Write-ColorOutput Cyan "    npm run dev"
    Write-Output ""
    Write-Output "Para iniciar apenas o servidor backend:"
    Write-ColorOutput Cyan "    npm run server"
    Write-Output ""
    Write-Output "Para iniciar apenas o cliente frontend:"
    Write-ColorOutput Cyan "    npm run client"
    Write-Output ""
    Write-Output "Para inicializar o banco de dados (se necessário):"
    Write-ColorOutput Cyan "    cd server"
    Write-ColorOutput Cyan "    npm run init-db"
    Write-Output ""
    Write-ColorOutput Yellow "IMPORTANTE: Não se esqueça de configurar o arquivo .env na pasta server"
    Write-ColorOutput Yellow "            com as credenciais do seu banco de dados MySQL."
    Write-Output ""
    Write-Output "Obrigado por usar o AMESGO SYSTEM!"
    Write-Output ""
    Write-Output "Pressione qualquer tecla para sair..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

# Loop principal
$exit = $false
while (-not $exit) {
    Show-Header
    $option = Show-Menu
    
    switch ($option) {
        "1" {
            # Instalação completa
            $success = $true
            $success = $success -and (Install-GlobalDependencies)
            $success = $success -and (Install-MainDependencies)
            $success = $success -and (Install-ServerDependencies)
            $success = $success -and (Install-ClientDependencies)
            
            if ($success) {
                Show-CompletionMessage
                $exit = $true
            }
            else {
                Write-ColorOutput Red "Ocorreram erros durante a instalação. Verifique as mensagens acima."
                Write-Output ""
                Write-Output "Pressione qualquer tecla para voltar ao menu principal..."
                $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
            }
        }
        "2" {
            # Instalar apenas dependências globais
            Install-GlobalDependencies
            Write-Output ""
            Write-Output "Pressione qualquer tecla para voltar ao menu principal..."
            $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        }
        "3" {
            # Instalar apenas dependências do projeto principal
            Install-MainDependencies
            Write-Output ""
            Write-Output "Pressione qualquer tecla para voltar ao menu principal..."
            $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        }
        "4" {
            # Instalar apenas dependências do servidor
            Install-ServerDependencies
            Write-Output ""
            Write-Output "Pressione qualquer tecla para voltar ao menu principal..."
            $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        }
        "5" {
            # Instalar apenas dependências do cliente
            Install-ClientDependencies
            Write-Output ""
            Write-Output "Pressione qualquer tecla para voltar ao menu principal..."
            $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        }
        "6" {
            # Verificar requisitos do sistema
            Check-SystemRequirements
        }
        "7" {
            # Sair
            $exit = $true
        }
        default {
            Write-ColorOutput Red "Opção inválida. Por favor, tente novamente."
            Write-Output ""
            Write-Output "Pressione qualquer tecla para continuar..."
            $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        }
    }
} 