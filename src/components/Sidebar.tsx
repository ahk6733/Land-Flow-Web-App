import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Tag, 
  Search, 
  ClipboardList, 
  Users, 
  Settings,
  Building2,
  ShieldCheck,
  UserCheck,
  Menu,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: any;
}

export default function Sidebar({ activeTab, setActiveTab, currentUser }: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'purchase', label: 'Land Purchases', icon: ShoppingBag },
    { id: 'sale', label: 'Land Sales', icon: Tag },
    { id: 'search', label: 'Search Records', icon: Search },
    { id: 'order', label: 'Order', icon: ClipboardList },
    { id: 'customers', label: 'Customer List', icon: Users },
  ];

  if (currentUser?.isAdmin || currentUser?.userType === 'admin') {
    menuItems.push({ id: 'appUsers', label: 'App User', icon: UserCheck });
  }

  menuItems.push({ id: 'profile', label: 'Profile & Settings', icon: Settings });

  return (
    <aside className={`z-50 flex flex-row h-16 w-full md:w-auto md:h-full md:relative md:flex-col ${isExpanded ? 'md:w-64' : 'md:w-20'} print:hidden bg-[var(--color-sidebar-bg)] transition-all duration-300 overflow-hidden border-t md:border-t-0 md:border-r border-slate-800 shrink-0`}>
      <div className={`hidden md:flex p-4 items-center ${isExpanded ? 'justify-between' : 'justify-center flex-col gap-4 mt-2'}`}>
        {isExpanded && (
          <div className="flex items-center gap-3 overflow-hidden group">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-lg shadow-emerald-500/30 shrink-0 transform group-hover:-rotate-6 transition-all duration-300 overflow-hidden border border-emerald-100">
              <img src="./landflow-logo.png" alt="LandFlow Logo" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-2xl font-black tracking-tight whitespace-nowrap">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-200">Land</span>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">Flow</span>
            </h1>
          </div>
        )}
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 bg-slate-800/50 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors shrink-0"
          title={isExpanded ? "কলাপ্স করুন" : "এক্সপান্ড করুন"}
        >
          <Menu size={20} />
        </button>
      </div>

      <nav className="flex flex-row justify-around md:justify-start w-full md:w-auto md:flex-1 md:flex-col px-1 md:px-3 space-x-0 md:space-y-2 overflow-x-auto md:overflow-y-auto mt-0 md:mt-4 scrollbar-hide items-center md:items-stretch py-1 md:py-0">
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`cursor-pointer max-md:flex-1 w-full flex flex-col md:flex-row items-center justify-center md:justify-start ${isExpanded ? 'md:px-4 md:py-3' : 'md:justify-center md:p-3'} md:rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive 
                  ? 'max-md:text-emerald-400 text-indigo-400 md:bg-[var(--color-sidebar-active)] md:text-white' 
                  : 'max-md:text-white text-slate-400 hover:bg-[var(--color-sidebar-hover)] hover:text-slate-200'
              } py-2 md:py-0`}
              title={item.label}
            >
              <div className="flex flex-col md:flex-row items-center gap-1 md:gap-3 w-full md:w-auto">
                <Icon size={24} className={`shrink-0 md:size-${isExpanded ? '18' : '22'} ${isActive ? 'max-md:text-emerald-400 text-indigo-400 md:text-white' : 'max-md:text-white text-slate-500'}`} />
                <span className={`hidden md:text-sm whitespace-nowrap ${isExpanded ? 'md:block' : 'md:hidden'}`}>{item.label}</span>
              </div>
              <span className={`hidden md:block ml-auto text-[10px] ${isActive ? 'text-indigo-400' : 'text-slate-600'} ${isExpanded ? 'block' : 'hidden'}`}>
                ❯
              </span>
            </button>
          );
        })}
      </nav>

      {/* App Developer Section */}
      <div className="hidden md:block p-4 border-t border-slate-800/50 mt-auto">
        <div className={`flex items-center ${isExpanded ? 'gap-3 px-1' : 'justify-center'} `}>
          <div className="w-10 h-10 rounded-full border-2 border-indigo-500/30 overflow-hidden shrink-0 bg-slate-800">
            <img src="./developer.png" alt="AHK" className="w-full h-full object-cover" />
          </div>
          {isExpanded && (
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-bold text-slate-300 truncate tracking-wide">Develop By AHK</p>
              <p className="text-[10px] font-medium text-indigo-400 truncate tracking-wider mt-0.5">Powered By AHK Multizone</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
