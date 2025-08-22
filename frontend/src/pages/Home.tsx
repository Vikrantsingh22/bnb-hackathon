import React from 'react';
import Header from '../components/Header';
import Hero from '../components/Hero';
import Matches from '../components/Matches';
import LiveStreams from '../components/LiveStreams';

const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative">
      {/* Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-yellow-400/15 rounded-full blur-[80px] animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-300/10 rounded-full blur-[80px] animate-pulse [animation-delay:1.5s]"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-yellow-400/5 rounded-full blur-[100px] animate-pulse [animation-delay:2s]"></div>
      </div>

      <div className="relative z-10">
        <Header />
        <Hero />
        <Matches />
        <LiveStreams />
      </div>
    </div>
  );
};

export default Home;