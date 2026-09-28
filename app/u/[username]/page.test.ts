import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/profiles', () => ({
  getProfiles: async () => [{ name: 'Riya Shah', github_username: 'Riya', bio: 'Hi', interests: ['Go'], batch_year: 2029 }],
}));

const params = (username: string) => ({ params: Promise.resolve({ username }) });

describe('share page', () => {
  it('titles the page after the person, whatever the case of the URL', async () => {
    const { generateMetadata } = await import('./page');
    const meta = await generateMetadata(params('riya'));
    expect(meta.title).toBe('Riya Shah · Source Start');
    expect(meta.description).toMatch(/first open-source contribution/);
  });

  it('is a 404 for someone who is not on the board', async () => {
    const { default: SharePage, generateMetadata } = await import('./page');
    expect((await generateMetadata(params('nobody'))).title).toMatch(/Not found/);
    await expect(SharePage(params('nobody'))).rejects.toThrow(/NEXT_HTTP_ERROR_FALLBACK;404|NEXT_NOT_FOUND/);
  });
});
