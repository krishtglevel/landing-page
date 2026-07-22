import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Submission from '@/lib/Submission';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // -----------------------------
    // 1. Get submitted user details
    // -----------------------------
    const fullName = (body.fullName || '').toString().trim();
    const phone = (body.phone || '').toString().trim();

    // Attribution comes from the landing page URL
    const attribution = body.attribution || null;

    // -----------------------------
    // 2. Validate full name
    // -----------------------------
    if (!fullName) {
      return NextResponse.json(
        {
          error: 'Full name is required.',
        },
        {
          status: 400,
        }
      );
    }

    // -----------------------------
    // 3. Validate phone number
    // -----------------------------
    const digits = phone.replace(/\D/g, '');

    if (digits.length !== 10) {
      return NextResponse.json(
        {
          error: 'Phone number must be exactly 10 digits.',
        },
        {
          status: 400,
        }
      );
    }

    const normalizedPhone = digits;

    // -----------------------------
    // 4. Connect to MongoDB
    // -----------------------------
    await connectDB();

    // -----------------------------
    // 5. Check duplicate phone number
    // -----------------------------
    const submissions = await Submission.find()
      .select('phone')
      .lean();

    const alreadyRegistered = submissions.some((doc: any) => {
      const existingDigits = (doc.phone || '')
        .toString()
        .replace(/\D/g, '');

      return existingDigits === normalizedPhone;
    });

    if (alreadyRegistered) {
      return NextResponse.json(
        {
          error: 'You are already registered.',
        },
        {
          status: 400,
        }
      );
    }

    // -----------------------------
    // 6. Save lead + attribution
    // -----------------------------
    const submission = await Submission.create({
      fullName,
      phone: normalizedPhone,
      attribution,
    });

    // -----------------------------
    // 7. Send data to Google Sheets
    // -----------------------------
    if (process.env.GOOGLE_SCRIPT_URL) {
      const timestamp = new Date().toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
      });

      await fetch(process.env.GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timestamp,
          fullName,
          phone: normalizedPhone,
          attribution,
        }),
      });
    }

    // -----------------------------
    // 8. Return success response
    // -----------------------------
    return NextResponse.json({
      success: true,
      message: 'Submission saved successfully.',
      data: {
        id: submission._id,
      },
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : 'Server error.';

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
