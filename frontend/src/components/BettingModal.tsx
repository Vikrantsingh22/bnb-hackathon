import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';
import { Match } from '../services/apiService';
import { bettingService, BetParams } from '../services/bettingService';
import { web3Service } from '../services/web3Service';
import { useAuth } from '../hooks/useAuth';
import { CONTRACT_CONFIG } from '../config/contract';

interface BettingModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match | null;
  selectedTeam: 'team1' | 'team2' | null;
}

type TransactionStatus = 'idle' | 'pending' | 'confirming' | 'success' | 'error';

const BettingModal: React.FC<BettingModalProps> = ({ isOpen, onClose, match, selectedTeam }) => {
  const { isConnected, wallet } = useAuth();
  const [stake, setStake] = useState<string>('0.01');
  const [currency, setCurrency] = useState<'BNB' | 'USDC'>('BNB');
  const [balance, setBalance] = useState<number>(0);
  const [isOnCorrectNetwork, setIsOnCorrectNetwork] = useState<boolean>(false);
  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus>('idle');
  const [transactionHash, setTransactionHash] = useState<string>('');
  const [betId, setBetId] = useState<number | null>(null);
  const [error, setError] = useState<string>('');

  // Initialize modal state when opened
  useEffect(() => {
    if (isOpen) {
      setStake('0.01');
      setTransactionStatus('idle');
      setTransactionHash('');
      setBetId(null);
      setError('');
      
      // Check wallet connection and network
      if (isConnected && wallet) {
        checkNetworkAndBalance();
      }
    }
  }, [isOpen, isConnected, wallet]);

  const checkNetworkAndBalance = async () => {
    try {
      // Check if we're on the correct network
      const onCorrectNetwork = await web3Service.isOnCorrectNetwork();
      setIsOnCorrectNetwork(onCorrectNetwork);

      // Get wallet balance
      if (wallet?.address) {
        const walletBalance = await bettingService.getWalletBalance(wallet.address);
        setBalance(parseFloat(walletBalance.formattedBnb));
      }
    } catch (error) {
      console.error('Error checking network and balance:', error);
    }
  };

  const handleNetworkSwitch = async () => {
    try {
      await web3Service.switchToCorrectNetwork();
      setIsOnCorrectNetwork(true);
    } catch (error) {
      console.error('Error switching network:', error);
      setError('Failed to switch to BSC Testnet');
    }
  };

  if (!match || !selectedTeam || !match.betting) return null;

  const team1 = typeof match.team1 === 'string' ? { name: match.team1 } : match.team1;
  const team2 = typeof match.team2 === 'string' ? { name: match.team2 } : match.team2;
  
  const selectedTeamData = selectedTeam === 'team1' ? team1 : team2;
  const odds = selectedTeam === 'team1' ? match.betting.team1.odds : match.betting.team2.odds;
  const multiplier = typeof odds === 'number' ? odds : parseFloat(String(odds).replace('x', ''));
  
  const stakeValue = parseFloat(stake) || 0;
  const payout = stakeValue * multiplier;

  const handleStakeChange = (value: string) => {
    // Only allow numbers and decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setStake(value);
    }
  };

  const setQuickStake = (amount: number) => {
    setStake(amount.toString());
  };

  const handlePlaceBet = async () => {
    if (!isConnected || !wallet) {
      setError('Please connect your wallet first');
      return;
    }

    if (!isOnCorrectNetwork) {
      setError('Please switch to BSC Testnet');
      return;
    }

    if (stakeValue <= 0) {
      setError('Please enter a valid stake amount');
      return;
    }

    if (stakeValue > balance) {
      setError('Insufficient balance');
      return;
    }

    try {
      setTransactionStatus('pending');
      setError('');

      // Prepare bet parameters
      const betParams: BetParams = {
        amount: stake,
        challengeId: parseInt(match.matchID) || 1, // Using matchID as challengeId
        playerId: selectedTeam === 'team1' ? 1 : 2,
        odds: multiplier,
        isNative: currency === 'BNB',
        tokenAddress: currency === 'BNB' ? undefined : '0x...', // Add USDC address if needed
      };

      console.log('Placing bet with params:', betParams);

      // Place the bet
      const result = await bettingService.placeBet(betParams);
      
      setTransactionStatus('confirming');
      setTransactionHash(result.hash);

      if (result.betId) {
        setBetId(result.betId);
      }

      setTransactionStatus('success');
      
      // Refresh balance after successful transaction
      setTimeout(() => {
        checkNetworkAndBalance();
      }, 2000);

    } catch (error: any) {
      console.error('Error placing bet:', error);
      setTransactionStatus('error');
      setError(error.message || 'Failed to place bet');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gray-900/95 backdrop-blur-xl border border-yellow-400/30 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] w-full max-w-md mx-auto">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-700/30">
                <h3 className="text-xl font-fredoka-bold text-white">Place Bet</h3>
                <motion.button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800/50"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <X size={20} />
                </motion.button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Network Status */}
                {isConnected && !isOnCorrectNetwork && (
                  <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle size={16} className="text-orange-400" />
                      <span className="text-orange-400 font-rajdhani-semibold text-sm">Wrong Network</span>
                    </div>
                    <p className="text-gray-300 text-xs mb-3">Switch to BSC Testnet to place bets</p>
                    <motion.button
                      onClick={handleNetworkSwitch}
                      className="w-full py-2 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-lg font-rajdhani-semibold text-sm hover:bg-orange-500/30 transition-colors"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      Switch to BSC Testnet
                    </motion.button>
                  </div>
                )}

                {/* Transaction Status */}
                {transactionStatus !== 'idle' && (
                  <div className={`border rounded-lg p-4 ${
                    transactionStatus === 'success' 
                      ? 'bg-green-500/10 border-green-500/30' 
                      : transactionStatus === 'error'
                      ? 'bg-red-500/10 border-red-500/30'
                      : 'bg-yellow-500/10 border-yellow-500/30'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      {transactionStatus === 'success' ? (
                        <CheckCircle size={16} className="text-green-400" />
                      ) : transactionStatus === 'error' ? (
                        <AlertCircle size={16} className="text-red-400" />
                      ) : (
                        <div className="w-4 h-4 border-2 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin" />
                      )}
                      <span className={`font-rajdhani-semibold text-sm ${
                        transactionStatus === 'success' ? 'text-green-400' :
                        transactionStatus === 'error' ? 'text-red-400' : 'text-yellow-400'
                      }`}>
                        {transactionStatus === 'pending' ? 'Confirming Transaction...' :
                         transactionStatus === 'confirming' ? 'Transaction Sent' :
                         transactionStatus === 'success' ? 'Bet Placed Successfully!' :
                         'Transaction Failed'}
                      </span>
                    </div>
                    
                    {transactionHash && (
                      <a
                        href={`${CONTRACT_CONFIG.blockExplorer}/tx/${transactionHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        View on BSCScan <ExternalLink size={12} />
                      </a>
                    )}
                    
                    {betId && (
                      <p className="text-gray-300 text-xs mt-1">Bet ID: {betId}</p>
                    )}
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <AlertCircle size={14} className="text-red-400" />
                      <span className="text-red-400 text-sm">{error}</span>
                    </div>
                  </div>
                )}
                {/* Bet Selection */}
                <div className="text-center">
                  <div className="text-white font-fredoka-semibold text-lg mb-1">{selectedTeamData.name}</div>
                  <div className="text-gray-400 text-sm mb-3">{match.event}</div>
                  <div className="inline-flex items-center gap-2 bg-yellow-400/20 border border-yellow-400/30 rounded-lg px-4 py-2">
                    <span className="text-yellow-400 font-rajdhani-bold text-lg">
                      {typeof odds === 'number' ? `${odds}x` : odds}
                    </span>
                    <span className="text-yellow-400 font-rajdhani-medium text-sm">odds</span>
                  </div>
                </div>

                {/* Currency Selection */}
                <div>
                  <label className="text-gray-400 font-rajdhani-medium text-sm mb-3 block">Currency</label>
                  <div className="flex gap-3">
                    <motion.button
                      onClick={() => setCurrency('BNB')}
                      className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border bg-yellow-400/20 border-yellow-400/50 text-yellow-400"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span>⚡</span>
                      <span className="font-rajdhani-semibold">BNB</span>
                    </motion.button>
                  </div>
                  <p className="text-gray-400 text-xs mt-2">
                    Betting with BNB on BSC Testnet
                  </p>
                </div>

                {/* Stake Input */}
                <div>
                  <label className="text-gray-400 font-rajdhani-medium text-sm mb-3 block">Stake Amount</label>
                  <div className="relative mb-4">
                    <input
                      type="text"
                      value={stake}
                      onChange={(e) => handleStakeChange(e.target.value)}
                      className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-4 py-4 text-white font-rajdhani-semibold text-xl focus:border-yellow-400 focus:outline-none transition-colors"
                      placeholder="0.00"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-rajdhani-medium">
                      {currency}
                    </div>
                  </div>
                  
                  {/* Quick Amount Buttons */}
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {[0.01, 0.05, 0.1, 0.25].map((amount) => (
                      <motion.button
                        key={amount}
                        onClick={() => setQuickStake(amount)}
                        className={`py-2 px-3 rounded-lg text-sm font-rajdhani-semibold transition-all duration-200 ${
                          stake === amount.toString()
                            ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/30'
                            : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 border border-gray-600'
                        }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {amount}
                      </motion.button>
                    ))}
                  </div>
                  
                  <div className="text-gray-400 text-xs font-rajdhani-medium">
                    Balance: {balance.toFixed(3)} {currency}
                  </div>
                </div>

                {/* Payout Summary */}
                <div className="bg-gradient-to-r from-green-500/10 to-green-400/10 border border-green-500/20 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-green-400 font-rajdhani-medium text-sm">Potential Payout</span>
                    <span className="text-green-400 font-rajdhani-semibold text-sm">
                      {multiplier.toFixed(2)}x multiplier
                    </span>
                  </div>
                  <div className="text-center">
                    <div className="text-white font-rajdhani-bold text-3xl mb-1">
                      {payout.toFixed(3)}
                    </div>
                    <div className="text-gray-400 font-rajdhani-medium text-sm">
                      {currency}
                    </div>
                  </div>
                </div>

                {/* Place Bet Button */}
                <motion.button
                  onClick={handlePlaceBet}
                  disabled={
                    !stakeValue || 
                    stakeValue <= 0 || 
                    !isConnected || 
                    !isOnCorrectNetwork || 
                    transactionStatus === 'pending' || 
                    transactionStatus === 'confirming' ||
                    stakeValue > balance
                  }
                  className={`w-full py-4 rounded-xl font-rajdhani-bold text-lg transition-all duration-200 ${
                    stakeValue > 0 && isConnected && isOnCorrectNetwork && transactionStatus === 'idle' && stakeValue <= balance
                      ? 'bg-gradient-to-r from-yellow-500 to-yellow-400 text-black shadow-[0_4px_20px_rgba(245,158,11,0.3)] hover:from-yellow-600 hover:to-yellow-500'
                      : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  }`}
                  whileTap={stakeValue > 0 && isConnected && isOnCorrectNetwork && transactionStatus === 'idle' ? { scale: 0.98 } : {}}
                >
                  {!isConnected ? 'Connect Wallet' :
                   !isOnCorrectNetwork ? 'Switch to BSC Testnet' :
                   transactionStatus === 'pending' ? 'Confirming...' :
                   transactionStatus === 'confirming' ? 'Processing...' :
                   transactionStatus === 'success' ? 'Bet Placed!' :
                   stakeValue > balance ? 'Insufficient Balance' :
                   'Place Bet'}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default BettingModal;