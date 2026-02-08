import { SPOTIFY_CLIENT_ID, REDIRECT_URI, SCOPES } from "../constants";

const generateRandomString = (length: number) => {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, x) => acc + possible[x % possible.length], "");
}

const sha256 = async (plain: string) => {
  const encoder = new TextEncoder()
  const data = encoder.encode(plain)
  return window.crypto.subtle.digest('SHA-256', data)
}

const base64encode = (input: ArrayBuffer) => {
  return btoa(String.fromCharCode(...new Uint8Array(input)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

export const initiateLogin = async () => {
  const codeVerifier = generateRandomString(64);
  const hashed = await sha256(codeVerifier);
  const codeChallenge = base64encode(hashed);

  // Store verifier locally for the callback step
  window.localStorage.setItem('spotify_code_verifier', codeVerifier);

  const params =  {
    response_type: 'code',
    client_id: SPOTIFY_CLIENT_ID,
    scope: SCOPES.join(' '),
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
    redirect_uri: REDIRECT_URI,
  }

  const authUrl = new URL("https://accounts.spotify.com/authorize")
  authUrl.search = new URLSearchParams(params).toString();
  window.location.href = authUrl.toString();
}

export const getToken = async (code: string) => {
  const codeVerifier = window.localStorage.getItem('spotify_code_verifier');
  if (!codeVerifier) {
      throw new Error("Missing code verifier");
  }

  const payload = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: SPOTIFY_CLIENT_ID,
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      code_verifier: codeVerifier,
    }),
  }

  const response = await fetch("https://accounts.spotify.com/api/token", payload);
  if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error_description || "Failed to fetch token");
  }
  
  const data = await response.json();
  return data; // contains access_token, refresh_token, expires_in
}