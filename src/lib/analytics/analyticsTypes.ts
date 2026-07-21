/** Overview API response */
export interface OverviewData {
  totalLeads: number;
  platforms: Record<string, number>;
  topCampaign: { name: string; leads: number } | null;
  topLandingPage: { path: string; leads: number } | null;
}

/** Single platform row */
export interface PlatformData {
  platform: string;
  leads: number;
  percentage: number;
}

/** Single campaign row */
export interface CampaignData {
  campaign: string;
  platform: string;
  leads: number;
}

/** Single ad row */
export interface AdData {
  ad: string;
  campaign: string;
  platform: string;
  leads: number;
}

/** Single landing page row */
export interface LandingPageData {
  path: string;
  leads: number;
}

/** Chat request / response */
export interface ChatRequest {
  question: string;
}

export interface ChatResponse {
  answer: string;
  intent: string;
}
