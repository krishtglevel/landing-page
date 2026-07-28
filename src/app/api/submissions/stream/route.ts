import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Submission from '@/lib/Submission';
import { normalizePlatform } from '@/lib/analytics/normalizePlatform';

export const dynamic = 'force-dynamic';

async function getSubmissions() {
  const docs = (await Submission.find()
    .sort({ createdAt: 1 })
    .lean()) as any[];

  return docs.map((s, i) => ({
    index: i + 1,

    fullName: s.fullName || '',
    phone: s.phone || '',

    timestamp: new Date(s.createdAt).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
    }),

    createdAtRaw: new Date(s.createdAt).toISOString(),

    platform: normalizePlatform(
      s.attribution?.utmSource
    ),

    campaign:
      s.attribution?.utmCampaign || '',

    utmSource:
      s.attribution?.utmSource || '',

    utmMedium:
      s.attribution?.utmMedium || '',

    utmCampaign:
      s.attribution?.utmCampaign || '',

    utmContent:
      s.attribution?.utmContent || '',

    utmTerm:
      s.attribution?.utmTerm || '',

    utmId:
      s.attribution?.utmId || '',

    gclid:
      s.attribution?.gclid || '',

    fbclid:
      s.attribution?.fbclid || '',

    landingPage:
      s.attribution?.landingPage?.path || '/',

    landingPageUrl:
      s.attribution?.landingPage?.url || '',

    referrer:
      s.attribution?.referrer || '',
  }));
}

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  let lastCount = -1;

  let timer:
    | ReturnType<typeof setInterval>
    | null = null;

  let isClosed = false;

  let controllerRef:
    | ReadableStreamDefaultController<Uint8Array>
    | null = null;

  const stopStream = () => {
    if (isClosed) return;

    isClosed = true;

    if (timer) {
      clearInterval(timer);
      timer = null;
    }

    if (controllerRef) {
      try {
        controllerRef.close();
      } catch {
        // Controller may already be closed.
      }

      controllerRef = null;
    }
  };

  const stream = new ReadableStream<Uint8Array>({
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

          /*
           * This normally means the browser disconnected
           * before the interval finished.
           */
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
          const count =
            await Submission.countDocuments();

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

            const sent = safeEnqueue(
              `data: ${JSON.stringify(
                data
              )}\n\n`
            );

            if (sent) {
              lastCount = count;
            }
          } else {
            safeEnqueue(': ping\n\n');
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