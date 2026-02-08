export interface SpotifyUser {
  id: string;
  display_name: string;
  email: string;
  images: { url: string; height: number; width: number }[];
  product: string;
}

export interface SpotifyImage {
  url: string;
  height: number | null;
  width: number | null;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  images: SpotifyImage[];
  tracks: {
    total: number;
    href: string;
  };
  owner: {
    display_name: string;
  };
}

export interface Artist {
  id: string;
  name: string;
}

export interface Album {
  id: string;
  name: string;
  images: SpotifyImage[];
}

export interface Track {
  id: string;
  name: string;
  artists: Artist[];
  album: Album;
  duration_ms: number;
  preview_url: string | null;
  popularity: number;
}

export interface PlaylistTrackItem {
  added_at: string;
  track: Track;
}

export interface AudioFeatures {
  id: string;
  danceability: number;
  energy: number;
  key: number;
  loudness: number;
  mode: number;
  speechiness: number;
  acousticness: number;
  instrumentalness: number;
  liveness: number;
  valence: number;
  tempo: number;
}

export interface ExtendedTrack extends Track {
  features?: AudioFeatures;
  smartPreviewUrl?: string | null;
}

export interface GeminiAnalysisResult {
  vibe: string;
  tags: string[];
  suggestedArtists: string[];
}