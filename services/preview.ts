import { Track } from "../types";

// This simulates the core value of "spotify-preview-finder" but in a browser-safe way.
// The npm package scrapes or uses internal APIs which are blocked by CORS in browsers.
// This implementation uses the iTunes Search API which allows CORS and provides 30s previews.

export const findSmartPreview = async (track: Track): Promise<string | null> => {
  // 1. If Spotify has a preview, use it.
  if (track.preview_url) {
    return track.preview_url;
  }

  // 2. Fallback: Search iTunes
  try {
    const query = `${track.name} ${track.artists[0].name}`;
    const encodedQuery = encodeURIComponent(query);
    const response = await fetch(`https://itunes.apple.com/search?term=${encodedQuery}&media=music&limit=1`);
    
    if (response.ok) {
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        // iTunes returns a .m4a preview url usually
        return data.results[0].previewUrl;
      }
    }
  } catch (error) {
    console.warn("Failed to find fallback preview for", track.name, error);
  }

  return null;
};