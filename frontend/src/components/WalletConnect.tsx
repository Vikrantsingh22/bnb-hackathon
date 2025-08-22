import React from 'react';
import { motion } from 'framer-motion';
import { Wallet, LogOut, User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const styles = {
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px'
  },
  spinner: {
    width: '24px',
    height: '24px',
    border: '2px solid rgba(240, 185, 11, 0.3)',
    borderTop: '2px solid #f0b90b',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  connectedContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    background: 'rgba(0, 0, 0, 0.3)',
    backdropFilter: 'blur(20px)',
    borderRadius: '16px',
    border: '1px solid rgba(240, 185, 11, 0.3)',
    padding: '12px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  avatar: {
    width: '32px',
    height: '32px',
    background: 'linear-gradient(135deg, #f0b90b, #ffd700)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 15px rgba(240, 185, 11, 0.3)'
  },
  userDetails: {
    textAlign: 'left' as const
  },
  address: {
    color: '#f0b90b',
    fontWeight: '600',
    fontSize: '14px',
    textShadow: '0 0 10px rgba(240, 185, 11, 0.5)'
  },
  balance: {
    color: '#9ca3af',
    fontSize: '12px'
  },
  disconnectButton: {
    padding: '8px',
    color: '#f87171',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  connectContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px'
  },
  connectButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'linear-gradient(135deg, #f0b90b, #ffd700)',
    color: '#000000',
    fontWeight: '600',
    padding: '12px 24px',
    borderRadius: '12px',
    border: '1px solid rgba(240, 185, 11, 0.3)',
    boxShadow: '0 4px 15px rgba(240, 185, 11, 0.3)',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  errorMessage: {
    color: '#f87171',
    fontSize: '14px',
    textAlign: 'center' as const
  }
};

const WalletConnect: React.FC = () => {
  const { isConnected, wallet, isLoading, error, connectWallet, disconnectWallet } = useAuth();

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatBalance = (balance: string) => {
    return parseFloat(balance).toFixed(4);
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={styles.loading}
      >
        <div style={styles.spinner}></div>
      </motion.div>
    );
  }

  if (isConnected && wallet) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        style={styles.connectedContainer}
      >
        <div style={styles.userInfo}>
          <div style={styles.avatar}>
            <User size={16} color="#000000" />
          </div>
          <div style={styles.userDetails}>
            <div style={styles.address}>
              {formatAddress(wallet.address)}
            </div>
            <div style={styles.balance}>
              {formatBalance(wallet.balance)} ETH
            </div>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={disconnectWallet}
          style={styles.disconnectButton}
          title="Disconnect Wallet"
        >
          <LogOut size={16} />
        </motion.button>
      </motion.div>
    );
  }

  return (
    <div style={styles.connectContainer}>
      <motion.button
        whileHover={{ 
          scale: 1.02, 
          boxShadow: '0 0 30px rgba(6, 182, 212, 0.3)' 
        }}
        whileTap={{ scale: 0.98 }}
        onClick={connectWallet}
        style={styles.connectButton}
      >
        <Wallet size={20} />
        <span>Connect MetaMask</span>
      </motion.button>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={styles.errorMessage}
        >
          {error}
        </motion.p>
      )}
    </div>
  );
};

export default WalletConnect;