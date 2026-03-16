'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { SkillSummary } from '@/lib/content/types';

export function SkillsFilterClient({ skills }: { skills: SkillSummary[] }) {
  const [q, setQ] = useState('');
  const [impact, setImpact] = useState('');
  const [topic, setTopic] = useState('');

  const topics = useMemo(() => Array.from(new Set(skills.flatMap((s) => s.topic))).sort(), [skills]);

  const filtered = useMemo(() => skills.filter((s) => {
    if (impact && (s.impactCoverage[impact] ?? 0) <= 0) return false;
    if (topic && !s.topic.includes(topic)) return false;
    if (q) {
      const hay = `${s.name} ${s.description} ${s.tags.join(' ')} ${s.triggers.join(' ')}`.toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    return true;
  }), [skills, q, impact, topic]);

  return (
    <>
      <div className="card" style={{ marginBottom: 16 }}>
        <input aria-label="Search skills" placeholder="Search..." value={q} onChange={(e) => setQ(e.target.value)} />{' '}
        <select aria-label="Impact filter" value={impact} onChange={(e) => setImpact(e.target.value)}>
          <option value="">All impacts</option><option>CRITICAL</option><option>HIGH</option><option>MEDIUM</option><option>LOW</option>
        </select>{' '}
        <select aria-label="Topic filter" value={topic} onChange={(e) => setTopic(e.target.value)}>
          <option value="">All topics</option>
          {topics.map((t) => <option key={t}>{t}</option>)}
        </select>{' '}
        <button className="btn" onClick={() => { setQ(''); setImpact(''); setTopic(''); }}>Reset</button>
      </div>
      <div className="grid grid-2">
        {filtered.map((s) => (
          <article key={s.slug} className="card">
            <h3><Link href={`/skills/${s.slug}`}>{s.name}</Link></h3>
            <p style={{ color: 'var(--text-secondary)' }}>{s.description.slice(0, 160)}...</p>
            <p>{s.ruleCountRulesDir} rules</p>
            <div>{s.triggers.slice(0, 5).map((t) => <span className="chip" key={t}>{t}</span>)}</div>
          </article>
        ))}
      </div>
    </>
  );
}
