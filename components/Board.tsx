'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useMemo, useState } from 'react';
import { hasInterest, matchesSearch, sortProfiles, suitForInterest, SUIT_SYMBOLS, topInterests } from '@/lib/board';
import type { Profile } from '@/lib/types';
import { useLiveProfiles } from '@/lib/useLiveProfiles';
import ContributorCard from './ContributorCard';

export default function Board({ initial }: { initial: Profile[] }) {
  const { profiles, arrivals } = useLiveProfiles(initial, 20_000);
  const [query, setQuery] = useState('');
  const [interest, setInterest] = useState<string | null>(null);

  const sorted = useMemo(() => sortProfiles(profiles), [profiles]);
  const interests = useMemo(() => topInterests(profiles), [profiles]);
  const visible = sorted.filter((p) => matchesSearch(p, query) && hasInterest(p, interest));

  return (
    <section
      className="board"
      id="board"
      onPointerMove={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        event.currentTarget.style.setProperty('--pointer-x', `${event.clientX - bounds.left}px`);
        event.currentTarget.style.setProperty('--pointer-y', `${event.clientY - bounds.top}px`);
      }}
      onPointerLeave={(event) => {
        event.currentTarget.style.setProperty('--pointer-x', '-300px');
        event.currentTarget.style.setProperty('--pointer-y', '-300px');
      }}
    >
      <div className="board-head">
        <div>
          <h2>The players</h2>
          <p className="muted">
            {profiles.length} {profiles.length === 1 ? 'player' : 'players'} cleared the entry game. Tap a card to reveal it.
          </p>
        </div>
        <input
          className="search"
          type="search"
          placeholder="Search players by name, username or suit"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search contributors"
        />
      </div>

      {interests.length > 0 && (
        <div className="chips" role="group" aria-label="Filter by interest">
          <button className={interest === null ? 'chip chip--on' : 'chip'} onClick={() => setInterest(null)}>
            Everyone
          </button>
          {interests.map(({ interest: name, count }) => (
            <button
              key={name}
              className={interest === name ? 'chip chip--on' : 'chip'}
              onClick={() => setInterest(interest === name ? null : name)}
            >
              <span className={`chip-suit chip-suit--${suitForInterest(name)}`} aria-hidden="true">{SUIT_SYMBOLS[suitForInterest(name)]}</span>
              {name} <span className="chip-count">{count}</span>
            </button>
          ))}
        </div>
      )}

      {visible.length === 0 ? (
        <p className="empty">{profiles.length === 0 ? 'No one yet. Be the first!' : 'No one matches that.'}</p>
      ) : (
        <motion.div className="grid" layout>
          <AnimatePresence initial={false}>
            {visible.map((p) => (
              <motion.div
                key={p.github_username.toLowerCase()}
                layout
                initial={{ opacity: 0, scale: 0.85, y: 24 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 260, damping: 26 }}
              >
                <ContributorCard profile={p} isNew={arrivals.includes(p.github_username.toLowerCase())} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </section>
  );
}
