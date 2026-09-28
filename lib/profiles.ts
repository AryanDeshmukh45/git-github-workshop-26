import 'server-only';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { checkProfile, parseProfile } from '../scripts/validate.mjs';
import type { Profile } from './types';

// In production the profiles are read straight from GitHub, so a merged pull
// request shows up without a redeploy. Locally, and when GITHUB_TOKEN isn't
// set, they're read from the profiles/ folder.
const REPO = process.env.GITHUB_REPO; // "owner/name"
const TOKEN = process.env.GITHUB_TOKEN;
const BRANCH = process.env.GITHUB_BRANCH ?? 'main';
const TTL_MS = 15_000;

interface File {
  name: string;
  text: string;
  joinedAt?: string;
}

let cache: { at: number; profiles: Profile[] } | null = null;

// file name -> ISO date of the last commit that touched it. Files rarely change
// after they're merged, so this is effectively "when they joined". Kept between
// refreshes so only new files need looking up.
const joinedAt = new Map<string, string>();

async function graphql(query: string, variables: Record<string, string>) {
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`GitHub returned ${res.status}`);
  const json = await res.json();
  if (json.errors) throw new Error(`GitHub error: ${JSON.stringify(json.errors)}`);
  return json.data;
}

async function lookUpJoinDates(owner: string, name: string, files: string[]) {
  const missing = files.filter((f) => !joinedAt.has(f));
  for (let i = 0; i < missing.length; i += 50) {
    const batch = missing.slice(i, i + 50);
    const fields = batch
      .map((f, j) => `f${j}: history(first: 1, path: ${JSON.stringify(`profiles/${f}`)}) { nodes { committedDate } }`)
      .join('\n');
    const data = await graphql(
      `query($owner: String!, $name: String!, $expr: String!) {
        repository(owner: $owner, name: $name) { object(expression: $expr) { ... on Commit { ${fields} } } }
      }`,
      { owner, name, expr: BRANCH },
    );
    const commit = data.repository?.object ?? {};
    batch.forEach((f, j) => {
      const date = commit[`f${j}`]?.nodes?.[0]?.committedDate;
      if (date) joinedAt.set(f, date);
    });
  }
}

async function fromGitHub(): Promise<File[]> {
  const [owner, name] = REPO!.split('/');
  const data = await graphql(
    `query($owner: String!, $name: String!, $expr: String!) {
      repository(owner: $owner, name: $name) {
        object(expression: $expr) { ... on Tree { entries { name object { ... on Blob { text } } } } }
      }
    }`,
    { owner, name, expr: `${BRANCH}:profiles` },
  );
  const entries: { name: string; object: { text?: string } | null }[] | undefined = data.repository?.object?.entries;
  if (!entries) throw new Error('No profiles folder found on GitHub');
  const jsonFiles = entries.map((e) => e.name).filter((n) => n.endsWith('.json') && !n.startsWith('_'));
  try {
    await lookUpJoinDates(owner, name, jsonFiles);
  } catch (error) {
    console.error('Could not look up join dates:', error); // the board still works, just unordered
  }
  return entries.map((e) => ({ name: e.name, text: e.object?.text ?? '', joinedAt: joinedAt.get(e.name) }));
}

async function fromDisk(): Promise<File[]> {
  // Shipped via outputFileTracingIncludes in next.config.ts.
  const dir = process.env.PROFILES_DIR ?? path.join(/*turbopackIgnore: true*/ process.cwd(), 'profiles');
  const names = await readdir(dir);
  return Promise.all(
    names.map(async (name) => {
      const file = path.join(/*turbopackIgnore: true*/ dir, name);
      const [text, info] = await Promise.all([readFile(file, 'utf8'), stat(file)]);
      return { name, text, joinedAt: info.mtime.toISOString() };
    }),
  );
}

function parse(files: File[]): Profile[] {
  const profiles: Profile[] = [];
  const seen = new Set<string>();
  // Sorted like the validator, so the same file wins if a username appears twice.
  for (const file of [...files].sort((a, b) => (a.name < b.name ? -1 : 1))) {
    if (!file.name.endsWith('.json') || file.name.startsWith('_')) continue;
    // A broken file is skipped rather than taking the whole board down.
    const { profile } = parseProfile(file.text);
    if (!profile || checkProfile(profile, file.name).length > 0) continue;
    const key = profile.github_username.toLowerCase();
    if (seen.has(key)) continue; // one card per person, or the header and board counts disagree
    seen.add(key);
    profiles.push({ ...profile, joined_at: file.joinedAt });
  }
  return profiles;
}

let inflight: Promise<Profile[]> | null = null;

export async function getProfiles(): Promise<Profile[]> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.profiles;
  // Requests that arrive while a refresh is running share it instead of each calling GitHub.
  inflight ??= refresh().finally(() => {
    inflight = null;
  });
  return inflight;
}

async function refresh(): Promise<Profile[]> {
  let files: File[];
  try {
    files = REPO && TOKEN ? await fromGitHub() : await fromDisk();
  } catch (error) {
    console.error('Could not load profiles:', error);
    if (cache) return cache.profiles;
    files = await fromDisk();
  }
  cache = { at: Date.now(), profiles: parse(files) };
  return cache.profiles;
}
