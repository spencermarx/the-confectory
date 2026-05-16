// Shared client config for the three §15.3 custom views. The Worker
// API lives at a different origin than the CMS, so we resolve the
// base URL from the env at component-render time. NEXT_PUBLIC_* is
// exposed to the browser by the Payload Next.js host.

export function apiBase(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8787';
}
