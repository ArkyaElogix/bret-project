import { Document, Page, View, Text, Image } from '@react-pdf/renderer';
import type { ReportFactor, ReportSection, SessionReport, OrientationInsightMap } from '../api/sessions';
import { styles, PAGE_SIZE } from './reportPDFStyles';
import { PdfBarChart } from './pdfBarChart';
import leadershipImage from './images/orientation/Leadership.jpeg';
import teamImage from './images/orientation/Team.jpeg';
import motivationImage from './images/orientation/Motivation.jpeg';
import changeImage from './images/orientation/Change.jpeg';
import stressImage from './images/orientation/Stress.jpeg';
import { getScoreLabel } from '../utils/scoreLabel';
const SECTION_CODES_WITH_SUMMARY = ['A', 'B', 'C'];

const ORIENTATION_IMAGE_MAP: Record<string, string> = {
  'leadership style': leadershipImage,
  'team orientation': teamImage,
  'motivation driver': motivationImage,
  'change driver': changeImage,
  'stress response': stressImage,
};

function getOrientationImageSrc(factorName?: string | null): string {
  const normalized = (factorName || '').toLowerCase().trim();
  return ORIENTATION_IMAGE_MAP[normalized] ?? leadershipImage;
}


// ── Same helper logic as the on-screen report, ported as plain functions ──

function isCompositeFactor(factor: ReportFactor) {
  const name = factor.factor_name?.toLowerCase() || '';
  return name.includes('composite') || name.includes('insight') || name.includes('integrated');
}

function getSectionSummary(section: ReportSection) {
  const composite = section.factors.find(isCompositeFactor);
  if (composite?.statement) return composite.statement;
  return section.factors[0]?.statement || 'A reflective summary for this section will appear here once the AI layer is connected.';
}

function safeName(value?: string | null) {
  return value?.trim() || 'User';
}

function safeSectionText(section?: ReportSection | null, fallback = 'Content not available.') {
  return section?.factors?.[0]?.statement || fallback;
}



function parseAiBullets(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw
    .split('\n')
    .map((s) => s.replace(/^[•\-]\s*/, '').trim())
    .filter(Boolean);
}

function parseJsonFactor(statement: string | null | undefined): any {
  if (!statement) return {};
  try {
    return JSON.parse(statement);
  } catch {
    return {};
  }
}

// ── Page footer, shown on every page ──────────────────────────

function PageFooter({ page }: { page: number }) {
  return (
    <View style={styles.pageFooter} fixed>
      <Text>BRET Assessment Report</Text>
      <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
    </View>
  );
}

// ── Individual page components ────────────────────────────────
function CoverPage({ report }: { report: SessionReport }) {
  return (
    <Page size={PAGE_SIZE} style={styles.page}>
      <View style={styles.coverWrap}>
        <View style={styles.coverLeftColumn}>
          <Text style={styles.coverTitle}>BRET Behavioral Assessment</Text>
          <Text style={styles.coverSubtitle}>
            {safeName(report.user?.name)}, this report invites you to pause and reflect. It illuminates the nuances of your
            intrinsic drives and behavioral patterns, offering a foundation for mindful self-awareness and
            deliberate, intentional growth.
          </Text>
        </View>

        <View style={styles.coverRightColumn}>
          <View style={styles.coverCard}>
            <Text style={[styles.coverLabel, { fontWeight: 700, color: '#000', fontSize: 16 }]}>
              Name: {report.user.name}
            </Text>
            <Text style={styles.coverMeta}>User Type: {report.user.product_type}</Text>
          </View>
        </View>
      </View>
      <PageFooter page={1} />
    </Page>
  );
}

function DiscoveryLetterPage({ section, report }: { section: ReportSection; report: SessionReport }) {
  return (
    <Page size={PAGE_SIZE} style={styles.page}>
      <View style={styles.letterLayout}>
        <View style={styles.letterLeftColumn}>
          <View style={styles.iconPlaceholderLarge}></View>
          <Text style={styles.letterTitle}>Discovery Letter</Text>
          <Text style={styles.letterSubtitle}>
            Reflect, recalibrate, and advance with intent.
          </Text>
        </View>

        <View style={styles.letterRightColumn}>
          <Text style={styles.letterGreeting}>
            {safeName(report.user?.name)},
          </Text>
          <Text style={styles.letterBody}>
            {safeSectionText(section, 'Welcome to your personalized behavioral assessment.')}
          </Text>
        </View>
      </View>
      <PageFooter page={2} />
    </Page>
  );
}

