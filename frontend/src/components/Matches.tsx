import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Zap, Radio } from 'lucide-react';
import { apiService, MatchDay, Match } from '../services/apiService';
import { useAuth } from '../hooks/useAuth';

const Matches: React.FC = () => {
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
              <div className="text-2xl font-bold text-yellow-400 [text-shadow:0_0_10px_rgba(240,185,11,0.5)]">
                {team1.overallScore}
              </div>
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
              <div className="text-2xl font-bold text-yellow-400 [text-shadow:0_0_10px_rgba(240,185,11,0.5)]">
                {team2.overallScore}
              </div>
            )}
          </div>
        </div>

        {match.betting && (
          <div className="border-t border-gray-700 pt-4 mt-4">
            <div className="flex justify-between items-center mb-3">
              <div className="text-center">
                <div className="text-xs text-gray-400 mb-1">{team1.name} Odds</div>
                <div className="text-lg font-bold text-yellow-400 [text-shadow:0_0_10px_rgba(240,185,11,0.5)]">
                  {match.betting.team1.odds}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-400 mb-1">{team2.name} Odds</div>
                <div className="text-lg font-bold text-yellow-400 [text-shadow:0_0_10px_rgba(240,185,11,0.5)]">
                  {match.betting.team2.odds}
                </div>
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
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="px-4 sm:px-6 lg:px-8 py-16"
    >
      <div className="mx-10">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-10">
          <h3 className="text-3xl sm:text-4xl font-bold text-white">Live Matches</h3>
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
  );
};

export default Matches;