import { NextRequest } from 'next/server';

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

  /*
   * Temporary compatibility for records created
   * before touchpoints[] was introduced.
   */
  attribution?: LegacyAttribution;

  firstTouchAt?: Date | string;
  lastTouchAt?: Date | string;
  totalTouchpoints?: number;

  createdAt?: Date | string;
  updatedAt?: Date | string;
};

type SubmissionRow = {
  index: number;

  leadId: string;
  touchpointId: string;

  fullName: string;
  phone: string;

  timestamp: string;
  createdAtRaw: string;

  platform: string;
  campaign: string;

  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent: string;
  utmTerm: string;
  utmId: string;

  gclid: string;
  fbclid: string;

  landingPage: string;
  landingPageUrl: string;

  referrer: string;

  formSource: string;
  sourceType: string;

  userAgent: string;
  ipAddress: string;
  language: string;
  timezone: string;

  browserName: string;
  browserVersion: string;

  osName: string;
  osVersion: string;

  deviceType: string;
  deviceVendor: string;
  deviceModel: string;

  firstTouchAt: string;
  lastTouchAt: string;
  totalTouchpoints: number;
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

function mapTouchpointToRow({
  submission,
  touchpoint,
}: {
  submission: LeanSubmission;
  touchpoint: LeanTouchpoint;
}): Omit<SubmissionRow, 'index'> {
  const capturedAt =
    touchpoint.capturedAt ||
    submission.createdAt ||
    submission.firstTouchAt;

  const utmSource =
    touchpoint.utmSource || '';

  return {
    leadId:
      submission._id.toString(),

    touchpointId:
      touchpoint._id?.toString() ||
      touchpoint.touchpointKey ||
      '',

    fullName:
      submission.fullName || '',

    phone:
      submission.phone || '',

    timestamp:
      toIndianDateTime(capturedAt),

    createdAtRaw:
      toISOStringSafe(capturedAt),

    platform:
      touchpoint.platform ||
      normalizePlatform(utmSource),

    campaign:
      touchpoint.utmCampaign || '',

    utmSource,

    utmMedium:
      touchpoint.utmMedium || '',

    utmCampaign:
      touchpoint.utmCampaign || '',

    utmContent:
      touchpoint.utmContent || '',

    utmTerm:
      touchpoint.utmTerm || '',

    utmId:
      touchpoint.utmId || '',

    gclid:
      touchpoint.gclid || '',

    fbclid:
      touchpoint.fbclid || '',

    landingPage:
      touchpoint.landingPage?.path ||
      '/',

    landingPageUrl:
      touchpoint.landingPage?.url ||
      '',

    referrer:
      touchpoint.referrer || '',

    formSource:
      touchpoint.formSource || '',

    sourceType:
      touchpoint.sourceType || '',

    userAgent:
      touchpoint.userAgent || '',

    ipAddress:
      touchpoint.ipAddress || '',

    language:
      touchpoint.language || '',

    timezone:
      touchpoint.timezone || '',

    browserName:
      touchpoint.browser?.name || '',

    browserVersion:
      touchpoint.browser?.version || '',

    osName:
      touchpoint.os?.name || '',

    osVersion:
      touchpoint.os?.version || '',

    deviceType:
      touchpoint.device?.type || '',

    deviceVendor:
      touchpoint.device?.vendor || '',

    deviceModel:
      touchpoint.device?.model || '',

    firstTouchAt:
      toISOStringSafe(
        submission.firstTouchAt ||
        submission.createdAt
      ),

    lastTouchAt:
      toISOStringSafe(
        submission.lastTouchAt ||
        submission.updatedAt ||
        submission.createdAt
      ),

    totalTouchpoints:
      submission.totalTouchpoints ||
      submission.touchpoints?.length ||
      1,
  };
}

function mapLegacySubmissionToRow(
  submission: LeanSubmission
): Omit<SubmissionRow, 'index'> {
  const attribution =
    submission.attribution || {};

  const createdAt =
    submission.createdAt ||
    submission.firstTouchAt;

  const utmSource =
    attribution.utmSource || '';

  return {
    leadId:
      submission._id.toString(),

    touchpointId:
      `legacy-${submission._id.toString()}`,

    fullName:
      submission.fullName || '',

    phone:
      submission.phone || '',

    timestamp:
      toIndianDateTime(createdAt),

    createdAtRaw:
      toISOStringSafe(createdAt),

    platform:
      normalizePlatform(utmSource),

    campaign:
      attribution.utmCampaign || '',

    utmSource,

    utmMedium:
      attribution.utmMedium || '',

    utmCampaign:
      attribution.utmCampaign || '',

    utmContent:
      attribution.utmContent || '',

    utmTerm:
      attribution.utmTerm || '',

    utmId:
      attribution.utmId || '',

    gclid:
      attribution.gclid || '',

    fbclid:
      attribution.fbclid || '',

    landingPage:
      attribution.landingPage?.path ||
      '/',

    landingPageUrl:
      attribution.landingPage?.url ||
      '',

    referrer:
      attribution.referrer || '',

    formSource: '',
    sourceType: 'legacy_submission',

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

    firstTouchAt:
      toISOStringSafe(createdAt),

    lastTouchAt:
      toISOStringSafe(
        submission.updatedAt ||
        createdAt
      ),

    totalTouchpoints: 1,
  };
}

async function getSubmissions(): Promise<
  SubmissionRow[]
> {
  const docs = (await Submission.find()
    .sort({
      firstTouchAt: 1,
      createdAt: 1,
    })
    .lean()) as unknown as LeanSubmission[];

  const rows = docs.flatMap(
    (
      submission
    ): Array<
      Omit<SubmissionRow, 'index'>
    > => {
      if (
        Array.isArray(
          submission.touchpoints
        ) &&
        submission.touchpoints.length > 0
      ) {
        return submission.touchpoints.map(
          (touchpoint) =>
            mapTouchpointToRow({
              submission,
              touchpoint,
            })
        );
      }

      /*
       * Keep showing old records until they
       * are migrated into touchpoints[].
       */
      return [
        mapLegacySubmissionToRow(
          submission
        ),
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

  return rows.map(
    (row, index) => ({
      index: index + 1,
      ...row,
    })
  );
}

async function getInteractionCount(): Promise<number> {
  const result =
    await Submission.aggregate<{
      total: number;
    }>([
      {
        $project: {
          interactionCount: {
            $cond: [
              {
                $gt: [
                  {
                    $size: {
                      $ifNull: [
                        '$touchpoints',
                        [],
                      ],
                    },
                  },
                  0,
                ],
              },
              {
                $size: {
                  $ifNull: [
                    '$touchpoints',
                    [],
                  ],
                },
              },

              /*
               * Old records without touchpoints[]
               * still represent one interaction.
               */
              1,
            ],
          },
        },
      },

      {
        $group: {
          _id: null,

          total: {
            $sum:
              '$interactionCount',
          },
        },
      },
    ]);

  return result[0]?.total || 0;
}

export async function GET(
  req: NextRequest
) {
  const encoder =
    new TextEncoder();

  let lastCount = -1;

  let timer:
    | ReturnType<typeof setInterval>
    | null = null;

  let isClosed = false;

  let controllerRef:
    | ReadableStreamDefaultController<Uint8Array>
    | null = null;

  const stopStream = () => {
    if (isClosed) {
      return;
    }

    isClosed = true;

    if (timer) {
      clearInterval(timer);
      timer = null;
    }

    if (controllerRef) {
      try {
        controllerRef.close();
      } catch {
        // The stream may already be closed.
      }

      controllerRef = null;
    }
  };

  const stream =
    new ReadableStream<Uint8Array>({
      async start(controller) {
        controllerRef = controller;

        req.signal.addEventListener(
          'abort',
          stopStream,
          {
            once: true,
          }
        );

        try {
          await connectDB();
        } catch (error) {
          console.error(
            '[submissions-stream] MongoDB connection failed:',
            error
          );

          stopStream();
          return;
        }

        const safeEnqueue = (
          content: string
        ): boolean => {
          if (
            isClosed ||
            req.signal.aborted ||
            !controllerRef
          ) {
            return false;
          }

          try {
            controllerRef.enqueue(
              encoder.encode(content)
            );

            return true;
          } catch (error) {
            const message =
              error instanceof Error
                ? error.message
                : String(error);

            if (
              message.includes(
                'Controller is already closed'
              ) ||
              message.includes(
                'Invalid state'
              )
            ) {
              stopStream();
              return false;
            }

            console.error(
              '[submissions-stream] Enqueue error:',
              error
            );

            stopStream();
            return false;
          }
        };

        const check = async () => {
          if (
            isClosed ||
            req.signal.aborted
          ) {
            stopStream();
            return;
          }

          try {
            /*
             * Count touchpoints, not customer
             * documents.
             *
             * Example:
             * 1 customer + 3 campaigns = count 3.
             */
            const count =
              await getInteractionCount();

            if (
              isClosed ||
              req.signal.aborted
            ) {
              stopStream();
              return;
            }

            if (count !== lastCount) {
              const data =
                await getSubmissions();

              if (
                isClosed ||
                req.signal.aborted
              ) {
                stopStream();
                return;
              }

              const sent =
                safeEnqueue(
                  `data: ${JSON.stringify(
                    data
                  )}\n\n`
                );

              if (sent) {
                lastCount = count;
              }
            } else {
              safeEnqueue(
                ': ping\n\n'
              );
            }
          } catch (error) {
            if (
              !isClosed &&
              !req.signal.aborted
            ) {
              console.error(
                '[submissions-stream]',
                error
              );
            }
          }
        };

        await check();

        if (
          isClosed ||
          req.signal.aborted
        ) {
          stopStream();
          return;
        }

        timer = setInterval(() => {
          void check();
        }, 5000);
      },

      cancel() {
        stopStream();
      },
    });

  return new Response(stream, {
    headers: {
      'Content-Type':
        'text/event-stream; charset=utf-8',

      'Cache-Control':
        'no-cache, no-transform',

      Connection:
        'keep-alive',

      'X-Accel-Buffering':
        'no',
    },
  });
}