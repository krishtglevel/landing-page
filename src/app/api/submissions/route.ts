import {
  NextRequest,
  NextResponse,
} from 'next/server';

import { connectDB } from '@/lib/mongodb';
import Submission from '@/lib/Submission';

import { normalizePlatform } from '@/lib/analytics/normalizePlatform';

export const dynamic = 'force-dynamic';

type LeanTouchpoint = {
  _id?: {
    toString(): string;
  };

  touchpointKey?: string;

  platform?: string;
  formSource?: string;
  sourceType?: string;

  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  utmId?: string;

  gclid?: string;
  fbclid?: string;

  landingPage?: {
    url?: string;
    path?: string;
  };

  referrer?: string;

  userAgent?: string;
  ipAddress?: string;
  language?: string;
  timezone?: string;

  browser?: {
    name?: string;
    version?: string;
  };

  os?: {
    name?: string;
    version?: string;
  };

  device?: {
    type?: string;
    vendor?: string;
    model?: string;
  };

  capturedAt?: Date | string;
};

type LegacyAttribution = {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  utmId?: string;

  gclid?: string;
  fbclid?: string;

  landingPage?: {
    url?: string;
    path?: string;
  };

  referrer?: string;
};

type LeanSubmission = {
  _id: {
    toString(): string;
  };

  fullName?: string;
  phone?: string;

  touchpoints?: LeanTouchpoint[];

  attribution?: LegacyAttribution;

  firstTouchAt?: Date | string;
  lastTouchAt?: Date | string;
  totalTouchpoints?: number;

  createdAt?: Date | string;
  updatedAt?: Date | string;
};

function toISOStringSafe(
  value: Date | string | undefined
): string {
  if (!value) {
    return new Date(0).toISOString();
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return new Date(0).toISOString();
  }

  return date.toISOString();
}

function toIndianDateTime(
  value: Date | string | undefined
): string {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
  });
}

