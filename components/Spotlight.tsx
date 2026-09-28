'use client';

import { motion } from 'motion/react';
import { accentFor, cardSuit } from '@/lib/board';
import type { Profile } from '@/lib/types';

export default function Spotlight({ profile }: { profile: Profile }) {
  const accent = accentFor(profile.github_username, cardSuit(profile));
  return (
    <motion.div
      className="spotlight"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.5 } }}
      style={{ '--accent': accent } as React.CSSProperties}
    >
      <motion.div
        className="spotlight-card"
        initial={{ scale: 0.4, rotateY: -90, y: 80 }}
        animate={{ scale: 1, rotateY: 0, y: 0 }}
        exit={{ scale: 0.3, y: 400, opacity: 0, transition: { duration: 0.6, ease: [0.4, 0, 1, 1] } }}
        transition={{ type: 'spring', stiffness: 140, damping: 16 }}
      >
        <p className="spotlight-eyebrow">Player joined</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="spotlight-avatar" src={`https://github.com/${profile.github_username}.png?size=400`} alt="" />
        <h2 className="spotlight-name">{profile.name}</h2>
        <p className="spotlight-user">@{profile.github_username}</p>
        <p className="spotlight-bio">{profile.bio}</p>
        <div className="cc-tags spotlight-tags">
          {profile.interests.map((i) => (
            <span key={i}>{i}</span>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
