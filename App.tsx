import React, { useState, useEffect } from 'react';
import { getHashParams, fetchProfile, fetchPlaylists } from './services/spotify';
import Login from './components/Login';
import PlaylistView from './components/PlaylistView';
import { SpotifyUser, Playlist } from './types';
import { LogOut, Music2, User } from 'lucide-react';

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<SpotifyUser | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check for token in hash
    const params = getHashParams();
    if (params.access_token) {
      setToken(params.access_token);
      window.location.hash = ""; // Clear hash for clean URL
    }
  }, []);

  useEffect(() => {
    if (token) {
      loadUserData(token);
    }
  }, [token]);

  const loadUserData = async (authToken: string) => {
    setLoading(true);
    try {
      const userData = await fetchProfile(authToken);
      setUser(userData);
      const userPlaylists = await fetchPlaylists(authToken);
      setPlaylists(userPlaylists);
    } catch (error) {
      console.error(error);
      setToken(null); // Reset on error (likely expired)
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    setPlaylists([]);
    setSelectedPlaylist(null);
  };

  if (!token) {
    return <Login onLogin={() => {}} />; // Login component handles the redirect
  }

  if (selectedPlaylist) {
    return (
      <PlaylistView 
        playlist={selectedPlaylist} 
        token={token} 
        onBack={() => setSelectedPlaylist(null)} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      {/* Navbar */}
      <header className="flex justify-between items-center mb-10">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#1DB954] rounded-full flex items-center justify-center">
                <Music2 className="text-black" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">VibeCheck</h1>
        </div>
        
        <div className="flex items-center gap-4">
            {user && (
                <div className="flex items-center gap-3 bg-neutral-900 rounded-full pl-2 pr-4 py-1.5 border border-white/10">
                    {user.images?.[0] ? (
                        <img src={user.images[0].url} alt={user.display_name} className="w-8 h-8 rounded-full" />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center">
                            <User size={16} />
                        </div>
                    )}
                    <span className="text-sm font-medium hidden sm:inline">{user.display_name}</span>
                </div>
            )}
            <button 
                onClick={handleLogout}
                className="p-2 text-neutral-400 hover:text-white transition-colors"
                title="Logout"
            >
                <LogOut size={20} />
            </button>
        </div>
      </header>

      {/* Playlist Grid */}
      <main>
        <h2 className="text-xl font-bold mb-6">Your Playlists</h2>
        
        {loading ? (
             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                 {[...Array(10)].map((_, i) => (
                     <div key={i} className="aspect-square bg-neutral-900 rounded-lg animate-pulse"></div>
                 ))}
             </div>
        ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {playlists.map((playlist) => (
                <div 
                    key={playlist.id}
                    onClick={() => setSelectedPlaylist(playlist)}
                    className="group bg-[#181818] p-4 rounded-lg hover:bg-[#282828] transition-all cursor-pointer hover:shadow-xl hover:-translate-y-1 duration-300 ease-out"
                >
                    <div className="relative aspect-square mb-4 shadow-lg bg-neutral-900 rounded-md overflow-hidden">
                        <img 
                            src={playlist.images?.[0]?.url || `https://picsum.photos/300/300?random=${playlist.id}`} 
                            alt={playlist.name}
                            className="w-full h-full object-cover group-hover:opacity-100 transition-opacity"
                        />
                         <button className="absolute bottom-2 right-2 w-10 h-10 bg-[#1DB954] rounded-full flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all shadow-lg hover:scale-105">
                            <Music2 className="text-black fill-black" size={20} />
                        </button>
                    </div>
                    <h3 className="font-bold text-white truncate mb-1">{playlist.name}</h3>
                    <p className="text-sm text-neutral-400 truncate line-clamp-2">{playlist.description || `By ${playlist.owner.display_name}`}</p>
                </div>
            ))}
            </div>
        )}
      </main>
    </div>
  );
}