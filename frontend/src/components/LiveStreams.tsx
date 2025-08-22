import React from 'react';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';

const LiveStreams: React.FC = () => {
  const streams = [1, 2, 3];

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="px-4 sm:px-6 lg:px-8 py-16 bg-black/10"
    >
      <div className="max-w-7xl mx-auto">
        <h3 className="text-3xl sm:text-4xl font-bold text-white mb-10">Live Streams</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
          {streams.map((stream) => (
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
  );
};

export default LiveStreams;