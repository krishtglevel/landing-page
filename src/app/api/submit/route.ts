import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Submission from '@/lib/Submission';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const fullName = (body.fullName || '').toString().trim();
    const phone = (body.phone || '').toString().trim();

    // New: receive attribution data from frontend
    const attribution = body.attribution || null;

    if (!fullName) {
      return NextResponse.json(
        { error: 'Full name is required.' },
        { status: 400 }
      );
    }

    const digits = phone.replace(/\D/g, '');

    if (digits.length !== 10) {
      return NextResponse.json(
        { error: 'Phone number must be exactly 10 digits.' },
        { status: 400 }
      );
    }

    const normalizedPhone = digits;

    const timestamp = new Date().toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
    });

    // Save to MongoDB
    await connectDB();

    const submissions = await Submission.find().lean();

    const alreadyRegistered = submissions.some((doc: any) => {
      const existingDigits = (doc.phone || '')
        .toString()
        .replace(/\D/g, '');

      return existingDigits === normalizedPhone;
    });

    if (alreadyRegistered) {
      return NextResponse.json(
        { error: 'You are already registered.' },
        { status: 400 }
      );
    }

    // Save lead + marketing attribution
    await Submission.create({
      fullName,
      phone: normalizedPhone,
      attribution,
    });

    // Send live to Google Sheets via Apps Script
    if (process.env.GOOGLE_SCRIPT_URL) {
      await fetch(process.env.GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timestamp,
          fullName,
          phone: normalizedPhone,

          // Optional: send attribution to Google Sheets also
          attribution,
        }),
      });
    }

    return NextResponse.json({
      success: true,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Server error.';

    console.error('[submit]', message);

    return NextResponse.json(
      {
        error: message,
      },
      {
        status: 500,
      }
    );
  }
}