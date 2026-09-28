import { mkdtemp, rm, utimes, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const valid = (name: string, user: string) =>
  JSON.stringify({ name, github_username: user, bio: 'Hello', interests: ['Go'], batch_year: 2029 });

let dir: string;

async function write(file: string, text: string, mtime?: string) {
  await writeFile(path.join(dir, file), text);
  if (mtime) await utimes(path.join(dir, file), new Date(mtime), new Date(mtime));
}

// profiles.ts reads GITHUB_* when it's imported, so each test imports a fresh copy.
async function load(env: Record<string, string> = {}) {
  vi.resetModules();
  for (const key of ['GITHUB_REPO', 'GITHUB_TOKEN', 'GITHUB_BRANCH']) delete process.env[key];
  Object.assign(process.env, { PROFILES_DIR: dir, ...env });
  return (await import('./profiles')).getProfiles;
}

beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'profiles-'));
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(async () => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  await rm(dir, { recursive: true, force: true });
});

describe('loading from disk', () => {
  it('returns valid profiles and skips everything else', async () => {
    await write('riya.json', valid('Riya', 'riya'));
    await write('broken.json', JSON.stringify({ name: 'Broken' }));
    await write('bad.json', '{ not json');
    await write('_example.json', valid('Example', '_example'));
    await write('notes.txt', 'hello');
    const profiles = await (await load())();
    expect(profiles.map((p) => p.github_username)).toEqual(['riya']);
  });

  it('uses the file time as the join date', async () => {
    await write('riya.json', valid('Riya', 'riya'), '2026-09-28T10:00:00Z');
    const [riya] = await (await load())();
    expect(riya.joined_at).toBe('2026-09-28T10:00:00.000Z');
  });

  it('caches for 15 seconds', async () => {
    const now = vi.spyOn(Date, 'now').mockReturnValue(1_000_000);
    await write('a.json', valid('Amy', 'a'));
    const getProfiles = await load();
    expect(await getProfiles()).toHaveLength(1);

    await write('b.json', valid('Ben', 'b'));
    now.mockReturnValue(1_010_000);
    expect(await getProfiles()).toHaveLength(1);

    now.mockReturnValue(1_016_000);
    expect(await getProfiles()).toHaveLength(2);
  });
});

describe('loading from GitHub', () => {
  const env = { GITHUB_REPO: 'csi-spit/sourcestart-profiles', GITHUB_TOKEN: 'test-token' };

  function tree(files: Record<string, string>) {
    return { data: { repository: { object: { entries: Object.entries(files).map(([name, text]) => ({ name, object: { text } })) } } } };
  }

  function history(dates: (string | null)[]) {
    const object = Object.fromEntries(dates.map((d, i) => [`f${i}`, { nodes: d ? [{ committedDate: d }] : [] }]));
    return { data: { repository: { object } } };
  }

  function mockGitHub(handler: (body: { query: string; variables: Record<string, string> }) => unknown) {
    const fetch = vi.fn(async (_url: string, init: RequestInit) => Response.json(handler(JSON.parse(String(init.body)))));
    vi.stubGlobal('fetch', fetch);
    return fetch;
  }

  const isTree = (query: string) => query.includes('entries');

  it('reads the profiles folder on the main branch, with the token', async () => {
    const fetch = mockGitHub((body) => (isTree(body.query) ? tree({ 'riya.json': valid('Riya', 'riya') }) : history(['2026-09-28T10:00:00Z'])));
    const profiles = await (await load(env))();

    expect(profiles).toHaveLength(1);
    expect(profiles[0].joined_at).toBe('2026-09-28T10:00:00Z');
    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe('https://api.github.com/graphql');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer test-token');
    expect(JSON.parse(String(init.body)).variables).toEqual({ owner: 'csi-spit', name: 'sourcestart-profiles', expr: 'main:profiles' });
  });

  it('looks up join dates only for profile files, and only once', async () => {
    const now = vi.spyOn(Date, 'now').mockReturnValue(1_000_000);
    let files: Record<string, string> = { 'a.json': valid('Amy', 'a'), '_example.json': '{}', 'README.md': '' };
    const historyQueries: string[] = [];
    mockGitHub((body) => {
      if (isTree(body.query)) return tree(files);
      historyQueries.push(body.query);
      return history(historyQueries.length === 1 ? ['2026-09-01T00:00:00Z'] : ['2026-09-02T00:00:00Z']);
    });
    const getProfiles = await load(env);
    await getProfiles();
    expect(historyQueries).toHaveLength(1);
    expect(historyQueries[0]).toContain('"profiles/a.json"');
    expect(historyQueries[0]).not.toContain('_example');
    expect(historyQueries[0]).not.toContain('README');

    files = { ...files, 'b.json': valid('Ben', 'b') };
    now.mockReturnValue(1_020_000);
    const profiles = await getProfiles();
    expect(historyQueries).toHaveLength(2);
    expect(historyQueries[1]).toContain('"profiles/b.json"');
    expect(historyQueries[1]).not.toContain('"profiles/a.json"');
    expect(profiles.find((p) => p.github_username === 'a')?.joined_at).toBe('2026-09-01T00:00:00Z');
    expect(profiles.find((p) => p.github_username === 'b')?.joined_at).toBe('2026-09-02T00:00:00Z');
  });

  it('shares one GitHub call between requests that arrive together', async () => {
    const fetch = mockGitHub((body) => (isTree(body.query) ? tree({ 'a.json': valid('Amy', 'a') }) : history(['2026-09-01T00:00:00Z'])));
    const getProfiles = await load(env);
    const results = await Promise.all(Array.from({ length: 20 }, () => getProfiles()));
    expect(results.every((r) => r.length === 1)).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(2); // one tree query + one join-date query
  });

  it('still shows profiles if the join date lookup fails', async () => {
    mockGitHub((body) => (isTree(body.query) ? tree({ 'a.json': valid('Amy', 'a') }) : { errors: [{ message: 'nope' }] }));
    const profiles = await (await load(env))();
    expect(profiles).toHaveLength(1);
    expect(profiles[0].joined_at).toBeUndefined();
  });

  it('keeps showing the last good list if GitHub goes down', async () => {
    const now = vi.spyOn(Date, 'now').mockReturnValue(1_000_000);
    let down = false;
    vi.stubGlobal('fetch', vi.fn(async (_url: string, init: RequestInit) => {
      if (down) return new Response('oops', { status: 502 });
      const body = JSON.parse(String(init.body));
      return Response.json(isTree(body.query) ? tree({ 'a.json': valid('Amy', 'a'), 'b.json': valid('Ben', 'b') }) : history([null, null]));
    }));
    const getProfiles = await load(env);
    expect(await getProfiles()).toHaveLength(2);

    down = true;
    now.mockReturnValue(1_020_000);
    expect(await getProfiles()).toHaveLength(2);
  });

  it('falls back to the files on disk if GitHub is down from the start', async () => {
    await write('local.json', valid('Local', 'local'));
    vi.stubGlobal('fetch', vi.fn(async () => new Response('oops', { status: 500 })));
    const profiles = await (await load(env))();
    expect(profiles.map((p) => p.github_username)).toEqual(['local']);
  });
});
