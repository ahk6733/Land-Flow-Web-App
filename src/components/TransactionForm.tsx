import React, { useState, useRef, useEffect } from 'react';
import { LandTransaction, KhatianInfo, DagInfo, Attachment } from '../types';
import { toBengaliNumber } from '../data/defaultData';
import { openAttachmentInNewTab } from '../utils/attachmentHelper';
import { 
  Building2, 
  Calendar, 
  User, 
  MapPin, 
  Plus, 
  Trash2, 
  FileText, 
  HardDriveUpload, 
  AlertTriangle, 
  PlusCircle, 
  MinusCircle,
  CheckCircle2,
  X,
  FileCheck,
  Eye,
  Search,
  Check
} from 'lucide-react';

interface TransactionFormProps {
  type: 'purchase' | 'sale';
  onSave: (savedTx: LandTransaction) => void;
  transactions: LandTransaction[];
  editingTransaction: LandTransaction | null;
  onCancelEdit: () => void;
  currentUser: any;
}

const PREDEFINED_LAND_CLASSES = ["নাল", "বাড়ি", "ভিটি", "ডোবা", "পুকুর", "প্লট"];

function LandClassSelector({ landClass, onChange }: { landClass: string | undefined, onChange: (val: string) => void }) {
  const [isCustom, setIsCustom] = useState(() => {
    return !!landClass && !PREDEFINED_LAND_CLASSES.includes(landClass);
  });

  useEffect(() => {
    if (landClass && !PREDEFINED_LAND_CLASSES.includes(landClass)) {
      setIsCustom(true);
    }
  }, [landClass]);

  if (isCustom) {
    return (
      <div className="flex items-center gap-1 w-full">
        <input
          type="text"
          autoFocus
          placeholder="শ্রেণী লিখুন..."
          value={landClass || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-1.5 border border-slate-400 text-xs font-bold text-slate-900 h-9 rounded bg-white"
        />
        <button
          type="button"
          onClick={() => {
            setIsCustom(false);
            onChange('');
          }}
          className="text-slate-400 hover:text-rose-500 bg-slate-100 p-1 rounded shrink-0 transition"
          title="বাদ দিন"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <select
      value={landClass || ""}
      onChange={(e) => {
        if (e.target.value === "__custom__") {
          setIsCustom(true);
          onChange('');
        } else {
          onChange(e.target.value);
        }
      }}
      className="w-full px-1.5 border border-slate-400 text-xs font-bold text-slate-900 h-9 rounded bg-white"
    >
      <option value="" disabled>শ্রেণী...</option>
      {PREDEFINED_LAND_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
      <option value="__custom__">অন্যান্য (লিখুন)...</option>
    </select>
  );
}

export default function TransactionForm({
  type,
  onSave,
  transactions,
  editingTransaction,
  onCancelEdit,
  currentUser,
}: TransactionFormProps) {
  const uniqueMouzas = Array.from(
    new Set([
      ...(currentUser?.customMouzas || []),
      ...transactions.map((t) => t.mouza).filter(Boolean)
    ])
  ).sort();
  const uniqueDeedNatures = Array.from(
    new Set([
      ...(currentUser?.customDeedTypes || []),
      ...transactions.map((t) => t.deedNature).filter(Boolean)
    ])
  ).sort();

  // Main form fields
  const [deedNumber, setDeedNumber] = useState('');
  const [deedNature, setDeedNature] = useState(uniqueDeedNatures.length > 0 ? uniqueDeedNatures[0] : 'custom');
  const [customDeedNature, setCustomDeedNature] = useState('');
  const [showCustomDeedNature, setShowCustomDeedNature] = useState(uniqueDeedNatures.length === 0);
  const [date, setDate] = useState('');
  const [mouza, setMouza] = useState(uniqueMouzas.length > 0 ? uniqueMouzas[0] : 'custom');
  const [customMouza, setCustomMouza] = useState('');
  const [showCustomMouza, setShowCustomMouza] = useState(uniqueMouzas.length === 0);
  const [buyerName, setBuyerName] = useState('');
  const [sellerName, setSellerName] = useState('');
  const [totalLandAmount, setTotalLandAmount] = useState<number>(0);
  const [namjariLandAmount, setNamjariLandAmount] = useState<number>(0);
  const [transactionAmount, setTransactionAmount] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [lookupQuery, setLookupQuery] = useState('');
  const [lookupResult, setLookupResult] = useState<{
    query: string;
    matches: Array<{
      deedNumber: string;
      date: string;
      mouza: string;
      buyerName: string;
      sellerName: string;
      khatianNo: string;
      dagNo: string;
      amount: number;
      namjariAmount?: number;
      kateAmount?: number;
      totalAmount?: number;
    }>;
  } | null>(null);
  const [importedMatchIndices, setImportedMatchIndices] = useState<number[]>([]);

  // Complex nested state
  const [khatians, setKhatians] = useState<KhatianInfo[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  
  // Feedback alerts
  const [errorText, setErrorText] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Button click feedback states
  const [khatianFeedback, setKhatianFeedback] = useState(false);
  const [dagFeedbackId, setDagFeedbackId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Drive link states
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');

  // Populate form if editing
  useEffect(() => {
    if (editingTransaction) {
      setDeedNumber(editingTransaction.deedNumber);
      if (editingTransaction.deedNature && uniqueDeedNatures.includes(editingTransaction.deedNature)) {
        setDeedNature(editingTransaction.deedNature);
        setShowCustomDeedNature(false);
      } else {
        setDeedNature('custom');
        setCustomDeedNature(editingTransaction.deedNature || '');
        setShowCustomDeedNature(true);
      }
      setDate(editingTransaction.date);
      setNotes(editingTransaction.notes || '');
      setBuyerName(editingTransaction.buyerName);
      setSellerName(editingTransaction.sellerName);
      setTotalLandAmount(editingTransaction.totalLandAmount);
      setNamjariLandAmount(editingTransaction.namjariLandAmount);
      setTransactionAmount(editingTransaction.transactionAmount);
      setAttachments(editingTransaction.attachments || []);
      setKhatians(JSON.parse(JSON.stringify(editingTransaction.khatians))); // deep clone

      if (uniqueMouzas.includes(editingTransaction.mouza)) {
        setMouza(editingTransaction.mouza);
        setShowCustomMouza(false);
      } else {
        setMouza('custom');
        setCustomMouza(editingTransaction.mouza);
        setShowCustomMouza(true);
      }
    } else {
      // Create fresh mock document blueprint structure
      setDeedNumber('');
      if (uniqueDeedNatures.length > 0) {
        setDeedNature(uniqueDeedNatures[0]);
        setCustomDeedNature('');
        setShowCustomDeedNature(false);
      } else {
        setDeedNature('custom');
        setCustomDeedNature('');
        setShowCustomDeedNature(true);
      }
      setDate(new Date().toISOString().split('T')[0]);
      setNotes('');
      setAttachments([]);
      setTotalLandAmount(0);
      setNamjariLandAmount(0);
      setTransactionAmount(0);
      
      // Auto-set names based on user profile type for comfort
      if (type === 'purchase') {
        const defaultName = currentUser?.userType === 'company' && currentUser?.companyName ? currentUser.companyName : '';
        setBuyerName(defaultName);
        setSellerName('');
      } else {
        const defaultName = currentUser?.userType === 'company' && currentUser?.companyName ? currentUser.companyName : '';
        setBuyerName('');
        setSellerName(defaultName);
      }

      // Add a default khatian & dag to start with
      const initialDag: DagInfo = {
        id: `dag_${Date.now()}_0`,
        hasCS: false,
        csDag: '',
        hasSA: false,
        saDag: '',
        hasRS: true,
        rsDag: '',
        totalAmount: 0,
        namjariAmount: 0,
        amount: 0
      };

      const initialKhatian: KhatianInfo = {
        id: `kh_${Date.now()}`,
        hasCS: false,
        csKhatian: '',
        hasSA: false,
        saKhatian: '',
        hasRS: true,
        rsKhatian: '',
        hasNamjari: false,
        namjariKhatian: '',
        dags: [initialDag]
      };

      setKhatians([initialKhatian]);

      if (uniqueMouzas.length > 0) {
        setMouza(uniqueMouzas[0]);
        setCustomMouza('');
        setShowCustomMouza(false);
      } else {
        setMouza('custom');
        setCustomMouza('');
        setShowCustomMouza(true);
      }
    }
  }, [editingTransaction, type, transactions]);

  // Recalculate transactionAmount based on sum of dags amounts
  useEffect(() => {
    let sum = 0;
    let totalSum = 0;
    let namjariSum = 0;
    khatians.forEach((kh) => {
      kh.dags.forEach((d) => {
        sum += Number(d.amount) || 0;
        totalSum += Number(d.totalAmount) || 0;
        namjariSum += kh.hasNamjari ? (Number(d.namjariAmount) || 0) : (Number(d.kateAmount) || 0);
      });
    });
    setTransactionAmount(sum);
    setTotalLandAmount(totalSum);
    setNamjariLandAmount(namjariSum);
  }, [khatians]);

  // Handle Mouza selection change
  const handleMouzaChange = (val: string) => {
    setMouza(val);
    if (val === 'custom') {
      setShowCustomMouza(true);
    } else {
      setShowCustomMouza(false);
    }
  };

  const handleDeedNatureChange = (val: string) => {
    setDeedNature(val);
    if (val === 'custom') {
      setShowCustomDeedNature(true);
    } else {
      setShowCustomDeedNature(false);
    }
  };

  // English to Bengali digit converter and vice-versa
  const toBnDigits = (str: string) => {
    const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return str.replace(/\d/g, (x) => bengaliDigits[parseInt(x)]);
  };

  const toEnDigits = (str: string) => {
    const englishDigits = {'০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4', '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'};
    return str.replace(/[০-৯]/g, (x) => englishDigits[x as keyof typeof englishDigits] || x);
  };

  const matchTerm = (target: string | undefined, query: string) => {
    if (!target) return false;
    const targetClean = target.toLowerCase().trim();
    const queryClean = query.toLowerCase().trim();
    
    if (targetClean.includes(queryClean)) return true;
    
    // Try convert query En -> Bn
    const queryBn = toBnDigits(queryClean);
    if (targetClean.includes(queryBn)) return true;
    
    // Try convert query Bn -> En
    const queryEn = toEnDigits(queryClean);
    if (targetClean.includes(queryEn)) return true;
    
    // Try convert target Bn -> En & query Bn -> En
    const targetEn = toEnDigits(targetClean);
    if (targetEn.includes(queryEn)) return true;
    
    return false;
  };

  const handleLookup = () => {
    const query = lookupQuery.trim();
    if (!query) {
      setLookupResult(null);
      return;
    }
    
    // Filter only previous purchase transactions to find purchased properties
    const purchases = transactions.filter(t => t.type === 'purchase');
    const matches: any[] = [];

    purchases.forEach(p => {
      p.khatians.forEach(k => {
        const kParts: string[] = [];
        if (k.csKhatian) kParts.push(`সি.এস: ${k.csKhatian}`);
        if (k.saKhatian) kParts.push(`এস.এ: ${k.saKhatian}`);
        if (k.rsKhatian) kParts.push(`আর.এস: ${k.rsKhatian}`);
        if (k.namjariKhatian) kParts.push(`নামজারী: ${k.namjariKhatian}`);
        const kLabel = kParts.join(', ');

        const kMath = 
          matchTerm(k.csKhatian, query) ||
          matchTerm(k.saKhatian, query) ||
          matchTerm(k.rsKhatian, query) ||
          matchTerm(k.namjariKhatian, query);

        k.dags.forEach(d => {
          const dParts: string[] = [];
          if (d.csDag) dParts.push(`সি.এস: ${d.csDag}`);
          if (d.saDag) dParts.push(`এস.এ: ${d.saDag}`);
          if (d.rsDag) dParts.push(`আর.এস: ${d.rsDag}`);
          const dLabel = dParts.join(', ');

          const dMath = 
            matchTerm(d.csDag, query) ||
            matchTerm(d.saDag, query) ||
            matchTerm(d.rsDag, query);

          if (kMath || dMath) {
            let totalDagPurchased = 0;
            let totalDagSold = 0;
            
            transactions.filter(t => t.mouza === p.mouza).forEach(tx => {
              tx.khatians.forEach(txK => {
                txK.dags.forEach(txD => {
                  const matchRS = d.rsDag && txD.rsDag === d.rsDag;
                  const matchCS = d.csDag && txD.csDag === d.csDag;
                  const matchSA = d.saDag && txD.saDag === d.saDag;
                  
                  if (matchRS || matchCS || matchSA) {
                    if (tx.type === 'purchase') totalDagPurchased += (Number(txD.amount) || 0);
                    if (tx.type === 'sale') totalDagSold += (Number(txD.amount) || 0);
                  }
                });
              });
            });

            const key = `${p.mouza}|${kLabel}|${dLabel}`;
            const existingMatch = matches.find((m: any) => m.key === key);

            if (existingMatch) {
              existingMatch.amount += (Number(d.amount) || 0);
            } else {
              matches.push({
                key,
                mouza: p.mouza,
                khatianNo: kLabel || '-',
                dagNo: dLabel || '-',
                amount: Number(d.amount) || 0,
                namjariAmount: d.namjariAmount || 0,
                kateAmount: d.kateAmount || 0,
                totalAmount: d.totalAmount || 0,
                dagRemaining: totalDagPurchased - totalDagSold,
                originalKhatian: k,
                originalDag: d
              });
            }
          }
        });
      });
    });

    setLookupResult({
      query,
      matches
    });
    setImportedMatchIndices([]);
  };

  const handleImportMatches = () => {
    if (!lookupResult || lookupResult.matches.length === 0) return;

    // Group matching dags by their respective distinct khatians
    const khatianGroups: { [key: string]: { khatian: any; dags: any[] } } = {};

    lookupResult.matches.forEach((m: any) => {
      const origK = m.originalKhatian;
      const origD = m.originalDag;
      if (origK && origD) {
        const key = [
          origK.csKhatian || '',
          origK.saKhatian || '',
          origK.rsKhatian || '',
          origK.namjariKhatian || ''
        ].join('|');

        if (!khatianGroups[key]) {
          khatianGroups[key] = {
            khatian: origK,
            dags: []
          };
        }

        const dKey = [
          origD.csDag || '',
          origD.saDag || '',
          origD.rsDag || ''
        ].join('|');

        if (!khatianGroups[key].dags.some((cd: any) => {
          const cdKey = [
            cd.csDag || '',
            cd.saDag || '',
            cd.rsDag || ''
          ].join('|');
          return cdKey === dKey;
        })) {
          khatianGroups[key].dags.push(origD);
        }
      }
    });

    const newImportedKhatians: KhatianInfo[] = Object.values(khatianGroups).map((group, gIdx) => {
      const origK = group.khatian;
      const newDags: DagInfo[] = group.dags.map((origD, dIdx) => ({
        id: `dag_${Date.now()}_imp_${gIdx}_${dIdx}_${Math.random().toString(36).substr(2, 4)}`,
        hasCS: origD.hasCS,
        csDag: origD.csDag || '',
        hasSA: origD.hasSA,
        saDag: origD.saDag || '',
        hasRS: origD.hasRS,
        rsDag: origD.rsDag || '',
        totalAmount: origD.totalAmount || 0,
        namjariAmount: origD.namjariAmount || 0,
        amount: origD.amount || 0
      }));

      return {
        id: `kh_${Date.now()}_imp_${gIdx}_${Math.random().toString(36).substr(2, 4)}`,
        hasCS: origK.hasCS,
        csKhatian: origK.csKhatian || '',
        hasSA: origK.hasSA,
        saKhatian: origK.saKhatian || '',
        hasRS: origK.hasRS,
        rsKhatian: origK.rsKhatian || '',
        hasNamjari: origK.hasNamjari,
        namjariKhatian: origK.namjariKhatian || '',
        dags: newDags
      };
    });

    if (newImportedKhatians.length > 0) {
      // Set Mouza from the first matched item
      const matchedMouza = lookupResult.matches[0]?.mouza;
      if (matchedMouza) {
        if (uniqueMouzas.includes(matchedMouza)) {
          setMouza(matchedMouza);
          setShowCustomMouza(false);
        } else {
          setMouza('custom');
          setCustomMouza(matchedMouza);
          setShowCustomMouza(true);
        }
      }

      const isDefaultEmpty = khatians.length === 1 && 
        !khatians[0].csKhatian && !khatians[0].saKhatian && !khatians[0].rsKhatian && !khatians[0].namjariKhatian &&
        khatians[0].dags.length === 1 &&
        !khatians[0].dags[0].csDag && !khatians[0].dags[0].saDag && !khatians[0].dags[0].rsDag &&
        khatians[0].dags[0].amount === 0;

      if (isDefaultEmpty) {
        setKhatians(newImportedKhatians);
      } else {
        const filteredImported = newImportedKhatians.filter((newK: KhatianInfo) => {
          const newKKey = [newK.csKhatian, newK.saKhatian, newK.rsKhatian, newK.namjariKhatian].join('|');
          return !khatians.some((existingK: KhatianInfo) => {
            const extKKey = [existingK.csKhatian, existingK.saKhatian, existingK.rsKhatian, existingK.namjariKhatian].join('|');
            return extKKey === newKKey;
          });
        });

        if (filteredImported.length === 0) {
          setKhatians([...khatians, ...newImportedKhatians]);
        } else {
          setKhatians([...khatians, ...filteredImported]);
        }
      }
    }
    // Close lookup popup and reset imported indices
    setLookupResult(null);
    setImportedMatchIndices([]);
  };

  const handleImportSingleMatch = (match: any, index?: number) => {
    if (typeof index === 'number') {
      setImportedMatchIndices((prev) => (prev.includes(index) ? prev : [...prev, index]));
    }
    const origK = match.originalKhatian;
    const origD = match.originalDag;
    if (!origK || !origD) return;

    const newDag: DagInfo = {
      id: `dag_${Date.now()}_imp_${Math.random().toString(36).substr(2, 4)}`,
      hasCS: origD.hasCS,
      csDag: origD.csDag || '',
      hasSA: origD.hasSA,
      saDag: origD.saDag || '',
      hasRS: origD.hasRS,
      rsDag: origD.rsDag || '',
      totalAmount: origD.totalAmount || 0,
      namjariAmount: origD.namjariAmount || 0,
      amount: origD.amount || 0
    };

    const newKhatian: KhatianInfo = {
      id: `kh_${Date.now()}_imp_${Math.random().toString(36).substr(2, 4)}`,
      hasCS: origK.hasCS,
      csKhatian: origK.csKhatian || '',
      hasSA: origK.hasSA,
      saKhatian: origK.saKhatian || '',
      hasRS: origK.hasRS,
      rsKhatian: origK.rsKhatian || '',
      hasNamjari: origK.hasNamjari,
      namjariKhatian: origK.namjariKhatian || '',
      dags: [newDag]
    };

    const matchedMouza = match.mouza;
    if (matchedMouza) {
      if (uniqueMouzas.includes(matchedMouza)) {
        setMouza(matchedMouza);
        setShowCustomMouza(false);
      } else {
        setMouza('custom');
        setCustomMouza(matchedMouza);
        setShowCustomMouza(true);
      }
    }

    const isDefaultEmpty = khatians.length === 1 && 
      !khatians[0].csKhatian && !khatians[0].saKhatian && !khatians[0].rsKhatian && !khatians[0].namjariKhatian &&
      khatians[0].dags.length === 1 &&
      !khatians[0].dags[0].csDag && !khatians[0].dags[0].saDag && !khatians[0].dags[0].rsDag &&
      khatians[0].dags[0].amount === 0;

    if (isDefaultEmpty) {
      setKhatians([newKhatian]);
    } else {
      setKhatians([...khatians, newKhatian]);
    }
  };

  // Add new Khatian
  const handleAddKhatian = () => {
    const khatianId = `kh_${Date.now()}`;
    const initialDag: DagInfo = {
      id: `dag_${Date.now()}_0`,
      hasCS: false,
      csDag: '',
      hasSA: false,
      saDag: '',
      hasRS: true,
      rsDag: '',
      totalAmount: 0,
      namjariAmount: 0,
      amount: 0
    };

    const newKh: KhatianInfo = {
      id: khatianId,
      hasCS: false,
      csKhatian: '',
      hasSA: false,
      saKhatian: '',
      hasRS: true,
      rsKhatian: '',
      hasNamjari: false,
      namjariKhatian: '',
      dags: [initialDag]
    };

    setKhatians([...khatians, newKh]);
    
    setKhatianFeedback(true);
    setTimeout(() => setKhatianFeedback(false), 1500);
  };

  // Remove Khatian
  const handleRemoveKhatian = (khId: string) => {
    if (khatians.length <= 1) {
      alert('ন্যূনতম ১ টি খতিয়ান বিবরণী থাকতে হবে।');
      return;
    }
    setKhatians(khatians.filter((k) => k.id !== khId));
  };

  // Update Khatian fields
  const handleUpdateKhatian = (khId: string, fields: Partial<KhatianInfo>) => {
    setKhatians(
      khatians.map((k) => (k.id === khId ? { ...k, ...fields } : k))
    );
  };

  // Add Dag to specific Khatian
  const handleAddDag = (khId: string) => {
    setKhatians(
      khatians.map((k) => {
        if (k.id !== khId) return k;
        
        const newDag: DagInfo = {
          id: `dag_${Date.now()}_${k.dags.length}`,
          hasCS: false,
          csDag: '',
          hasSA: false,
          saDag: '',
          hasRS: true,
          rsDag: '',
          totalAmount: 0,
          namjariAmount: 0,
          amount: 0
        };

        return { ...k, dags: [...k.dags, newDag] };
      })
    );
    
    setDagFeedbackId(khId);
    setTimeout(() => setDagFeedbackId(null), 1500);
  };

  // Remove Dag from specific Khatian
  const handleRemoveDag = (khId: string, dagId: string) => {
    setKhatians(
      khatians.map((k) => {
        if (k.id !== khId) return k;
        if (k.dags.length <= 1) {
          alert('প্রতিটি খতিয়ানে ন্যূনতম ১ টি দাগ থাকতে হবে।');
          return k;
        }
        return { ...k, dags: k.dags.filter((d) => d.id !== dagId) };
      })
    );
  };

  // Update Dag fields
  const handleUpdateDag = (khId: string, dagId: string, fields: Partial<DagInfo>) => {
    setKhatians(
      khatians.map((k) => {
        if (k.id !== khId) return k;
        return {
          ...k,
          dags: k.dags.map((d) => (d.id === dagId ? { ...d, ...fields } : d))
        };
      })
    );
  };

  // Handle Drive Link attachments
  const handleAddLinkAttachment = () => {
    if (!linkUrl.trim()) return;
    const newAtt: Attachment = {
      id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name: linkTitle.trim() || 'Document Link',
      type: 'link',
      size: 0,
      url: linkUrl.trim()
    };
    setAttachments((prev) => [...prev, newAtt]);
    setLinkTitle('');
    setLinkUrl('');
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments(attachments.filter((a) => a.id !== id));
  };

  // Complete submission handler with logic gates validations
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText(null);

    const activeMouzaName = showCustomMouza ? customMouza.trim() : mouza;
    const activeDeedNature = showCustomDeedNature ? customDeedNature.trim() : deedNature;

    if (!deedNumber.trim()) {
      setErrorText('ত্রুটিঃ দলিল নম্বর প্রদান করা আবশ্যক।');
      return;
    }

    if (!activeMouzaName) {
      setErrorText('ত্রুটিঃ মৌজার নাম সিলেক্ট করা বা লিখা আবশ্যক।');
      return;
    }

    if (!buyerName.trim() || !sellerName.trim()) {
      setErrorText('ত্রুটিঃ ক্রেতা এবং বিক্রেতা উভয়ের নাম আবশ্যক।');
      return;
    }

    // Check numbers consistency
    if (totalLandAmount <= 0) {
      setErrorText('ত্রুটিঃ সংশ্লিষ্ট দাগ সমূহের মোট জমির পরিমাণ শূন্য হতে পারে না।');
      return;
    }

    if (transactionAmount <= 0) {
      setErrorText('ত্রুটিঃ এই লেনদেনের মোট পরিমাণ ০ শতক হতে পারে না। দাগের জিমির পরিমাণ সমূহ চেক করুন।');
      return;
    }

    // Validate if individual dags or khatians are empty
    let hasValidationError = false;
    khatians.forEach((kh) => {
      const hasKhNumber = kh.csKhatian?.trim() || kh.saKhatian?.trim() || kh.rsKhatian?.trim() || kh.namjariKhatian?.trim();
      if (!hasKhNumber) {
        setErrorText('ত্রুটিঃ খতিয়ান নম্বর খালি রাখা যাবে না। অন্তত যেকোনো ১টি খতিয়ান নম্বর (সি.এস/এস.এ/আর.এস/নামজারী) প্রদান করুন।');
        hasValidationError = true;
      }

      kh.dags.forEach((d) => {
        const hasDagNumber = d.csDag?.trim() || d.saDag?.trim() || d.rsDag?.trim();
        if (!hasDagNumber) {
          setErrorText('ত্রুটিঃ দাগ নম্বর খালি রাখা যাবে না। অন্তত যেকোনো ১টি দাগ নম্বর (সি.এস/এস.এ/আর.এস) প্রদান করুন।');
          hasValidationError = true;
        }

        if (d.amount <= 0) {
          setErrorText('ত্রুটিঃ দাগের সংশ্লিষ্ট ক্রয় বা বিক্রয়ের পরিমাণ শূন্য হতে পারে না।');
          hasValidationError = true;
        }

        if (type === 'sale') {
          let foundPurchase = false;
          for (const tx of transactions) {
            if (tx.type === 'purchase' && tx.mouza === activeMouzaName && tx.id !== editingTransaction?.id) {
               const boughtDags = tx.khatians.flatMap(k => k.dags);
               for (const bd of boughtDags) {
                 if (
                   (d.csDag && bd.csDag && bd.csDag.trim() === d.csDag.trim()) ||
                   (d.saDag && bd.saDag && bd.saDag.trim() === d.saDag.trim()) ||
                   (d.rsDag && bd.rsDag && bd.rsDag.trim() === d.rsDag.trim())
                 ) {
                   foundPurchase = true;
                   break;
                 }
               }
            }
            if (foundPurchase) break;
          }

          const hasDagName = d.csDag?.trim() || d.saDag?.trim() || d.rsDag?.trim();
          if (!foundPurchase && hasDagName) {
            setErrorText('ত্রুটিঃ জমি ক্রয় নাই। আপনি এমন দাগ বিক্রয় করতে পারবেন না যা পূর্বে ক্রয় করা হয়নি।');
            hasValidationError = true;
          }
        }
      });
    });

    if (hasValidationError) return;

    setIsSubmitting(true);

    const savedTx: LandTransaction = {
      id: editingTransaction ? editingTransaction.id : `tx_${Date.now()}`,
      type,
      deedNumber: deedNumber.trim(),
      deedNature: activeDeedNature,
      date,
      mouza: activeMouzaName,
      buyerName: buyerName.trim(),
      sellerName: sellerName.trim(),
      totalLandAmount,
      namjariLandAmount,
      transactionAmount,
      khatians,
      attachments,
      notes: notes.trim()
    };

    // Auto delay simulated submittor to create micro feedback rhythm
    setTimeout(() => {
      try {
        onSave(savedTx);
      } catch (error) {
        console.error('Error saving transaction:', error);
      } finally {
        setIsSubmitting(false);
      }
    }, 450);
  };

  const remainingTokens = currentUser?.isAdmin ? 999999 : (currentUser?.tokenLimit || 0) - transactions.length;

  if (remainingTokens <= 0 && !editingTransaction && !currentUser?.isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl shadow-sm border border-rose-100 text-center animate-in fade-in zoom-in duration-300 my-4">
         <AlertTriangle size={64} className="text-rose-500 mb-4 animate-bounce" />
         <h2 className="text-2xl font-black text-slate-800 mb-2">টোকেন লিমিট শেষ!</h2>
         <p className="text-slate-500 text-sm max-w-md mx-auto mb-6 leading-relaxed">
           আপনার অ্যাকাউন্টে ডাটা এন্ট্রির জন্য কোনো টোকেন অবশিষ্ট নেই। নতুন দলিল এন্ট্রি করতে দয়া করে এডমিন এর সাথে যোগাযোগ করুন এবং .tok ফাইল সংগ্রহ করে আপনার প্রোফাইল থেকে রিচার্জ করুন।
         </p>
         <button onClick={onCancelEdit} className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer">
           ফিরে যান
         </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-sm font-semibold text-slate-900 font-sans">
      {/* feedback message warning */}
      {errorText && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl flex items-start gap-2 max-w-3xl animate-shake">
          <AlertTriangle size={18} className="shrink-0 mt-0.5 text-rose-600" />
          <p className="font-bold leading-relaxed">{errorText}</p>
        </div>
      )}

      {/* MODAL HEADER with SEARCH BAR and CLOSE BUTTON */}
      <div className={`flex items-center justify-between border-b border-slate-300 pb-4 sticky -top-6 z-20 -mx-6 px-6 pt-6 shadow-sm ${type === 'purchase' ? 'bg-emerald-50' : 'bg-rose-50'}`}>
        {/* Left Side: Title */}
        <div>
          <h2 className="text-lg font-bold text-slate-900 font-sans flex items-center gap-2">
            {type === 'purchase' ? (
              <PlusCircle size={18} className="text-teal-600 animate-pulse" />
            ) : (
              <MinusCircle size={18} className="text-rose-600 animate-pulse" />
            )}
            {editingTransaction 
              ? (type === 'purchase' ? 'ভূমি ক্রয় হিসাব সম্পাদনা (ইডিট)' : 'ভূমি বিক্রয় হিসাব সম্পাদনা (ইডিট)')
              : (type === 'purchase' ? (
                <>
                  <span className="hidden md:inline">নতুন ভূমি ক্রয় হিসাব ও খতিয়ান বিবরণী সংযুক্তি</span>
                  <span className="md:hidden">ভূমি ক্রয় সংযুক্ত</span>
                </>
              ) : (
                <>
                  <span className="hidden md:inline">নতুন ভূমি বিক্রয় হিসাব ও বিবরণী সংযুক্তি</span>
                  <span className="md:hidden">ভূমি বিক্রয় সংযুক্ত</span>
                </>
              ))}
          </h2>
          <p className="text-xs text-slate-500 mt-1 hidden md:block">
            {type === 'purchase' 
              ? 'সঠিক দলিল ও খতিয়ান তথ্য দিয়ে নিচের ফর্মটি পূরণ করুন।' 
              : 'সব রেকর্ড যাচাই করে নিচের বিক্রয় ফর্মটি পূরণ করুন।'}
          </p>
        </div>

        {/* Right Side: Close Button */}
        <div className="flex items-center gap-3">

          {/* Close Button */}
          <button
            type="button"
            onClick={onCancelEdit}
            className="px-3.5 py-1.5 text-xs text-rose-50 hover:text-white bg-rose-500 hover:bg-rose-600 rounded-lg font-bold transition cursor-pointer select-none flex items-center gap-1 shadow-sm h-8"
          >
            <X size={15} /> বন্ধ করুন
          </button>
        </div>
      </div>

      {/* Lookup search result display container */}
      {lookupResult && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className={`rounded-2xl border border-slate-200 shadow-2xl p-6 w-full max-w-5xl animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col ${type === 'purchase' ? 'bg-emerald-50' : 'bg-rose-50'}`}>
            <div className="flex items-center justify-between border-b pb-3 border-slate-200 shrink-0 mb-4">
              <h5 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 size={18} className="text-emerald-600" />
                "{lookupResult.query}" এর জন্য পূর্বের রেকর্ড
              </h5>
              <button
                type="button"
                onClick={() => {
                  setLookupResult(null);
                  setImportedMatchIndices([]);
                }}
                className="text-slate-500 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 pr-1">
              {lookupResult.matches.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-base font-medium">
                  কোনো রেকর্ড পাওয়া যায়নি।
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm bg-white">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-200">
                        <tr>
                          <th className="p-3 border-r border-slate-200 text-center">মৌজার নাম</th>
                          <th className="p-3 border-r border-slate-200 text-center">খতিয়ান নম্বর</th>
                          <th className="p-3 border-r border-slate-200 text-center">সংশ্লিষ্ট দাগ</th>
                          <th className="p-3 border-r border-slate-200 text-center">দাগের মোট জমি</th>
                          <th className="p-3 border-r border-slate-200 text-center">নামজারী/কাতে</th>
                          <th className="p-3 text-center border-r border-slate-200 text-emerald-950 bg-emerald-50/50 font-extrabold">
                            {type === 'purchase' ? 'ক্রয়কৃত জমি' : 'বিক্রীত জমি'}
                          </th>
                          <th className="p-3 border-r border-slate-200 text-center font-extrabold text-blue-900 bg-blue-50/50">
                            অবশিষ্ট জমি
                          </th>
                          <th className="p-3 text-center font-extrabold text-slate-700 bg-slate-50 border-slate-200">
                            অ্যাকশন
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {lookupResult.matches.map((m, idx) => {
                          const isImported = importedMatchIndices.includes(idx);
                          return (
                            <tr key={idx} className="hover:bg-slate-50 text-slate-800">
                              <td className="p-3 border-r border-slate-200 whitespace-nowrap align-middle text-center">
                                {m.mouza.replace(/\s*মৌজা\s*$/, '')}
                              </td>
                              <td className="p-3 border-r border-slate-200 font-bold whitespace-nowrap">
                                {toBengaliNumber(m.khatianNo)}
                              </td>
                              <td className="p-3 border-r border-slate-200 font-bold text-slate-900 whitespace-nowrap">
                                {toBengaliNumber(m.dagNo)}
                              </td>
                              <td className="p-3 border-r border-slate-200 text-right font-mono font-medium whitespace-nowrap">
                                {toBengaliNumber(m.totalAmount)} শতক
                              </td>
                              <td className="p-3 border-r border-slate-200 text-right font-mono font-medium whitespace-nowrap">
                                {toBengaliNumber(m.namjariAmount || m.kateAmount || 0)} শতক
                              </td>
                              <td className="p-3 border-r border-slate-200 text-right font-mono text-emerald-900 bg-emerald-50/30 font-bold whitespace-nowrap">
                                {toBengaliNumber(m.amount)} শতক
                              </td>
                              <td className="p-3 border-r border-slate-200 text-right font-mono text-blue-900 bg-blue-50/30 font-bold whitespace-nowrap">
                                {toBengaliNumber(m.dagRemaining)} শতক
                              </td>
                              <td className="p-2 text-center align-middle whitespace-nowrap">
                                {isImported ? (
                                  <button
                                    type="button"
                                    disabled
                                    className="bg-emerald-600 text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center justify-center gap-1 cursor-default mx-auto shadow-xs select-none"
                                    title="যুক্ত করা হয়েছে"
                                  >
                                    <Check size={14} className="stroke-[2.5]" />
                                    যুক্ত হয়েছে
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleImportSingleMatch(m, idx)}
                                    className="bg-emerald-100 hover:bg-emerald-600 text-emerald-800 hover:text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition mx-auto shadow-sm active:scale-95 select-none"
                                  >
                                    <Plus size={14} />
                                    যুক্ত করুন
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end pt-3 pb-1">
                    <button
                      type="button"
                      onClick={handleImportMatches}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 hover:shadow-md cursor-pointer select-none transition-all duration-150 active:scale-95"
                    >
                      <PlusCircle size={18} className="text-white shrink-0" />
                      <span>সকল তথ্য যুক্ত করুন</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 1: General Info */}
      <div className="bg-slate-50/50 p-4 md:p-6 rounded-2xl border border-slate-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8">
          
          {/* Row 1 */}
          <div className="space-y-1.5">
            <label className="text-slate-700 font-bold text-xs md:text-sm">রেজিস্ট্রেশন বা দলিলের তারিখ</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                <Calendar size={14} />
              </span>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-sm font-semibold pl-9 pr-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 h-10 text-slate-900 shadow-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-700 font-bold text-xs md:text-sm">দলিলের প্রকৃতি</label>
            <div className="flex gap-1 pt-0.5">
              <select
                value={deedNature}
                onChange={(e) => handleDeedNatureChange(e.target.value)}
                className={`${showCustomDeedNature ? 'w-1/2' : 'w-full'} text-sm font-semibold px-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 h-10 text-slate-900 shadow-sm`}
              >
                {uniqueDeedNatures.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
                <option value="custom">নতুন ধরণ লিখুন...</option>
              </select>
              {showCustomDeedNature && (
                <input
                  type="text"
                  placeholder="লিখুন..."
                  value={customDeedNature}
                  onChange={(e) => setCustomDeedNature(e.target.value)}
                  className="w-1/2 text-sm font-semibold px-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 font-sans h-10 text-slate-900 placeholder:text-slate-400 shadow-sm"
                />
              )}
            </div>
          </div>

          {/* Row 2 */}
          <div className="space-y-1.5">
            <label className="text-slate-700 font-bold text-xs md:text-sm">দলিল নম্বর (আবশ্যক)</label>
            <input
              type="text"
              required
              value={deedNumber}
              onChange={(e) => setDeedNumber(e.target.value)}
              className="w-full text-sm font-semibold px-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 h-10 text-slate-900 shadow-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-700 font-bold text-xs md:text-sm">ভূমি গ্রহীতা / ক্রেতা নাম (Buyer)</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                <User size={14} />
              </span>
              <input
                type="text"
                required
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                readOnly={type === 'purchase' && currentUser?.userType === 'company'}
                className={`w-full text-sm font-semibold pl-9 pr-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 h-10 text-slate-900 shadow-sm ${type === 'purchase' && currentUser?.userType === 'company' ? 'opacity-80 bg-slate-50 cursor-not-allowed' : ''}`}
              />
            </div>
          </div>

          {/* Row 3 */}
          <div className="space-y-1.5">
            <label className="text-slate-700 font-bold text-xs md:text-sm">ভূমি দাতা / বিক্রেতা নাম (Seller)</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                <User size={14} />
              </span>
              <input
                type="text"
                required
                value={sellerName}
                onChange={(e) => setSellerName(e.target.value)}
                readOnly={type === 'sale' && currentUser?.userType === 'company'}
                className={`w-full text-sm font-semibold pl-9 pr-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 h-10 text-slate-900 shadow-sm ${type === 'sale' && currentUser?.userType === 'company' ? 'opacity-80 bg-slate-50 cursor-not-allowed' : ''}`}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-700 font-bold text-xs md:text-sm flex items-center gap-1.5"><MapPin size={15} className="text-emerald-600"/> মৌজার নাম নির্বাচন করুন</label>
            <div className="flex gap-1 pt-0.5">
              <select
                value={mouza}
                onChange={(e) => handleMouzaChange(e.target.value)}
                className={`${showCustomMouza ? 'w-1/2' : 'w-full'} text-sm font-semibold px-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 h-10 text-slate-900 shadow-sm`}
              >
                {uniqueMouzas.map((m) => (
                  <option key={m} value={m}>
                    {m.replace(/\s*মৌজা\s*$/, '')}
                  </option>
                ))}
                <option value="custom">নতুন মৌজার নাম লিখুন...</option>
              </select>

              {showCustomMouza && (
                <input
                  type="text"
                  placeholder="নতুন মৌজার নাম..."
                  value={customMouza}
                  onChange={(e) => setCustomMouza(e.target.value)}
                  className="w-1/2 text-sm font-semibold px-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 font-sans h-10 text-slate-900 placeholder:text-slate-400 shadow-sm"
                />
              )}
            </div>
          </div>
          
        </div>
      </div>

      {/* SECTION 3: Mouza and Khatian details */}
      <div className="mt-10 border-t-2 border-dashed border-slate-200 pt-8 space-y-8">
        
        {/* Structured Khatians and Dags */}
        <div className="space-y-4 pt-2">
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-4 md:pb-2 border-slate-200 gap-4">
            <span className="text-sm font-extrabold text-slate-800 flex justify-center md:justify-start items-center gap-1.5 text-center md:text-left">
              <PlusCircle size={18} className="text-emerald-700 hidden md:block" />
              দলিল সংশ্লিষ্ট খতিয়ান ও সংশ্লিষ্ট দাগ বিবরণ
            </span>
          
            <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
              {/* Search Bar */}
              <div className="flex gap-1.5 items-center bg-white border border-emerald-200 p-1 rounded-xl shadow-sm w-full md:max-w-sm">
                <Search size={16} className="text-emerald-600 ml-2 shrink-0" />
                <input
                  type="text"
                  placeholder="দাগ বা খতিয়ান নম্বর দিয়ে যাচাই করুন..."
                  value={lookupQuery}
                  onChange={(e) => {
                    setLookupQuery(e.target.value);
                    if (!e.target.value) setLookupResult(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleLookup();
                    }
                  }}
                  className="flex-grow text-xs font-semibold px-2 bg-transparent focus:outline-none font-sans h-8 text-slate-950 placeholder:text-slate-400 w-full md:w-48"
                />
                <button
                  type="button"
                  onClick={handleLookup}
                  className="shrink-0 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-extrabold text-[11px] px-3 rounded-lg flex items-center justify-center gap-1 hover:shadow-xs cursor-pointer select-none transition-all duration-150 active:scale-95 whitespace-nowrap h-8"
                >
                  জমি খুজুন
                </button>
              </div>

              <button
                type="button"
                onClick={handleAddKhatian}
                className={`${khatians.length > 0 ? 'hidden md:flex' : 'flex'} shrink-0 px-4 py-2 ${khatianFeedback ? 'bg-emerald-800 scale-95 ring-2 ring-emerald-300' : 'bg-emerald-600 hover:bg-emerald-800'} text-white font-bold text-xs rounded-xl items-center justify-center gap-1 cursor-pointer transition-all duration-200 shadow-xs select-none h-10 w-full md:w-auto`}
              >
                {khatianFeedback ? <Check size={12} /> : <Plus size={12} />}
                {khatianFeedback ? 'খতিয়ান যুক্ত হয়েছে!' : 'নতুন খতিয়ান যোগ করুন'}
              </button>
            </div>
          </div>

        <div className="space-y-5">
          {khatians.map((kh, khIdx) => (
            <div key={kh.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 md:p-5 space-y-4 relative">
              <button
                type="button"
                onClick={() => handleRemoveKhatian(kh.id)}
                className="absolute top-3 right-3 md:top-4 md:right-4 text-rose-500 hover:text-rose-700 hover:bg-white p-1.5 md:p-2 rounded-lg border border-transparent hover:border-slate-200 shadow-xs cursor-pointer select-none z-10"
                title="খতিয়ানটি মুছে দিন"
              >
                <Trash2 size={14} />
              </button>

              <div className="font-extrabold text-slate-800 text-xs border-b border-dashed pb-2 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 bg-slate-200/40 px-2 py-1 pr-10 md:pr-2 rounded">
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="bg-emerald-700 text-white rounded px-2 py-0.5 text-sm md:text-[15px] uppercase font-mono">খতিয়ান #{khIdx + 1}</span>
                  <span className="hidden sm:inline">খতিয়ান নম্বর সংযুক্তি বিবরণী</span>
                  <span className="sm:hidden text-[10px]">সংযুক্তি বিবরণী</span>
                </div>
                
                {khIdx === 0 && (
                  <button
                    type="button"
                    onClick={handleAddKhatian}
                    className={`md:hidden shrink-0 px-2.5 py-1 ${khatianFeedback ? 'bg-emerald-800 scale-95 ring-2 ring-emerald-300' : 'bg-emerald-600 hover:bg-emerald-800'} text-white font-bold text-[10px] rounded flex items-center justify-center gap-1 cursor-pointer transition-all duration-200 shadow-xs select-none`}
                  >
                    {khatianFeedback ? <Check size={10} /> : <Plus size={10} />}
                    {khatianFeedback ? 'যুক্ত হয়েছে!' : 'নতুন খতিয়ান'}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                {/* CS */}
                <div className="space-y-1 p-2 border rounded-lg border-slate-200 flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={kh.hasCS}
                    onChange={(e) => handleUpdateKhatian(kh.id, { hasCS: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 cursor-pointer"
                    id={`kh-cs-${kh.id}`}
                  />
                  <div className="flex-1 space-y-1">
                    <label htmlFor={`kh-cs-${kh.id}`} className="block text-xs font-extrabold text-slate-700 cursor-pointer">সি.এস খতিয়ান</label>
                    <input
                      type="text"
                      disabled={!kh.hasCS}
                      placeholder="নম্বর লিখুন..."
                      value={kh.csKhatian || ''}
                      onChange={(e) => handleUpdateKhatian(kh.id, { csKhatian: e.target.value })}
                      className="w-full text-xs font-bold px-2 py-1.5 border border-slate-300 rounded-md disabled:bg-slate-50 text-slate-900 placeholder:text-slate-400 h-8"
                    />
                  </div>
                </div>

                {/* SA */}
                <div className="space-y-1 p-2 border rounded-lg border-slate-200 flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={kh.hasSA}
                    onChange={(e) => handleUpdateKhatian(kh.id, { hasSA: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 cursor-pointer"
                    id={`kh-sa-${kh.id}`}
                  />
                  <div className="flex-1 space-y-1">
                    <label htmlFor={`kh-sa-${kh.id}`} className="block text-xs font-extrabold text-slate-700 cursor-pointer">এস.এ খতিয়ান</label>
                    <input
                      type="text"
                      disabled={!kh.hasSA}
                      placeholder="নম্বর লিখুন..."
                      value={kh.saKhatian || ''}
                      onChange={(e) => handleUpdateKhatian(kh.id, { saKhatian: e.target.value })}
                      className="w-full text-xs font-bold px-2 py-1.5 border border-slate-300 rounded-md disabled:bg-slate-50 text-slate-900 placeholder:text-slate-400 h-8"
                    />
                  </div>
                </div>

                {/* RS */}
                <div className="space-y-1 p-2 border rounded-lg border-slate-200 flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={kh.hasRS}
                    onChange={(e) => handleUpdateKhatian(kh.id, { hasRS: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 cursor-pointer"
                    id={`kh-rs-${kh.id}`}
                  />
                  <div className="flex-1 space-y-1">
                    <label htmlFor={`kh-rs-${kh.id}`} className="block text-xs font-extrabold text-slate-700 cursor-pointer">আর.এস খতিয়ান</label>
                    <input
                      type="text"
                      disabled={!kh.hasRS}
                      placeholder="নম্বর লিখুন..."
                      value={kh.rsKhatian || ''}
                      onChange={(e) => handleUpdateKhatian(kh.id, { rsKhatian: e.target.value })}
                      className="w-full text-xs font-bold px-2 py-1.5 border border-slate-300 rounded-md disabled:bg-slate-50 text-slate-900 placeholder:text-slate-400 h-8"
                    />
                  </div>
                </div>

                {/* Namjari */}
                <div className="space-y-1 p-2 border rounded-lg border-slate-200 flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={kh.hasNamjari}
                    onChange={(e) => handleUpdateKhatian(kh.id, { hasNamjari: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 cursor-pointer"
                    id={`kh-nam-${kh.id}`}
                  />
                  <div className="flex-1 space-y-1">
                    <label htmlFor={`kh-nam-${kh.id}`} className="block text-xs font-extrabold text-slate-700 cursor-pointer">নামজারী খতিয়ান</label>
                    <input
                      type="text"
                      disabled={!kh.hasNamjari}
                      placeholder="নম্বর লিখুন..."
                      value={kh.namjariKhatian || ''}
                      onChange={(e) => handleUpdateKhatian(kh.id, { namjariKhatian: e.target.value })}
                      className="w-full text-xs font-bold px-2 py-1.5 border border-slate-300 rounded-md disabled:bg-slate-50 text-slate-900 placeholder:text-slate-400 h-8"
                    />
                  </div>
                </div>
              </div>

              {/* Dags List */}
              <div className="space-y-3 mt-4 pt-2 pl-6 border-l-2 border-dashed border-emerald-300 relative ml-2 md:ml-4">
                <div className="flex items-center justify-between border-b pb-1 border-slate-300 relative">
                  <span className="text-[12px] font-extrabold text-slate-800 flex items-center gap-1.5">
                    <div className="w-6 h-px bg-emerald-300 absolute -left-6 top-1/2"></div>
                    খতিয়ানের অন্তর্ভুক্ত দাগ সমূহের তালিকা
                  </span>
                  <button
                    type="button"
                    onClick={() => handleAddDag(kh.id)}
                    className={`flex items-center gap-1 ${dagFeedbackId === kh.id ? 'bg-emerald-100 border-emerald-400 text-emerald-800 scale-95' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'} font-bold text-xs border px-3 py-1.5 rounded-lg hover:shadow-xs transition-all duration-200 select-none cursor-pointer relative z-10`}
                  >
                    {dagFeedbackId === kh.id ? <Check size={12} className="text-emerald-600" /> : <Plus size={12} className="text-slate-700" />}
                    <span>{dagFeedbackId === kh.id ? 'যুক্ত হয়েছে!' : 'দাগ যোগ করুন'}</span>
                  </button>
                </div>

                <div className="space-y-4 pt-2">
                  {kh.dags.map((dag, dagIdx) => (
                    <div key={dag.id} className="grid grid-cols-1 xl:grid-cols-12 gap-3 items-end bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm relative ml-2">
                      {/* Connection notch for dag */}
                      <div className="absolute -left-8 top-6 w-8 h-px bg-emerald-300 hidden md:block"></div>
                      <div className="absolute -left-[37px] top-6 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white shadow-sm z-10 hidden md:block"></div>
                      
                      {/* Checkboxes for dag */}
                      <div className="xl:col-span-7 grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-4">
                        {/* CS */}
                        <div className="flex items-center gap-1.5 p-1 border border-slate-200 rounded bg-slate-50/50">
                          <input
                            type="checkbox"
                            checked={dag.hasCS}
                            className="w-4 h-4 cursor-pointer text-emerald-600 shrink-0"
                            onChange={(e) => handleUpdateDag(kh.id, dag.id, { hasCS: e.target.checked })}
                            id={`dag-cs-${dag.id}`}
                          />
                          <div className="flex-1 min-w-0">
                            <label htmlFor={`dag-cs-${dag.id}`} className="text-[11px] text-slate-700 block font-extrabold font-sans">সি.এস দাগ</label>
                            <input
                              type="text"
                              disabled={!dag.hasCS}
                              placeholder="নম্বর..."
                              value={dag.csDag || ''}
                              onChange={(e) => handleUpdateDag(kh.id, dag.id, { csDag: e.target.value })}
                              className="w-full px-1.5 border border-slate-400 disabled:bg-slate-50 text-xs font-bold text-slate-900 h-9 rounded"
                            />
                          </div>
                        </div>

                        {/* SA */}
                        <div className="flex items-center gap-1.5 p-1 border border-slate-200 rounded bg-slate-50/50">
                          <input
                            type="checkbox"
                            checked={dag.hasSA}
                            className="w-4 h-4 cursor-pointer text-emerald-600 shrink-0"
                            onChange={(e) => handleUpdateDag(kh.id, dag.id, { hasSA: e.target.checked })}
                            id={`dag-sa-${dag.id}`}
                          />
                          <div className="flex-1 min-w-0">
                            <label htmlFor={`dag-sa-${dag.id}`} className="text-[11px] text-slate-700 block font-extrabold font-sans">এস.এ দাগ</label>
                            <input
                              type="text"
                              disabled={!dag.hasSA}
                              placeholder="নম্বর..."
                              value={dag.saDag || ''}
                              onChange={(e) => handleUpdateDag(kh.id, dag.id, { saDag: e.target.value })}
                              className="w-full px-1.5 border border-slate-400 disabled:bg-slate-50 text-xs font-bold text-slate-900 h-9 rounded"
                            />
                          </div>
                        </div>

                        {/* RS */}
                        <div className="flex items-center gap-1.5 p-1 border border-slate-200 rounded bg-slate-50/50">
                          <input
                            type="checkbox"
                            checked={dag.hasRS}
                            className="w-4 h-4 cursor-pointer text-emerald-600 shrink-0"
                            onChange={(e) => handleUpdateDag(kh.id, dag.id, { hasRS: e.target.checked })}
                            id={`dag-rs-${dag.id}`}
                          />
                          <div className="flex-1 min-w-0">
                            <label htmlFor={`dag-rs-${dag.id}`} className="text-[11px] text-slate-700 block font-extrabold font-sans">আর.এস দাগ</label>
                            <input
                              type="text"
                              disabled={!dag.hasRS}
                              placeholder="নম্বর..."
                              value={dag.rsDag || ''}
                              onChange={(e) => handleUpdateDag(kh.id, dag.id, { rsDag: e.target.value })}
                              className="w-full px-1.5 border border-slate-400 disabled:bg-slate-50 text-xs font-bold text-slate-900 h-9 rounded"
                            />
                          </div>
                        </div>

                        {/* Land Class */}
                        <div className="flex flex-col justify-end p-1">
                          <label className="text-[11px] text-slate-700 block font-extrabold font-sans mb-0.5">জমির শ্রেণী</label>
                          <LandClassSelector
                            landClass={dag.landClass}
                            onChange={(val) => handleUpdateDag(kh.id, dag.id, { landClass: val })}
                          />
                        </div>
                      </div>

                      {/* Amounts */}
                      <div className="xl:col-span-5 grid grid-cols-1 md:grid-cols-7 gap-2 md:gap-4 mt-2 md:mt-0">
                        <div className="md:col-span-2">
                          <label className="text-[11px] text-slate-700 block font-extrabold mb-0.5 whitespace-nowrap overflow-hidden text-ellipsis">মোট পরিমান(শ.)</label>
                          <input
                            type="number"
                            step="any"
                            required
                            value={dag.totalAmount || ''}
                            onChange={(e) => handleUpdateDag(kh.id, dag.id, { totalAmount: parseFloat(e.target.value) || 0 })}
                            className="w-full text-xs font-bold px-2 border border-slate-400 h-9 rounded text-slate-900"
                          />
                        </div>
                        
                        <div className="md:col-span-2">
                          <label className="text-[11px] text-slate-700 block font-extrabold mb-0.5 whitespace-nowrap overflow-hidden text-ellipsis">
                            {kh.hasNamjari ? 'নামজারীকৃত(শ.)' : 'কাতে পরিমান(শ.)'}
                          </label>
                          <input
                            type="number"
                            step="any"
                            required
                            value={kh.hasNamjari ? (dag.namjariAmount || '') : (dag.kateAmount || '')}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              if (kh.hasNamjari) {
                                handleUpdateDag(kh.id, dag.id, { namjariAmount: val, kateAmount: 0 });
                              } else {
                                handleUpdateDag(kh.id, dag.id, { kateAmount: val, namjariAmount: 0 });
                              }
                            }}
                            className="w-full text-xs font-bold px-2 border border-slate-400 h-9 rounded text-slate-900"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="text-[11px] text-slate-700 block font-extrabold mb-0.5 whitespace-nowrap overflow-hidden text-ellipsis">
                            {type === 'purchase' ? 'ক্রয়কৃত(শ.)' : 'বিক্রীত(শ.)'}
                          </label>
                          <input
                            type="number"
                            step="any"
                            required
                            value={dag.amount || ''}
                            onChange={(e) => handleUpdateDag(kh.id, dag.id, { amount: parseFloat(e.target.value) || 0 })}
                            className="w-full text-xs font-bold px-2 border border-slate-500 h-9 rounded text-slate-900 bg-emerald-50 focus:bg-white"
                          />
                        </div>

                        <div className="md:col-span-1 flex items-end justify-end md:justify-start">
                          <button
                            type="button"
                            onClick={() => handleRemoveDag(kh.id, dag.id)}
                            className="text-rose-500 hover:text-rose-700 p-1.5 border border-transparent hover:border-slate-200 rounded cursor-pointer transition flex items-center h-9 justify-center shrink-0 w-full"
                            title="দাগ ডিলিট দিন"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grid container to make Scans + Remarks on Left, and Totals Summary Box on Right in one line */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-4">
        
        {/* Left column: Scans Upload + Remarks notes */}
        <div className="lg:col-span-7 space-y-4">
          {/* File Scans Upload panel */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
            <div className="border-b pb-1.5 border-slate-200 font-extrabold text-xs text-slate-800 flex items-center gap-1.5">
              <FileCheck size={15} className="text-teal-600" />
              দলিলের স্ক্যান কপি বা মূল দলিল ছবি সংযুক্তি
            </div>

            {/* Drive Link Input Zone */}
            <div className="border border-slate-300 rounded-xl p-4 space-y-3 bg-slate-50/50">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">ফাইলের নাম/শিরোনাম (ঐচ্ছিক)</label>
                  <input
                    type="text"
                    value={linkTitle}
                    onChange={(e) => setLinkTitle(e.target.value)}
                    placeholder="যেমন: সি.এস খতিয়ান কপি"
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div className="flex-1 space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">গুগল ড্রাইভ লিংক *</label>
                  <input
                    type="url"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://drive.google.com/..."
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleAddLinkAttachment}
                disabled={!linkUrl.trim()}
                className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-400 text-white text-xs font-bold rounded-lg cursor-pointer transition select-none"
              >
                লিংক যুক্ত করুন
              </button>
            </div>

            {/* Existing uploaded attachment pills list */}
            {attachments.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {attachments.map((file) => (
                  <div key={file.id} className="flex justify-between items-center bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
                    <div className="truncate max-w-[150px] font-semibold text-slate-700" title={file.name}>
                      {file.name}
                    </div>
                    <div className="flex items-center gap-2 border-l border-slate-200 pl-2 shrink-0">
                      <span className="text-[10px] text-slate-400 font-mono italic">লিংক</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (file.url) {
                            window.open(file.url, '_blank');
                          }
                        }}
                        className="text-teal-700 hover:text-teal-900 cursor-pointer"
                        title="ফাইলটি দেখুন"
                      >
                        <Eye size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(file.id)}
                        className="text-rose-600 hover:text-rose-800 cursor-pointer"
                        title="ফাইলটি মুছে ফেলুন"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Remarks Notes memo comment */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2">
            <label className="text-slate-500 flex items-center gap-1 font-bold">
              <FileText size={14} className="text-slate-400" />
              অতিরিক্ত বিশেষ মন্তব্য বা দলিল টোকা (ঐচ্ছিক)
            </label>
            <textarea
              rows={3}
              placeholder="কোনো বিশেষ রেকর্ড মন্তব্য করার প্রয়োজন থাকলে এখানে উল্লেখ করুন..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 text-[11px] font-sans"
            />
          </div>
        </div>

        {/* Right column: Smaller of the Summaries ("রাইট সাইটে হবে, আরো ছোট হবে") */}
        <div className="lg:col-span-5">
          {/* Live Aggregated Totals Summary Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 h-full flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-black text-slate-700 uppercase tracking-wide flex items-center gap-1.5 border-b pb-2">
                <CheckCircle2 size={13} className="text-emerald-600" />
                মোট জমি সারসংক্ষেপ (অটোক্যালকুলেটেড)
              </h4>
              <div className="grid grid-cols-1 gap-3 mt-3">
                <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex flex-col items-center justify-center text-center shadow-xs">
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">নামজারীকৃত কাতের পরিমাণ</span>
                  <span className="text-base font-black text-slate-800 mt-1">
                    {toBengaliNumber(khatians.reduce((s, kh) => s + kh.dags.reduce((ds, d) => ds + (Number(d.namjariAmount) || 0), 0), 0).toFixed(2))} শতক
                  </span>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex flex-col items-center justify-center text-center shadow-xs">
                  <span className="text-[10px] font-extrabold text-emerald-900 uppercase tracking-wider">মোট হস্তান্তর পরিমাণ</span>
                  <span className="text-base font-black text-emerald-950 mt-1 font-mono">
                    {toBengaliNumber(khatians.reduce((s, kh) => s + kh.dags.reduce((ds, d) => ds + (Number(d.amount) || 0), 0), 0).toFixed(2))} শতক
                  </span>
                </div>
              </div>
            </div>
            <div className="text-[10px] text-slate-400 text-center font-medium mt-3 border-t border-slate-200/50 pt-3">
              অটোক্যালকুলেশন সচল রয়েছে
            </div>
          </div>
        </div>

      </div>
      </div>

      {/* CRUD control buttons */}
      <div className="border-t border-slate-200 pt-5 flex justify-end gap-3.5">
        <button
          type="button"
          onClick={onCancelEdit}
          className="px-5 py-2.5 text-xs text-slate-700 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer select-none font-bold"
        >
          বাতিল করে ফিরে যান
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 rounded-xl shadow-md cursor-pointer transition select-none flex items-center gap-1.5"
        >
          {isSubmitting ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white/50 border-t-white animate-spin rounded-full" />
              সংরক্ষণ করা হচ্ছে...
            </>
          ) : (
            <>
              <CheckCircle2 size={13} />
              {editingTransaction ? 'সম্পাদনা সম্পন্ন করুন' : 'দলিল হিসাব সংযুক্ত করুন'}
            </>
          )}
        </button>
      </div>

    </form>
  );
}
