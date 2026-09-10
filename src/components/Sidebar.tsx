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
    <aside className={`z-50 flex flex-row h-16 w-full md:w-auto md:h-full md:relative md:flex-col ${isExpanded ? 'md:w-64' : 'md:w-20'} print:hidden bg-slate-teal transition-all duration-300 overflow-hidden shrink-0`}>
      <div className={`hidden md:flex p-4 items-center ${isExpanded ? 'justify-between' : 'justify-center flex-col gap-4 mt-2'}`}>
        {isExpanded && (
          <div className="flex items-center gap-3 overflow-hidden group">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-lg shrink-0 transform group-hover:-rotate-6 transition-all duration-300 overflow-hidden">
              <img src="./landflow-logo.png" alt="LandFlow Logo" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-2xl font-black tracking-tight whitespace-nowrap">
              <span className="text-white">Land</span>
              <span className="text-purple-400">Flow</span>
            </h1>
          </div>
        )}
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white/75 hover:text-white transition-colors shrink-0"
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
              className={`cursor-pointer max-md:flex-1 w-full flex flex-col md:flex-row items-center justify-center ${
                isExpanded 
                  ? 'md:justify-start md:px-4 md:py-3' 
                  : 'md:justify-center md:w-12 md:h-12 md:mx-auto md:p-0'
              } rounded-xl text-sm font-bold transition-all duration-300 relative ${
                isActive 
                  ? 'bg-main-bg text-slate-teal shadow-md' 
                  : 'text-white/75 hover:bg-white/10 hover:text-white'
              } py-2`}
              title={item.label}
            >
              <div className={`flex flex-col md:flex-row items-center ${isExpanded ? 'gap-1 md:gap-3' : 'justify-center'} w-full md:w-auto relative z-10`}>
                <Icon size={24} className={`shrink-0 ${isActive ? 'text-slate-teal' : 'text-white/75'}`} />
                <span className={`hidden md:text-sm whitespace-nowrap ${isExpanded ? 'md:block' : 'md:hidden'}`}>{item.label}</span>
              </div>
              <span className={`hidden ml-auto text-[10px] ${isActive ? 'text-slate-teal' : 'text-white/40'} ${isExpanded ? 'md:block relative z-10' : 'md:hidden'}`}>
                ❯
              </span>
            </button>
          );
        })}
      </nav>

      {/* App Developer Section */}
      <div className="hidden md:block p-4 border-t border-white/10 mt-auto">
        <div className={`flex items-center ${isExpanded ? 'gap-3 px-1' : 'justify-center'} `}>
          <div className="w-10 h-10 rounded-full border-2 border-white/20 overflow-hidden shrink-0 bg-slate-teal">
            <img src="./developer.png" alt="AHK" className="w-full h-full object-cover" />
          </div>
          {isExpanded && (
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-bold text-white/90 truncate tracking-wide">Develop By AHK</p>
              <p className="text-[10px] font-medium text-ice-blue/80 truncate tracking-wider mt-0.5">Powered By AHK Multizone</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
