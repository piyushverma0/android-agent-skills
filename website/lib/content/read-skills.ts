import fs from 'node:fs';
import path from 'node:path';
import type { SkillDetail, SkillsIndex } from './types';

const dataDir = path.join(process.cwd(), '..', 'docs', 'website', 'skills-data');

export function readSkillsIndex(): SkillsIndex {
  const raw = fs.readFileSync(path.join(dataDir, 'skills-index.json'), 'utf8');
  return JSON.parse(raw) as SkillsIndex;
}

export function readSkill(slug: string): SkillDetail {
  const raw = fs.readFileSync(path.join(dataDir, `${slug}.json`), 'utf8');
  return JSON.parse(raw) as SkillDetail;
}
