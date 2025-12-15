import MockAdapter from 'axios-mock-adapter';

export function setupMockApi(api) {
  const mock = new MockAdapter(api, { delayResponse: 300 });

  let state = {
    token: 'mock-token',
    user: {
      _id: 'user_1',
      email: 'test@example.com',
      socialAccounts: {
        twitter: { connected: true },
        linkedin: { connected: true },
        facebook: { connected: false },
        instagram: { connected: false },
      },
    },
    brand: null,
    posts: {},
  };

  const ok = (data) => [200, data];

  mock.onPost(/\/api\/v1\/auth\/register/).reply(cfg => {
    return ok({ token: state.token, user: state.user });
  });
  mock.onPost(/\/api\/v1\/auth\/login/).reply(cfg => ok({ token: state.token, user: state.user }));
  mock.onGet(/\/api\/v1\/auth\/me/).reply(() => ok({ user: state.user }));

  mock.onPost(/\/api\/v1\/brands\/onboard/).reply(cfg => {
    const body = safeJSON(cfg.data);
    state.brand = { _id: 'brand_1', name: body?.name || 'Mock Brand' };
    return ok({ brand: state.brand });
  });

  mock.onGet(/\/api\/v1\/trends/).reply(cfg => {
    const params = new URLSearchParams(cfg.url.split('?')[1] || '');
    const category = params.get('category') || 'general';
    const items = Array.from({ length: 5 }).map((_, i) => ({ id: `t_${i}`, title: `${category} trend #${i+1}` }));
    return ok({ items });
  });

  mock.onPost(/\/api\/v1\/posts\/generate/).reply(cfg => {
    const body = safeJSON(cfg.data);
    const id = `post_${Date.now()}`;
    const draft = {
      _id: id,
      brandId: state.brand?._id || 'brand_1',
      content: {
        copy: `Mock copy for ${body?.platform || 'twitter'} based on trend ${body?.trendId || ''}`,
        graphicUrl: 'https://placekitten.com/400/400',
      }
    };
    state.posts[id] = draft;
    return ok(draft);
  });

  mock.onPost(/\/api\/v1\/posts\/.+\/publish/).reply(cfg => {
    const m = cfg.url.match(/posts\/(.+)\/publish/);
    const id = m?.[1];
    const body = safeJSON(cfg.data);
    const post = state.posts[id];
    const platform = body?.platform || 'twitter';
    const published = {
      ...post,
      platform,
      status: 'published',
      platformPostId: `mock_${platform}_${Date.now()}`,
      platformUrl: `https://example.com/${platform}/post/${id}`,
      brandId: post?.brandId || state.brand?._id,
    };
    state.posts[id] = published;
    return ok({ post: published });
  });

  mock.onGet(/\/api\/v1\/analytics\/.+/).reply(cfg => {
    return ok({ total: Object.keys(state.posts).length, published: Object.values(state.posts).filter(p => p.status==='published').length, drafts: Object.values(state.posts).filter(p => p.status!=='published').length, byPlatform: [] });
  });

  mock.onGet(/\/api\/v1\/oauth\/.+\/recommended-scopes/).reply(() => ok({ scopes: ['tweet.read','tweet.write','users.read'] }));

  mock.onGet(/\/api\/v1\/meta\/pages/).reply(() => ok({ pages: [{ id: 'page_1', name: 'Mock Page' }] }));
  mock.onPost(/\/api\/v1\/meta\/pages\/select/).reply(() => ok({ ok: true }));
  mock.onGet(/\/api\/v1\/meta\/instagram-account/).reply(() => ok({ igBusinessId: 'ig_123' }));
  mock.onPost(/\/api\/v1\/meta\/pages\/.+\/publish/).reply(() => ok({ postId: 'fb_123' }));
  mock.onPost(/\/api\/v1\/meta\/instagram\/.+\/publish/).reply(() => ok({ igMediaId: 'ig_media_123' }));

  function safeJSON(data) {
    try { return JSON.parse(data || '{}'); } catch { return {}; }
  }

  return mock;
}
