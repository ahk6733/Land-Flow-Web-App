import React, { useState } from 'react';
import { Trash2, RefreshCcw, AlertTriangle, ArrowLeft, Search } from 'lucide-react';
import { LandTransaction } from '../types';
import { toBengaliNumber } from '../data/defaultData';

interface TrashTabProps {
  trashTransactions: LandTransaction[];
  onRestore: (tx: LandTransaction) => void;
  onDeletePermanently: (txId: string) => void;
  onEmptyTrash: () => void;
}

export default function TrashTab({ trashTransactions, onRestore, onDeletePermanently, onEmptyTrash }: TrashTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showEmptyTrashConfirm, setShowEmptyTrashConfirm] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);

  const filteredTrash = trashTransactions.filter(t => {
    const allMouzas = [t.mouza, ...t.khatians.map(k => k.mouza?.trim())].filter(Boolean).join(' ');
    return t.deedNumber.includes(searchTerm) || 
      allMouzas.includes(searchTerm) ||
      t.buyerName.includes(searchTerm) ||
      t.sellerName.includes(searchTerm);
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Trash2 className="text-rose-500" />
            ট্রাশ (Recycle Bin)
          </h1>
          <p className="text-text-muted text-sm mt-1">
            ডিলিট করা সমস্ত লেনদেন এখানে সংরক্ষিত আছে। আপনি চাইলে এগুলো রিস্টোর করতে পারেন অথবা চিরতরে মুছে ফেলতে পারেন।
          </p>
        </div>
        
        {trashTransactions.length > 0 && (
          <button
            onClick={() => setShowEmptyTrashConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold bg-alert-peach text-rose-700 border border-alert-border hover:bg-[#f0c4b8] custom-shadow transition"
          >
            <AlertTriangle size={18} />
            ট্রাশ খালি করুন
          </button>
        )}
      </div>

      <div className="bg-white rounded-[20px] custom-shadow border border-border-subtle overflow-hidden">
        <div className="p-4 border-b border-border-subtle flex flex-col sm:flex-row gap-4 justify-between bg-ice-tint">
          <div className="relative max-w-md w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-text-muted" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-border-subtle rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-all"
              placeholder="দলিল নম্বর, ক্রেতা, বিক্রেতা বা মৌজা দিয়ে খুঁজুন..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-table-header border-b border-border-subtle text-slate-teal font-semibold">
                <th className="py-3 px-4">দলিল নম্বর</th>
                <th className="py-3 px-4">ধরন</th>
                <th className="py-3 px-4">মৌজার নাম</th>
                <th className="py-3 px-4">ক্রেতার নাম</th>
                <th className="py-3 px-4">বিক্রেতার নাম</th>
                <th className="py-3 px-4 text-center">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredTrash.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-text-muted font-light text-base">
                    ট্রাশে কোনো ডাটা নেই।
                  </td>
                </tr>
              ) : (
                filteredTrash.map((t) => (
                  <tr key={t.id} className="hover:bg-alert-peach/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-text-primary">দলিল নং {toBengaliNumber(t.deedNumber)}</div>
                      <div className="text-[10px] text-text-muted font-mono mt-0.5">{toBengaliNumber(t.date)}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-[11px] font-bold ${t.type === 'purchase' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                        {t.type === 'purchase' ? 'ক্রয়কৃত' : 'বিক্রয়কৃত'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-text-primary font-medium">
                        {Array.from(new Set([t.mouza, ...t.khatians.map(k => k.mouza?.trim())].filter(Boolean)))
                          .map(m => m.replace(/\s*মৌজা\s*$/, ''))
                          .join(', ')}
                      </div>
                    </td>
                    <td className="py-3 px-4">{t.buyerName}</td>
                    <td className="py-3 px-4">{t.sellerName}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => onRestore(t)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-emerald-600 bg-emerald-50 hover:bg-emerald-100 font-semibold transition cursor-pointer"
                          title="রিস্টোর করুন"
                        >
                          <RefreshCcw size={14} />
                          রিস্টোর
                        </button>
                        <button
                          onClick={() => setTransactionToDelete(t.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-rose-700 bg-alert-peach hover:bg-rose-100 font-semibold transition cursor-pointer"
                          title="স্থায়ীভাবে মুছে ফেলুন"
                        >
                          <Trash2 size={14} />
                          মুছে ফেলুন
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal to Empty Trash */}
      {showEmptyTrashConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[20px] max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-text-primary font-bold text-lg flex items-center gap-2">
              <AlertTriangle className="text-rose-500" />
              ট্রাশ খালি করবেন?
            </h3>
            <p className="text-sm text-text-muted leading-relaxed">
              আপনি কি নিশ্চিত যে ট্রাশের সকল ডাটা চিরতরে মুছে ফেলতে চান? এই অ্যাকশনটি আর পরিবর্তন করা যাবে না।
            </p>
            <div className="pt-2 flex justify-end gap-3">
              <button
                onClick={() => setShowEmptyTrashConfirm(false)}
                className="text-sm text-text-muted hover:text-slate-700 bg-table-header hover:bg-slate-200 px-4 py-2 rounded-lg font-medium transition cursor-pointer"
              >
                বাতিল করুন
              </button>
              <button
                onClick={() => {
                  onEmptyTrash();
                  setShowEmptyTrashConfirm(false);
                }}
                className="text-sm bg-alert-peach text-rose-700 border border-alert-border hover:bg-[#f0c4b8] px-4 py-2 rounded-lg font-bold transition cursor-pointer"
              >
                হ্যাঁ, খালি করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal to Permanently Delete Single Item */}
      {transactionToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[20px] max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-text-primary font-bold text-lg">
              স্থায়ীভাবে মুছে ফেলবেন?
            </h3>
            <p className="text-sm text-text-muted leading-relaxed">
              এই লেনদেনটি চিরতরে মুছে ফেলা হবে এবং আর কখনো রিস্টোর করা যাবে না।
            </p>
            <div className="pt-2 flex justify-end gap-3">
              <button
                onClick={() => setTransactionToDelete(null)}
                className="text-sm text-text-muted hover:text-slate-700 bg-table-header hover:bg-slate-200 px-4 py-2 rounded-lg font-medium transition cursor-pointer"
              >
                বাতিল করুন
              </button>
              <button
                onClick={() => {
                  onDeletePermanently(transactionToDelete);
                  setTransactionToDelete(null);
                }}
                className="text-sm bg-alert-peach text-rose-700 border border-alert-border hover:bg-[#f0c4b8] px-4 py-2 rounded-lg font-bold transition cursor-pointer"
              >
                হ্যাঁ, মুছে ফেলুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
