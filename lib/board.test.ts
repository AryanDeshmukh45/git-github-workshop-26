import { describe, expect, it } from 'vitest';
import { checkProfile } from '../scripts/validate.mjs';
import {
  accentFor, findProfile, hasInterest, matchesSearch, mergeProfiles, newArrivals, newestFirst, nextSpotlight, sortProfiles,
  spotlightDuration, topInterests,
} from './board';
import type { Profile } from './types';

const person = (name: string, github_username: string, interests: string[]): Profile => ({
  name, github_username, bio: 'hi', interests, batch_year: 2029,
});

describe('board', () => {
  it('sorts by name, ignoring capital letters', () => {
    const sorted = sortProfiles([person('Zara', 'zara', ['Go']), person('aman', 'aman', ['Go']), person('Bhavya', 'bhavya', ['Go'])]);
    expect(sorted.map((p) => p.name)).toEqual(['aman', 'Bhavya', 'Zara']);
  });

  it('counts interests, ignoring capital letters', () => {
    const top = topInterests([person('Amy', 'a', ['Go', 'Rust']), person('Ben', 'b', ['go'])]);
    expect(top[0]).toEqual({ interest: 'Go', count: 2 });
    expect(top).toHaveLength(2);
  });

  it('searches names, usernames, interests and languages', () => {
    const riya = { ...person('Riya Shah', 'riya-codes', ['Robotics']), language: 'Python' };
    expect(matchesSearch(riya, 'shah')).toBe(true);
    expect(matchesSearch(riya, 'RIYA-CODES')).toBe(true);
    expect(matchesSearch(riya, 'robotics')).toBe(true);
    expect(matchesSearch(riya, 'python')).toBe(true);
    expect(matchesSearch(riya, '')).toBe(true);
    expect(matchesSearch(riya, 'nobody')).toBe(false);
  });

  it('filters by interest', () => {
    expect(hasInterest(person('A', 'a', ['Web Dev']), 'web dev')).toBe(true);
    expect(hasInterest(person('A', 'a', ['Go']), 'Rust')).toBe(false);
  });

  it('gives the same suit a stable colour regardless of username casing', () => {
    expect(accentFor('Riya', 'heart')).toBe(accentFor('riya', 'heart'));
  });
});

describe('live ordering', () => {
  const at = (p: Profile, joined_at?: string): Profile => ({ ...p, joined_at });

  it('puts the newest profiles first', () => {
    const list = [at(person('Old', 'old', ['Go']), '2026-09-01T10:00:00Z'), at(person('New', 'new', ['Go']), '2026-09-28T10:00:00Z')];
    expect(newestFirst(list).map((p) => p.name)).toEqual(['New', 'Old']);
  });

  it('puts profiles without a date last, alphabetically', () => {
    const list = [person('Zed', 'zed', ['Go']), person('Amy', 'amy', ['Go']), at(person('Dated', 'dated', ['Go']), '2026-09-01T10:00:00Z')];
    expect(newestFirst(list).map((p) => p.name)).toEqual(['Dated', 'Amy', 'Zed']);
  });

  it('does not change the list it was given', () => {
    const list = [person('B', 'b', ['Go']), person('A', 'a', ['Go'])];
    newestFirst(list);
    expect(list.map((p) => p.name)).toEqual(['B', 'A']);
  });

  it('finds a profile by username, ignoring case', () => {
    const list = [person('Riya', 'Riya-Shah', ['Go'])];
    expect(findProfile(list, 'riya-shah')?.name).toBe('Riya');
    expect(findProfile(list, 'nobody')).toBeUndefined();
  });

  it('spots new arrivals between polls', () => {
    const known = new Set(['a', 'b']);
    expect(newArrivals(known, [person('A', 'a', ['Go']), person('C', 'C', ['Go'])])).toEqual(['c']);
    expect(newArrivals(known, [person('A', 'a', ['Go'])])).toEqual([]);
  });

  it('orders arrivals from the same poll by when they joined', () => {
    const late = at(person('Late', 'late', ['Go']), '2026-09-28T10:00:05Z');
    const early = at(person('Early', 'early', ['Go']), '2026-09-28T10:00:01Z');
    expect(newArrivals(new Set(), [late, early])).toEqual(['early', 'late']);
  });

  it('never drops someone already on the board when a stale list arrives', () => {
    const riya = person('Riya', 'riya', ['Go']);
    const amy = person('Amy', 'amy', ['Go']);
    const merged = mergeProfiles([riya, amy], [riya]);
    expect(merged.map((p) => p.github_username).sort()).toEqual(['amy', 'riya']);
  });

  it('takes the newest version of a profile', () => {
    const merged = mergeProfiles([person('Riya', 'riya', ['Go'])], [{ ...person('Riya', 'RIYA', ['Go']), bio: 'updated' }]);
    expect(merged).toHaveLength(1);
    expect(merged[0].bio).toBe('updated');
  });

  it('speeds the spotlight up when a burst is waiting', () => {
    expect(spotlightDuration(1)).toBe(4500);
    expect(spotlightDuration(3)).toBe(4500);
    expect(spotlightDuration(4)).toBe(2000);
  });

  it('spotlights arrivals oldest first, one at a time', () => {
    const arrivals = ['c', 'b', 'a']; // newest first, as the hook stores them
    expect(nextSpotlight(arrivals, [])).toBe('a');
    expect(nextSpotlight(arrivals, ['a'])).toBe('b');
    expect(nextSpotlight(arrivals, ['a', 'b', 'c'])).toBeUndefined();
    expect(nextSpotlight([], [])).toBeUndefined();
  });
});

describe('checkProfile', () => {
  const good = { name: 'Riya Shah', github_username: 'riya', bio: 'Hi', interests: ['Go'], batch_year: 2029 };

  it('accepts a valid profile', () => {
    expect(checkProfile(good, 'riya.json')).toEqual([]);
    expect(checkProfile({ ...good, link: 'https://riya.dev', language: 'Go', fun_fact: 'Cats' }, 'riya.json')).toEqual([]);
  });

  it('allows profile filenames independent of GitHub usernames', () => {
    expect(checkProfile(good, 'someone-else.json')).toEqual([]);
  });

  it('explains mistakes', () => {
    expect(checkProfile({ ...good, batch_year: '2029' }, 'riya.json')).toHaveLength(1);
    expect(checkProfile({ ...good, intrests: [] }, 'riya.json')[0]).toMatch(/unknown field/);
    expect(checkProfile({ ...good, link: 'javascript:alert(1)' }, 'riya.json')).toHaveLength(1);
  });
});
