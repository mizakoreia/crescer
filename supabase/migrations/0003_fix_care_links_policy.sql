-- Bug: p_links_insert consultava children por subquery, sujeita ao RLS de
-- children — o criador ainda não tem care_link, não enxerga a linha, e o
-- insert do próprio vínculo falhava. Helper security definer resolve.
create or replace function is_child_creator(cid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from children where id = cid and created_by = auth.uid());
$$;

alter policy p_links_insert on care_links
  with check (user_id = auth.uid() and is_child_creator(child_id));
