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
