'use client';

import { useEffect } from 'react';
import { trackEvent } from '@/lib/track';

export function PageEvent({ name, payload }: { name: string; payload: Record<string, string | number> }) {
  useEffect(() => {
    trackEvent(name, payload);
  }, [name, payload]);

  return null;
}
