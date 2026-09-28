import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/profiles', () => ({
  getProfiles: async () => [{ name: 'Riya', github_username: 'riya', bio: 'Hi', interests: ['Go'], batch_year: 2029 }],
}));

describe('GET /api/profiles', () => {
  it('returns the profiles as JSON and is never cached', async () => {
    const { GET } = await import('./route');
    const res = await GET();
    expect(res.headers.get('Cache-Control')).toBe('no-store');
    expect(await res.json()).toEqual([{ name: 'Riya', github_username: 'riya', bio: 'Hi', interests: ['Go'], batch_year: 2029 }]);
  });
});
