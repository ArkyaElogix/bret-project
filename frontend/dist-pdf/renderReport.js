"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/pages/scripts/renderReport.tsx
var import_renderer4 = require("@react-pdf/renderer");

// src/pages/reportPrintDocument.tsx
var import_renderer3 = require("@react-pdf/renderer");

// src/pages/reportPDFStyles.ts
var import_renderer = require("@react-pdf/renderer");
var colors = {
  bg: "#f8faff",
  white: "#ffffff",
  border: "#e2e8f0",
  slate900: "#1e293b",
  slate600: "#475569",
  slate500: "#64748b",
  slate400: "#94a3b8",
  slate300: "#334155",
  blue: "#1b4fd8",
  blueLight: "#eef2ff",
  teal: "#14b8a6",
  violet: "#8b5cf6",
  amber: "#f59e0b",
  rose: "#e11d48",
  green: "#22c55e",
  summaryBorder: "#e6339b",
  chipBg: "#e8eeff"
};
var barColors = [colors.blue, colors.teal, colors.violet, colors.amber];
var PAGE_SIZE = [842, 595];
var styles = import_renderer.StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 11,
    color: colors.slate600,
    backgroundColor: colors.white,
    padding: 28
  },
  // ── Cover page ──────────────────────────────────────────────
  coverWrap: {
    backgroundColor: "#e3eaecff",
    borderRadius: 16,
    padding: 36,
    flexDirection: "row",
    // Changed from 'column' to 'row'
    alignItems: "center",
    // Vertically centers both columns
    gap: 24,
    minHeight: 420
  },
  coverLeftColumn: {
    width: "50%",
    flexDirection: "column",
    gap: 16
  },
  coverRightColumn: {
    width: "50%",
    flexDirection: "column",
    alignItems: "center"
    // Horizontally centers the card in the right column
  },
  coverTitle: {
    fontSize: 36,
    fontWeight: 700,
    color: colors.slate900
  },
  coverSubtitle: {
    fontSize: 14,
    lineHeight: 1.7,
    color: "#554dc7ff",
    fontStyle: "italic",
    maxWidth: 420
  },
  coverCard: {
    backgroundColor: "#d6d5f5ff",
    borderRadius: 12,
    padding: 16,
    flexDirection: "column",
    gap: 5,
    maxWidth: 280
  },
  coverLabel: {
    fontSize: 16,
    fontWeight: 700,
    letterSpacing: 1,
    textTransform: "uppercase"
  },
  coverMeta: {
    fontSize: 12,
    fontWeight: 600,
    color: "#a16207"
  },
  // ── Discovery Letter ─────────────────────────────────────────
  letterLayout: {
    flexDirection: "row",
    gap: 24,
    marginTop: 20
  },
  letterLeftColumn: {
    width: "30%",
    flexDirection: "column",
    gap: 12,
    backgroundColor: "#92b2b6ff",
    borderRadius: 16,
    padding: 22
  },
  letterRightColumn: {
    width: "70%",
    flexDirection: "column",
    gap: 16,
    backgroundColor: "#cacfd4ff",
    borderRadius: 16,
    padding: 22
  },
  letterTitle: {
    fontSize: 30,
    fontWeight: 600,
    color: "#132154",
    paddingBottom: 15
  },
  letterSubtitle: {
    fontSize: 20,
    fontStyle: "italic",
    color: "#000000",
    lineHeight: 1.5,
    paddingTop: 15
  },
  letterGreeting: {
    fontSize: 20,
    fontWeight: 700,
    color: colors.blue,
    // This is the dark/black color
    paddingBottom: 30
    // Space between the name and the teal body text
  },
  letterBody: {
    fontSize: 16,
    lineHeight: 1.6,
    color: colors.slate900
  },
  // ── Icons & Section Headers ──────────────────────────────────
  iconPlaceholderLarge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.blue,
    marginBottom: 8
  },
  iconPlaceholderSmall: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.blue
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12
  },
  // ── Definition Border Colors ─────────────────────────────────
  borderCyan: { borderLeftColor: "#b4d0d4ff" },
  borderBlue: { borderLeftColor: colors.blue },
  borderDarkBlue: { borderLeftColor: "#1e3a8a" },
  borderSlate: { borderLeftColor: colors.slate400 },
  // ── Generic section shell ───────────────────────────────────
  section: {
    border: `1px solid ${colors.border}`,
    borderRadius: 12,
    padding: "16px 18px",
    marginBottom: 14
  },
  sectionHeader: {
    fontSize: 32,
    fontWeight: 700,
    color: colors.slate900,
    marginBottom: 12
  },
  summaryCard: {
    backgroundColor: "#e7ebf3",
    borderLeft: `4px solid ${colors.summaryBorder}`,
    padding: "12px 16px",
    marginBottom: 12
  },
  summaryCardLabel: {
    color: colors.blue,
    textTransform: "uppercase",
    fontSize: 12,
    letterSpacing: 0.5,
    marginBottom: 6,
    fontWeight: 700
  },
  summaryCardText: {
    fontStyle: "italic",
    fontSize: 12,
    lineHeight: 1.8,
    color: colors.slate600
  },
  // ── Definitions grid (2-up) ──────────────────────────────────
  definitionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 24,
    marginTop: 10
  },
  definitionCard: {
    width: "47%",
    borderLeft: `4px solid ${colors.blue}`,
    padding: "16px",
    marginBottom: 10,
    backgroundColor: "#fafbfc",
    minHeight: 120
  },
  definitionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8
  },
  definitionTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: colors.slate900
  },
  definitionText: {
    fontSize: 13,
    lineHeight: 1.6,
    color: colors.slate600
  },
  definitionSummary: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: "#d0ddebff",
    borderLeft: `4px solid ${colors.blue}`,
    borderRadius: 10
  },
  definitionSummaryText: {
    fontSize: 13,
    lineHeight: 1.6,
    color: colors.slate600
  },
  // ── Profile layout: chart column + text column ──────────────
  profileLayout: {
    flexDirection: "row",
    gap: 18
  },
  chartColumn: {
    width: "34%",
    border: `1px solid ${colors.border}`,
    borderRadius: 12,
    padding: 10
  },
  textColumn: {
    width: "66%"
  },
  factorList: {
    flexDirection: "column",
    gap: 8
  },
  factorItem: {
    flexDirection: "column",
    gap: 3,
    paddingVertical: 4
  },
  factorHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  factorName: {
    fontSize: 13,
    fontWeight: 700,
    color: colors.slate900
  },
  factorScore: {
    fontSize: 12,
    color: colors.slate900
  },
  factorDescription: {
    fontSize: 11,
    lineHeight: 1.55,
    color: colors.slate600
  },
  chartLegend: {
    fontSize: 9,
    color: "#2269ccff",
    textAlign: "center",
    marginTop: 4
  },
  // ── Takeaways cards ──────────────────────────────────────────
  obsGrid: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 14
  },
  obsCard: {
    flex: 1,
    border: `1px solid ${colors.border}`,
    borderRadius: 12,
    padding: 14,
    flexDirection: "column",
    gap: 8
  },
  obsCardTitle: {
    fontSize: 12.5,
    fontWeight: 700,
    color: colors.slate900,
    marginBottom: 2
  },
  obsPill: {
    fontSize: 8.5,
    fontWeight: 700,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    borderRadius: 4,
    padding: "3px 7px",
    marginTop: 4,
    marginBottom: 2,
    alignSelf: "flex-start"
  },
  obsPillTeal: { backgroundColor: "#f0fdfa", color: "#0f766e" },
  obsPillRose: { backgroundColor: "#fff1f2", color: colors.rose },
  obsPillGray: { backgroundColor: "#f1f5f9", color: colors.slate500 },
  obsListItem: {
    fontSize: 10.5,
    color: colors.slate300,
    lineHeight: 1.55
  },
  roadmapRow: {
    flexDirection: "row",
    gap: 8
  },
  roadmapPhase: {
    flex: 1,
    borderRadius: 8,
    padding: 10,
    borderTop: "3px solid transparent",
    flexDirection: "column",
    gap: 6
  },
  roadmapPhaseBlue: { borderTopColor: "#3b82f6", backgroundColor: "#eff6ff" },
  roadmapPhaseTeal: { borderTopColor: "#14b8a6", backgroundColor: "#f0fdfa" },
  roadmapPhaseGreen: { borderTopColor: "#22c55e", backgroundColor: "#f0fdf4" },
  roadmapLabel: {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    color: colors.slate500
  },
  roadmapText: {
    fontSize: 10,
    lineHeight: 1.5,
    color: colors.slate600
  },
  leadershipCard: {
    borderRadius: 8,
    padding: "10px 12px",
    borderLeft: "4px solid transparent"
  },
  leadershipTeal: { backgroundColor: "#f0fdfa", borderLeftColor: "#14b8a6" },
  leadershipGreen: { backgroundColor: "#f0fdf4", borderLeftColor: "#22c55e" },
  leadershipText: {
    fontSize: 10.5,
    lineHeight: 1.6,
    color: colors.slate600
  },
  pageFooter: {
    position: "absolute",
    bottom: 16,
    left: 28,
    right: 28,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: colors.slate400
  }
});

