import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Submission from '@/lib/Submission';
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

    const lpMap: Record<string, number> = {};

    for (const sub of submissions) {
      const path = sub.attribution?.landingPage?.path || '/';
      lpMap[path] = (lpMap[path] || 0) + 1;
    }

    const landingPages = Object.entries(lpMap)
      .map(([path, leads]) => ({ path, leads }))
      .sort((a, b) => b.leads - a.leads);

    return NextResponse.json(landingPages);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error.';
    console.error('[analytics/landing-pages]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
