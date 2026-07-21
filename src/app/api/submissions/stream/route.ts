import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Submission from '@/lib/Submission';
import { normalizePlatform } from '@/lib/analytics/normalizePlatform';

export const dynamic = 'force-dynamic';

async function getSubmissions() {
  const docs = await Submission.find().sort({ createdAt: 1 }).lean() as any[];
  return docs.map((s, i) => ({
    index: i + 1,
    fullName: s.fullName,
    phone: s.phone,
    timestamp: new Date(s.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    platform: normalizePlatform(s.attribution?.utmSource),
    campaign: s.attribution?.utmCampaign || '',
    utmSource: s.attribution?.utmSource || '',
    landingPage: s.attribution?.landingPage?.path || '',
  }));
}

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();
  let lastCount = -1;
  let timer: ReturnType<typeof setInterval>;

  const stream = new ReadableStream({
    async start(controller) {
      try {
        await connectDB();
      } catch {
        controller.close();
        return;
      }

      async function check() {
        try {
          const count = await Submission.countDocuments();
          if (count !== lastCount) {
            lastCount = count;
            const data = await getSubmissions();
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
          } else {
            // keepalive so connection doesn't time out
            controller.enqueue(encoder.encode(': ping\n\n'));
          }
        } catch {
          // ignore transient DB errors, keep connection alive
        }
      }

      await check();
      timer = setInterval(check, 5000);

      req.signal.addEventListener('abort', () => {
        clearInterval(timer);
        controller.close();
      });
    },
    cancel() {
      clearInterval(timer);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
