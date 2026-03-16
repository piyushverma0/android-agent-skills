export function MarkdownView({ markdown }: { markdown: string }) {
  const lines = markdown.split('\n');
  return (
    <div>
      {lines.map((line, idx) => {
        if (line.startsWith('### ')) return <h3 key={idx}>{line.replace('### ', '')}</h3>;
        if (line.startsWith('## ')) return <h2 key={idx}>{line.replace('## ', '')}</h2>;
        if (line.startsWith('# ')) return <h1 key={idx}>{line.replace('# ', '')}</h1>;
        if (line.startsWith('- ')) return <p key={idx} style={{ color: 'var(--text-secondary)' }}>• {line.replace('- ', '')}</p>;
        if (line.startsWith('```')) return null;
        if (!line.trim()) return <br key={idx} />;
        return <p key={idx} style={{ color: 'var(--text-secondary)' }}>{line}</p>;
      })}
    </div>
  );
}
