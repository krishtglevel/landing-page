import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Submission from '@/lib/Submission';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();

    const fullName =
      typeof body.fullName === 'string'
        ? body.fullName.trim()
        : '';

    const rawPhone =
      typeof body.phone === 'string'
        ? body.phone
        : '';

    const normalizedPhone = rawPhone
      .replace(/\D/g, '')
      .slice(-10);

    const attribution =
      body.attribution &&
      typeof body.attribution === 'object'
        ? body.attribution
        : {};

    if (!fullName) {
      return NextResponse.json(
        {
          error: 'Please enter your full name.',
        },
        {
          status: 400,
        }
      );
    }

    if (normalizedPhone.length !== 10) {
      return NextResponse.json(
        {
          error:
            'Phone number must be exactly 10 digits.',
        },
        {
          status: 400,
        }
      );
    }

    const existingSubmission =
      await Submission.findOne({
        phone: normalizedPhone,
      }).lean();

    if (existingSubmission) {
      return NextResponse.json(
        {
          error: 'You are already registered.',
        },
        {
          status: 409,
        }
      );
    }

    const submission =
      await Submission.create({
        fullName,
        phone: normalizedPhone,

        attribution: {
          utmSource:
            attribution.utmSource ||
            attribution.utm_source ||
            '',

          utmMedium:
            attribution.utmMedium ||
            attribution.utm_medium ||
            '',

          utmCampaign:
            attribution.utmCampaign ||
            attribution.utm_campaign ||
            '',

          utmContent:
            attribution.utmContent ||
            attribution.utm_content ||
            '',

          utmTerm:
            attribution.utmTerm ||
            attribution.utm_term ||
            '',

          utmId:
            attribution.utmId ||
            attribution.utm_id ||
            '',

          gclid:
            attribution.gclid || '',

          fbclid:
            attribution.fbclid || '',

          landingPage: {
            url:
              attribution.landingPage?.url ||
              attribution.landingPageUrl ||
              attribution.landing_page_url ||
              '',

            path:
              attribution.landingPage?.path ||
              '/',
          },

          referrer:
            attribution.referrer || '',
        },
      });

    return NextResponse.json(
      {
        success: true,
        message:
          'Registration completed successfully.',

        data: {
          id: submission._id.toString(),
          fullName: submission.fullName,
          phone: submission.phone,
          attribution:
            submission.attribution,
          createdAt:
            submission.createdAt,
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      '[api/submit] Submission error:',
      error
    );

    return NextResponse.json(
      {
        error:
          'Unable to submit your details.',
      },
      {
        status: 500,
      }
    );
  }
}