import React, { useState, useRef, useEffect } from 'react';
import { 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  ShieldCheck, 
  Building2, 
  HardDriveDownload, 
  HardDriveUpload, 
  Trash2, 
  UserMinus, 
  UserPlus, 
  Key, 
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  Building,
  Briefcase,
  Laptop,
  Monitor,
  Database,
  HelpCircle,
  Info,
  FileText,
  Save,
  Moon,
  Sun,
  Palette,
  Eye,
  EyeOff,
  FolderOpen,
  X
} from 'lucide-react';
import { toBengaliNumber } from '../data/defaultData';
import { LandTransaction } from '../types';
import { generateTokenFileContent, parseTokenFileContent } from '../utils/tokenHelper';

interface UserProfileProps {
  currentUser: any;
  onUpdateProfile: (updated: any) => void;
  onLogout: () => void;
  transactions: LandTransaction[];
  onImportBackup: (data: LandTransaction[]) => void;
  onDeleteAllData: () => void;
  registeredUsers: any[];
  onAddUser: (newUser: any) => void;
  onRemoveUser: (userId: string) => void;
  onClearUserData?: (userId: string) => void;
  onCleanEntireAppData?: () => void;
  onAddTokens?: (userId: string, amount: number) => void;
}

export default function UserProfile({
  currentUser,
  onUpdateProfile,
  onLogout,
  transactions,
  onImportBackup,
  onDeleteAllData,
  registeredUsers,
  onAddUser,
  onRemoveUser,
  onClearUserData,
  onCleanEntireAppData,
  onAddTokens,
}: UserProfileProps) {
  const [name, setName] = useState(currentUser.name || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [email, setEmail] = useState(currentUser.email || '');
  const [companyName, setCompanyName] = useState(currentUser.companyName || '');
  const [password, setPassword] = useState(currentUser.password || '');
  const [profileImage, setProfileImage] = useState(currentUser.profileImage || '');
  const [newMouza, setNewMouza] = useState('');
  const [newDeedType, setNewDeedType] = useState('');

  // Database path state
  const [customDbPath, setCustomDbPath] = useState('');
  const [isSavingDbPath, setIsSavingDbPath] = useState(false);

  useEffect(() => {
    if ((window as any).electronAPI) {
      (window as any).electronAPI.getDbPath().then((data: any) => {
        if (data.success && data.dbPath) {
          setCustomDbPath(data.dbPath);
        }
      }).catch(console.error);
    } else {
      fetch('/api/settings/db-path')
        .then(res => res.json())
        .then(data => {
          if (data.success && data.dbPath) {
            setCustomDbPath(data.dbPath);
          }
        })
        .catch(console.error);
    }
  }, []);

  const handleSaveDbPath = async () => {
    if (!customDbPath.trim()) return;
    setIsSavingDbPath(true);
    try {
      if ((window as any).electronAPI) {
        const data = await (window as any).electronAPI.changeDbPath(customDbPath.trim());
        if (data.success) {
          setMessage({ text: data.message || 'ডাটাবেজ সংরক্ষন পাথ সফলভাবে আপডেট হয়েছে।', type: 'success' });
          setCustomDbPath(data.dbPath);
        } else {
          setMessage({ text: data.error || 'পাথ আপডেট করতে সমস্যা হয়েছে।', type: 'error' });
        }
      } else {
        const res = await fetch('/api/settings/db-path', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newPath: customDbPath.trim() })
        });
        const data = await res.json();
        if (data.success) {
          setMessage({ text: data.message || 'ডাটাবেজ সংরক্ষন পাথ সফলভাবে আপডেট হয়েছে।', type: 'success' });
          setCustomDbPath(data.dbPath);
        } else {
          setMessage({ text: data.error || 'পাথ আপডেট করতে সমস্যা হয়েছে।', type: 'error' });
        }
      }
    } catch (e) {
      console.error(e);
      setMessage({ text: 'নেটওয়ার্ক বা সিস্টেম সমস্যা। আবার চেষ্টা করুন।', type: 'error' });
    } finally {
      setIsSavingDbPath(false);
    }
  };

  const handleAddMouza = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMouza.trim()) return;
    const updatedList = [...new Set([...(currentUser.customMouzas || []), newMouza.trim()])];
    onUpdateProfile({ ...currentUser, customMouzas: updatedList });
    setNewMouza('');
    setMessage({ text: 'মৌজার নাম সফলভাবে যুক্ত হয়েছে!', type: 'success' });
  };

  const handleRemoveMouza = (m: string) => {
    const updatedList = (currentUser.customMouzas || []).filter((item: string) => item !== m);
    onUpdateProfile({ ...currentUser, customMouzas: updatedList });
  };
  
  const handleAddDeedType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeedType.trim()) return;
    const updatedList = [...new Set([...(currentUser.customDeedTypes || []), newDeedType.trim()])];
    onUpdateProfile({ ...currentUser, customDeedTypes: updatedList });
    setNewDeedType('');
    setMessage({ text: 'দলিলের প্রকৃতি সফলভাবে যুক্ত হয়েছে!', type: 'success' });
  };

  const handleRemoveDeedType = (d: string) => {
    const updatedList = (currentUser.customDeedTypes || []).filter((item: string) => item !== d);
    onUpdateProfile({ ...currentUser, customDeedTypes: updatedList });
  };
  
  // New User Creation States
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserType, setNewUserType] = useState<'personal' | 'company'>('personal');
  const [newUserCompany, setNewUserCompany] = useState('');

  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  
  const [showEntireResetConfirm, setShowEntireResetConfirm] = useState(false);
  const [entireResetInput, setEntireResetInput] = useState('');
  const [entireResetError, setEntireResetError] = useState<string | null>(null);
  const [resetCount, setResetCount] = useState(0);

  // Token logic states
  const [generateTokenAmount, setGenerateTokenAmount] = useState<string>('20');
  const [addingTokenUserId, setAddingTokenUserId] = useState<string | null>(null);
  const [tokenAmountInput, setTokenAmountInput] = useState<string>('');
  const [showTokenHistoryForUserId, setShowTokenHistoryForUserId] = useState<string | null>(null);
  const tokenHistoryUser = registeredUsers.find(u => u.id === showTokenHistoryForUserId);
  const [userCounts, setUserCounts] = useState<Record<string, number>>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchCounts = async () => {
      if (!currentUser.isAdmin) return;
      const counts: Record<string, number> = {};
      for (const user of registeredUsers) {
        if ((window as any).electronAPI) {
          const data = await (window as any).electronAPI.loadDb(user.id);
          counts[user.id] = data ? data.length : 0;
        } else {
          const rawData = localStorage.getItem(`LAND_LEDGER_TRANSACTIONS_${user.id}`);
          if (rawData) {
            try {
              counts[user.id] = JSON.parse(rawData).length;
            } catch (e) {}
          }
        }
      }
      setUserCounts(counts);
    };
    fetchCounts();
  }, [registeredUsers, currentUser.isAdmin]);


  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setMessage({ text: 'ত্রুটি: ছবিটির সাইজ ২ মেগাবাইটের বেশি হতে পারবে না।', type: 'error' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 300;
          const MAX_HEIGHT = 300;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
            setProfileImage(compressedBase64);
            
            // Auto save profile image
            const updated = {
              ...currentUser,
              profileImage: compressedBase64
            };
            onUpdateProfile(updated);
            setMessage({ text: 'প্রোফাইল পিকচার সফলভাবে আপডেট করা হয়েছে!', type: 'success' });
          }
        };
        img.src = event.target.result as string;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!name || !phone || !email) {
      setMessage({ text: 'ত্রুটি: অনুগ্রহ করে সকল আবশ্যক তথ্য পূরণ করুন।', type: 'error' });
      return;
    }

    const updated = {
      ...currentUser,
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      password,
      profileImage,
      companyName: currentUser.userType === 'company' ? companyName.trim() : undefined
    };

    onUpdateProfile(updated);
    setMessage({ text: 'প্রোফাইল তথ্য সফলভাবে আপডেট করা হয়েছে!', type: 'success' });
  };

  const handleGenerateTokenFile = () => {
    const amt = parseInt(generateTokenAmount);
    if (isNaN(amt) || amt <= 0) {
      setMessage({ text: 'সঠিক টোকেন পরিমাণ দিন।', type: 'error' });
      return;
    }
    const content = generateTokenFileContent(amt);
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Token_File_${amt}_Limit_${Date.now()}.tok`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setMessage({ text: `সফলভাবে ${amt} টোকেনের ফাইল তৈরি হয়েছে। এটি ইউজারকে পাঠিয়ে দিন।`, type: 'success' });
  };

  const handleTokenUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const payload = parseTokenFileContent(content);
      if (!payload) {
        setMessage({ text: 'অবৈধ বা ত্রুটিপূর্ণ টোকেন ফাইল!', type: 'error' });
        return;
      }
      
      const usedIds = currentUser.usedTokenIds || [];
      if (usedIds.includes(payload.id)) {
        setMessage({ text: 'এই টোকেন ফাইলটি ইতিমধ্যেই ব্যবহার করা হয়েছে।', type: 'error' });
        return;
      }
      
      const newHistory = currentUser.tokenHistory || [];
      newHistory.push({
        amount: payload.amount,
        date: new Date().toISOString(),
        addedBy: 'নিজস্ব (.tok ফাইল আপলোড)'
      });

      const updatedUser = {
        ...currentUser,
        tokenLimit: (currentUser.tokenLimit || 0) + payload.amount,
        usedTokenIds: [...usedIds, payload.id],
        tokenHistory: newHistory
      };
      
      onUpdateProfile(updatedUser);
      setMessage({ text: `সফলভাবে ${payload.amount} টোকেন রিচার্জ হয়েছে! আপনার নতুন লিমিট: ${updatedUser.tokenLimit}`, type: 'success' });
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleDatabaseBackupDownload = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(transactions, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `ভূমি_হিসাব_ব্যাকআপ_রপ্তানি_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const getUserTransactionsCount = (userId: string): number => {
    return userCounts[userId] || 0;
  };

  const handleDatabaseImportClick = () => {
    importFileInputRef.current?.click();
  };

  const handleDatabaseImportChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          onImportBackup(parsed);
          setMessage({ text: 'ডাটাবেজ সফলভাবে ইমপোর্ট সম্পন্ন হয়েছে!', type: 'success' });
        } else {
          setMessage({ text: 'ত্রুটি: ব্যাকআপ ফাইলটি সঠিক ডাটা ফর্ম্যাটে নেই।', type: 'error' });
        }
      } catch (err) {
        setMessage({ text: 'ত্রুটি: ফাইলটি পড়া সম্ভব হয়নি। সঠিক JSON ফাইল সিলেক্ট করুন।', type: 'error' });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleRegisterNewUser = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!newUserName || !newUserEmail || !newUserPhone || !newUserPassword) {
      setMessage({ text: 'ত্রুটি: নতুন অ্যাকাউন্টের সকল আবশ্যক ফিল্ড পূরণ করুন।', type: 'error' });
      return;
    }

    const exists = registeredUsers.some(u => u.email.toLowerCase() === newUserEmail.trim().toLowerCase());
    if (exists) {
      setMessage({ text: 'ত্রুটি: এই ইমেইল ঠিকানাটি দিয়ে ইতিমধ্যে অ্যাকাউন্ট খোলা হয়েছে।', type: 'error' });
      return;
    }

    const newUser = {
      id: `user_${Date.now()}`,
      name: newUserName.trim(),
      email: newUserEmail.trim(),
      phone: newUserPhone.trim(),
      password: newUserPassword,
      userType: newUserType,
      companyName: newUserType === 'company' ? newUserCompany.trim() : undefined,
      createdAt: new Date().toISOString()
    };

    onAddUser(newUser);
    setShowAddUser(false);
    setNewUserName('');
    setNewUserEmail('');
    setNewUserPhone('');
    setNewUserPassword('');
    setNewUserCompany('');
    setMessage({ text: 'নতুন ইউজার অ্যাকাউন্ট সফলভাবে তৈরি করা হয়েছে!', type: 'success' });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Alert message notification */}
      {message && (
        <div className={`p-4 rounded-xl border flex items-start gap-2.5 max-w-3xl ${
          message.type === 'error' 
            ? 'bg-alert-peach border-rose-200 text-rose-800' 
            : 'bg-emerald-50 border-emerald-300 text-emerald-800'
        }`}>
          {message.type === 'error' ? <AlertCircle size={18} className="shrink-0 mt-0.5" /> : <CheckCircle size={18} className="shrink-0 mt-0.5" />}
          <p className="text-xs font-semibold leading-relaxed font-sans">{message.text}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Avatar and Quick Stats */}
        <div className="bg-white rounded-[20px] border border-border-subtle p-6 space-y-6 flex flex-col items-center text-center custom-shadow">
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            {profileImage ? (
              <img 
                src={profileImage} 
                alt={currentUser.name} 
                className="w-28 h-28 rounded-full object-cover border-4 border-emerald-100 group-hover:opacity-85 transition bg-table-header"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-28 h-28 rounded-full bg-table-header border-4 border-border-subtle flex items-center justify-center text-slate-300 group-hover:opacity-85 transition">
                {currentUser.userType === 'company' ? <Building2 size={48} /> : <User size={48} />}
              </div>
            )}
            <div className="absolute bottom-0 right-0 p-2 bg-emerald-600 rounded-full text-white custom-shadow border-2 border-white hover:bg-emerald-700 transition">
              <ImageIcon size={14} />
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              accept="image/*" 
              className="hidden" 
            />
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-extrabold text-text-primary font-sans flex items-center justify-center gap-2 flex-wrap">
              {currentUser.userType === 'company' && companyName ? companyName : name}
              {(currentUser.isAdmin || currentUser.userType === 'admin') && (
                <span className="inline-flex items-center gap-1 text-rose-700 font-bold bg-alert-peach px-2 py-0.5 rounded-lg text-xs font-sans">
                  <ShieldCheck size={13} className="shrink-0 text-rose-700 animate-pulse" />
                  (Admin)
                </span>
              )}
            </h3>
            <p className="text-xs font-bold text-text-muted uppercase tracking-wide">
              {(currentUser.isAdmin || currentUser.userType === 'admin') ? 'Administrators' : (currentUser.userType === 'company' ? `কোম্পানি অ্যাডমিনঃ ${name}` : 'ব্যক্তিগত খতিয়ান হোল্ডার')}
            </p>
            <div className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold mt-1 ${
              (currentUser.isAdmin || currentUser.userType === 'admin') 
                ? 'bg-alert-peach text-rose-800' 
                : 'bg-emerald-50 text-emerald-800'
            }`}>
              {currentUser.isAdmin ? 'সিস্টেম এডমিন' : 'সাধারণ ইউজার'}
            </div>
          </div>

          {/* Quick Metrics */}
          {!currentUser.isAdmin && (
            <div className="w-full border-t border-border-subtle pt-5 grid grid-cols-2 gap-3 text-xs">
              <div className="bg-ice-tint p-3 rounded-xl border border-border-subtle col-span-2 flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-wide block">অবশিষ্ট টোকেন (ডাটা এন্ট্রি লিমিট)</span>
                  <span className={`text-lg font-extrabold select-all ${(currentUser.tokenLimit || 0) - transactions.length <= 0 ? 'text-rose-700' : 'text-slate-teal'}`}>
                    {Math.max(0, (currentUser.tokenLimit || 0) - transactions.length)} টি বাকি
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-wide block">মোট টোকেন</span>
                  <span className="text-lg font-extrabold text-slate-700 select-all">{currentUser.tokenLimit || 0}</span>
                </div>
              </div>
              <div className="bg-ice-tint p-3 rounded-xl border border-border-subtle">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wide block">মোট সংরক্ষিত দলিল</span>
                <span className="text-lg font-extrabold text-text-primary select-all">{toBengaliNumber(transactions.length)} টি</span>
              </div>
              <div className="bg-ice-tint p-3 rounded-xl border border-border-subtle">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wide block">মোট জমি হিসাব</span>
                <span className="text-lg font-extrabold text-emerald-800 select-all">
                  {toBengaliNumber(transactions.reduce((acc, t) => acc + (t.type === 'purchase' ? t.transactionAmount : -t.transactionAmount), 0).toFixed(2))} শ.
                </span>
              </div>
            </div>
          )}

          {/* Token Recharge */}
          {!currentUser.isAdmin && (
            <div className="w-full bg-ice-tint rounded-xl border border-border-subtle p-4 space-y-3 mt-4">
               <h4 className="text-xs font-bold text-text-primary flex items-center gap-1.5"><ShieldCheck size={14} className="text-slate-teal"/> টোকেন রিচার্জ করুন</h4>
               <p className="text-[10px] text-text-muted leading-relaxed">অ্যাডমিনের কাছ থেকে কেনা .tok ফাইলটি আপলোড করে আপনার ডাটা এন্ট্রি লিমিট বাড়ান।</p>
               <label className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 transition text-white font-bold text-xs rounded-xl cursor-pointer flex justify-center custom-shadow">
                 <input type="file" accept=".tok" className="hidden" onChange={handleTokenUpload} />
                 টোকেন ফাইল সিলেক্ট করুন
               </label>
            </div>
          )}

          <button
            onClick={onLogout}
            className="w-full py-2.5 bg-alert-peach text-rose-700 hover:bg-rose-100 hover:text-rose-900 duration-150 text-xs font-bold rounded-xl cursor-pointer"
          >
            অ্যাকাউন্ট লগআউট করুন
          </button>
        </div>

        {/* Middle Column: Update Form */}
        <div className="bg-white rounded-[20px] border border-border-subtle p-6 custom-shadow lg:col-span-2 space-y-6">
          <div className="border-b border-border-subtle pb-3">
            <h3 className="text-base font-extrabold text-text-primary font-sans flex items-center gap-1.5">
              <User size={18} className="text-emerald-600" />
              প্রোফাইল ও প্রাতিষ্ঠানিক তথ্য সংশোধন
            </h3>
            <p className="text-xs text-text-muted mt-0.5">আপনার ব্যক্তিগত বা কোম্পানি সংক্রান্ত যাবতীয় তথ্য আপডেট রাখুন।</p>
          </div>

          <form onSubmit={handleUpdate} className="space-y-4 text-xs font-semibold">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-text-muted">ইউজারের নাম (আবশ্যক)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-text-muted">
                    <User size={14} />
                  </span>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-8.5 pr-4 py-2 bg-white border border-border-subtle rounded-lg focus:outline-none focus:border-emerald-600 text-[11px] font-medium"
                  />
                </div>
              </div>

              {currentUser.userType === 'company' && (
                <div className="space-y-1.5">
                  <label className="text-emerald-700">কোম্পানির নাম (আবশ্যক)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-emerald-600">
                      <Building size={14} />
                    </span>
                    <input
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full pl-8.5 pr-4 py-2 bg-white border border-emerald-300 rounded-lg focus:outline-none focus:border-emerald-600 text-[11px] font-medium"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-text-muted">মোবাইল নম্বর (আবশ্যক)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-text-muted">
                    <Phone size={14} />
                  </span>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-8.5 pr-4 py-2 bg-white border border-border-subtle rounded-lg focus:outline-none focus:border-emerald-600 text-[11px] font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-text-muted">ইমেইল ঠিকানা (লগইন ইউজারনেম)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-text-muted">
                    <Mail size={14} />
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-8.5 pr-4 py-2 bg-white border border-border-subtle rounded-lg focus:outline-none focus:border-emerald-600 text-[11px] font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-text-muted">অ্যাকাউন্ট পাসওয়ার্ড</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-text-muted">
                    <Key size={14} />
                  </span>
                  <input
                    type="text"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-8.5 pr-4 py-2 bg-white border border-border-subtle rounded-lg focus:outline-none focus:border-emerald-600 text-[11px] font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-border-subtle flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl custom-shadow transition cursor-pointer select-none"
              >
                প্রোফাইল সংরক্ষণ পরিবর্তন করুন
              </button>
            </div>
          </form>

          {/* Contact Admin for Tokens Banner (General Users Only) */}
          {(!currentUser?.isAdmin && currentUser?.userType !== 'admin') && (
            <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-5 custom-shadow w-full flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center shrink-0 shadow-inner">
                  <svg viewBox="0 0 24 24" className="w-6 h-6 text-emerald-600" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-text-primary font-sans">নতুন টোকেন প্রয়োজন?</h3>
                  <p className="text-xs text-slate-teal mt-0.5">টোকেন যুক্ত করার জন্য এডমিন এর সাথে সরাসরি যোগাযোগ করুন।</p>
                </div>
              </div>
              <a
                href="https://wa.me/8801912346733"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-[#25D366] hover:bg-[#128C7E] text-white text-xs font-bold rounded-xl custom-shadow transition cursor-pointer select-none flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
                  </svg>
                  Whatsapp এ যোগাযোগ করুন
                </a>
              </div>
            )}

        </div>
      </div>



      {/* Dropdown Options Management */}
      <div className="bg-white rounded-[20px] border border-border-subtle p-6 custom-shadow w-full space-y-6">
        <div className="border-b border-border-subtle pb-3">
          <h3 className="text-base font-extrabold text-text-primary font-sans flex items-center gap-1.5">
            <Monitor size={18} className="text-slate-teal" />
            ড্রপডাউন অপশন ম্যানেজমেন্ট
          </h3>
          <p className="text-xs text-text-muted mt-0.5">জমি ক্রয়-বিক্রয় ফর্মে আপনার প্রয়োজনীয় মৌজার নাম ও দলিলের প্রকৃতি যুক্ত করে রাখুন।</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Mouza Management */}
          <div className="space-y-3 bg-ice-tint p-4 rounded-xl border border-border-subtle">
            <h4 className="text-sm font-bold text-slate-700 flex items-center gap-1.5"><MapPin size={14} className="text-indigo-500"/> মৌজার নাম যুক্ত করুন</h4>
            <form onSubmit={handleAddMouza} className="flex gap-2">
              <input
                type="text"
                value={newMouza}
                onChange={(e) => setNewMouza(e.target.value)}
                placeholder="মৌজার নাম লিখুন"
                className="flex-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500"
              />
              <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg cursor-pointer">যুক্ত করুন</button>
            </form>
            <div className="flex flex-wrap gap-2 pt-2">
              {(currentUser.customMouzas || []).map((m: string) => (
                <span key={m} className="px-2 py-1 bg-white border border-border-subtle rounded-md text-xs font-semibold text-slate-700 flex items-center gap-1.5 custom-shadow">
                  {m}
                  <button type="button" onClick={() => handleRemoveMouza(m)} className="text-rose-500 hover:text-rose-700 cursor-pointer"><Trash2 size={12}/></button>
                </span>
              ))}
              {(!currentUser.customMouzas || currentUser.customMouzas.length === 0) && (
                <span className="text-xs text-text-muted italic">কোনো কাস্টম মৌজা নেই।</span>
              )}
            </div>
          </div>

          {/* Deed Type Management */}
          <div className="space-y-3 bg-ice-tint p-4 rounded-xl border border-border-subtle">
            <h4 className="text-sm font-bold text-slate-700 flex items-center gap-1.5"><FileText size={14} className="text-indigo-500"/> দলিলের প্রকৃতি যুক্ত করুন</h4>
            <form onSubmit={handleAddDeedType} className="flex gap-2">
              <input
                type="text"
                value={newDeedType}
                onChange={(e) => setNewDeedType(e.target.value)}
                placeholder="দলিলের প্রকৃতি লিখুন"
                className="flex-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500"
              />
              <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg cursor-pointer">যুক্ত করুন</button>
            </form>
            <div className="flex flex-wrap gap-2 pt-2">
              {(currentUser.customDeedTypes || []).map((d: string) => (
                <span key={d} className="px-2 py-1 bg-white border border-border-subtle rounded-md text-xs font-semibold text-slate-700 flex items-center gap-1.5 custom-shadow">
                  {d}
                  <button type="button" onClick={() => handleRemoveDeedType(d)} className="text-rose-500 hover:text-rose-700 cursor-pointer"><Trash2 size={12}/></button>
                </span>
              ))}
              {(!currentUser.customDeedTypes || currentUser.customDeedTypes.length === 0) && (
                <span className="text-xs text-text-muted italic">কোনো কাস্টম দলিলের প্রকৃতি নেই।</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Database Backup & Import panel */}
      {!currentUser.isAdmin && (
        <div className="bg-white rounded-[20px] border border-border-subtle p-6 custom-shadow w-full space-y-5">
          <div className="border-b border-border-subtle pb-3 flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-base font-extrabold text-text-primary font-sans flex items-center gap-1.5">
                <ShieldCheck size={18} className="text-slate-teal" />
                ডাটাবেজ রপ্তানি ও ব্যাকআপ পুনরুদ্ধার (Offline Local JSON Engine)
              </h3>
              <p className="text-xs text-text-muted">আপনার ডাটা সুরক্ষার জন্য ডাটাবেজ ব্যাকআপ ফাইল ডাউনলোড করে অন্য কোথাও সংরক্ষণ করে রাখুন।</p>
            </div>
          </div>

        <p className="text-xs text-text-muted leading-relaxed font-sans pt-1">
          ভূমি ক্রয়-বিক্রয়ের এই এ্যাপ্লিকেশনটি সম্পূর্ণ সার্ভার-বিহীন অফলাইন টেকনোলজি ব্যবহার করে আপনার ব্রাউজারের লোকাল মেমোরি (LocalStorage) এ ডাটা সংরক্ষণ করছে। ক্যাশ মেমোরি রিফ্রেশ বা ব্রাউজার পরিবর্তনের ফলে ডাটা হারিয়ে ফেলার হাত থেকে বাঁচতে নিয়মিত নিচে উল্লেখিত বাটন ব্যবহারে ব্যাকআপ সংরক্ষণ বা পুনরুদ্ধার করুন।
        </p>

        <div className="flex items-center gap-3 pt-2 w-full overflow-x-auto pb-1">
          {/* Export button */}
          <button
            onClick={handleDatabaseBackupDownload}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-slate-teal hover:bg-[#1D3B47] rounded-xl custom-shadow transition-colors cursor-pointer select-none"
          >
            <HardDriveDownload size={14} />
            সম্পূর্ণ ব্যাকআপ ফাইল ডাউনলোড করুন
          </button>

          {/* Import button */}
          <button
            onClick={handleDatabaseImportClick}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-teal-700 bg-mint-pill hover:bg-teal-100 rounded-xl transition-colors cursor-pointer select-none"
          >
            <HardDriveUpload size={14} />
            ব্যাকআপ ফাইল ইমপোর্ট করুন (JSON/TXT)
          </button>
          
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-rose-700 bg-alert-peach hover:bg-rose-100 rounded-xl transition-colors cursor-pointer select-none"
            >
              <Trash2 size={14} />
              সকল ডাটাবেজ মুছে ফেলুন
            </button>
          ) : (
            <div className="flex flex-col gap-2 bg-alert-peach border border-rose-200 rounded-xl p-3 w-full max-w-sm">
              <span className="text-xs font-bold text-rose-800 animate-pulse flex items-center gap-1.5">
                <AlertCircle size={14} /> আপনি কি নিশ্চিত? সকল ডাটা মুছে যাবে।
              </span>
              
              {deleteError && (
                <div className="text-[11px] font-bold text-rose-700 bg-rose-100 rounded-md px-2 py-1 flex items-center gap-1">
                  <AlertCircle size={12} /> {deleteError}
                </div>
              )}

              <div className="flex gap-2">
                <input
                  type="password"
                  placeholder="আপনার পাসওয়ার্ড দিন"
                  value={deletePassword}
                  onChange={(e) => {
                    setDeletePassword(e.target.value);
                    if (deleteError) setDeleteError(null);
                  }}
                  className="flex-1 text-xs px-3 py-1.5 border border-rose-300 rounded-lg focus:outline-none focus:border-rose-500 bg-white"
                />
                <button
                  onClick={() => {
                    if (deletePassword === currentUser.password) {
                      onDeleteAllData();
                      setShowDeleteConfirm(false);
                      setDeletePassword('');
                      setDeleteError(null);
                    } else {
                      setDeleteError('পাসওয়ার্ড ভুল, সঠিক পাসওয়ার্ড ব্যবহার করুন');
                    }
                  }}
                  className="px-3 py-1.5 text-xs font-bold bg-alert-peach text-rose-700 border border-alert-border hover:bg-[#f0c4b8] rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                >
                  নিশ্চিত করুন
                </button>
                <button
                  onClick={() => { 
                    setShowDeleteConfirm(false); 
                    setDeletePassword(''); 
                    setDeleteError(null);
                  }}
                  className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-ice-tint border border-slate-300 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                >
                  বাতিল
                </button>
              </div>
            </div>
          )}
          
          <input 
            type="file" 
            ref={importFileInputRef} 
            onChange={handleDatabaseImportChange} 
            accept=".json,text/plain" 
            className="hidden" 
          />
        </div>
      </div>
      )}

      {/* Token Generator Panel (Only shown to System Admin) */}
      {currentUser.isAdmin && (
        <div className="bg-white rounded-[20px] border border-border-subtle p-6 custom-shadow w-full space-y-5 mb-6">
          <div className="border-b border-border-subtle pb-3">
            <h3 className="text-base font-extrabold text-text-primary font-sans flex items-center gap-1.5">
              <Key size={18} className="text-emerald-600" />
              সফটওয়্যার টোকেন জেনারেটর (System Admin)
            </h3>
            <p className="text-xs text-text-muted mt-0.5">ইউজারদের ডাটা এন্ট্রির লিমিট বাড়ানোর জন্য .tok এনক্রিপ্টেড ফাইল তৈরি করুন।</p>
          </div>
          <div className="flex gap-4 items-end">
            <div className="space-y-1.5 flex-1 max-w-xs">
              <label className="text-xs font-bold text-slate-teal">টোকেনের পরিমাণ (১ টোকেন = ১টি দলিল)</label>
              <input
                type="number"
                value={generateTokenAmount}
                onChange={(e) => setGenerateTokenAmount(e.target.value)}
                className="w-full px-4 py-2.5 bg-ice-tint border border-border-subtle rounded-xl focus:outline-none focus:border-emerald-600 text-sm font-bold"
              />
            </div>
            <button
              onClick={handleGenerateTokenFile}
              className="py-2.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-full custom-shadow cursor-pointer transition"
            >
              জেনারেট করুন এবং ডাউনলোড করুন
            </button>
          </div>
        </div>
      )}

      {/* Multu-user management panel (Only shown to System Admin) */}
      {currentUser.isAdmin && (
        <div className="bg-white rounded-[20px] border border-border-subtle p-6 custom-shadow w-full space-y-5">
          <div className="border-b border-border-subtle pb-3 flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-base font-extrabold text-text-primary font-sans flex items-center gap-1.5">
                <Briefcase size={18} className="text-slate-teal" />
                মাল্টিপল অপারেটর ইউজার ম্যানেজমেন্ট (System Administrators Block)
              </h3>
              <p className="text-xs text-text-muted">আপনার এই ডিজিটাল সিস্টেমে যারা ডাটা ইনপুট দিতে পারবে তাদের তালিকা নিয়ন্ত্রণ করুন।</p>
            </div>
            
            <button
              onClick={() => setShowAddUser(!showAddUser)}
              className="text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-xl flex items-center gap-1 custom-shadow transition cursor-pointer select-none"
            >
              <UserPlus size={13} />
              {showAddUser ? 'তালিকা দেখুন' : 'নতুন অপারেটর যোগ করুন'}
            </button>
          </div>

          {showAddUser ? (
            <form onSubmit={handleRegisterNewUser} className="space-y-4 text-xs font-semibold p-4.5 bg-ice-tint border border-border-subtle rounded-xl max-w-xl">
              <p className="text-text-primary font-bold text-sm border-b pb-1.5 flex items-center gap-1.5">
                <UserPlus size={16} className="text-slate-teal" />
                নতুন অফিস অপারেটর বা কর্মচারীর অ্যাকাউন্ট সংযুক্তি
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-text-muted">ইউজারের শ্রেণীবিভাগ</label>
                  <select 
                    value={newUserType} 
                    onChange={(e) => setNewUserType(e.target.value as 'personal' | 'company')}
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600"
                  >
                    <option value="personal">ব্যক্তিগত ইউজার</option>
                    <option value="company">রিয়েল এস্টেট কোম্পানি</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-text-muted">অপারেটরের পূর্ণ নাম</label>
                  <input
                    type="text"
                    required
                    placeholder="যেমনঃ রাজীব আহমেদ"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600"
                  />
                </div>

                {newUserType === 'company' && (
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-slate-teal">কোম্পানি/প্রতিষ্ঠানের নাম</label>
                    <input
                      type="text"
                      required
                      placeholder="যেমনঃ মেঘনা বিল্ডার্স লিমিটেড"
                      value={newUserCompany}
                      onChange={(e) => setNewUserCompany(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-white border border-border-subtle rounded-lg focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-text-muted">মোবাইল নম্বর</label>
                  <input
                    type="tel"
                    required
                    placeholder="01xxxxxxxxx"
                    value={newUserPhone}
                    onChange={(e) => setNewUserPhone(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-text-muted">ইমেইল ঠিকানা</label>
                  <input
                    type="email"
                    required
                    placeholder="example@gmail.com"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-text-muted">পাসওয়ার্ড</label>
                  <input
                    type="text"
                    required
                    placeholder="লগইন পাসওয়ার্ড নির্ধারণ করুন"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddUser(false)}
                  className="px-4 py-2 bg-table-header hover:bg-slate-200 text-slate-teal rounded-lg"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold"
                >
                  ইউজার যোগ করুন
                </button>
              </div>
            </form>
          ) : (
            <div className="overflow-x-auto border border-border-subtle rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-ice-tint text-slate-700 font-bold border-b border-border-subtle">
                    <th className="p-3">ইউজারের নাম</th>
                    <th className="p-3">মোবাইল</th>
                    <th className="p-3">ইমেইল / লগইন আইডি</th>
                    <th className="p-3 text-center">টাইপ</th>
                    <th className="p-3 text-center">টোকেন (লিমিট / বাকি)</th>
                    <th className="p-3 text-right">পদক্ষেপ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium text-text-primary">
                  {registeredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-ice-tint/50 transition-colors">
                      <td className="p-3">
                        <div className="font-extrabold text-text-primary">{user.name}</div>
                        {user.companyName && <div className="text-[10px] text-text-muted font-sans">{user.companyName}</div>}
                      </td>
                      <td className="p-3 font-mono">{toBengaliNumber(user.phone)}</td>
                      <td className="p-3 select-all">{user.email}</td>
                      <td className="p-3 text-center text-[10px]">
                        <span className={`px-2 py-0.5 rounded font-bold ${
                          user.userType === 'company' ? 'bg-ice-tint text-slate-teal' : 
                          user.isAdmin || user.userType === 'admin' ? 'bg-alert-peach text-rose-700' :
                          'bg-emerald-50 text-emerald-800'
                        }`}>
                          {user.userType === 'company' ? 'কোম্পানি' : (user.isAdmin || user.userType === 'admin') ? 'এডমিন' : 'ব্যক্তিগত'}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {user.isAdmin || user.userType === 'admin' ? (
                          <span className="text-text-muted text-[10px] italic">প্রযোজ্য নয়</span>
                        ) : (
                          <div className="flex flex-col items-center gap-1.5 py-1">
                            <span className="text-[10px] text-slate-teal font-bold bg-ice-tint px-2 py-0.5 rounded">
                              মোট লিমিট: {user.tokenLimit || 0}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              (user.tokenLimit || 0) - getUserTransactionsCount(user.id) <= 0 ? 'bg-alert-peach text-rose-700' : 'bg-emerald-50 text-emerald-700'
                            }`}>
                              বাকি: {Math.max(0, (user.tokenLimit || 0) - getUserTransactionsCount(user.id))}
                            </span>
                            
                            {addingTokenUserId === user.id ? (
                              <div className="flex items-center gap-1 mt-1">
                                <input 
                                  type="number"
                                  min="1"
                                  value={tokenAmountInput}
                                  onChange={e => setTokenAmountInput(e.target.value)}
                                  className="w-16 text-xs px-2 py-1 border border-indigo-300 rounded focus:outline-none focus:border-indigo-600"
                                  placeholder="100"
                                />
                                <button 
                                  onClick={() => {
                                    if (onAddTokens && parseInt(tokenAmountInput) > 0) {
                                      onAddTokens(user.id, parseInt(tokenAmountInput));
                                      setAddingTokenUserId(null);
                                      setTokenAmountInput('');
                                    }
                                  }}
                                  className="bg-indigo-600 hover:bg-indigo-700 text-white p-1 rounded"
                                >
                                  <CheckCircle size={12} />
                                </button>
                                <button 
                                  onClick={() => setAddingTokenUserId(null)}
                                  className="bg-slate-200 hover:bg-slate-300 text-slate-teal p-1 rounded"
                                >
                                  <AlertCircle size={12} />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 mt-1">
                                <button
                                  onClick={() => setAddingTokenUserId(user.id)}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-[9px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded transition-colors custom-shadow"
                                >
                                  <Key size={10} /> টোকেন দিন
                                </button>
                                <button
                                  onClick={() => setShowTokenHistoryForUserId(user.id)}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-[9px] font-bold text-slate-teal bg-mint-pill hover:bg-indigo-200 rounded transition-colors custom-shadow"
                                >
                                  হিস্ট্রি
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        {user.isAdmin ? (
                          <span className="text-[10px] text-text-muted italic">সুপার এডমিন</span>
                        ) : (
                          <button
                            onClick={() => {
                              if (window.confirm(`আপনি কি নিশ্চিত যে অপারেটর "${user.name}" এর অ্যাকাউন্টটি মুছে ফেলতে চান? (তার সেভ করা জমির ডাটা ডিলিট হবে না)`)) {
                                onRemoveUser?.(user.id);
                                setMessage({ text: `অপারেটর "${user.name}" এর অ্যাকাউন্ট সফলভাবে মুছে ফেলা হয়েছে।`, type: 'success' });
                              }
                            }}
                            className="text-rose-700 hover:text-rose-800 font-bold inline-flex items-center gap-1 cursor-pointer select-none"
                            title="অপারেটর ডিলিট করুন"
                          >
                            <UserMinus size={13} />
                            মুছে দিন
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Database Storage Location Section */}
      <div className="bg-white rounded-[20px] border border-border-subtle p-6 custom-shadow w-full space-y-5 mt-6">
          <div className="border-b border-border-subtle pb-3">
            <h3 className="text-base font-extrabold text-text-primary font-sans flex items-center gap-1.5">
              <Database size={18} className="text-slate-teal" />
              ডাটাবেজ সংরক্ষন ড্রাইভ (Database Save Location)
            </h3>
            <p className="text-xs text-text-muted font-semibold mt-1">
              আপনার লোকাল পিসির কোন ড্রাইভ বা ফোল্ডারে ডাটাবেজ ফাইলটি সেভ হবে তা নির্ধারণ করুন।
            </p>
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700">ফোল্ডারের পাথ (যেমন: D:\LandBuySellData)</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={customDbPath}
                onChange={(e) => setCustomDbPath(e.target.value)}
                placeholder="উদাহরণ: D:\DatabaseFolder"
                className="flex-1 bg-ice-tint border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
              <button 
                onClick={handleSaveDbPath}
                disabled={isSavingDbPath || !customDbPath.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-lg text-xs custom-shadow transition-colors cursor-pointer select-none disabled:opacity-50"
              >
                {isSavingDbPath ? 'সেভ হচ্ছে...' : 'পাথ আপডেট করুন'}
              </button>
            </div>
            <p className="text-[10px] text-amber-600 font-medium flex items-center gap-1">
              <AlertCircle size={10} />
              পাথ পরিবর্তন করলে পুরনো ডাটাবেজ ফাইলটি স্বয়ংক্রিয়ভাবে নতুন ফোল্ডারে মুভ হয়ে যাবে।
            </p>
          </div>
        </div>
      {/* System Admin Hard Reset & Cleanup Section */}
      {currentUser.isAdmin && (
        <div className="bg-white rounded-[20px] border border-rose-200 p-6 custom-shadow w-full space-y-5 mt-6">
          <div className="border-b border-border-subtle pb-3">
            <h3 className="text-base font-extrabold text-rose-955 text-rose-900 font-sans flex items-center gap-1.5">
              <Trash2 size={18} className="text-rose-700" />
              সিস্টেম রিসেট ও ডাটা ক্লিনআপ (System Hard Reset & Cleanup)
            </h3>
            <p className="text-xs text-rose-700 font-semibold mt-1">
              সতর্কতা: এখান থেকে অ্যাপ্লিকেশনের সম্পূর্ণ ডাটা মুছে ফেলে এবং ক্লিন করে একেবারে নতুন অবস্থায় ফিরিয়ে নেওয়া যাবে।
            </p>
          </div>

          <div className="p-4.5 bg-alert-peach/55 border border-border-subtle rounded-xl space-y-3">
            <p className="text-xs font-semibold text-rose-900 leading-relaxed font-sans">
              এই ফিচারের মাধ্যমে আপনি এক ক্লিকে সম্পূর্ণ অ্যাপ্লিকেশনের পুরো মেমোরি খালি করতে পারবেন। এটি সকল অপারেটরের তৈরিকৃত জমির হিসাব/রেকর্ড এবং অপারেটরদের অ্যাকাউন্টসমূহ (এডমিন ব্যতীত) সম্পূর্ণ সাফ বা ক্লিন করে দিবে। এই অ্যাকশনটি অপরিবর্তনযোগ্য।
            </p>

            {/* Confirmation logic for Entire App Reset */}
            {!showEntireResetConfirm ? (
              <button
                type="button"
                onClick={() => {
                  setShowEntireResetConfirm(true);
                  setEntireResetInput('');
                  setEntireResetError(null);
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold bg-alert-peach text-rose-700 border border-alert-border  hover:bg-[#f0c4b8] active:scale-95 rounded-xl custom-shadow transition-colors cursor-pointer select-none"
              >
                <Trash2 size={14} />
                সম্পূর্ণ অ্যাপের ডাটা ডিলিট ও ক্লিন করুন
              </button>
            ) : (
              <div className="space-y-3 p-4 bg-white border border-rose-200 rounded-xl max-w-md">
                <span className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                  <AlertCircle size={14} className="shrink-0" /> সম্পূর্ণ অ্যাপের মেমোরি খালি করার জন্য ইংরেজি বড় অক্ষরে টাইপ করুন: <strong className="bg-rose-100 px-1.5 py-0.5 rounded text-rose-900 font-sans font-extrabold">CLEAN</strong>
                </span>
                
                {entireResetError && (
                  <div className="text-[11px] font-bold text-rose-700 bg-alert-peach rounded-md px-2 py-1.5 flex items-center gap-1">
                    <AlertCircle size={12} className="shrink-0" /> {entireResetError}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2 text-xs font-semibold">
                  <input
                    type="text"
                    placeholder='যেমন "CLEAN" লিখুন'
                    value={entireResetInput}
                    onChange={(e) => {
                      setEntireResetInput(e.target.value);
                      if (entireResetError) setEntireResetError(null);
                    }}
                    className="flex-1 text-xs px-3 py-1.5 border border-rose-300 rounded-lg focus:outline-none focus:border-rose-500 bg-white placeholder:text-text-muted font-bold tracking-wider"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (entireResetInput.trim() === 'CLEAN') {
                          onCleanEntireAppData?.();
                          setResetCount(prev => prev + 1);
                          setShowEntireResetConfirm(false);
                          setEntireResetInput('');
                          setEntireResetError(null);
                          setMessage({ text: 'সম্পূর্ণ অ্যাপের ডাটাবেজ এবং অপারেটরসমূহ সফলভাবে ডিলিট ও ক্লিনআপ করা হয়েছে!', type: 'success' });
                        } else {
                          setEntireResetError('ধন্যবাদ, অনুগ্রহ করে সঠিক শব্দটি (CLEAN) টাইপ করুন');
                        }
                      }}
                      className="px-3 py-1.5 text-xs font-bold bg-alert-peach text-rose-700 border border-alert-border hover:bg-[#f0c4b8] rounded-lg transition-colors cursor-pointer whitespace-nowrap animate-pulse"
                    >
                      নিশ্চিত ক্লিন করুন
                    </button>
                    <button
                      type="button"
                      onClick={() => { 
                        setShowEntireResetConfirm(false); 
                        setEntireResetInput(''); 
                        setEntireResetError(null);
                      }}
                      className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-ice-tint border border-slate-300 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                    >
                      বাতিল
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Token History Modal */}
      {showTokenHistoryForUserId && tokenHistoryUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[20px] max-w-lg w-full p-6 shadow-xl border border-border-subtle animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center mb-5 border-b border-border-subtle pb-3">
              <h3 className="text-text-primary font-sans font-extrabold text-lg flex items-center gap-2">
                <Key className="text-slate-teal" size={20} />
                টোকেন হিস্ট্রি: {tokenHistoryUser.name}
              </h3>
              <button 
                onClick={() => setShowTokenHistoryForUserId(null)}
                className="text-text-muted hover:text-rose-700 bg-ice-tint hover:bg-alert-peach p-1.5 rounded-full transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div className="bg-ice-tint border border-border-subtle rounded-xl p-3 flex flex-col items-center justify-center">
                <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider mb-1">মোট টোকেন লিমিট</span>
                <span className="text-2xl font-black text-slate-teal">{tokenHistoryUser.tokenLimit || 0}</span>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex flex-col items-center justify-center">
                <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider mb-1">বর্তমানে বাকি আছে</span>
                <span className="text-2xl font-black text-emerald-700">
                  {Math.max(0, (tokenHistoryUser.tokenLimit || 0) - getUserTransactionsCount(tokenHistoryUser.id))}
                </span>
              </div>
            </div>

            <h4 className="text-xs font-bold text-slate-700 uppercase mb-3">টোকেন রিচার্জ হিস্ট্রি</h4>
            
            <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2">
              {tokenHistoryUser.tokenHistory && tokenHistoryUser.tokenHistory.length > 0 ? (
                tokenHistoryUser.tokenHistory.slice().reverse().map((entry: any, index: number) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-ice-tint border border-border-subtle rounded-xl">
                    <div>
                      <div className="text-sm font-bold text-text-primary">+{entry.amount} টোকেন যুক্ত হয়েছে</div>
                      <div className="text-[10px] text-text-muted font-medium">যুক্ত করেছেন: {entry.addedBy}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-teal">
                        {new Date(entry.date).toLocaleDateString('en-GB')}
                      </div>
                      <div className="text-[10px] text-text-muted">
                        {new Date(entry.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-text-muted text-sm font-medium bg-ice-tint rounded-xl border border-dashed border-border-subtle">
                  কোনো টোকেন হিস্ট্রি পাওয়া যায়নি
                </div>
              )}
            </div>

            <div className="pt-5 mt-3 flex justify-end">
              <button
                onClick={() => setShowTokenHistoryForUserId(null)}
                className="text-white bg-slate-800 hover:bg-slate-900 px-5 py-2 rounded-xl transition-colors font-bold text-sm"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
