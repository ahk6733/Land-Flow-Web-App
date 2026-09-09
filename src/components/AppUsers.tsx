import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Users, Search, PlusCircle, Trash2, Calendar, Mail, Phone, ShieldCheck, ShieldAlert, KeyRound, Building2 } from 'lucide-react';

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
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      const fetchedUsers: any[] = [];
      snapshot.forEach((doc) => {
        fetchedUsers.push({ id: doc.id, ...doc.data() });
      });
      // Sort by creation date
      fetchedUsers.sort((a, b) => {
        const dateA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const dateB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return dateB - dateA; // descending
      });
      setUsers(fetchedUsers);
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
      newHistory.push({
        amount: amount,
        date: new Date().toISOString(),
        addedBy: currentUser.name
      });
      
      const newLimit = (selectedUser.tokenLimit || 0) + amount;
      
      await setDoc(userRef, {
        tokenLimit: newLimit,
        tokenHistory: newHistory
      }, { merge: true });
      
      setAlertConfig({ message: `${selectedUser.name}-এর একাউন্টে ${amount} টি টোকেন যুক্ত করা হয়েছে!`, type: 'success' });
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
        <h2 className="text-2xl font-bold text-slate-800">অনুমতি নেই</h2>
        <p className="text-slate-500">এই পেজটি দেখার জন্য আপনার অ্যাডমিন পারমিশন প্রয়োজন।</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12 font-sans text-slate-800">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-700 tracking-tight flex items-center gap-2">
            <Users className="text-indigo-600" />
            অ্যাপ ইউজার লিস্ট
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            মোট রেজিস্টারকৃত ইউজার: {toBn(users.length)} জন
          </p>
        </div>

        <div className="relative w-full md:w-72">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search size={18} />
          </span>
          <input 
            type="text" 
            placeholder="নাম, ইমেইল বা মোবাইল নম্বর দিয়ে খুঁজুন..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-full text-slate-700 text-sm focus:outline-none focus:border-indigo-400 shadow-sm transition"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap text-slate-700">
            <thead className="bg-slate-50/50 text-slate-500 font-medium text-xs border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">ইউজারের নাম</th>
                <th className="px-6 py-4">যোগাযোগ</th>
                <th className="px-6 py-4">ধরন</th>
                <th className="px-6 py-4">রেজিস্ট্রেশন তারিখ</th>
                <th className="px-6 py-4 text-center">টোকেন ব্যালেন্স</th>
                <th className="px-6 py-4 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                      <p>ডেটা লোড হচ্ছে...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">কোন ইউজার পাওয়া যায়নি।</td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800 flex items-center gap-1.5">
                        {user.name || 'অজানা ইউজার'}
                        {user.isAdmin && <ShieldCheck size={14} className="text-emerald-500" title="Admin" />}
                      </div>
                      {user.userType === 'company' && user.companyName && (
                         <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                            <Building2 size={10} /> {user.companyName}
                         </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs space-y-1">
                      {user.email && (
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Mail size={12} className="text-slate-400" /> {user.email}
                        </div>
                      )}
                      {user.phone && (
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Phone size={12} className="text-slate-400" /> {user.phone}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                        user.userType === 'company' ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {user.userType === 'company' ? 'কোম্পানি' : 'ব্যক্তিগত'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Calendar size={12} /> {formatDate(user.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center px-3 py-1 bg-indigo-50 text-indigo-700 font-bold border border-indigo-100 rounded-full text-xs">
                        {toBn(user.tokenLimit || 0)} টি
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setSelectedUser(user); setShowTokenModal(true); }}
                          className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-colors cursor-pointer border border-emerald-100"
                          title="টোকেন যুক্ত করুন"
                        >
                          <PlusCircle size={16} />
                        </button>
                        {!user.isAdmin && (
                          <button
                            onClick={() => { setSelectedUser(user); setShowDeleteModal(true); }}
                            className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors cursor-pointer border border-rose-100"
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
          <div className="bg-white border border-slate-100 rounded-2xl w-full max-w-sm p-6 shadow-2xl relative">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <KeyRound size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-800">টোকেন যুক্ত করুন</h3>
              <p className="text-xs text-slate-500 mt-1">
                <strong className="text-slate-800">{selectedUser.name}</strong>-এর জন্য কতগুলো নতুন টোকেন যুক্ত করতে চান?
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-slate-600 mb-1 block">টোকেন পরিমাণ</label>
                <input 
                  type="number" 
                  value={tokenAmount}
                  onChange={(e) => setTokenAmount(e.target.value ? Number(e.target.value) : '')}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-center font-bold"
                  placeholder="যেমন: ৫০"
                  min="1"
                />
              </div>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => { setShowTokenModal(false); setSelectedUser(null); setTokenAmount(''); }}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition cursor-pointer"
                >
                  বাতিল
                </button>
                <button 
                  onClick={handleAddTokens}
                  disabled={!tokenAmount || Number(tokenAmount) <= 0}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  যুক্ত করুন
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-100 rounded-2xl w-full max-w-sm p-6 shadow-2xl relative">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <ShieldAlert size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-800">সতর্কতা!</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                আপনি কি নিশ্চিত যে <strong className="text-slate-800">{selectedUser.name}</strong>-এর অ্যাকাউন্টটি মুছে ফেলতে চান? এটি মুছে ফেললে তিনি আর লগইন করতে পারবেন না।
              </p>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={() => { setShowDeleteModal(false); setSelectedUser(null); }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition cursor-pointer"
              >
                বাতিল
              </button>
              <button 
                onClick={handleDeleteUser}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white font-bold text-sm hover:bg-rose-700 transition cursor-pointer shadow-sm"
              >
                ডিলিট করুন
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
