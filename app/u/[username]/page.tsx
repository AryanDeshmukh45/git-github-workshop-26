import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ContributorCard from '@/components/ContributorCard';
import ShareButtons from '@/components/ShareButtons';
import { findProfile } from '@/lib/board';
import { getProfiles } from '@/lib/profiles';

type Props = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const profile = findProfile(await getProfiles(), (await params).username);
  if (!profile) return { title: 'Not found · Source Start' };
  return {
    title: `${profile.name} · Source Start`,
    description: `${profile.name} made their first open-source contribution at Source Start.`,
  };
}

export default async function SharePage({ params }: Props) {
  const profile = findProfile(await getProfiles(), (await params).username);
  if (!profile) notFound();

  return (
    <main className="share">
      <p className="eyebrow">Source Start 2026</p>
      <h1>{profile.name} made their first open-source contribution</h1>
      <ContributorCard profile={profile} />
      <ShareButtons name={profile.name} />
      <p className="muted">
        <Link href="/#board">See the players</Link> · <Link href="/#join">Enter the game</Link>
      </p>
    </main>
  );
}
