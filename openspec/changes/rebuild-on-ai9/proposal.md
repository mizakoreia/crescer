## Why

O comportamento do Crescer está validado e especificado (13 capabilities em
`openspec/specs/`), mas o protótipo roda em Expo + Supabase (RLS). A decisão é
reconstruir o produto sobre o template padronizado **AI9** (`mizakoreia/ai9`:
Rails 8 API-only + Grape + JWT/RBAC + Sidekiq + Action Cable; React 18 + Vite +
React Query + Zustand + Tailwind), ganhando as convenções, segurança e CI/CD do
template. Esta é uma mudança de **implementação** — o comportamento não muda.

## What Changes

- Reimplementar as 13 capabilities existentes sobre o AI9, seguindo o mapeamento
  em `openspec/AI9-MAPPING.md`.
- **BREAKING (infra, não comportamento):** autorização sai do RLS do Postgres
  para o servidor de aplicação. Novo modelo `CareLink` + guard Grape
  `authorize_child!(child_id)` aplicado a toda rota de dados de criança, sobre o
  RBAC de usuário já existente no AI9 (`UserPermission`).
- Backend: um módulo Grape `/api/v1/*` por capability + modelos ActiveRecord
  (UUID) + Entities de resposta; regras críticas (medicamento com autorização,
  append-only, exclusão de notas privadas) ancoradas no backend.
- Frontend: uma `features/<domínio>` por capability, React Query + contratos TS
  gerados do Swagger; portar helpers puros (`formatAge`, `summarizeDay`).
- IA e PDF via serviços + jobs Sidekiq (assíncronos), com gate de consentimento.
- Sem alteração de requisitos: nenhuma capability nova nem delta de spec.

## Capabilities

### New Capabilities
<!-- Nenhuma. As 13 capabilities já existem em openspec/specs/ e permanecem a fonte da verdade de comportamento. -->

### Modified Capabilities
<!-- Nenhuma. Reconstrução preserva o comportamento; não há mudança de requisito, logo sem delta de spec. -->

## Impact

- **Repositório alvo:** `mizakoreia/ai9` (backend/ + frontend/). O repo `crescer`
  passa a hospedar as specs e este plano.
- **Backend:** novos modelos (Child, CareLink, Invitation, Consent, DailyRecord,
  LivingProfileEntry, PedagogicalObservation, Health*, GuidanceNote/Ack,
  FamilyMessage, CalendarEvent, ChecklistItem, WeeklyReport, Work*/Expense/Payment)
  + módulos Grape correspondentes + guard de autorização por criança.
- **Frontend:** novas features React; i18n pt-BR, temas dark/light, a11y AA+.
- **Integrações:** Claude API (IA) via serviço server-side; storage privado p/ mídia.
- **Invariantes preservados:** autorização server-side por vínculo, notas privadas
  nunca vazam, linguagem não-diagnóstica, críticos append-only, mídia privada por
  padrão.
