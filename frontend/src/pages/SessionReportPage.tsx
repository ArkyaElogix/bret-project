import { useEffect, useState, type CSSProperties } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getSessionReport, type ReportFactor, type ReportSection, type SessionReport } from '../api/sessions';
import './report-template.css';

const SECTION_CODES_WITH_SUMMARY = ['A', 'B', 'C'];
const BAR_COLORS = ['#1B4FD8', '#14B8A6', '#8B5CF6', '#F59E0B'];

function isCompositeFactor(factor: ReportFactor) {
  const name = factor.factor_name?.toLowerCase() || '';
  return name.includes('composite') || name.includes('insight') || name.includes('integrated');
}

function getSectionSummary(section: ReportSection) {
  const composite = section.factors.find(isCompositeFactor);
  if (composite?.statement) return composite.statement;
  return section.factors[0]?.statement || 'A reflective summary for this section will appear here once the AI layer is connected.';
}

function getFactorScoreLabel(score: number) {
  if (score >= 4) return 'Strong';
  if (score >= 2) return 'Moderate';
  return 'Weak';
}

function getDerivedTakeaways(report: SessionReport) {
  const profileSections = report.sections.filter((section) => SECTION_CODES_WITH_SUMMARY.includes(section.section_code));
  const allFactors = profileSections.flatMap((section) => section.factors.filter((factor) => !isCompositeFactor(factor)));

  const sortedByScore = [...allFactors].sort((a, b) => (b.score || 0) - (a.score || 0));
  const sortedByLowScore = [...allFactors].sort((a, b) => (a.score || 0) - (b.score || 0));

  const strongest = sortedByScore.slice(0, 3);
  const weakest = sortedByLowScore.slice(0, 3);

  return {
    focusArea: `Your strongest patterns revolve around ${strongest.map((factor) => factor.factor_name).join(', ')}. The biggest growth opportunity is to bring more intentional balance to ${weakest.map((factor) => factor.factor_name).join(', ')}.`,
    strengths: strongest.map((factor) => `${factor.factor_name} (${factor.score}/5)`).join(' • '),
    development: weakest.map((factor) => `${factor.factor_name} (${factor.score}/5)`).join(' • '),
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
}

function renderProfileSection(section: ReportSection, index: number) {
  const summary = getSectionSummary(section);
  const factors = section.factors.filter((factor) => !isCompositeFactor(factor));

  return (
    <section key={index} className="bret-section">
      <h2 className="bret-section-header">{section.section_name}</h2>
      {/* <div className="bret-profile-layout">
        <div className="bret-profile-main">
          <div className="bret-summary-card">
            <h3>Composite Insight</h3>
            <p>{summary}</p>
          </div>
          <div className="bret-factor-list">
            {factors.map((factor, factorIndex) => (
              <div key={factorIndex} className="bret-factor-card">
                <div className="bret-factor-header">
                  <span className="bret-factor-name">{factor.factor_name}</span>
                  <span className="bret-factor-score">
                    {getFactorScoreLabel(factor.score || 0)} ({factor.score || 0}/5)
                  </span>
                </div>
                <p className="bret-factor-description">{factor.statement || 'Description not available.'}</p>
              </div>
            ))}
          </div>
        </div>

        <aside className="bret-score-panel">
          <h3>Behavior Factor Scores</h3>
          {factors.map((factor, factorIndex) => {
            const pct = Math.max(8, ((factor.score || 0) / 5) * 100);
            return (
              <div key={factorIndex} className="bret-score-row">
                <div className="bret-score-label-row">
                  <span>{factor.factor_name}</span>
                  <strong>{factor.score || 0}/5</strong>
                </div>
                <div className="bret-score-bar-track">
                  <div
                    className="bret-score-bar-fill"
                    style={{ width: `${pct}%`, background: BAR_COLORS[factorIndex % BAR_COLORS.length] }}
                  />
                </div>
              </div>
            );
          })}
        </aside>
      </div> */}
      <div className="bret-profile-layout">
        <aside className="bret-score-panel-vertical">
          <div className="bret-chart-wrapper">
            <div className="bret-chart-y-axis">
              <span>5</span>
              <span>4</span>
              <span>3</span>
              <span>2</span>
              <span>1</span>
              <span>0</span>
            </div>
            <div className="bret-chart-container">
              {factors.map((factor, factorIndex) => {
                const pct = Math.max(2, ((factor.score || 0) / 5) * 100);
                return (
                  <div key={factorIndex} className="bret-vertical-bar-group">
                    <div className="bret-vertical-bar-track">
                      <div
                        className="bret-vertical-bar-fill"
                        style={{
                          height: `100%`,
                          transform: `scaleY(${pct / 100})`,
                          transformOrigin: 'bottom',
                          background: BAR_COLORS[factorIndex % BAR_COLORS.length]
                        }}
                      />
                    </div>
                    <span className="bret-vertical-bar-label">{factor.factor_name}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="bret-chart-legend">
            <span>Tendency Scale: Low (0-2) • Moderate (3) • High (4-5)</span>
          </div>
        </aside>

        <div className="bret-profile-main">
          <div className="bret-summary-card">
            <h3>Composite Insight</h3>
            <p>{summary}</p>
          </div>
          <div className="bret-factor-list">
            {factors.map((factor, factorIndex) => (
              <div key={factorIndex} className="bret-factor-item">
                <div className="bret-factor-header">
                  <span className="bret-factor-name">{factor.factor_name}</span>
                  <span className="bret-factor-score">
                    ({getFactorScoreLabel(factor.score || 0)})
                  </span>
                </div>
                <p className="bret-factor-description">{factor.statement || 'Description not available.'}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

    </section>
  );
}

function renderDefinitionsSection(section: ReportSection, index: number) {
  return (
    <section key={index} className="bret-section">
      <h2 className="bret-section-header">{section.section_name}</h2>
      <div className="bret-definitions">
        {section.factors.map((factor, factorIndex) => (
          <div key={factorIndex} className="bret-definition-card">
            <h4>{factor.factor_name}</h4>
            <p>{factor.statement || 'Definition not available.'}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// function parseAiBullets(raw: string): string[] {
//   return raw
//     .split('\n')
//     .map((s) => s.replace(/^[•\-]\s*/, '').trim())
//     .filter(Boolean);
// }

// function parseJsonFactor(statement: string | undefined): Record<string, string> {
//   if (!statement) return {};
//   try { return JSON.parse(statement); } catch { return {}; }
// }

function parseAiBullets(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw
    .split('\n')
    .map((s) => s.replace(/^[•\-]\s*/, '').trim())
    .filter(Boolean);
}

function parseJsonFactor(statement: string | null | undefined): any {
  if (!statement) return {};
  try { return JSON.parse(statement); } catch { return {}; }
}


function renderTakeawaysSection(report: SessionReport) {
  const fallback = getDerivedTakeaways(report);

  // ── AI data: Overall Observations section ──────────────────────────────
  const aiObsSection = report.sections.find(
    (s) => s.section_name === 'Overall Observations'
  );
  const integratedFactor = aiObsSection?.factors.find((f) =>
    f.factor_name?.toLowerCase().includes('integrated')
  );
  const keyTakeawaysFactor = aiObsSection?.factors.find((f) =>
    f.factor_name?.toLowerCase().includes('takeaway')
  );
  const aiKeyTakeaways = keyTakeawaysFactor?.statement
    ? parseAiBullets(keyTakeawaysFactor.statement)
    : null;

  // ── AI data: Action Agenda section ─────────────────────────────────────
  const agendaSection = report.sections.find(
    (s) => s.section_name === 'Action Agenda'
  );
  const focusAreasFactor = agendaSection?.factors.find(
    (f) => f.factor_name === 'Focus Areas'
  );
  const roadmapFactor = agendaSection?.factors.find(
    (f) => f.factor_name === 'Roadmap'
  );
  const sscFactor = agendaSection?.factors.find(
    (f) => f.factor_name === 'SSC Framework'
  );

  const aiRoadmap = parseJsonFactor(roadmapFactor?.statement);
  const aiSsc = parseJsonFactor(sscFactor?.statement);
  const aiFocusAreas = focusAreasFactor?.statement
    ? parseAiBullets(focusAreasFactor.statement)
    : null;

  // ── Merged content: AI-first, fallback to derived ──────────────────────
  const focusAreaText = integratedFactor?.statement || fallback.focusArea;
  const actionItems =
    aiFocusAreas && aiFocusAreas.length
      ? aiFocusAreas
      : aiKeyTakeaways?.slice(0, 3) && aiKeyTakeaways.slice(0, 3).length
        ? aiKeyTakeaways.slice(0, 3)
        : fallback.actionPlan;

  const leadershipItems =
    aiKeyTakeaways && aiKeyTakeaways.length > 3
      ? aiKeyTakeaways.slice(3)
      : fallback.leadership;

  const roadmapPhases =
    aiRoadmap['30'] || aiRoadmap['60'] || aiRoadmap['90']
      ? [
        { label: '30 Days: Reflect', text: aiRoadmap['30'] || fallback.roadmap[0] },
        { label: '60 Days: Engage', text: aiRoadmap['60'] || fallback.roadmap[1] },
        { label: '90 Days: Integrate', text: aiRoadmap['90'] || fallback.roadmap[2] },
      ]
      : fallback.roadmap.map((text, i) => ({
        label: ['30 Days: Reflect', '60 Days: Engage', '90 Days: Integrate'][i],
        text,
      }));

  // ── Score-derived data (always from scores — most accurate) ─────────────
  const profileSections = report.sections.filter((s) =>
    SECTION_CODES_WITH_SUMMARY.includes(s.section_code)
  );
  const allFactors = profileSections.flatMap((s) =>
    s.factors.filter((f) => !isCompositeFactor(f))
  );
  const topStrengths = [...allFactors]
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 3);
  const devPriorities = [...allFactors]
    .sort((a, b) => (a.score || 0) - (b.score || 0))
    .slice(0, 4);

  const isAiPowered = !!(integratedFactor || agendaSection);

  const phaseColors = [
    'bret-obs-phase--blue',
    'bret-obs-phase--teal',
    'bret-obs-phase--green',
  ] as const;

  return (
    <section className="bret-section bret-obs-section">
      <div className="bret-obs-section-header">
        <h2 className="bret-section-header">Overall Observations &amp; Key Takeaways</h2>
        {isAiPowered && (
          <span className="bret-obs-ai-badge">✦ AI Generated</span>
        )}
      </div>

      {/* ── Row 1: Focus Areas  |  90-Day Roadmap ── */}
      <div className="bret-obs-grid">
        {/* LEFT: Focus Areas */}
        <div className="bret-obs-card">
          <div className="bret-obs-card-header">
            <span className="bret-obs-badge bret-obs-badge--orange">⬡</span>
            <span className="bret-obs-card-title">Focus Areas</span>
          </div>
          <p className="bret-obs-integrated">{focusAreaText}</p>

          <div className="bret-obs-pill bret-obs-pill--teal">STRENGTHS TO LEVERAGE</div>
          <ul className="bret-obs-list">
            {topStrengths.map((f, i) => (
              <li key={i}>
                {f.factor_name}
                <span className="bret-obs-score"> ({f.score}/5)</span>
              </li>
            ))}
          </ul>

          <div className="bret-obs-pill bret-obs-pill--rose">DEVELOPMENT PRIORITIES</div>
          <ul className="bret-obs-list">
            {devPriorities.map((f, i) => (
              <li key={i}>
                {f.factor_name}
                <span className="bret-obs-score"> ({f.score}/5)</span>
              </li>
            ))}
          </ul>
        </div>

        {/* RIGHT: 90-Day Roadmap */}
        <div className="bret-obs-card">
          <div className="bret-obs-card-header">
            <span className="bret-obs-badge bret-obs-badge--blue">📅</span>
            <span className="bret-obs-card-title">90-Day Roadmap</span>
          </div>
          <div className="bret-obs-roadmap">
            {roadmapPhases.map((phase, i) => (
              <div key={i} className={`bret-obs-phase ${phaseColors[i]}`}>
                <div className="bret-obs-phase-label">{phase.label}</div>
                {typeof phase.text === 'string' ? (
                  <p>{phase.text}</p>
                ) : (
                  <div>
                    {phase.text.action && (
                      <p><strong>Action:</strong> {phase.text.action}</p>
                    )}
                    {phase.text.goal && (
                      <div className='font-semibold text-blue-600'><p><strong>Goal:</strong> {phase.text.goal}</p></div>
                    )}
                    {/* If there are other keys, render them as fallback lines */}
                    {Object.keys(phase.text).filter(k => k !== 'action' && k !== 'goal').map((k) => (
                      <p key={k}><strong>{k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}:</strong> {String(phase.text[k])}</p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Row 2: Key Takeaways  |  Leadership Dynamics ── */}
      <div className="bret-obs-grid bret-obs-grid--mt">
        {/* LEFT: Key Takeaways / Action Plan */}
        <div className="bret-obs-card">
          <div className="bret-obs-card-header">
            <span className="bret-obs-badge bret-obs-badge--indigo">ℹ</span>
            <span className="bret-obs-card-title">Key Takeaways &amp; Action Plan</span>
          </div>
          <ul className="bret-obs-list bret-obs-list--spaced">
            {actionItems.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>

          {/* SSC Framework — only shown when AI data is present */}
          {(aiSsc.start || aiSsc.stop || aiSsc['continue']) && (
            <>
              <div className="bret-obs-pill bret-obs-pill--gray" style={{ marginTop: '16px' }}>
                SSC FRAMEWORK
              </div>
              <div className="bret-obs-ssc">
                {aiSsc.start && (
                  <div className="bret-obs-ssc-item bret-obs-ssc--start">
                    <span className="bret-obs-ssc-label">START</span>
                    <p>{aiSsc.start}</p>
                  </div>
                )}
                {aiSsc.stop && (
                  <div className="bret-obs-ssc-item bret-obs-ssc--stop">
                    <span className="bret-obs-ssc-label">STOP</span>
                    <p>{aiSsc.stop}</p>
                  </div>
                )}
                {aiSsc['continue'] && (
                  <div className="bret-obs-ssc-item bret-obs-ssc--continue">
                    <span className="bret-obs-ssc-label">CONTINUE</span>
                    <p>{aiSsc['continue']}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* RIGHT: Leadership Dynamics */}
        <div className="bret-obs-card">
          <div className="bret-obs-card-header">
            <span className="bret-obs-badge bret-obs-badge--violet">H</span>
            <span className="bret-obs-card-title">Leadership Dynamics</span>
          </div>
          <div className="bret-obs-leadership">
            {leadershipItems.map((item, i) => (
              <div
                key={i}
                className={`bret-obs-leadership-card ${i % 2 === 0
                  ? 'bret-obs-leadership-card--teal'
                  : 'bret-obs-leadership-card--green'
                  }`}
              >
                <p>{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}


export function SessionReportPage() {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<SessionReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    setLoading(true);
    setError(null);

    getSessionReport(Number(id))
      .then(setReport)
      .catch((err) => {
        console.error('Failed to load report:', err);
        setError('Failed to load report. Please try again.');
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="bret-page-shell bret-page-loading">
        <div className="bret-loading-card">
          <div className="bret-spinner" />
          <p>Generating your personalized report…</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="bret-page-shell bret-page-loading">
        <div className="bret-error-card">
          <p>{error || 'Report not found.'}</p>
          <Link to="/portal">Return to dashboard</Link>
        </div>
      </div>
    );
  }

  const discoveryLetter = report.sections.find((section) => section.section_name === 'Discovery Letter');
  const overallObservations = report.sections.find((section) => section.section_name === 'Overall Observations');

  return (
    <div className="bret-page-shell">
      <div className="bret-report-shell">
        <div className="bret-topbar no-print">
          <div className="bret-topbar-links">
            <Link to={`/portal/sessions/${id}/results`} className="bret-topbar-button">
              ← Back to Results
            </Link>
            <Link to="/portal" className="bret-topbar-button">
              ← Dashboard
            </Link>
          </div>
          <button onClick={() => window.print()} className="bret-topbar-primary">
            Print / Save PDF
          </button>
        </div>

        <div className="bret-report-body">
          <div className="bret-cover">
            <h1>BRET Behavioral Assessment</h1>
            <p className="bret-cover-subtitle">
              {report.user.name}, this report invites you to pause and reflect. It illuminates the nuances of your intrinsic drives and behavioral patterns, offering a foundation for mindful self-awareness and deliberate, intentional growth.
            </p>
            <div className="bret-cover-card">
              <div className="bret-cover-label font-bold text-black text-lg">Name: {report.user.name}</div>
              <div className="bret-cover-meta font-semibold text-yellow-700">User Type: {report.user.product_type}</div>

            </div>
          </div>

          {discoveryLetter ? (
            <section className="bret-section">
              <h2 className="bret-section-header">Discovery Letter</h2>
              <div className="bret-summary-card">
                <p>{discoveryLetter.factors[0]?.statement || 'Welcome to your personalized behavioral assessment.'}</p>
              </div>
            </section>
          ) : null}

          {report.sections.map((section, index) => {
            if (section.section_name === 'Discovery Letter') return null;
            if (section.section_code === 'DEF' || section.section_name.includes('Definitions')) {
              return renderDefinitionsSection(section, index);
            }
            if (SECTION_CODES_WITH_SUMMARY.includes(section.section_code)) {
              return renderProfileSection(section, index);
            }
            return null;
          })}

          {overallObservations ? (
            <section className="bret-section">
              <h2 className="bret-section-header">Overall Observations</h2>
              <div className="bret-summary-card">
                <p>{overallObservations.factors[0]?.statement || 'Overall observations will appear here once the report content is generated.'}</p>
              </div>
            </section>
          ) : null}

          {renderTakeawaysSection(report)}
        </div>
      </div>
    </div>
  );
}