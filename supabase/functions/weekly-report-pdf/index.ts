// RF-08 — PDF do resumo semanal. Só conteúdo do relatório (já filtrado de notas
// privadas na composição); link assinado com expiração curta (spec §04).
import { createClient } from "npm:@supabase/supabase-js@2";
import { PDFDocument, StandardFonts, rgb } from "npm:pdf-lib@1.17.1";

const SECTIONS: [string, string][] = [
  ["rotina", "Rotina"],
  ["experiencias", "Experiências da semana"],
  ["observacoes", "Observações de desenvolvimento"],
  ["conquistas", "Conquistas"],
  ["convites", "Próximos convites ao brincar"],
];

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("method not allowed", { status: 405 });

  // autorização via RLS: o usuário só carrega relatórios que pode ver
  const userClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } },
  );
  const { data: auth } = await userClient.auth.getUser();
  if (!auth.user) return new Response("unauthorized", { status: 401 });

  const { report_id } = await req.json();
  const { data: report } = await userClient.from("weekly_reports")
    .select("*, children(name)").eq("id", report_id).single();
  if (!report) return new Response("report not found or no access", { status: 404 });
  const { data: author } = await userClient.from("profiles").select("name").eq("id", report.author_id).single();

  // PDF simples: identidade leve, data, autoria (RF-08)
  const doc = await PDFDocument.create();
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontReg = await doc.embedFont(StandardFonts.Helvetica);
  let page = doc.addPage([595, 842]); // A4
  let y = 790;
  const green = rgb(0.31, 0.48, 0.35);
  const ink = rgb(0.18, 0.16, 0.15);

  const write = (text: string, size: number, bold = false, color = ink) => {
    const font = bold ? fontBold : fontReg;
    const maxWidth = 495;
    for (const paragraph of text.split("\n")) {
      let line = "";
      for (const word of paragraph.split(" ")) {
        const candidate = line ? `${line} ${word}` : word;
        if (font.widthOfTextAtSize(candidate, size) > maxWidth && line) {
          if (y < 60) { page = doc.addPage([595, 842]); y = 790; }
          page.drawText(line, { x: 50, y, size, font, color });
          y -= size + 6;
          line = word;
        } else line = candidate;
      }
      if (y < 60) { page = doc.addPage([595, 842]); y = 790; }
      page.drawText(line, { x: 50, y, size, font, color });
      y -= size + 6;
    }
  };

  write("Crescer", 22, true, green);
  write(`Resumo semanal — ${(report.children as { name: string }).name}`, 14, true);
  write(`Semana de ${report.week_start} · por ${author?.name ?? "profissional"} · gerado em ${new Date().toLocaleDateString("pt-BR")}`, 10);
  y -= 10;
  const content = report.content as Record<string, string>;
  for (const [key, label] of SECTIONS) {
    if (!content[key]?.trim()) continue;
    y -= 8;
    write(label, 13, true, green);
    write(content[key], 11);
  }
  write("\nCada criança tem seu ritmo. Este resumo contém apenas conteúdo autorizado.", 9, false, rgb(0.42, 0.39, 0.36));

  const bytes = await doc.save();

  // storage com service role; leitura só via URL assinada curta
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  await admin.storage.createBucket("reports", { public: false }).catch(() => {});
  const path = `${report.child_id}/${report.week_start}-v${report.version}.pdf`;
  const up = await admin.storage.from("reports").upload(path, bytes, { contentType: "application/pdf", upsert: true });
  if (up.error) return new Response(up.error.message, { status: 500 });

  await userClient.from("weekly_reports").update({ pdf_path: path }).eq("id", report_id);
  const { data: signed, error: signErr } = await admin.storage.from("reports")
    .createSignedUrl(path, 60 * 60 * 24); // 24h
  if (signErr) return new Response(signErr.message, { status: 500 });

  return Response.json({ url: signed.signedUrl });
});
