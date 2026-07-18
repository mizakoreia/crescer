// Formatação afetiva e não-clínica. Idade em linguagem natural PT-BR.

// Rótulos de categoria do diário, compartilhados entre telas.
export const CATEGORY_LABEL: Record<string, string> = {
  alimentacao: 'Alimentação', mamadeira: 'Mamadeira', agua: 'Água', sono: 'Sono',
  fralda: 'Fralda', higiene: 'Higiene', humor: 'Humor', atividade: 'Atividade',
  passeio: 'Passeio', leitura: 'Leitura', saude: 'Saúde', observacao: 'Observação',
  momento_especial: 'Momento especial',
};

// amount_text legível fora do diário (ml em bebidas, texto puro no resto).
export function formatAmount(category: string, amount_text?: string | null): string {
  if (!amount_text) return '';
  if (category === 'mamadeira' || category === 'agua') return `${amount_text} ml`;
  return amount_text;
}

// Substantivos afetivos por categoria (singular, plural) para o resumo do dia.
const DAY_NOUN: Record<string, [string, string]> = {
  alimentacao: ['refeição', 'refeições'],
  mamadeira: ['mamadeira', 'mamadeiras'],
  agua: ['oferta de água', 'ofertas de água'],
  sono: ['sono', 'sonos'],
  fralda: ['fralda', 'fraldas'],
  higiene: ['troca', 'trocas'],
  humor: ['registro de humor', 'registros de humor'],
  atividade: ['atividade', 'atividades'],
  passeio: ['passeio', 'passeios'],
  leitura: ['leitura', 'leituras'],
  saude: ['registro de saúde', 'registros de saúde'],
  observacao: ['observação', 'observações'],
  momento_especial: ['momento especial', 'momentos especiais'],
};

// Resumo do dia sem IA: conta registros por categoria e devolve rótulos prontos
// ("2 refeições", "1 passeio"). Ordena por quantidade, do maior para o menor.
export function summarizeDay(records: { category: string }[]): string[] {
  const byCat: Record<string, number> = {};
  for (const r of records) byCat[r.category] = (byCat[r.category] ?? 0) + 1;
  return Object.entries(byCat)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, n]) => {
      const noun = DAY_NOUN[cat] ?? [cat, cat];
      return `${n} ${n === 1 ? noun[0] : noun[1]}`;
    });
}

// Idade a partir da data de nascimento (YYYY-MM-DD).
// "12 dias" → "3 meses" → "2 anos e 4 meses" → "2 anos".
export function formatAge(birthdate: string, now: Date = new Date()): string {
  const born = new Date(`${birthdate}T00:00:00`);
  if (Number.isNaN(born.getTime())) return '';

  let months = (now.getFullYear() - born.getFullYear()) * 12 + (now.getMonth() - born.getMonth());
  if (now.getDate() < born.getDate()) months -= 1;

  if (months < 1) {
    const days = Math.max(0, Math.floor((now.getTime() - born.getTime()) / 86_400_000));
    if (days <= 0) return 'recém-nascido';
    return `${days} ${days === 1 ? 'dia' : 'dias'}`;
  }
  if (months < 24) return `${months} ${months === 1 ? 'mês' : 'meses'}`;

  const years = Math.floor(months / 12);
  const rest = months % 12;
  const y = `${years} anos`;
  return rest > 0 ? `${y} e ${rest} ${rest === 1 ? 'mês' : 'meses'}` : y;
}
