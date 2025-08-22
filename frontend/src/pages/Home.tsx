import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Play, 
  Trophy, 
  Users, 
  TrendingUp, 
  Clock, 
  Zap, 
  Target,
  GamepadIcon,
  Radio
} from 'lucide-react';
import WalletConnect from '../components/WalletConnect';
import { apiService, MatchDay, Match } from '../services/apiService';
import { useAuth } from '../hooks/useAuth';

const Home: React.FC = () => {
  const [liveMatches, setLiveMatches] = useState<MatchDay[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<MatchDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'live' | 'upcoming'>('live');
  const { isConnected } = useAuth();

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
    const interval = setInterval(fetchMatches, 30000);
    return () => clearInterval(interval);
  }, []);

  const renderMatch = (match: Match, index: number) => {
    const team1 = typeof match.team1 === 'string' ? { name: match.team1 } : match.team1;
    const team2 = typeof match.team2 === 'string' ? { name: match.team2 } : match.team2;
    
    return (
      <motion.div
        key={match.matchID}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className="bg-black/30 backdrop-blur-md rounded-2xl border border-yellow-400/20 p-6 transition-all duration-300 cursor-pointer shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:border-yellow-400/40 hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(240,185,11,0.1)] w-full max-w-sm mx-auto"
        whileHover={{ scale: 1.02 }}
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            {match.status === 'LIVE' && (
              <div className="flex items-center gap-1 bg-red-600 text-white px-2 py-1 rounded-full text-xs font-semibold">
                <Radio size={12} />
                <span>LIVE</span>
              </div>
            )}
            {match.status === 'Upcoming' && (
              <div className="flex items-center gap-1 bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-semibold">
                <Clock size={12} />
                <span>{match.eta}</span>
              </div>
            )}
          </div>
          <div className="text-right text-sm text-gray-400">
            <div>{match.time}</div>
            <div className="text-xs">{match.event}</div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex-1 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              {team1.logo && (
                <img src={team1.logo} alt={team1.name} className="w-8 h-8 rounded-full" />
              )}
              <span className="font-semibold text-white">{team1.name}</span>
            </div>
            {team1.overallScore !== undefined && (
              <div className="text-2xl font-bold text-yellow-400 [text-shadow:0_0_10px_rgba(240,185,11,0.5)]">{team1.overallScore}</div>
            )}
          </div>

          <div className="px-4 text-gray-400 text-sm font-semibold">VS</div>

          <div className="flex-1 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="font-semibold text-white">{team2.name}</span>
              {team2.logo && (
                <img src={team2.logo} alt={team2.name} className="w-8 h-8 rounded-full" />
              )}
            </div>
            {team2.overallScore !== undefined && (
              <div className="text-2xl font-bold text-yellow-400 [text-shadow:0_0_10px_rgba(240,185,11,0.5)]">{team2.overallScore}</div>
            )}
          </div>
        </div>

        {match.betting && (
          <div className="border-t border-gray-700 pt-4 mt-4">
            <div className="flex justify-between items-center mb-3">
              <div className="text-center">
                <div className="text-xs text-gray-400 mb-1">{team1.name} Odds</div>
                <div className="text-lg font-bold text-yellow-400 [text-shadow:0_0_10px_rgba(240,185,11,0.5)]">{match.betting.team1.odds}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-400 mb-1">{team2.name} Odds</div>
                <div className="text-lg font-bold text-yellow-400 [text-shadow:0_0_10px_rgba(240,185,11,0.5)]">{match.betting.team2.odds}</div>
              </div>
            </div>
            {isConnected && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-gradient-to-r from-yellow-400 to-yellow-300 text-black font-semibold py-2.5 px-4 rounded-xl border-none cursor-pointer transition-all duration-200 shadow-[0_4px_15px_rgba(240,185,11,0.3)]"
              >
                Place Bet
              </motion.button>
            )}
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative">
      {/* Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-yellow-400/15 rounded-full blur-[80px] animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-300/10 rounded-full blur-[80px] animate-pulse [animation-delay:1.5s]"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-yellow-400/5 rounded-full blur-[100px] animate-pulse [animation-delay:2s]"></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-b border-yellow-400/20 bg-black/30 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.3)] sticky top-0 z-50"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-300 rounded-xl flex items-center justify-center shadow-[0_4px_15px_rgba(240,185,11,0.3)]">
                <GamepadIcon size={24} color="#000000" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-300 bg-clip-text text-transparent [text-shadow:0_0_20px_rgba(240,185,11,0.5)]">BNBCAT Gaming</h1>
                <p className="text-gray-400 text-xs sm:text-sm">Powered by BNB Chain</p>
              </div>
            </div>
            <WalletConnect />
          </div>
        </motion.header>

        {/* Hero Section - 2/5th height */}
        <section className="h-[40vh] min-h-[400px] w-full">
          <div className="h-full w-full flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-7xl mx-auto text-center">
              {/* Title and Description */}
              <div className="mb-8 lg:mb-12">
                <h2 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-200 bg-clip-text text-transparent [text-shadow:0_0_30px_rgba(240,185,11,0.5)]">
                  Bet on the Future
                </h2>
                <p className="text-base sm:text-lg lg:text-xl text-gray-300 mx-auto leading-relaxed px-4">
                  Experience the ultimate esports betting platform with live streams, <br /> real-time odds, and secure blockchain transactions.
                </p>
              </div>
              
              {/* Stats Grid */}
              <div className="w-full  mx-auto px-4">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                  {[
                    { icon: Trophy, label: 'Active Tournaments', value: '24' },
                    { icon: Users, label: 'Online Players', value: '15.2K' },
                    { icon: TrendingUp, label: 'Total Bets', value: '$2.1M' },
                    { icon: Target, label: 'Win Rate', value: '94%' },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="bg-black/30 backdrop-blur-md rounded-xl lg:rounded-2xl border border-yellow-400/20 p-3 sm:p-4 lg:p-6 text-center shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-all duration-300 hover:border-yellow-400/40 hover:shadow-[0_12px_40px_rgba(240,185,11,0.1)] flex flex-col items-center justify-center min-h-[100px] sm:min-h-[120px] lg:min-h-[140px]"
                    >
                      <stat.icon size={24} className="sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-yellow-400 mb-2 lg:mb-3 flex-shrink-0" />
                      <div className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-white mb-1">{stat.value}</div>
                      <div className="text-xs sm:text-sm lg:text-base text-gray-400 leading-tight text-center">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Matches Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="px-4 sm:px-6 lg:px-8 py-16"
        >
          <div className=" mx-20">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-10">
              <h3 className="text-3xl sm:text-4xl font-bold text-whitex ">Live Matches</h3>
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
                    <h4 className="text-xl sm:text-2xl font-semibold text-yellow-400 mb-6 [text-shadow:0_0_10px_rgba(240,185,11,0.5)]">
                      {day.date}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
                      {day.matches.map((match, index) => renderMatch(match, index))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.section>

        {/* Live Streams Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="px-4 sm:px-6 lg:px-8 py-16 bg-black/10"
        >
          <div className="max-w-7xl mx-auto">
            <h3 className="text-3xl sm:text-4xl font-bold text-white mb-10">Live Streams</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
              {[1, 2, 3].map((stream) => (
                <motion.div
                  key={stream}
                  whileHover={{ scale: 1.02 }}
                  className="bg-black/30 backdrop-blur-md rounded-2xl border border-yellow-400/20 overflow-hidden cursor-pointer transition-all duration-300 shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:border-yellow-400/40 hover:shadow-[0_12px_40px_rgba(240,185,11,0.1)]"
                >
                  <div className="aspect-video bg-gradient-to-br from-yellow-400/30 to-yellow-300/20 relative flex items-center justify-center">
                    <Play size={64} color="#f0b90b" />
                    <div className="absolute top-4 left-4 bg-red-600 text-white px-2 py-1 rounded text-xs font-semibold">
                      LIVE
                    </div>
                    <div className="absolute bottom-4 right-4 bg-black/50 text-white px-2 py-1 rounded text-xs">
                      1.2K viewers
                    </div>
                  </div>
                  <div className="p-4 sm:p-6">
                    <h4 className="font-semibold text-white mb-2 text-lg">Tournament Finals</h4>
                    <p className="text-sm text-gray-400">Team Liquid vs GIANTX</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
};

export default Home;