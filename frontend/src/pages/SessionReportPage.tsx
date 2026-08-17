import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getSessionReport, type ReportFactor, type ReportSection, type SessionReport, type OrientationInsightMap } from '../api/sessions';
import './report-template.css';
import { pdf } from '@react-pdf/renderer';
import { ReportPrintDocument } from './reportPrintDocument';
import leadershipImage from './images/orientation/Leadership.jpeg';
import teamImage from './images/orientation/Team.jpeg';
import motivationImage from './images/orientation/Motivation.jpeg';
import changeImage from './images/orientation/Change.jpeg';
import stressImage from './images/orientation/Stress.jpeg';

const SECTION_CODES_WITH_SUMMARY = ['A', 'B', 'C'];
const BAR_COLORS = ['#1B4FD8', '#14B8A6', '#8B5CF6', '#F59E0B'];
const ORIENTATION_IMAGE_MAP: OrientationInsightMap = {
  leadership: leadershipImage,
  team: teamImage,
  motivation: motivationImage,
  change: changeImage,
  stress: stressImage,
};

function getOrientationImageSrc(factorName?: string | null): string {
  const key = (factorName || '').toLowerCase().trim();
  if (!key) return ORIENTATION_IMAGE_MAP.leadership as string;

  const match = Object.keys(ORIENTATION_IMAGE_MAP).find((name) => key.includes(name));
  return (match ? ORIENTATION_IMAGE_MAP[match] : ORIENTATION_IMAGE_MAP.leadership) as string;
}


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
      <h2 className="bret-section-header">{section.section_name} <span className='rounded bg-blue-300'>✦</span> </h2>
      
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
                const pct = Math.max(10, Math.round(((factor.score || 0) / 5) * 100));
                return (
                  <div key={factorIndex} className="bret-vertical-bar-group">
                    <div className="bret-vertical-bar-track">
                      <div
                        className="bret-vertical-bar-fill"
                        style={{
                          height: `${pct}%`,
                          
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
            <span>Tendency Scale: Low (0-1) • Moderate (2-3) • High (4-5)</span>
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
      {section.section_definitions ? (
        <div className="bret-definition-summary" style={{fontSize:'0.85em', padding:'20px', fontFamily:'Arial, sans-serif', color:'teal', fontWeight:'bold', fontStyle:'italic'}}>
          <p>{section.section_definitions}</p>
        </div>
      ) : null}
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

function parseAiBullets(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw
    .split('\n')
    .map((s) => s.replace(/^[•\-]\s*/, '').trim())
    .filter(Boolean);
}

async function handleDownloadPdf(report: SessionReport) {
  try {
    const blob = await pdf(<ReportPrintDocument report={report} />).toBlob();

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BRET-Report-${(report.user?.name || 'user').replace(/\s+/g, '-')}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('PDF export failed:', err);
    alert('PDF export failed. Please check the report data and try again.');
  }
}
function parseJsonFactor(statement: string | null | undefined): any {
  if (!statement) return {};
  try { return JSON.parse(statement); } catch { return {}; }
}

function renderOrientationSection(section: ReportSection, index: number) {
  const isExecutive =
    String(section?.section_name || '').toLowerCase() === 'orientation insights'
      ? true
      : true;

  if (!isExecutive || !section?.factors?.length) return null;

  return (
    <section key={index} className="bret-section bret-orientation-section">
      <h2 className="bret-section-header">Orientation Insights</h2>

      <div className="bret-orientation-grid">
        {section.factors.map((factor, factorIndex) => {
          const label = factor.factor_name || 'Orientation Insight';
          const body = factor.statement || 'No insight available.';
          const imageSrc = getOrientationImageSrc(label);

          return (
            <article key={`${index}-${factorIndex}`} className="bret-orientation-card">
              <div className="bret-orientation-header">
                <span className="bret-orientation-badge">✦</span>
                <span className="bret-orientation-title">{label}</span>
              </div>

              <div className="bret-orientation-body">
                <div className="bret-orientation-copy">
                  <div className="bret-orientation-subtitle">
                    {factor.statement_title || 'Behavioral Insight'}
                  </div>
                  <div className="bret-orientation-text-box">
                    <p>{body}</p>
                  </div>
                </div>

                <div className="bret-orientation-image-wrap">
                  <img
                    src={imageSrc}
                    alt={label}
                    className="bret-orientation-image"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = ORIENTATION_IMAGE_MAP.leadership as string;
                    }}
                  />
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function renderTakeawaysSection(report: SessionReport) {
  const fallback = getDerivedTakeaways(report);

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
        <h2 className="bret-section-header">Key Takeaways</h2>
        {isAiPowered && (
          <span className="bret-obs-ai-badge">✦ AI Generated</span>
        )}
      </div>

      <div className="bret-obs-grid">
        <div className="bret-obs-card">
          <div className="bret-obs-card-header">
            <span className="bret-obs-badge bret-obs-badge--orange">⬡</span>
            <span className="bret-obs-card-title">Focus Areas</span>
          </div>
          <p className="bret-obs-integrated font-semibold text-gray-800">{focusAreaText}</p>

          <div className="bret-obs-pill bret-obs-pill--teal">STRENGTHS TO LEVERAGE</div>
          <ul className="bret-obs-list">
            {topStrengths.map((f, i) => (
              <li key={i}>
                {f.factor_name}
                <span className="bret-obs-score text-black"> ({f.score}/5)</span>
              </li>
            ))}
          </ul>

          <div className="bret-obs-pill bret-obs-pill--rose">DEVELOPMENT PRIORITIES</div>
          <ul className="bret-obs-list">
            {devPriorities.map((f, i) => (
              <li key={i}>
                {f.factor_name}
                <span className="bret-obs-score text-black"> ({f.score}/5)</span>
              </li>
            ))}
          </ul>
        </div>

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

      <div className="bret-obs-grid bret-obs-grid--mt">
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


function renderFullReport(report: SessionReport) {
  const discoveryLetter = report.sections.find(
    (section) => section.section_name === 'Discovery Letter'
  );
  const overallObservations = report.sections.find(
    (section) => section.section_name === 'Overall Observations'
  );
  const orientationSection = report.sections.find(
    (section) => section.section_name === 'Orientation Insights'
  );
  const isExecutive = String(report.user?.product_type || '').toUpperCase() === 'EXECUTIVE';

  return (
    <>
      <div className="bret-cover">
        <h1>BRET Behavioral Assessment</h1>
        <p className="bret-cover-subtitle">
          {report.user.name}, this report invites you to pause and reflect. It
          illuminates the nuances of your intrinsic drives and behavioral
          patterns, offering a foundation for mindful self-awareness and
          deliberate, intentional growth.
        </p>
        <div className="bret-cover-card">
          <div className="bret-cover-label font-bold text-black text-lg">
            Name: {report.user.name}
          </div>
          <div className="bret-cover-meta font-semibold text-yellow-700">
            User Type: {report.user.product_type}
          </div>
        </div>
      </div>

      {discoveryLetter && (
        <section className="bret-section">
          <h2 className="bret-section-header">Discovery Letter</h2>
          <div className="bret-summary-card">
            <p>
              {discoveryLetter.factors[0]?.statement ||
                'Welcome to your personalized behavioral assessment.'}
            </p>
          </div>
        </section>
      )}

      {report.sections.map((section, index) => {
        if (section.section_name === 'Discovery Letter') return null;
        if (section.section_name === 'Overall Observations') return null;
        if (section.section_name === 'Orientation Insights') return null;

        if (
          section.section_code === 'DEF' ||
          section.section_name.includes('Definitions')
        ) {
          return renderDefinitionsSection(section, index);
        }

        if (SECTION_CODES_WITH_SUMMARY.includes(section.section_code)) {
          return renderProfileSection(section, index);
        }

        return null;
      })}

      {isExecutive && orientationSection && (
        <>
          {renderOrientationSection(orientationSection, 0)}
        </>
      )}

      {overallObservations && (
        <section className="bret-section">
          <h2 className="bret-section-header">Overall Observations  <span className='rounded bg-blue-300'>✦</span></h2>
          <div className="bret-summary-card">
            <p className='text-gray-800'>
              {overallObservations.factors[0]?.statement ||
                'Overall observations will appear here once the report content is generated.'}
            </p>
          </div>
        </section>
      )}

      {renderTakeawaysSection(report)}
    </>
  );
}
// ─────────────────────────────────────────────────────────────────────────
// Slide assembly
//
// Each entry the reader flips through on screen (and each page when
// printing) is built here as one { id, label, node } record, in the same
// order the original single-scroll page used to render sections.
// ─────────────────────────────────────────────────────────────────────────
type Slide = { id: string; label: string; node: ReactNode };

function buildSlides(report: SessionReport): Slide[] {
  const slides: Slide[] = [];

  slides.push({
    id: 'cover',
    label: 'Overview',
    node: (
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
    ),
  });

  const discoveryLetter = report.sections.find((section) => section.section_name === 'Discovery Letter');
  if (discoveryLetter) {
    slides.push({
      id: 'discovery-letter',
      label: 'Discovery Letter',
      node: (
        <section className="bret-section">
          <h2 className="bret-section-header">Discovery Letter</h2>
          <div className="bret-summary-card">
            <p>{discoveryLetter.factors[0]?.statement || 'Welcome to your personalized behavioral assessment.'}</p>
          </div>
        </section>
      ),
    });
  }

  report.sections.forEach((section, index) => {
    if (section.section_name === 'Discovery Letter') return;
    if (section.section_name === 'Overall Observations') return;
    if (section.section_name === 'Orientation Insights') return;

    if (section.section_code === 'DEF' || section.section_name.includes('Definitions')) {
      slides.push({
        id: `def-${index}`,
        label: section.section_name,
        node: renderDefinitionsSection(section, index),
      });
      return;
    }

    if (SECTION_CODES_WITH_SUMMARY.includes(section.section_code)) {
      slides.push({
        id: `profile-${index}`,
        label: section.section_name,
        node: renderProfileSection(section, index),
      });
    }
  });

  const orientationSection = report.sections.find((section) => section.section_name === 'Orientation Insights');
  if (String(report.user?.product_type || '').toUpperCase() === 'EXECUTIVE' && orientationSection && orientationSection.factors?.length) {
    slides.push({
      id: 'orientation-insights',
      label: 'Orientation Insights',
      node: renderOrientationSection(orientationSection, 0) || (
        <section className="bret-section">
          <h2 className="bret-section-header">Orientation Insights</h2>
          <div className="bret-summary-card">
            <p>No orientation insight data is available for this profile.</p>
          </div>
        </section>
      ),
    });
  }

  const overallObservations = report.sections.find((section) => section.section_name === 'Overall Observations');
  if (overallObservations) {
    slides.push({
      id: 'overall-observations',
      label: 'Overall Observations',
      node: (
        <section className="bret-section">
          <h2 className="bret-section-header">Overall Observations</h2>
          <div className="bret-summary-card">
            <p>{overallObservations.factors[0]?.statement || 'Overall observations will appear here once the report content is generated.'}</p>
          </div>
        </section>
      ),
    });
  }

  slides.push({
    id: 'takeaways',
    label: 'Key Takeaways',
    node: renderTakeawaysSection(report),
  });

  return slides;
}

interface SessionReportViewProps {
  sessionId: number;
  reportToken?: string;
}

export function SessionReportView({
  sessionId,
  reportToken,
}: SessionReportViewProps) {
  const [report, setReport] = useState<SessionReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [slideIndex, setSlideIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'slides' | 'full'>('slides');

  useEffect(() => {
    setLoading(true);
    setError(null);

    getSessionReport(sessionId, reportToken)
      .then((data) => {
        setReport(data);
        setSlideIndex(0);
      })
      .catch((err) => {
        console.error('Failed to load report:', err);
        setError('Failed to load report. Please try again.');
      })
      .finally(() => setLoading(false));
  }, [sessionId, reportToken]);

  const slides = useMemo(() => (report ? buildSlides(report) : []), [report]);

  const goPrev = useCallback(() => {
    setSlideIndex((i) => Math.max(i - 1, 0));
  }, []);

  const goNext = useCallback(() => {
    setSlideIndex((i) => Math.min(i + 1, Math.max(slides.length - 1, 0)));
  }, [slides.length]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goNext, goPrev]);

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

  const currentSlide = slides[slideIndex];

  return (
    <div className="bret-page-shell">
      <div className="bret-report-shell">
        <div className="bret-topbar no-print">
          <div className="bret-topbar-links">
            <Link to={`/portal/sessions/${sessionId}/results`} className="bret-topbar-button">
              ← Back to Results
            </Link>
            <Link to="/portal" className="bret-topbar-button">
              ← Dashboard
            </Link>
            <button
              type="button"
              className="bret-topbar-button"
              onClick={() => setViewMode(viewMode === 'slides' ? 'full' : 'slides')}
            >
              {viewMode === 'slides' ? 'Full Page' : 'Slide View'}
            </button>
          </div>
          <button
            type="button"
            onClick={() => handleDownloadPdf(report)}
            className="bret-topbar-primary"
          >
            Print / Save PDF
          </button>
        </div>

        <div className="bret-report-body">
          {viewMode === 'slides' ? (
            <>
              <div className="bret-slide-nav no-print">
                <button
                  onClick={goPrev}
                  disabled={slideIndex === 0}
                  className="bret-slide-nav-button"
                  aria-label="Previous slide"
                >
                  ← Prev
                </button>

                <div className="bret-slide-dots">
                  {slides.map((slide, i) => (
                    <button
                      key={slide.id}
                      onClick={() => setSlideIndex(i)}
                      className={`bret-slide-dot ${i === slideIndex ? 'bret-slide-dot--active' : ''}`}
                      aria-label={`Go to ${slide.label}`}
                      title={slide.label}
                    />
                  ))}
                </div>

                <span className="bret-slide-counter">
                  {slideIndex + 1} / {slides.length}
                  {currentSlide ? ` · ${currentSlide.label}` : ''}
                </span>

                <button
                  onClick={goNext}
                  disabled={slideIndex === slides.length - 1}
                  className="bret-slide-nav-button"
                  aria-label="Next slide"
                >
                  Next →
                </button>
              </div>

              <div className="bret-slide-stage">
                {slides.map((slide, i) => (
                  <div
                    key={slide.id}
                    className={`bret-slide ${i === slideIndex ? 'bret-slide--active' : 'bret-slide--hidden'}`}
                  >
                    {slide.node}
                  </div>
                ))}
              </div>
              <p className="bret-slide-hint no-print">Use the ← → arrow keys to move between slides.</p>
            </>
          ) : (
            <div className="bret-full-report">{renderFullReport(report)}</div>
          )}
        </div>
      </div>
    </div>
  );
}

export function SessionReportPage() {
  const { id } = useParams<{ id: string }>();
  const params = new URLSearchParams(window.location.search);
  const reportToken = params.get('report_token') || undefined;

  if (!id) {
    return (
      <div className="bret-page-shell bret-page-loading">
        <div className="bret-error-card">
          <p>Invalid session ID.</p>
          <Link to="/portal">Return to dashboard</Link>
        </div>
      </div>
    );
  }

  const sessionId = Number(id);
  if (Number.isNaN(sessionId)) {
    return (
      <div className="bret-page-shell bret-page-loading">
        <div className="bret-error-card">
          <p>Invalid session ID.</p>
          <Link to="/portal">Return to dashboard</Link>
        </div>
      </div>
    );
  }

  return <SessionReportView sessionId={sessionId} reportToken={reportToken} />;
}