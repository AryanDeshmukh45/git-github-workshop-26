import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { checkDirectory, parseProfile } from './validate.mjs';

let dir: string;
beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'validate-'));
});
afterEach(() => rm(dir, { recursive: true, force: true }));

const good = { name: 'Riya Shah', github_username: 'riya', bio: 'Hi', interests: ['Go'], batch_year: 2029 };

describe('checkDirectory', () => {
  it('passes a folder of valid profiles', async () => {
    await writeFile(path.join(dir, 'contributor-1.json'), JSON.stringify(good));
    await writeFile(path.join(dir, '_example.json'), '{ ignored }');
    expect(await checkDirectory(dir)).toEqual([]);
  });

  it('reports every problem with the file name', async () => {
    await writeFile(path.join(dir, 'riya.json'), '{ "name": "Riya", }');
    await writeFile(path.join(dir, 'me.txt'), 'hi');
    await writeFile(path.join(dir, 'amy.json'), JSON.stringify({ ...good, github_username: 'amy', batch_year: '2029' }));
    const problems = await checkDirectory(dir);
    expect(problems).toHaveLength(3);
    expect(problems[0]).toMatch(/^amy\.json: "batch_year"/);
    expect(problems[1]).toMatch(/^me\.txt: profiles must be \.json files/);
    expect(problems[2]).toMatch(/^riya\.json: line 1 ends with a comma/);
  });

  it('rejects a second file for the same username', async () => {
    await writeFile(path.join(dir, 'a.json'), JSON.stringify(good));
    await writeFile(path.join(dir, 'b.json'), JSON.stringify({ ...good, github_username: 'RIYA' }));
    const problems = await checkDirectory(dir);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toMatch(/^b\.json: "RIYA" already has a profile in a\.json/);
  });
});

describe('parseProfile', () => {
  const error = (text: string) => parseProfile(text).error;

  it('accepts a BOM from Windows editors', () => {
    expect(parseProfile('\uFEFF{"a": 1}')).toEqual({ profile: { a: 1 } });
  });

  it('explains the usual mistakes with a line number', () => {
    expect(error('')).toMatch(/empty/);
    expect(error('{\n  "bio": “Hi”\n}')).toMatch(/line 2 has curly quotes/);
    expect(error('{\n  // me\n  "a": 1\n}')).toMatch(/line 2 is a comment/);
    expect(error("{\n  'a': 1\n}")).toMatch(/line 2 uses single quotes/);
    expect(error('{\n  name: "x"\n}')).toMatch(/line 2: the field name needs double quotes/);
    expect(error('{\n  "a": 1,\n}')).toMatch(/line 2 ends with a comma/);
    expect(error('{\n  "a": 1\n  "b": 2\n}')).toMatch(/line 2 is missing a comma/);
    expect(error('{\n  "a": [1, 2\n}')).toMatch(/not valid JSON/);
    expect(error('{\n  "link": "https://x.dev"\n')).toMatch(/a \{ or \} is missing/);
  });
});
