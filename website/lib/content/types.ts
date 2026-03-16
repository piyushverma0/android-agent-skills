export type SkillSummary = {
  slug: string;
  name: string;
  description: string;
  triggers: string[];
  topic: string[];
  tags: string[];
  ruleCountMetadata: number;
  ruleCountRulesDir: number;
  impactCoverage: Record<string, number>;
};

export type SkillsIndex = {
  platform: string;
  installCommand: string;
  repoFacts: {
    skills: number;
    rulesFromRulesDirs: number;
    rulesClaimedInReadme: number;
    progressiveDisclosureLevels: number;
  };
  skills: SkillSummary[];
};

export type SkillDetail = SkillSummary & {
  references: { path: string; title: string }[];
  commonMistakesHighlights: { line: number; heading: string }[];
  installSnippet: string;
};

export type AuditReport = {
  globalScore: number;
  globalBadge: 'pass' | 'warn' | 'fail';
  skills: Array<{
    slug: string;
    score: number;
    badge: 'pass' | 'warn' | 'fail';
    completeness: Record<string, { status: 'pass' | 'warn' | 'fail'; message: string }>;
    compliance: Record<string, { status: 'pass' | 'warn' | 'fail'; message: string }>;
    freshness: Record<string, { status: 'pass' | 'warn' | 'fail'; message: string }>;
    documentation: Record<string, { status: 'pass' | 'warn' | 'fail'; message: string }>;
  }>;
};

export type DocPage = {
  slug: string[];
  title: string;
  markdown: string;
};
