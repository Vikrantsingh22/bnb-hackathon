import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Trophy, Target, Users, ExternalLink } from 'lucide-react';

interface ScoreboardData {
  home_team: string;
  away_team: string;
  home_score: number;
  away_score: number;
  time: string;
  status: string;
  penalties?: {
    home: number;
    away: number;
  };
  winner?: string;
}

interface StreamData {
  id: string;
  url: string;
  title: string;
  platform: 'youtube' | 'twitch';
  scoreboard?: ScoreboardData;
  viewers?: string;
  isLive?: boolean;
}

const LiveStreams: React.FC = () => {
  const [streams, setStreams] = useState<StreamData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sample FIFA streams to test with
  const sampleStreams: StreamData[] = [
    {
      id: '1',
      url: 'https://youtu.be/MIrvtgbImC8?si=vBNcRYCkAzDRMASu',
      title: 'FIFA World Cup Final',
      platform: 'youtube',
      viewers: '2.1K',
      isLive: true
    },
    {
      id: '2', 
      url: 'https://youtu.be/34_X1K_LsyU?si=_V_ciL0VEG8bNNzN',
      title: 'Champions League Match',
      platform: 'youtube',
      viewers: '1.8K',
      isLive: true
    },
    {
      id: '3',
      url: 'https://youtu.be/lffsANNTIgc?si=R1u0eC8LeXSjY-rK',
      title: 'Premier League Highlights',
      platform: 'youtube', 
      viewers: '950',
      isLive: false
    }
  ];

  // Extract YouTube video ID from URL
  const getYouTubeVideoId = (url: string): string | null => {
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  // Get YouTube embed URL
  const getYouTubeEmbedUrl = (videoId: string): string => {
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&controls=0&modestbranding=1&rel=0&showinfo=0`;
  };

  const extractScoreboard = async (url: string, platform: 'youtube' | 'twitch') => {
    try {
      const response = await fetch('https://fifa-vision-ai.catoff.xyz/extract-scoreboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          platform,
          mode: 'vod',
          return_image: false
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error extracting scoreboard:', error);
      return null;
    }
  };

  useEffect(() => {
    const fetchStreamData = async () => {
      setLoading(true);
      setError(null);

      try {
        const streamsWithScoreboards = await Promise.all(
          sampleStreams.map(async (stream) => {
            const scoreboard = await extractScoreboard(stream.url, stream.platform);
            return {
              ...stream,
              scoreboard
            };
          })
        );

        setStreams(streamsWithScoreboards);
      } catch (err) {
        setError('Failed to fetch stream data');
        setStreams(sampleStreams); // Fallback to sample data
      } finally {
        setLoading(false);
      }
    };

    fetchStreamData();
  }, []);

  if (loading) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="px-4 sm:px-6 lg:px-8 py-16"
      >
        <div className="mx-10">
          <h3 className="text-3xl sm:text-4xl font-rajdhani-bold text-white mb-10">Live Streams</h3>
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin"></div>
            <span className="ml-3 text-gray-400 font-rajdhani-medium">Loading FIFA streams...</span>
          </div>
        </div>
      </motion.section>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="px-4 sm:px-6 lg:px-8 py-16"
    >
      <div className="mx-10">
        <div className="flex items-center justify-between mb-10">
          <h3 className="text-3xl sm:text-4xl font-rajdhani-bold text-white">Live FIFA Streams</h3>
          {error && (
            <span className="text-red-400 text-sm font-rajdhani-medium">{error}</span>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
          {streams.map((stream) => (
            <motion.div
              key={stream.id}
              className="bg-black/30 backdrop-blur-md rounded-2xl border border-yellow-400/20 overflow-hidden transition-all duration-300 shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:border-yellow-400/40 hover:shadow-[0_12px_40px_rgba(240,185,11,0.1)]"
            >
              {/* Video Player */}
              <div className="aspect-video bg-black relative overflow-hidden">
                {stream.platform === 'youtube' && getYouTubeVideoId(stream.url) ? (
                  <iframe
                    src={getYouTubeEmbedUrl(getYouTubeVideoId(stream.url)!)}
                    className="w-full h-full"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    title={stream.title}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-yellow-400/30 to-yellow-300/20 flex items-center justify-center">
                    <Play size={48} className="text-yellow-400 drop-shadow-lg" />
                  </div>
                )}
                
                {/* Overlay Controls */}
                <div className="absolute inset-0 pointer-events-none">
                  {/* Live/VOD Badge */}
                  <div className={`absolute top-4 left-4 px-2 py-1 rounded text-xs font-rajdhani-semibold shadow-lg ${
                    stream.isLive ? 'bg-red-600 text-white' : 'bg-gray-600 text-gray-200'
                  }`}>
                    {stream.isLive ? 'LIVE' : 'VOD'}
                  </div>

                  {/* Platform Badge */}
                  <div className="absolute top-4 right-4 bg-black/80 text-white px-2 py-1 rounded text-xs font-rajdhani-medium uppercase shadow-lg">
                    {stream.platform}
                  </div>

                  {/* Viewers */}
                  {stream.viewers && (
                    <div className="absolute bottom-4 right-4 bg-black/80 text-white px-2 py-1 rounded text-xs flex items-center gap-1 shadow-lg">
                      <Users size={12} />
                      {stream.viewers}
                    </div>
                  )}

                  {/* External Link Icon */}
                  <div className="absolute bottom-4 left-4 bg-black/80 text-yellow-400 p-1 rounded shadow-lg pointer-events-auto cursor-pointer hover:bg-black/90 transition-colors"
                       onClick={(e) => {
                         e.stopPropagation();
                         window.open(stream.url, '_blank');
                       }}>
                    <ExternalLink size={14} />
                  </div>
                </div>
              </div>

              {/* Content */}
              <div 
                className="p-4 sm:p-6 cursor-pointer hover:bg-black/20 transition-colors"
                onClick={() => window.open(stream.url, '_blank')}
              >
                <h4 className="font-rajdhani-semibold text-white mb-3 text-lg">{stream.title}</h4>
                
                {/* Scoreboard Data */}
                {stream.scoreboard ? (
                  <div className="space-y-3">
                    {/* Teams and Score */}
                    <div className="flex items-center justify-between bg-gray-800/50 rounded-lg p-3">
                      <div className="text-center flex-1">
                        <div className="text-sm font-rajdhani-medium text-gray-300 mb-1">
                          {stream.scoreboard.home_team}
                        </div>
                        <div className="text-2xl font-rajdhani-bold text-yellow-400">
                          {stream.scoreboard.home_score}
                        </div>
                      </div>
                      
                      <div className="text-center px-4">
                        <div className="text-xs font-rajdhani-medium text-gray-400 mb-1">VS</div>
                        <div className="text-xs text-gray-500">{stream.scoreboard.time}</div>
                      </div>
                      
                      <div className="text-center flex-1">
                        <div className="text-sm font-rajdhani-medium text-gray-300 mb-1">
                          {stream.scoreboard.away_team}
                        </div>
                        <div className="text-2xl font-rajdhani-bold text-yellow-400">
                          {stream.scoreboard.away_score}
                        </div>
                      </div>
                    </div>

                    {/* Penalties */}
                    {stream.scoreboard.penalties && (
                      <div className="flex items-center justify-center gap-2 text-xs">
                        <Target size={12} className="text-orange-400" />
                        <span className="text-gray-400 font-rajdhani-medium">
                          Penalties: {stream.scoreboard.penalties.home} - {stream.scoreboard.penalties.away}
                        </span>
                      </div>
                    )}

                    {/* Winner */}
                    {stream.scoreboard.winner && (
                      <div className="flex items-center justify-center gap-2 text-xs">
                        <Trophy size={12} className="text-yellow-400" />
                        <span className="text-yellow-400 font-rajdhani-semibold">
                          Winner: {stream.scoreboard.winner}
                        </span>
                      </div>
                    )}

                    {/* Status */}
                    <div className="text-center">
                      <span className={`text-xs font-rajdhani-medium px-2 py-1 rounded ${
                        stream.scoreboard.status === 'live' ? 'bg-green-600/20 text-green-400' :
                        stream.scoreboard.status === 'finished' ? 'bg-gray-600/20 text-gray-400' :
                        'bg-yellow-600/20 text-yellow-400'
                      }`}>
                        {stream.scoreboard.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <div className="text-sm text-gray-400 font-rajdhani-medium">
                      No scoreboard data available
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Click to watch stream
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
};

export default LiveStreams;