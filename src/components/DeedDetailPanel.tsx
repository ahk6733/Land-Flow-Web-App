import React from 'react';
import { LandTransaction } from '../types';
import { toBengaliNumber } from '../data/defaultData';
import { LandPlot } from 'lucide-react';

interface DeedDetailPanelProps {
  transaction: LandTransaction;
  openAttachmentInNewTab?: (file: any) => void;
  handleShortcutSearch?: (type: string, value: string) => void;
}

export default function DeedDetailPanel({
  transaction: t
}: DeedDetailPanelProps) {
  // Flatten khatians and dags for the table
  const rows: {mouza: string, khatian: string, dag: string, amount: number}[] = [];
  
  t.khatians.forEach(k => {
    const kMouza = k.mouza || t.mouza || 'তথ্য নেই';
    
    const activeKLabels: string[] = [];
    if (k.hasCS && k.csKhatian) activeKLabels.push(`সি.এস: ${toBengaliNumber(k.csKhatian)}`);
    if (k.hasSA && k.saKhatian) activeKLabels.push(`এস.এ: ${toBengaliNumber(k.saKhatian)}`);
    if (k.hasRS && k.rsKhatian) activeKLabels.push(`আর.এস: ${toBengaliNumber(k.rsKhatian)}`);
    if (k.hasNamjari && k.namjariKhatian) activeKLabels.push(`নামজারী: ${toBengaliNumber(k.namjariKhatian)}`);
    
    if (activeKLabels.length === 0) {
      if (k.csKhatian) activeKLabels.push(`সি.এস: ${toBengaliNumber(k.csKhatian)}`);
      if (k.saKhatian) activeKLabels.push(`এস.এ: ${toBengaliNumber(k.saKhatian)}`);
      if (k.rsKhatian) activeKLabels.push(`আর.এস: ${toBengaliNumber(k.rsKhatian)}`);
      if (k.namjariKhatian) activeKLabels.push(`নামজারী: ${toBengaliNumber(k.namjariKhatian)}`);
    }
    
    const khatianText = activeKLabels.length > 0 ? activeKLabels.join(', ') : 'তথ্য নেই';

    if (k.dags && k.dags.length > 0) {
      k.dags.forEach(d => {
        const activeDLabels: string[] = [];
        if (d.hasCS && d.csDag) activeDLabels.push(`সি.এস: ${toBengaliNumber(d.csDag)}`);
        if (d.hasSA && d.saDag) activeDLabels.push(`এস.এ: ${toBengaliNumber(d.saDag)}`);
        if (d.hasRS && d.rsDag) activeDLabels.push(`আর.এস: ${toBengaliNumber(d.rsDag)}`);
        
        if (activeDLabels.length === 0) {
          if (d.csDag) activeDLabels.push(`সি.এস: ${toBengaliNumber(d.csDag)}`);
          if (d.saDag) activeDLabels.push(`এস.এ: ${toBengaliNumber(d.saDag)}`);
          if (d.rsDag) activeDLabels.push(`আর.এস: ${toBengaliNumber(d.rsDag)}`);
        }
        
        const dagText = activeDLabels.length > 0 ? activeDLabels.join(', ') : 'তথ্য নেই';
        
        rows.push({
          mouza: kMouza,
          khatian: khatianText,
          dag: dagText,
          amount: d.amount
        });
      });
    } else {
      rows.push({
        mouza: kMouza,
        khatian: khatianText,
        dag: 'কোনো দাগ নেই',
        amount: 0
      });
    }
  });

  return (
    <div className="ml-10 px-6 py-5 bg-ice-tint/30 rounded-xl border border-border-subtle shadow-sm animate-in fade-in duration-300">
      <div className="flex items-center gap-2 text-slate-700 font-bold mb-4 pb-2 border-b border-border-subtle">
        <LandPlot size={16} className="text-slate-teal" />
        <span>জমির বিস্তারিত বিবরণী</span>
      </div>
      
      <div className="overflow-x-auto bg-white rounded-lg border border-border-subtle custom-shadow">
        <table className="min-w-full text-center text-sm">
          <thead>
            <tr className="bg-slate-50 text-slate-600 font-bold text-[11px] uppercase tracking-wider border-b border-border-subtle">
              <th className="py-3 px-4 font-bold border-r border-border-subtle/50">মৌজা</th>
              <th className="py-3 px-4 font-bold border-r border-border-subtle/50">খতিয়ান</th>
              <th className="py-3 px-4 font-bold border-r border-border-subtle/50">দাগ</th>
              <th className="py-3 px-4 font-bold">পরিমান (শতক)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle/50">
            {rows.map((r, i) => (
              <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                <td className="py-3 px-4 text-[13px] text-slate-700 font-semibold border-r border-border-subtle/50">{r.mouza}</td>
                <td className="py-3 px-4 text-[13px] text-slate-700 border-r border-border-subtle/50">{r.khatian}</td>
                <td className="py-3 px-4 text-[13px] text-slate-700 font-medium border-r border-border-subtle/50">{r.dag}</td>
                <td className="py-3 px-4 text-[13px] text-slate-900 font-black font-mono">{toBengaliNumber(r.amount)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-text-muted text-sm italic">
                  কোনো জমির তথ্য পাওয়া যায়নি
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
