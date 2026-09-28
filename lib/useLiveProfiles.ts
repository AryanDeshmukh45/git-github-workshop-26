'use client';

import { useEffect, useState } from 'react';
import { mergeProfiles, newArrivals, profileKey } from './board';
import type { Profile } from './types';

// Polls /api/profiles and remembers who appeared after the page loaded,
// newest first, so they can be highlighted.
export function useLiveProfiles(initial: Profile[], intervalMs: number) {
  const [profiles, setProfiles] = useState(initial);
  const [arrivals, setArrivals] = useState<string[]>([]);

  useEffect(() => {
    let current = initial;
    let known = new Set(initial.map(profileKey));
    const id = setInterval(async () => {
      try {
        const res = await fetch('/api/profiles', { cache: 'no-store' });
        if (!res.ok) return;
        const next: Profile[] = await res.json();
        const added = newArrivals(known, next);
        current = mergeProfiles(current, next);
        known = new Set(current.map(profileKey));
        setProfiles(current);
        if (added.length) setArrivals((prev) => [...added.reverse(), ...prev]);
      } catch {
        // Offline for a moment. Try again next tick.
      }
    }, intervalMs);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervalMs]);

  return { profiles, arrivals };
}
