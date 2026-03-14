import fs from 'node:fs';
import path from 'node:path';
import type { AuditReport } from './types';

const file = path.join(process.cwd(), '..', 'docs', 'website', 'audit-data', 'audit-report.json');

export function readAuditReport(): AuditReport {
  const raw = fs.readFileSync(file, 'utf8');
  return JSON.parse(raw) as AuditReport;
}
