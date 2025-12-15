import axios from 'axios';
import crypto from 'crypto';

function base64url(input) {
  return input.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export function generatePkceVerifier() {
  return base64url(crypto.randomBytes(32).toString('base64'));
}

export function sha256Base64url(verifier) {
  const hash = crypto.createHash('sha256').update(verifier).digest('base64');
  return base64url(hash);
}

export function buildLinkedInAuthUrl({ clientId, redirectUri, state, scopes = ['r_liteprofile','w_member_social'] }) {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
    scope: scopes.join(' ')
  });
  return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
}

export async function exchangeLinkedInCode({ clientId, clientSecret, redirectUri, code }) {
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret
  });
  const r = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', params.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });
  return r.data; // { access_token, expires_in }
}

export function buildTwitterAuthUrl({ clientId, redirectUri, state, codeChallenge, codeChallengeMethod = 'S256', scopes = ['tweet.read','tweet.write','users.read','offline.access'] }) {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: scopes.join(' '),
    state,
    code_challenge: codeChallenge,
    code_challenge_method: codeChallengeMethod
  });
  return `https://twitter.com/i/oauth2/authorize?${params.toString()}`;
}

export async function exchangeTwitterCode({ clientId, redirectUri, codeVerifier, code }) {
  // Twitter PKCE flow; client secret not required for user auth
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: clientId,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
    code
  });
  const r = await axios.post('https://api.twitter.com/2/oauth2/token', params.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });
  return r.data; // { access_token, refresh_token, expires_in }
}
