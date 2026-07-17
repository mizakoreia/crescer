// Design tokens — direção da spec: paleta natural suave, alta legibilidade,
// estados críticos de saúde visualmente distintos do resto. WCAG AA.
export const colors = {
  bg: '#FAF7F2',          // papel quente
  surface: '#FFFFFF',
  ink: '#2E2A26',         // texto principal (contraste AA sobre bg)
  inkSoft: '#6B635B',
  primary: '#4E7A5A',     // verde sálvia — ações
  primarySoft: '#E3EDE6',
  accent: '#C98A5B',      // terracota suave — destaques
  critical: '#B3261E',    // saúde crítica — reservado, nunca decorativo
  criticalBg: '#FDECEA',
  private: '#5B5EA6',     // marcação de conteúdo privado
  privateBg: '#EDEDF7',
  border: '#E5DFD6',
  success: '#3E6B48',
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };
export const radius = { sm: 8, md: 12, lg: 20, pill: 999 };
export const font = {
  title: { fontSize: 22, fontWeight: '700' as const, color: colors.ink },
  body: { fontSize: 16, lineHeight: 24, color: colors.ink },
  small: { fontSize: 13, color: colors.inkSoft },
};
