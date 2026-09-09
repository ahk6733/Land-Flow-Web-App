import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';
import { LandTransaction, Attachment } from '../types';
import { toBengaliNumber } from '../data/defaultData';
import { analyzeLandData, getKhatianLabel } from '../utils/landAnalyzer';
import { openAttachmentInNewTab } from '../utils/attachmentHelper';
import { 
  Search, 
  MapPin, 
  User, 
  Layers, 
  FileText,
  AlertTriangle,
  FolderOpen,
  ArrowBigDown,
  Download,
  Info,
  Calendar,
  Pencil,
  FileDown,
  Trash2,
  FileArchive,
  CheckCircle2,
  X
} from 'lucide-react';

interface SearchQueryProps {
  transactions: LandTransaction[];
  onUpdateTransactions: (newTransactions: LandTransaction[]) => void;
  initialSearchQuery?: { khatian?: string; dag?: string };
  onClearInitialQuery: () => void;
  onEditTransaction: (tx: LandTransaction) => void;
  onDeleteTransaction: (id: string) => void;
  onPrintTransaction: (tx: LandTransaction) => void;
  currentUser?: any;
}

export default function SearchQuery({
  transactions,
  onUpdateTransactions,
  initialSearchQuery,
  onClearInitialQuery,
  onEditTransaction,
  onDeleteTransaction,
  onPrintTransaction,
  currentUser,
}: SearchQueryProps) {
  // Search parameters filter
  const [searchType, setSearchType] = useState<'khatian' | 'dag'>('khatian');
  const [queryTerm, setQueryTerm] = useState('');
  const [selectedMouza, setSelectedMouza] = useState('');

  // JSZip download state
  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState('');

  // Load initial shortcut queries requested from outside (e.g. from Dashboard)
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set());

  const handleToggleSelectGroup = (groupId: string) => {
    const newSet = new Set(selectedGroupIds);
    if (newSet.has(groupId)) newSet.delete(groupId);
    else newSet.add(groupId);
    setSelectedGroupIds(newSet);
  };

  const handleSelectAllGroup = () => {
    if (selectedGroupIds.size === matchedTransactionsGroups.length && matchedTransactionsGroups.length > 0) {
      setSelectedGroupIds(new Set());
    } else {
      setSelectedGroupIds(new Set(matchedTransactionsGroups.map(g => g.tx.id)));
    }
  };

  const handlePrintRecords = () => {
    const groupsToPrint = selectedGroupIds.size > 0 
      ? matchedTransactionsGroups.filter(g => selectedGroupIds.has(g.tx.id))
      : matchedTransactionsGroups;

    if (groupsToPrint.length === 0) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Your browser blocked the print window. Please allow popups.');
      return;
    }

    const htmlContent = `
      <html>
        <head>
          <title>খতিয়ান ও দাগ রিপোর্ট</title>
          <style>
            body { font-family: sans-serif; padding: 20px; color: #000; }
            .header-title { text-align: center; font-size: 26px; font-weight: bold; margin-bottom: 5px; }
            h1 { text-align: center; font-size: 20px; margin-bottom: 5px; }
            p.subtitle { text-align: center; color: #555; font-size: 14px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; font-weight: bold; text-align: center; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .purchase { color: #0f766e; }
            .sale { color: #e11d48; }
            .footer-section { margin-top: 60px; display: flex; justify-content: space-between; align-items: flex-end; font-size: 14px; }
            .signature-box { text-align: center; width: 180px; }
            .signature-line { border-top: 1px solid #000; margin-top: 50px; padding-top: 5px; font-weight: bold; }
            @media print {
              @page { margin: 1.5cm; size: landscape; }
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          ${currentUser?.userType === 'company' && currentUser?.companyName ? `<div class="header-title">${currentUser.companyName}</div>` : ''}
          <h1>দাগ ও খতিয়ান ভিত্তিক জমির রেকর্ড রিপোর্ট</h1>
          <p class="subtitle">${queryTerm ? '"' + queryTerm + '" এর জন্য অনুসন্ধানকৃত ফলাফল' : 'সকল জমির রেকর্ড'}</p>
          
          <table>
            <thead>
              <tr>
                <th>দলিল নং ও তারিখ</th>
                <th>দলিলের প্রকৃতি</th>
                <th>মৌজার নাম</th>
                <th>খতিয়ান নম্বর</th>
                <th>সংশ্লিষ্ট দাগ</th>
                <th>জমির শ্রেণী</th>
                <th class="text-center">দাগের মোট জমি</th>
                <th class="text-center">নামজারী/কাতে পরিমান</th>
                <th class="text-center">অর্জিত / হস্তান্তরিত জমি</th>
              </tr>
            </thead>
            <tbody>
              ${groupsToPrint.map(group => {
                let rowsHtml = '';
                group.rows.forEach((row, rIdx) => {
                  const tx = group.tx;
                  const khatian = row.khatian;
                  const dag = row.dag;

                  const kParts = [];
                  if (khatian.hasCS && khatian.csKhatian) kParts.push('সি.এস: ' + khatian.csKhatian);
                  if (khatian.hasSA && khatian.saKhatian) kParts.push('এস.এ: ' + khatian.saKhatian);
                  if (khatian.hasRS && khatian.rsKhatian) kParts.push('আর.এস: ' + khatian.rsKhatian);
                  if (khatian.hasNamjari && khatian.namjariKhatian) kParts.push('নামজারী: ' + khatian.namjariKhatian);

                  const dParts = [];
                  if (dag.hasCS && dag.csDag) dParts.push('সি.এস: ' + dag.csDag);
                  if (dag.hasSA && dag.saDag) dParts.push('এস.এ: ' + dag.saDag);
                  if (dag.hasRS && dag.rsDag) dParts.push('আর.এস: ' + dag.rsDag);

                  const amountText = tx.type === 'purchase' ? toBengaliNumber(dag.amount) + ' শতক' : '-' + toBengaliNumber(dag.amount) + ' শতক';
                  const amountClass = tx.type === 'purchase' ? 'purchase' : 'sale';

                  let firstCols = '';
                  if (rIdx === 0) {
                    firstCols = '<td rowspan="' + group.rows.length + '">' +
                      '<strong>দলিল নং ' + toBengaliNumber(tx.deedNumber) + '</strong><br/>' +
                      '<span style="color:#666">(' + toBengaliNumber(tx.date) + ')</span>' +
                    '</td>' +
                    '<td rowspan="' + group.rows.length + '" class="text-center" style="vertical-align: middle;"><strong>' + (tx.deedNature || '-') + '</strong></td>' +
                    '<td rowspan="' + group.rows.length + '" class="text-center" style="vertical-align: middle;"><strong>' + tx.mouza.replace(/\s*মৌজা\s*$/, '') + '</strong></td>';
                  }

                  rowsHtml += '<tr>' +
                    firstCols +
                    '<td>' + toBengaliNumber(kParts.join(', ')) + '</td>' +
                    '<td>' + toBengaliNumber(dParts.join(', ')) + '</td>' +
                    '<td>' + (dag.landClass || '-') + '</td>' +
                    '<td class="text-center">' + toBengaliNumber(dag.totalAmount) + ' শতক</td>' +
                    '<td class="text-center">' + toBengaliNumber(khatian.hasNamjari ? (dag.namjariAmount || 0) : (dag.kateAmount || 0)) + ' শতক</td>' +
                    '<td class="text-center ' + amountClass + '"><strong>' + amountText + '</strong></td>' +
                  '</tr>';
                });
                return rowsHtml;
              }).join('')}
            </tbody>
          </table>
          <div class="footer-section">
            <div>
              <p style="margin-bottom: 5px;"><strong>রিপোর্ট জেনারেট বাই:</strong> ${currentUser?.name || '(ইউজার নাম নেই)'}</p>
              <p><strong>তারিখ:</strong> ${toBengaliNumber(new Date().toLocaleDateString('en-GB'))}</p>
            </div>
            <div class="signature-box">
              <div class="signature-line">
                স্বাক্ষর
              </div>
            </div>
          </div>
          <script>
            window.onload = () => {
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  useEffect(() => {
    if (initialSearchQuery) {
      if (initialSearchQuery.khatian) {
        setSearchType('khatian');
        setQueryTerm(initialSearchQuery.khatian);
      } else if (initialSearchQuery.dag) {
        setSearchType('dag');
        setQueryTerm(initialSearchQuery.dag);
      }
      onClearInitialQuery(); // Reset initial query
    }
  }, [initialSearchQuery]);

  // Run analysis of the raw land data ledger
  const analysis = analyzeLandData(transactions);

  // Generate unique Mouza dropdown list based on current transactions
  const uniqueMouzas = Array.from(new Set(transactions.map((t) => t.mouza))).filter(Boolean);

  // Filter Khatian or Dag list based on search parameters
  let filteredKhatiansList = analysis.khatiansList;
  let filteredDagsList = analysis.dagsSummaryList;

  if (selectedMouza) {
    filteredKhatiansList = filteredKhatiansList.filter((k) => k.mouza === selectedMouza);
    filteredDagsList = filteredDagsList.filter((d) => d.mouza === selectedMouza);
  }

  const query = queryTerm.trim();
  if (query) {
    filteredKhatiansList = filteredKhatiansList.filter((k) => k.khatianNo.includes(query) || toBengaliNumber(k.khatianNo).includes(query));
    filteredDagsList = filteredDagsList.filter((d) => d.dagNo.includes(query) || toBengaliNumber(d.dagNo).includes(query));
  }

  // Create unified rows grouped by transaction
  const matchedTransactionsGroups: {
    tx: LandTransaction;
    rows: { khatian: any, dag: any }[];
  }[] = [];
  
  transactions.forEach((t) => {
    // Mouza filter
    if (selectedMouza && t.mouza !== selectedMouza) return;
    
    // Term filter
    const rowsForTx: { khatian: any, dag: any }[] = [];

    t.khatians.forEach((k) => {
      let khatianMatches = false;
      if (query) {
        khatianMatches = !!(
          (k.csKhatian && k.csKhatian.includes(query)) ||
          (k.saKhatian && k.saKhatian.includes(query)) ||
          (k.rsKhatian && k.rsKhatian.includes(query)) ||
          (k.namjariKhatian && k.namjariKhatian.includes(query))
        );
      }

      k.dags.forEach((d) => {
        let dagMatches = false;
        if (query) {
          dagMatches = !!(
            (d.csDag && d.csDag.includes(query)) ||
            (d.saDag && d.saDag.includes(query)) ||
            (d.rsDag && d.rsDag.includes(query))
          );
        }

        // Determine if this specific dag row should be included
        let includeRow = false;
        if (!query) {
          includeRow = true; // Include all if no query
        } else if (searchType === 'khatian' && khatianMatches) {
          includeRow = true; // Include all dags for matching khatian
        } else if (searchType === 'dag' && dagMatches) {
          includeRow = true; // Include only matching dags
        }

        if (includeRow) {
          rowsForTx.push({ khatian: k, dag: d });
        }
      });
    });

    if (rowsForTx.length > 0) {
      matchedTransactionsGroups.push({ tx: t, rows: rowsForTx });
    }
  });

  // Extract all matching attachments in search results
  const matchingAttachments: { deedNo: string; file: Attachment }[] = [];
  matchedTransactionsGroups.forEach((group) => {
    if (group.tx.attachments && group.tx.attachments.length > 0) {
      group.tx.attachments.forEach((file) => {
        matchingAttachments.push({ deedNo: group.tx.deedNumber, file });
      });
    }
  });

  // Download all matching scanner attachments as a ZIP package
  const handleDownloadAllAsZip = async () => {
    if (matchingAttachments.length === 0) return;
    setIsZipping(true);
    setZipProgress('জিপ ফাইল বাণ্ডিল প্রসেস করা হচ্ছে...');

    try {
      const zip = new JSZip();
      
      const promises = matchingAttachments.map(async (item, index) => {
        const file = item.file;
        let base64Content = (file as any).base64Data || file.url || '';
        
        // If it's a physical file, we fetch it via IPC
        if (file.savedFileName) {
           const electronAPI = (window as any).electronAPI;
           if (electronAPI) {
             const result = await electronAPI.getAttachmentBase64(file.savedFileName);
             if (result.success) {
               base64Content = result.base64;
             }
           }
        }

        if (typeof base64Content === 'string' && base64Content.includes(',')) {
          base64Content = base64Content.split(',')[1];
        }
        
        // Add file directly into zip root
        // Name format representation: দলিল_নং-৪৫১২_পাইলনাম
        const zipFileName = `দলিল_নং-${toBengaliNumber(item.deedNo)}_${file.name}`;
        if (base64Content) {
           zip.file(zipFileName, base64Content, { base64: true });
        }
        setZipProgress(`আর্কাইভ সংযুক্তিঃ ${index + 1}/${matchingAttachments.length}`);
      });

      await Promise.all(promises);
      setZipProgress('ফাইল কমপ্রেস সম্পন্ন হচ্ছে...');
      const blob = await zip.generateAsync({ type: 'blob' });
      
      // Trigger download
      const blobURL = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = blobURL;
      anchor.download = `দাগ_খতিয়ান_সংযুক্ত_নথিপত্র_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(blobURL);
    } catch (err) {
      console.error('Failed to create download package bundle ZIP', err);
      alert('দুঃখিত, জিপ ফাইল প্যাকেজ তৈরি করা সম্ভব হয়নি। ইউজার ব্রাউজারের মেমোরি সীমাবদ্ধতা থাকতে পারে।');
    } finally {
      setIsZipping(false);
      setZipProgress('');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Search Console Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-sans flex items-center gap-2">
            <Search className="text-indigo-700" size={20} />
            দাগ ও খতিয়ান ভিত্তিক বিস্তারিত অনুসন্ধ্যান লেজার
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            মৌজা ম্যাপ সীমানা, দাগের খণ্ড অবশিষ্ট পরিমাণ ও দলিল ভিত্তিক জমি ক্রয়-বিক্রয়ের ব্যালেন্স রিপোর্ট দেখুন।
          </p>
        </div>

        {/* Input Parameters Form layout */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs font-semibold">
          <div className="space-y-1">
            <label className="text-slate-500">অনুসন্ধান ফিল্টার টাইপ</label>
            <div className="flex bg-white rounded-lg border border-slate-300 p-0.5">
              <button
                type="button"
                onClick={() => setSearchType('khatian')}
                className={`flex-1 text-center py-1.5 rounded-md font-bold cursor-pointer transition ${
                  searchType === 'khatian' ? 'bg-indigo-700 text-white' : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                খতিয়ান দিয়ে অনুসন্ধান
              </button>
              <button
                type="button"
                onClick={() => setSearchType('dag')}
                className={`flex-1 text-center py-1.5 rounded-md font-bold cursor-pointer transition ${
                  searchType === 'dag' ? 'bg-indigo-700 text-white' : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                দাগ নং দিয়ে অনুসন্ধান
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-slate-500">মৌজার নাম সিলেক্ট করুন (ঐচ্ছিক)</label>
            <select
              value={selectedMouza}
              onChange={(e) => setSelectedMouza(e.target.value)}
              className="w-full h-9 bg-white border border-slate-300 rounded-lg px-3 py-1.5 font-sans leading-none focus:outline-none focus:border-indigo-600"
            >
              <option value="">সকল সংগৃহীত মৌজার নাম</option>
              {uniqueMouzas.map((m) => (
                <option key={m} value={m}>
                  {m.replace(/\s*মৌজা\s*$/, '')}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1 sm:col-span-2">
            <label className="text-indigo-700">
              {searchType === 'khatian' ? 'খতিয়ান নম্বর লিখুন (যেমন: ১২৩ বা ৪৫৬)' : 'দাগ নম্বর লিখুন (যেমন: ৫০১)'}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                <Search size={14} />
              </span>
              <input
                type="text"
                value={queryTerm}
                onChange={(e) => setQueryTerm(e.target.value)}
                placeholder={searchType === 'khatian' ? 'খতিয়ান নম্বর লিখুন...' : 'দাগ নম্বর লিখুন...'}
                className="w-full text-xs pl-9 pr-4 h-9 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600 font-sans"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Grouped Availability Report Grid */}
      <div className="grid grid-cols-1 gap-6">
        
        {/* Document register matching records and scanner download attachments */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[520px] overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 bg-white flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 shrink-0">
            <span className="text-[13px] font-bold text-teal-900 flex items-center gap-2">
              <CheckCircle2 size={16} className="text-teal-700" />
              {query ? `"${query}" এর জন্য পূর্বের জমির রেকর্ড` : `সকল জমির রেকর্ড (${toBengaliNumber(matchedTransactionsGroups.length)}টি দলিল)`}
            </span>
            
            <div className="flex items-center gap-2">
              {selectedGroupIds.size === 1 && (
                <>
                  <button
                    onClick={() => {
                        const txId = Array.from(selectedGroupIds)[0] as string;
                        const group = matchedTransactionsGroups.find(g => g.tx.id === txId);
                        if (group) onEditTransaction(group.tx);
                    }}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-blue-50 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Pencil size={14} />
                    ইডিট
                  </button>
                  <button
                    onClick={() => {
                        const txId = Array.from(selectedGroupIds)[0] as string;
                        const group = matchedTransactionsGroups.find(g => g.tx.id === txId);
                        if (group) onPrintTransaction(group.tx);
                    }}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors"
                  >
                    <FileDown size={14} />
                    সিঙ্গেল ভিউ ও প্রিন্ট
                  </button>
                  <button
                    onClick={() => {
                        const txId = Array.from(selectedGroupIds)[0] as string;
                        onDeleteTransaction(txId);
                        const newSet = new Set(selectedGroupIds);
                        newSet.delete(txId);
                        setSelectedGroupIds(newSet);
                    }}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-rose-50 border border-rose-200 text-rose-700 rounded-lg hover:bg-rose-100 transition-colors"
                  >
                    <Trash2 size={14} />
                    ডিলিট
                  </button>
                </>
              )}
              <button
                onClick={handlePrintRecords}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors"
                title="পিডিএফ প্রিন্ট"
              >
                <FileDown size={14} />
                প্রিন্ট (পিডিএফ)
              </button>

              {query && (
                <button 
                  onClick={() => { setQueryTerm(''); setSelectedMouza(''); }}
                  className="text-slate-400 hover:text-slate-600 focus:outline-none transition-colors ml-2"
                  title="অনুসন্ধান বাতিল করুন"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          <div className="flex-grow overflow-x-auto p-4 space-y-4 bg-slate-50">
            {matchedTransactionsGroups.length === 0 ? (
              <div className="text-center text-slate-400 py-16 text-xs italic font-sans flex flex-col items-center justify-center gap-2 border border-slate-200 bg-white rounded-xl">
                <Info size={24} className="text-slate-300" />
                <span>আপনার অনুসন্ধানের সাথে মিল থাকা কোনো রেকর্ড পাওয়া যায়নি।</span>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-lg bg-white shadow-sm overflow-x-auto min-w-[800px] max-h-full overflow-y-auto">
                <table className="w-full text-left text-[11px] text-slate-800 font-semibold border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-extrabold whitespace-nowrap">
                      <th className="px-2 py-1 border-r border-slate-200 w-10 text-center">
                        <input 
                          type="checkbox" 
                          checked={selectedGroupIds.size === matchedTransactionsGroups.length && matchedTransactionsGroups.length > 0} 
                          onChange={handleSelectAllGroup}
                          className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </th>
                      <th className="px-2 py-1 border-r border-slate-200 text-center">দলিল নং ও তারিখ</th>
                      <th className="px-2 py-1 border-r border-slate-200 text-center">দলিলের প্রকৃতি</th>
                      <th className="px-2 py-1 border-r border-slate-200 text-center">মৌজার নাম</th>
                      <th className="px-2 py-1 border-r border-slate-200 text-center">খতিয়ান নম্বর</th>
                      <th className="px-2 py-1 border-r border-slate-200 text-center">সংশ্লিষ্ট দাগ</th>
                      <th className="px-2 py-1 border-r border-slate-200 text-center">শ্রেণী</th>
                      <th className="px-2 py-1 border-r border-slate-200 text-center">দাগের মোট জমি</th>
                      <th className="px-2 py-1 border-r border-slate-200 text-center">নামজারী/কাতে পরিমান</th>
                      <th className="px-2 py-1 border-r border-slate-200 text-center">অর্জিত / হস্তান্তরিত জমি</th>
                      <th className="px-2 py-1 text-center">ডকুমেন্ট</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {matchedTransactionsGroups.map((group, gIdx) => (
                      <React.Fragment key={group.tx.id}>
                        {group.rows.map((row, rIdx) => {
                          const tx = group.tx;
                          const khatian = row.khatian;
                          const dag = row.dag;

                          const kParts: string[] = [];
                          if (khatian.hasCS && khatian.csKhatian) kParts.push(`সি.এস: ${khatian.csKhatian}`);
                          if (khatian.hasSA && khatian.saKhatian) kParts.push(`এস.এ: ${khatian.saKhatian}`);
                          if (khatian.hasRS && khatian.rsKhatian) kParts.push(`আর.এস: ${khatian.rsKhatian}`);
                          if (khatian.hasNamjari && khatian.namjariKhatian) kParts.push(`নামজারী: ${khatian.namjariKhatian}`);

                          const dParts: string[] = [];
                          if (dag.hasCS && dag.csDag) dParts.push(`সি.এস: ${dag.csDag}`);
                          if (dag.hasSA && dag.saDag) dParts.push(`এস.এ: ${dag.saDag}`);
                          if (dag.hasRS && dag.rsDag) dParts.push(`আর.এস: ${dag.rsDag}`);

                          return (
                            <tr key={rIdx} className="hover:bg-slate-50/50 transition-colors">
                              {rIdx === 0 && (
                                 <>
                                   <td className="px-2 py-1 border-r border-slate-200 align-top text-center" rowSpan={group.rows.length}>
                                     <input 
                                       type="checkbox" 
                                       checked={selectedGroupIds.has(tx.id)} 
                                       onChange={() => handleToggleSelectGroup(tx.id)}
                                       className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer mt-1"
                                     />
                                   </td>
                                   <td className="px-2 py-1 border-r border-slate-200 align-top" rowSpan={group.rows.length}>
                                     <div className="font-bold mb-0.5">
                                       <span>দলিল নং {toBengaliNumber(tx.deedNumber)}</span><br/>
                                       <span className="font-sans font-normal text-slate-500 whitespace-nowrap text-[10px]">({toBengaliNumber(tx.date)})</span>
                                     </div>
                                   </td>
                                   <td className="px-2 py-1 border-r border-slate-200 align-middle text-center whitespace-nowrap font-bold text-slate-700" rowSpan={group.rows.length}>
                                     {tx.deedNature || '-'}
                                   </td>
                                   <td className="px-2 py-1 border-r border-slate-200 align-middle text-center whitespace-nowrap font-bold text-slate-900" rowSpan={group.rows.length}>
                                     {tx.mouza.replace(/\s*মৌজা\s*$/, '')}
                                   </td>
                                 </>
                              )}
                              <td className="px-2 py-1 border-r border-slate-200 whitespace-nowrap">{toBengaliNumber(kParts.join(', '))}</td>
                              <td className="px-2 py-1 border-r border-slate-200 whitespace-nowrap">{toBengaliNumber(dParts.join(', '))}</td>
                              <td className="px-2 py-1 border-r border-slate-200 whitespace-nowrap">{dag.landClass || '-'}</td>
                              <td className="px-2 py-1 border-r border-slate-200 text-center font-sans font-medium text-slate-600 whitespace-nowrap">{toBengaliNumber(dag.totalAmount)} শতক</td>
                              <td className="px-2 py-1 border-r border-slate-200 text-center font-sans font-medium text-slate-600 whitespace-nowrap">{toBengaliNumber(khatian.hasNamjari ? (dag.namjariAmount || 0) : (dag.kateAmount || 0))} শতক</td>
                              <td className={`px-2 py-1 border-r border-slate-200 text-center font-sans font-bold whitespace-nowrap ${tx.type === 'purchase' ? 'text-teal-700' : 'text-rose-600'}`}>
                                {tx.type === 'purchase' ? `${toBengaliNumber(dag.amount)} শতক` : `-${toBengaliNumber(dag.amount)} শতক`}
                              </td>
                              {rIdx === 0 && (
                                <td className="px-2 py-1 align-top" rowSpan={group.rows.length}>
                                  {tx.attachments && tx.attachments.length > 0 ? (
                                     <div className="flex flex-col gap-1">
                                       {tx.attachments.map(a => (
                                         <button 
                                             key={a.id} 
                                             onClick={() => openAttachmentInNewTab(a)}
                                             className="text-[10px] bg-blue-50/50 hover:bg-blue-100 text-blue-700 border border-blue-100 px-1.5 py-0.5 flex items-center gap-1 rounded transition whitespace-nowrap overflow-hidden text-ellipsis w-[100px] justify-start cursor-pointer"
                                             title={a.name}
                                         >
                                           <FileArchive size={11} className="shrink-0" /> <span className="truncate">{a.name}</span>
                                         </button>
                                       ))}
                                     </div>
                                  ) : (
                                    <span className="text-slate-400 italic text-[10px] flex justify-center items-center h-full">-</span>
                                  )}
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