function DefinitionsPage({ section, index }: { section: ReportSection; index: number }) {
  const borderColors = [styles.borderCyan, styles.borderBlue, styles.borderDarkBlue, styles.borderSlate];

  return (
    <Page size={PAGE_SIZE} style={styles.page}>
      <View style={styles.sectionHeaderRow}>
        <View style={styles.iconPlaceholderSmall}></View>
        <Text style={styles.sectionHeader}>{section.section_name}</Text>
      </View>

      {section.section_definitions ? (
        <View style={[styles.definitionSummary, { backgroundColor: 'transparent', borderLeft: 'none', padding: '0 0 16px 0' }]}>
          <Text style={styles.definitionSummaryText}>
            {section.section_definitions}
          </Text>
        </View>
      ) : null}

      <View style={styles.definitionsGrid}>
        {section.factors.map((factor, i) => (
          <View key={i} style={[styles.definitionCard, borderColors[i % borderColors.length]]}>
            <View style={styles.definitionHeaderRow}>
              <View style={styles.iconPlaceholderSmall}></View>
              <Text style={styles.definitionTitle}>{factor.factor_name}</Text>
            </View>
            <Text style={styles.definitionText}>{factor.statement || 'Definition not available.'}</Text>
          </View>
        ))}
      </View>
      <PageFooter page={index} />
    </Page>
  );
}

const FactorBlock = ({ factor }: { factor: ReportFactor }) => (
  <View style={styles.factorItem}>
    <View style={styles.factorHeaderRow}>
      <Text style={styles.factorName}>{factor.factor_name}</Text>
      <Text style={styles.factorScore}>({getScoreLabel(factor.score || 0)})</Text>
    </View>
    <Text style={styles.factorDescription}>
      {factor.statement || 'Description not available.'}
    </Text>
  </View>
);


function ProfilePage({ section, index }: { section: ReportSection; index: number }) {
  const summary = getSectionSummary(section);
  const realFactors = section.factors.filter((f) => !isCompositeFactor(f));
  const chartData = realFactors.map((f) => ({ label: f.factor_name, score: f.score || 0 }));
  // First 2 go left (below the chart), rest go right (below composite insight)
  const leftFactors = realFactors.slice(0, 2);
  const rightSpillFactors = realFactors.slice(2);
  return (
    <Page size={PAGE_SIZE} style={styles.page}>
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>{section.section_name}</Text>

        <View style={styles.profileLayout}>
          <View style={styles.profileLeft}>
            <View style={styles.chartArea}>
              <PdfBarChart data={chartData} />
              <Text style={styles.chartLegend}>Tendency Scale: Low (0-1) • Moderate (2-3) • High (4-5)</Text>
            </View>
            {leftFactors.map((factor, i) => (
              <FactorBlock key={`left-${i}`} factor={factor} />
            ))}
          </View>
          <View style={styles.profileRight}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryCardLabel}>Composite Insight</Text>
              <Text style={styles.summaryCardText}>{summary}</Text>
            </View>
            {rightSpillFactors.map((factor, i) => (
              <FactorBlock key={`right-${i}`} factor={factor} />
            ))}
          </View>
        </View>
      </View>
      <PageFooter page={index} />
    </Page>
  );
}

function OrientationPage({ factor, index }: { factor: ReportFactor; index: number }) {
  const title = factor.factor_name || 'Orientation Insight';
  const body = factor.statement || 'No insight available.';
  const imageSrc = getOrientationImageSrc(title);

  return (
    <Page size={PAGE_SIZE} style={styles.page}>

      <View style={styles.orientationHeader}>
        <View style={styles.iconPlaceholderSmall} />
        <Text style={styles.sectionHeader}>{title}</Text>
      </View>

      <View style={styles.orientationBody}>
        <View style={styles.orientationLeft}>
          <View style={styles.orientationCategoryBadge}>
            <Text style={styles.orientationCategoryText}>ORIENTATION</Text>
          </View>
          <View style={styles.orientationContentCard}>
            <Text style={styles.orientationBodyText}>{body}</Text>
          </View>
        </View>

        <View style={styles.orientationRight}>
          <Image src={imageSrc} style={styles.orientationImage} />
        </View>
      </View>

      <PageFooter page={index + 1} />
    </Page>
  );
}


