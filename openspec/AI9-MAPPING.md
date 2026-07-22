# Mapeamento: specs do Crescer → template AI9

Guia de reconstrução. As specs (`openspec/specs/`) definem o COMPORTAMENTO; este
documento mapeia cada capability para a estrutura do AI9 (Rails 8 API-only + Grape
+ React/Vite). Fonte: `mizakoreia/ai9` (`.agent/rules/`, `backend/app`, `frontend/src`).

## 0. Decisão arquitetural — autorização

O AI9 tem permissões em nível de **usuário** (`Permission` + `UserPermission`,
estilo plano/feature-flag, escopo global). O Crescer exige autorização em nível de
**recurso** (por criança). São camadas distintas e complementares:

- **Mantém do AI9:** JWT (devise-jwt), `UserPermission` para gating de plano/feature
  (ex.: acesso à IA por assinatura), `PermissionAuditLog`.
- **Adiciona (novo):** modelo `CareLink` (child_id, user_id, role: professional|guardian,
  revoked_at, expires_at) + um **guard Grape** `authorize_child!(child_id)` em
  `controller_helpers.rb` que exige vínculo ativo em TODA rota de dados de criança.
  Substitui o papel que o RLS do Supabase fazia. A autorização é server-side; a UI
  nunca é a barreira.
- **Visibilidade por conteúdo:** enum `visibility` (private_professional |
  shareable_after_review | shared | critical_care | administrative) em cada modelo
  de conteúdo; os scopes ActiveRecord filtram no servidor (ex.:
  `DailyRecord.visible_to(user, child)`).

## 1. Módulos Grape (backend/app/controllers/api/v1)

Seguindo o padrão de `users.rb`/`leads.rb`, montados em `api/root.rb`. Cada um com
Entity de resposta em `api/entities/`.

| Spec (capability) | Módulo Grape `/api/v1/*` | Modelos ActiveRecord | Entities |
|---|---|---|---|
| access-control | `children`, `care_links`, `invitations` | Child, CareLink, Invitation, User(existe) | child, care_link, invitation |
| consent-privacy | `consents`, `exports` | Consent, DataExport (job) | consent |
| child-profile | `children`, `living_entries` | Child, LivingProfileEntry | child, living_entry |
| home-today | (composição no `children#today`) | — (agrega DailyRecord/Observation) | day_summary |
| daily-journal | `daily_records` | DailyRecord | daily_record |
| child-timeline | `timeline` (read-only, pagina) | agrega DailyRecord+Observation+Media | timeline_item |
| pedagogical-enrichment | `observations` | PedagogicalObservation | observation |
| health-safety | `health` (conditions/meds/admin/contacts) | HealthCondition, Medication, MedicationAuthorization, MedicationAdministration, EmergencyContact | health_* |
| guidance-notebook | `guidance_notes` | GuidanceNote, GuidanceAcknowledgement | guidance_note |
| family-communication | `family_messages` | FamilyMessage | family_message |
| schedule-supplies | `calendar_events`, `checklist_items` | CalendarEvent, ChecklistItem | event, checklist_item |
| weekly-report | `weekly_reports` | WeeklyReport | weekly_report |
| work-admin | `work_periods`, `expenses`, `payments` | WorkPeriod, Expense, Payment | work_* |

### Regras de domínio → onde no backend
- **Medicamento só com autorização ativa** (health-safety): validação no model
  `MedicationAdministration` (ActiveRecord `validate` que checa
  `MedicationAuthorization.active`) + `before_create` — nunca só na UI. Equivale
  ao trigger `require_active_med_auth`.
- **Append-only** (medicação, mural, perfil vivo, auditoria): sem rotas
  update/destroy nesses módulos; correção por adendo (`addendum_of`).
- **Notas privadas nunca vazam:** scope de composição (weekly-report, home-today,
  timeline, prompt de IA) exclui `private_professional` no servidor.
