import React from 'react';
import { motion } from 'framer-motion';
import { Wallet, LogOut, User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

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
        className="flex items-center justify-center p-2"
      >
        <div className="w-6 h-6 border-2 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin"></div>
      </motion.div>
    );
  }

  if (isConnected && wallet) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-3 bg-black/30 backdrop-blur-xl rounded-2xl border border-yellow-400/30 p-3 shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-300 rounded-full flex items-center justify-center shadow-[0_4px_15px_rgba(240,185,11,0.3)]">
            <User size={16} color="#000000" />
          </div>
          <div className="text-left">
            <div className="text-yellow-400 font-semibold text-sm [text-shadow:0_0_10px_rgba(240,185,11,0.5)]">
              {formatAddress(wallet.address)}
            </div>
            <div className="text-gray-400 text-xs">
              {formatBalance(wallet.balance)} ETH
            </div>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={disconnectWallet}
          className="p-2 text-red-400 bg-transparent border-none rounded-lg cursor-pointer transition-all duration-200 hover:bg-red-400/10"
          title="Disconnect Wallet"
        >
          <LogOut size={16} />
        </motion.button>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <motion.div
        className="relative group"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        {/* Subtle gradient border */}
        <div className="absolute -inset-px bg-gradient-to-r from-yellow-400/20 via-orange-500/20 to-yellow-400/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        
        {/* Button */}
        <motion.button
          onClick={connectWallet}
          className="relative flex items-center gap-2 bg-black/70 backdrop-blur-md text-white font-rajdhani-medium px-5 py-2.5 rounded-xl border border-gray-700/30 transition-all duration-300 group-hover:border-yellow-400/30 group-hover:bg-black/80 cursor-pointer"
        >
          <Wallet size={18} className="text-yellow-400" />
          <span>Connect MetaMask</span>
        </motion.button>
      </motion.div>
      
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-red-400 text-sm text-center"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
};

export default WalletConnect;