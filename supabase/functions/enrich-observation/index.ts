// RF-09 — Enriquecimento pedagógico assistido.
// Guardrails (spec doc 03): notas privadas NUNCA entram no prompt; consentimento
// "automated_features" obrigatório; saída nasce como rascunho (revisão humana);
// linguagem hipotética; rastreabilidade via source_record_ids.
import { createClient } from "npm:@supabase/supabase-js@2";
import Anthropic from "npm:@anthropic-ai/sdk";

const SYSTEM = `Você é uma especialista em documentação pedagógica da primeira infância (inspiração: Montessori, Reggio Emilia, Pikler), escrevendo em português do Brasil.

Transforme registros curtos do cotidiano em uma observação pedagógica seguindo o modelo:
fato observado (factual, sem inventar) → contexto → iniciativa e estratégias da criança → possíveis domínios de desenvolvimento → continuidade (convite ao brincar).

REGRAS INEGOCIÁVEIS:
- NUNCA invente eventos, falas, emoções ou causalidade que não estejam nos registros.
- Linguagem sempre hipotética: "pode favorecer", "oferece oportunidade", "permite observar". NUNCA "desenvolve", "está atrasada/avançada", diagnóstico, score ou comparação com outras crianças.
- A criança como sujeito: linguagem respeitosa, calorosa e profissional, sem jargão não explicado.
- Interpretação separada do fato: o campo "interpretation" é claramente uma leitura pedagógica, não um fato.
- Se os registros forem curtos ou vagos demais para sustentar a narrativa, marque low_confidence=true e escreva apenas o que os registros sustentam.
- Domínios permitidos: motor, cognitivo, linguagem, socioemocional, sensorial, autonomia, criatividade.

Exemplo de qualidade esperada — registro "Brincamos de blocos" (18 meses, interesse: empilhar):
fact: "Hoje a criança explorou diferentes formas de empilhar blocos, tentando novamente quando a torre caía."
interpretation: "Demonstrou persistência ao reequilibrar as peças e comemorou ao conseguir. Essa brincadeira pode favorecer coordenação motora fina, percepção espacial, resolução de problemas e autonomia."
continuity: "Oferecer blocos de tamanhos e pesos diferentes em superfície firme, sem demonstrar uma única solução."`;

const OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    fact: { type: "string", description: "Descrição factual do observado, baseada só nos registros" },
    context: { type: "string", description: "Onde, quando, materiais — apenas o que consta nos registros" },
    interpretation: { type: "string", description: "Leitura pedagógica hipotética ('pode favorecer...')" },
    domains: {
      type: "array",
      items: { type: "string", enum: ["motor", "cognitivo", "linguagem", "socioemocional", "sensorial", "autonomia", "criatividade"] },
    },
    continuity: { type: "string", description: "Convite ao brincar para continuar a exploração" },
    low_confidence: { type: "boolean", description: "true se os registros são insuficientes" },
  },
  required: ["fact", "context", "interpretation", "domains", "continuity", "low_confidence"],
  additionalProperties: false,
};

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("method not allowed", { status: 405 });

  // cliente com o JWT do usuário: RLS decide o que ele enxerga
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } },
  );

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return new Response("unauthorized", { status: 401 });

  const { child_id, record_ids } = await req.json();
  if (!child_id || !Array.isArray(record_ids) || record_ids.length === 0) {
    return new Response("child_id and record_ids required", { status: 400 });
  }

  // gate de consentimento (spec: sem consentimento, o recurso não existe)
  const { data: consent } = await supabase.from("consents").select("id")
    .eq("child_id", child_id).eq("scope", "automated_features").is("revoked_at", null).limit(1);
  if (!consent?.length) return new Response("automated_features consent required", { status: 403 });

  // registros: RLS filtra por vínculo; filtro explícito exclui notas privadas do prompt
  const { data: records } = await supabase.from("daily_records")
    .select("category, occurred_at, duration_min, note")
    .in("id", record_ids).eq("child_id", child_id)
    .neq("visibility", "private_professional");
  if (!records?.length) return new Response("no eligible records", { status: 404 });

  // contexto permitido: faixa etária aproximada + interesses do perfil vivo
  const { data: child } = await supabase.from("children").select("birthdate").eq("id", child_id).single();
  if (!child) return new Response("no access to child", { status: 403 });
  const months = Math.floor((Date.now() - new Date(child.birthdate).getTime()) / 2_629_800_000);
  const { data: interests } = await supabase.from("living_profile_entries")
    .select("content").eq("child_id", child_id).eq("section", "interesses")
    .order("created_at", { ascending: false }).limit(3);

  const anthropic = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY")! });
  const response = await anthropic.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 2048,
    system: SYSTEM,
    output_config: { format: { type: "json_schema", schema: OUTPUT_SCHEMA } },
    messages: [{
      role: "user",
      content: `Faixa etária aproximada: ${months} meses.
Interesses registrados: ${interests?.map((i) => i.content).join("; ") || "nenhum registrado"}.
Registros do dia:
${records.map((r) => `- [${r.category}] ${r.note ?? "(sem texto)"}${r.duration_min ? ` (${r.duration_min} min)` : ""}`).join("\n")}`,
    }],
  });

  if (response.stop_reason === "refusal") return new Response("model refused", { status: 502 });
  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") return new Response("empty response", { status: 502 });
  const narrative = JSON.parse(textBlock.text);

  // nasce como rascunho: compartilhar exige revisão humana explícita (RLS + review_state)
  const { data: obs, error } = await supabase.from("pedagogical_observations").insert({
    child_id,
    author_id: auth.user.id,
    fact: narrative.fact,
    context: narrative.context,
    interpretation: narrative.interpretation,
    domains: narrative.domains,
    continuity: narrative.continuity,
    origin: "assisted",
    source_record_ids: record_ids,
    low_confidence: narrative.low_confidence,
    review_state: "draft",
  }).select().single();
  if (error) return new Response(error.message, { status: 400 });

  return Response.json(obs);
});
