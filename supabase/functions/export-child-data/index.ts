// Exportação de dados do titular (LGPD / critérios de aceite):
// guardian recebe JSON legível com tudo que a RLS permite ao seu vínculo.
import { createClient } from "npm:@supabase/supabase-js@2";

const TABLES = [
  "children", "living_profile_entries", "daily_records", "pedagogical_observations",
  "health_conditions", "emergency_contacts", "medications", "medication_administrations",
  "calendar_events", "checklist_items", "weekly_reports", "consents",
];

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("method not allowed", { status: 405 });
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } },
  );
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return new Response("unauthorized", { status: 401 });

  const { child_id } = await req.json();
  const out: Record<string, unknown> = { exported_at: new Date().toISOString(), child_id };
  for (const table of TABLES) {
    const col = table === "children" ? "id" : "child_id";
    const { data } = await supabase.from(table).select("*").eq(col, child_id);
    out[table] = data ?? [];
  }
  await supabase.rpc("audit", { cid: child_id, act: "data_export", det: {} });
  return Response.json(out);
});
