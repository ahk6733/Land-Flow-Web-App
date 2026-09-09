import React, { useState } from 'react';
import { LandTransaction } from '../types';
import { analyzeLandData } from '../utils/landAnalyzer';
import { toBengaliNumber } from '../data/defaultData';
import { 
  Plus, MoreHorizontal, Search, Filter, ArrowUpDown, Edit2, Trash2, MoreVertical, ChevronRight, Tag, Receipt, Wallet, Building, ExternalLink, BarChart3, PlusCircle, MinusCircle
} from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';

interface DashboardProps {
  transactions: LandTransaction[];
  onNavigateToTab: (tab: string) => void;
  onSetSearchQuery: (query: { khatian?: string; dag?: string }) => void;
  onEditTransaction: (tx: LandTransaction) => void;
  onDeleteTransaction: (id: string) => void;
  onPrintTransaction: (tx: LandTransaction) => void;
  onHighlightTransaction: (id: string) => void;
  onAddPurchase: () => void;
  onAddSale: () => void;
}

export default function Dashboard({
  transactions,
  onNavigateToTab,
  onSetSearchQuery,
  onEditTransaction,
  onDeleteTransaction,
  onPrintTransaction,
  onHighlightTransaction,
  onAddPurchase,
  onAddSale
}: DashboardProps) {
  const analysis = analyzeLandData(transactions);
  
  // Calculate top summary stats
  const totalPurchase = transactions.filter(t => t.type === 'purchase').reduce((sum, t) => sum + t.transactionAmount, 0);
  const totalSale = transactions.filter(t => t.type === 'sale').reduce((sum, t) => sum + t.transactionAmount, 0);
  const remaining = totalPurchase - totalSale;
  
  const [chartTimeFilter, setChartTimeFilter] = useState('6M');

  // Bar Chart Data (Sales & Purchases by mouza)
  const chartTransactions = transactions.filter(t => {
    if (chartTimeFilter === 'ALL') return true;
    if (!t.date) return true;
    const tDate = new Date(t.date);
    const cutoff = new Date();
    if (chartTimeFilter === '1M') cutoff.setMonth(cutoff.getMonth() - 1);
    else if (chartTimeFilter === '3M') cutoff.setMonth(cutoff.getMonth() - 3);
    else if (chartTimeFilter === '6M') cutoff.setMonth(cutoff.getMonth() - 6);
    else if (chartTimeFilter === '1Y') cutoff.setFullYear(cutoff.getFullYear() - 1);
    return tDate >= cutoff;
  });

  const mouzaMap: Record<string, { name: string, Purchases: number, Sales: number }> = {};
  chartTransactions.forEach(t => {
    const m = t.mouza || 'অজানা';
    if (!mouzaMap[m]) mouzaMap[m] = { name: m, Purchases: 0, Sales: 0 };
    if (t.type === 'purchase') mouzaMap[m].Purchases += t.transactionAmount;
    if (t.type === 'sale') mouzaMap[m].Sales += t.transactionAmount;
  });
  const finalBarData = Object.values(mouzaMap);

  // Pie Chart Data (Land Types or Khatian Types)
  const pieData = [
    { name: 'Purchase', value: totalPurchase, color: '#a855f7' },
    { name: 'Sale', value: totalSale, color: '#ff5b5b' },
  ];

  const pieColors = ['#a855f7', '#ff5b5b', '#3b82f6', '#10b981'];

  return (
    <div className="space-y-6 font-sans text-slate-800 animate-in fade-in duration-300 pb-12">
      
      {/* Header section */}
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-[22px] font-semibold text-slate-700 tracking-tight">Dashboard Overview</h1>
        
        {/* ACTION BUTTONS */}
        <div className="flex gap-2">
          <button
            onClick={onAddPurchase}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 active:scale-95 transition-all rounded-lg shadow-sm cursor-pointer select-none"
          >
            <PlusCircle size={14} />
            জমি ক্রয়
          </button>
          <button
            onClick={onAddSale}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 transition-all rounded-lg shadow-sm cursor-pointer select-none"
          >
            <MinusCircle size={14} />
            জমি বিক্রয়
          </button>
        </div>
      </div>

      {/* Top 4 Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        {/* Card 1: Total Purchased Land */}
        <div className="bg-white rounded-xl md:rounded-2xl p-3 md:p-6 shadow-sm border border-slate-100 flex flex-col relative overflow-hidden group">
          <Receipt className="w-20 h-20 md:w-32 md:h-32 absolute -right-4 -bottom-4 md:-right-6 md:-bottom-6 text-purple-600 opacity-[0.06] group-hover:scale-110 transition-transform duration-500 pointer-events-none" strokeWidth={1} />
          <div className="relative z-10">
            <div className="w-8 h-8 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-purple-100 flex items-center justify-center text-purple-600 mb-2 md:mb-4">
              <Receipt className="w-4 h-4 md:w-6 md:h-6" />
            </div>
            <p className="text-slate-500 text-[10px] md:text-sm font-medium">মোট ক্রয়কৃত জমি</p>
            <h2 className="text-lg md:text-2xl font-bold text-purple-600 mt-1">{toBengaliNumber(totalPurchase.toFixed(0))} <span className="text-[10px] md:text-sm font-normal text-slate-500">শতক</span></h2>
            <div className="flex items-center gap-1 md:gap-2 mt-2 md:mt-4 text-[9px] md:text-xs font-semibold text-teal-500">
              <span>~ 8%</span> <span className="text-slate-400 font-medium">গত মাসের তুলনায়</span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Sold Land */}
        <div className="bg-white rounded-xl md:rounded-2xl p-3 md:p-6 shadow-sm border border-slate-100 flex flex-col relative overflow-hidden group">
          <Tag className="w-20 h-20 md:w-32 md:h-32 absolute -right-4 -bottom-4 md:-right-6 md:-bottom-6 text-rose-600 opacity-[0.06] group-hover:scale-110 transition-transform duration-500 pointer-events-none" strokeWidth={1} />
          <div className="relative z-10">
            <div className="w-8 h-8 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600 mb-2 md:mb-4">
              <Tag className="w-4 h-4 md:w-6 md:h-6" />
            </div>
            <p className="text-slate-500 text-[10px] md:text-sm font-medium">মোট বিক্রীত জমি</p>
            <h2 className="text-lg md:text-2xl font-bold text-rose-600 mt-1">{toBengaliNumber(totalSale.toFixed(0))} <span className="text-[10px] md:text-sm font-normal text-slate-500">শতক</span></h2>
            <div className="flex items-center gap-1 md:gap-2 mt-2 md:mt-4 text-[9px] md:text-xs font-semibold text-teal-500">
              <span>~ 20%</span> <span className="text-slate-400 font-medium whitespace-nowrap">গত মাসের তুলনায়</span>
            </div>
          </div>
        </div>

        {/* Card 3: Remaining Land */}
        <div className="bg-white rounded-xl md:rounded-2xl p-3 md:p-6 shadow-sm border border-slate-100 flex flex-col relative overflow-hidden group">
          <Wallet className="w-20 h-20 md:w-32 md:h-32 absolute -right-4 -bottom-4 md:-right-6 md:-bottom-6 text-emerald-600 opacity-[0.06] group-hover:scale-110 transition-transform duration-500 pointer-events-none" strokeWidth={1} />
          <div className="relative z-10">
            <div className="w-8 h-8 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 mb-2 md:mb-4">
              <Wallet className="w-4 h-4 md:w-6 md:h-6" />
            </div>
            <p className="text-slate-500 text-[10px] md:text-sm font-medium">অবশিষ্ট জমি</p>
            <h2 className="text-lg md:text-2xl font-bold text-emerald-600 mt-1">{toBengaliNumber(remaining.toFixed(0))} <span className="text-[10px] md:text-sm font-normal text-slate-500">শতক</span></h2>
            <div className="flex items-center gap-1 md:gap-2 mt-2 md:mt-4 text-[9px] md:text-xs font-semibold text-teal-500">
              <span>~ 32%</span> <span className="text-slate-400 font-medium whitespace-nowrap">গত মাসের তুলনায়</span>
            </div>
          </div>
        </div>

        {/* Card 4: Total Transactions */}
        <div className="bg-white rounded-xl md:rounded-2xl p-3 md:p-6 shadow-sm border border-slate-100 flex flex-col relative overflow-hidden group">
          <Building className="w-20 h-20 md:w-32 md:h-32 absolute -right-4 -bottom-4 md:-right-6 md:-bottom-6 text-blue-600 opacity-[0.06] group-hover:scale-110 transition-transform duration-500 pointer-events-none" strokeWidth={1} />
          <div className="relative z-10">
            <div className="w-8 h-8 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 mb-2 md:mb-4">
              <Building className="w-4 h-4 md:w-6 md:h-6" />
            </div>
            <p className="text-slate-500 text-[10px] md:text-sm font-medium">মোট লেনদেন</p>
            <h2 className="text-lg md:text-2xl font-bold text-slate-800 mt-1">{toBengaliNumber(transactions.length)} <span className="text-[10px] md:text-sm font-normal text-slate-500">টি</span></h2>
            <div className="flex items-center gap-1 md:gap-2 mt-2 md:mt-4 text-[8px] md:text-xs font-semibold text-slate-600 leading-tight">
              <span>(ক্রয় {toBengaliNumber(transactions.filter(t => t.type === 'purchase').length)}টি, <br className="md:hidden" />বিক্রয় {toBengaliNumber(transactions.filter(t => t.type === 'sale').length)}টি)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Bar Chart (Sales & Purchases) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col">
          <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-slate-800 text-lg">Sales & Purchases</h3>
              <select 
                value={chartTimeFilter}
                onChange={(e) => setChartTimeFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 cursor-pointer font-medium outline-none focus:border-teal-500 appearance-none pr-8 relative bg-no-repeat bg-[right_0.5rem_center] bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2214%22%20height%3D%2214%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23475569%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')]"
              >
                <option value="1M">1 Month</option>
                <option value="3M">3 Months</option>
                <option value="6M">6 Months</option>
                <option value="1Y">1 Year</option>
                <option value="ALL">All Time</option>
              </select>
            </div>
            <div className="flex-1 min-h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={finalBarData} margin={{ top: 25, right: 10, left: 10, bottom: 0 }} barGap={8}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                <YAxis hide={true} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ff7a7a" stopOpacity={1} />
                    <stop offset="100%" stopColor="#ff3a3a" stopOpacity={1} />
                  </linearGradient>
                  <linearGradient id="colorPurchases" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#c084fc" stopOpacity={1} />
                    <stop offset="100%" stopColor="#9333ea" stopOpacity={1} />
                  </linearGradient>
                </defs>
                <Bar dataKey="Sales" fill="url(#colorSales)" radius={[4, 4, 0, 0]} barSize={24} label={{ position: 'top', fill: '#ff5b5b', fontSize: 12, fontWeight: 600, formatter: (val: number) => val > 0 ? toBengaliNumber(val) : '' }} />
                <Bar dataKey="Purchases" fill="url(#colorPurchases)" radius={[4, 4, 0, 0]} barSize={24} label={{ position: 'top', fill: '#a855f7', fontSize: 12, fontWeight: 600, formatter: (val: number) => val > 0 ? toBengaliNumber(val) : '' }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart (Devices/Types) */}
        <div className="hidden md:flex bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex-col">
          <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-slate-800 text-lg">Transaction Types</h3>
            </div>
            <div className="flex-1 min-h-[200px] w-full flex flex-col items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                  label={({ cx, cy, midAngle, innerRadius, outerRadius, value, index }) => {
                    if (value === 0) return null;
                    const RADIAN = Math.PI / 180;
                    const radius = outerRadius + 20;
                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                    const y = cy + radius * Math.sin(-midAngle * RADIAN);
                    return (
                      <text x={x} y={y} fill={pieColors[index % pieColors.length]} textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={14} fontWeight="bold">
                        {toBengaliNumber(value)} শতক
                      </text>
                    );
                  }}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
            {/* Legend placed at bottom */}
            <div className="flex justify-center gap-6 mt-4 w-full">
              {pieData.map((entry, index) => (
                <div key={index} className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                  <div className="w-3 h-2 rounded-full" style={{ backgroundColor: pieColors[index % pieColors.length] }}></div>
                  {entry.name}
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Recent Records Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
        <div className="p-6 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 text-lg">Recent Records</h3>
          <div className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 cursor-pointer flex items-center gap-2 font-medium">
            Latest <ChevronRight size={14} className="rotate-90" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="text-slate-400 font-medium border-y border-slate-100 text-xs bg-slate-50/50">
                <th className="py-3 px-6">সিরিয়াল নাম্বার</th>
                <th className="py-3 px-6">ক্রেতা</th>
                <th className="py-3 px-6">বিক্রেতা</th>
                <th className="py-3 px-6">দলিল নাম্বার</th>
                <th className="py-3 px-6">তারিখ</th>
                <th className="py-3 px-6">দলিলের প্রকৃতি</th>
                <th className="py-3 px-6">মৌজার নাম</th>
                <th className="py-3 px-6">হস্তান্তরিত পরিমান</th>
                <th className="py-3 px-6">ধরণ</th>
                <th className="py-3 px-6 text-center">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {transactions.slice(0, 5).map((t, idx) => (
                <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-6 text-slate-500 font-medium text-xs text-center">{toBengaliNumber(idx + 1)}</td>
                  <td className="py-4 px-6 text-slate-700 font-medium text-sm">{t.buyerName}</td>
                  <td className="py-4 px-6 text-slate-700 font-medium text-sm">{t.sellerName}</td>
                  <td className="py-4 px-6 text-slate-800 font-bold text-sm">{toBengaliNumber(t.deedNumber)}</td>
                  <td className="py-4 px-6 text-slate-500 text-xs">{toBengaliNumber(t.date)}</td>
                  <td className="py-4 px-6 text-slate-600 font-medium text-xs">{t.deedNature || '-'}</td>
                  <td className="py-4 px-6 text-slate-700 font-semibold text-sm">{t.mouza}</td>
                  <td className="py-4 px-6 font-bold text-slate-800">{toBengaliNumber(t.transactionAmount)} <span className="text-[10px] text-slate-400 font-normal">শতক</span></td>
                  <td className="py-4 px-6">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${t.type === 'purchase' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                      {t.type === 'purchase' ? 'ক্রয়' : 'বিক্রয়'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <button 
                      onClick={() => {
                        onHighlightTransaction(t.id);
                        onNavigateToTab(t.type);
                        setTimeout(() => {
                          const el = document.getElementById(`tx-${t.id}`);
                          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }, 100);
                      }}
                      className="text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer p-1.5 hover:bg-indigo-50 rounded-lg"
                      title="বিস্তারিত দেখুন"
                    >
                      <ExternalLink size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 text-sm">
                    কোনো ডাটা পাওয়া যায়নি
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
}
