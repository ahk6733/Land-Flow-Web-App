import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Bell, ArrowLeft, Building2, User, LogOut, MapPin, Sparkles, RefreshCw, Trash2 } from 'lucide-react';

interface TopHeaderProps {
  currentUser: any;
  onLogout: () => void;
  canGoBack: boolean;
  onGoBack: () => void;
  onProfileClick?: () => void;
  onSync?: () => void;
  isSyncing?: boolean;
  onTrashClick?: () => void;
  onHomeClick?: () => void;
}

export default function TopHeader({ currentUser, onLogout, canGoBack, onGoBack, onProfileClick, onSync, isSyncing = false, onTrashClick, onHomeClick }: TopHeaderProps) {
  const isCompany = currentUser?.userType === 'company';
  const headerTitle = isCompany && currentUser?.companyName 
    ? currentUser.companyName 
    : 'Land Buy Sell Management system';
  const mobileHeaderTitle = isCompany && currentUser?.companyName 
    ? currentUser.companyName 
    : 'Land Buy Sell MS';

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="print:hidden h-16 md:h-20 bg-white/80 backdrop-blur-md shadow-sm px-4 md:px-8 flex items-center justify-between sticky top-0 z-10 border-b border-slate-200/60">
      <div className="flex-1 max-w-xl flex items-center gap-4">
        {canGoBack && (
          <button 
            onClick={onGoBack}
            className="p-2.5 rounded-full bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition cursor-pointer shadow-sm shrink-0"
            title="পূর্বের পেজে ফিরে যান"
          >
            <ArrowLeft size={18} />
          </button>
        )}
        <div className="flex items-center gap-3 group cursor-pointer" onClick={onHomeClick}>
          {isCompany ? (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-200 shrink-0 transform group-hover:scale-105 transition-transform duration-300">
              <Building2 size={20} />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-200 shrink-0 transform group-hover:scale-105 group-hover:rotate-3 transition-all duration-300">
              <MapPin size={20} />
            </div>
          )}
          <div className="flex flex-col">
            <h2 className="text-lg md:text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 tracking-tight flex items-center gap-2 leading-tight">
              <span className="hidden md:inline">{headerTitle}</span>
              <span className="md:hidden">{mobileHeaderTitle}</span>
              {!isCompany && <Sparkles size={16} className="text-amber-500 animate-pulse hidden sm:block" />}
            </h2>
            <span className="text-[8px] md:text-[10px] font-bold tracking-widest text-slate-400 uppercase -mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px] md:max-w-none">
              {isCompany ? 'Corporate Dashboard' : 'Smart Property Ledger'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-6">
        <div className="flex items-center gap-2 md:gap-4">
          <button 
            onClick={onSync}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-2 py-1.5 md:px-3 rounded-full bg-emerald-50 shadow-sm text-xs font-bold text-emerald-600 hover:bg-emerald-100 transition border border-emerald-200 disabled:opacity-50"
            title="সিঙ্ক করুন"
          >
            <RefreshCw size={14} className={`text-emerald-600 ${isSyncing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isSyncing ? 'সিঙ্কিং...' : 'সিঙ্ক করুন'}</span>
          </button>
          
          <button 
            onClick={onTrashClick}
            className="flex items-center gap-1.5 px-2 py-1.5 md:px-3 rounded-full bg-rose-50 shadow-sm text-xs font-bold text-rose-600 hover:bg-rose-100 transition border border-rose-200"
            title="ট্রাশ"
          >
            <Trash2 size={14} className="text-rose-600" />
            <span className="hidden sm:inline">ট্রাশ</span>
          </button>
          

        </div>

        <div className="h-8 w-px bg-slate-200"></div>

        <div className="relative" ref={profileMenuRef}>
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
          >
            <div className="w-10 h-10 rounded-full bg-indigo-50 border-2 border-indigo-100 shadow-sm overflow-hidden flex items-center justify-center shrink-0">
              {currentUser?.profileImage ? (
                <img src={currentUser.profileImage} alt={currentUser.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-indigo-600 font-bold text-lg">
                  {currentUser?.name?.charAt(0) || 'U'}
                </span>
              )}
            </div>
            <div className="hidden md:block">
              <div className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition">
                {currentUser?.name || 'User'}
              </div>
              <div className="text-[10px] text-slate-500 font-medium">
                {currentUser?.email || 'user@example.com'}
              </div>
            </div>
            <ChevronDown size={14} className={`text-slate-400 group-hover:text-indigo-600 ml-1 transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
          </div>

          {/* Profile Dropdown Menu */}
          {isProfileMenuOpen && (
            <div className="absolute right-0 mt-3 w-48 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-2">
                <button
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    if (onProfileClick) onProfileClick();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                >
                  <User size={16} />
                  <span className="font-medium">প্রোফাইল</span>
                </button>
                <div className="h-px bg-slate-100 my-1"></div>
                <button
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <LogOut size={16} />
                  <span className="font-medium">লগআউট</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