// src/pages/pdfBarChart.tsx
var import_renderer2 = require("@react-pdf/renderer");
var import_react = __toESM(require("react"), 1);
var import_jsx_runtime = require("react/jsx-runtime");
var CHART_HEIGHT = 130;
var CHART_WIDTH = 190;
var BAR_GAP = 8;
var AXIS_LABEL_WIDTH = 16;
function PdfBarChart({ data }) {
  const barAreaWidth = CHART_WIDTH - AXIS_LABEL_WIDTH;
  const barWidth = (barAreaWidth - BAR_GAP * Math.max(0, data.length - 1)) / Math.max(1, data.length);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_renderer2.View, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_renderer2.Svg, { width: CHART_WIDTH, height: CHART_HEIGHT + 14, children: [
    [0, 1, 2, 3, 4, 5].map((tick) => {
      const y = CHART_HEIGHT - tick / 5 * CHART_HEIGHT;
      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        import_renderer2.Text,
        {
          x: 0,
          y: y + 3,
          style: { fontSize: 6.5, fill: "#41474e" },
          children: tick
        },
        `tick-${tick}`
      );
    }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      import_renderer2.Line,
      {
        x1: AXIS_LABEL_WIDTH,
        y1: 0,
        x2: AXIS_LABEL_WIDTH,
        y2: CHART_HEIGHT,
        stroke: colors.border,
        strokeWidth: 1
      }
    ),
    data.map((d, i) => {
      const barHeight = Math.max(10, Math.round(d.score / 5 * CHART_HEIGHT));
      const x = AXIS_LABEL_WIDTH + i * (barWidth + BAR_GAP);
      const y = CHART_HEIGHT - barHeight;
      const fill = barColors[i % barColors.length];
      return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_react.default.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_renderer2.Rect, { x, y, width: barWidth, height: barHeight, fill, rx: 3, ry: 3 }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          import_renderer2.Text,
          {
            x: x + barWidth / 2,
            y: CHART_HEIGHT + 11,
            style: { fontSize: 6.5, fill: colors.slate600, fontWeight: 700, textAnchor: "middle" },
            children: d.label.length > 12 ? `${d.label.slice(0, 11)}\u2026` : d.label
          }
        )
      ] }, d.label);
    })
  ] }) });
}

