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
