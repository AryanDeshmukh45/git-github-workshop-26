// Checks the files in profiles/. Run with `npm run validate`.
// The site uses checkProfile() too, and leaves out any profile that fails it.
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const USERNAME = /^[A-Za-z0-9](?:[A-Za-z0-9]|-(?=[A-Za-z0-9])){0,38}$/;
const REQUIRED = ['name', 'github_username', 'bio', 'interests', 'batch_year'];
const OPTIONAL = ['language', 'link', 'fun_fact'];

const isText = (v, max) => typeof v === 'string' && v.trim().length > 0 && v.length <= max;

// JSON.parse, but with errors a first-timer can act on. Returns { profile } or { error }.
export function parseProfile(raw) {
  const text = raw.replace(/^\uFEFF/, ''); // Windows editors sometimes add an invisible BOM; it's harmless, so drop it
  try {
    return { profile: JSON.parse(text) };
  } catch (e) {
    return { error: explainJsonError(text, e.message) };
  }
}

function explainJsonError(text, message) {
  const lines = text.split('\n');
  const find = (re) => lines.findIndex((l) => re.test(l)) + 1; // 1-based line number, 0 if none
  let n;
  if (!text.trim()) return 'the file is empty. Copy profiles/_example.json and fill it in';
  if ((n = find(/[\u201C\u201D\u2018\u2019]/))) {
    return `line ${n} has curly quotes (“ ” or ‘ ’), usually from copying out of WhatsApp, Word or Docs. Retype them as straight quotes "`;
  }
  if ((n = find(/^\s*(\/\/|\/\*|#)/))) return `line ${n} is a comment. JSON doesn't allow comments, delete that line`;
  if ((n = find(/'[^']*'\s*:|:\s*'/))) return `line ${n} uses single quotes '. JSON needs double quotes "`;
  if ((n = find(/^\s*[A-Za-z_]+\s*:/))) return `line ${n}: the field name needs double quotes, like "name":`;
  const trailing = /,\s*[}\]]/.exec(text);
  if (trailing) {
    return `line ${text.slice(0, trailing.index).split('\n').length} ends with a comma, but it's the last item. Remove that comma`;
  }
  for (let i = 0; i < lines.length - 1; i++) {
    const next = lines.slice(i + 1).find((l) => l.trim());
    if (/["\d\]}el]\s*$/.test(lines[i]) && next && /^\s*"/.test(next)) {
      return `line ${i + 1} is missing a comma at the end`;
    }
  }
  if ((text.match(/{/g) ?? []).length !== (text.match(/}/g) ?? []).length) return 'a { or } is missing. The file should start with { and end with }';
  return `not valid JSON (${message}). Look for a missing comma or quote`;
}

export function checkProfile(p, fileName) {
  if (typeof p !== 'object' || p === null || Array.isArray(p)) return ['the file should contain one { ... } object'];

  const errors = [];
  for (const key of REQUIRED) if (!(key in p)) errors.push(`missing "${key}"`);
  for (const key of Object.keys(p)) {
    if (!REQUIRED.includes(key) && !OPTIONAL.includes(key)) errors.push(`unknown field "${key}" (check the spelling)`);
  }
  if (errors.length) return errors;

  if (!isText(p.name, 50) || p.name.trim().length < 2) errors.push('"name" must be 2-50 characters');
  if (typeof p.github_username !== 'string' || !USERNAME.test(p.github_username)) {
    errors.push('"github_username" is not a valid GitHub username');
  }
  if (!isText(p.bio, 120)) errors.push('"bio" must be 1-120 characters');
  if (!Array.isArray(p.interests) || p.interests.length < 1 || p.interests.length > 5 || !p.interests.every(i => isText(i, 24))) {
    errors.push('"interests" must be a list of 1-5 short words, like ["Python", "Music"]');
  }
  if (!Number.isInteger(p.batch_year) || p.batch_year < 2020 || p.batch_year > 2035) {
    errors.push('"batch_year" must be a number like 2029, without quotes');
  }
  if ('language' in p && !isText(p.language, 20)) errors.push('"language" must be 1-20 characters');
  if ('fun_fact' in p && !isText(p.fun_fact, 100)) errors.push('"fun_fact" must be 1-100 characters');
  if ('link' in p && !(typeof p.link === 'string' && /^https:\/\/[^\s]+$/.test(p.link))) {
    errors.push('"link" must start with https://');
  }
  return errors;
}

export function checkFileName(file) {
  if (/\.json\.\w+$/i.test(file)) return `rename it to ${file.replace(/(\.json)\.\w+$/i, '$1')} (your editor added an extra extension)`;
  if (!file.endsWith('.json')) return file.toLowerCase().endsWith('.json') ? 'the extension must be lowercase .json' : 'profiles must be .json files';
  return null;
}

export async function checkDirectory(dir) {
  const problems = [];
  const owners = new Map(); // lowercase username -> first file that used it
  for (const file of (await readdir(dir)).sort()) {
    if (file.startsWith('_') || file.startsWith('.')) continue;
    const nameError = checkFileName(file);
    if (nameError) {
      problems.push(`${file}: ${nameError}`);
      continue;
    }
    const { profile, error } = parseProfile(await readFile(path.join(dir, file), 'utf8'));
    if (error) {
      problems.push(`${file}: ${error}`);
      continue;
    }
    const errors = checkProfile(profile, file);
    for (const error of errors) problems.push(`${file}: ${error}`);
    if (errors.length) continue;
    const key = profile.github_username.toLowerCase();
    if (owners.has(key)) {
      problems.push(`${file}: "${profile.github_username}" already has a profile in ${owners.get(key)}. One file per person, edit that one instead.`);
    } else owners.set(key, file);
  }
  return problems;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dir = process.env.PROFILES_DIR ?? path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'profiles');
  const problems = await checkDirectory(dir);
  for (const p of problems) console.log(p);
  if (problems.length) process.exit(1);
  console.log('All profiles are valid.');
}
