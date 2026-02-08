export const SPOTIFY_AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";
export const SPOTIFY_API_BASE = "https://api.spotify.com/v1";

// Scopes required for the application
export const SCOPES = [
  "user-read-private",
  "user-read-email",
  "playlist-read-private",
  "playlist-read-collaborative",
];

export const REDIRECT_URI = window.location.origin + "/";

// Fallback for demo purposes if user doesn't have one (Note: This is a placeholder, 
// usually we need the user to provide one or use a hosted proxy for a purely frontend app)
export const DEFAULT_CLIENT_ID_STORAGE_KEY = "spotify_client_id_v1";