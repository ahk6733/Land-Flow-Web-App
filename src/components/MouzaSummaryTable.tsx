import React, { useMemo } from 'react';
import { LandTransaction } from '../types';
import { toBengaliNumber } from '../data/defaultData';
import { MapPin } from 'lucide-react';

interface MouzaSummaryTableProps {
  title: string;
  transactions: LandTransaction[];
  selectedMouza: string | null;
  onSelectMouza: (mouza: string) => void;
  onClearFilter: () => void;
  type: 'purchase' | 'sale';
}

export default function MouzaSummaryTable({
  title,
  transactions,
  selectedMouza,
  onSelectMouza,
  onClearFilter,
  type
}: MouzaSummaryTableProps) {
  
  const summaries = useMemo(() => {
    const mouzaMap = new Map<string, {
      totalLand: number;
      deedsCount: number;
      khatianSet: Set<string>;
      dagSet: Set<string>;
    }>();

    transactions.forEach(t => {
      const m = t.mouza || 'অজানা মৌজা';
      if (!mouzaMap.has(m)) {
        mouzaMap.set(m, {
          totalLand: 0,
          deedsCount: 0,
          khatianSet: new Set(),
          dagSet: new Set()
        });
      }
      
      const s = mouzaMap.get(m)!;
      s.totalLand += (t.totalLandAmount || 0);
      s.deedsCount += 1;

      // unique khatians and dags
      t.khatians?.forEach(k => {
        if (k.hasCS && k.csKhatian) s.khatianSet.add(`CS-${k.csKhatian}`);
        if (k.hasSA && k.saKhatian) s.khatianSet.add(`SA-${k.saKhatian}`);
        if (k.hasRS && k.rsKhatian) s.khatianSet.add(`RS-${k.rsKhatian}`);
        if (k.hasNamjari && k.namjariKhatian) s.khatianSet.add(`NAM-${k.namjariKhatian}`);

        k.dags?.forEach(d => {
          if (d.hasCS && d.csDag) s.dagSet.add(`CS-${d.csDag}`);
          if (d.hasSA && d.saDag) s.dagSet.add(`SA-${d.saDag}`);
          if (d.hasRS && d.rsDag) s.dagSet.add(`RS-${d.rsDag}`);
        });
      });
    });

    return Array.from(mouzaMap.entries()).map(([mouza, data]) => ({
      mouza,
      totalLand: data.totalLand,
      totalDeeds: data.deedsCount,
      totalKhatians: data.khatianSet.size,
      totalDags: data.dagSet.size
    })).sort((a, b) => b.totalLand - a.totalLand); // sort by land amount descending
  }, [transactions]);

  if (summaries.length === 0) return null;

  const totalMouzas = summaries.length;
  const totalAllDeeds = summaries.reduce((sum, s) => sum + s.totalDeeds, 0);
  const totalAllLand = summaries.reduce((sum, s) => sum + s.totalLand, 0);

  const themeColors = type === 'purchase' 
    ? {
        bg: 'bg-emerald-50',
        text: 'text-emerald-800',
        border: 'border-emerald-200',
        active: 'bg-emerald-100',
        icon: 'text-emerald-600',
      }
    : {
        bg: 'bg-alert-peach',
        text: 'text-rose-800',
        border: 'border-rose-200',
        active: 'bg-rose-100',
        icon: 'text-rose-700',
      };

  return (
    <div className="bg-white rounded-[20px] border border-border-subtle custom-shadow overflow-hidden mb-6 mt-6">
      <div className="p-4 border-b border-border-subtle flex flex-wrap items-center justify-between gap-4 bg-ice-tint/50">
        <div className="flex items-center gap-2">
          <MapPin className={themeColors.icon} size={18} />
          <h3 className="text-text-primary font-bold text-sm">{title}</h3>
        </div>
        <div className="text-[11px] font-bold text-text-muted bg-white px-3 py-1.5 rounded-lg border border-border-subtle custom-shadow flex gap-3">
          <span>মোট: <strong className="text-text-primary">{toBengaliNumber(totalMouzas)}টি মৌজা</strong></span>
          <span className="border-l border-slate-300 pl-3"><strong className="text-text-primary">{toBengaliNumber(totalAllDeeds)}টি দলিল</strong></span>
          <span className="border-l border-slate-300 pl-3"><strong className="text-text-primary">{toBengaliNumber(totalAllLand.toFixed(2))} শতক</strong></span>
        </div>
      </div>

      <div className="overflow-x-auto font-sans max-h-[300px] overflow-y-auto custom-scrollbar">
        <table className="w-full text-left border-collapse text-[10pt]">
          <thead className="sticky top-0 z-10 bg-white">
            <tr className={`${themeColors.bg} border-b ${themeColors.border} ${themeColors.text} font-bold custom-shadow`}>
              <th className="py-2 px-4 text-left">মৌজার নাম</th>
              <th className="py-2 px-4 text-center">মোট জমি (শতক)</th>
              <th className="py-2 px-4 text-center">মোট দলিল</th>
              <th className="py-2 px-4 text-center">মোট খতিয়ান</th>
              <th className="py-2 px-4 text-center">মোট দাগ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {summaries.map((s, idx) => {
              const isSelected = selectedMouza === s.mouza;
              return (
                <tr 
                  key={idx} 
                  onClick={() => isSelected ? onClearFilter() : onSelectMouza(s.mouza)}
                  className={`cursor-pointer transition-colors ${isSelected ? themeColors.active : 'hover:bg-ice-tint'}`}
                  title={isSelected ? "ফিল্টার মুছুন" : "এই মৌজার দলিলগুলো দেখতে ক্লিক করুন"}
                >
                  <td className="py-2 px-4 font-bold text-text-primary flex items-center gap-2">
                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-current text-slate-teal block shrink-0"></span>}
                    {s.mouza}
                  </td>
                  <td className="py-2 px-4 text-center font-mono font-bold text-slate-700">{toBengaliNumber(s.totalLand.toFixed(2))}</td>
                  <td className="py-2 px-4 text-center font-mono">{toBengaliNumber(s.totalDeeds)}</td>
                  <td className="py-2 px-4 text-center font-mono">{toBengaliNumber(s.totalKhatians)}</td>
                  <td className="py-2 px-4 text-center font-mono">{toBengaliNumber(s.totalDags)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
