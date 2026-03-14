import Link from 'next/link';
import { readAllDocs } from '@/lib/content/read-docs';

export default function DocsIndexPage() {
  const docs = readAllDocs();
  return (
    <main className="container sidebar">
      <aside className="card">
        <h3>Documentation</h3>
        <ul>
          {docs.map((d) => (
            <li key={d.slug.join('/')}>
              <Link href={`/docs/${d.slug.join('/')}`}>{d.title}</Link>
            </li>
          ))}
        </ul>
      </aside>
      <section>
        <h1>Documentation</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Discover installation, trigger behavior, progressive disclosure, agent compatibility, FAQs, and examples.</p>
      </section>
    </main>
  );
}
