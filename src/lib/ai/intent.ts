/**
 * Intent detection for Marketing Intelligence Assistant.
 * Parses natural language questions into structured intents.
 */

export type AnalyticsIntent =
  | 'TOP_PLATFORM'
  | 'TOP_CAMPAIGN'
  | 'TOP_AD'
  | 'TOP_LANDING_PAGE'
  | 'PLATFORM_LEADS'
  | 'CAMPAIGN_LEADS'
  | 'PLATFORM_COMPARISON'
  | 'GENERAL_OVERVIEW';

export interface DetectedIntent {
  intent: AnalyticsIntent;
  entity?: string; // e.g. platform name or campaign name mentioned
}

const PLATFORM_KEYWORDS = ['google', 'meta', 'facebook', 'instagram', 'youtube'];
const CAMPAIGN_KEYWORDS = ['campaign', 'campaigns'];
const AD_KEYWORDS = ['ad', 'ads', 'creative', 'content', 'video_ad', 'image_ad'];
const LANDING_PAGE_KEYWORDS = ['landing page', 'landing pages', 'page', 'pages', 'url'];

export function detectIntent(question: string): DetectedIntent {
  const q = question.toLowerCase().trim();

  // Check for comparison intent
  if (
    (q.includes('compare') || q.includes('vs') || q.includes('versus') || q.includes('difference')) &&
    PLATFORM_KEYWORDS.some((p) => q.includes(p))
  ) {
    return { intent: 'PLATFORM_COMPARISON' };
  }

  // Check for specific platform lead count
  for (const platform of PLATFORM_KEYWORDS) {
    if (q.includes(platform) && (q.includes('how many') || q.includes('leads') || q.includes('count'))) {
      return { intent: 'PLATFORM_LEADS', entity: platform };
    }
  }

  // Check for specific campaign lead count
  if (q.includes('how many') && CAMPAIGN_KEYWORDS.some((k) => q.includes(k))) {
    return { intent: 'CAMPAIGN_LEADS' };
  }

  // Top / best platform
  if (
    (q.includes('best') || q.includes('top') || q.includes('most') || q.includes('highest') || q.includes('which platform')) &&
    (q.includes('platform') || PLATFORM_KEYWORDS.some((p) => q.includes(p)) || q.includes('source'))
  ) {
    return { intent: 'TOP_PLATFORM' };
  }

  // Top campaign
  if (
    (q.includes('best') || q.includes('top') || q.includes('most') || q.includes('highest') || q.includes('which campaign')) &&
    CAMPAIGN_KEYWORDS.some((k) => q.includes(k))
  ) {
    return { intent: 'TOP_CAMPAIGN' };
  }

  // Top ad
  if (
    (q.includes('best') || q.includes('top') || q.includes('most') || q.includes('highest') || q.includes('which ad')) &&
    AD_KEYWORDS.some((k) => q.includes(k))
  ) {
    return { intent: 'TOP_AD' };
  }

  // Top landing page
  if (
    (q.includes('best') || q.includes('top') || q.includes('most') || q.includes('highest') || q.includes('which')) &&
    LANDING_PAGE_KEYWORDS.some((k) => q.includes(k))
  ) {
    return { intent: 'TOP_LANDING_PAGE' };
  }

  // Campaign-related
  if (CAMPAIGN_KEYWORDS.some((k) => q.includes(k))) {
    return { intent: 'TOP_CAMPAIGN' };
  }

  // Ad-related
  if (AD_KEYWORDS.some((k) => q.includes(k))) {
    return { intent: 'TOP_AD' };
  }

  // Landing page related
  if (LANDING_PAGE_KEYWORDS.some((k) => q.includes(k))) {
    return { intent: 'TOP_LANDING_PAGE' };
  }

  // Platform-related
  if (q.includes('platform') || PLATFORM_KEYWORDS.some((p) => q.includes(p))) {
    return { intent: 'TOP_PLATFORM' };
  }

  // Default
  return { intent: 'GENERAL_OVERVIEW' };
}
