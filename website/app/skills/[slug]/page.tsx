import type { Metadata } from 'next';
import Link from 'next/link';
import { readSkill, readSkillsIndex } from '@/lib/content/read-skills';
import { PageEvent } from '@/components/page-event';

export const revalidate = 3600;

export function generateStaticParams() {
  return readSkillsIndex().skills.map((s) => ({ slug: s.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const skill = readSkill(params.slug);
  return {
    title: skill.name,
    description: skill.description,
    alternates: { canonical: `/skills/${params.slug}` }
  };
}

export default function SkillDetailPage({ params }: { params: { slug: string } }) {
  const skill = readSkill(params.slug);
  const impactEntries = Object.entries(skill.impactCoverage).filter(([, v]) => v > 0);
  return (
    <main className="container grid" style={{ gap: 16 }}>
      <PageEvent name="skill_page_visit" payload={{ slug: params.slug, source_route: 'skills' }} />
      <h1>{skill.name}</h1>
      <p style={{ color: 'var(--text-secondary)' }}>{skill.description}</p>
      <div className="command"><span>{skill.installSnippet}</span></div>

      <section className="card">
        <h2>Triggers</h2>
        {skill.triggers.map((t) => <span className="chip" key={t}>{t}</span>)}
      </section>

      <section className="card">
        <h2>Rule groups by impact</h2>
        <ul>
          {impactEntries.map(([k, v]) => <li key={k}>{k}: {v}</li>)}
        </ul>
      </section>

      <section className="card">
        <h2>Common mistakes highlights</h2>
        <ul>{skill.commonMistakesHighlights.map((h, i) => <li key={i}>{h.heading} (line {h.line})</li>)}</ul>
      </section>

      <section className="card">
        <h2>References</h2>
        <ul>{skill.references.map((r) => <li key={r.path}><Link href={`https://github.com/piyushverma0/android-agent-skills/blob/main/${r.path}`}>{r.title || r.path}</Link></li>)}</ul>
      </section>

      <p><Link href="/docs">Docs</Link> · <Link href="/audit">Audit</Link> · <Link href="/skills">Back to skills</Link></p>
    </main>
  );
}
