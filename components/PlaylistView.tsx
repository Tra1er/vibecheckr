import React, { useEffect, useState, useRef } from 'react';
import { Playlist, ExtendedTrack, GeminiAnalysisResult } from '../types';
import { fetchPlaylistTracks, fetchAudioFeatures } from '../services/spotify';
import { findSmartPreview } from '../services/preview';
import { analyzePlaylistVibe } from '../services/gemini';
import { Play, Pause, ChevronLeft, Zap, Activity, Music2, Loader2, Sparkles, UserPlus, SkipBack, SkipForward, Volume2, ArrowUpDown } from 'lucide-react';
import { BarChart, Bar, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface PlaylistViewProps {
  playlist: Playlist;
  token: string;
  onBack: () => void;
}

type SortOption = 'default' | 'energy' | 'danceability' | 'tempo';

const PlaylistView: React.FC<PlaylistViewProps> = ({ playlist, token, onBack }) => {
  const [tracks, setTracks] = useState<ExtendedTrack[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Audio State
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTrack, setCurrentTrack] = useState<ExtendedTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [loadingPreviewId, setLoadingPreviewId] = useState<string | null>(null);
  
  // Sorting
  const [sortBy, setSortBy] = useState<SortOption>('default');

  // Gemini Analysis State
  const [geminiResult, setGeminiResult] = useState<GeminiAnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const items = await fetchPlaylistTracks(token, playlist.id);
        const rawTracks = items.map(i => i.track);
        
        // Fetch Audio Features
        const trackIds = rawTracks.map(t => t.id);
        const features = await fetchAudioFeatures(token, trackIds);

        const extended: ExtendedTrack[] = rawTracks.map((track, idx) => ({
          ...track,
          features: features[idx] || undefined,
        }));

        setTracks(extended);
      } catch (e) {
        console.error("Failed to load playlist data", e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [playlist.id, token]);

  // Handle Playback Logic
  const handlePlay = async (track: ExtendedTrack) => {
    // 1. Toggle current track
    if (currentTrack?.id === track.id) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        audioRef.current?.play();
        setIsPlaying(true);
      }
      return;
    }

    // 2. Play new track
    setLoadingPreviewId(track.id);
    
    // Stop previous audio
    if (audioRef.current) {
      audioRef.current.pause();
    }

    // Find preview
    const url = await findSmartPreview(track);
    setLoadingPreviewId(null);

    if (url) {
      if (!audioRef.current) {
        audioRef.current = new Audio();
      }
      audioRef.current.src = url;
      audioRef.current.volume = volume;
      
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
          playPromise
            .then(() => setIsPlaying(true))
            .catch(error => console.error("Playback error:", error));
      }

      setCurrentTrack(track);
      
      // Auto reset on end
      audioRef.current.onended = () => setIsPlaying(false);
    } else {
      alert("No preview available for this track (neither on Spotify nor iTunes fallback).");
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    if (audioRef.current) {
      audioRef.current.volume = newVol;
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const trackNames = tracks.map(t => `${t.name} by ${t.artists[0].name}`);
      const result = await analyzePlaylistVibe(trackNames);
      setGeminiResult(result);
    } catch (e) {
      console.error(e);
      alert("Failed to analyze vibe. Check API Key.");
    } finally {
      setAnalyzing(false);
    }
  };

  // Sorting Logic
  const getSortedTracks = () => {
    const list = [...tracks];
    switch(sortBy) {
        case 'energy': return list.sort((a,b) => (b.features?.energy || 0) - (a.features?.energy || 0));
        case 'danceability': return list.sort((a,b) => (b.features?.danceability || 0) - (a.features?.danceability || 0));
        case 'tempo': return list.sort((a,b) => (b.features?.tempo || 0) - (a.features?.tempo || 0));
        default: return list;
    }
  };

  const sortedTracks = getSortedTracks();

  const chartData = tracks
    .filter(t => t.features)
    .map((t, i) => ({
      name: i,
      energy: t.features?.energy || 0,
      valence: t.features?.valence || 0,
    })).slice(0, 50);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-[#1DB954]">
        <Loader2 className="animate-spin w-10 h-10" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-32">
      {/* Header */}
      <div className="bg-gradient-to-b from-neutral-800 to-black p-8 pt-10">
        <button 
          onClick={onBack}
          className="mb-6 flex items-center text-neutral-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="mr-1" size={20} /> Back to Playlists
        </button>
        
        <div className="flex flex-col md:flex-row gap-8 items-end">
          <img 
            src={playlist.images[0]?.url || 'https://picsum.photos/300/300'} 
            alt={playlist.name}
            className="w-52 h-52 shadow-2xl shadow-black/50 object-cover rounded-md" 
          />
          <div className="flex-1 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Playlist</span>
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight">{playlist.name}</h1>
            <p className="text-neutral-400 max-w-2xl">{playlist.description || `By ${playlist.owner.display_name} • ${tracks.length} songs`}</p>
            
            <div className="flex flex-wrap gap-4 pt-2">
              <button 
                onClick={handleAnalyze}
                disabled={analyzing || !!geminiResult}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white px-6 py-3 rounded-full font-bold transition-all shadow-lg shadow-purple-900/30 disabled:opacity-50"
              >
                {analyzing ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
                {geminiResult ? 'Vibe Analyzed' : 'Analyze Vibe'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Gemini Result Section */}
      {geminiResult && (
        <div className="mx-8 mt-6 bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-white/10 rounded-xl p-6 relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="relative z-10 grid md:grid-cols-3 gap-8">
                <div className="md:col-span-2">
                    <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                        <Sparkles className="text-purple-400" size={20} /> AI Vibe Check
                    </h3>
                    <p className="text-neutral-300 leading-relaxed mb-4">{geminiResult.vibe}</p>
                    <div className="flex gap-2 flex-wrap">
                        {geminiResult.tags.map(tag => (
                            <span key={tag} className="px-3 py-1 bg-white/10 rounded-full text-xs font-medium text-purple-200 border border-white/5">
                                #{tag}
                            </span>
                        ))}
                    </div>
                </div>
                <div className="bg-black/30 rounded-lg p-4 backdrop-blur-sm">
                    <h4 className="text-sm font-bold text-neutral-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <UserPlus size={14} /> Similar Artists
                    </h4>
                    <ul className="space-y-2">
                        {geminiResult.suggestedArtists.map(artist => (
                            <li key={artist} className="text-white text-sm font-medium hover:text-[#1DB954] transition-colors cursor-default">
                                {artist}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
      )}

      {/* Analysis Charts */}
      <div className="mx-8 mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-neutral-900/50 border border-white/5 p-6 rounded-xl">
            <h3 className="text-neutral-400 text-sm font-bold uppercase mb-6 flex items-center gap-2">
                <Zap size={16} /> Energy Flow
            </h3>
            <div className="h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#222', border: 'none', borderRadius: '8px' }}
                            itemStyle={{ color: '#fff' }}
                            cursor={{fill: 'rgba(255,255,255,0.05)'}}
                        />
                        <Bar dataKey="energy" radius={[2, 2, 0, 0]}>
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.energy > 0.7 ? '#1DB954' : '#535353'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
        <div className="bg-neutral-900/50 border border-white/5 p-6 rounded-xl">
             <h3 className="text-neutral-400 text-sm font-bold uppercase mb-6 flex items-center gap-2">
                <Activity size={16} /> Valence (Mood)
            </h3>
            <div className="h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#222', border: 'none', borderRadius: '8px' }}
                            itemStyle={{ color: '#fff' }}
                            cursor={{fill: 'rgba(255,255,255,0.05)'}}
                        />
                        <Bar dataKey="valence" radius={[2, 2, 0, 0]}>
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.valence > 0.5 ? '#Eab308' : '#3b82f6'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>

      {/* Sort Controls */}
      <div className="px-8 mt-8 flex justify-end">
          <div className="flex items-center gap-2 bg-neutral-900 p-1 rounded-lg border border-white/10">
              <span className="px-3 text-xs font-semibold text-neutral-500 uppercase">Sort by</span>
              {(['default', 'energy', 'danceability', 'tempo'] as SortOption[]).map((option) => (
                  <button
                    key={option}
                    onClick={() => setSortBy(option)}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase transition-all ${sortBy === option ? 'bg-white/10 text-white' : 'text-neutral-400 hover:text-white'}`}
                  >
                      {option}
                  </button>
              ))}
          </div>
      </div>

      {/* Track List */}
      <div className="px-8 mt-4">
        <div className="sticky top-0 bg-black z-20 py-4 border-b border-white/10 grid grid-cols-[auto_1fr_auto_auto] gap-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
           <div className="w-10 text-center">#</div>
           <div>Title</div>
           <div className="hidden md:block">BPM</div>
           <div className="w-12 text-center">Energy</div>
        </div>

        <div className="mt-2 space-y-1">
          {sortedTracks.map((track, index) => {
             const isCurrent = currentTrack?.id === track.id;
             const isLoading = loadingPreviewId === track.id;

             return (
              <div 
                key={track.id + '-' + index} 
                onClick={() => handlePlay(track)}
                className={`group grid grid-cols-[auto_1fr_auto_auto] gap-4 items-center p-3 rounded-lg cursor-pointer transition-colors ${isCurrent ? 'bg-white/10' : 'hover:bg-white/5'}`}
              >
                <div className="w-10 text-center text-neutral-400 group-hover:text-white relative flex justify-center items-center h-full">
                    {isCurrent && isPlaying ? (
                         <div className="flex gap-[2px] h-3 items-end">
                             <div className="w-[3px] bg-[#1DB954] animate-[pulse_0.6s_infinite] h-full"></div>
                             <div className="w-[3px] bg-[#1DB954] animate-[pulse_0.8s_infinite] h-[60%]"></div>
                             <div className="w-[3px] bg-[#1DB954] animate-[pulse_1s_infinite] h-full"></div>
                         </div>
                    ) : (
                        <span className="group-hover:hidden">{index + 1}</span>
                    )}
                    <button className={`hidden group-hover:block ${isCurrent && isPlaying ? '!hidden' : ''} text-white`}>
                        {isLoading ? <Loader2 size={16} className="animate-spin text-green-500"/> : isCurrent && !isPlaying ? <Play size={16} className="text-[#1DB954]"/> : <Play size={16} />}
                    </button>
                     <button className={`hidden ${isCurrent && isPlaying ? '!block' : ''} text-green-500`}>
                        <Pause size={16} />
                    </button>
                </div>

                <div className="flex items-center gap-4 overflow-hidden">
                    <img src={track.album.images[2]?.url || track.album.images[0]?.url} alt="" className="w-10 h-10 rounded shadow-md object-cover" />
                    <div className="flex flex-col overflow-hidden">
                        <span className={`truncate font-medium ${isCurrent ? 'text-[#1DB954]' : 'text-white'}`}>{track.name}</span>
                        <span className="truncate text-sm text-neutral-400 group-hover:text-neutral-300">{track.artists.map(a => a.name).join(', ')}</span>
                    </div>
                </div>

                <div className="hidden md:flex items-center justify-end text-neutral-400 text-sm font-mono w-16">
                    {track.features ? Math.round(track.features.tempo) : '-'}
                </div>

                <div className="w-12 flex justify-center">
                    {track.features && (
                        <div 
                            className="w-10 h-1 bg-neutral-800 rounded-full overflow-hidden"
                            title={`Energy: ${Math.round(track.features.energy * 100)}%`}
                        >
                            <div 
                                className="h-full bg-[#1DB954]" 
                                style={{ width: `${track.features.energy * 100}%` }}
                            />
                        </div>
                    )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Persistent Player Bar */}
      {currentTrack && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#181818] border-t border-[#282828] p-4 px-6 flex items-center justify-between z-50 shadow-2xl animate-in slide-in-from-bottom-full duration-500">
            <div className="flex items-center gap-4 w-1/3 min-w-[200px]">
                <img 
                    src={currentTrack.album.images[0]?.url} 
                    alt={currentTrack.name} 
                    className={`w-14 h-14 rounded shadow-lg ${isPlaying ? 'animate-[spin_10s_linear_infinite]' : ''}`} // Fun spin effect if you want, or remove
                />
                <div className="flex flex-col overflow-hidden">
                    <span className="text-white font-medium truncate hover:underline cursor-pointer">{currentTrack.name}</span>
                    <span className="text-xs text-neutral-400 truncate hover:underline cursor-pointer">{currentTrack.artists.map(a => a.name).join(', ')}</span>
                </div>
            </div>

            <div className="flex flex-col items-center w-1/3">
                <div className="flex items-center gap-6">
                    <button className="text-neutral-400 hover:text-white transition-colors" title="Previous (Not implemented in demo)">
                        <SkipBack size={20} />
                    </button>
                    <button 
                        onClick={() => handlePlay(currentTrack)}
                        className="w-10 h-10 bg-white rounded-full flex items-center justify-center hover:scale-105 transition-transform active:scale-95"
                    >
                        {isPlaying ? <Pause size={20} className="text-black fill-black" /> : <Play size={20} className="text-black fill-black pl-1" />}
                    </button>
                    <button className="text-neutral-400 hover:text-white transition-colors" title="Next (Not implemented in demo)">
                        <SkipForward size={20} />
                    </button>
                </div>
            </div>

            <div className="flex items-center justify-end gap-2 w-1/3 min-w-[200px]">
                <Volume2 size={18} className="text-neutral-400" />
                <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.01" 
                    value={volume}
                    onChange={handleVolumeChange}
                    className="w-24 h-1 bg-neutral-600 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:bg-[#1DB954]"
                />
            </div>
        </div>
      )}
    </div>
  );
};

export default PlaylistView;