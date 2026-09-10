import React, { useState, useMemo } from 'react';
import { LandTransaction, GlobalFilterState } from '../types';
import { getAvailableFilterOptions } from '../utils/filterHelper';
import { Filter, X, Search, ChevronRight } from 'lucide-react';

interface GlobalFilterSlicerProps {
  transactions: LandTransaction[];
  filterState: GlobalFilterState;
  setFilterState: (filter: GlobalFilterState) => void;
}

const FilterGroup = ({ 
  title, 
  options, 
  selectedValue, 
  onSelect, 
  disabled 
}: { 
  title: string; 
  options: string[]; 
  selectedValue: string | null; 
  onSelect: (val: string) => void;
  disabled?: boolean;
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;
    return options.filter(o => o.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [options, searchTerm]);

  if (disabled) {
    return (
      <div className="flex-1 opacity-50 pointer-events-none">
        <h3 className="text-sm font-bold text-text-muted mb-2">{title}</h3>
        <div className="text-xs text-text-muted italic">আগের ফিল্টারটি নির্বাচন করুন</div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-w-[200px]">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold text-slate-700">{title}</h3>
        {options.length > 5 && (
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-text-muted" size={12} />
            <input 
              type="text" 
              placeholder="খুঁজুন..."
              className="pl-6 pr-2 py-1 text-xs border border-border-subtle rounded-md focus:outline-none focus:border-teal-400 w-24"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
        {filteredOptions.length === 0 ? (
          <div className="text-xs text-text-muted italic py-1">কোনো তথ্য পাওয়া যায়নি</div>
        ) : (
          filteredOptions.map(opt => (
            <button
              key={opt}
              onClick={() => onSelect(opt)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                selectedValue === opt 
                  ? 'bg-slate-teal border-teal-600 text-white custom-shadow' 
                  : 'bg-white border-border-subtle text-slate-teal hover:border-teal-300 hover:bg-mint-pill'
              }`}
            >
              {opt}
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default function GlobalFilterSlicer({ transactions, filterState, setFilterState }: GlobalFilterSlicerProps) {
  const { mouzas, khatians, dags } = useMemo(() => 
    getAvailableFilterOptions(transactions, filterState), 
  [transactions, filterState]);

  const hasAnyFilter = filterState.mouza || filterState.khatian || filterState.dag;

  const handleSelectMouza = (mouza: string) => {
    if (filterState.mouza === mouza) {
      setFilterState({ mouza: null, khatian: null, dag: null });
    } else {
      setFilterState({ mouza, khatian: null, dag: null });
    }
  };

  const handleSelectKhatian = (khatian: string) => {
    if (filterState.khatian === khatian) {
      setFilterState({ ...filterState, khatian: null, dag: null });
    } else {
      setFilterState({ ...filterState, khatian, dag: null });
    }
  };

  const handleSelectDag = (dag: string) => {
    if (filterState.dag === dag) {
      setFilterState({ ...filterState, dag: null });
    } else {
      setFilterState({ ...filterState, dag });
    }
  };

  return (
    <div className="bg-white rounded-[20px] border border-border-subtle p-4 custom-shadow mb-6">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-mint-pill text-slate-teal rounded-lg">
            <Filter size={18} />
          </div>
          <h2 className="font-bold text-text-primary text-sm">ফিল্টার করে নিদ্রিষ্ট তথ্য দেখুন</h2>
        </div>
        {hasAnyFilter && (
          <button
            onClick={() => setFilterState({ mouza: null, khatian: null, dag: null })}
            className="flex items-center gap-1.5 text-xs font-bold text-rose-700 hover:text-rose-700 bg-alert-peach hover:bg-rose-100 px-3 py-1.5 rounded-lg transition-colors"
          >
            <X size={14} />
            সব ফিল্টার মুছুন
          </button>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-4 md:gap-2 lg:gap-6 items-start">
        <FilterGroup 
          title="মৌজা নির্বাচন" 
          options={mouzas} 
          selectedValue={filterState.mouza} 
          onSelect={handleSelectMouza} 
        />
        
        <div className="hidden md:flex mt-8 text-slate-300 shrink-0">
          <ChevronRight size={20} />
        </div>

        <FilterGroup 
          title="খতিয়ান নির্বাচন" 
          options={khatians} 
          selectedValue={filterState.khatian} 
          onSelect={handleSelectKhatian} 
          disabled={!filterState.mouza}
        />

        <div className="hidden md:flex mt-8 text-slate-300 shrink-0">
          <ChevronRight size={20} />
        </div>

        <FilterGroup 
          title="দাগ নির্বাচন" 
          options={dags} 
          selectedValue={filterState.dag} 
          onSelect={handleSelectDag} 
          disabled={!filterState.khatian}
        />
      </div>
    </div>
  );
}
