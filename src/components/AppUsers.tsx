import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Users, Search, PlusCircle, MinusCircle, Trash2, Calendar, Mail, Phone, ShieldCheck, ShieldAlert, KeyRound, Building2, Key, X, Info } from 'lucide-react';

interface AppUsersProps {
  currentUser: any;
  setAlertConfig: (config: { message: string; type: 'success' | 'error' }) => void;
}

export default function AppUsers({ currentUser, setAlertConfig }: AppUsersProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [tokenAmount, setTokenAmount] = useState<number | ''>('');
  const [tokenAction, setTokenAction] = useState<'add'|'deduct'>('add');
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userCounts, setUserCounts] = useState<Record<string, number>>({});
  const [showHistoryUserId, setShowHistoryUserId] = useState<string | null>(null);
  const historyUser = users.find(u => u.id === showHistoryUserId);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      const fetchedUsers: any[] = [];
      const counts: Record<string, number> = {};

      for (const docSnapshot of snapshot.docs) {
        const userData = { id: docSnapshot.id, ...docSnapshot.data() };
        fetchedUsers.push(userData);

        let txCount = 0;
        try {
          const txRef = doc(db, 'user_transactions', docSnapshot.id);
          const txSnap = await getDoc(txRef);
          if (txSnap.exists()) {
             txCount = (txSnap.data().transactions || []).length;
          } else {
             if ((window as any).electronAPI) {
                const data = await (window as any).electronAPI.loadDb(docSnapshot.id);
                txCount = data ? data.length : 0;
             } else {
                const rawData = localStorage.getItem(`LAND_LEDGER_TRANSACTIONS_${docSnapshot.id}`);
                if (rawData) {
                  try { txCount = JSON.parse(rawData).length; } catch(e){}
                }
             }
          }
        } catch(e) {
           if ((window as any).electronAPI) {
              const data = await (window as any).electronAPI.loadDb(docSnapshot.id);
              txCount = data ? data.length : 0;
           } else {
              const rawData = localStorage.getItem(`LAND_LEDGER_TRANSACTIONS_${docSnapshot.id}`);
              if (rawData) {
                try { txCount = JSON.parse(rawData).length; } catch(e){}
              }
           }
        }
        counts[docSnapshot.id] = txCount;
      }

      // Sort by creation date
      fetchedUsers.sort((a, b) => {
        const dateA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const dateB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return dateB - dateA; // descending
      });
      setUsers(fetchedUsers);
      setUserCounts(counts);
    } catch (error) {
      console.error("Error fetching users:", error);
      setAlertConfig({ message: 'ইউজারদের তালিকা লোড করতে সমস্যা হয়েছে।', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddTokens = async () => {
    if (!selectedUser || !tokenAmount || Number(tokenAmount) <= 0) return;
    
    try {
      const amount = Number(tokenAmount);
      const userRef = doc(db, 'users', selectedUser.id);
      
      const newHistory = selectedUser.tokenHistory || [];
      let newLimit = selectedUser.tokenLimit || 0;

      if (tokenAction === 'add') {
        newLimit += amount;
        newHistory.push({
          amount: amount,
          date: new Date().toISOString(),
          addedBy: currentUser.name
        });
      } else {
        newLimit -= amount;
        if (newLimit < 0) newLimit = 0;
        newHistory.push({
          amount: -amount,
          date: new Date().toISOString(),
          addedBy: currentUser.name
        });
      }
      
      await setDoc(userRef, {
        tokenLimit: newLimit,
        tokenHistory: newHistory
      }, { merge: true });
      
      setAlertConfig({ message: `${selectedUser.name}-এর একাউন্টে ${amount} টি টোকেন ${tokenAction === 'add' ? 'যুক্ত' : 'কমানো'} করা হয়েছে!`, type: 'success' });
      setShowTokenModal(false);
      setSelectedUser(null);
      setTokenAmount('');
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error("Error adding tokens:", error);
      setAlertConfig({ message: 'টোকেন যুক্ত করতে সমস্যা হয়েছে।', type: 'error' });
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    try {
      const userRef = doc(db, 'users', selectedUser.id);
      await deleteDoc(userRef);
      
      // Optionally try to delete their transactions (if rules allow)
      try {
        const txRef = doc(db, 'user_transactions', selectedUser.id);
        await deleteDoc(txRef);
      } catch (e) {
         console.warn("Could not delete transactions or they don't exist", e);
      }
      
      setAlertConfig({ message: `${selectedUser.name}-এর অ্যাকাউন্ট সফলভাবে ডিলিট করা হয়েছে!`, type: 'success' });
      setShowDeleteModal(false);
      setSelectedUser(null);
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error("Error deleting user:", error);
      setAlertConfig({ message: 'অ্যাকাউন্ট ডিলিট করতে সমস্যা হয়েছে।', type: 'error' });
    }
  };

  const filteredUsers = users.filter(user => 
    (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.phone && user.phone.includes(searchTerm))
  );

  const toBn = (num: any): string => {
    if (num === undefined || num === null) return '';
    const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return num.toString().replace(/\d/g, (x: string) => bengaliDigits[parseInt(x)]);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'অজানা';
    // Handle Firestore timestamp
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    if (isNaN(date.getTime())) return 'অজানা';
    return date.toLocaleDateString('bn-BD', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (!currentUser?.isAdmin && currentUser?.userType !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center space-y-4">
        <ShieldAlert size={64} className="text-rose-500" />
        <h2 className="text-2xl font-bold text-text-primary">অনুমতি নেই</h2>
        <p className="text-text-muted">এই পেজটি দেখার জন্য আপনার অ্যাডমিন পারমিশন প্রয়োজন।</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12 font-sans text-text-primary">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-700 tracking-tight flex items-center gap-2">
            <Users className="text-slate-teal" />
            অ্যাপ ইউজার লিস্ট
          </h1>
          <p className="text-text-muted text-sm mt-1">
            মোট রেজিস্টারকৃত ইউজার: {toBn(users.length)} জন
          </p>
        </div>

        <div className="relative w-full md:w-72">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-text-muted">
            <Search size={18} />
          </span>
          <input 
            type="text" 
            placeholder="নাম, ইমেইল বা মোবাইল নম্বর দিয়ে খুঁজুন..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-border-subtle rounded-full text-slate-700 text-sm focus:outline-none focus:border-indigo-400 custom-shadow transition"
          />
        </div>
      </div>

      <div className="bg-white rounded-[20px] custom-shadow border border-border-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap text-slate-700">
            <thead className="bg-ice-tint/50 text-text-muted font-medium text-xs border-b border-border-subtle">
              <tr>
                <th className="px-6 py-4">ইউজারের নাম</th>
                <th className="px-6 py-4">যোগাযোগ</th>
                <th className="px-6 py-4">ধরন</th>
                <th className="px-6 py-4">রেজিস্ট্রেশন তারিখ</th>
                <th className="px-6 py-4 text-center">মোট টোকেন</th>
                <th className="px-6 py-4 text-center">খরচ হয়েছে</th>
                <th className="px-6 py-4 text-center">বাকি আছে</th>
                <th className="px-6 py-4 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-text-muted">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                      <p>ডেটা লোড হচ্ছে...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-text-muted">কোন ইউজার পাওয়া যায়নি।</td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-ice-tint/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-text-primary flex items-center gap-1.5">
                        {user.name || 'অজানা ইউজার'}
                        {user.isAdmin && <ShieldCheck size={14} className="text-emerald-500" title="Admin" />}
                      </div>
                      {user.userType === 'company' && user.companyName && (
                         <div className="text-[11px] text-text-muted mt-0.5 flex items-center gap-1">
                            <Building2 size={10} /> {user.companyName}
                         </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs space-y-1">
                      {user.email && (
                        <div className="flex items-center gap-1.5 text-slate-teal">
                          <Mail size={12} className="text-text-muted" /> {user.email}
                        </div>
                      )}
                      {user.phone && (
                        <div className="flex items-center gap-1.5 text-slate-teal">
                          <Phone size={12} className="text-text-muted" /> {user.phone}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                        user.userType === 'company' ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-table-header text-slate-teal border border-border-subtle'
                      }`}>
                        {user.userType === 'company' ? 'কোম্পানি' : 'ব্যক্তিগত'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      <div className="flex items-center gap-1.5 text-text-muted">
                        <Calendar size={12} /> {formatDate(user.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-xs text-slate-teal font-bold bg-ice-tint px-3 py-1 rounded-full border border-border-subtle">
                        {toBn(user.tokenLimit || 0)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-xs text-rose-700 font-bold bg-alert-peach px-3 py-1 rounded-full border border-border-subtle">
                        {toBn(userCounts[user.id] || 0)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                        (user.tokenLimit || 0) - (userCounts[user.id] || 0) <= 0 ? 'bg-alert-peach text-rose-700 border-border-subtle' : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                      }`}>
                        {toBn(Math.max(0, (user.tokenLimit || 0) - (userCounts[user.id] || 0)))}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setShowHistoryUserId(user.id)}
                          className="p-2 bg-ice-tint hover:bg-mint-pill text-slate-teal rounded-lg transition-colors cursor-pointer border border-border-subtle"
                          title="টোকেন হিস্ট্রি"
                        >
                          <Info size={16} />
                        </button>
                        <button
                          onClick={() => { setSelectedUser(user); setTokenAction('add'); setShowTokenModal(true); }}
                          className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-colors cursor-pointer border border-emerald-100"
                          title="টোকেন যুক্ত করুন"
                        >
                          <PlusCircle size={16} />
                        </button>
                        <button
                          onClick={() => { setSelectedUser(user); setTokenAction('deduct'); setShowTokenModal(true); }}
                          className="p-2 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-lg transition-colors cursor-pointer border border-orange-100"
                          title="টোকেন কমান"
                        >
                          <MinusCircle size={16} />
                        </button>
                        {!user.isAdmin && (
                          <button
                            onClick={() => { setSelectedUser(user); setShowDeleteModal(true); }}
                            className="p-2 bg-alert-peach hover:bg-rose-100 text-rose-700 rounded-lg transition-colors cursor-pointer border border-border-subtle"
                            title="ইউজার ডিলিট করুন"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Token Modal */}
      {showTokenModal && selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-border-subtle rounded-[20px] w-full max-w-sm p-6 shadow-2xl relative">
            <div className="text-center mb-6">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${tokenAction === 'add' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
                <KeyRound size={24} />
              </div>
              <h3 className="text-lg font-bold text-text-primary">টোকেন {tokenAction === 'add' ? 'যুক্ত করুন' : 'কমান'}</h3>
              <p className="text-xs text-text-muted mt-1">
                <strong className="text-text-primary">{selectedUser.name}</strong>-এর জন্য কতগুলো টোকেন {tokenAction === 'add' ? 'যুক্ত করতে' : 'কমাতে'} চান?
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-slate-teal mb-1 block">টোকেন পরিমাণ</label>
                <input 
                  type="number" 
                  value={tokenAmount}
                  onChange={(e) => setTokenAmount(e.target.value ? Number(e.target.value) : '')}
                  className={`w-full bg-ice-tint border border-border-subtle rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:ring-1 text-center font-bold ${tokenAction === 'add' ? 'focus:border-emerald-500 focus:ring-emerald-500' : 'focus:border-orange-500 focus:ring-orange-500'}`}
                  placeholder="যেমন: ৫০"
                  min="1"
                />
              </div>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => { setShowTokenModal(false); setSelectedUser(null); setTokenAmount(''); }}
                  className="flex-1 py-2.5 rounded-xl border border-border-subtle text-slate-teal font-bold text-sm hover:bg-ice-tint transition cursor-pointer"
                >
                  বাতিল
                </button>
                <button 
                  onClick={handleAddTokens}
                  disabled={!tokenAmount || Number(tokenAmount) <= 0}
                  className={`flex-1 py-2.5 rounded-xl text-white font-bold text-sm transition disabled:opacity-50 cursor-pointer custom-shadow ${tokenAction === 'add' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-orange-600 hover:bg-orange-700'}`}
                >
                  {tokenAction === 'add' ? 'যুক্ত করুন' : 'কমান'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-border-subtle rounded-[20px] w-full max-w-sm p-6 shadow-2xl relative">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-alert-peach text-rose-700 rounded-full flex items-center justify-center mx-auto mb-3">
                <ShieldAlert size={24} />
              </div>
              <h3 className="text-lg font-bold text-text-primary">সতর্কতা!</h3>
              <p className="text-xs text-text-muted mt-2 leading-relaxed">
                আপনি কি নিশ্চিত যে <strong className="text-text-primary">{selectedUser.name}</strong>-এর অ্যাকাউন্টটি মুছে ফেলতে চান? এটি মুছে ফেললে তিনি আর লগইন করতে পারবেন না।
              </p>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={() => { setShowDeleteModal(false); setSelectedUser(null); }}
                className="flex-1 py-2.5 rounded-xl border border-border-subtle text-slate-teal font-bold text-sm hover:bg-ice-tint transition cursor-pointer"
              >
                বাতিল
              </button>
              <button 
                onClick={handleDeleteUser}
                className="flex-1 py-2.5 rounded-xl bg-alert-peach text-rose-700 border border-alert-border text-white font-bold text-sm hover:bg-[#f0c4b8] transition cursor-pointer custom-shadow"
              >
                ডিলিট করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Token History Modal */}
      {showHistoryUserId && historyUser && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[20px] max-w-lg w-full p-6 shadow-2xl relative">
            <div className="flex justify-between items-center mb-5 border-b border-border-subtle pb-3">
              <h3 className="text-text-primary font-sans font-extrabold text-lg flex items-center gap-2">
                <Key className="text-slate-teal" size={20} />
                টোকেন হিস্ট্রি: {historyUser.name}
              </h3>
              <button 
                onClick={() => setShowHistoryUserId(null)}
                className="text-text-muted hover:text-rose-700 bg-ice-tint hover:bg-alert-peach p-1.5 rounded-full transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div className="bg-ice-tint border border-border-subtle rounded-xl p-3 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider mb-1">মোট টোকেন লিমিট</span>
                <span className="text-2xl font-black text-slate-teal">{toBn(historyUser.tokenLimit || 0)}</span>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider mb-1">বর্তমানে বাকি আছে</span>
                <span className="text-2xl font-black text-emerald-700">
                  {toBn(Math.max(0, (historyUser.tokenLimit || 0) - (userCounts[historyUser.id] || 0)))}
                </span>
              </div>
            </div>

            <h4 className="text-xs font-bold text-slate-700 uppercase mb-3">টোকেন রিচার্জ হিস্ট্রি</h4>
            
            <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2">
              {historyUser.tokenHistory && historyUser.tokenHistory.length > 0 ? (
                historyUser.tokenHistory.slice().reverse().map((entry: any, index: number) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-ice-tint border border-border-subtle rounded-xl">
                    <div>
                      <div className={`text-sm font-bold ${entry.amount > 0 ? 'text-emerald-700' : 'text-orange-700'}`}>
                        {entry.amount > 0 ? '+' : '-'}{toBn(Math.abs(entry.amount))} টোকেন {entry.amount > 0 ? 'যুক্ত হয়েছে' : 'কমানো হয়েছে'}
                      </div>
                      <div className="text-[10px] text-text-muted font-medium mt-0.5">অ্যাকশন করেছেন: {entry.addedBy}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-teal">
                        {new Date(entry.date).toLocaleDateString('bn-BD', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </div>
                      <div className="text-[10px] text-text-muted mt-0.5">
                        {toBn(new Date(entry.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }))}
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
                onClick={() => setShowHistoryUserId(null)}
                className="text-white bg-slate-800 hover:bg-slate-900 px-5 py-2.5 rounded-xl transition-colors font-bold text-sm cursor-pointer"
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