export async function GET(
  req: NextRequest
) {
  try {
    await connectDB();

    const afterValue =
      Number.parseInt(
        req.nextUrl.searchParams.get(
          'after'
        ) || '0',
        10
      );

    const after =
      Number.isNaN(afterValue)
        ? 0
        : Math.max(0, afterValue);

    const submissions =
      (await Submission.find()
        .sort({
          firstTouchAt: 1,
          createdAt: 1,
        })
        .lean()) as unknown as LeanSubmission[];

    const rows =
      submissions.flatMap(
        (submission) => {
          if (
            Array.isArray(
              submission.touchpoints
            ) &&
            submission.touchpoints
              .length > 0
          ) {
            return submission.touchpoints.map(
              (touchpoint) => {
                const capturedAt =
                  touchpoint.capturedAt ||
                  submission.createdAt;

                const utmSource =
                  touchpoint.utmSource ||
                  '';

                return {
                  leadId:
                    submission._id.toString(),

                  touchpointId:
                    touchpoint._id?.toString() ||
                    touchpoint.touchpointKey ||
                    '',

                  fullName:
                    submission.fullName ||
                    '',

                  phone:
                    submission.phone || '',

                  timestamp:
                    toIndianDateTime(
                      capturedAt
                    ),

                  createdAtRaw:
                    toISOStringSafe(
                      capturedAt
                    ),

                  platform:
                    touchpoint.platform ||
                    normalizePlatform(
                      utmSource
                    ),

                  campaign:
                    touchpoint
                      .utmCampaign || '',

                  utmSource,

                  utmMedium:
                    touchpoint.utmMedium ||
                    '',

                  utmCampaign:
                    touchpoint
                      .utmCampaign || '',

                  utmContent:
                    touchpoint.utmContent ||
                    '',

                  utmTerm:
                    touchpoint.utmTerm ||
                    '',

                  utmId:
                    touchpoint.utmId || '',

                  gclid:
                    touchpoint.gclid || '',

                  fbclid:
                    touchpoint.fbclid || '',

                  landingPage:
                    touchpoint
                      .landingPage?.path ||
                    '/',

                  landingPageUrl:
                    touchpoint
                      .landingPage?.url ||
                    '',

                  referrer:
                    touchpoint.referrer ||
                    '',

                  formSource:
                    touchpoint.formSource ||
                    '',

                  sourceType:
                    touchpoint.sourceType ||
                    '',

                  userAgent:
                    touchpoint.userAgent ||
                    '',

                  ipAddress:
                    touchpoint.ipAddress ||
                    '',

                  language:
                    touchpoint.language ||
                    '',

                  timezone:
                    touchpoint.timezone ||
                    '',

                  browserName:
                    touchpoint.browser
                      ?.name || '',

                  browserVersion:
                    touchpoint.browser
                      ?.version || '',

                  osName:
                    touchpoint.os?.name ||
                    '',

                  osVersion:
                    touchpoint.os?.version ||
                    '',

                  deviceType:
                    touchpoint.device?.type ||
                    '',

                  deviceVendor:
                    touchpoint.device
                      ?.vendor || '',

                  deviceModel:
                    touchpoint.device
                      ?.model || '',

                  totalTouchpoints:
                    submission
                      .totalTouchpoints ||
                    submission.touchpoints
                      ?.length ||
                    1,

                  firstTouchAt:
                    toISOStringSafe(
                      submission
                        .firstTouchAt ||
                      submission.createdAt
                    ),

                  lastTouchAt:
                    toISOStringSafe(
                      submission.lastTouchAt ||
                      submission.updatedAt ||
                      submission.createdAt
                    ),
                };
              }
            );
          }

          /*
           * Legacy record compatibility
           */
          const attribution =
            submission.attribution || {};

          const createdAt =
            submission.createdAt ||
            submission.firstTouchAt;

          const utmSource =
            attribution.utmSource ||
            '';

          return [
            {
              leadId:
                submission._id.toString(),

              touchpointId:
                `legacy-${submission._id.toString()}`,

              fullName:
                submission.fullName ||
                '',

              phone:
                submission.phone || '',

              timestamp:
                toIndianDateTime(
                  createdAt
                ),

              createdAtRaw:
                toISOStringSafe(
                  createdAt
                ),

              platform:
                normalizePlatform(
                  utmSource
                ),

              campaign:
                attribution
                  .utmCampaign || '',

              utmSource,

              utmMedium:
                attribution.utmMedium ||
                '',

              utmCampaign:
                attribution
                  .utmCampaign || '',

              utmContent:
                attribution.utmContent ||
                '',

              utmTerm:
                attribution.utmTerm ||
                '',

              utmId:
                attribution.utmId || '',

              gclid:
                attribution.gclid || '',

              fbclid:
                attribution.fbclid || '',

              landingPage:
                attribution
                  .landingPage?.path ||
                '/',

              landingPageUrl:
                attribution
                  .landingPage?.url ||
                '',

              referrer:
                attribution.referrer ||
                '',

              formSource: '',
              sourceType:
                'legacy_submission',

              userAgent: '',
              ipAddress: '',
              language: '',
              timezone: '',

              browserName: '',
              browserVersion: '',

              osName: '',
              osVersion: '',

              deviceType: '',
              deviceVendor: '',
              deviceModel: '',

              totalTouchpoints: 1,

              firstTouchAt:
                toISOStringSafe(
                  createdAt
                ),

              lastTouchAt:
                toISOStringSafe(
                  submission.updatedAt ||
                  createdAt
                ),
            },
          ];
        }
      );

    rows.sort((a, b) => {
      return (
        new Date(
          a.createdAtRaw
        ).getTime() -
        new Date(
          b.createdAtRaw
        ).getTime()
      );
    });

    const data = rows
      .map((row, index) => ({
        index: index + 1,
        ...row,
      }))
      .filter(
        (row) =>
          row.index > after
      );

    return NextResponse.json(
      data
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : 'Server error.';

    console.error(
      '[api/submissions] Error:',
      error
    );

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