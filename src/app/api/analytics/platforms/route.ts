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

    const total = submissions.length;
    const counts: Record<string, number> = {};

    for (const sub of submissions) {
      const platform = normalizePlatform(sub.attribution?.utmSource);
      counts[platform] = (counts[platform] || 0) + 1;
    }

    const platforms = Object.entries(counts)
      .map(([platform, leads]) => ({
        platform,
        leads,
        percentage: total > 0 ? Math.round((leads / total) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.leads - a.leads);

    return NextResponse.json(platforms);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error.';
    console.error('[analytics/platforms]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
