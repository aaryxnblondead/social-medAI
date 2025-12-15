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
