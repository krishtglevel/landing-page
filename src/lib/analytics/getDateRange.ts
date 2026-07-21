/**
 * Convert a date-range filter key into { from, to } Date objects.
 * Supported keys: today, yesterday, 7d, 30d, all
 */
export function getDateRange(range?: string | null): { from?: Date; to?: Date } {
  if (!range || range === 'all') return {};

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (range) {
    case 'today':
      return { from: startOfToday, to: now };

    case 'yesterday': {
      const yesterdayStart = new Date(startOfToday);
      yesterdayStart.setDate(yesterdayStart.getDate() - 1);
      return { from: yesterdayStart, to: startOfToday };
    }

    case '7d': {
      const sevenDaysAgo = new Date(startOfToday);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return { from: sevenDaysAgo, to: now };
    }

    case '30d': {
      const thirtyDaysAgo = new Date(startOfToday);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return { from: thirtyDaysAgo, to: now };
    }

    default:
      return {};
  }
}

/**
 * Build a MongoDB date match filter from a range key.
 */
export function buildDateFilter(range?: string | null): Record<string, any> {
  const { from, to } = getDateRange(range);
  if (!from && !to) return {};

  const filter: Record<string, any> = {};
  if (from) filter.$gte = from;
  if (to) filter.$lte = to;

  return { createdAt: filter };
}
