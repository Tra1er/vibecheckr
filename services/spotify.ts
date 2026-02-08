import { SPOTIFY_API_BASE } from "../constants";
import { Playlist, PlaylistTrackItem, SpotifyUser, AudioFeatures } from "../types";

export const getHashParams = (): Record<string, string> => {
  const hash = window.location.hash.substring(1);
  const params: Record<string, string> = {};
  hash.split("&").forEach((part) => {
    const [key, value] = part.split("=");
    if (key && value) {
      params[key] = decodeURIComponent(value);
    }
  });
  return params;
};

export const fetchProfile = async (token: string): Promise<SpotifyUser> => {
  const res = await fetch(`${SPOTIFY_API_BASE}/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch profile");
  return res.json();
};

export const fetchPlaylists = async (token: string): Promise<Playlist[]> => {
  const res = await fetch(`${SPOTIFY_API_BASE}/me/playlists?limit=50`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch playlists");
  const data = await res.json();
  return data.items;
};

export const fetchPlaylistTracks = async (token: string, playlistId: string): Promise<PlaylistTrackItem[]> => {
  let allTracks: PlaylistTrackItem[] = [];
  let nextUrl: string | null = `${SPOTIFY_API_BASE}/playlists/${playlistId}/tracks?limit=100`;

  // Fetching first 100 for speed in this demo, iterating for all is possible but slow
  if (nextUrl) {
    const res: Response = await fetch(nextUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
        const data = await res.json();
        // Filter out null tracks (can happen in Spotify playlists)
        allTracks = data.items.filter((item: any) => item.track);
    }
  }
  return allTracks;
};

export const fetchAudioFeatures = async (token: string, trackIds: string[]): Promise<(AudioFeatures | null)[]> => {
    // Spotify allows up to 100 ids per request
    const chunks = [];
    for (let i = 0; i < trackIds.length; i += 100) {
        chunks.push(trackIds.slice(i, i + 100));
    }

    const allFeatures: (AudioFeatures | null)[] = [];

    for (const chunk of chunks) {
        const res = await fetch(`${SPOTIFY_API_BASE}/audio-features?ids=${chunk.join(',')}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
            const data = await res.json();
            allFeatures.push(...data.audio_features);
        }
    }
    return allFeatures;
}