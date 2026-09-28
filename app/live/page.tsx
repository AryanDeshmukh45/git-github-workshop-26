import QRCode from 'qrcode';
import { connection } from 'next/server';
import LiveBoard from '@/components/LiveBoard';
import { getProfiles } from '@/lib/profiles';
import { geist } from '@/lib/fonts';
import { repoUrl } from '@/lib/repo';

export const metadata = { title: 'Source Start · live' };

export default async function Live() {
  await connection();
  const profiles = await getProfiles();
  const qr = await QRCode.toString(repoUrl, { type: 'svg', margin: 1 });
  return <LiveBoard initial={profiles} qr={qr} fontFamily={geist.style.fontFamily} />;
}
