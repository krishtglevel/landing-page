import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Submission from '@/lib/Submission';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const after = parseInt(req.nextUrl.searchParams.get('after') || '0');

    const submissions = await Submission.find().sort({ createdAt: 1 }).lean() as any[];

    const data = submissions
      .map((s, i) => ({
        index: i + 1,
        fullName: s.fullName,
        phone: s.phone,
        timestamp: new Date(s.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      }))
      .filter(row => row.index > after);

    return NextResponse.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
