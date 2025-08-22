import React, { useState } from 'react';
import Header from '../components/Header';
import Hero from '../components/Hero';
import Matches from '../components/Matches';
import LiveStreams from '../components/LiveStreams';
import SideNav from '../components/SideNav';

const Home: React.FC = () => {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 relative flex">
      {/* Global Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Large central gradient orb */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-br from-yellow-400/25 via-yellow-300/15 to-yellow-200/10 rounded-full blur-3xl"></div>
        {/* Bottom-right orb */}
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-gradient-to-tl from-yellow-300/20 via-yellow-200/12 to-transparent rounded-full blur-3xl"></div>
        {/* Top-left orb */}
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-gradient-to-br from-yellow-200/15 via-yellow-300/8 to-transparent rounded-full blur-3xl"></div>
        {/* Additional orbs for more depth */}
        <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-gradient-to-br from-yellow-400/12 via-white/8 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 left-1/4 w-[350px] h-[350px] bg-gradient-to-br from-yellow-300/10 via-yellow-100/6 to-transparent rounded-full blur-3xl"></div>
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