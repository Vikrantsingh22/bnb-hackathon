import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2 } from 'lucide-react';
import { Match } from '../services/apiService';

interface BettingModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match | null;
  selectedTeam: 'team1' | 'team2' | null;
}

const BettingModal: React.FC<BettingModalProps> = ({ isOpen, onClose, match, selectedTeam }) => {
  const [stake, setStake] = useState<string>('10');
  const [currency, setCurrency] = useState<'BNB' | 'USDC'>('BNB');
  const [balance] = useState<number>(0.000); // This would come from wallet
  const [limit] = useState<number>(3442); // This would come from API

  // Reset stake when modal opens
  useEffect(() => {
    if (isOpen) {
      setStake('10');
    }
  }, [isOpen]);

  if (!match || !selectedTeam || !match.betting) return null;

  const team1 = typeof match.team1 === 'string' ? { name: match.team1 } : match.team1;
  const team2 = typeof match.team2 === 'string' ? { name: match.team2 } : match.team2;
  
  const selectedTeamData = selectedTeam === 'team1' ? team1 : team2;
  const odds = selectedTeam === 'team1' ? match.betting.team1.odds : match.betting.team2.odds;
  const multiplier = typeof odds === 'number' ? odds : parseFloat(odds.toString().replace('x', ''));
  
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

  const handlePlaceBet = () => {
    // TODO: Implement actual betting logic
    console.log('Placing bet:', {
      match: match.matchID,
      team: selectedTeam,
      stake: stakeValue,
      currency,
      odds,
      payout
    });
    onClose();
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
                    {(['BNB', 'USDC'] as const).map((curr) => (
                      <motion.button
                        key={curr}
                        onClick={() => setCurrency(curr)}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border transition-all duration-200 ${
                          currency === curr
                            ? 'bg-yellow-400/20 border-yellow-400/50 text-yellow-400'
                            : 'bg-gray-800/50 border-gray-600 text-gray-300 hover:border-gray-500'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <span>{curr === 'BNB' ? '⚡' : '💰'}</span>
                        <span className="font-rajdhani-semibold">{curr}</span>
                      </motion.button>
                    ))}
                  </div>
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
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {[5, 10, 25].map((amount) => (
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
                  disabled={!stakeValue || stakeValue <= 0}
                  className={`w-full py-4 rounded-xl font-rajdhani-bold text-lg transition-all duration-200 ${
                    stakeValue > 0
                      ? 'bg-gradient-to-r from-green-500 to-green-400 text-white shadow-[0_4px_20px_rgba(34,197,94,0.3)] hover:from-green-600 hover:to-green-500'
                      : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  }`}
                  whileTap={stakeValue > 0 ? { scale: 0.98 } : {}}
                >
                  Place Bet
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