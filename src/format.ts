// Formatação afetiva e não-clínica. Idade em linguagem natural PT-BR.

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
