import axios from 'axios';

export async function publishToTwitter({ accessToken, text }) {
  if (!accessToken) throw new Error('missing twitter access token');
  const r = await axios.post('https://api.twitter.com/2/tweets', { text }, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  const id = r.data?.data?.id;
  const url = id ? `https://twitter.com/i/web/status/${id}` : null;
  return { id, url };
}

export async function publishToLinkedIn({ accessToken, authorUrn, text, mediaUrl }) {
  if (!accessToken) throw new Error('missing linkedin access token');
  if (!authorUrn) throw new Error('missing linkedin authorUrn');
  const body = {
    author: authorUrn,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: { text },
        shareMediaCategory: mediaUrl ? 'ARTICLE' : 'NONE',
        media: mediaUrl ? [{ status: 'READY', originalUrl: mediaUrl, title: { text: ' ' } }] : undefined
      }
    },
    visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' }
  };
  const r = await axios.post('https://api.linkedin.com/v2/ugcPosts', body, {
    headers: { Authorization: `Bearer ${accessToken}`, 'X-Restli-Protocol-Version': '2.0.0' }
  });
  const id = r.data?.id;
  return { id, url: null };
}

function facebookClient(accessToken) {
  if (!accessToken) throw new Error('missing facebook access token');
  const instance = axios.create({ baseURL: 'https://graph.facebook.com/v20.0' });
  instance.interceptors.request.use((config) => {
    config.params = { ...(config.params || {}), access_token: accessToken };
    return config;
  });
  return instance;
}

export async function publishToFacebookPage({ accessToken, pageId, text, imageUrl }) {
  if (!pageId) throw new Error('missing facebook page');
  const client = facebookClient(accessToken);
  const endpoint = imageUrl ? `/${pageId}/photos` : `/${pageId}/feed`;
  const params = imageUrl ? { url: imageUrl, caption: text || '' } : { message: text || '' };
  const r = await client.post(endpoint, null, { params });
  const id = r.data?.id;
  let permalink = null;
  if (id) {
    try {
      const details = await client.get(`/${id}`, { params: { fields: 'permalink_url' } });
      permalink = details.data?.permalink_url || null;
    } catch {}
  }
  return { id, url: permalink };
}

export async function publishToInstagramBusiness({ accessToken, igBusinessId, caption, imageUrl }) {
  if (!igBusinessId) throw new Error('missing instagram business id');
  if (!imageUrl) throw new Error('instagram requires an image url');
  const client = facebookClient(accessToken);
  const container = await client.post(`/${igBusinessId}/media`, null, { params: { image_url: imageUrl, caption: caption || '' } });
  const creationId = container.data?.id;
  const publish = await client.post(`/${igBusinessId}/media_publish`, null, { params: { creation_id: creationId } });
  return { id: publish.data?.id, url: null };
}
