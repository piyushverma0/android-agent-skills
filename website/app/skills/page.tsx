import { readSkillsIndex } from '@/lib/content/read-skills';
import { SkillsFilterClient } from '@/components/skills-filter-client';

export const revalidate = 3600;

export default function SkillsPage() {
  const index = readSkillsIndex();
  return (
    <main className="container">
      <h1>Skills</h1>
      <p className="kicker">Filter by impact coverage, topic, and trigger keywords.</p>
      <SkillsFilterClient skills={index.skills} />
    </main>
  );
}
