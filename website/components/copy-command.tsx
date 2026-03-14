'use client';

import { useState } from 'react';
import { trackEvent } from '@/lib/track';

export function CopyCommand({ command, location }: { command: string; location: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="command">
      <span>{command}</span>
      <button
        className="btn"
        aria-label="Copy install command"
        onClick={async () => {
          await navigator.clipboard.writeText(command);
          trackEvent('install_copy_click', { location, command_variant: command });
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        }}
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}
