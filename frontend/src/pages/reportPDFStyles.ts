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
    backgroundColor: '#e3eaecff',
    borderRadius: 16,
    padding: 36,
    flexDirection: 'row',   // Changed from 'column' to 'row'
    alignItems: 'center',   // Vertically centers both columns
    gap: 24,
    minHeight: 420,
  },
  coverLeftColumn: {
    width: '50%',
    flexDirection: 'column',
    gap: 16,
  },
  coverRightColumn: {
    width: '50%',
    flexDirection: 'column',
    alignItems: 'center',   // Horizontally centers the card in the right column
  },
  coverTitle: {
    fontSize: 36,
    fontWeight: 700,
    color: colors.slate900,
  },
  coverSubtitle: {
    fontSize: 14,
    lineHeight: 1.7,
    color: '#554dc7ff',
    fontStyle: 'italic',
    maxWidth: 420,
  },
  coverCard: {
    backgroundColor: '#d6d5f5ff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'column',
    gap: 5,
    maxWidth: 280,
  },
  coverLabel: {
    fontSize: 16,
    fontWeight: 700,
    letterSpacing: 1,
    textTransform: 'uppercase',

  },
  coverMeta: {
    fontSize: 12,
    fontWeight: 600,
    color: '#a16207',
  },
  // ── Discovery Letter ─────────────────────────────────────────
  letterLayout: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 20,
  },
  letterLeftColumn: {
    width: '30%',
    flexDirection: 'column',
    gap: 12,
    backgroundColor: '#92b2b6ff',
    borderRadius: 16,
    padding: 22,
  },
  letterRightColumn: {
    width: '70%',
    flexDirection: 'column',
    gap: 16,
    backgroundColor: '#cacfd4ff',
    borderRadius: 16,
    padding: 22,
  },
  letterTitle: {
    fontSize: 30,
    fontWeight: 600,
    color: '#132154',
    paddingBottom: 15,
  },
  letterSubtitle: {
    fontSize: 20,
    fontStyle: 'italic',
    color: '#000000',

    lineHeight: 1.5,
    paddingTop: 15,
  },
  letterGreeting: {
    fontSize: 20,
    fontWeight: 700,
    color: colors.blue, // This is the dark/black color
    paddingBottom: 30,      // Space between the name and the teal body text
  },

  letterBody: {
    fontSize: 16,
    lineHeight: 1.6,
    color: colors.slate900,
  },
  // ── Icons & Section Headers ──────────────────────────────────
  iconPlaceholderLarge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.blue,
    marginBottom: 8,
  },
  iconPlaceholderSmall: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.blue,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  // ── Definition Border Colors ─────────────────────────────────
  borderCyan: { borderLeftColor: '#b4d0d4ff' },
  borderBlue: { borderLeftColor: colors.blue },
  borderDarkBlue: { borderLeftColor: '#1e3a8a' },
  borderSlate: { borderLeftColor: colors.slate400 },

  // ── Generic section shell ───────────────────────────────────
  section: {
    border: `1px solid ${colors.border}`,
    borderRadius: 12,
    padding: '16px 18px',
    marginBottom: 14,
  },
  sectionHeader: {
    fontSize: 32,
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
    fontSize: 12,
    letterSpacing: 0.5,
    marginBottom: 6,
    fontWeight: 700,
  },
  summaryCardText: {
    fontStyle: 'italic',
    fontSize: 12,
    lineHeight: 1.8,
    color: colors.slate600,
  },

  // ── Definitions grid (2-up) ──────────────────────────────────
  definitionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
    marginTop: 10,
  },
  definitionCard: {
    width: '47%',
    borderLeft: `4px solid ${colors.blue}`,
    padding: '16px',
    marginBottom: 10,
    backgroundColor: '#fafbfc',
    minHeight: 120,
  },
  definitionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  definitionTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: colors.slate900,
  },
  definitionText: {
    fontSize: 13,
    lineHeight: 1.6,
    color: colors.slate600,
  },
  definitionSummary: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#d0ddebff',
    borderLeft: `4px solid ${colors.blue}`,
    borderRadius: 10,
  },
  definitionSummaryText: {
    fontSize: 13,
    lineHeight: 1.6,
    color: colors.slate600,
  },

  // ── Profile layout ──────────────
  profileLayout: {
    flexDirection: 'row',
    gap: 18,
  },
  chartArea: {
    marginBottom: 8,
  },
  profileLeft: {
    width: '36%',
    paddingRight: 10,
    flexDirection: 'column',
    overflow: 'hidden',
  },
  profileRight: {
    width: '64%',
    flexDirection: 'column',
    overflow: 'hidden',
    paddingLeft: 6,
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
    fontSize: 13,
    fontWeight: 700,
    color: colors.slate900,
  },
  factorScore: {
    fontSize: 12,
    color: colors.slate900,
  },
  factorDescription: {
    fontSize: 10,
    lineHeight: 1.45,
    color: colors.slate600,
    flexWrap: 'wrap',
  },

  chartLegend: {
    fontSize: 9,
    color: '#113e7eff',
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

  orientationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  orientationBody: {
    flexDirection: 'row',
    flex: 1,
    gap: 20,
    marginTop: 12,
  },
  orientationLeft: {
    flex: 1,
    flexDirection: 'column',
    gap: 10,
  },
  orientationRight: {
    width: 220,
    borderRadius: 8,
    overflow: 'hidden',
  },
  orientationImage: {
    width: 220,
    height: 160,
    borderRadius: 8,
    objectFit: 'cover',
  },
  orientationContentCard: {
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    padding: 16,
    flex: 1,
  },
  orientationBodyText: {
    fontSize: 11,
    color: '#374151',
    lineHeight: 1.6,
  },
  orientationCategoryBadge: {
    backgroundColor: '#3B4FC8',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  orientationCategoryText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: 'bold',
    letterSpacing: 1,
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

