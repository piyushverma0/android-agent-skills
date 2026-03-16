import { readAuditReport } from '@/lib/content/read-audit';
import { PageEvent } from '@/components/page-event';

export const revalidate = 3600;

function icon(status: 'pass' | 'warn' | 'fail') {
  return status === 'pass' ? '✅' : status === 'warn' ? '⚠️' : '❌';
}

export default function AuditPage() {
  const report = readAuditReport();
  const counts = {
    pass: report.skills.filter((s) => s.badge === 'pass').length,
    warn: report.skills.filter((s) => s.badge === 'warn').length,
    fail: report.skills.filter((s) => s.badge === 'fail').length,
  };

  return (
    <main className="container grid" style={{ gap: 16 }}>
      <PageEvent name="audit_page_engagement" payload={{ time_on_page_s: 0, filter_count: 0, expanded_skill_count: 0 }} />
      <h1>Audit</h1>
      <div className="grid grid-2">
        <div className="card"><h3>Global score</h3><p>{report.globalScore} ({report.globalBadge})</p></div>
        <div className="card"><h3>Badges</h3><p>✅ {counts.pass} · ⚠️ {counts.warn} · ❌ {counts.fail}</p></div>
      </div>

      <table className="table" aria-label="Skill audit table">
        <thead>
          <tr><th>Skill</th><th>Badge</th><th>Score</th><th>Completeness</th><th>Compliance</th><th>Freshness</th><th>Docs</th></tr>
        </thead>
        <tbody>
          {report.skills.map((skill) => (
            <tr key={skill.slug}>
              <td>{skill.slug}</td>
              <td>{icon(skill.badge)} {skill.badge}</td>
              <td>{skill.score}</td>
              <td>{Object.values(skill.completeness).map((c) => icon(c.status)).join(' ')}</td>
              <td>{Object.values(skill.compliance).map((c) => icon(c.status)).join(' ')}</td>
              <td>{Object.values(skill.freshness).map((c) => icon(c.status)).join(' ')}</td>
              <td>{Object.values(skill.documentation).map((c) => icon(c.status)).join(' ')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
