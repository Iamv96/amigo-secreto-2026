// Helper to reliably parse currency prices (especially Chilean CLP with dot thousands separators)
export function parseCleanPrice(raw: any, currency = 'CLP'): number | null {
  if (typeof raw === 'number' && !isNaN(raw) && raw > 0) {
    if (currency === 'CLP' && raw < 100 && raw % 1 !== 0) {
      return Math.round(raw * 1000);
    }
    return Math.round(raw);
  }
  if (typeof raw !== 'string') return null;
  const str = raw.trim();
  if (!str) return null;

  // Format with Chilean dot thousands separator (e.g. "22.990", "$ 24.990", "1.299.990")
  if (/\b\d{1,3}(?:\.\d{3})+(?:,\d{2})?\b/.test(str)) {
    const withoutDecimals = str.split(',')[0];
    const num = parseInt(withoutDecimals.replace(/[^0-9]/g, ''), 10);
    if (!isNaN(num) && num > 0) return num;
  }

  // Generic digits extraction
  const clean = str.replace(/[^0-9]/g, '');
  const num = parseInt(clean, 10);
  // Guard against capturing SKU numbers or phone numbers as prices (e.g. > $10.000.000 CLP)
  if (num > 10000000) return null;
  return !isNaN(num) && num > 0 ? num : null;
}

// Helper to resolve relative URL to absolute
export function resolveUrl(pathOrUrl: string | null | undefined, baseUrl: string): string | null {
  if (!pathOrUrl) return null;
  const trimmed = pathOrUrl.trim().replace(/^&quot;|&quot;$/g, '').replace(/^['"]|['"]$/g, '');
  if (!trimmed) return null;
  try {
    return new URL(trimmed, baseUrl).href;
  } catch {
    return null;
  }
}

// Helper regex search in HTML
export function extractMeta(html: string, regex: RegExp): string | null {
  if (!html) return null;
  const match = html.match(regex);
  return match ? match[1] : null;
}
