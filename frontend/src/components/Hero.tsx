
import React from 'react';
import { Play, ArrowRight } from 'lucide-react';

const Hero: React.FC = () => {
  return (
    <section className="relative h-[40vh] w-full overflow-hidden">
      <div className="relative z-10 h-full flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-6xl mx-auto text-center">
          {/* Announcement Banner */}
          <div className="mb-2">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400/25 to-yellow-300/20 border border-yellow-400/40 rounded-full px-4 py-1 text-sm text-yellow-200 backdrop-blur-sm">
              <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
              New betting features are live! 
              <ArrowRight size={14} />
            </div>
          </div>

          {/* Main Title */}
          <div className="mb-8">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-fredoka-bold mb-4">
              <span className="bg-gradient-to-r from-white via-gray-100 to-gray-200 bg-clip-text text-transparent">
                Accelerate Your
              </span>
              <br />
              <span className="bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-200 bg-clip-text text-transparent">
                Betting With AI
              </span>
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
              AI-driven esports betting automation & insights. Empower your strategy, close more 
              <br className="hidden sm:block" />
              winning bets, and maximize revenue effortlessly.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button className="group flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 rounded-full px-6 py-3 text-white transition-all duration-300 backdrop-blur-sm">
              <Play size={16} />
              <span>Watch Demo</span>
            </button>
            <button className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold px-8 py-3 rounded-full transition-all duration-300 shadow-lg hover:shadow-yellow-500/25">
              Get started for free
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;