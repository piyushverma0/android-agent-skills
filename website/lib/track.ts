export function trackEvent(name: string, payload: Record<string, string | number>) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('analytics-event', { detail: { name, payload } }));
  // Hook external analytics SDK here when configured.
}
