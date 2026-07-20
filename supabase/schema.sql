-- Crescer — schema inicial + RLS
-- Autorização inteira no banco: care_links + RLS. UI nunca é a barreira.

create type visibility as enum ('private_professional','shareable_after_review','shared','critical_care','administrative');
create type link_role as enum ('professional','guardian');
create type record_state as enum ('draft','done','shared');
create type consent_scope as enum ('media','reports','automated_features','notifications');

-- ── Identidade ────────────────────────────────────────────────
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table children (
  id uuid primary key default gen_random_uuid(),
  name text not null,                -- nome social ou apelido
  birthdate date not null,
  pronoun text,
  photo_path text,
  routine_notes text,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

create table care_links (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references children(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role link_role not null,
  invited_by uuid references profiles(id),
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  unique (child_id, user_id)
);

create table invitations (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references children(id) on delete cascade,
  token uuid not null unique default gen_random_uuid(),
  role link_role not null default 'guardian',
  email text,
  invited_by uuid not null references profiles(id),
  expires_at timestamptz not null default now() + interval '7 days',
  accepted_at timestamptz,
  accepted_by uuid references profiles(id)
);

create table consents (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references children(id) on delete cascade,
  guardian_id uuid not null references profiles(id),
  scope consent_scope not null,
  text_version text not null,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz
);

-- ── Helpers de autorização ────────────────────────────────────
create function has_active_link(cid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from care_links
    where child_id = cid and user_id = auth.uid()
      and revoked_at is null
      and (expires_at is null or expires_at > now())
  );
$$;

create function has_role_link(cid uuid, r link_role) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from care_links
    where child_id = cid and user_id = auth.uid() and role = r
      and revoked_at is null
      and (expires_at is null or expires_at > now())
  );
$$;

create function has_consent(cid uuid, s consent_scope) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from consents
    where child_id = cid and scope = s and revoked_at is null
  );
$$;

