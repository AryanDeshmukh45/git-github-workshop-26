import { ImageResponse } from 'next/og';
import { accentFor, cardSuit, findProfile } from '@/lib/board';
import { getProfiles } from '@/lib/profiles';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Source Start contributor card';

export default async function Image({ params }: { params: Promise<{ username: string }> }) {
  const profile = findProfile(await getProfiles(), (await params).username);
  const accent = profile ? accentFor(profile.github_username, cardSuit(profile)) : '#ff2a3d';

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', padding: 72, gap: 64, background: '#000', color: '#f4f4f5', fontFamily: 'sans-serif' }}>
        {profile && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`https://github.com/${profile.github_username}.png?size=400`} width={300} height={300} style={{ borderRadius: 150, border: `8px solid ${accent}` }} alt="" />
        )}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div style={{ display: 'flex', fontSize: 28, letterSpacing: 6, color: '#ff2a3d', textTransform: 'uppercase' }}>Source Start 2026</div>
          <div style={{ display: 'flex', fontSize: 76, fontWeight: 800, lineHeight: 1.05, marginTop: 20 }}>{profile?.name ?? 'Source Start'}</div>
          {profile && <div style={{ display: 'flex', fontSize: 34, color: '#9b9ba5', marginTop: 12 }}>{`@${profile.github_username}`}</div>}
          <div style={{ display: 'flex', fontSize: 38, marginTop: 36, color: '#d4d4d8' }}>Made my first open-source contribution.</div>
          {profile && (
            <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
              {profile.interests.slice(0, 4).map((i) => (
                <div key={i} style={{ fontSize: 26, padding: '6px 18px', borderRadius: 999, background: '#1c1c20' }}>{i}</div>
              ))}
            </div>
          )}
        </div>
      </div>
    ),
    size,
  );
}
