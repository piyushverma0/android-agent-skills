import Link from 'next/link';

export function TopNav() {
  return (
    <nav className="nav">
      <Link href="/"><strong>ANDROID-SKILL</strong></Link>
      <div style={{ display: 'flex', gap: 16 }}>
        <Link href="/skills">Skills</Link>
        <Link href="/docs">Docs</Link>
        <Link href="/audit">Audit</Link>
      </div>
    </nav>
  );
}
