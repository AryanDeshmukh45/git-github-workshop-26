import { getProfiles } from '@/lib/profiles';

export async function GET() {
  return Response.json(await getProfiles(), { headers: { 'Cache-Control': 'no-store' } });
}