-- ── Registros ─────────────────────────────────────────────────
create table daily_records (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references children(id) on delete cascade,
  author_id uuid not null references profiles(id),
  category text not null check (category in
    ('alimentacao','sono','higiene','atividade','passeio','leitura','saude','observacao')),
  occurred_at timestamptz not null default now(),
  duration_min int,
  amount_text text,
  note text,
  tags text[] not null default '{}',
  visibility visibility not null default 'shareable_after_review'
    check (visibility in ('private_professional','shareable_after_review','shared')),
  state record_state not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table living_profile_entries (  -- append-only: histórico do perfil vivo
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references children(id) on delete cascade,
  author_id uuid not null references profiles(id),
  section text not null check (section in
    ('personalidade','preferencias','temperamento','interesses','comunicacao','habilidades','desafios','conquistas')),
  content text not null,
  created_at timestamptz not null default now()
);

create table pedagogical_observations (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references children(id) on delete cascade,
  author_id uuid not null references profiles(id),
  fact text not null,                  -- observado, factual
  context text,
  interpretation text,                 -- leitura pedagógica, marcada como interpretação
  domains text[] not null default '{}',
  continuity text,                     -- convite ao brincar
  origin text not null default 'manual' check (origin in ('manual','assisted')),
  source_record_ids uuid[] not null default '{}',  -- rastreabilidade RF-09
  low_confidence boolean not null default false,
  review_state record_state not null default 'draft',
  created_at timestamptz not null default now()
);

-- ── Saúde (critical_care) ─────────────────────────────────────
create table health_conditions (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references children(id) on delete cascade,
  kind text not null check (kind in ('alergia','restricao')),
  name text not null,
  severity text not null default 'moderada' check (severity in ('leve','moderada','critica')),
  instruction text,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

create table emergency_contacts (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references children(id) on delete cascade,
  name text not null,
  relation text,
  phone text not null
);

create table medications (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references children(id) on delete cascade,
  name text not null,
  dose text not null,
  schedule text not null,
  instruction text,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

create table medication_authorizations (
  id uuid primary key default gen_random_uuid(),
  medication_id uuid not null references medications(id) on delete cascade,
  guardian_id uuid not null references profiles(id),
  granted_at timestamptz not null default now(),
  revoked_at timestamptz
);

create table medication_administrations (  -- append-only, correção por adendo
  id uuid primary key default gen_random_uuid(),
  medication_id uuid not null references medications(id),
  child_id uuid not null references children(id) on delete cascade,
  given_by uuid not null references profiles(id),
  given_at timestamptz not null default now(),
  skipped boolean not null default false,
  note text,
  addendum_of uuid references medication_administrations(id),
  created_at timestamptz not null default now()
);

create function require_active_med_auth() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not exists (
    select 1 from medication_authorizations
    where medication_id = new.medication_id and revoked_at is null
  ) then
    raise exception 'medication authorization required';
  end if;
  return new;
end $$;

create trigger med_auth_check before insert on medication_administrations
  for each row execute function require_active_med_auth();

-- ── Agenda e materiais ────────────────────────────────────────
create table calendar_events (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references children(id) on delete cascade,
  kind text not null check (kind in ('consulta','vacina','rotina','evento','lembrete')),
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  note text,
  created_by uuid not null references profiles(id)
);

create table checklist_items (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references children(id) on delete cascade,
  name text not null,
  recurring boolean not null default false,
  low_stock boolean not null default false,
  confirmed boolean not null default false,
  created_by uuid not null references profiles(id)
);

-- ── Administração (administrative) ────────────────────────────
create table work_periods (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references children(id) on delete cascade,
  professional_id uuid not null references profiles(id),
  started_at timestamptz not null,
  ended_at timestamptz,
  break_min int not null default 0,
  overtime boolean not null default false
);

create table expenses (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references children(id) on delete cascade,
  professional_id uuid not null references profiles(id),
  kind text not null default 'outro' check (kind in ('transporte','material','outro')),
  amount_cents int not null check (amount_cents >= 0),
  note text,
  occurred_on date not null default current_date
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references children(id) on delete cascade,
  professional_id uuid not null references profiles(id),
  period_month date not null,          -- primeiro dia do mês
  amount_cents int not null check (amount_cents >= 0),
  status text not null default 'pendente' check (status in ('pendente','conferido','pago')),
  confirmed_by_guardian boolean not null default false
);

-- ── Relatórios e mídia ────────────────────────────────────────
create table weekly_reports (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references children(id) on delete cascade,
  author_id uuid not null references profiles(id),
  week_start date not null,
  version int not null default 1,
  content jsonb not null default '{}',  -- seções: rotina, experiências, observações, conquistas, convites
  state record_state not null default 'draft',
  shared_at timestamptz,
  pdf_path text,
  created_at timestamptz not null default now(),
  unique (child_id, week_start, version)
);

create table media_assets (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references children(id) on delete cascade,
  uploaded_by uuid not null references profiles(id),
  storage_path text not null,
  visibility visibility not null default 'shareable_after_review',
  created_at timestamptz not null default now()
);

create function require_media_consent() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not has_consent(new.child_id, 'media') then
    raise exception 'media consent required';
  end if;
  return new;
end $$;

create trigger media_consent_check before insert on media_assets
  for each row execute function require_media_consent();

-- ── Auditoria (append-only) ───────────────────────────────────
create table audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references profiles(id),
  child_id uuid,
  action text not null,
  detail jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create function audit(cid uuid, act text, det jsonb default '{}') returns void
language sql security definer set search_path = public as $$
  insert into audit_log (actor_id, child_id, action, detail)
  values (auth.uid(), cid, act, det);
$$;

-- ── Aceite de convite (RPC) ───────────────────────────────────
create function accept_invitation(invite_token uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare inv invitations; link_id uuid;
begin
  select * into inv from invitations
    where token = invite_token and accepted_at is null and expires_at > now()
    for update;
  if not found then raise exception 'invalid or expired invitation'; end if;

  update invitations set accepted_at = now(), accepted_by = auth.uid() where id = inv.id;

  insert into care_links (child_id, user_id, role, invited_by)
    values (inv.child_id, auth.uid(), inv.role, inv.invited_by)
    on conflict (child_id, user_id) do update set revoked_at = null
    returning id into link_id;

  perform audit(inv.child_id, 'invitation_accepted', jsonb_build_object('invitation', inv.id));
  return link_id;
end $$;

-- ── RLS ───────────────────────────────────────────────────────
alter table profiles enable row level security;
alter table children enable row level security;
alter table care_links enable row level security;
alter table invitations enable row level security;
alter table consents enable row level security;
alter table daily_records enable row level security;
alter table living_profile_entries enable row level security;
alter table pedagogical_observations enable row level security;
alter table health_conditions enable row level security;
alter table emergency_contacts enable row level security;
alter table medications enable row level security;
alter table medication_authorizations enable row level security;
alter table medication_administrations enable row level security;
alter table calendar_events enable row level security;
alter table checklist_items enable row level security;
alter table work_periods enable row level security;
alter table expenses enable row level security;
alter table payments enable row level security;
alter table weekly_reports enable row level security;
alter table media_assets enable row level security;
alter table audit_log enable row level security;

-- perfis: dono
create policy p_profiles_self on profiles for all
  using (id = auth.uid()) with check (id = auth.uid());

-- crianças: vínculo ativo lê; criador insere; profissional vinculado edita
create policy p_children_select on children for select using (has_active_link(id));
create policy p_children_insert on children for insert with check (created_by = auth.uid());
create policy p_children_update on children for update using (has_role_link(id, 'professional'));

-- vínculos: enxerga os próprios e os das crianças em que é profissional
create policy p_links_select on care_links for select
  using (user_id = auth.uid() or has_role_link(child_id, 'professional'));
create policy p_links_insert on care_links for insert
  with check (user_id = auth.uid() and exists (select 1 from children c where c.id = child_id and c.created_by = auth.uid()));
create policy p_links_revoke on care_links for update
  using (has_role_link(child_id, 'professional') or user_id = auth.uid());

-- convites: profissional do vínculo cria/lê
create policy p_inv_all on invitations for all
  using (invited_by = auth.uid()) with check (invited_by = auth.uid() and has_role_link(child_id, 'professional'));

-- consentimentos: guardian gerencia os seus; vínculo ativo lê
create policy p_consents_select on consents for select using (has_active_link(child_id));
create policy p_consents_insert on consents for insert
  with check (guardian_id = auth.uid() and has_role_link(child_id, 'guardian'));
create policy p_consents_update on consents for update using (guardian_id = auth.uid());

-- diário: autor vê tudo; demais vinculados só não-privado E compartilhado
create policy p_daily_select on daily_records for select
  using (author_id = auth.uid()
         or (has_active_link(child_id) and visibility <> 'private_professional' and state = 'shared'));
create policy p_daily_insert on daily_records for insert
  with check (author_id = auth.uid() and has_role_link(child_id, 'professional'));
create policy p_daily_update on daily_records for update using (author_id = auth.uid());
create policy p_daily_delete on daily_records for delete
  using (author_id = auth.uid() and state = 'draft');

-- perfil vivo: append-only (sem update/delete); vínculo lê
create policy p_living_select on living_profile_entries for select using (has_active_link(child_id));
create policy p_living_insert on living_profile_entries for insert
  with check (author_id = auth.uid() and has_role_link(child_id, 'professional'));

-- observações pedagógicas: autor tudo; família só compartilhadas
create policy p_obs_select on pedagogical_observations for select
  using (author_id = auth.uid() or (has_active_link(child_id) and review_state = 'shared'));
create policy p_obs_insert on pedagogical_observations for insert
  with check (author_id = auth.uid() and has_role_link(child_id, 'professional'));
create policy p_obs_update on pedagogical_observations for update using (author_id = auth.uid());

-- saúde: critical_care — todo vínculo ativo lê; guardian escreve condições/medicamentos
create policy p_health_select on health_conditions for select using (has_active_link(child_id));
create policy p_health_write on health_conditions for insert
  with check (created_by = auth.uid() and has_active_link(child_id));
create policy p_emerg_select on emergency_contacts for select using (has_active_link(child_id));
create policy p_emerg_write on emergency_contacts for insert with check (has_active_link(child_id));
create policy p_med_select on medications for select using (has_active_link(child_id));
create policy p_med_insert on medications for insert
  with check (created_by = auth.uid() and has_active_link(child_id));
create policy p_medauth_select on medication_authorizations for select
  using (exists (select 1 from medications m where m.id = medication_id and has_active_link(m.child_id)));
create policy p_medauth_insert on medication_authorizations for insert
  with check (guardian_id = auth.uid()
              and exists (select 1 from medications m where m.id = medication_id and has_role_link(m.child_id, 'guardian')));
create policy p_medauth_revoke on medication_authorizations for update using (guardian_id = auth.uid());
-- administrações: append-only (sem update/delete)
create policy p_medadm_select on medication_administrations for select using (has_active_link(child_id));
create policy p_medadm_insert on medication_administrations for insert
  with check (given_by = auth.uid() and has_role_link(child_id, 'professional'));

-- agenda e materiais: vínculo ativo lê e escreve
create policy p_cal_all on calendar_events for all
  using (has_active_link(child_id)) with check (created_by = auth.uid() and has_active_link(child_id));
create policy p_chk_all on checklist_items for all
  using (has_active_link(child_id)) with check (created_by = auth.uid() and has_active_link(child_id));

-- administrativo: profissional dono; guardian lê despesas/pagamentos
create policy p_work_all on work_periods for all
  using (professional_id = auth.uid()) with check (professional_id = auth.uid() and has_role_link(child_id, 'professional'));
create policy p_exp_select on expenses for select
  using (professional_id = auth.uid() or has_role_link(child_id, 'guardian'));
create policy p_exp_write on expenses for insert
  with check (professional_id = auth.uid() and has_role_link(child_id, 'professional'));
create policy p_exp_update on expenses for update using (professional_id = auth.uid());
create policy p_pay_select on payments for select
  using (professional_id = auth.uid() or has_role_link(child_id, 'guardian'));
create policy p_pay_write on payments for insert
  with check (professional_id = auth.uid() and has_role_link(child_id, 'professional'));
create policy p_pay_update on payments for update
  using (professional_id = auth.uid() or has_role_link(child_id, 'guardian'));

-- relatórios: autor tudo; família só compartilhados (e com consentimento de relatório)
create policy p_rep_select on weekly_reports for select
  using (author_id = auth.uid()
         or (has_active_link(child_id) and state = 'shared' and has_consent(child_id, 'reports')));
create policy p_rep_insert on weekly_reports for insert
  with check (author_id = auth.uid() and has_role_link(child_id, 'professional'));
create policy p_rep_update on weekly_reports for update using (author_id = auth.uid());

-- mídia: consentimento no trigger; leitura por vínculo, nunca privada de outro autor
create policy p_media_select on media_assets for select
  using (uploaded_by = auth.uid()
         or (has_active_link(child_id) and visibility in ('shared','shareable_after_review')));
create policy p_media_insert on media_assets for insert
  with check (uploaded_by = auth.uid() and has_active_link(child_id));

-- auditoria: append via função; leitura pelo próprio ator ou guardian da criança
create policy p_audit_select on audit_log for select
  using (actor_id = auth.uid() or (child_id is not null and has_role_link(child_id, 'guardian')));

-- ===== 0002 =====

-- Auditoria automática de ações sensíveis (spec §04 — requisitos de auditoria)
create function audit_row() returns trigger
language plpgsql security definer set search_path = public as $$
declare cid uuid;
begin
  cid := coalesce(new.child_id, old.child_id);
  insert into audit_log (actor_id, child_id, action, detail)
  values (auth.uid(), cid, tg_table_name || ':' || lower(tg_op),
          jsonb_build_object('id', coalesce(new.id, old.id)));
  return coalesce(new, old);
end $$;

create trigger audit_consents after insert or update on consents
  for each row execute function audit_row();
create trigger audit_care_links after insert or update on care_links
  for each row execute function audit_row();
create trigger audit_med_adm after insert on medication_administrations
  for each row execute function audit_row();
create trigger audit_medications after insert on medications
  for each row execute function audit_row();
create trigger audit_reports after insert or update on weekly_reports
  for each row execute function audit_row();
-- Bug: p_links_insert consultava children por subquery, sujeita ao RLS de
-- children — o criador ainda não tem care_link, não enxerga a linha, e o
-- insert do próprio vínculo falhava. Helper security definer resolve.
create or replace function is_child_creator(cid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from children where id = cid and created_by = auth.uid());
$$;

alter policy p_links_insert on care_links
  with check (user_id = auth.uid() and is_child_creator(child_id));


-- ═══════════════════════════════════════════════════════════════
-- 0004 — amplia categorias do diário
-- ═══════════════════════════════════════════════════════════════
-- Amplia as categorias de registro do diário (spec §4): fralda, mamadeira,
-- água, humor, momento especial.
--
-- 'medicamento' é DELIBERADAMENTE omitido: administração de medicamento passa
-- pelo módulo de Saúde, que exige autorização ativa do responsável
-- (trigger require_active_med_auth). Um registro livre no diário burlaria essa
-- trava de segurança.

alter table daily_records drop constraint if exists daily_records_category_check;

alter table daily_records add constraint daily_records_category_check
  check (category in (
    'alimentacao','sono','higiene','atividade','passeio','leitura','saude','observacao',
    'fralda','mamadeira','agua','humor','momento_especial'
  ));


-- ═══════════════════════════════════════════════════════════════
-- 0005 — caderno de orientações
-- ═══════════════════════════════════════════════════════════════
-- Caderno de orientações (§11): informações que costumam ficar espalhadas em
-- mensagens. É informativo — NÃO é fonte de verdade para medicamento/alergia,
-- que continuam no módulo Saúde com suas travas.

create table guidance_notes (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references children(id) on delete cascade,
  section text not null check (section in
    ('geral','alimentacao','sono','higiene','conforto','rotina','preferencias','saude','passeios','telas','contatos')),
  title text not null,
  body text not null,
  important boolean not null default false,
  valid_until date,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table guidance_acknowledgements (  -- confirmação de leitura
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references guidance_notes(id) on delete cascade,
  user_id uuid not null references profiles(id),
  acknowledged_at timestamptz not null default now(),
  unique (note_id, user_id)
);

-- helper security-definer: evita RLS recursiva ao checar o vínculo pela nota
-- (lição do bug #2: policy que consulta outra tabela sob RLS)
create function guidance_child(nid uuid) returns uuid
language sql stable security definer set search_path = public as $$
  select child_id from guidance_notes where id = nid;
$$;

alter table guidance_notes enable row level security;
alter table guidance_acknowledgements enable row level security;

-- notas: vínculo ativo lê; autor cria/edita/remove
create policy p_guid_select on guidance_notes for select using (has_active_link(child_id));
create policy p_guid_insert on guidance_notes for insert
  with check (created_by = auth.uid() and has_active_link(child_id));
create policy p_guid_update on guidance_notes for update using (created_by = auth.uid());
create policy p_guid_delete on guidance_notes for delete using (created_by = auth.uid());

-- confirmações: quem tem vínculo confirma a própria leitura e lê as dos outros
create policy p_guidack_select on guidance_acknowledgements for select
  using (has_active_link(guidance_child(note_id)));
create policy p_guidack_insert on guidance_acknowledgements for insert
  with check (user_id = auth.uid() and has_active_link(guidance_child(note_id)));


-- ═══════════════════════════════════════════════════════════════
-- 0006 — mural de recados da família
-- ═══════════════════════════════════════════════════════════════
-- Mural de recados da família (§10): feed simples, append-only (mantém histórico).
-- author_name é gravado no momento do post — a policy de profiles só permite ler
-- o próprio perfil, então snapshotar o nome evita embed nulo de outros usuários.

create table family_messages (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references children(id) on delete cascade,
  author_id uuid not null references profiles(id),
  author_name text not null,
  body text not null,
  created_at timestamptz not null default now()
);

alter table family_messages enable row level security;

-- vínculo ativo lê; escreve como si mesmo. Sem update/delete: histórico preservado.
create policy p_board_select on family_messages for select using (has_active_link(child_id));
create policy p_board_insert on family_messages for insert
  with check (author_id = auth.uid() and has_active_link(child_id));
