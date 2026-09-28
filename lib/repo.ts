export const repoUrl =
  process.env.NEXT_PUBLIC_REPO_URL ??
  (process.env.GITHUB_REPO ? `https://github.com/${process.env.GITHUB_REPO}` : 'https://github.com/techcsispit/sourcestart-profiles');
