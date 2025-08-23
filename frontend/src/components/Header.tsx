import React from 'react';
import { motion } from 'framer-motion';

import WalletConnect from './WalletConnect';

const Header: React.FC = () => {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className=" bg-black/30 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.3)] sticky top-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-300 rounded-xl flex items-center justify-center shadow-[0_4px_15px_rgba(255,235,59,0.3)]">
                    <span className="text-black font-bold">BC</span>
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-fredoka-bold bg-gradient-to-r from-yellow-400 to-yellow-200 bg-clip-text text-transparent [text-shadow:0_0_20px_rgba(255,235,59,0.5)]">
                      BNBCAT
                    </h1>
                    <p className="text-gray-300 text-xs sm:text-sm font-rajdhani-regular">Powered by BNB Chain</p>
                  </div>
        </div>
        <WalletConnect />
      </div>
    </motion.header>
  );
};

export default Header;