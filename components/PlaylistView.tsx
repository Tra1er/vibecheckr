import React, { useEffect, useState, useRef } from 'react';
import { Playlist, PlaylistTrackItem, ExtendedTrack, AudioFeatures, GeminiAnalysisResult } from '../types';
import { fetchPlaylistTracks, fetchAudioFeatures } from '../services/spotify';
import { findSmartPreview } from '../services/preview';
import { analyzePlaylistVibe } from '../services/gemini';
import { Play, Pause, ChevronLeft, Zap, Activity, Music2, Info, Loader2, Sparkles, UserPlus } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface PlaylistViewProps {
  playlist: Playlist;
  token: string;
  onBack: () => void;
}

const PlaylistView: React.FC<PlaylistViewProps> = ({ playlist, token, onBack }) => {
  const [tracks, setTracks] = useState<ExtendedTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);
  const [loadingPreviewId, setLoadingPreviewId] = useState<string | null>(null);
  
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
    
    // Cleanup audio on unmount
    return () => {
      if (audioRef) {
        audioRef.pause();
      }
    };
  }, [playlist.id, token]); // Removed audioRef from dependencies to avoid loop

  const handlePlay = async (track: ExtendedTrack) => {
    // Stop current
    if (audioRef) {
      audioRef.pause();
      setAudioRef(null);
    }

    if (playingTrackId === track.id) {
      setPlayingTrackId(null);
      return;
    }

    setLoadingPreviewId(track.id);
    
    // Find URL (Smart Preview)
    const url = await findSmartPreview(track);
    
    setLoadingPreviewId(null);

    if (url) {
      const audio = new Audio(url);
      audio.volume = 0.5;
      audio.play();
      audio.onended = () => setPlayingTrackId(null);
      setAudioRef(audio);
      setPlayingTrackId(track.id);
    } else {
      alert("No preview available for this track.");
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

  const chartData = tracks
    .filter(t => t.features)
    .map((t, i) => ({
      name: i,
      energy: t.features?.energy || 0,
      valence: t.features?.valence || 0,
    })).slice(0, 50); // Limit chart data for performance

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-[#1DB954]">
        <Loader2 className="animate-spin w-10 h-10" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-24">
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
            className="w-52 h-52 shadow-2xl shadow-black/50 object-cover" 
          />
          <div className="flex-1 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Playlist</span>
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight">{playlist.name}</h1>
            <p className="text-neutral-400 max-w-2xl">{playlist.description || `By ${playlist.owner.display_name} • ${tracks.length} songs`}</p>
            
            <div className="flex gap-4 pt-2">
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
        <div className="mx-8 mt-6 bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-white/10 rounded-xl p-6 relative overflow-hidden">
            <div className="relative z-10 grid md:grid-cols-3 gap-8">
                <div className="md:col-span-2">
                    <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                        <Sparkles className="text-purple-400" size={20} /> AI Vibe Check
                    </h3>
                    <p className="text-neutral-300 leading-relaxed mb-4">{geminiResult.vibe}</p>
                    <div className="flex gap-2">
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

      {/* Track List */}
      <div className="px-8 mt-8">
        <div className="sticky top-0 bg-black z-20 py-4 border-b border-white/10 grid grid-cols-[auto_1fr_auto_auto] gap-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
           <div className="w-10 text-center">#</div>
           <div>Title</div>
           <div className="hidden md:block">BPM</div>
           <div className="w-12 text-center">Preview</div>
        </div>

        <div className="mt-2 space-y-1">
          {tracks.map((track, index) => {
             const isPlaying = playingTrackId === track.id;
             const isLoading = loadingPreviewId === track.id;

             return (
              <div 
                key={track.id + index} 
                className={`group grid grid-cols-[auto_1fr_auto_auto] gap-4 items-center p-3 rounded-lg hover:bg-white/5 transition-colors ${isPlaying ? 'bg-white/10' : ''}`}
              >
                <div className="w-10 text-center text-neutral-400 group-hover:text-white relative flex justify-center">
                    {isPlaying ? (
                         <div className="w-4 h-4 relative">
                            <span className="absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75 animate-ping"></span>
                         </div>
                    ) : (
                        <span className="group-hover:hidden">{index + 1}</span>
                    )}
                    <button 
                        onClick={() => handlePlay(track)}
                        className={`hidden group-hover:flex ${isPlaying ? '!flex' : ''} text-white`}
                    >
                        {isLoading ? <Loader2 size={16} className="animate-spin text-green-500"/> : isPlaying ? <Pause size={16} className="text-green-500" /> : <Play size={16} />}
                    </button>
                </div>

                <div className="flex items-center gap-4 overflow-hidden">
                    <img src={track.album.images[2]?.url || track.album.images[0]?.url} alt="" className="w-10 h-10 rounded shadow-md" />
                    <div className="flex flex-col overflow-hidden">
                        <span className={`truncate font-medium ${isPlaying ? 'text-[#1DB954]' : 'text-white'}`}>{track.name}</span>
                        <span className="truncate text-sm text-neutral-400 group-hover:text-neutral-300">{track.artists.map(a => a.name).join(', ')}</span>
                    </div>
                </div>

                <div className="hidden md:flex items-center justify-end text-neutral-400 text-sm font-mono w-16">
                    {track.features ? Math.round(track.features.tempo) : '-'}
                </div>

                <div className="w-12 flex justify-center">
                    {track.features && (
                        <div 
                            className="w-2 h-8 bg-neutral-800 rounded-full overflow-hidden flex flex-col justify-end"
                            title={`Energy: ${Math.round(track.features.energy * 100)}%`}
                        >
                            <div 
                                className="w-full bg-[#1DB954]" 
                                style={{ height: `${track.features.energy * 100}%` }}
                            />
                        </div>
                    )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  );
};

export default PlaylistView;