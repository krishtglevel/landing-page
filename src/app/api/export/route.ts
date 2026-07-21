import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Submission from '@/lib/Submission';
import { normalizePlatform } from '@/lib/analytics/normalizePlatform';
import * as XLSX from 'xlsx';

export async function GET() {
  try {
    await connectDB();

    const submissions = await Submission.find().sort({ createdAt: 1 }).lean();

    const rows = submissions.map((s: any) => ({
      'Timestamp': new Date(s.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      'Full Name': s.fullName,
      'Phone Number': s.phone,
      'Platform': normalizePlatform(s.attribution?.utmSource),
      'UTM Source': s.attribution?.utmSource || '',
      'UTM Medium': s.attribution?.utmMedium || '',
      'Campaign': s.attribution?.utmCampaign || '',
      'Ad': s.attribution?.utmContent || '',
      'Landing Page': s.attribution?.landingPage?.path || '',
      'GCLID': s.attribution?.gclid || '',
      'FBCLID': s.attribution?.fbclid || '',
      'Referrer': s.attribution?.referrer || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook  = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Submissions');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="submissions.xlsx"',
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error.';
    console.error('[export]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

