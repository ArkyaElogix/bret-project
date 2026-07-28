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
                        style={{ height: `${pct}%`, background: BAR_COLORS[factorIndex % BAR_COLORS.length] }}
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

function renderTakeawaysSection(report: SessionReport) {
  const takeaways = getDerivedTakeaways(report);

  return (
    <section className="bret-section">
      <h2 className="bret-section-header">Overall Observations & Key Takeaways</h2>
      <div className="bret-takeaways-grid">
        <div className="bret-takeaway-card bret-takeaway-highlight">
          <h3>Focus Area</h3>
          <p>{takeaways.focusArea}</p>
        </div>
        <div className="bret-takeaway-card">
          <h3>Strengths</h3>
          <p>{takeaways.strengths}</p>
        </div>
        <div className="bret-takeaway-card">
          <h3>Development Focus</h3>
          <p>{takeaways.development}</p>
        </div>
      </div>

      <div className="bret-takeaways-grid bret-takeaways-secondary">
        <div className="bret-takeaway-card">
          <h3>Action Plan</h3>
          <ul>
            {takeaways.actionPlan.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ul>
        </div>
        <div className="bret-takeaway-card">
          <h3>90-Day Roadmap</h3>
          <ul>
            {takeaways.roadmap.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ul>
        </div>
        <div className="bret-takeaway-card">
          <h3>Leadership Dynamics</h3>
          <ul>
            {takeaways.leadership.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ul>
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