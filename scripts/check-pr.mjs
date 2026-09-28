// The check on pull requests. Unlike validate.mjs it only looks at what the PR
// changes, so one bad file already on main doesn't turn everyone else's PR red.
// Run after checking out the PR's merge commit with fetch-depth: 2 (HEAD^1 is main).
//   PR_AUTHOR       GitHub login of whoever opened the PR
//   PR_ASSOCIATION  OWNER / MEMBER / COLLABORATOR may change any file
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { checkFileName, checkProfile, parseProfile } from './validate.mjs';

const author = (process.env.PR_AUTHOR ?? '').toLowerCase();
const maintainer = ['OWNER', 'MEMBER', 'COLLABORATOR'].includes(process.env.PR_ASSOCIATION ?? '');
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' });

const usernameIn = (text) => parseProfile(text).profile?.github_username?.toLowerCase?.();
const oldVersion = (file) => git('show', `HEAD^1:${file}`);

// -z so file names with spaces or non-English letters come through unquoted.
const fields = git('diff', '--name-status', '--no-renames', '-z', 'HEAD^1', 'HEAD').split('\0').filter(Boolean);
const changes = [];
for (let i = 0; i < fields.length; i += 2) changes.push([fields[i], fields[i + 1]]);

const problems = [];
for (const [status, file] of changes) {
  const [folder, name, ...rest] = file.split('/');
  const isProfile = folder === 'profiles' && rest.length === 0 && !name.startsWith('_');

  if (!isProfile) {
    if (maintainer) continue;
    if (folder === 'profiles' && rest.length) problems.push(`${file}: put your file directly in profiles/, not in a subfolder`);
    else if (file === 'profiles/_example.json') problems.push(`${file}: don't edit the example. Copy it to profiles/${author}.json and edit the copy`);
    else problems.push(`${file}: only add your own file in profiles/. Undo your changes to this file`);
    continue;
  }

  // Changing or deleting a file that's already on main: it has to be yours.
  if (status !== 'A' && !maintainer) {
    const owner = usernameIn(oldVersion(file));
    if (owner && owner !== author) {
      problems.push(`${file}: this is ${owner}'s profile. Only change your own file (profiles/${author}.json)`);
      continue;
    }
  }
  if (status === 'D') continue;

  const nameError = checkFileName(name);
  if (nameError) {
    problems.push(`${file}: ${nameError}`);
    continue;
  }
  const { profile, error } = parseProfile(readFileSync(file, 'utf8'));
  if (error) {
    problems.push(`${file}: ${error}`);
    continue;
  }
  const errors = checkProfile(profile, name);
  for (const e of errors) problems.push(`${file}: ${e}`);
  if (errors.length) continue;

  const username = profile.github_username.toLowerCase();
  if (!maintainer && username !== author) {
    problems.push(`${file}: "github_username" is "${profile.github_username}", but this pull request is from "${process.env.PR_AUTHOR}". Use your own username`);
    continue;
  }
  const twin = readdirSync('profiles').find(
    (other) => other !== name && !other.startsWith('_') && other.endsWith('.json') && usernameIn(readFileSync(`profiles/${other}`, 'utf8')) === username,
  );
  if (twin) problems.push(`${file}: "${profile.github_username}" already has a profile in profiles/${twin}. Edit that file instead of adding a new one`);
}

for (const p of problems) console.log(`::error::${p}`);
if (problems.length) process.exit(1);
console.log(changes.length ? 'Your profile looks good.' : 'No changes to check.');
