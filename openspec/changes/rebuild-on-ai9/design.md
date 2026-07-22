## Context

O comportamento está fixado nas 13 specs de `openspec/specs/`. O alvo é o template
AI9 (Rails 8 API-only + Grape + JWT/RBAC + Sidekiq + Action Cable; React + Vite +
React Query + Zustand + Tailwind). O mapeamento detalhado (spec → módulo Grape /
modelo / entity / feature React) está em `openspec/AI9-MAPPING.md` e é a referência
de execução deste change. O AI9 já traz User/JWT, `UserPermission` (RBAC de plano),
`PermissionAuditLog`, uploads, e o padrão de módulos `api/v1/*` + `api/entities/*`.

## Goals / Non-Goals

**Goals:**
- Reimplementar as 13 capabilities sem alterar comportamento.
- Autorização server-side por criança, sobre o RBAC de usuário do AI9.
- Regras de segurança/integridade ancoradas no backend (não na UI).
- Reaproveitar padrões do AI9 (Grape entities, envelope de erro, paginação, i18n,
  temas, jobs Sidekiq, Action Cable).

**Non-Goals:**
- Novas funcionalidades ou mudança de requisitos (sem delta de spec).
- Migração de dados do protótipo Supabase (parte-se de banco novo).
- Fases futuras fora das specs (álbum, portfólio, equipes/escolas).

## Decisions

- **Autorização por recurso (`CareLink`).** Modelo `CareLink(child_id, user_id,
  role: professional|guardian, revoked_at, expires_at)`. Guard Grape
  `authorize_child!(child_id)` em `controller_helpers.rb`, chamado em toda rota de
  dados de criança; exige vínculo ativo. Substitui o RLS do Supabase. O
  `UserPermission` do AI9 segue para gating de plano/feature (ex.: IA por assinatura).
- **Visibilidade no servidor.** Enum `visibility` por conteúdo + scopes
  ActiveRecord (`visible_to(user, child)`) que filtram antes de serializar. Notas
  `private_professional` nunca entram em composições (home-today, timeline,
  weekly-report) nem em prompts de IA.
- **Regras críticas no modelo.** Autorização de medicamento validada em
  `MedicationAdministration` (checa `MedicationAuthorization.active`) — equivale ao
  trigger antigo. Medicação/mural/perfil vivo/auditoria append-only: sem rotas
  update/destroy; correção por adendo (`addendum_of`).
- **IA e PDF assíncronos.** Serviços em `app/services/` chamando Claude API via
  Faraday, executados em jobs Sidekiq; resultado por Action Cable/polling. Gate por
  consentimento `automated_features` + plano.
- **Contratos.** Grape entities como contrato de resposta; erros no envelope
  `{ error: { code, message, details } }`; paginação `page`/`per_page`. Frontend
  gera tipos TS do Swagger (`openapi-typescript`).
- **Frontend.** Uma `features/<domínio>` por capability; React Query (server-state),
  Zustand (client-state), Tailwind + shadcn/ui, i18n pt-BR, temas dark/light, a11y
  AA+. Portar helpers puros `formatAge`/`summarizeDay` do protótipo.
- **Ordem de construção.** fundação (CareLink+guard+Child+convites) → registro
  (journal/profile/today) → memória/comunicação (timeline/caderno/mural) → saúde →
  consentimento/privacidade → IA (paga) → admin.

## Risks / Trade-offs

- **Dupla camada de autorização** (UserPermission + CareLink) adiciona
  complexidade; mitigação: guard único e testado, com testes de request cobrindo
  "sem vínculo, sem acesso" em cada módulo.
- **Sem RLS** significa que qualquer rota nova sem o guard vaza dados; mitigação:
  guard obrigatório por convenção + teste de contrato por módulo.
- **Custo de IA** (Claude API) é pago por uso; mitigação: fase tardia, atrás de
  consentimento + plano, com observação manual cobrindo o caso grátis.
- **Reescrita completa** tem risco de regressão de invariantes; mitigação: os
  cenários das specs viram testes de aceite (RSpec no backend, Vitest no frontend).
