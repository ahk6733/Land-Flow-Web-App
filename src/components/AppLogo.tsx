import React from 'react';

interface AppLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  layout?: 'horizontal' | 'vertical';
  variant?: 'light' | 'dark';
}

export default function AppLogo({
  className = '',
  size = 'md',
  showText = true,
  layout = 'horizontal',
  variant = 'dark',
}: AppLogoProps) {
  const sizeClasses = {
    sm: { box: 'w-8 h-8', text: 'text-sm', sub: 'text-[9px]' },
    md: { box: 'w-12 h-12', text: 'text-lg', sub: 'text-[11px]' },
    lg: { box: 'w-16 h-16', text: 'text-2xl', sub: 'text-xs' },
    xl: { box: 'w-24 h-24', text: 'text-4xl', sub: 'text-sm' },
  };

  const textMainColor = variant === 'dark' ? 'text-white' : 'text-slate-900';
  const textSubColor = variant === 'dark' ? 'text-emerald-200/80' : 'text-slate-500';

  return (
    <div className={`inline-flex ${layout === 'vertical' ? 'flex-col text-center' : 'flex-row'} items-center gap-2.5 ${className}`}>
      {/* Custom Vector Land Map & Document Ledger Logo / Image */}
      <div className={`${sizeClasses[size].box} rounded-2xl bg-white shadow-lg shadow-indigo-500/20 flex items-center justify-center relative overflow-hidden shrink-0 border border-indigo-100/50`}>
        <img src="./landflow-logo.png" alt="LandFlow Logo" className="w-full h-full object-cover" />
      </div>

      {showText && (
        <div className="leading-tight text-left">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h1 className={`font-black tracking-tight ${sizeClasses[size].text}`}>
              <span className={`bg-clip-text text-transparent bg-gradient-to-r ${variant === 'dark' ? 'from-white to-slate-200' : 'from-slate-800 to-slate-600'}`}>Land</span>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">Flow</span>
              <span className={`ml-1.5 text-sm bg-clip-text text-transparent bg-gradient-to-r ${variant === 'dark' ? 'from-indigo-200 to-purple-200' : 'from-indigo-600 to-purple-600'}`}>
                by AHK Multizone
              </span>
            </h1>
          </div>
        </div>
      )}
    </div>
  );
}
