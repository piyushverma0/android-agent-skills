import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import type { DocPage } from './types';

const docsDir = path.join(process.cwd(), '..', 'docs', 'website', 'docs-pages');

export function readAllDocs(): DocPage[] {
  return fs.readdirSync(docsDir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const full = path.join(docsDir, f);
      const raw = fs.readFileSync(full, 'utf8');
      const parsed = matter(raw);
      const title = parsed.content.split('\n')[0].replace(/^#\s+/, '').trim();
      const slug = f.replace(/\.md$/, '').split('/');
      return { slug, title, markdown: parsed.content };
    });
}

export function readDocBySlug(slug: string[]): DocPage | undefined {
  const key = slug.join('/');
  return readAllDocs().find((d) => d.slug.join('/') === key);
}
