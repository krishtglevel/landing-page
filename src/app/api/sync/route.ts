import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Submission from '@/lib/Submission';

export async function GET() {
  try {
    await connectDB();
    const submissions = await Submission.find().sort({ createdAt: 1 }).lean() as any[];

    const rows = submissions.map((s) => ({
      timestamp: new Date(s.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      fullName: s.fullName,
      phone: s.phone,
    }));

    await fetch(process.env.GOOGLE_SCRIPT_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bulk: true, rows }),
    });

    return NextResponse.json({ success: true, total: rows.length });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error.';
    console.error('[sync]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
