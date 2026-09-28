import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const script = path.resolve('scripts/check-pr.mjs');
const profile = (username: string) =>
  JSON.stringify({ name: 'Riya Shah', github_username: username, bio: 'Hi', interests: ['Go'], batch_year: 2029 }, null, 2);

let dir: string;
const git = (...args: string[]) => execFileSync('git', args, { cwd: dir, stdio: 'pipe' });
const write = (file: string, text: string) => {
  mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
  writeFileSync(path.join(dir, file), text);
};

// Commits the current tree on top of main (like a PR merge commit) and runs the check.
function check(author: string, association = 'NONE') {
  git('add', '-A');
  git('commit', '-qm', 'pr', '--allow-empty');
  try {
    const out = execFileSync('node', [script], { cwd: dir, env: { ...process.env, PR_AUTHOR: author, PR_ASSOCIATION: association }, encoding: 'utf8' });
    return { ok: true, out };
  } catch (e) {
    return { ok: false, out: String((e as { stdout: string }).stdout) };
  }
}

beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), 'check-pr-'));
  git('init', '-q');
  git('config', 'user.email', 't@t');
  git('config', 'user.name', 't');
  write('README.md', 'hi');
  write('profiles/_example.json', profile('your-github-username'));
  write('profiles/amy.json', profile('amy'));
  write('profiles/broken.json', '{ "name": '); // already on main, must not fail other PRs
  git('add', '-A');
  git('commit', '-qm', 'main');
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

describe('check-pr', () => {
  it('passes a new profile for the PR author, ignoring broken files already on main', () => {
    write('profiles/riya.json', profile('Riya'));
    expect(check('riya')).toMatchObject({ ok: true });
  });

  it('handles file names with spaces and non-English letters', () => {
    write('profiles/रिया शाह.json', profile('riya'));
    expect(check('riya')).toMatchObject({ ok: true });
  });

  it('lets people edit their own file', () => {
    write('profiles/amy.json', profile('amy').replace('Hi', 'Hello'));
    expect(check('amy').ok).toBe(true);
  });

  it("rejects someone else's username, file, or the example", () => {
    write('profiles/riya.json', profile('amy'));
    write('profiles/amy.json', profile('amy').replace('Hi', 'hacked'));
    write('profiles/_example.json', '{}');
    write('README.md', 'changed');
    const { ok, out } = check('riya');
    expect(ok).toBe(false);
    expect(out).toMatch(/README\.md: only add your own file/);
    expect(out).toMatch(/_example\.json: don't edit the example/);
    expect(out).toMatch(/amy\.json: this is amy's profile/);
    expect(out).toMatch(/riya\.json: "github_username" is "amy", but this pull request is from "riya"/);
  });

  it('rejects a second file for the same person', () => {
    write('profiles/amy2.json', profile('Amy'));
    expect(check('amy').out).toMatch(/already has a profile in profiles\/amy\.json/);
  });

  it('rejects deleting someone else, but maintainers can change anything', () => {
    unlinkSync(path.join(dir, 'profiles/amy.json'));
    expect(check('riya').out).toMatch(/this is amy's profile/);
    write('README.md', 'changed');
    expect(check('csi', 'OWNER').ok).toBe(true);
  });

  it('explains a wrong extension and bad JSON', () => {
    write('profiles/riya.json.txt', profile('riya'));
    write('profiles/zed.json', profile('zed').replace('"Hi"', '“Hi”'));
    const { out } = check('riya');
    expect(out).toMatch(/rename it to riya\.json/);
    expect(out).toMatch(/curly quotes/);
  });
});
