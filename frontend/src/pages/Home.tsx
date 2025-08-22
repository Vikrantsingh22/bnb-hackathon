import React, { useState } from 'react';
import Header from '../components/Header';
import Hero from '../components/Hero';
import Matches from '../components/Matches';
import LiveStreams from '../components/LiveStreams';
import SideNav from '../components/SideNav';

const Home: React.FC = () => {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black relative flex">
      {/* Global Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Large central gradient orb */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-br from-yellow-500/20 via-orange-500/15 to-amber-600/10 rounded-full blur-3xl"></div>
        {/* Bottom-right orb */}
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-gradient-to-tl from-orange-400/15 via-yellow-500/10 to-transparent rounded-full blur-3xl"></div>
        {/* Top-left orb */}
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-gradient-to-br from-amber-500/10 via-yellow-400/5 to-transparent rounded-full blur-3xl"></div>
        {/* Additional orbs for more depth */}
        <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-gradient-to-br from-yellow-400/8 via-orange-400/5 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 left-1/4 w-[350px] h-[350px] bg-gradient-to-br from-orange-500/8 via-amber-500/5 to-transparent rounded-full blur-3xl"></div>
      </div>

      {/* Sidebar */}
      <SideNav isExpanded={sidebarExpanded} setIsExpanded={setSidebarExpanded} />

      {/* Main Content */}
      <div 
        className={`flex-1 transition-all duration-150 ease-in-out ${
          sidebarExpanded ? 'ml-64' : 'ml-16'
        }`}
      >
        <div className="relative z-10">
          <Header />
          <Hero />
          <Matches />
          <LiveStreams />
          </div>
      </div>
    </div>
  );
};

export default Home;