'use client';

import { useState } from 'react';
import { accentFor, cardSuit, SUIT_SYMBOLS } from '@/lib/board';
import type { Profile } from '@/lib/types';
import FlipCard from './FlipCard';

function Avatar({ username, name, size }: { username: string; name: string; size: number }) {
  const [failed, setFailed] = useState(false);
  const initials = name.split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  if (failed) {
    return (
      <div className="cc-avatar cc-avatar--initials" style={{ width: size, height: size }}>
        {initials}
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className="cc-avatar"
      src={`https://github.com/${username}.png?size=${size * 2}`}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

const stop = (e: React.PointerEvent) => e.stopPropagation();

export default function ContributorCard({ profile, compact = false, isNew = false, playerNumber }: { profile: Profile; compact?: boolean; isNew?: boolean; playerNumber?: number }) {
  const suit = cardSuit(profile);
  const labels = { spade: 'Low Level', club: 'Web Dev', diamond: 'Data Science', heart: 'Python' };
  const accent = accentFor(profile.github_username, suit);
  const width = compact ? 200 : playerNumber ? 280 : 240;
  const height = compact ? 270 : playerNumber ? 360 : 320;

  const front = (
    <div className="cc-face cc-front cc-card-back" style={{ '--accent': accent } as React.CSSProperties}>
      <div className="cc-back-ornament" aria-hidden="true">
        <span className="cc-back-corner cc-back-corner--tl">{SUIT_SYMBOLS[suit]}</span>
        <span className="cc-back-corner cc-back-corner--tr">{SUIT_SYMBOLS[suit]}</span>
        <span className="cc-back-corner cc-back-corner--bl">{SUIT_SYMBOLS[suit]}</span>
        <span className="cc-back-corner cc-back-corner--br">{SUIT_SYMBOLS[suit]}</span>
        <span className="cc-back-medallion"><span>{SUIT_SYMBOLS[suit]}</span><span>{SUIT_SYMBOLS[suit]}</span></span>
      </div>
      <span className="cc-back-caption">{playerNumber ? `PLAYER ${String(playerNumber).padStart(2, '0')}` : 'TAP TO REVEAL'}</span>
    </div>
  );

  const back = (
    <div className="cc-face cc-back cc-playing-card" style={{ '--accent': accent } as React.CSSProperties}>
      {/* TODO: assign K/Q/J only after organizer and mentor usernames are agreed. */}
      <div className="cc-corner cc-corner--top"><span>{SUIT_SYMBOLS[suit]}</span></div>
      <div className="cc-playing-main">
        {playerNumber && <span className="cc-player-index">PLAYER {String(playerNumber).padStart(2, '0')}</span>}
        <div className="cc-ring">
          <Avatar username={profile.github_username} name={profile.name} size={compact ? 68 : 82} />
        </div>
        <h3 className="cc-name">{profile.name}</h3>
        <p className="cc-user">@{profile.github_username}</p>
        <p className="cc-bio">{profile.bio}</p>
        <span className="cc-suit-label">{SUIT_SYMBOLS[suit]} {labels[suit]}</span>
        <div className="cc-tags">
          {profile.interests.map((i) => <span key={i}>{i}</span>)}
        </div>
        {profile.fun_fact && <p className="cc-fact">{profile.fun_fact}</p>}
        {profile.language && <span className="cc-lang">{profile.language}</span>}
      </div>
      <div className="cc-corner cc-corner--bottom"><span>{SUIT_SYMBOLS[suit]}</span></div>
      <div className="cc-links">
        <a href={`https://github.com/${profile.github_username}`} target="_blank" rel="noreferrer" onPointerDown={stop}>
          GitHub
        </a>
        <a href={`/u/${profile.github_username}`} onPointerDown={stop}>
          Share
        </a>
        {profile.link && (
          <a href={profile.link} target="_blank" rel="noreferrer nofollow" onPointerDown={stop}>
            Website
          </a>
        )}
      </div>
    </div>
  );

  return (
    <div className={isNew ? 'cc cc--new' : 'cc'} style={{ '--accent': accent } as React.CSSProperties}>
      <FlipCard
        front={front}
        back={back}
        width={width}
        height={height}
        radius={18}
        background="#111113"
        color="#f4f4f5"
        tiltMax={10}
        glareOpacity={0.14}
        defaultFlipped={playerNumber !== undefined}
        ariaLabel={`${profile.name}'s ${labels[suit]} playing card. Press to reveal.`}
      />
    </div>
  );
}
