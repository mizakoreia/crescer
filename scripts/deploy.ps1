# Deploy das Edge Functions + push. Rode DEPOIS de `supabase login`.
# Uso: pwsh scripts/deploy.ps1 -Ref <project-ref> -AnthropicKey <sk-ant-...>
param(
  [Parameter(Mandatory = $true)][string]$Ref,
  [Parameter(Mandatory = $true)][string]$AnthropicKey
)
$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

Write-Host "→ Linkando projeto $Ref..."
supabase link --project-ref $Ref

Write-Host "→ Cadastrando ANTHROPIC_API_KEY..."
supabase secrets set "ANTHROPIC_API_KEY=$AnthropicKey"

# Schema já foi aplicado colando supabase/schema.sql no SQL Editor (DEPLOY.md passo 2).
Write-Host "→ Deploy das Edge Functions..."
supabase functions deploy enrich-observation
supabase functions deploy weekly-report-pdf
supabase functions deploy export-child-data

Write-Host "→ Push para o GitHub..."
git push -u origin main

Write-Host "Pronto. Configure as env vars no Vercel e faça o deploy do frontend."
