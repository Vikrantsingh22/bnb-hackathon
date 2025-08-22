import React from 'react';
import { Trophy, Users, TrendingUp, Target } from 'lucide-react';

const Hero: React.FC = () => {
  const stats = [
    { icon: Trophy, label: 'Active Tournaments', value: '24' },
    { icon: Users, label: 'Online Players', value: '15.2K' },
    { icon: TrendingUp, label: 'Total Bets', value: '$2.1M' },
    { icon: Target, label: 'Win Rate', value: '94%' },
  ];

  return (
    <section className="h-[40vh] min-h-[400px] w-full">
      <div className="h-full w-full flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-7xl mx-auto text-center">
          {/* Title and Description */}
          <div className="mb-8 lg:mb-12">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-200 bg-clip-text text-transparent [text-shadow:0_0_30px_rgba(240,185,11,0.5)]">
              Bet on the Future
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-300 mx-auto leading-relaxed px-4">
              Experience the ultimate esports betting platform with live streams, <br /> 
              real-time odds, and secure blockchain transactions.
            </p>
          </div>
          
          {/* Stats Grid */}
          <div className="w-full mx-auto px-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="bg-black/30 backdrop-blur-md rounded-xl lg:rounded-2xl border border-yellow-400/20 p-3 sm:p-4 lg:p-6 text-center shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-all duration-300 hover:border-yellow-400/40 hover:shadow-[0_12px_40px_rgba(240,185,11,0.1)] flex flex-col items-center justify-center min-h-[100px] sm:min-h-[120px] lg:min-h-[140px]"
                >
                  <stat.icon size={24} className="sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-yellow-400 mb-2 lg:mb-3 flex-shrink-0" />
                  <div className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-white mb-1">
                    {stat.value}
                  </div>
                  <div className="text-xs sm:text-sm lg:text-base text-gray-400 leading-tight text-center">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;