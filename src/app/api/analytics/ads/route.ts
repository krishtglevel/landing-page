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
      .select('attribution')
      .lean() as any[];

    const adMap: Record<string, { campaign: string; platform: string; leads: number }> = {};

    for (const sub of submissions) {
      const ad = sub.attribution?.utmContent || 'unknown';
      const campaign = sub.attribution?.utmCampaign || 'unknown';
      const platform = normalizePlatform(sub.attribution?.utmSource);

      if (!adMap[ad]) {
        adMap[ad] = { campaign, platform, leads: 0 };
      }
      adMap[ad].leads += 1;
    }

    const ads = Object.entries(adMap)
      .map(([ad, data]) => ({
        ad,
        campaign: data.campaign,
        platform: data.platform,
        leads: data.leads,
      }))
      .sort((a, b) => b.leads - a.leads);

    return NextResponse.json(ads);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error.';
    console.error('[analytics/ads]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
