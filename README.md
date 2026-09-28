# sourcestart-profiles

The Source Start contributors board. Add one small file about yourself and your card appears on the board, usually within a minute of your pull request being merged.

**This is a good first pull request.** Everyone adds their own file, so your change can never clash with anyone else's.

## Add yourself

1. Fork this repo.
2. Copy `profiles/_example.json` to `profiles/<your-github-username>.json` and fill it in. Don't edit `_example.json` itself.
3. Commit, push to your fork, and open a pull request....

```json
{
  "name": "Your Name",
  "github_username": "your-github-username",
  "bio": "One line about you, 120 characters at most.",
  "interests": ["Python", "Web Dev"],
  "batch_year": 2029,
  "language": "Python",
  "link": "https://your-site.example",
  "fun_fact": "Something people wouldn't guess about you."
}
```

`language`, `link` and `fun_fact` are optional. Your photo comes from your GitHub account.

A check runs on your pull request. If it fails, click **Details** to see exactly what's wrong with your file.

### Rules for a profile

The site **silently skips** any profile that breaks one of these rules: no error, your card just doesn't show up (and the player count won't include you). The check on your pull request catches all of them, so if it's red, fix it before merging.

| Rule | ✅ Good | ❌ Skipped | Error you'll see |
| --- | --- | --- | --- |
| File is in `profiles/` and ends in `.json` | `profiles/riya.json` | `riya.txt`, `riya.json.txt`, `riya.JSON` | `profiles must be .json files`, `rename it to riya.json` |
| File name doesn't start with `_` | `riya.json` | `_riya.json` (ignored, like `_example.json`) | none, it's just ignored |
| Valid JSON | `"bio": "Hi",` | trailing comma before `}`, a missing comma, single quotes, comments, curly quotes `“ ”` | says which line and what to fix, e.g. `line 4 is missing a comma at the end` |
| One `{ ... }` object | `{ "name": ... }` | `[ { ... } ]` | `should contain one { ... } object` |
| All required fields present | `name`, `github_username`, `bio`, `interests`, `batch_year` | leaving one out | `missing "..."` |
| No extra or misspelled fields | only the 8 fields in the example | `intrests`, `github`, `email`, `year` | `unknown field` |
| `name`: 2–50 characters | `"Riya Shah"` | `"R"`, `""` | `"name" must be 2-50 characters` |
| `github_username`: a real GitHub username | `"riya-shah"` | `"@riya"`, `"github.com/riya"`, `"riya_shah"`, `"riya-"`, `"riya--shah"` | `not a valid GitHub username` |
| `github_username` is **your own** account, the one opening the pull request | yours | a friend's, or the example's `your-github-username` | `this pull request is from ...` |
| Your PR only adds or edits **your own** file in `profiles/` | `profiles/riya-shah.json` | edits to `_example.json`, `README.md`, someone else's profile, or a file in a subfolder | `only add your own file`, `this is ...'s profile` |
| **One profile per person** | one file with your username | a second file (or a copy of `_example.json` / someone else's file) with the same `github_username`, even in different case | `already has a profile in ...` |
| `bio`: 1–120 characters | `"I build things"` | `""`, more than 120 characters | `"bio" must be 1-120 characters` |
| `interests`: a list of **1 to 5**, each 1–24 characters | `["Python", "Web Dev"]` | `"Python"` (not a list), `[]`, 6 or more entries, `[""]` | `"interests" must be a list of 1-5 short words` |
| `batch_year`: a number from 2020 to 2035 | `2029` | `"2029"` (quoted), `29`, `2029.5` | `"batch_year" must be a number like 2029` |
| `language` (optional): 1–20 characters | `"Python"` | `""`, `null` | `"language" must be 1-20 characters` |
| `link` (optional): starts with `https://`, no spaces | `"https://riya.dev"` | `"riya.dev"`, `"http://riya.dev"`, `"www.riya.dev"`, `""` | `"link" must start with https://` |
| `fun_fact` (optional): 1–100 characters | `"I juggle"` | `""`, more than 100 characters | `"fun_fact" must be 1-100 characters` |

Optional fields: leave them out entirely rather than setting them to `""` or `null`. Also:

- Edit only your own file. Don't copy someone else's file and leave their `github_username` in it.
- Test files (`demo.json`, `test copy.json`) count as profiles too. Remove them before merging.
- After a merge, your card can take about a minute to appear. Refresh the page.

You can check it yourself before pushing:

```
npm install
npm run validate
```

## The pages

- `/` — the board: everyone's cards, with search and filters. Click a card to flip it.
- `/live` — a big-screen view, newest cards first, for showing on a screen during events.
- `/u/<username>` — your own card on a page you can share.

## Working on the site

The board is a Next.js app. You need Node 22 or newer.

```
npm install
npm run dev     # http://localhost:3000
npm test
npm run build
```

- `app/` — the pages (`page.tsx`, `live/page.tsx`, `u/[username]/`) and `api/profiles`
- `components/` — the board, the cards, and the background effects (`ShapeWaves` needs WebGPU; `Dither` is used where it isn't available)
- `lib/board.ts` — sorting, search, interest counts, and the live-arrival logic
- `lib/profiles.ts` — loads the profiles
- `scripts/validate.mjs` — the profile rules, used by the check on your pull request and by the site

Ideas if you want to work on the site: filter by batch year, statistics about everyone on the board, a better card design, or contribution counts on the cards. Open an issue with what you have in mind.

## Contributing

Fork the repo, work on a branch, and open a pull request describing what you changed and how you tested it.

If you find a bug, open an issue with the steps to reproduce it, what you expected, and what happened instead.

Part of Source Start by CSI SPIT. MIT licensed.