function TakeawaysPage({ report, index }: { report: SessionReport; index: number }) {
  const fallback = {
    focusArea: 'Your strongest patterns revolve around your most natural tendencies. The biggest growth opportunity is to build more intentional balance in the areas that feel less natural.',
    actionPlan: [
      'Use your strongest patterns deliberately in leadership, teamwork, and everyday decisions.',
      'Create a simple development habit around the lower-scoring tendencies so they become manageable rather than automatic.',
      'Review this report regularly and revisit the same themes after a few weeks to track growth.',
    ],
    roadmap: [
      'Days 1–30: reflect on your strongest and weakest patterns and choose one area to improve.',
      'Days 31–60: apply a small habit change in work and relationships to test the insight in practice.',
      'Days 61–90: review progress, reinforce your strengths, and calibrate the next growth area.',
    ],
    leadership: [
      'You are likely to lead with awareness and intention when you can connect your behavior to a clear purpose.',
      'A smooth authority transition will be easier when your natural strengths are paired with deliberate support systems.',
    ],
  };

  const overallObservationsSection = report.sections.find(
    (s) => s.section_name === 'Overall Observations'
  );
  const overallObservationsText =
    overallObservationsSection?.factors[0]?.statement ||
    'Overall observations will appear here once the report content is generated.';

  const aiObsSection = report.sections.find((s) => s.section_name === 'Overall Observations');
  const integratedFactor = aiObsSection?.factors.find((f) => f.factor_name?.toLowerCase().includes('integrated'));
  const keyTakeawaysFactor = aiObsSection?.factors.find((f) => f.factor_name?.toLowerCase().includes('takeaway'));
  const aiKeyTakeaways = keyTakeawaysFactor?.statement ? parseAiBullets(keyTakeawaysFactor.statement) : null;

  const agendaSection = report.sections.find((s) => s.section_name === 'Action Agenda');
  const focusAreasFactor = agendaSection?.factors.find((f) => f.factor_name === 'Focus Areas');
  const roadmapFactor = agendaSection?.factors.find((f) => f.factor_name === 'Roadmap');
  const sscFactor = agendaSection?.factors.find((f) => f.factor_name === 'SSC Framework');

  const aiRoadmap = parseJsonFactor(roadmapFactor?.statement);
  const aiSsc = parseJsonFactor(sscFactor?.statement);
  const aiFocusAreas = focusAreasFactor?.statement ? parseAiBullets(focusAreasFactor.statement) : null;

  const focusAreaText = integratedFactor?.statement || fallback.focusArea;
  const actionItems =
    aiFocusAreas && aiFocusAreas.length
      ? aiFocusAreas
      : aiKeyTakeaways?.slice(0, 3)?.length
        ? aiKeyTakeaways.slice(0, 3)
        : fallback.actionPlan;

  const leadershipItems = aiKeyTakeaways && aiKeyTakeaways.length > 3 ? aiKeyTakeaways.slice(3) : fallback.leadership;

  const roadmapPhases =
    aiRoadmap['30'] || aiRoadmap['60'] || aiRoadmap['90']
      ? [
        { label: '30 Days: Reflect', text: aiRoadmap['30'] || fallback.roadmap[0], style: styles.roadmapPhaseBlue },
        { label: '60 Days: Engage', text: aiRoadmap['60'] || fallback.roadmap[1], style: styles.roadmapPhaseTeal },
        { label: '90 Days: Integrate', text: aiRoadmap['90'] || fallback.roadmap[2], style: styles.roadmapPhaseGreen },
      ]
      : fallback.roadmap.map((text, i) => ({
        label: ['30 Days: Reflect', '60 Days: Engage', '90 Days: Integrate'][i],
        text,
        style: [styles.roadmapPhaseBlue, styles.roadmapPhaseTeal, styles.roadmapPhaseGreen][i],
      }));

  const profileSections = report.sections.filter((s) => SECTION_CODES_WITH_SUMMARY.includes(s.section_code));
  const allFactors = profileSections.flatMap((s) => s.factors.filter((f) => !isCompositeFactor(f)));
  const topStrengths = [...allFactors].sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 3);
  const devPriorities = [...allFactors].sort((a, b) => (a.score || 0) - (b.score || 0)).slice(0, 4);

  const overflowDevToRight = focusAreaText.length > 200 || devPriorities.length > 4;

  return (
  <>
    <Page size={PAGE_SIZE} style={styles.page}>
      <Text style={styles.sectionHeader}>Key Takeaways</Text>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryCardLabel}>Overall Observations</Text>
        <Text style={styles.summaryCardText}>{overallObservationsText}</Text>
      </View>

      <View style={styles.obsGrid}>
        <View style={styles.obsCard}>
          <Text style={styles.obsCardTitle}>Focus Areas</Text>
          <Text style={styles.focusAreaText}>{focusAreaText}</Text>

          <View style={styles.subCardRow}>
            <View style={[styles.subCard, styles.subCardTeal]}>
              <Text style={styles.subCardLabel}>Strengths to Leverage</Text>
              {topStrengths.map((f, i) => (
                <Text key={i} style={styles.subCardListItem}>
                  – {f.factor_name} ({f.score}/5)
                </Text>
              ))}
            </View>

            {!overflowDevToRight && (
              <View style={[styles.subCard, styles.subCardRose]}>
                <Text style={styles.subCardLabel}>Development Priorities</Text>
                {devPriorities.map((f, i) => (
                  <Text key={i} style={styles.subCardListItem}>
                    – {f.factor_name} ({f.score}/5)
                  </Text>
                ))}
              </View>
            )}
          </View>
        </View>

        <View style={styles.obsCard}>
          <Text style={styles.obsCardTitle}>90-Day Roadmap</Text>
          <View style={styles.roadmapRow}>
            {roadmapPhases.map((phase, i) => (
              <View key={i} style={[styles.roadmapPhase, phase.style]}>
                <Text style={styles.roadmapLabel}>{phase.label}</Text>
                {typeof phase.text === 'string' ? (
                  <Text style={styles.roadmapText}>{phase.text}</Text>
                ) : (
                  <View>
                    {phase.text.action && <Text style={styles.roadmapText}>Action: {phase.text.action}</Text>}
                    {phase.text.goal && <Text style={styles.roadmapText}>Goal: {phase.text.goal}</Text>}
                  </View>
                )}
              </View>
            ))}
          </View>

          {overflowDevToRight && (
            <View style={[styles.subCard, styles.subCardRose, { marginTop: 10 }]}>
              <Text style={styles.subCardLabel}>Development Priorities</Text>
              {devPriorities.map((f, i) => (
                <Text key={i} style={styles.subCardListItem}>
                  – {f.factor_name} ({f.score}/5)
                </Text>
              ))}
            </View>
          )}
        </View>
      </View>
      <PageFooter page={index} />
    </Page>

      <Page size={PAGE_SIZE} style={styles.page}>
        <View style={styles.obsGrid}>
          <View style={styles.obsCard}>
            <Text style={styles.obsCardTitle}>Key Takeaways & Action Plan</Text>
            {actionItems.map((item, i) => (
              <Text key={i} style={styles.obsListItem}>
                – {item}
              </Text>
            ))}

            {(aiSsc.start || aiSsc.stop || aiSsc['continue']) && (
              <>
                <Text style={[styles.obsPill, styles.obsPillGray, { marginTop: 10 }]}>SSC Framework</Text>
                {aiSsc.start && <Text style={styles.obsListItem}>START — {aiSsc.start}</Text>}
                {aiSsc.stop && <Text style={styles.obsListItem}>STOP — {aiSsc.stop}</Text>}
                {aiSsc['continue'] && <Text style={styles.obsListItem}>CONTINUE — {aiSsc['continue']}</Text>}
              </>
            )}
          </View>

          <View style={styles.obsCard}>
            <Text style={styles.obsCardTitle}>Leadership Dynamics</Text>
            {leadershipItems.map((item, i) => (
              <View
                key={i}
                style={[styles.leadershipCard, i % 2 === 0 ? styles.leadershipTeal : styles.leadershipGreen]}
              >
                <Text style={styles.leadershipText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>
        <PageFooter page={index + 1} />
      </Page>
    </>
  );
}

// ── Top-level document ────────────────────────────────────────

export function ReportPrintDocument({ report }: { report: SessionReport }) {
  const discoveryLetter = report.sections.find((s) => s.section_name === 'Discovery Letter');
  const isExecutive =
    String(report.user?.product_type || '').toUpperCase() === 'EXECUTIVE';

  const definitionPages = report.sections.filter(
    (s) => s.section_code === 'DEF' || s.section_name.includes('Definitions')
  );
  const profilePages = report.sections.filter((s) => SECTION_CODES_WITH_SUMMARY.includes(s.section_code));

  const orientationSection = report.sections.find((s) => s.section_code === 'O' && s.section_name === 'Orientation Insights');
  const orientationFactors = isExecutive && orientationSection ? orientationSection.factors || [] : [];

  return (
    <Document title={`BRET Assessment — ${report.user.name}`}>
      <CoverPage report={report} />

      {discoveryLetter && <DiscoveryLetterPage section={discoveryLetter} report={report} />}

      {definitionPages.map((section, i) => (
        <DefinitionsPage key={`def-${i}`} section={section} index={i} />
      ))}

      {profilePages.map((section, i) => (
        <ProfilePage key={`profile-${i}`} section={section} index={i} />
      ))}

      {orientationFactors.length > 0 &&
        orientationFactors.map((factor, i) => (
          <OrientationPage key={`orientation-${i}`} factor={factor} index={i} />
        ))}

      <TakeawaysPage report={report} index={0} />
    </Document>
  );
}