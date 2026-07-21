/**
 * Normalize raw utm_source values into clean platform names.
 * Used across analytics APIs and dashboard UI.
 */
export function normalizePlatform(source?: string | null): string {
  if (!source) return 'Direct';

  const s = source.toLowerCase().trim();

  if (s.includes('google')) return 'Google';
  if (s.includes('facebook') || s.includes('meta') || s.includes('instagram')) return 'Meta';
  if (s.includes('youtube')) return 'YouTube';

  return 'Other';
}
