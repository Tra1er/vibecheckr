import React, { useState, useEffect } from "react";
import { SCOPES, REDIRECT_URI, SPOTIFY_AUTH_ENDPOINT, DEFAULT_CLIENT_ID_STORAGE_KEY } from "../constants";
import { Music, AlertCircle } from "lucide-react";

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [clientId, setClientId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const storedId = localStorage.getItem(DEFAULT_CLIENT_ID_STORAGE_KEY);
    if (storedId) setClientId(storedId);
  }, []);

  const handleLogin = () => {
    if (!clientId) {
      setError("Please enter a Spotify Client ID");
      return;
    }
    localStorage.setItem(DEFAULT_CLIENT_ID_STORAGE_KEY, clientId);
    
    const authUrl = `${SPOTIFY_AUTH_ENDPOINT}?client_id=${clientId}&redirect_uri=${encodeURIComponent(
      REDIRECT_URI
    )}&scope=${encodeURIComponent(SCOPES.join(" "))}&response_type=token&show_dialog=true`;
    
    window.location.href = authUrl;
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-neutral-900 rounded-2xl p-8 shadow-2xl border border-neutral-800">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-[#1DB954] rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(29,185,84,0.3)]">
            <Music className="text-black w-8 h-8" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-center text-white mb-2">VibeCheck</h1>
        <p className="text-neutral-400 text-center mb-8">
          Preview your playlists and analyze their energy.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
              Spotify Client ID
            </label>
            <input
              type="text"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="e.g. 8a9b..."
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#1DB954] focus:ring-1 focus:ring-[#1DB954] transition-all"
            />
            <p className="text-[10px] text-neutral-500 mt-2">
              Don't have one? <a href="https://developer.spotify.com/dashboard" target="_blank" rel="noreferrer" className="text-white underline hover:text-[#1DB954]">Create an app</a> in Spotify Dashboard. Add <code>{window.location.origin}/</code> as a Redirect URI.
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-900/20 p-3 rounded-lg border border-red-900/50">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={handleLogin}
            className="w-full bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold py-3.5 rounded-full transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
          >
            Connect with Spotify
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;