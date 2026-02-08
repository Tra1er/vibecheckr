import React from "react";
import { SCOPES, REDIRECT_URI, SPOTIFY_AUTH_ENDPOINT, SPOTIFY_CLIENT_ID } from "../constants";
import { Music } from "lucide-react";

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = () => {
  const handleLogin = () => {
    const authUrl = `${SPOTIFY_AUTH_ENDPOINT}?client_id=${SPOTIFY_CLIENT_ID}&redirect_uri=${encodeURIComponent(
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

        <button
          onClick={handleLogin}
          className="w-full bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold py-3.5 rounded-full transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
        >
          Connect with Spotify
        </button>
      </div>
    </div>
  );
};

export default Login;