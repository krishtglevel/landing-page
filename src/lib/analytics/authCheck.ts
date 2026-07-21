import { cookies } from 'next/headers';

/**
 * Verify dashboard authentication from cookie.
 * Returns true if authenticated, false otherwise.
 */
export async function verifyDashboardAuth(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get('dashboard_token')?.value;
  return token === process.env.DASHBOARD_SECRET;
}