- **Consentimento:** `before_action`/guard nos módulos `media`, `weekly_reports`
  (reports), IA (`automated_features`) checando `Consent.active(child, scope)`.

## 2. IA (pedagogical-enrichment / weekly-report PDF)

- Serviço `Enrichment::ComposeObservation` (em `app/services/`) chama a Claude API
  (claude-sonnet-5) via Faraday; roda em **Sidekiq job** (assíncrono), não no request.
- Gate por consentimento `automated_features` + plano (`UserPermission`).
- PDF do relatório: job Sidekiq (ex.: `WeeklyReport::RenderPdf`) → armazena privado,
  devolve link com expiração. Realtime opcional via Action Cable ("PDF pronto").
- Prompt montado só com conteúdo compartilhável + faixa etária + interesses.

## 3. Frontend (frontend/src) — React + Vite + React Query

Padrão `features/<domínio>` (como `features/auth`), `lib/api/endpoints.ts` (contratos
TS gerados do Swagger via `openapi-typescript`), estado servidor no React Query,
Tailwind + shadcn/ui, i18n pt-BR, temas dark/light, a11y AA+.

| Spec | Feature / página | Notas |
|---|---|---|
| home-today | `features/today` → página inicial | foto/idade, resumo do dia, descobertas, CTA "Registrar momento" |
| daily-journal | `features/journal` | chips de categoria, campos por categoria, autosave (mutation debounced) |
| child-timeline | `features/timeline` | lista paginada agrupada por dia |
| pedagogical-enrichment | `features/observations` | form manual (fato/interpretação/continuidade) + revisão da narrativa IA |
| child-profile | `features/child` | cadastro, perfil vivo, upload de foto |
| health-safety | `features/health` | banner crítico persistente, fluxo de autorização de medicamento |
| guidance-notebook | `features/guidance` | seções, importante, confirmar leitura |
| family-communication | `features/board` | mural append-only |
| schedule-supplies | `features/schedule` | agenda + checklist |
| weekly-report | `features/reports` | composição, revisão, gerar PDF |
| work-admin | `features/work` | períodos, despesas, exportação CSV |
| access-control / consent-privacy | `features/access` | vínculos, convites, consentimentos, exportar/excluir |

- **Idade em linguagem natural** e **resumo do dia**: helpers puros no frontend
  (portar `src/format.ts` do protótipo: `formatAge`, `summarizeDay`).
- **Realtime** (opcional): `useBoardChannel`, `useReportChannel` (Action Cable JS).
- **UX de gating de consentimento:** desabilitar/ocultar ações quando o escopo não
  está ativo, com feedback (o protótipo tinha esse gap na tela de Consentimentos).

## 4. Ordem de reconstrução sugerida

1. **Fundação:** User/JWT (já no AI9) + `CareLink` + guard `authorize_child!` +
   `Child` + convites/aceite. (access-control)
2. **Núcleo de registro:** daily-journal + child-profile + home-today (composição
   sem IA). Portar `format.ts`.
3. **Memória/comunicação:** child-timeline + guidance-notebook + family-communication.
   Tudo sem IA — valida o produto barato.
4. **Saúde:** health-safety com as travas de autorização de medicamento.
5. **Consentimento & privacidade:** consents + export/delete + gates.
6. **IA (pago):** pedagogical-enrichment + weekly-report (jobs Sidekiq).
7. **Admin:** schedule-supplies + work-admin.

## 5. Invariantes a preservar (valem em qualquer módulo)
- Autorização server-side por vínculo ativo; UI nunca é a barreira.
- Notas privadas fora de família, PDFs, notificações e prompts de IA.
- Linguagem pedagógica hipotética, nunca diagnóstica/comparativa.
- Críticos append-only; correção por adendo.
- Mídia privada por padrão; exige consentimento; nunca para treino de IA sem consentimento.
- Erros no envelope padrão do AI9 `{ error: { code, message, details } }`; paginação `page`/`per_page`.
