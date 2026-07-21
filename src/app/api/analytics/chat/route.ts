import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Submission from '@/lib/Submission';
import { normalizePlatform } from '@/lib/analytics/normalizePlatform';
import { detectIntent } from '@/lib/ai/intent';
import { generateResponse } from '@/lib/ai/generateResponse';
import { verifyDashboardAuth } from '@/lib/analytics/authCheck';

async function getOverview() {
  const submissions = await Submission.find().select('attribution').lean() as any[];
  const totalLeads = submissions.length;
  const platforms: Record<string, number> = { Google: 0, Meta: 0, YouTube: 0, Direct: 0, Other: 0 };
  const campaignCounts: Record<string, number> = {};
  const lpCounts: Record<string, number> = {};

  for (const s of submissions) {
    const platform = normalizePlatform(s.attribution?.utmSource);
    platforms[platform] = (platforms[platform] || 0) + 1;
    const campaign = s.attribution?.utmCampaign || 'unknown';
    campaignCounts[campaign] = (campaignCounts[campaign] || 0) + 1;
    const lp = s.attribution?.landingPage?.path || '/';
    lpCounts[lp] = (lpCounts[lp] || 0) + 1;
  }

  let topCampaign = null;
  let maxC = 0;
  for (const [name, leads] of Object.entries(campaignCounts)) {
    if (leads > maxC) { maxC = leads; topCampaign = { name, leads }; }
  }

  let topLandingPage = null;
  let maxLP = 0;
  for (const [path, leads] of Object.entries(lpCounts)) {
    if (leads > maxLP) { maxLP = leads; topLandingPage = { path, leads }; }
  }

  return { totalLeads, platforms, topCampaign, topLandingPage };
}

async function getPlatforms() {
  const submissions = await Submission.find().select('attribution').lean() as any[];
  const total = submissions.length;
  const counts: Record<string, number> = {};
  for (const s of submissions) {
    const p = normalizePlatform(s.attribution?.utmSource);
    counts[p] = (counts[p] || 0) + 1;
  }
  return Object.entries(counts)
    .map(([platform, leads]) => ({
      platform,
      leads,
      percentage: total > 0 ? Math.round((leads / total) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.leads - a.leads);
}

async function getCampaigns() {
  const submissions = await Submission.find().select('attribution').lean() as any[];
  const map: Record<string, { platform: string; leads: number }> = {};
  for (const s of submissions) {
    const campaign = s.attribution?.utmCampaign || 'unknown';
    const platform = normalizePlatform(s.attribution?.utmSource);
    if (!map[campaign]) map[campaign] = { platform, leads: 0 };
    map[campaign].leads += 1;
  }
  return Object.entries(map)
    .map(([campaign, d]) => ({ campaign, platform: d.platform, leads: d.leads }))
    .sort((a, b) => b.leads - a.leads);
}

async function getAds() {
  const submissions = await Submission.find().select('attribution').lean() as any[];
  const map: Record<string, { campaign: string; platform: string; leads: number }> = {};
  for (const s of submissions) {
    const ad = s.attribution?.utmContent || 'unknown';
    const campaign = s.attribution?.utmCampaign || 'unknown';
    const platform = normalizePlatform(s.attribution?.utmSource);
    if (!map[ad]) map[ad] = { campaign, platform, leads: 0 };
    map[ad].leads += 1;
  }
  return Object.entries(map)
    .map(([ad, d]) => ({ ad, campaign: d.campaign, platform: d.platform, leads: d.leads }))
    .sort((a, b) => b.leads - a.leads);
}

async function getLandingPages() {
  const submissions = await Submission.find().select('attribution').lean() as any[];
  const map: Record<string, number> = {};
  for (const s of submissions) {
    const path = s.attribution?.landingPage?.path || '/';
    map[path] = (map[path] || 0) + 1;
  }
  return Object.entries(map)
    .map(([path, leads]) => ({ path, leads }))
    .sort((a, b) => b.leads - a.leads);
}

export async function POST(req: NextRequest) {
  if (!(await verifyDashboardAuth())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { question } = await req.json();

    if (!question || typeof question !== 'string') {
      return NextResponse.json({ error: 'Question is required.' }, { status: 400 });
    }

    await connectDB();

    const { intent, entity } = detectIntent(question);

    // Fetch only the data needed for this intent
    let overview, platforms, campaigns, ads, landingPages;

    switch (intent) {
      case 'GENERAL_OVERVIEW':
        overview = await getOverview();
        break;
      case 'TOP_PLATFORM':
      case 'PLATFORM_LEADS':
      case 'PLATFORM_COMPARISON':
        platforms = await getPlatforms();
        break;
      case 'TOP_CAMPAIGN':
      case 'CAMPAIGN_LEADS':
        campaigns = await getCampaigns();
        break;
      case 'TOP_AD':
        ads = await getAds();
        break;
      case 'TOP_LANDING_PAGE':
        landingPages = await getLandingPages();
        break;
    }

    const answer = generateResponse(intent, {
      overview,
      platforms,
      campaigns,
      ads,
      landingPages,
      entity,
    });

    return NextResponse.json({ answer, intent });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error.';
    console.error('[analytics/chat]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
