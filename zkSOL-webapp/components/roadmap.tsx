import React from 'react';

interface RoadmapItem {
  date: string;
  title: string;
  description: string;
  completed: boolean;
  icon?: string;
}


const roadmapData: RoadmapItem[] = [
  {
    date: "Q2 2025",
    title: "Zask Protocol Launch",
    description: "Zask protocol, a privacy-preserving protocol for all-thing privacy",
    completed: true,
    icon: "shield-check"
  },
  {
    date: "Q2 2025",
    title: "Zask Protocol Launch",
    description: "Launch of the core Zask protocol, send and receive tokens with complete anonymity",
    completed: true,
    icon: "shield-check"
  },
  {
    date: "Somewhere in 2025",
    title: "Privacy Pools",
    description: "Introduction of Privacy Pools, a revolutionary DeFi primitive that enables users to earn yield on their assets while maintaining complete privacy. This innovation brings privacy-preserving staking to the Solana ecosystem.",
    completed: false,
    icon: "lock"
  },
  {
    date: "Somewhere in 2025",
    title: "MEV Protection",
    description: "Implementation of advanced MEV protection mechanisms via confidential transactions to shield users from front-running, sandwich attacks, and other predatory trading practices that can harm transaction execution.",
    completed: false,
    icon: "shield"
  },
  {
    date: "Somewhere in 2025",
    title: "zkSOL",
    description: "zkSOL - the powerhouse of Zask.",
    completed: false,
    icon: "zap"
  },
  {
    date: "Somewhere in 2025",
    title: "Rebirth SOL",
    description: "Launch of Rebirth SOL, a comprehensive privacy solution for the Solana ecosystem that maximizes privacy preservation.",
    completed: false,
    icon: "refresh-cw"
  },
];

const Roadmap = () => {
  return (
    <div className="w-full max-w-4xl mx-auto py-16">
      <h2 className="text-4xl font-bold text-center mb-4 text-white">Our Roadmap</h2>
      <p className="text-center text-gray-400 mb-16 max-w-2xl mx-auto">Our journey to revolutionize privacy in the Solana ecosystem and beyond</p>
      
      <div className="relative">
        {/* Vertical line - fixed to ensure it connects all items */}
        <div className="absolute left-[120px] top-0 h-full w-px bg-gradient-to-b from-primary-500/40 to-primary-500/10"></div>
        
        <div className="space-y-16">
          {roadmapData.map((item, index) => (
            <div key={index} className="flex items-start relative group">
              <div className="w-[100px] text-sm text-primary-300 font-mono transition-all duration-300 group-hover:text-primary-200">
                [ {item.date} ]
              </div>
              <div className="flex items-center absolute left-[105px] -translate-y-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                  item.completed 
                    ? 'bg-primary-500 shadow-lg shadow-primary-500/30' 
                    : 'bg-primary-500/20 group-hover:bg-primary-500/40'
                }`}>
                  {item.completed ? (
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-primary-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  )}
                </div>
              </div>
              <div className="ml-16 pl-10 max-w-[650px] transition-all duration-300 group-hover:translate-x-1">
                <h3 className="text-xl font-semibold mb-2 flex items-center">
                  {item.title}
                  {item.completed && (
                    <span className="ml-2 text-xs bg-primary-500/20 text-primary-300 px-2 py-0.5 rounded-full">Completed</span>
                  )}
                </h3>
                <p className="text-gray-400 leading-relaxed">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Roadmap; 