// src/pages/reportPrintDocument.tsx
var import_jsx_runtime2 = require("react/jsx-runtime");
var SECTION_CODES_WITH_SUMMARY = ["A", "B", "C"];
function isCompositeFactor(factor) {
  const name = factor.factor_name?.toLowerCase() || "";
  return name.includes("composite") || name.includes("insight") || name.includes("integrated");
}
function getSectionSummary(section) {
  const composite = section.factors.find(isCompositeFactor);
  if (composite?.statement) return composite.statement;
  return section.factors[0]?.statement || "A reflective summary for this section will appear here once the AI layer is connected.";
}
function safeName(value) {
  return value?.trim() || "User";
}
function safeSectionText(section, fallback = "Content not available.") {
  return section?.factors?.[0]?.statement || fallback;
}
function getFactorScoreLabel(score) {
  if (score >= 4) return "Strong";
  if (score >= 2) return "Moderate";
  return "Weak";
}
function parseAiBullets(raw) {
  if (!raw) return [];
  return raw.split("\n").map((s) => s.replace(/^[•\-]\s*/, "").trim()).filter(Boolean);
}
function parseJsonFactor(statement) {
  if (!statement) return {};
  try {
    return JSON.parse(statement);
  } catch {
    return {};
  }
}
function getDerivedTakeaways(report) {
  const profileSections = report.sections.filter((s) => SECTION_CODES_WITH_SUMMARY.includes(s.section_code));
  const allFactors = profileSections.flatMap((s) => s.factors.filter((f) => !isCompositeFactor(f)));
  const strongest = [...allFactors].sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 3);
  const weakest = [...allFactors].sort((a, b) => (a.score || 0) - (b.score || 0)).slice(0, 3);
  return {
    focusArea: `Your strongest patterns revolve around ${strongest.map((f) => f.factor_name).join(", ")}. The biggest growth opportunity is to bring more intentional balance to ${weakest.map((f) => f.factor_name).join(", ")}.`,
    actionPlan: [
      "Use your strongest patterns deliberately in leadership, teamwork, and everyday decisions.",
      "Create a simple development habit around the lower-scoring tendencies so they become manageable rather than automatic.",
      "Review this report regularly and revisit the same themes after a few weeks to track growth."
    ],
    roadmap: [
      "Days 1\u201330: reflect on your strongest and weakest patterns and choose one area to improve.",
      "Days 31\u201360: apply a small habit change in work and relationships to test the insight in practice.",
      "Days 61\u201390: review progress, reinforce your strengths, and calibrate the next growth area."
    ],
    leadership: [
      "You are likely to lead with awareness and intention when you can connect your behavior to a clear purpose.",
      "A smooth authority transition will be easier when your natural strengths are paired with deliberate support systems."
    ]
  };
}
function PageFooter({ page }) {
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_renderer3.View, { style: styles.pageFooter, fixed: true, children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_renderer3.Text, { children: "BRET Assessment Report" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_renderer3.Text, { render: ({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}` })
  ] });
}
function CoverPage({ report }) {
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_renderer3.Page, { size: PAGE_SIZE, style: styles.page, children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_renderer3.View, { style: styles.coverWrap, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_renderer3.View, { style: styles.coverLeftColumn, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_renderer3.Text, { style: styles.coverTitle, children: "BRET Behavioral Assessment" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_renderer3.Text, { style: styles.coverSubtitle, children: [
          safeName(report.user?.name),
          ", this report invites you to pause and reflect. It illuminates the nuances of your intrinsic drives and behavioral patterns, offering a foundation for mindful self-awareness and deliberate, intentional growth."
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_renderer3.View, { style: styles.coverRightColumn, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_renderer3.View, { style: styles.coverCard, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_renderer3.Text, { style: [styles.coverLabel, { fontWeight: 700, color: "#000", fontSize: 16 }], children: [
          "Name: ",
          report.user.name
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_renderer3.Text, { style: styles.coverMeta, children: [
          "User Type: ",
          report.user.product_type
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(PageFooter, { page: 1 })
  ] });
}
function DiscoveryLetterPage({ section, report }) {
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_renderer3.Page, { size: PAGE_SIZE, style: styles.page, children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_renderer3.View, { style: styles.letterLayout, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_renderer3.View, { style: styles.letterLeftColumn, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_renderer3.View, { style: styles.iconPlaceholderLarge }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_renderer3.Text, { style: styles.letterTitle, children: "Discovery Letter" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_renderer3.Text, { style: styles.letterSubtitle, children: "Reflect, recalibrate, and advance with intent." })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_renderer3.View, { style: styles.letterRightColumn, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_renderer3.Text, { style: styles.letterGreeting, children: [
          safeName(report.user?.name),
          ","
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_renderer3.Text, { style: styles.letterBody, children: safeSectionText(section, "Welcome to your personalized behavioral assessment.") })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(PageFooter, { page: 2 })
  ] });
}
function DefinitionsPage({ section, index }) {
  const borderColors = [styles.borderCyan, styles.borderBlue, styles.borderDarkBlue, styles.borderSlate];
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_renderer3.Page, { size: PAGE_SIZE, style: styles.page, children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_renderer3.View, { style: styles.sectionHeaderRow, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_renderer3.View, { style: styles.iconPlaceholderSmall }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_renderer3.Text, { style: styles.sectionHeader, children: section.section_name })
    ] }),
    section.section_definitions ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_renderer3.View, { style: [styles.definitionSummary, { backgroundColor: "transparent", borderLeft: "none", padding: "0 0 16px 0" }], children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_renderer3.Text, { style: styles.definitionSummaryText, children: section.section_definitions }) }) : null,
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_renderer3.View, { style: styles.definitionsGrid, children: section.factors.map((factor, i) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_renderer3.View, { style: [styles.definitionCard, borderColors[i % borderColors.length]], children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_renderer3.View, { style: styles.definitionHeaderRow, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_renderer3.View, { style: styles.iconPlaceholderSmall }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_renderer3.Text, { style: styles.definitionTitle, children: factor.factor_name })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_renderer3.Text, { style: styles.definitionText, children: factor.statement || "Definition not available." })
    ] }, i)) }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(PageFooter, { page: index })
  ] });
}
function ProfilePage({ section, index }) {
  const summary = getSectionSummary(section);
  const factors = section.factors.filter((f) => !isCompositeFactor(f));
  const chartData = factors.map((f) => ({ label: f.factor_name, score: f.score || 0 }));
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_renderer3.Page, { size: PAGE_SIZE, style: styles.page, children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_renderer3.View, { style: styles.section, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_renderer3.Text, { style: styles.sectionHeader, children: section.section_name }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_renderer3.View, { style: styles.profileLayout, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_renderer3.View, { style: styles.chartColumn, children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(PdfBarChart, { data: chartData }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_renderer3.Text, { style: styles.chartLegend, children: "Tendency Scale: Low (0-1) \u2022 Moderate (2-3) \u2022 High (4-5)" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_renderer3.View, { style: styles.textColumn, children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_renderer3.View, { style: styles.summaryCard, children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_renderer3.Text, { style: styles.summaryCardLabel, children: "Composite Insight" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_renderer3.Text, { style: styles.summaryCardText, children: summary })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_renderer3.View, { style: styles.factorList, children: factors.map((factor, i) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_renderer3.View, { style: styles.factorItem, children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_renderer3.View, { style: styles.factorHeaderRow, children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_renderer3.Text, { style: styles.factorName, children: factor.factor_name }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_renderer3.Text, { style: styles.factorScore, children: [
                "(",
                getFactorScoreLabel(factor.score || 0),
                ")"
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_renderer3.Text, { style: styles.factorDescription, children: factor.statement || "Description not available." })
          ] }, i)) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(PageFooter, { page: index })
  ] });
}
function TakeawaysPage({ report, index }) {
  const fallback = getDerivedTakeaways(report);
  const overallObservationsSection = report.sections.find(
    (s) => s.section_name === "Overall Observations"
  );
  const overallObservationsText = overallObservationsSection?.factors[0]?.statement || "Overall observations will appear here once the report content is generated.";
  const aiObsSection = report.sections.find((s) => s.section_name === "Overall Observations");
  const integratedFactor = aiObsSection?.factors.find((f) => f.factor_name?.toLowerCase().includes("integrated"));
  const keyTakeawaysFactor = aiObsSection?.factors.find((f) => f.factor_name?.toLowerCase().includes("takeaway"));
  const aiKeyTakeaways = keyTakeawaysFactor?.statement ? parseAiBullets(keyTakeawaysFactor.statement) : null;
  const agendaSection = report.sections.find((s) => s.section_name === "Action Agenda");
  const focusAreasFactor = agendaSection?.factors.find((f) => f.factor_name === "Focus Areas");
  const roadmapFactor = agendaSection?.factors.find((f) => f.factor_name === "Roadmap");
  const sscFactor = agendaSection?.factors.find((f) => f.factor_name === "SSC Framework");
  const aiRoadmap = parseJsonFactor(roadmapFactor?.statement);
  const aiSsc = parseJsonFactor(sscFactor?.statement);
  const aiFocusAreas = focusAreasFactor?.statement ? parseAiBullets(focusAreasFactor.statement) : null;
  const focusAreaText = integratedFactor?.statement || fallback.focusArea;
  const actionItems = aiFocusAreas && aiFocusAreas.length ? aiFocusAreas : aiKeyTakeaways?.slice(0, 3)?.length ? aiKeyTakeaways.slice(0, 3) : fallback.actionPlan;
  const leadershipItems = aiKeyTakeaways && aiKeyTakeaways.length > 3 ? aiKeyTakeaways.slice(3) : fallback.leadership;
  const roadmapPhases = aiRoadmap["30"] || aiRoadmap["60"] || aiRoadmap["90"] ? [
    { label: "30 Days: Reflect", text: aiRoadmap["30"] || fallback.roadmap[0], style: styles.roadmapPhaseBlue },
    { label: "60 Days: Engage", text: aiRoadmap["60"] || fallback.roadmap[1], style: styles.roadmapPhaseTeal },
    { label: "90 Days: Integrate", text: aiRoadmap["90"] || fallback.roadmap[2], style: styles.roadmapPhaseGreen }
  ] : fallback.roadmap.map((text, i) => ({
    label: ["30 Days: Reflect", "60 Days: Engage", "90 Days: Integrate"][i],
    text,
    style: [styles.roadmapPhaseBlue, styles.roadmapPhaseTeal, styles.roadmapPhaseGreen][i]
  }));
  const profileSections = report.sections.filter((s) => SECTION_CODES_WITH_SUMMARY.includes(s.section_code));
  const allFactors = profileSections.flatMap((s) => s.factors.filter((f) => !isCompositeFactor(f)));
  const topStrengths = [...allFactors].sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 3);
  const devPriorities = [...allFactors].sort((a, b) => (a.score || 0) - (b.score || 0)).slice(0, 4);
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_renderer3.Page, { size: PAGE_SIZE, style: styles.page, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_renderer3.Text, { style: styles.sectionHeader, children: "Key Takeaways" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_renderer3.View, { style: styles.summaryCard, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_renderer3.Text, { style: styles.summaryCardLabel, children: "Overall Observations" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_renderer3.Text, { style: styles.summaryCardText, children: overallObservationsText })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_renderer3.View, { style: styles.obsGrid, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_renderer3.View, { style: styles.obsCard, children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_renderer3.Text, { style: styles.obsCardTitle, children: "Focus Areas" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_renderer3.Text, { style: [styles.summaryCardText, { fontWeight: 600, fontStyle: "normal", color: "#1f2937" }], children: focusAreaText }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_renderer3.Text, { style: [styles.obsPill, styles.obsPillTeal], children: "Strengths to Leverage" }),
          topStrengths.map((f, i) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_renderer3.Text, { style: styles.obsListItem, children: [
            "\u2013 ",
            f.factor_name,
            " (",
            f.score,
            "/5)"
          ] }, i)),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_renderer3.Text, { style: [styles.obsPill, styles.obsPillRose], children: "Development Priorities" }),
          devPriorities.map((f, i) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_renderer3.Text, { style: styles.obsListItem, children: [
            "\u2013 ",
            f.factor_name,
            " (",
            f.score,
            "/5)"
          ] }, i))
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_renderer3.View, { style: styles.obsCard, children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_renderer3.Text, { style: styles.obsCardTitle, children: "90-Day Roadmap" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_renderer3.View, { style: styles.roadmapRow, children: roadmapPhases.map((phase, i) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_renderer3.View, { style: [styles.roadmapPhase, phase.style], children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_renderer3.Text, { style: styles.roadmapLabel, children: phase.label }),
            typeof phase.text === "string" ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_renderer3.Text, { style: styles.roadmapText, children: phase.text }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_renderer3.View, { children: [
              phase.text.action && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_renderer3.Text, { style: styles.roadmapText, children: [
                "Action: ",
                phase.text.action
              ] }),
              phase.text.goal && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_renderer3.Text, { style: styles.roadmapText, children: [
                "Goal: ",
                phase.text.goal
              ] })
            ] })
          ] }, i)) })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(PageFooter, { page: index })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_renderer3.Page, { size: PAGE_SIZE, style: styles.page, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_renderer3.View, { style: styles.obsGrid, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_renderer3.View, { style: styles.obsCard, children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_renderer3.Text, { style: styles.obsCardTitle, children: "Key Takeaways & Action Plan" }),
          actionItems.map((item, i) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_renderer3.Text, { style: styles.obsListItem, children: [
            "\u2013 ",
            item
          ] }, i)),
          (aiSsc.start || aiSsc.stop || aiSsc["continue"]) && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_renderer3.Text, { style: [styles.obsPill, styles.obsPillGray, { marginTop: 10 }], children: "SSC Framework" }),
            aiSsc.start && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_renderer3.Text, { style: styles.obsListItem, children: [
              "START \u2014 ",
              aiSsc.start
            ] }),
            aiSsc.stop && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_renderer3.Text, { style: styles.obsListItem, children: [
              "STOP \u2014 ",
              aiSsc.stop
            ] }),
            aiSsc["continue"] && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_renderer3.Text, { style: styles.obsListItem, children: [
              "CONTINUE \u2014 ",
              aiSsc["continue"]
            ] })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_renderer3.View, { style: styles.obsCard, children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_renderer3.Text, { style: styles.obsCardTitle, children: "Leadership Dynamics" }),
          leadershipItems.map((item, i) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
            import_renderer3.View,
            {
              style: [styles.leadershipCard, i % 2 === 0 ? styles.leadershipTeal : styles.leadershipGreen],
              children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_renderer3.Text, { style: styles.leadershipText, children: item })
            },
            i
          ))
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(PageFooter, { page: index + 1 })
    ] })
  ] });
}
function ReportPrintDocument({ report }) {
  const discoveryLetter = report.sections.find((s) => s.section_name === "Discovery Letter");
  const overallObservations = report.sections.find((s) => s.section_name === "Overall Observations");
  const definitionPages = report.sections.filter(
    (s) => s.section_code === "DEF" || s.section_name.includes("Definitions")
  );
  const profilePages = report.sections.filter((s) => SECTION_CODES_WITH_SUMMARY.includes(s.section_code));
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_renderer3.Document, { title: `BRET Assessment \u2014 ${report.user.name}`, children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(CoverPage, { report }),
    discoveryLetter && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(DiscoveryLetterPage, { section: discoveryLetter, report }),
    definitionPages.map((section, i) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(DefinitionsPage, { section, index: i }, `def-${i}`)),
    profilePages.map((section, i) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(ProfilePage, { section, index: i }, `profile-${i}`)),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(TakeawaysPage, { report, index: 0 })
  ] });
}

// src/pages/scripts/renderReport.tsx
var import_jsx_runtime3 = require("react/jsx-runtime");
async function main() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  const inputData = Buffer.concat(chunks).toString("utf-8");
  if (!inputData) {
    console.error("No data provided to stdin");
    process.exit(1);
  }
  const reportData = JSON.parse(inputData);
  const stream = await (0, import_renderer4.renderToStream)(/* @__PURE__ */ (0, import_jsx_runtime3.jsx)(ReportPrintDocument, { report: reportData }));
  stream.pipe(process.stdout);
}
main().catch((err) => {
  console.error("PDF generation failed:", err);
  process.exit(1);
});
