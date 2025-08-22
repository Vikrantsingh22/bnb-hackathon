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

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 30%, #2d2d2d 70%, #1a1a1a 100%)',
    position: 'relative' as const
  },
  backgroundElements: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    pointerEvents: 'none' as const
  },
  backgroundOrb1: {
    position: 'absolute' as const,
    top: '-160px',
    right: '-160px',
    width: '320px',
    height: '320px',
    backgroundColor: 'rgba(240, 185, 11, 0.15)',
    borderRadius: '50%',
    filter: 'blur(80px)',
    animation: 'pulse 3s infinite'
  },
  backgroundOrb2: {
    position: 'absolute' as const,
    bottom: '-160px',
    left: '-160px',
    width: '320px',
    height: '320px',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: '50%',
    filter: 'blur(80px)',
    animation: 'pulse 3s infinite',
    animationDelay: '1.5s'
  },
  backgroundOrb3: {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '400px',
    height: '400px',
    backgroundColor: 'rgba(240, 185, 11, 0.05)',
    borderRadius: '50%',
    filter: 'blur(100px)',
    animation: 'pulse 4s infinite',
    animationDelay: '2s'
  },
  content: {
    position: 'relative' as const,
    zIndex: 10
  },
  header: {
    borderBottom: '1px solid rgba(240, 185, 11, 0.2)',
    background: 'rgba(0, 0, 0, 0.3)',
    backdropFilter: 'blur(20px)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
  },
  headerContainer: {
    maxWidth: '1280px',
    margin: '0 auto',
    padding: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  logoIcon: {
    width: '40px',
    height: '40px',
    background: 'linear-gradient(135deg, #f0b90b, #ffd700)',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 15px rgba(240, 185, 11, 0.3)'
  },
  logoText: {
    fontSize: '24px',
    fontWeight: 'bold',
    background: 'linear-gradient(135deg, #f0b90b, #ffd700)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    textShadow: '0 0 20px rgba(240, 185, 11, 0.5)'
  },
  logoSubtext: {
    color: '#9ca3af',
    fontSize: '14px'
  },
  heroSection: {
    padding: '64px 16px',
    textAlign: 'center' as const
  },
  heroContainer: {
    maxWidth: '1280px',
    margin: '0 auto'
  },
  heroTitle: {
    fontSize: '48px',
    fontWeight: 'bold',
    marginBottom: '24px',
    background: 'linear-gradient(135deg, #f0b90b, #ffd700, #ffed4e)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    textShadow: '0 0 30px rgba(240, 185, 11, 0.5)'
  },
  heroSubtitle: {
    fontSize: '20px',
    color: '#d1d5db',
    marginBottom: '32px',
    maxWidth: '768px',
    margin: '0 auto 32px'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '24px',
    maxWidth: '1024px',
    margin: '0 auto 48px'
  },
  statCard: {
    background: 'rgba(0, 0, 0, 0.3)',
    backdropFilter: 'blur(20px)',
    borderRadius: '16px',
    border: '1px solid rgba(240, 185, 11, 0.2)',
    padding: '24px',
    textAlign: 'center' as const,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    transition: 'all 0.3s ease'
  },
  statValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: 'white',
    marginBottom: '4px'
  },
  statLabel: {
    fontSize: '14px',
    color: '#9ca3af'
  },
  matchesSection: {
    padding: '48px 16px'
  },
  matchesContainer: {
    maxWidth: '1280px',
    margin: '0 auto'
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px'
  },
  sectionTitle: {
    fontSize: '30px',
    fontWeight: 'bold',
    color: 'white'
  },
  tabContainer: {
    display: 'flex',
    gap: '8px',
    background: 'rgba(0, 0, 0, 0.3)',
    backdropFilter: 'blur(20px)',
    borderRadius: '16px',
    padding: '6px',
    border: '1px solid rgba(240, 185, 11, 0.2)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
  },
  tab: {
    padding: '8px 16px',
    borderRadius: '8px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  activeTab: {
    background: 'linear-gradient(135deg, #f0b90b, #ffd700)',
    color: '#000000',
    boxShadow: '0 4px 15px rgba(240, 185, 11, 0.3)'
  },
  inactiveTab: {
    color: '#9ca3af'
  },
  matchGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
    gap: '24px'
  },
  matchCard: {
    background: 'rgba(0, 0, 0, 0.3)',
    backdropFilter: 'blur(20px)',
    borderRadius: '16px',
    border: '1px solid rgba(240, 185, 11, 0.2)',
    padding: '24px',
    transition: 'all 0.3s',
    cursor: 'pointer',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
  },
  matchCardHover: {
    borderColor: 'rgba(240, 185, 11, 0.4)',
    transform: 'translateY(-2px)',
    boxShadow: '0 12px 40px rgba(240, 185, 11, 0.1)'
  },
  matchHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px'
  },
  liveIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: '#dc2626',
    color: 'white',
    padding: '4px 8px',
    borderRadius: '9999px',
    fontSize: '12px',
    fontWeight: '600'
  },
  upcomingIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: '#2563eb',
    color: 'white',
    padding: '4px 8px',
    borderRadius: '9999px',
    fontSize: '12px',
    fontWeight: '600'
  },
  matchInfo: {
    textAlign: 'right' as const,
    fontSize: '14px',
    color: '#9ca3af'
  },
  teamsContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px'
  },
  team: {
    flex: 1,
    textAlign: 'center' as const
  },
  teamHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginBottom: '8px'
  },
  teamLogo: {
    width: '32px',
    height: '32px',
    borderRadius: '50%'
  },
  teamName: {
    fontWeight: '600',
    color: 'white'
  },
  teamScore: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#f0b90b',
    textShadow: '0 0 10px rgba(240, 185, 11, 0.5)'
  },
  vs: {
    padding: '0 16px',
    color: '#9ca3af',
    fontSize: '14px',
    fontWeight: '600'
  },
  bettingSection: {
    borderTop: '1px solid #374151',
    paddingTop: '16px',
    marginTop: '16px'
  },
  oddsContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  },
  oddsItem: {
    textAlign: 'center' as const
  },
  oddsLabel: {
    fontSize: '12px',
    color: '#9ca3af',
    marginBottom: '4px'
  },
  oddsValue: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#f0b90b',
    textShadow: '0 0 10px rgba(240, 185, 11, 0.5)'
  },
  betButton: {
    width: '100%',
    background: 'linear-gradient(135deg, #f0b90b, #ffd700)',
    color: '#000000',
    fontWeight: '600',
    padding: '10px 16px',
    borderRadius: '12px',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 4px 15px rgba(240, 185, 11, 0.3)'
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '80px'
  },
  spinner: {
    width: '48px',
    height: '48px',
    border: '4px solid rgba(240, 185, 11, 0.3)',
    borderTop: '4px solid #f0b90b',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  streamsSection: {
    padding: '48px 16px'
  },
  streamGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '24px'
  },
  streamCard: {
    background: 'rgba(0, 0, 0, 0.3)',
    backdropFilter: 'blur(20px)',
    borderRadius: '16px',
    border: '1px solid rgba(240, 185, 11, 0.2)',
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'all 0.3s',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
  },
  streamVideo: {
    aspectRatio: '16/9',
    background: 'linear-gradient(135deg, rgba(240, 185, 11, 0.3), rgba(255, 215, 0, 0.2))',
    position: 'relative' as const,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  streamInfo: {
    padding: '16px'
  },
  streamTitle: {
    fontWeight: '600',
    color: 'white',
    marginBottom: '8px'
  },
  streamSubtitle: {
    fontSize: '14px',
    color: '#9ca3af'
  }
};

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
        style={styles.matchCard}
        whileHover={{ scale: 1.02 }}
      >
        <div style={styles.matchHeader}>
          <div>
            {match.status === 'LIVE' && (
              <div style={styles.liveIndicator}>
                <Radio size={12} />
                <span>LIVE</span>
              </div>
            )}
            {match.status === 'Upcoming' && (
              <div style={styles.upcomingIndicator}>
                <Clock size={12} />
                <span>{match.eta}</span>
              </div>
            )}
          </div>
          <div style={styles.matchInfo}>
            <div>{match.time}</div>
            <div style={{ fontSize: '12px' }}>{match.event}</div>
          </div>
        </div>

        <div style={styles.teamsContainer}>
          <div style={styles.team}>
            <div style={styles.teamHeader}>
              {team1.logo && (
                <img src={team1.logo} alt={team1.name} style={styles.teamLogo} />
              )}
              <span style={styles.teamName}>{team1.name}</span>
            </div>
            {team1.overallScore !== undefined && (
              <div style={styles.teamScore}>{team1.overallScore}</div>
            )}
          </div>

          <div style={styles.vs}>VS</div>

          <div style={styles.team}>
            <div style={styles.teamHeader}>
              <span style={styles.teamName}>{team2.name}</span>
              {team2.logo && (
                <img src={team2.logo} alt={team2.name} style={styles.teamLogo} />
              )}
            </div>
            {team2.overallScore !== undefined && (
              <div style={styles.teamScore}>{team2.overallScore}</div>
            )}
          </div>
        </div>

        {match.betting && (
          <div style={styles.bettingSection}>
            <div style={styles.oddsContainer}>
              <div style={styles.oddsItem}>
                <div style={styles.oddsLabel}>{team1.name} Odds</div>
                <div style={styles.oddsValue}>{match.betting.team1.odds}</div>
              </div>
              <div style={styles.oddsItem}>
                <div style={styles.oddsLabel}>{team2.name} Odds</div>
                <div style={styles.oddsValue}>{match.betting.team2.odds}</div>
              </div>
            </div>
            {isConnected && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={styles.betButton}
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
    <div style={styles.container}>
      <div style={styles.backgroundElements}>
        <div style={styles.backgroundOrb1}></div>
        <div style={styles.backgroundOrb2}></div>
        <div style={styles.backgroundOrb3}></div>
      </div>

      <div style={styles.content}>
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={styles.header}
        >
          <div style={styles.headerContainer}>
            <div style={styles.logo}>
              <div style={styles.logoIcon}>
                <GamepadIcon size={24} color="#000000" />
              </div>
              <div>
                <h1 style={styles.logoText}>BNBCAT Gaming</h1>
                <p style={styles.logoSubtext}>Powered by BNB Chain</p>
              </div>
            </div>
            <WalletConnect />
          </div>
        </motion.header>

        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={styles.heroSection}
        >
          <div style={styles.heroContainer}>
            <h2 style={styles.heroTitle}>Bet on the Future</h2>
            <p style={styles.heroSubtitle}>
              Experience the ultimate esports betting platform with live streams, real-time odds, and secure blockchain transactions.
            </p>
            
            <div style={styles.statsGrid}>
              {[
                { icon: Trophy, label: 'Active Tournaments', value: '24' },
                { icon: Users, label: 'Online Players', value: '15.2K' },
                { icon: TrendingUp, label: 'Total Bets', value: '$2.1M' },
                { icon: Target, label: 'Win Rate', value: '94%' },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  style={styles.statCard}
                >
                  <stat.icon size={32} color="#f0b90b" style={{ margin: '0 auto 8px' }} />
                  <div style={styles.statValue}>{stat.value}</div>
                  <div style={styles.statLabel}>{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Matches Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={styles.matchesSection}
        >
          <div style={styles.matchesContainer}>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>Live Matches</h3>
              <div style={styles.tabContainer}>
                <button
                  onClick={() => setActiveTab('live')}
                  style={{
                    ...styles.tab,
                    ...(activeTab === 'live' ? styles.activeTab : styles.inactiveTab)
                  }}
                >
                  <Zap size={16} />
                  <span>Live</span>
                </button>
                <button
                  onClick={() => setActiveTab('upcoming')}
                  style={{
                    ...styles.tab,
                    ...(activeTab === 'upcoming' ? styles.activeTab : styles.inactiveTab)
                  }}
                >
                  <Clock size={16} />
                  <span>Upcoming</span>
                </button>
              </div>
            </div>

            {loading ? (
              <div style={styles.loading}>
                <div style={styles.spinner}></div>
              </div>
            ) : (
              <div>
                {(activeTab === 'live' ? liveMatches : upcomingMatches).map((day) => (
                  <div key={day.date} style={{ marginBottom: '32px' }}>
                                <h4 style={{ fontSize: '20px', fontWeight: '600', color: '#f0b90b', marginBottom: '16px', textShadow: '0 0 10px rgba(240, 185, 11, 0.5)' }}>
              {day.date}
            </h4>
                    <div style={styles.matchGrid}>
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
          style={styles.streamsSection}
        >
          <div style={styles.matchesContainer}>
            <h3 style={styles.sectionTitle}>Live Streams</h3>
            <div style={styles.streamGrid}>
              {[1, 2, 3].map((stream) => (
                <motion.div
                  key={stream}
                  whileHover={{ scale: 1.02 }}
                  style={styles.streamCard}
                >
                  <div style={styles.streamVideo}>
                    <Play size={64} color="#f0b90b" />
                    <div style={{
                      position: 'absolute',
                      top: '16px',
                      left: '16px',
                      backgroundColor: '#dc2626',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      LIVE
                    </div>
                    <div style={{
                      position: 'absolute',
                      bottom: '16px',
                      right: '16px',
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}>
                      1.2K viewers
                    </div>
                  </div>
                  <div style={styles.streamInfo}>
                    <h4 style={styles.streamTitle}>Tournament Finals</h4>
                    <p style={styles.streamSubtitle}>Team Liquid vs GIANTX</p>
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