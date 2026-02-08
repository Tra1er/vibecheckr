import { Track } from "../types";

// The user requested to avoid iTunes fallback as it provides incorrect songs.
// Since we are in a browser environment, we cannot scrape Spotify (CORS restrictions) 
// like the 'spotify-preview-finder' npm package does in Node.js.
//
// Strategy:
// 1. Return official preview_url if available.
// 2. If not, return null. The UI will handle null by rendering the official Spotify Embed.
//    The Spotify Embed guarantees the *correct* song and allows previewing.

export const findSmartPreview = async (track: Track): Promise<string | null> => {
  if (track.preview_url) {
    return track.preview_url;
  }
  return null;
};