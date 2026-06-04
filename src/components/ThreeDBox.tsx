import React from 'react';
import { motion } from 'motion/react';

interface ThreeDBoxProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  themeColor?: 'google' | 'blue' | 'red' | 'yellow' | 'green' | 'indigo' | 'slate';
  animated?: boolean;
  key?: React.Key;
}

export default function ThreeDBox({
  children,
  className = '',
  themeColor = 'google',
  animated = true,
  ...rest
}: ThreeDBoxProps) {
  // Configured with Google colors from Bento Grid design specification
  const googleColors = {
    blue: '#4285F4',
    red: '#EA4335',
    yellow: '#FBBC05',
    green: '#34A853',
    indigo: '#6366F1',
    slate: '#64748B'
  };

  const getBentoStyleClass = () => {
    switch (themeColor) {
      case 'blue': 
        return 'border-2 border-[#4285F4] bg-white rounded-3xl shadow-md ring-4 ring-[#4285F4]/5';
      case 'red': 
        return 'border-2 border-[#EA4335] bg-white rounded-3xl shadow-md ring-4 ring-[#EA4335]/5';
      case 'yellow': 
        return 'border-2 border-[#FBBC05] bg-white rounded-3xl shadow-md ring-4 ring-[#FBBC05]/5';
      case 'green': 
        return 'border-2 border-[#34A853] bg-white rounded-3xl shadow-md ring-4 ring-[#34A853]/5';
      case 'indigo': 
        return 'border-2 border-indigo-500 bg-white rounded-3xl shadow-md ring-4 ring-indigo-500/5';
      case 'slate': 
        return 'border border-slate-200 bg-white rounded-3xl shadow-sm hover:border-slate-350';
      default: 
        return 'border border-slate-200/80 bg-white rounded-3xl shadow-sm';
    }
  };

  return (
    <motion.div
      {...rest}
      initial={animated ? { opacity: 0, y: 15 } : false}
      animate={animated ? { opacity: 1, y: 0 } : false}
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 280, damping: 22 }}
      className={`relative overflow-hidden transition-all duration-300 ${getBentoStyleClass()} ${className}`}
    >
      {/* Dynamic Animated multi-color top header bar for general brand items */}
      {themeColor === 'google' && (
        <div className="absolute top-0 left-0 w-full h-[5px] flex">
          <div className="flex-1 h-full bg-[#4285F4]" />
          <div className="flex-1 h-full bg-[#EA4335]" />
          <div className="flex-1 h-full bg-[#FBBC05]" />
          <div className="flex-1 h-full bg-[#34A853]" />
        </div>
      )}

      {/* Embedded top marker for other styles */}
      {themeColor !== 'google' && themeColor !== 'slate' && (
        <div 
          className="absolute top-0 left-0 w-full h-[5px] rounded-t-full"
          style={{
            backgroundColor: 
              themeColor === 'blue' ? googleColors.blue :
              themeColor === 'red' ? googleColors.red :
              themeColor === 'yellow' ? googleColors.yellow :
              themeColor === 'green' ? googleColors.green :
              themeColor === 'indigo' ? googleColors.indigo : undefined
          }}
        />
      )}

      {/* Subtle background decoration blob */}
      <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-slate-50 rounded-full -z-10 opacity-30 pointer-events-none" />

      {/* Main card content */}
      <div className="p-6 h-full flex flex-col justify-between">
        {children}
      </div>
    </motion.div>
  );
}

