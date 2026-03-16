import { notFound } from 'next/navigation';
import Link from 'next/link';
import { readAllDocs, readDocBySlug } from '@/lib/content/read-docs';
import { MarkdownView } from '@/components/markdown-view';

export const revalidate = 3600;

export function generateStaticParams() {
  return readAllDocs().map((d) => ({ slug: d.slug }));
}

export default function DocDetail({ params }: { params: { slug: string[] } }) {
  const doc = readDocBySlug(params.slug);
  if (!doc) return notFound();
  return (
    <main className="container">
      <p><Link href="/docs">← Docs index</Link></p>
      <MarkdownView markdown={doc.markdown} />
    </main>
  );
}
