# Crescer

App mobile-first (PT-BR) para babás, cuidadores e educadores da primeira infância: diário de cuidado, documentação pedagógica com IA, comunicação com famílias e gestão profissional. Privacidade infantil por padrão (LGPD).

Especificação completa: `openspec/` (uma spec por capability, convenção OpenSpec).

## Stack

- **App**: Expo (React Native + TypeScript), Expo Router — abas Hoje / Diário / História / Agenda / Trabalho
- **Estado**: Redux Toolkit + RTK Query
- **Backend**: Supabase — Postgres com RLS por vínculo (`care_links`), Auth, Storage, Edge Functions
- **IA (RF-09)**: Edge Function `enrich-observation` → Claude API (`claude-sonnet-5`)

## Setup

Pré-requisitos: Node 20+, Docker (para Supabase local), Supabase CLI.

```sh
npm install --legacy-peer-deps

# backend local
supabase start                 # sobe Postgres + aplica supabase/migrations/
supabase functions serve       # edge functions (exige ANTHROPIC_API_KEY no .env)

# app (as variáveis apontam para o Supabase local por padrão)
# EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY para apontar a outro projeto
npm start
```

Secrets das Edge Functions (`supabase/functions/.env` local ou `supabase secrets set` em produção):

```
ANTHROPIC_API_KEY=sk-ant-...
```

## Segurança (fundação)

- **Toda autorização vive no banco** (RLS): sem `care_link` ativo, zero linhas. Revogação tem efeito imediato.
- **Notas privadas** (`visibility = private_professional`) nunca chegam à família, a resumos, PDFs ou prompts de IA — filtradas por RLS e por filtro explícito na Edge Function.
- **Medicamento sem autorização ativa** é rejeitado por trigger no banco, não só na UI.
- Administrações e auditoria são **append-only**; correção por adendo.
- IA: gate de consentimento `automated_features`, saída sempre rascunho com revisão humana, linguagem "pode favorecer" (nunca diagnóstica), rastreável aos registros de origem.

## Verificação

```sh
npx tsc --noEmit                                   # typecheck

# testes de autorização (exigem stack local rodando):
supabase db reset
psql "$DATABASE_URL" -f supabase/tests/rls_test.sql   # imprime "RLS TESTS OK"
```

Fluxo E2E manual: criar conta → Nova criança → Convidar responsável (código) → segunda conta aceita e configura consentimentos → registrar dia no Diário → ✨ Enriquecer → revisar narrativa → Resumo semanal → Revisar e compartilhar → Gerar PDF.

## Fora do MVP (fases futuras da spec)

Linha do tempo multimídia, biblioteca editorial de atividades, pagamentos integrados, equipes/escolas.
