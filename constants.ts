export const SPOTIFY_AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";
export const SPOTIFY_API_BASE = "https://api.spotify.com/v1";
export const SPOTIFY_CLIENT_ID = "7e1b4ae16e394f1d902e6e448a4e48c7";

// Scopes required for the application
export const SCOPES = [
  "user-read-private",
  "user-read-email",
  "playlist-read-private",
  "playlist-read-collaborative",
];

export const REDIRECT_URI = window.location.origin + "/";