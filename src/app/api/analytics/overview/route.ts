import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Submission from '@/lib/Submission';
import { normalizePlatform } from '@/lib/analytics/normalizePlatform';
import { buildDateFilter } from '@/lib/analytics/getDateRange';
import { verifyDashboardAuth } from '@/lib/analytics/authCheck';

export async function GET(req: NextRequest) {
  if (!(await verifyDashboardAuth())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();

    const range = req.nextUrl.searchParams.get('range');
    const dateFilter = buildDateFilter(range);

    const submissions = await Submission.find(dateFilter)
      .select('attribution createdAt')
      .lean() as any[];

    const totalLeads = submissions.length;

    // Count by platform
    const platforms: Record<string, number> = {
      Google: 0,
      Meta: 0,
      YouTube: 0,
      Direct: 0,
      Other: 0,
    };

    const campaignCounts: Record<string, number> = {};
    const landingPageCounts: Record<string, number> = {};

    for (const sub of submissions) {
      const platform = normalizePlatform(sub.attribution?.utmSource);
      platforms[platform] = (platforms[platform] || 0) + 1;

      const campaign = sub.attribution?.utmCampaign || 'unknown';
      campaignCounts[campaign] = (campaignCounts[campaign] || 0) + 1;

      const lp = sub.attribution?.landingPage?.path || '/';
      landingPageCounts[lp] = (landingPageCounts[lp] || 0) + 1;
    }

    // Top campaign
    let topCampaign = null;
    let maxCampaignLeads = 0;
    for (const [name, leads] of Object.entries(campaignCounts)) {
      if (leads > maxCampaignLeads) {
        maxCampaignLeads = leads;
        topCampaign = { name, leads };
      }
    }

    // Top landing page
    let topLandingPage = null;
    let maxLPLeads = 0;
    for (const [path, leads] of Object.entries(landingPageCounts)) {
      if (leads > maxLPLeads) {
        maxLPLeads = leads;
        topLandingPage = { path, leads };
      }
    }

    return NextResponse.json({
      totalLeads,
      platforms,
      topCampaign,
      topLandingPage,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error.';
    console.error('[analytics/overview]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
