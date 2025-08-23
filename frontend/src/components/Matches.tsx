import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Zap, Radio, Play, ExternalLink, Users, Calendar } from 'lucide-react';
import { apiService, MatchDay, Match } from '../services/apiService';
import { useAuth } from '../hooks/useAuth';
import BettingModal from './BettingModal';

const Matches: React.FC = () => {
  const [liveMatches, setLiveMatches] = useState<MatchDay[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<MatchDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'live' | 'upcoming'>('live');
  const { isConnected } = useAuth();
  
  // Betting modal state
  const [isBettingModalOpen, setIsBettingModalOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<'team1' | 'team2' | null>(null);

  // Get stream URL from match data
  const getStreamForMatch = (match: Match): string | null => {
    return match.matchLiveLink || null;
  };

  // Detect stream platform (Twitch or YouTube)
  const detectStreamPlatform = (url: string): 'twitch' | 'youtube' | 'unknown' => {
    if (url.includes('twitch.tv')) {
      return 'twitch';
    } else if (url.includes('youtube.com') || url.includes('youtu.be')) {
      return 'youtube';
    }
    return 'unknown';
  };

  // Extract YouTube video ID from URL
  const getYouTubeVideoId = (url: string): string | null => {
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/live\/)([^&\n?#]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  // Get YouTube embed URL
  const getYouTubeEmbedUrl = (videoId: string): string => {
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&controls=0&modestbranding=1&rel=0&showinfo=0`;
  };

  // Get Twitch embed URL
  const getTwitchEmbedUrl = (twitchUrl: string): string => {
    // Extract channel name from Twitch URL
    const channelMatch = twitchUrl.match(/twitch\.tv\/([^/?]+)/);
    const channel = channelMatch ? channelMatch[1] : 'valorantesports_cn';
    return `https://player.twitch.tv/?channel=${channel}&parent=${window.location.hostname}&autoplay=true&muted=true`;
  };

  // Generate Google Calendar link for upcoming matches
  const generateCalendarLink = (match: Match): string => {
    const team1 = typeof match.team1 === 'string' ? { name: match.team1 } : match.team1;
    const team2 = typeof match.team2 === 'string' ? { name: match.team2 } : match.team2;
    
    // Event details
    const title = `${team1.name} vs ${team2.name}`;
    const description = `${match.event} match between ${team1.name} and ${team2.name}. ${match.betting ? `Betting odds - ${team1.name}: ${match.betting.team1.odds}, ${team2.name}: ${match.betting.team2.odds}` : ''}`;
    
    // Parse the match time and date to create proper datetime
    // For demo purposes, we'll use a future date. In real app, this would come from API
    const eventDate = new Date();
    eventDate.setDate(eventDate.getDate() + Math.floor(Math.random() * 7) + 1); // Random date 1-7 days from now
    const [hours, minutes] = match.time.split(':');
    eventDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    // Format dates for Google Calendar (YYYYMMDDTHHMMSSZ format)
    const startDate = eventDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const endDate = new Date(eventDate.getTime() + 2 * 60 * 60 * 1000).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'; // 2 hours duration
    
    // Construct Google Calendar URL
    const calendarParams = new URLSearchParams({
      action: 'TEMPLATE',
      text: title,
      dates: `${startDate}/${endDate}`,
      details: description,
      location: match.event || 'Online Stream',
      sf: 'true',
      output: 'xml'
    });
    
    return `https://calendar.google.com/calendar/render?${calendarParams.toString()}`;
  };

  // Handle adding to calendar
  const addToCalendar = (match: Match, e: React.MouseEvent) => {
    e.stopPropagation();
    const calendarLink = generateCalendarLink(match);
    window.open(calendarLink, '_blank', 'width=600,height=600');
  };

  // Handle opening betting modal
  const openBettingModal = (match: Match, team: 'team1' | 'team2', e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedMatch(match);
    setSelectedTeam(team);
    setIsBettingModalOpen(true);
  };

  // Handle closing betting modal
  const closeBettingModal = () => {
    setIsBettingModalOpen(false);
    setSelectedMatch(null);
    setSelectedTeam(null);
  };

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setLoading(true);
        const [live, upcoming] = await Promise.all([
          apiService.getLiveMatches(),
          apiService.getAllMatches()
        ]);
        setLiveMatches(live);
        setUpcomingMatches(upcoming);
      } catch (error) {
        console.error('Error fetching matches:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
    // Removed automatic polling - uncomment below if you want auto-refresh
    // const interval = setInterval(fetchMatches, 30000);
    // return () => clearInterval(interval);
  }, []);

  const renderMatch = (match: Match, index: number) => {
    const team1 = typeof match.team1 === 'string' ? { name: match.team1 } : match.team1;
    const team2 = typeof match.team2 === 'string' ? { name: match.team2 } : match.team2;
    const streamUrl = getStreamForMatch(match);
    const streamPlatform = streamUrl ? detectStreamPlatform(streamUrl) : 'unknown';
    const videoId = streamUrl && streamPlatform === 'youtube' ? getYouTubeVideoId(streamUrl) : null;
    const isLive = match.status === 'LIVE';
    
    // Render large card with stream for LIVE matches
    if (isLive) {
      return (
        <motion.div
          key={match.matchID}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-black/30 backdrop-blur-md rounded-2xl border border-yellow-400/20 overflow-hidden transition-all duration-300 shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:border-yellow-400/40 hover:shadow-[0_12px_40px_rgba(240,185,11,0.1)] w-full"
        >
          <div className="flex flex-col lg:flex-row h-full min-h-[400px]">
            {/* Stream Section - Left Side */}
            <div className="lg:w-1/2 relative">
              {streamUrl && streamPlatform !== 'unknown' ? (
                <div className="relative h-64 lg:h-full bg-black">
                  {streamPlatform === 'youtube' && videoId ? (
                    <iframe
                      src={getYouTubeEmbedUrl(videoId)}
                      className="w-full h-full"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      title={`${team1.name} vs ${team2.name}`}
                    />
                  ) : streamPlatform === 'twitch' ? (
                    <iframe
                      src={getTwitchEmbedUrl(streamUrl)}
                      className="w-full h-full"
                      frameBorder="0"
                      allow="autoplay; fullscreen"
                      allowFullScreen
                      title={`${team1.name} vs ${team2.name}`}
                    />
                  ) : null}
                  
                  {/* Stream Overlay */}
                  <div className="absolute inset-0 pointer-events-none">
                    {/* Live Badge */}
                    <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-rajdhani-semibold shadow-lg flex items-center gap-1">
                      <Radio size={12} />
                      <span>LIVE</span>
                    </div>
                    
                    {/* Platform Badge */}
                    <div className="absolute top-4 left-20 bg-purple-600 text-white px-2 py-1 rounded text-xs font-rajdhani-semibold shadow-lg">
                      {streamPlatform.toUpperCase()}
                    </div>
                    
                    {/* Viewers Count */}
                    <div className="absolute top-4 right-4 bg-black/80 text-white px-2 py-1 rounded text-xs flex items-center gap-1 shadow-lg">
                      <Users size={12} />
                      <span>{Math.floor(Math.random() * 5000) + 1000}</span>
                    </div>
                    
                    {/* External Link */}
                    <div className="absolute bottom-4 left-4 bg-black/80 text-yellow-400 p-2 rounded shadow-lg pointer-events-auto cursor-pointer hover:bg-black/90 transition-colors"
                         onClick={(e) => {
                           e.stopPropagation();
                           window.open(streamUrl!, '_blank');
                         }}>
                      <ExternalLink size={16} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-64 lg:h-full bg-gradient-to-br from-yellow-400/30 to-yellow-300/20 flex items-center justify-center">
                  <div className="text-center">
                    <Play size={48} className="text-yellow-400 mx-auto mb-4" />
                    <p className="text-white font-rajdhani-medium">No stream available</p>
                  </div>
                </div>
              )}
            </div>

            {/* Match Details Section - Right Side */}
            <div className="lg:w-1/2 p-6 flex flex-col justify-between">
              {/* Header with Status and Time */}
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-1 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-rajdhani-semibold">
                  <Radio size={14} />
                  <span>LIVE</span>
                </div>
                <div className="text-right text-sm text-gray-400">
                  <div className="font-rajdhani-medium">{match.time}</div>
                  <div className="text-xs">{match.event}</div>
                </div>
              </div>

              {/* Teams and Scores */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex-1 text-center">
                  <div className="flex items-center justify-center gap-3 mb-3">
                    {team1.logo && (
                      <img src={team1.logo} alt={team1.name} className="w-10 h-10 rounded-full" />
                    )}
                    <span className="font-rajdhani-semibold text-white text-lg">{team1.name}</span>
                  </div>
                  {team1.overallScore !== undefined && (
                    <div className="text-3xl font-rajdhani-bold text-yellow-400 [text-shadow:0_0_10px_rgba(240,185,11,0.5)]">
                      {team1.overallScore}
                    </div>
                  )}
                </div>

                <div className="px-6 text-gray-400 text-lg font-rajdhani-bold">VS</div>

                <div className="flex-1 text-center">
                  <div className="flex items-center justify-center gap-3 mb-3">
                    <span className="font-rajdhani-semibold text-white text-lg">{team2.name}</span>
                    {team2.logo && (
                      <img src={team2.logo} alt={team2.name} className="w-10 h-10 rounded-full" />
                    )}
                  </div>
                  {team2.overallScore !== undefined && (
                    <div className="text-3xl font-rajdhani-bold text-yellow-400 [text-shadow:0_0_10px_rgba(240,185,11,0.5)]">
                      {team2.overallScore}
                    </div>
                  )}
                </div>
              </div>

              {/* Betting Section */}
              {match.betting && (
                <div className="border-t border-gray-700 pt-6">
                  <h5 className="text-lg font-rajdhani-semibold text-white mb-4 text-center">Betting Odds</h5>
                  <div className="flex justify-between items-center mb-4 gap-4">
                    <motion.button
                      onClick={(e) => openBettingModal(match, 'team1', e)}
                      className="text-center flex-1 bg-gray-800/50 hover:bg-yellow-400/10 border border-gray-600 hover:border-yellow-400/50 rounded-lg p-3 transition-all duration-200"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="text-sm text-gray-400 mb-2 font-rajdhani-medium">{team1.name}</div>
                      <div className="text-xl font-rajdhani-bold text-yellow-400 [text-shadow:0_0_10px_rgba(240,185,11,0.5)]">
                        {match.betting.team1.odds}
                      </div>
                    </motion.button>
                    <motion.button
                      onClick={(e) => openBettingModal(match, 'team2', e)}
                      className="text-center flex-1 bg-gray-800/50 hover:bg-yellow-400/10 border border-gray-600 hover:border-yellow-400/50 rounded-lg p-3 transition-all duration-200"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="text-sm text-gray-400 mb-2 font-rajdhani-medium">{team2.name}</div>
                      <div className="text-xl font-rajdhani-bold text-yellow-400 [text-shadow:0_0_10px_rgba(240,185,11,0.5)]">
                        {match.betting.team2.odds}
                      </div>
                    </motion.button>
                  </div>
                  {isConnected && (
                    <div className="text-center">
                      <p className="text-gray-400 text-sm font-rajdhani-medium">
                        Click on team odds to place bet
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      );
    }

    // Render compact card for upcoming matches (no stream)
    return (
      <motion.div
        key={match.matchID}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className="bg-black/30 backdrop-blur-md rounded-2xl border border-yellow-400/20 p-6 transition-all duration-300 cursor-pointer shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:border-yellow-400/40 hover:shadow-[0_12px_40px_rgba(240,185,11,0.1)] w-full max-w-sm mx-auto"
      >
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-gray-600 text-white px-2 py-1 rounded-full text-xs font-rajdhani-semibold">
              <Clock size={12} />
              <span>{match.eta}</span>
            </div>
            {/* Calendar Notification Button */}
            <motion.button
              onClick={(e) => addToCalendar(match, e)}
              className="flex items-center gap-1 bg-yellow-400/20 text-yellow-400 px-2 py-1 rounded-full text-xs font-rajdhani-semibold border border-yellow-400/30 hover:bg-yellow-400/30 hover:border-yellow-400/50 transition-all duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Add to Google Calendar"
            >
              <Calendar size={12} />
              <span>Notify</span>
            </motion.button>
          </div>
          <div className="text-right text-sm text-gray-400">
            <div className="font-rajdhani-medium">{match.time}</div>
            <div className="text-xs">{match.event}</div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex-1 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              {team1.logo && (
                <img src={team1.logo} alt={team1.name} className="w-8 h-8 rounded-full" />
              )}
              <span className="font-rajdhani-semibold text-white">{team1.name}</span>
            </div>
            {team1.overallScore !== undefined && (
              <div className="text-2xl font-rajdhani-bold text-yellow-400 [text-shadow:0_0_10px_rgba(240,185,11,0.5)]">
                {team1.overallScore}
              </div>
            )}
          </div>

          <div className="px-4 text-gray-400 text-sm font-rajdhani-semibold">VS</div>

          <div className="flex-1 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="font-rajdhani-semibold text-white">{team2.name}</span>
              {team2.logo && (
                <img src={team2.logo} alt={team2.name} className="w-8 h-8 rounded-full" />
              )}
            </div>
            {team2.overallScore !== undefined && (
              <div className="text-2xl font-rajdhani-bold text-yellow-400 [text-shadow:0_0_10px_rgba(240,185,11,0.5)]">
                {team2.overallScore}
              </div>
            )}
          </div>
        </div>

        {match.betting && (
          <div className="border-t border-gray-700 pt-4 mt-4">
            <div className="flex justify-between items-center mb-3 gap-2">
              <motion.button
                onClick={(e) => openBettingModal(match, 'team1', e)}
                className="text-center flex-1 bg-gray-800/50 hover:bg-yellow-400/10 border border-gray-600 hover:border-yellow-400/50 rounded-lg p-2 transition-all duration-200"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="text-xs text-gray-400 mb-1 font-rajdhani-medium">{team1.name}</div>
                <div className="text-lg font-rajdhani-bold text-yellow-400 [text-shadow:0_0_10px_rgba(240,185,11,0.5)]">
                  {match.betting.team1.odds}
                </div>
              </motion.button>
              <motion.button
                onClick={(e) => openBettingModal(match, 'team2', e)}
                className="text-center flex-1 bg-gray-800/50 hover:bg-yellow-400/10 border border-gray-600 hover:border-yellow-400/50 rounded-lg p-2 transition-all duration-200"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="text-xs text-gray-400 mb-1 font-rajdhani-medium">{team2.name}</div>
                <div className="text-lg font-rajdhani-bold text-yellow-400 [text-shadow:0_0_10px_rgba(240,185,11,0.5)]">
                  {match.betting.team2.odds}
                </div>
              </motion.button>
            </div>
            {isConnected && (
              <div className="text-center">
                <p className="text-gray-400 text-xs font-rajdhani-medium">
                  Click on team odds to place bet
                </p>
              </div>
            )}
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="px-4 sm:px-6 lg:px-8 py-16"
    >
      <div className="mx-10">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-1">
          <h3 className="text-3xl sm:text-4xl font-fredoka-bold text-white">Live Matches</h3>
          <div className="flex gap-2 bg-black/30 backdrop-blur-md rounded-2xl p-1.5 border border-yellow-400/20 shadow-[0_8px_32px_rgba(0,0,0,0.3)] self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('live')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 text-sm ${
                activeTab === 'live' 
                  ? 'bg-gradient-to-r from-yellow-400 to-yellow-300 text-black shadow-[0_4px_15px_rgba(240,185,11,0.3)]' 
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <Zap size={16} />
              <span>Live</span>
            </button>
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 text-sm ${
                activeTab === 'upcoming' 
                  ? 'bg-gradient-to-r from-yellow-400 to-yellow-300 text-black shadow-[0_4px_15px_rgba(240,185,11,0.3)]' 
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <Clock size={16} />
              <span>Upcoming</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-12 h-12 border-4 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="space-y-10">
            {(activeTab === 'live' ? liveMatches : upcomingMatches).map((day) => (
              <div key={day.date}>
                <h4 className="text-xl sm:text-lg font-semibold text-yellow-400 mb-6 [text-shadow:0_0_9px_rgba(240,185,11,0.5)]">
                  {day.date}
                </h4>
                <div className="space-y-6">
                  {activeTab === 'live' ? (
                    /* Large cards for LIVE matches only */
                    day.matches.filter(match => match.status === 'LIVE').map((match, index) => renderMatch(match, index))
                  ) : (
                    /* Grid layout for upcoming matches only */
                    day.matches.filter(match => match.status === 'Upcoming').length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
                        {day.matches.filter(match => match.status === 'Upcoming').map((match, index) => renderMatch(match, index))}
                      </div>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Betting Modal */}
      <BettingModal
        isOpen={isBettingModalOpen}
        onClose={closeBettingModal}
        match={selectedMatch}
        selectedTeam={selectedTeam}
      />
    </motion.section>
  );
};

export default Matches;