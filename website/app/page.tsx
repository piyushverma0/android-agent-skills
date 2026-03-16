import Link from 'next/link';
import { CopyCommand } from '@/components/copy-command';
import { readSkillsIndex } from '@/lib/content/read-skills';

export default function HomePage() {
  const index = readSkillsIndex();

  return (
    <main className="container grid" style={{ gap: 28 }}>
      <section className="grid" style={{ gap: 12 }}>
        <p className="kicker">ANDROID-SKILL</p>
        <h1>Production-ready Android development skills for AI coding agents.</h1>
        <CopyCommand command={index.installCommand} location="hero" />
        <div>
          <span className="chip">{index.repoFacts.skills} Skills</span>
          <span className="chip">{index.repoFacts.rulesFromRulesDirs} Rules</span>
          <span className="chip">{index.repoFacts.progressiveDisclosureLevels}-level Progressive Disclosure</span>
        </div>
        <p><Link href="/docs">Docs</Link> · <Link href="/audit">Audit</Link></p>
      </section>

      <section>
        <h2>How it works</h2>
        <ol>
          <li>Install once using the `npx skills add` command.</li>
          <li>Agent auto-matches skills by trigger keywords.</li>
          <li>Rules and references load progressively only when needed.</li>
        </ol>
      </section>

      <section>
        <h2>Featured skills</h2>
        <div className="grid grid-2">
          {index.skills.map((skill) => (
            <article key={skill.slug} className="card">
              <h3><Link href={`/skills/${skill.slug}`}>{skill.name}</Link></h3>
              <p style={{ color: 'var(--text-secondary)' }}>{skill.description.slice(0, 150)}...</p>
              <div>{skill.triggers.slice(0, 4).map((t) => <span className="chip" key={t}>{t}</span>)}</div>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2>Why Android-specific</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Built around MVVM+UDF, Hilt, Coroutines/Flow, Coil, and production patterns like UnauthorizedRestException fixes.</p>
      </section>

      <section>
        <h2>Supported agents</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Claude Code, Codex, Cursor, Gemini CLI, Windsurf, OpenCode and more.</p>
      </section>

      <section>
        <h2>Quick start</h2>
        <CopyCommand command={index.installCommand} location="quick-start" />
      </section>
    </main>
  );
}
