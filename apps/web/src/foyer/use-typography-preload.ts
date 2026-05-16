import { useEffect } from 'react';

interface TypographyEntry {
  id: string;
  font_url: string;
}

interface TypographyRegistry {
  typography: TypographyEntry[];
}

// §22.4: pre-load the typography registry on foyer entry so the dial
// doesn't stall the first time the needle sweeps onto a new shell's
// name. The architect's note: ~200 shells × ~20KB = ~4MB, acceptable.
// We use rel=preload link tags so the browser handles the cache and
// won't double-fetch when the actual font is later requested.
export function useTypographyPreload(): void {
  useEffect(() => {
    let cancelled = false;
    const added: HTMLLinkElement[] = [];
    void fetch('/api/typography/registry', { credentials: 'include' })
      .then((res) => (res.ok ? (res.json() as Promise<TypographyRegistry>) : null))
      .then((reg) => {
        if (cancelled || !reg) return;
        for (const entry of reg.typography) {
          const link = document.createElement('link');
          link.rel = 'preload';
          link.as = 'font';
          link.type = 'font/woff2';
          link.crossOrigin = 'anonymous';
          link.href = entry.font_url;
          document.head.append(link);
          added.push(link);
        }
      })
      .catch(() => {
        // Silent: a failed preload only costs us a per-shell stall later.
      });
    return () => {
      cancelled = true;
      for (const link of added) link.remove();
    };
  }, []);
}
