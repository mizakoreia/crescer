# Crescer

App mobile-first (PT-BR) para babás/cuidadores e educadores da primeira infância: diário de cuidado, documentação pedagógica, comunicação com famílias e gestão profissional. Privacidade infantil por padrão (LGPD), linguagem nunca diagnóstica.

Spec de produto: Notion "Crescer — Especificação do Produto" (6 docs: PRD, UX, Pedagogia/IA, Dados/Privacidade, Roadmap, Decisões).

## Stack

- Expo (React Native + TypeScript), Expo Router — abas Hoje / Diário / História / Agenda / Trabalho
- Redux Toolkit + RTK Query
- Supabase: Postgres (RLS por vínculo), Auth, Storage, Edge Functions
- IA (RF-09): Edge Function → Claude API (claude-sonnet-5)

## Convenções

- Autorização SEMPRE no banco (RLS via care_links), nunca só na UI.
- Visibilidade explícita por conteúdo: private_professional | shareable_after_review | shared | critical_care | administrative.
- Notas privadas nunca saem: fora de queries de família, PDFs, notificações, prompts de IA.
- Linguagem hipotética em conteúdo pedagógico: "pode favorecer", nunca diagnóstico/comparação.
- Registros críticos (medicamentos, auditoria) append-only; correção por adendo.

## Estrutura

- `openspec/specs/` — uma spec por capability (estado desejado)
- `openspec/changes/` — propostas de mudança em andamento
- `app/` — rotas Expo Router
- `src/` — componentes, store, api, tokens
- `supabase/` — migrações, edge functions
