import { describe, expect, it } from 'vite-plus/test';

import { createApp } from '../app.js';
import type { CategoryRepository } from '../routes/categories.js';
import { authHeaders, createAuthFixture } from './auth-fixtures.js';

describe('category routes', () => {
  it('lists and creates categories within the authenticated account', async () => {
    const fixture = createAuthFixture();
    const repository: CategoryRepository = {
      async create(input) {
        expect(input.userId).toBe('local-1');
        expect(input.normalizedName).toBe('quiet nights');
        return { id: 'category-a', name: input.name, userId: input.userId };
      },
      async findById(input) {
        return input.userId === 'local-1'
          ? { id: input.id, name: 'Quiet nights', userId: input.userId }
          : null;
      },
      async listByUserId(userId) {
        if (userId !== 'local-1') {
          return [];
        }
        return [
          {
            count: 1,
            coverImageUrls: ['https://images.example/wallpaper.png'],
            id: 'category-a',
            name: 'Quiet nights',
          },
        ];
      },
    };
    const app = createApp({
      categories: repository,
      clerk: fixture.clerk,
      me: fixture.users,
    });

    const list = await app.request('/categories', { headers: authHeaders() });
    expect(list.status).toBe(200);
    await expect(list.json()).resolves.toMatchObject({
      categories: [{ count: 1, id: 'category-a' }],
    });

    const created = await app.request('/categories', {
      body: JSON.stringify({ name: '  Quiet nights  ' }),
      headers: { ...authHeaders(), 'content-type': 'application/json' },
      method: 'POST',
    });
    expect(created.status).toBe(201);
    await expect(created.json()).resolves.toMatchObject({
      category: { id: 'category-a', name: 'Quiet nights', userId: 'local-1' },
    });

    const otherAccount = await app.request('/categories', {
      headers: authHeaders('token-user-b'),
    });
    expect(otherAccount.status).toBe(200);
  });
});
