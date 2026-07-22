## 1. Fundação — autorização por criança (access-control)

- [ ] 1.1 Migrations UUID: `children`, `care_links`, `invitations` (índices compostos)
- [ ] 1.2 Modelos `Child`, `CareLink`, `Invitation` + scopes `active`
- [ ] 1.3 Guard `authorize_child!(child_id)` em `controller_helpers.rb` (vínculo ativo)
- [ ] 1.4 Módulo Grape `api/v1/children` (CRUD) + entity `child`; criar cria vínculo
- [ ] 1.5 Módulo `api/v1/care_links` (listar/revogar) + `api/v1/invitations` (criar/aceitar, token único, expiração 7d)
- [ ] 1.6 Log de auditoria append-only para ações sensíveis
- [ ] 1.7 RSpec de request: "sem vínculo, sem acesso"; convite expirado; revogação imediata
- [ ] 1.8 Frontend `features/access`: vínculos, convidar, aceitar convite

## 2. Registro do cotidiano (daily-journal, child-profile, home-today)

- [ ] 2.1 Modelo/migration `DailyRecord` (enum categoria + visibility + state), scope `visible_to`
- [ ] 2.2 Módulo `api/v1/daily_records` (upsert rascunho/concluído, filtro por dia) + entity
- [ ] 2.3 Modelo/migration `LivingProfileEntry` (append-only) + módulo `api/v1/living_entries`
- [ ] 2.4 Foto da criança: upload privado (reusar `uploads`) + `photo_path`
- [ ] 2.5 Endpoint `children#today` compondo resumo do dia (sem IA), excluindo privado
- [ ] 2.6 Portar helpers `formatAge`/`summarizeDay` para o frontend
- [ ] 2.7 Frontend `features/journal` (chips, campos por categoria, autosave), `features/child`, `features/today`
- [ ] 2.8 Vitest: nota privada fora do resumo; campos por categoria; idade natural

## 3. Memória e comunicação (child-timeline, guidance-notebook, family-communication)

- [ ] 3.1 Módulo `api/v1/timeline` (read-only, paginado) agregando registros+observações; privado só p/ autorizado
- [ ] 3.2 Migrations/modelos `GuidanceNote` + `GuidanceAcknowledgement` (unique note+user)
- [ ] 3.3 Módulo `api/v1/guidance_notes` (criar, listar, confirmar leitura) + entity
- [ ] 3.4 Migration/modelo `FamilyMessage` (append-only, author_name snapshot) + módulo `api/v1/family_messages`
- [ ] 3.5 Frontend `features/timeline`, `features/guidance`, `features/board`
- [ ] 3.6 RSpec: append-only (sem update/destroy); confirmação única por usuário

## 4. Saúde e segurança (health-safety)

- [ ] 4.1 Migrations/modelos: `HealthCondition`, `EmergencyContact`, `Medication`, `MedicationAuthorization`, `MedicationAdministration` (append-only, `addendum_of`)
- [ ] 4.2 Validação no modelo: administração exige autorização ativa do guardian (rejeita no backend)
- [ ] 4.3 Módulo `api/v1/health` (condições/contatos/medicamentos/autorização/administração) + entities
- [ ] 4.4 Frontend `features/health`: banner crítico persistente, fluxo de autorização
- [ ] 4.5 RSpec: sem autorização → rejeitado; com autorização → aceito; correção por adendo

## 5. Consentimento e privacidade (consent-privacy)

- [ ] 5.1 Migration/modelo `Consent` (escopos media/reports/automated_features/notifications)
- [ ] 5.2 Módulo `api/v1/consents` (conceder/revogar) — só guardian
- [ ] 5.3 Guards de consentimento nos módulos de mídia, relatório e IA
- [ ] 5.4 Exportação (job) e exclusão de dados da criança
- [ ] 5.5 Frontend: tela de consentimentos com feedback/desabilitar quando não-guardian
- [ ] 5.6 RSpec: mídia sem consentimento → rejeitada; revogação bloqueia novos usos

## 6. IA e relatórios (pedagogical-enrichment, weekly-report) — pago

- [ ] 6.1 Modelo `PedagogicalObservation` (fato/interpretação/continuidade, origin, refs)
- [ ] 6.2 Módulo `api/v1/observations`: criar manual (sem IA) + atualizar/compartilhar
- [ ] 6.3 Serviço `Enrichment::ComposeObservation` (Claude API) em job Sidekiq; prompt sem notas privadas; gate `automated_features`
- [ ] 6.4 Modelo/módulo `weekly_reports`: composição só de conteúdo autorizado, revisão obrigatória, versionado
- [ ] 6.5 Job `WeeklyReport::RenderPdf` (privado, link com expiração); Action Cable "PDF pronto"
- [ ] 6.6 Frontend `features/observations` (form manual + revisão IA) e `features/reports`
- [ ] 6.7 RSpec: baixa confiança em registro curto; nota privada fora do prompt e do PDF

## 7. Administração (schedule-supplies, work-admin)

- [ ] 7.1 Modelos/módulos `calendar_events` + `checklist_items` (baixo estoque, visibility shared)
- [ ] 7.2 Modelos/módulos `work_periods`, `expenses`, `payments` (fluxo pendente→conferido→pago)
- [ ] 7.3 Exportação CSV mensal por vínculo
- [ ] 7.4 Frontend `features/schedule` e `features/work`

## 8. Fechamento

- [ ] 8.1 Traduzir cenários das specs em testes de aceite (RSpec + Vitest) por capability
- [ ] 8.2 CI: lint (rubocop/eslint) + testes verdes; Brakeman/bundler-audit
- [ ] 8.3 Revisão dos invariantes (autorização, privado, não-diagnóstico, append-only, mídia privada)
