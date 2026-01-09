# Script de Deploy Automático - Aceita tudo automaticamente
# Uso: .\deploy-auto.ps1 "Mensagem do commit"

param(
    [string]$commitMessage = "Auto: Atualização automática"
)

# Configurar git para não pedir confirmações
$env:GIT_MERGE_AUTOEDIT = "no"
git config --global merge.commit no
git config --global merge.ff only
git config --global pull.rebase false
git config --global push.default simple
git config --global core.autocrlf true

Write-Host "🚀 Iniciando deploy automático..." -ForegroundColor Cyan

# Navegar para a pasta do dashboard
Set-Location dashboard

# Build
Write-Host "📦 Executando build..." -ForegroundColor Yellow
$buildOutput = npm run build 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build falhou! Abortando deploy." -ForegroundColor Red
    Write-Host $buildOutput
    Set-Location ..
    exit 1
}

Write-Host "✅ Build concluído com sucesso!" -ForegroundColor Green

# Voltar para a raiz
Set-Location ..

# Git operations - Tudo automático, sem perguntar
Write-Host "📤 Enviando para o GitHub..." -ForegroundColor Yellow

# Adicionar tudo (aceita automaticamente)
git add -A

# Commit (sem perguntar)
git commit --no-verify -m $commitMessage

# Push (sem perguntar, aceita tudo)
git push --no-verify

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Código enviado para o GitHub com sucesso!" -ForegroundColor Green
    Write-Host "🔄 A Vercel iniciará a atualização em instantes." -ForegroundColor Cyan
} else {
    Write-Host "❌ Erro ao enviar para o GitHub. Verifique o status do repositório." -ForegroundColor Red
    git status
    exit 1
}
