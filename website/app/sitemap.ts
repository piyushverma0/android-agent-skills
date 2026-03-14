import type { MetadataRoute } from 'next';
import { readAllDocs } from '@/lib/content/read-docs';
import { readSkillsIndex } from '@/lib/content/read-skills';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://android-skill.vercel.app';
  const docs = readAllDocs().map((d) => ({ url: `${base}/docs/${d.slug.join('/')}` }));
  const skills = readSkillsIndex().skills.map((s) => ({ url: `${base}/skills/${s.slug}` }));
  return [
    { url: `${base}/` },
    { url: `${base}/docs` },
    { url: `${base}/skills` },
    { url: `${base}/audit` },
    ...docs,
    ...skills,
  ];
}
