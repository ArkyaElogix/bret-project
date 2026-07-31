import { StyleSheet } from '@react-pdf/renderer';

// Register fonts up front — react-pdf needs actual font files, not a
// Google Fonts <link>/@import. Swap these paths for wherever you serve
// the .ttf files from (public/ dir, CDN, etc).


// Same palette as report-template.css — kept in one place so every
// page/component below pulls from the same source of truth.
export const colors = {
  bg: '#f8faff',
  white: '#ffffff',
  border: '#e2e8f0',
  slate900: '#1e293b',
  slate600: '#475569',
  slate500: '#64748b',
  slate400: '#94a3b8',
  slate300: '#334155',
  blue: '#1b4fd8',
  blueLight: '#eef2ff',
  teal: '#14b8a6',
  violet: '#8b5cf6',
  amber: '#f59e0b',
  rose: '#e11d48',
  green: '#22c55e',
  summaryBorder: '#e6339b',
  chipBg: '#e8eeff',
};

export const barColors = [colors.blue, colors.teal, colors.violet, colors.amber];

// Page is landscape A4 at 96dpi-equivalent points, matching the
// @page { size: landscape } rule from the old print stylesheet.
export const PAGE_SIZE: [number, number] = [842, 595];

export const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 11,
    color: colors.slate600,
    backgroundColor: colors.white,
    padding: 28,
  },

  // ── Cover page ──────────────────────────────────────────────
  coverWrap: {
    backgroundColor: colors.bg,
    borderRadius: 16,
    padding: 36,
    flexDirection: 'column',
    justifyContent: 'center',
    gap: 16,
    minHeight: 420,
  },
  coverTitle: {
    fontSize: 30,
    fontWeight: 700,
    color: colors.slate900,
  },
  coverSubtitle: {
    fontSize: 13,
    lineHeight: 1.7,
    color: colors.slate500,
    fontStyle: 'italic',
    maxWidth: 420,
  },
  coverCard: {
    backgroundColor: colors.chipBg,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'column',
    gap: 5,
    maxWidth: 280,
  },
  coverLabel: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.slate500,
  },
  coverMeta: {
    fontSize: 12,
    fontWeight: 600,
    color: '#a16207',
  },

  // ── Generic section shell ───────────────────────────────────
  section: {
    border: `1px solid ${colors.border}`,
    borderRadius: 12,
    padding: '16px 18px',
    marginBottom: 14,
  },
  sectionHeader: {
    fontSize: 17,
    fontWeight: 700,
    color: colors.slate900,
    marginBottom: 12,
  },

  summaryCard: {
    backgroundColor: '#e7ebf3',
    borderLeft: `4px solid ${colors.summaryBorder}`,
    padding: '12px 16px',
    marginBottom: 12,
  },
  summaryCardLabel: {
    color: colors.blue,
    textTransform: 'uppercase',
    fontSize: 9,
    letterSpacing: 0.5,
    marginBottom: 6,
    fontWeight: 700,
  },
  summaryCardText: {
    fontStyle: 'italic',
    fontSize: 11,
    lineHeight: 1.6,
    color: colors.slate600,
  },

  // ── Definitions grid (2-up) ──────────────────────────────────
  definitionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  definitionCard: {
    width: '47%',
    borderLeft: `3px solid ${colors.blue}`,
    paddingLeft: 12,
    marginBottom: 10,
  },
  definitionTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: colors.slate900,
    marginBottom: 4,
  },
  definitionText: {
    fontSize: 10.5,
    lineHeight: 1.6,
    color: colors.slate600,
  },
    definitionSummary: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderLeft: `4px solid ${colors.blue}`,
    borderRadius: 10,
  },
  definitionSummaryText: {
    fontSize: 10.5,
    lineHeight: 1.6,
    color: colors.slate600,
  },

  // ── Profile layout: chart column + text column ──────────────
  profileLayout: {
    flexDirection: 'row',
    gap: 18,
  },
  chartColumn: {
    width: '34%',
    border: `1px solid ${colors.border}`,
    borderRadius: 12,
    padding: 10,
  },
  textColumn: {
    width: '66%',
  },
  factorList: {
    flexDirection: 'column',
    gap: 8,
  },
  factorItem: {
    flexDirection: 'column',
    gap: 3,
    paddingVertical: 4,
  },
  factorHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  factorName: {
    fontSize: 11,
    fontWeight: 700,
    color: colors.slate500,
  },
  factorScore: {
    fontSize: 11,
    color: colors.slate400,
  },
  factorDescription: {
    fontSize: 10,
    lineHeight: 1.55,
    color: colors.slate600,
  },
  chartLegend: {
    fontSize: 9,
    color: '#132e53',
    textAlign: 'center',
    marginTop: 4,
  },

  // ── Takeaways cards ──────────────────────────────────────────
  obsGrid: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 14,
  },
  obsCard: {
    flex: 1,
    border: `1px solid ${colors.border}`,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'column',
    gap: 8,
  },
  obsCardTitle: {
    fontSize: 12.5,
    fontWeight: 700,
    color: colors.slate900,
    marginBottom: 2,
  },
  obsPill: {
    fontSize: 8.5,
    fontWeight: 700,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    borderRadius: 4,
    padding: '3px 7px',
    marginTop: 4,
    marginBottom: 2,
    alignSelf: 'flex-start',
  },
  obsPillTeal: { backgroundColor: '#f0fdfa', color: '#0f766e' },
  obsPillRose: { backgroundColor: '#fff1f2', color: colors.rose },
  obsPillGray: { backgroundColor: '#f1f5f9', color: colors.slate500 },
  obsListItem: {
    fontSize: 10.5,
    color: colors.slate300,
    lineHeight: 1.55,
  },
  roadmapRow: {
    flexDirection: 'row',
    gap: 8,
  },
  roadmapPhase: {
    flex: 1,
    borderRadius: 8,
    padding: 10,
    borderTop: '3px solid transparent',
    flexDirection: 'column',
    gap: 6,
  },
  roadmapPhaseBlue: { borderTopColor: '#3b82f6', backgroundColor: '#eff6ff' },
  roadmapPhaseTeal: { borderTopColor: '#14b8a6', backgroundColor: '#f0fdfa' },
  roadmapPhaseGreen: { borderTopColor: '#22c55e', backgroundColor: '#f0fdf4' },
  roadmapLabel: {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: colors.slate500,
  },
  roadmapText: {
    fontSize: 10,
    lineHeight: 1.5,
    color: colors.slate600,
  },
  leadershipCard: {
    borderRadius: 8,
    padding: '10px 12px',
    borderLeft: '4px solid transparent',
  },
  leadershipTeal: { backgroundColor: '#f0fdfa', borderLeftColor: '#14b8a6' },
  leadershipGreen: { backgroundColor: '#f0fdf4', borderLeftColor: '#22c55e' },
  leadershipText: {
    fontSize: 10.5,
    lineHeight: 1.6,
    color: colors.slate600,
  },
  pageFooter: {
    position: 'absolute',
    bottom: 16,
    left: 28,
    right: 28,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
    color: colors.slate400,
  },
});