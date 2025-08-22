import React from 'react';
import { motion } from 'framer-motion';
import { 
  Home, 
  CreditCard, 
  Wallet, 
  Send, 
  Twitter, 
  HelpCircle,
  TrendingUp,
  BarChart3,
  User,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';

interface SideNavProps {
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
}

const SideNav: React.FC<SideNavProps> = ({ isExpanded, setIsExpanded }) => {

  const navigationItems = [
    { icon: Home, label: 'Home', href: '#home', active: true },
    { icon: CreditCard, label: 'All Challenges', href: '#challenges', active: false },
    { icon: BarChart3, label: 'Streams', href: '#streams', active: false },
    { icon: TrendingUp, label: 'Leaderboard', href: '#leaderboard', active: false },
    { icon: HelpCircle, label: 'How It Works', href: '#how-it-works', active: false },
  ];

  const accountItems = [
    { icon: User, label: 'User Dashboard', href: '#dashboard', active: false },
  ];

  const socialItems = [
    { icon: Send, label: 'Telegram', href: 'https://telegram.org', active: false },
    { icon: Twitter, label: 'Twitter', href: 'https://twitter.com', active: false },
    { icon: Wallet, label: 'Connect Wallet', href: '#wallet', active: false },
  ];

  const MenuItem = ({ item }: { item: any }) => (
    <motion.a
      href={item.href}
      className={`flex items-center rounded-lg transition-all duration-200 group relative mx-2 ${
        isExpanded 
          ? 'gap-3 px-3 py-2.5' 
          : 'justify-center py-3 px-2'
      } ${
        item.active 
          ? 'bg-yellow-500/20 text-yellow-400' 
          : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
      }`}
      whileHover={{ x: isExpanded ? 2 : 0, scale: !isExpanded ? 1.05 : 1 }}
      title={!isExpanded ? item.label : undefined}
    >
      <item.icon 
        size={18} 
        className={`flex-shrink-0 ${item.active ? 'text-yellow-400' : ''}`} 
      />
      {isExpanded && (
        <span className="font-rajdhani-medium text-sm whitespace-nowrap">
          {item.label}
        </span>
      )}
      {item.active && isExpanded && (
        <motion.div
          className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-yellow-400 rounded-l"
          layoutId="activeTab"
        />
      )}
      {item.active && !isExpanded && (
        <motion.div
          className="absolute right-1 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-yellow-400 rounded-l"
          layoutId="activeTabCollapsed"
        />
      )}
    </motion.a>
  );

  return (
    <motion.div
      className={`fixed left-0 top-0 h-full bg-gray-900/95 backdrop-blur-xl border-r border-gray-700/50 z-40 flex flex-col transition-all duration-150 ease-in-out ${
        isExpanded ? 'w-64' : 'w-16'
      }`}
      initial={false}
      animate={{ width: isExpanded ? 256 : 64 }}
      transition={{ duration: 0.15, ease: "easeInOut" }}
    >
      {/* Header */}
      <div className={`border-b border-gray-700/50 ${isExpanded ? 'p-4' : 'p-2'}`}>
        {isExpanded ? (
          <div className="flex items-center justify-between">
            <span className="font-rajdhani-bold text-white text-lg">Menu</span>
            <motion.button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 rounded-lg bg-gray-700/50 hover:bg-gray-600/50 text-gray-400 hover:text-white transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ChevronLeft size={16} />
            </motion.button>
          </div>
        ) : (
          <div className="flex justify-center">
            <motion.button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 rounded-lg bg-gray-700/50 hover:bg-gray-600/50 text-gray-400 hover:text-white transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ChevronRight size={16} />
            </motion.button>
          </div>
        )}
      </div>

      {/* Main Navigation */}
      <div className="flex-1 py-4">
        {isExpanded && (
          <div className="px-4 mb-4">
            <span className="text-xs uppercase text-gray-500 font-rajdhani-semibold tracking-wide">
              Main Navigation
            </span>
          </div>
        )}
        <div className={`${isExpanded ? 'space-y-1' : 'space-y-2'}`}>
          {navigationItems.map((item) => (
            <MenuItem key={item.label} item={item} />
          ))}
        </div>

        {/* Account Section */}
        <div className={`${isExpanded ? 'mt-8' : 'mt-6'}`}>
          {isExpanded && (
            <div className="px-4 mb-4">
              <span className="text-xs uppercase text-gray-500 font-rajdhani-semibold tracking-wide">
                Account
              </span>
            </div>
          )}
          <div className={`${isExpanded ? 'space-y-1' : 'space-y-2'}`}>
            {accountItems.map((item) => (
              <MenuItem key={item.label} item={item} />
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700/50">
        <div className={`${isExpanded ? 'space-y-1' : 'space-y-2'}`}>
          {socialItems.map((item) => (
            <MenuItem key={item.label} item={item} />
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default SideNav;