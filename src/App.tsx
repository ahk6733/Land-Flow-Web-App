/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { collection, doc, getDoc, setDoc, getDocs } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { db, auth } from './firebase';
import { LandTransaction } from './types';
import { INITIAL_TRANSACTIONS, INITIAL_CUSTOMERS, INITIAL_ORDERS, toBengaliNumber } from './data/defaultData';
import { openAttachmentInNewTab } from './utils/attachmentHelper';
import Dashboard from './components/Dashboard';
import TransactionForm from './components/TransactionForm';
import SearchQuery from './components/SearchQuery';
import OrderList from './components/OrderList';
import Customers from './components/Customers';
import StaffManagement from './components/StaffManagement';
import AppUsers from './components/AppUsers';
import AppLogo from './components/AppLogo';
import AuthGate from './components/AuthGate';
import UserProfile from './components/UserProfile';
import SettingsTab from './components/SettingsTab';
import Sidebar from './components/Sidebar';
import TopHeader from './components/TopHeader';
import TrashTab from './components/TrashTab';
import { 
  Settings,
  PlusCircle, 
  MinusCircle, 
  Search, 
  LayoutDashboard, 
  ShieldCheck, 
  HardDriveDownload, 
  HardDriveUpload, 
  Trash2, 
  RefreshCcw, 
  MapPin, 
  FileText,
  User,
  Building2,
  LogOut,
  ExternalLink,
  Printer,
  FileDown,
  X,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  Layers,
  Pencil,
  Eye,
  Calendar,
  Info,
  Sparkles
} from 'lucide-react';

const loadLocalSettings = async () => {
  if ((window as any).electronAPI) {
    const data = await (window as any).electronAPI.loadSettings();
    if (data) return data;
  }
  const saved = localStorage.getItem('LAND_LEDGER_SETTINGS');
  return saved ? JSON.parse(saved) : {};
};

const saveLocalSettings = async (data: any) => {
  if ((window as any).electronAPI) {
    await (window as any).electronAPI.saveSettings(data);
  } else {
    localStorage.setItem('LAND_LEDGER_SETTINGS', JSON.stringify(data));
  }
};

export default function App() {
  const [activeTabInternal, setActiveTabInternal] = useState('dashboard'); // dashboard | purchase | sale | search | profile
  const [tabHistory, setTabHistory] = useState<string[]>(['dashboard']);
  const [highlightedTxId, setHighlightedTxId] = useState<string | null>(null);

  const activeTab = activeTabInternal;
  const setActiveTab = (tab: string) => {
    if (tab === activeTabInternal) return;
    setTabHistory(prev => [...prev, tab]);
    setActiveTabInternal(tab);
  };

  const handleGoBack = () => {
    if (tabHistory.length > 1) {
      const newHistory = [...tabHistory];
      newHistory.pop(); // remove current
      const prev = newHistory[newHistory.length - 1];
      setActiveTabInternal(prev);
      setTabHistory(newHistory);
    }
  };

  const handleSelectGlobalSearchResult = (tx: LandTransaction) => {
    setHighlightedTxId(tx.id);
    setActiveTab(tx.type);
    
    // Expand accordion just in case
    if (tx.type === 'purchase') {
      setExpandedPurchases(prev => ({ ...prev, [tx.id]: true }));
    } else {
      setExpandedSales(prev => ({ ...prev, [tx.id]: true }));
    }

    setTimeout(() => {
      const el = document.getElementById(`tx-${tx.id}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const [transactions, setTransactions] = useState<LandTransaction[]>([]);
  const [trashTransactions, setTrashTransactions] = useState<LandTransaction[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [initialSearchQuery, setInitialSearchQuery] = useState<{ khatian?: string; dag?: string } | undefined>(undefined);
  const [showWipeModal, setShowWipeModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<LandTransaction | null>(null);
  const [printingDeed, setPrintingDeed] = useState<LandTransaction | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  const [showReloadMockModal, setShowReloadMockModal] = useState(false);
  const [importPendingData, setImportPendingData] = useState<LandTransaction[] | null>(null);
  const [alertConfig, setAlertConfig] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // States for purchase and sale tabs lists
  const [isAddingPurchase, setIsAddingPurchase] = useState(false);
  const [isAddingSale, setIsAddingSale] = useState(false);
  const [purchaseSearchTerm, setPurchaseSearchTerm] = useState('');
  const [saleSearchTerm, setSaleSearchTerm] = useState('');
  const [expandedPurchases, setExpandedPurchases] = useState<{ [key: string]: boolean }>({});
  const [expandedSales, setExpandedSales] = useState<{ [key: string]: boolean }>({});

  // Auth States
  const [registeredUsers, setRegisteredUsers] = useState<any[]>([]); // Kept for UserProfile compatibility for now
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [appTheme, setAppTheme] = useState('light');
  const [dbSaveLocation, setDbSaveLocation] = useState('local');

  // Sync settings helper
  const syncSettings = async (updates: any) => {
    const current = await loadLocalSettings();
    await saveLocalSettings({ ...current, ...updates });
  };

  useEffect(() => {
    if (!authInitialized) return;
    syncSettings({ appTheme });
    if (appTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [appTheme, authInitialized]);

  useEffect(() => {
    if (!authInitialized) return;
    syncSettings({ dbSaveLocation });
  }, [dbSaveLocation, authInitialized]);

  // Load Auth status first
  useEffect(() => {
    const initSettings = async () => {
      const settings = await loadLocalSettings();
      setAppTheme(settings.appTheme || 'light');
      setDbSaveLocation(settings.dbSaveLocation || 'local');
      if (settings.registeredUsers) {
        setRegisteredUsers(settings.registeredUsers);
      }
    };
    initSettings();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Prevent unverified password users from auto-logging in
        if (firebaseUser.providerData.some(p => p.providerId === 'password') && !firebaseUser.emailVerified) {
          setCurrentUser(null);
          setAuthInitialized(true);
          return;
        }

        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const userData = { id: firebaseUser.uid, ...userDoc.data() };
            setCurrentUser(userData);
            setActiveTab('dashboard');
          } else {
             // Fallback if document doesn't exist yet (handled in AuthGate usually)
             setCurrentUser({
                id: firebaseUser.uid,
                email: firebaseUser.email,
                name: firebaseUser.displayName || 'User',
                isAdmin: false
             });
          }
        } catch (e) {
          console.error("Error fetching user from Firestore", e);
        }
      } else {
        setCurrentUser(null);
      }
      setAuthInitialized(true);
    });

    return () => unsubscribe();
  }, []);

  // Load Transactions when currentUser is set
  useEffect(() => {
    if (!currentUser) {
      setTransactions([]);
      return;
    }

    const loadData = async () => {
      try {
        // Always load from Firebase first as the primary database
        const userDocRef = doc(db, 'user_transactions', currentUser.id);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          const firebaseData = userDocSnap.data().transactions || [];
          const firebaseTrashData = userDocSnap.data().trash || [];
          const firebaseCustomersData = userDocSnap.data().customers || [];
          const firebaseOrdersData = userDocSnap.data().orders || [];
          setTransactions(firebaseData);
          setTrashTransactions(firebaseTrashData);
          setCustomers(firebaseCustomersData);
          setOrders(firebaseOrdersData);
          
          // Update local DB with latest Firebase data
          try {
            await fetch('/api/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ transactions: firebaseData })
            });
            localStorage.setItem(`LAND_LEDGER_TRANSACTIONS_${currentUser.id}`, JSON.stringify(firebaseData));
            localStorage.setItem(`LAND_LEDGER_TRASH_${currentUser.id}`, JSON.stringify(firebaseTrashData));
            localStorage.setItem(`LAND_LEDGER_CUSTOMERS_${currentUser.id}`, JSON.stringify(firebaseCustomersData));
            localStorage.setItem(`LAND_LEDGER_ORDERS_${currentUser.id}`, JSON.stringify(firebaseOrdersData));
          } catch (e) {
            console.error('Error syncing Firebase data to local DB:', e);
          }
        } else {
          // If no data in Firebase yet, try loading from local DB as fallback
          throw new Error("No data in Firebase");
        }
      } catch (e) {
        console.error('Error loading from Firebase, falling back to local DB:', e);
        try {
          if ((window as any).electronAPI) {
            const data = await (window as any).electronAPI.loadDb(currentUser.id);
            if (data && data.length > 0) {
              setTransactions(data);
            }
          } else {
            const localData = localStorage.getItem(`LAND_LEDGER_TRANSACTIONS_${currentUser.id}`);
            if (localData) {
              setTransactions(JSON.parse(localData));
            }
            const localTrashData = localStorage.getItem(`LAND_LEDGER_TRASH_${currentUser.id}`);
            if (localTrashData) {
              setTrashTransactions(JSON.parse(localTrashData));
            }
            const localCustomersData = localStorage.getItem(`LAND_LEDGER_CUSTOMERS_${currentUser.id}`);
            if (localCustomersData) {
              setCustomers(JSON.parse(localCustomersData));
            }
            const localOrdersData = localStorage.getItem(`LAND_LEDGER_ORDERS_${currentUser.id}`);
            if (localOrdersData) {
              setOrders(JSON.parse(localOrdersData));
            }
          }
          
          // Fallback to legacy localStorage
          const userTransactionsKey = `LAND_LEDGER_TRANSACTIONS_${currentUser.id}`;
          const userSaved = localStorage.getItem(userTransactionsKey);
          if (userSaved) {
            setTransactions(JSON.parse(userSaved));
          } else {
            setTransactions([]);
          }
        } catch (localError) {
          console.error('Local DB load failed:', localError);
          setTransactions([]);
        }
      }
    };
    
    loadData();
  }, [currentUser]);

  // Auth Action Handlers
  const handleLoginSuccess = async (user: any) => {
    setCurrentUser(user);
    await syncSettings({ currentUser: user });
    setActiveTab('dashboard');
  };

  const handleRegisterUser = (newUser: any) => {
    newUser.tokenLimit = newUser.tokenLimit ?? 20; // Default token limit
    
    // First user to ever register becomes the system admin
    if (registeredUsers.length === 0) {
      newUser.isAdmin = true;
      newUser.userType = 'admin';
    } else {
      newUser.isAdmin = false;
    }

    const updated = [...registeredUsers, newUser];
    setRegisteredUsers(updated);
    syncSettings({ registeredUsers: updated });
  };

  const handleResetPassword = (email: string, newPassword: string) => {
    const updated = registeredUsers.map(user => 
      user.email === email ? { ...user, password: newPassword } : user
    );
    setRegisteredUsers(updated);
    syncSettings({ registeredUsers: updated });
  };

  const handleRemoveUser = async (userId: string) => {
    const updated = registeredUsers.filter(u => u.id !== userId);
    setRegisteredUsers(updated);
    await syncSettings({ registeredUsers: updated });
    
    // Attempt to delete user transactions if possible
    if ((window as any).electronAPI) {
      await (window as any).electronAPI.saveDb(userId, []);
    } else {
      localStorage.removeItem(`LAND_LEDGER_TRANSACTIONS_${userId}`);
    }
    
    if (currentUser && currentUser.id === userId) {
      handleLogout();
    }
  };

  const handleAddTokens = async (userId: string, amount: number) => {
    const updatedUsers = registeredUsers.map(u => {
      if (u.id === userId) {
        const newHistory = u.tokenHistory || [];
        const currentLimit = u.tokenLimit || 0;
        newHistory.push({
          amount: amount,
          date: new Date().toISOString(),
          addedBy: currentUser ? currentUser.name : 'Admin'
        });
        return { ...u, tokenLimit: currentLimit + amount, tokenHistory: newHistory };
      }
      return u;
    });
    setRegisteredUsers(updatedUsers);
    let updates: any = { registeredUsers: updatedUsers };
    
    if (currentUser && currentUser.id === userId) {
      const updatedUser = updatedUsers.find(u => u.id === userId);
      if (updatedUser) {
        setCurrentUser(updatedUser);
        updates.currentUser = updatedUser;
      }
    }
    
    await syncSettings(updates);
    
    setAlertConfig({
      message: 'সফলভাবে ইউজারের জন্য টোকেন যুক্ত করা হয়েছে!',
      type: 'success'
    });
  };

  const handleCleanEntireAppData = async () => {
    // 1. Keep only the real admin (the user who registered first or was assigned admin)
    const adminUser = registeredUsers.find(u => u.isAdmin);
    const resetUsersList = adminUser ? [adminUser] : [];

    // 2. Clear land ledger transactions for all other users from localStorage and Firebase
    for (const user of registeredUsers) {
      if ((window as any).electronAPI) {
        await (window as any).electronAPI.saveDb(user.id, []);
      } else {
        localStorage.removeItem(`LAND_LEDGER_TRANSACTIONS_${user.id}`);
      }
      
      try {
        const userTxRef = doc(db, 'user_transactions', user.id);
        await setDoc(userTxRef, { transactions: [] });
      } catch (e) {
        console.error("Error clearing Firebase data", e);
      }
    }

    setTransactions([]);

    // 3. Update the state and local storage
    setRegisteredUsers(resetUsersList);

    // 4. Make sure the admin remains logged in and safe
    const activeAdmin = adminUser || resetUsersList[0];
    setCurrentUser(activeAdmin);
    
    await syncSettings({
      registeredUsers: resetUsersList,
      currentUser: activeAdmin
    });

    // Show success alert
    setAlertConfig({
      message: 'অ্যাপের সম্পূর্ণ ডাটাবেজ এবং অপারেটরসমূহ ডিলিট ও ক্লিনআপ করা হয়েছে!',
      type: 'success'
    });
  };



  const handleUpdateProfile = async (updatedProfile: any) => {
    setCurrentUser(updatedProfile);
    const updatedList = registeredUsers.map(u => u.id === updatedProfile.id ? updatedProfile : u);
    setRegisteredUsers(updatedList);
    
    await syncSettings({
      currentUser: updatedProfile,
      registeredUsers: updatedList
    });

    try {
      if (updatedProfile && updatedProfile.id) {
        const userRef = doc(db, 'users', updatedProfile.id);
        await setDoc(userRef, updatedProfile, { merge: true });
      }
    } catch (e) {
      console.error("Error updating profile in Firebase:", e);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      await syncSettings({ currentUser: null });
      setTransactions([]);
      setActiveTab('dashboard');
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  // Save customers to LocalStorage and Firebase
  const saveCustomersData = async (newCustomers: any[]) => {
    setCustomers(newCustomers);
    if (currentUser) {
      try {
        localStorage.setItem(`LAND_LEDGER_CUSTOMERS_${currentUser.id}`, JSON.stringify(newCustomers));
      } catch (error) {}
      try {
        const userTxRef = doc(db, 'user_transactions', currentUser.id);
        await setDoc(userTxRef, { customers: newCustomers }, { merge: true });
      } catch (error) {
        console.error('Error syncing customers to Firebase:', error);
      }
    }
  };

  // Save orders to LocalStorage and Firebase
  const saveOrdersData = async (newOrders: any[]) => {
    setOrders(newOrders);
    if (currentUser) {
      try {
        localStorage.setItem(`LAND_LEDGER_ORDERS_${currentUser.id}`, JSON.stringify(newOrders));
      } catch (error) {}
      try {
        const userTxRef = doc(db, 'user_transactions', currentUser.id);
        await setDoc(userTxRef, { orders: newOrders }, { merge: true });
      } catch (error) {
        console.error('Error syncing orders to Firebase:', error);
      }
    }
  };

  // Save changes back to Local DB and LocalStorage
  const saveTransactionsData = async (newTransactions: LandTransaction[], newTrash: LandTransaction[] = trashTransactions) => {
    setTransactions(newTransactions);
    setTrashTransactions(newTrash);
    if (currentUser) {
      try {
        if ((window as any).electronAPI) {
          await (window as any).electronAPI.saveDb(currentUser.id, newTransactions);
        }
        
        // Save to LocalStorage as a fallback
        localStorage.setItem(`LAND_LEDGER_TRANSACTIONS_${currentUser.id}`, JSON.stringify(newTransactions));
        localStorage.setItem(`LAND_LEDGER_TRASH_${currentUser.id}`, JSON.stringify(newTrash));
      } catch (error) {
        console.error('Error saving database locally:', error);
        setAlertConfig({
          message: 'লোকাল ডাটাবেসে সেভ করতে সমস্যা হয়েছে।',
          type: 'error'
        });
      }

      // Auto-sync directly to Firebase
      try {
        const userTxRef = doc(db, 'user_transactions', currentUser.id);
        await setDoc(userTxRef, { transactions: newTransactions, trash: newTrash });
      } catch (error) {
        console.error('Error syncing database to Firebase:', error);
      }
    }
  };

  const handleDeleteAllData = async () => {
    await saveTransactionsData([]);

    try {
      if (currentUser) {
        const userTxRef = doc(db, 'user_transactions', currentUser.id);
        await setDoc(userTxRef, { transactions: [] });
      }
    } catch (e) {
      console.error("Error clearing Firebase data", e);
    }

    setAlertConfig({
      message: 'সম্পূর্ণ ডাটাবেজ সফলভাবে মুছে ফেলা হয়েছে!',
      type: 'success'
    });
  };

  // Add or Update transaction
  const handleSaveTransaction = async (savedTx: LandTransaction) => {
    if (!editingTransaction && (!currentUser.isAdmin && currentUser.userType !== 'admin')) {
      const limit = currentUser.tokenLimit || 0;
      if (transactions.length >= limit) {
        setAlertConfig({
          message: 'আপনার ডাটা এন্ট্রির লিমিট শেষ হয়ে গেছে। দয়া করে এডমিনের সাথে যোগাযোগ করে টোকেন সংগ্রহ করুন।',
          type: 'error'
        });
        return;
      }
    }

    if (editingTransaction) {
      const updated = transactions.map(t => t.id === savedTx.id ? savedTx : t);
      await saveTransactionsData(updated);
      setEditingTransaction(null);
    } else {
      const updated = [savedTx, ...transactions];
      await saveTransactionsData(updated);
    }
    setIsAddingPurchase(false);
    setIsAddingSale(false);
    setActiveTab(savedTx.type); // Redirect back to purchase or sale tab list
    setAlertConfig({
      message: 'লেনদেনের দলিলটি সফলভাবে সেভ করা হয়েছে!',
      type: 'success'
    });
  };

  // Edit transaction handler
  const handleEditTransaction = (tx: LandTransaction) => {
    setEditingTransaction(tx);
    setActiveTab(tx.type); // Direct to purchase or sale form tab
  };

  // Delete transaction handler
  const handleDeleteTransaction = (id: string) => {
    setTransactionToDelete(id);
  };

  // Trash actions
  const handleRestoreTransaction = (txToRestore: LandTransaction) => {
    const updatedTrash = trashTransactions.filter(t => t.id !== txToRestore.id);
    const updatedTransactions = [txToRestore, ...transactions];
    saveTransactionsData(updatedTransactions, updatedTrash);
    setAlertConfig({
      message: 'লেনদেনটি সফলভাবে রিস্টোর করা হয়েছে!',
      type: 'success'
    });
  };

  const handleDeletePermanently = (txId: string) => {
    const updatedTrash = trashTransactions.filter(t => t.id !== txId);
    saveTransactionsData(transactions, updatedTrash);
    setAlertConfig({
      message: 'লেনদেনটি চিরতরে মুছে ফেলা হয়েছে!',
      type: 'success'
    });
  };

  const handleEmptyTrash = () => {
    saveTransactionsData(transactions, []);
    setAlertConfig({
      message: 'ট্রাশ সফলভাবে খালি করা হয়েছে!',
      type: 'success'
    });
  };

  // Handling database json export (Allows the user to back up their offline local state safely)
  const handleExportDatabase = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(transactions, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `ভূমি_হিসাব_ডাটাবেজ_রপ্তানি_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Handling database json import
  const handleImportDatabase = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          setImportPendingData(parsed);
        } else {
          setAlertConfig({
            message: 'ত্রুটি: আপলোডকৃত ফাইলটি সঠিক ফর্ম্যাটের ভূমি হিসাব ডাটা ফাইল নয়।',
            type: 'error'
          });
        }
      } catch (err) {
        setAlertConfig({
          message: 'ত্রুটি: ফাইলটি পড়া সম্ভব হয়নি। সঠিক JSON ফাইল সিলেক্ট করুন।',
          type: 'error'
        });
      }
    };
    reader.readAsText(file);
    // clear input value
    e.target.value = '';
  };

  // Wipe all data and reload blank state
  const handleWipeData = () => {
    saveTransactionsData([]);
    setShowWipeModal(false);
    setAlertConfig({
      message: 'ডাটাবেজ সম্পূর্ণ খালি করা হয়েছে!',
      type: 'success'
    });
  };

  // Reload initial mock data
  const handleReloadMockData = () => {
    setShowReloadMockModal(true);
  };

  // Save specific deed document as high-quality A4 PDF by opening in a dedicated new tab
  const handleSaveAsPDF = (deed: LandTransaction) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      setAlertConfig({
        message: 'নতুন ট্যাব ওপেন করা সম্ভব হয়নি। অনুগ্রহ করে পপ-আপ ব্লকার চেক করুন।',
        type: 'error'
      });
      return;
    }

    const toBn = (num: any): string => {
      if (num === undefined || num === null) return '';
      const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
      return num.toString().replace(/\d/g, (x: string) => bengaliDigits[parseInt(x)]);
    };

    const docTypeLabel = deed.type === 'purchase' ? 'ক্রয়কৃত ভূমির দলিল' : 'বিক্রয়কৃত ভূমির দলিল';

    // Format all khatians and dags to Bengali string list
    let khatianTableRows = '';
    let totalNamjariSum = 0;
    deed.khatians.forEach(k => {
      const kParts: string[] = [];
      if (k.hasCS && k.csKhatian) kParts.push(`সি.এস: ${k.csKhatian}`);
      if (k.hasSA && k.saKhatian) kParts.push(`এস.এ: ${k.saKhatian}`);
      if (k.hasRS && k.rsKhatian) kParts.push(`আর.এস: ${k.rsKhatian}`);
      if (k.hasNamjari && k.namjariKhatian) kParts.push(`নামজারী: ${k.namjariKhatian}`);
      
      // Render kParts on multiple lines
      const kLabelHtml = kParts.map(part => `<div style="white-space: nowrap; margin-bottom: 2px;">${toBn(part)}</div>`).join('');

      k.dags.forEach((d, dIdx) => {
        totalNamjariSum += k.hasNamjari ? (Number(d.namjariAmount) || 0) : (Number(d.kateAmount) || 0);
        const dParts: string[] = [];
        if (d.hasCS && d.csDag) dParts.push(`সি.এস: ${d.csDag}`);
        if (d.hasSA && d.saDag) dParts.push(`এস.এ: ${d.saDag}`);
        if (d.hasRS && d.rsDag) dParts.push(`আর.এস: ${d.rsDag}`);
        
        const dLabel = toBn(dParts.join(', '));

        const rowspanStr = dIdx === 0 ? `rowspan="${k.dags.length}"` : '';
        const firstCol = dIdx === 0 ? `
          <td class="p-3 font-bold text-slate-800 border-r border-slate-200 align-top leading-relaxed bg-slate-50/20" ${rowspanStr}>
            <div class="flex flex-col">${kLabelHtml}</div>
          </td>
        ` : '';

        khatianTableRows += `
          <tr class="text-slate-800 hover:bg-slate-50 border-b border-slate-200">
            ${firstCol}
            <td class="p-3 text-slate-700 border-r border-slate-200 leading-relaxed font-semibold">
              ${dLabel}
            </td>
            <td class="p-3 text-slate-700 border-r border-slate-200 leading-relaxed">
              ${d.landClass || '-'}
            </td>
            <td class="p-3 text-right text-slate-700 border-r border-slate-200">
              ${toBn(k.hasNamjari ? (d.namjariAmount !== undefined ? d.namjariAmount : 0) : (d.kateAmount !== undefined ? d.kateAmount : 0))} শতক
            </td>
            <td class="p-3 text-right text-slate-900 font-extrabold">
              ${toBn(d.amount)} শতক
            </td>
          </tr>
        `;
      });
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>দলিল নং: ${deed.deedNumber} এর বিবরণী</title>
          <meta charset="utf-8">
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/tailwindcss/2.2.19/tailwind.min.css">
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Tiro+Bangla:ital@0;1&family=Hind+Siliguri:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
          <style>
            @page {
              size: A4 portrait;
              margin: 15mm 12mm 15mm 12mm;
            }
            
            /* Rigid Static CSS Fallbacks to prevent browser print engine overlapping */
            .grid {
              display: grid !important;
            }
            .grid-cols-2 {
              grid-template-columns: 1fr 1fr !important;
            }
            .gap-4 {
              gap: 16px !important;
            }
            .flex {
              display: flex !important;
            }
            .justify-between {
              justify-content: space-between !important;
            }
            .items-end {
              align-items: flex-end !important;
            }
            .items-center {
              align-items: center !important;
            }
            .text-center {
              text-align: center !important;
            }
            .text-right {
              text-align: right !important;
            }
            
            body, h1, h2, h3, p, span, td, th {
              font-family: 'Tiro Bangla', 'Hind Siliguri', 'Inter', -apple-system, sans-serif !important;
              line-height: normal !important;
            }
            
            p, h1, h2, h3, span {
              margin: 0 !important;
              padding: 0 !important;
            }

            .space-y-6 > * + * {
              margin-top: 24px !important;
            }
            .space-y-2 > * + * {
              margin-top: 8px !important;
            }
            .space-y-1 > * + * {
              margin-top: 4px !important;
            }
            .space-y-2\.5 > * + * {
              margin-top: 10px !important;
            }
            
            .font-bold { font-weight: 700 !important; }
            .font-extrabold { font-weight: 800 !important; }
            .font-medium { font-weight: 500 !important; }
            .font-semibold { font-weight: 600 !important; }
            
            .w-full { width: 100% !important; }
            .w-36 { width: 144px !important; }
            .h-8 { height: 32px !important; }
            .w-8 { width: 32px !important; }
            
            .border { border: 1px solid #cbd5e1 !important; }
            .border-b { border-bottom: 1px solid #cbd5e1 !important; }
            .border-r { border-right: 1px solid #cbd5e1 !important; }
            .border-t { border-top: 1px solid #cbd5e1 !important; }
            .border-dashed { border-style: dashed !important; }
            .border-double { border-style: double !important; }
            
            .border-slate-200 { border-color: #cbd5e1 !important; }
            .border-slate-300 { border-color: #94a3b8 !important; }
            .border-slate-400 { border-color: #64748b !important; }
            
            .rounded-lg { border-radius: 8px !important; }
            .rounded-xl { border-radius: 12px !important; }
            .rounded-2xl { border-radius: 16px !important; }
            
            .p-3 { padding: 12px !important; }
            .p-3\.5 { padding: 14px !important; }
            .p-4 { padding: 16px !important; }
            .p-6 { padding: 24px !important; }
            .pt-1 { padding-top: 4px !important; }
            .pt-24 { padding-top: 96px !important; }
            .pb-5 { padding-bottom: 20px !important; }
            .pb-1\.5 { padding-bottom: 6px !important; }
            .mx-auto { margin-left: auto !important; margin-right: auto !important; }
            
            .border-collapse { border-collapse: collapse !important; }
            .text-left { text-align: left !important; }
            .text-xs { font-size: 12px !important; }
            .text-sm { font-size: 14px !important; }
            .text-2xl { font-size: 24px !important; }
            .text-\[9px\] { font-size: 9px !important; }
            .text-\[10px\] { font-size: 10px !important; }
            .text-\[11px\] { font-size: 11px !important; }
            .text-\[13px\] { font-size: 13px !important; }
            .uppercase { text-transform: uppercase !important; }
            .tracking-wider { letter-spacing: 0.05em !important; }
            .tracking-widest { letter-spacing: 0.1em !important; }
            .italic { font-style: italic !important; }
            .block { display: block !important; }
            .inline-flex { display: inline-flex !important; }
            
            .bg-white { background-color: #ffffff !important; }
            .bg-slate-50 { background-color: #f8fafc !important; }
            .bg-slate-50\/50 { background-color: rgba(248, 250, 252, 0.5) !important; }
            .bg-slate-100 { background-color: #f1f5f9 !important; }
            .bg-amber-50\/10 { background-color: rgba(254, 243, 199, 0.1) !important; }
            .bg-slate-900 { background-color: #0f172a !important; }
            .bg-emerald-600 { background-color: #059669 !important; }
            
            .text-slate-900 { color: #0f172a !important; }
            .text-slate-950 { color: #020617 !important; }
            .text-slate-800 { color: #1e293b !important; }
            .text-slate-900 { color: #2d3748 !important; }
            .text-slate-700 { color: #334155 !important; }
            .text-slate-700 { color: #334155 !important; }
            .text-slate-700 { color: #4a5568 !important; }
            .text-slate-600 { color: #475569 !important; }
            .text-slate-500 { color: #64748b !important; }
            .text-slate-400 { color: #94a3b8 !important; }
            .text-emerald-800 { color: #065f46 !important; }
            .border-blue-500 { border: 2px solid #3b82f6 !important; }
            .bg-blue-50\/10 { background-color: rgba(239, 246, 255, 0.1) !important; }
            .text-blue-700 { color: #1d4ed8 !important; }
            .text-blue-900 { color: #1e3a8a !important; }

            /* Double border official corners positioning statically */
            .corner-tl {
              position: absolute !important;
              top: 0 !important;
              left: 0 !important;
              width: 32px !important;
              height: 32px !important;
              border-top: 2px solid #cbd5e1 !important;
              border-left: 2px solid #cbd5e1 !important;
            }
            .corner-tr {
              position: absolute !important;
              top: 0 !important;
              right: 0 !important;
              width: 32px !important;
              height: 32px !important;
              border-top: 2px solid #cbd5e1 !important;
              border-right: 2px solid #cbd5e1 !important;
            }
            .corner-bl {
              position: absolute !important;
              bottom: 0 !important;
              left: 0 !important;
              width: 32px !important;
              height: 32px !important;
              border-bottom: 2px solid #cbd5e1 !important;
              border-left: 2px solid #cbd5e1 !important;
            }
            .corner-br {
              position: absolute !important;
              bottom: 0 !important;
              right: 0 !important;
              width: 32px !important;
              height: 32px !important;
              border-bottom: 2px solid #cbd5e1 !important;
              border-right: 2px solid #cbd5e1 !important;
            }

            body {
              background-color: #f8fafc;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            
            @media print {
              body {
                background-color: #ffffff !important;
                padding: 0 !important;
                margin: 0 !important;
              }
              .no-print {
                display: none !important;
              }
              .print-container {
                border: none !important;
                box-shadow: none !important;
                padding: 0 !important;
                margin: 0 !important;
                width: 100% !important;
                max-width: 100% !important;
              }
              .print-border {
                border: 4px double #475569 !important;
                padding: 1.5rem !important;
              }
              .print-avoid-break {
                break-inside: avoid !important;
                page-break-inside: avoid !important;
              }
            }
          </style>
        </head>
        <body class="p-4 md:p-10 text-slate-800 antialiased bg-slate-50">
          <!-- Control Bar only shown on screen -->
          <div class="no-print max-w-[210mm] mx-auto mb-6 bg-slate-900 border border-slate-950 text-white p-4 rounded-xl shadow-lg flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="bg-emerald-600 p-2 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-white"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
              </div>
              <div>
                <h3 class="font-bold text-xs select-none">দলিল নং: ${toBn(deed.deedNumber)} এর বিবরণী</h3>
                <p class="text-[10px] text-slate-400">জমির ডিজিটাল রেজিস্ট্রি ও খতিয়ান খাতা</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button onclick="window.print()" class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all active:scale-95 shadow-sm cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                পিডিএফ ডাউনলোড / প্রিন্ট করুন
              </button>
              <button onclick="window.close()" class="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs px-3 py-2 rounded-lg cursor-pointer">
                বন্ধ করুন
              </button>
            </div>
          </div>

          <!-- Document sheet (A4 formatted) -->
          <div class="print-container bg-white p-6 sm:p-12 select-text max-w-[210mm] mx-auto border border-slate-200 shadow-xl rounded-2xl relative">
            <!-- Double border representing official land documents -->
            <div class="print-border border-4 border-double border-slate-300 p-6 sm:p-8 space-y-6 rounded-lg relative overflow-visible">
              
              <!-- Accent Corners -->
              <div class="corner-tl"></div>
              <div class="corner-tr"></div>
              <div class="corner-bl"></div>
              <div class="corner-br"></div>

              <!-- Header -->
              <div class="text-center space-y-2 pb-5 border-b border-slate-300">
                ${currentUser?.userType === 'company' && currentUser?.companyName ? `<div class="text-[28px] font-black text-slate-900 tracking-wide mb-1 leading-tight">${currentUser.companyName}</div>` : ''}
                <h1 class="text-[22px] font-extrabold text-slate-800 tracking-wider">ভূমি হস্তান্তর বিবরণী</h1>
                <p class="text-[10px] text-slate-500 uppercase tracking-widest font-extrabold">ডিজিটাল খতিয়ান খাতা ও দাগ হিসাব লেজার মেমো</p>
                <div class="inline-flex px-3 py-1 rounded bg-slate-100 text-[11px] font-bold text-slate-700 border border-slate-200">
                  শ্রেণী: ${toBn(docTypeLabel)}
                </div>
              </div>

              <!-- Meta details (Single full-length row) -->
              <div class="text-xs pt-1 print-avoid-break">
                <div class="border border-slate-200 p-3.5 rounded-lg bg-slate-50/50 flex justify-between items-center gap-4">
                  <div>
                    <span class="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">দলিল নম্বর ও তারিখ</span>
                    <p class="font-extrabold text-slate-950 text-base mt-1">দলিল নং: ${toBn(deed.deedNumber)}</p>
                  </div>
                  <div>
                    <span class="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">দলিলের প্রকৃতি</span>
                    <p class="font-extrabold text-slate-950 text-base mt-1">${deed.deedNature || '-'}</p>
                  </div>
                  <div class="text-right space-y-0.5">
                    <p class="font-medium text-slate-700 font-semibold">রেজিস্ট্রেশন তারিখ: ${toBn(deed.date)}</p>
                    <p class="font-medium text-slate-700">মৌজার নাম: ${deed.mouza.replace(/\s*মৌজা\s*$/, '')}</p>
                  </div>
                </div>
              </div>

              <!-- Buyer & Seller details (Guaranteed 2 columns inside layout) -->
              <div class="grid grid-cols-2 gap-4 text-xs print-avoid-break">
                <div class="border border-slate-200 p-3.5 rounded-lg space-y-1">
                  <span class="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">ভূমি ক্রেতা (Buyer)</span>
                  <p class="font-extrabold text-slate-900 text-[13px]">${deed.buyerName}</p>
                </div>
                <div class="border border-slate-200 p-3.5 rounded-lg space-y-1">
                  <span class="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">ভূমি বিক্রেতা (Seller)</span>
                  <p class="font-extrabold text-slate-900 text-[13px]">${deed.sellerName}</p>
                </div>
              </div>

              <!-- khatians & Dags Details Table -->
              <div class="space-y-2.5 pt-1">
                <h3 class="text-xs font-bold text-slate-700 border-b pb-1.5 uppercase tracking-wide">খতিয়ান ও সংশ্লিষ্ট দাগ বিবরণী</h3>
                <table class="w-full text-left border-collapse border border-slate-200 text-xs">
                  <thead>
                    <tr class="bg-slate-50 text-slate-700 font-bold border-b border-slate-300 text-[10px] uppercase">
                      <th class="p-2.5 border-r border-slate-200">খতিয়ান নম্বর সমূহ</th>
                      <th class="p-2.5 border-r border-slate-200">সংশ্লিষ্ট দাগ বিবরণী</th>
                      <th class="p-2.5 border-r border-slate-200">শ্রেণী</th>
                      <th class="p-2.5 border-r border-slate-200 text-right">নামজারী/কাতে পরিমান</th>
                      <th class="p-2.5 text-right">${deed.type === 'purchase' ? 'ক্রয়কৃত পরিমাণ' : 'বিক্রয় পরিমাণ'}</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-200">
                    ${khatianTableRows}
                  </tbody>
                  <tfoot>
                    <tr class="border-t border-slate-200 bg-blue-50/5">
                      <td colspan="3" class="p-2"></td>
                      <td colspan="2" class="p-2 text-right">
                        <div class="inline-flex justify-end w-full" style="display: flex; gap: 12px; justify-content: flex-end;">
                          <div class="border border-slate-300 rounded-lg p-2 bg-slate-50 flex flex-col items-center text-center space-y-0.5" style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px; background-color: #f8fafc; display: flex; flex-direction: column; align-items: center; text-align: center;">
                            <span class="text-[8px] uppercase font-bold text-slate-500 tracking-wider" style="font-size: 8px; text-transform: uppercase; font-weight: 800; color: #64748b; letter-spacing: 0.05em;">
                              মোট নামজারী/কাতে জমি:
                            </span>
                            <span class="font-bold text-slate-700 text-xs" style="font-weight: 700; color: #334155; font-size: 12px;">${toBn(totalNamjariSum)} শতক</span>
                          </div>
                          <div class="border-2 border-blue-500 rounded-lg p-2.5 bg-blue-50/10 flex flex-col items-center text-center space-y-0.5" style="border: 2px solid #3b82f6; border-radius: 8px; padding: 10px; background-color: rgba(239, 246, 255, 0.1); display: flex; flex-direction: column; align-items: center; text-align: center;">
                            <span class="text-[8px] uppercase font-extrabold text-blue-700 tracking-wider" style="font-size: 8px; text-transform: uppercase; font-weight: 850; color: #1d4ed8; letter-spacing: 0.05em;">
                              ${deed.type === 'purchase' ? 'মোট ক্রয়কৃত জমি:' : 'মোট বিক্রয়কৃত জমি:'}
                            </span>
                            <span class="font-black text-blue-900 text-xs" style="font-weight: 900; color: #1e3a8a; font-size: 12px;">${toBn(deed.transactionAmount)} শতক</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <!-- Signatures region -->
              <div class="pt-24 flex justify-between items-end gap-6 text-xs text-slate-400 select-none print-avoid-break">
                <div class="text-center space-y-1 w-36">
                  <div class="border-t border-dashed border-slate-300 pt-1 text-slate-700 font-bold">গ্রহীতার স্বাক্ষর</div>
                  <p class="text-[9px] text-slate-400 font-light">তারিখ সহ</p>
                </div>
                
                <div class="text-center text-[9px] text-slate-400 italic font-medium">
                  হিসাব জেনারেট সম্পন্ন করেছে ডিজিটাল খতিয়ান খাতা
                </div>
                
                <div class="text-center space-y-1 w-36">
                  <div class="border-t border-dashed border-slate-300 pt-1 text-slate-700 font-bold">পরিচালকের স্বাক্ষর</div>
                  <p class="text-[9px] text-slate-400 font-light">তারিখ ও সীলমোহর</p>
                </div>
              </div>

            </div>
          </div>
          
          <script>
            // Safety window event listener for assets
            window.addEventListener('load', () => {
              // Give 1000ms to let elements load and paint correctly
              setTimeout(() => {
                window.print();
              }, 1000);
            });
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // Callback to trigger dynamic search lookup from home list click
  const handleRequestSearchQuery = (query: { khatian?: string; dag?: string }) => {
    setInitialSearchQuery(query);
  };

  // Filter purchased transactions
  const purchaseTransactions = transactions.filter(t => t.type === 'purchase');
  
  // Calculate analytics for purchases
  const totalPurchaseDeeds = purchaseTransactions.length;
  const uniquePurchaseMouzas = new Set(purchaseTransactions.map(t => t.mouza.trim().toLowerCase())).size;
  const totalPurchaseAmount = purchaseTransactions.reduce((sum, t) => sum + (Number(t.transactionAmount) || 0), 0);

  const filteredPurchases = purchaseTransactions.filter(t => {
    const term = purchaseSearchTerm.trim().toLowerCase();
    if (!term) return true;
    return (
      t.deedNumber.toLowerCase().includes(term) ||
      (t.deedNature || '').toLowerCase().includes(term) ||
      t.buyerName.toLowerCase().includes(term) ||
      t.sellerName.toLowerCase().includes(term) ||
      t.mouza.toLowerCase().includes(term) ||
      t.khatians.some(k => 
        (k.csKhatian && k.csKhatian.includes(term)) ||
        (k.saKhatian && k.saKhatian.includes(term)) ||
        (k.rsKhatian && k.rsKhatian.includes(term)) ||
        (k.namjariKhatian && k.namjariKhatian.includes(term)) ||
        k.dags.some(d => 
          (d.csDag && d.csDag.includes(term)) ||
          (d.saDag && d.saDag.includes(term)) ||
          (d.rsDag && d.rsDag.includes(term))
        )
      )
    );
  });

  // Filter sold transactions
  const saleTransactions = transactions.filter(t => t.type === 'sale');
  
  // Calculate analytics for sales
  const totalSaleDeeds = saleTransactions.length;
  const uniqueSaleMouzas = new Set(saleTransactions.map(t => t.mouza.trim().toLowerCase())).size;
  const totalSaleAmount = saleTransactions.reduce((sum, t) => sum + (Number(t.transactionAmount) || 0), 0);

  const filteredSales = saleTransactions.filter(t => {
    const term = saleSearchTerm.trim().toLowerCase();
    if (!term) return true;
    return (
      t.deedNumber.toLowerCase().includes(term) ||
      (t.deedNature || '').toLowerCase().includes(term) ||
      t.buyerName.toLowerCase().includes(term) ||
      t.sellerName.toLowerCase().includes(term) ||
      t.mouza.toLowerCase().includes(term) ||
      t.khatians.some(k => 
        (k.csKhatian && k.csKhatian.includes(term)) ||
        (k.saKhatian && k.saKhatian.includes(term)) ||
        (k.rsKhatian && k.rsKhatian.includes(term)) ||
        (k.namjariKhatian && k.namjariKhatian.includes(term)) ||
        k.dags.some(d => 
          (d.csDag && d.csDag.includes(term)) ||
          (d.saDag && d.saDag.includes(term)) ||
          (d.rsDag && d.rsDag.includes(term))
        )
      )
    );
  });

  const handleShortcutSearch = (type: 'khatian' | 'dag', value: string) => {
    if (type === 'khatian') {
      setInitialSearchQuery({ khatian: value });
    } else {
      setInitialSearchQuery({ dag: value });
    }
    setActiveTab('search');
  };

  if (!authInitialized) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <RefreshCcw className="text-emerald-500 animate-spin" size={32} />
        <p className="text-slate-400 mt-3 text-xs font-sans">ভূমি রেজিস্ট্রি সিস্টেম লোড হচ্ছে...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <AuthGate 
        onLoginSuccess={handleLoginSuccess} 
      />
    );
  }

  return (
    <div className="fixed inset-0 w-full flex flex-col-reverse md:flex-row font-sans text-slate-800 antialiased overflow-hidden print:static print:h-auto print:overflow-visible print:block">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} currentUser={currentUser} />
      
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[var(--color-main-bg)] relative print:h-auto print:overflow-visible print:block print:bg-white">
        <TopHeader 
          currentUser={currentUser} 
          onLogout={handleLogout} 
          canGoBack={tabHistory.length > 1}
          onGoBack={handleGoBack}
          onProfileClick={() => setActiveTab('profile')}
          onTrashClick={() => setActiveTab('trash')}
          onHomeClick={() => setActiveTab('dashboard')}
          onSync={async () => {
            setIsSyncing(true);
            try {
              if (currentUser) {
                const userDocRef = doc(db, 'user_transactions', currentUser.id);
                await setDoc(userDocRef, { transactions, trash: trashTransactions });
                setAlertConfig({ message: 'সকল ডাটা সফলভাবে ফায়ারবেজে সিঙ্ক হয়েছে!', type: 'success' });
              }
            } catch (e) {
              console.error('Firebase sync error:', e);
              setAlertConfig({ message: 'সিঙ্ক ব্যর্থ হয়েছে। ইন্টারনেট সংযোগ চেক করুন।', type: 'error' });
            } finally {
              setIsSyncing(false);
            }
          }}
          isSyncing={isSyncing}
        />
        
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 print:p-0 print:overflow-visible print:block print:w-full">
        {activeTab === 'profile' && (
          <SettingsTab
            currentUser={currentUser}
            onUpdateProfile={handleUpdateProfile}
            onLogout={handleLogout}
            transactions={transactions}
            onImportBackup={(data) => {
              saveTransactionsData(data);
              setAlertConfig({
                message: 'ডাটাবেজ সফলভাবে রিস্টোর করা হয়েছে!',
                type: 'success'
              });
            }}
            onDeleteAllData={handleDeleteAllData}
            registeredUsers={registeredUsers}
            onAddUser={handleRegisterUser}
            onRemoveUser={handleRemoveUser}
            onCleanEntireAppData={handleCleanEntireAppData}
            appTheme={appTheme}
            setAppTheme={setAppTheme}
            dbSaveLocation={dbSaveLocation}
            setDbSaveLocation={setDbSaveLocation}
            onAddTokens={handleAddTokens}
          />
        )}
        
        {activeTab === 'trash' && (
          <TrashTab
            trashTransactions={trashTransactions}
            onRestore={handleRestoreTransaction}
            onDeletePermanently={handleDeletePermanently}
            onEmptyTrash={handleEmptyTrash}
          />
        )}

        {activeTab === 'dashboard' && (
          <Dashboard 
            transactions={transactions} 
            onNavigateToTab={setActiveTab}
            onSetSearchQuery={handleRequestSearchQuery}
            onEditTransaction={handleEditTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            onPrintTransaction={setPrintingDeed}
            onHighlightTransaction={setHighlightedTxId}
            onAddPurchase={() => {
              setActiveTab('purchase');
              setIsAddingPurchase(true);
            }}
            onAddSale={() => {
              setActiveTab('sale');
              setIsAddingSale(true);
            }}
          />
        )}
        
        {activeTab === 'purchase' && (
          <>
            {(isAddingPurchase || (editingTransaction && editingTransaction.type === 'purchase')) && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 md:p-4 overflow-hidden md:overflow-y-auto">
                <div className="bg-emerald-50 rounded-none md:rounded-2xl border-0 md:border md:border-emerald-200 shadow-2xl p-4 md:p-6 space-y-6 w-full max-w-5xl h-full md:h-auto max-h-screen md:max-h-[90vh] my-0 md:my-8 relative animate-in zoom-in-95 duration-200 overflow-y-auto overflow-x-hidden">
                  <TransactionForm 
                    type="purchase" 
                    onSave={handleSaveTransaction} 
                    transactions={transactions}
                    editingTransaction={editingTransaction}
                    onCancelEdit={() => {
                      setEditingTransaction(null);
                      setIsAddingPurchase(false);
                    }}
                    currentUser={currentUser}
                  />
                </div>
              </div>
            )}
            <div className="space-y-6">
              {/* Header block with statistics & "জমি ক্রয় ইনপুট" button */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-row items-center justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-slate-900 font-sans flex items-center gap-2">
                    <PlusCircle className="text-teal-600 hidden sm:block" size={20} />
                    ক্রয়কৃত জমির তথ্য
                  </h2>
                  <p className="text-xs text-slate-500 hidden sm:block">
                    আপনার মৌজা ও দলিল ভিত্তিক সকল জমি ক্রয় এন্ট্রির হিসাব এক নজরে পর্যবেক্ষণ করুন।
                  </p>
                </div>

                <button
                  onClick={() => setIsAddingPurchase(true)}
                  className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 active:scale-95 transition-all rounded-xl shadow-md cursor-pointer select-none shrink-0"
                >
                  <PlusCircle size={15} />
                  <span className="hidden sm:inline">জমি ক্রয় ইনপুট</span>
                  <span className="sm:hidden">ইনপুট</span>
                </button>
              </div>

              {/* Purchase Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl border border-teal-100 p-5 flex flex-col items-center justify-center text-center gap-2 relative overflow-hidden group">
                  <div className="absolute -right-6 -top-6 w-24 h-24 bg-teal-500/5 rounded-full blur-2xl group-hover:bg-teal-500/10 transition-colors" />
                  <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center shrink-0 border border-teal-100/50 mb-1">
                    <FileText size={20} />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-slate-800 tracking-tight font-mono">{toBengaliNumber(totalPurchaseDeeds)}</div>
                    <div className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">মোট ক্রয়কৃত দলিল সংখ্যা</div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-teal-100 p-5 flex flex-col items-center justify-center text-center gap-2 relative overflow-hidden group">
                  <div className="absolute -right-6 -top-6 w-24 h-24 bg-teal-500/5 rounded-full blur-2xl group-hover:bg-teal-500/10 transition-colors" />
                  <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center shrink-0 border border-teal-100/50 mb-1">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-slate-800 tracking-tight font-mono">{toBengaliNumber(uniquePurchaseMouzas)}</div>
                    <div className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">মোট মৌজা সংখ্যা</div>
                  </div>
                </div>

                <div className="col-span-2 md:col-span-1 bg-white rounded-2xl border border-teal-100 p-5 flex flex-col items-center justify-center text-center gap-2 relative overflow-hidden group">
                  <div className="absolute -right-6 -top-6 w-24 h-24 bg-teal-500/5 rounded-full blur-2xl group-hover:bg-teal-500/10 transition-colors" />
                  <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center shrink-0 border border-teal-100/50 mb-1">
                    <Layers size={20} />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-slate-800 tracking-tight font-mono">{toBengaliNumber(totalPurchaseAmount)} <span className="text-sm font-bold text-slate-500">শতক</span></div>
                    <div className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">মোট ক্রয়কৃত জমির পরিমান</div>
                  </div>
                </div>
              </div>

              {/* Purchase entries list */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-5 border-b border-slate-200 flex flex-col items-center justify-center gap-4 bg-slate-50/50">
                  <div className="text-slate-800 font-bold text-sm text-center">
                    ক্রয় দলিলের তালিকা ({toBengaliNumber(filteredPurchases.length)} টি দলিল)
                  </div>
                  <div className="relative w-full sm:w-64">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                      <Search size={14} />
                    </span>
                    <input
                      type="text"
                      placeholder="দলিল, মৌজা, খতিয়ান বা দাগ দিয়ে খুঁজুন..."
                      value={purchaseSearchTerm}
                      onChange={(e) => setPurchaseSearchTerm(e.target.value)}
                      className="pl-9 pr-4 py-1.5 text-xs text-slate-800 rounded-lg border border-slate-200 focus:outline-none focus:border-emerald-600 w-full bg-white"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto font-sans">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                        <th className="py-1.5 px-4 w-10 text-center"></th>
                        <th className="py-1.5 px-4 text-left">দলিল নম্বর</th>
                        <th className="py-1.5 px-4 text-left">দলিলের প্রকৃতি</th>
                        <th className="py-1.5 px-4 text-left">মৌজার নাম</th>
                        <th className="py-1.5 px-4 text-left">ক্রেতার নাম</th>
                        <th className="py-1.5 px-4 text-left">বিক্রেতার নাম</th>
                        <th className="py-1.5 px-4 text-center">ক্রয়কৃত জমি (শতক)</th>
                        <th className="py-1.5 px-4 text-center">অ্যাকশন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredPurchases.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-12 text-center text-slate-400 font-light text-sm">
                            কোন ক্রয়কৃত জমির রেকর্ড অনুসন্ধানের সাথে মেলেনি বা যোগ করা হয়নি।
                          </td>
                        </tr>
                      ) : (
                        filteredPurchases.map((t) => {
                          const isExpanded = !!expandedPurchases[t.id];

                          return (
                            <React.Fragment key={t.id}>
                              <tr 
                                id={`tx-${t.id}`}
                                className={`transition-all duration-500 ${highlightedTxId === t.id ? 'bg-indigo-50 shadow-inner' : 'hover:bg-slate-50/50'}`}
                              >
                                <td className={`py-1.5 px-4 text-center ${highlightedTxId === t.id ? 'border-l-4 border-indigo-500' : ''}`}>
                                  <button
                                    onClick={() => setExpandedPurchases(prev => ({ ...prev, [t.id]: !prev[t.id] }))}
                                    className="p-1 rounded hover:bg-slate-100 text-slate-500 cursor-pointer"
                                  >
                                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                  </button>
                                </td>
                                <td className="py-1.5 px-4">
                                  <div className="font-semibold text-slate-900 text-sm">দলিল নং {toBengaliNumber(t.deedNumber)}</div>
                                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">{toBengaliNumber(t.date)}</div>
                                </td>
                                <td className="py-1.5 px-4 align-middle text-left font-medium text-slate-600 text-[11px]">
                                  {t.deedNature || '-'}
                                </td>
                                <td className="py-1.5 px-4 align-middle text-left">
                                  <div className="text-slate-900 font-bold flex items-center justify-start gap-1">
                                    <MapPin size={11} className="text-slate-500 shrink-0" />
                                    <span>{t.mouza.replace(/\s*মৌজা\s*$/, '')}</span>
                                  </div>
                                </td>
                                <td className="py-1.5 px-4">
                                  <div className="font-bold text-slate-900">{t.buyerName}</div>
                                </td>
                                <td className="py-1.5 px-4">
                                  <div className="font-bold text-slate-900">{t.sellerName}</div>
                                </td>
                                <td className="py-1.5 px-4 text-center font-mono font-bold text-sm text-emerald-700">
                                  +{toBengaliNumber(t.transactionAmount.toFixed(2))}
                                </td>
                                <td className="py-1.5 px-4 text-center">
                                  <div className="flex items-center justify-center gap-3 font-sans">
                                    <button
                                      onClick={() => handleShortcutSearch('khatian', t.khatians[0]?.csKhatian || t.khatians[0]?.saKhatian || '')}
                                      className="text-indigo-700 hover:text-indigo-900 duration-100 font-semibold inline-flex items-center gap-0.5 cursor-pointer"
                                      title="খতিয়ান খতিয়ে অনুসন্ধান"
                                    >
                                      <Search size={12} />
                                      <span className="hidden sm:inline">খুঁজুন</span>
                                    </button>
                                    <button
                                      onClick={() => handleEditTransaction(t)}
                                      className="text-blue-600 hover:text-blue-800 duration-100 font-semibold inline-flex items-center gap-0.5 cursor-pointer"
                                      title="সম্পাদনা করুন"
                                    >
                                      <Pencil size={11} />
                                      <span className="hidden sm:inline">ইডিট</span>
                                    </button>
                                    <button
                                      onClick={() => setPrintingDeed(t)}
                                      className="text-slate-700 hover:text-slate-900 duration-100 font-semibold inline-flex items-center gap-0.5 cursor-pointer"
                                      title="পিডিএফ সেভ করুন"
                                    >
                                      <FileDown size={11} />
                                      <span className="hidden sm:inline">পিডিএফ</span>
                                    </button>
                                    <button
                                      onClick={() => handleDeleteTransaction(t.id)}
                                      className="text-rose-600 hover:text-rose-800 duration-100 font-semibold inline-flex items-center gap-0.5 cursor-pointer"
                                      title="ডিলিট করুন"
                                    >
                                      <Trash2 size={11} />
                                      <span className="hidden sm:inline">ডিলিট</span>
                                    </button>
                                  </div>
                                </td>
                              </tr>

                              {/* Expanded Row component */}
                              {isExpanded && (
                                <tr className="bg-slate-50/40">
                                  <td colSpan={8} className="py-3 px-4 pb-4">
                                    <div className="ml-10 px-5 py-4 bg-white rounded-xl border border-slate-200 shadow-inner grid grid-cols-1 md:grid-cols-2 gap-5">
                                      {/* Left block: Khatians and plots */}
                                      <div className="space-y-3">
                                        <div className="flex items-center justify-between text-xs text-slate-700 font-bold border-b border-slate-100 pb-2">
                                          <span className="flex items-center gap-1.5">
                                            <Layers size={14} className="text-teal-600" />
                                            খতিয়ান ও দাগ বিবরণী ({toBengaliNumber(t.khatians.length)}  টি খতিয়ান)
                                          </span>
                                          <span className="text-[10px] text-slate-400 font-light">শতক এককে হিসাব</span>
                                        </div>
                                        <div className="space-y-3">
                                          {t.khatians.map((k, kIdx) => {
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

                                            return (
                                              <div key={k.id || kIdx} className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
                                                <div className="font-bold text-slate-800 text-xs flex flex-wrap items-center gap-1.5 border-b border-dashed border-slate-200 pb-1.5">
                                                  <span className="text-[10px] uppercase font-bold bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">খতিয়ান</span>
                                                  <span>{activeKLabels.join(', ')}</span>
                                                </div>
                                                <div className="space-y-1.5 text-[11px]">
                                                  {k.dags.map((d, dIdx) => {
                                                    const activeDLabels: string[] = [];
                                                    if (d.hasCS && d.csDag) activeDLabels.push(`সি.এস দাগ: ${toBengaliNumber(d.csDag)}`);
                                                    if (d.hasSA && d.saDag) activeDLabels.push(`এস.এ দাগ: ${toBengaliNumber(d.saDag)}`);
                                                    if (d.hasRS && d.rsDag) activeDLabels.push(`আর.এস দাগ: ${toBengaliNumber(d.rsDag)}`);
                                                    if (d.landClass) activeDLabels.push(`শ্রেণী: ${d.landClass}`);

                                                    if (activeDLabels.length === 0) {
                                                      if (d.csDag) activeDLabels.push(`সি.এস দাগ: ${toBengaliNumber(d.csDag)}`);
                                                      if (d.saDag) activeDLabels.push(`এস.এ দাগ: ${toBengaliNumber(d.saDag)}`);
                                                      if (d.rsDag) activeDLabels.push(`আর.এস দাগ: ${toBengaliNumber(d.rsDag)}`);
                                                      if (d.landClass) activeDLabels.push(`শ্রেণী: ${d.landClass}`);
                                                    }

                                                    return (
                                                      <div key={d.id || dIdx} className="flex justify-between items-center hover:bg-slate-100/50 p-1 rounded transition-colors">
                                                        <span className="font-medium text-slate-600">{activeDLabels.join(', ')}</span>
                                                        <div className="flex items-center gap-4">
                                                          <div className="flex items-center gap-1 text-slate-500">
                                                            <span>জমির পরিমাণ:</span>
                                                            <strong className="text-slate-700 font-mono">{toBengaliNumber(d.amount)} শতক</strong>
                                                          </div>
                                                          <button
                                                            onClick={() => handleShortcutSearch('dag', d.csDag || d.saDag || d.rsDag || '')}
                                                            className="text-[9px] text-slate-400 hover:text-emerald-700 font-medium border border-slate-200 hover:border-emerald-300 rounded px-1.5 py-0.5 bg-white shadow-xs ml-1"
                                                          >
                                                            ইতিহাস
                                                          </button>
                                                        </div>
                                                      </div>
                                                    );
                                                  })}
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>

                                      {/* Right block: Attachments & Notes */}
                                      <div className="space-y-4">
                                        <div className="space-y-2">
                                          <div className="flex items-center gap-1.5 text-xs text-slate-700 font-bold border-b border-slate-100 pb-2">
                                            <Info size={14} className="text-indigo-600" />
                                            <span>দলিল ও নথিপত্র স্ক্যান কপি ({(t.attachments && t.attachments.length) ? toBengaliNumber(t.attachments.length) : '০'} টি ফাইল)</span>
                                          </div>
                                          {t.attachments && t.attachments.length > 0 ? (
                                            <div className="grid grid-cols-1 gap-1.5 text-[11px]">
                                              {t.attachments.map((file) => (
                                                <div key={file.id} className="flex justify-between items-center bg-slate-100 border border-slate-200 rounded-lg p-2 hover:bg-slate-100 transition-colors">
                                                  <span className="truncate max-w-[130px] sm:max-w-[160px] font-medium text-slate-700" title={file.name}>
                                                    {file.name}
                                                  </span>
                                                  <div className="flex items-center gap-1.5 text-[10px]">
                                                    <span className="text-[9px] text-slate-400 font-mono shrink-0">{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                                                    <div className="flex items-center gap-1.5 border-l border-slate-200 pl-2 shrink-0">
                                                      <button
                                                        type="button"
                                                        onClick={() => openAttachmentInNewTab(file)}
                                                        className="text-[10px] text-teal-700 hover:text-teal-950 font-bold hover:underline cursor-pointer flex items-center gap-0.5 select-none"
                                                      >
                                                        <Eye size={11} />
                                                        দেখুন
                                                      </button>
                                                    </div>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          ) : (
                                            <div className="text-[11px] text-slate-500 italic py-2 text-center border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
                                              সংযুক্ত স্ক্যান করা দলিলের ফাইল পাওয়া যায়নি।
                                            </div>
                                          )}
                                        </div>

                                        {/* Notes display */}
                                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-1.5">
                                          <div className="text-slate-700 font-bold text-xs flex items-center gap-1">
                                            <FileText size={13} className="text-slate-500" />
                                            <span>অতিরিক্ত নোট ও মন্তব্য</span>
                                          </div>
                                          <p className="text-[11px] text-slate-600 leading-relaxed font-sans">
                                            {t.notes ? t.notes : 'এই ক্রয় দলিলের সাথে বিশেষ কোনো বাড়তি নোট বা মন্তব্য উল্লেখ করা হয়নি।'}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'sale' && (
          <>
            {(isAddingSale || (editingTransaction && editingTransaction.type === 'sale')) && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 md:p-4 overflow-hidden md:overflow-y-auto">
                <div className="bg-rose-50 rounded-none md:rounded-2xl border-0 md:border md:border-rose-200 shadow-2xl p-4 md:p-6 space-y-6 w-full max-w-5xl h-full md:h-auto max-h-screen md:max-h-[90vh] my-0 md:my-8 relative animate-in zoom-in-95 duration-200 overflow-y-auto overflow-x-hidden">
                  <TransactionForm 
                    type="sale" 
                    onSave={handleSaveTransaction} 
                    transactions={transactions}
                    editingTransaction={editingTransaction}
                    onCancelEdit={() => {
                      setEditingTransaction(null);
                      setIsAddingSale(false);
                    }}
                    currentUser={currentUser}
                  />
                </div>
              </div>
            )}
            <div className="space-y-6">
              {/* Header block with "জমি বিক্রয় ইনপুট" button */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-row items-center justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-slate-900 font-sans flex items-center gap-2">
                    <MinusCircle className="text-rose-600 hidden sm:block" size={20} />
                    বিক্রয়কৃত জমির তথ্য
                  </h2>
                  <p className="text-xs text-slate-500 hidden sm:block">
                    আপনার মৌজা ও দলিল ভিত্তিক সকল জমি বিক্রয় এন্ট্রির হিসাব এক নজরে পর্যবেক্ষণ করুন।
                  </p>
                </div>

                <button
                  onClick={() => setIsAddingSale(true)}
                  className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 transition-all rounded-xl shadow-md cursor-pointer select-none shrink-0"
                >
                  <MinusCircle size={15} />
                  <span className="hidden sm:inline">জমি বিক্রয় ইনপুট</span>
                  <span className="sm:hidden">ইনপুট</span>
                </button>
              </div>

              {/* Sale Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl border border-rose-100 p-5 flex flex-col items-center justify-center text-center gap-2 relative overflow-hidden group">
                  <div className="absolute -right-6 -top-6 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl group-hover:bg-rose-500/10 transition-colors" />
                  <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center shrink-0 border border-rose-100/50 mb-1">
                    <FileText size={20} />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-slate-800 tracking-tight font-mono">{toBengaliNumber(totalSaleDeeds)}</div>
                    <div className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">মোট বিক্রয়কৃত দলিল সংখ্যা</div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-rose-100 p-5 flex flex-col items-center justify-center text-center gap-2 relative overflow-hidden group">
                  <div className="absolute -right-6 -top-6 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl group-hover:bg-rose-500/10 transition-colors" />
                  <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center shrink-0 border border-rose-100/50 mb-1">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-slate-800 tracking-tight font-mono">{toBengaliNumber(uniqueSaleMouzas)}</div>
                    <div className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">মোট মৌজা সংখ্যা</div>
                  </div>
                </div>

                <div className="col-span-2 md:col-span-1 bg-white rounded-2xl border border-rose-100 p-5 flex flex-col items-center justify-center text-center gap-2 relative overflow-hidden group">
                  <div className="absolute -right-6 -top-6 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl group-hover:bg-rose-500/10 transition-colors" />
                  <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center shrink-0 border border-rose-100/50 mb-1">
                    <Layers size={20} />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-slate-800 tracking-tight font-mono">{toBengaliNumber(totalSaleAmount)} <span className="text-sm font-bold text-slate-500">শতক</span></div>
                    <div className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">মোট বিক্রয়কৃত জমির পরিমান</div>
                  </div>
                </div>
              </div>

              {/* Sale entries list */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-5 border-b border-slate-200 flex flex-col items-center justify-center gap-4 bg-slate-50/50">
                  <div className="text-slate-800 font-bold text-sm text-center">
                    বিক্রয় দলিলের তালিকা ({toBengaliNumber(filteredSales.length)} টি দলিল)
                  </div>
                  <div className="relative w-full sm:w-64">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                      <Search size={14} />
                    </span>
                    <input
                      type="text"
                      placeholder="দলিল, মৌজা, খতিয়ান বা দাগ দিয়ে খুঁজুন..."
                      value={saleSearchTerm}
                      onChange={(e) => setSaleSearchTerm(e.target.value)}
                      className="pl-9 pr-4 py-1.5 text-xs text-slate-800 rounded-lg border border-slate-200 focus:outline-none focus:border-rose-600 w-full bg-white"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto font-sans">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                        <th className="py-1.5 px-4 w-10 text-center"></th>
                        <th className="py-1.5 px-4 text-left">দলিল নম্বর</th>
                        <th className="py-1.5 px-4 text-left">দলিলের প্রকৃতি</th>
                        <th className="py-1.5 px-4 text-left">মৌজার নাম</th>
                        <th className="py-1.5 px-4 text-left">ক্রেতার নাম</th>
                        <th className="py-1.5 px-4 text-left">বিক্রেতার নাম</th>
                        <th className="py-1.5 px-4 text-center">বিক্রিত জমি (শতক)</th>
                        <th className="py-1.5 px-4 text-center">অ্যাকশন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredSales.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-12 text-center text-slate-400 font-light text-sm">
                            কোন বিক্রয়কৃত জমির রেকর্ড অনুসন্ধানের সাথে মেলেনি বা যোগ করা হয়নি।
                          </td>
                        </tr>
                      ) : (
                        filteredSales.map((t) => {
                          const isExpanded = !!expandedSales[t.id];

                          return (
                            <React.Fragment key={t.id}>
                              <tr 
                                id={`tx-${t.id}`}
                                className={`transition-all duration-500 ${highlightedTxId === t.id ? 'bg-rose-50 shadow-inner' : 'hover:bg-slate-50/50'}`}
                              >
                                <td className={`py-1.5 px-4 text-center ${highlightedTxId === t.id ? 'border-l-4 border-rose-500' : ''}`}>
                                  <button
                                    onClick={() => setExpandedSales(prev => ({ ...prev, [t.id]: !prev[t.id] }))}
                                    className="p-1 rounded hover:bg-slate-100 text-slate-500 cursor-pointer"
                                  >
                                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                  </button>
                                </td>
                                <td className="py-1.5 px-4">
                                  <div className="font-semibold text-slate-900 text-sm">দলিল নং {toBengaliNumber(t.deedNumber)}</div>
                                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">{toBengaliNumber(t.date)}</div>
                                </td>
                                <td className="py-1.5 px-4 align-middle text-left font-medium text-slate-600 text-[11px]">
                                  {t.deedNature || '-'}
                                </td>
                                <td className="py-1.5 px-4 align-middle text-left">
                                  <div className="text-slate-900 font-bold flex items-center justify-start gap-1">
                                    <MapPin size={11} className="text-slate-500 shrink-0" />
                                    <span>{t.mouza.replace(/\s*মৌজা\s*$/, '')}</span>
                                  </div>
                                </td>
                                <td className="py-1.5 px-4">
                                  <div className="font-bold text-slate-900">{t.buyerName}</div>
                                </td>
                                <td className="py-1.5 px-4">
                                  <div className="font-bold text-slate-900">{t.sellerName}</div>
                                </td>
                                <td className="py-1.5 px-4 text-center font-mono font-bold text-sm text-rose-600">
                                  -{toBengaliNumber(t.transactionAmount.toFixed(2))}
                                </td>
                                <td className="py-1.5 px-4 text-center">
                                  <div className="flex items-center justify-center gap-3 font-sans">
                                    <button
                                      onClick={() => handleShortcutSearch('khatian', t.khatians[0]?.csKhatian || t.khatians[0]?.saKhatian || '')}
                                      className="text-indigo-700 hover:text-indigo-900 duration-100 font-semibold inline-flex items-center gap-0.5 cursor-pointer"
                                      title="খতিয়ান খতিয়ে অনুসন্ধান"
                                    >
                                      <Search size={12} />
                                      <span className="hidden sm:inline">খুঁজুন</span>
                                    </button>
                                    <button
                                      onClick={() => handleEditTransaction(t)}
                                      className="text-blue-600 hover:text-blue-800 duration-100 font-semibold inline-flex items-center gap-0.5 cursor-pointer"
                                      title="সম্পাদনা করুন"
                                    >
                                      <Pencil size={11} />
                                      <span className="hidden sm:inline">ইডিট</span>
                                    </button>
                                    <button
                                      onClick={() => setPrintingDeed(t)}
                                      className="text-slate-700 hover:text-slate-900 duration-100 font-semibold inline-flex items-center gap-0.5 cursor-pointer"
                                      title="পিডিএফ সেভ করুন"
                                    >
                                      <FileDown size={11} />
                                      <span className="hidden sm:inline">পিডিএফ</span>
                                    </button>
                                    <button
                                      onClick={() => handleDeleteTransaction(t.id)}
                                      className="text-rose-600 hover:text-rose-800 duration-100 font-semibold inline-flex items-center gap-0.5 cursor-pointer"
                                      title="ডিলিট করুন"
                                    >
                                      <Trash2 size={11} />
                                      <span className="hidden sm:inline">ডিলিট</span>
                                    </button>
                                  </div>
                                </td>
                              </tr>

                              {/* Expanded Row component */}
                              {isExpanded && (
                                <tr className="bg-slate-50/40">
                                  <td colSpan={8} className="py-3 px-4 pb-4">
                                    <div className="ml-10 px-5 py-4 bg-white rounded-xl border border-slate-200 shadow-inner grid grid-cols-1 md:grid-cols-2 gap-5">
                                      {/* Left block: Khatians and plots */}
                                      <div className="space-y-3">
                                        <div className="flex items-center justify-between text-xs text-slate-700 font-bold border-b border-slate-100 pb-2">
                                          <span className="flex items-center gap-1.5">
                                            <Layers size={14} className="text-teal-600" />
                                            খতিয়ান ও দাগ বিবরণী ({toBengaliNumber(t.khatians.length)}  টি খতিয়ান)
                                          </span>
                                          <span className="text-[10px] text-slate-400 font-light">শতক এককে হিসাব</span>
                                        </div>
                                        <div className="space-y-3">
                                          {t.khatians.map((k, kIdx) => {
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

                                            return (
                                              <div key={k.id || kIdx} className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
                                                <div className="font-bold text-slate-800 text-xs flex flex-wrap items-center gap-1.5 border-b border-dashed border-slate-200 pb-1.5">
                                                  <span className="text-[10px] uppercase font-bold bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">খতিয়ান</span>
                                                  <span>{activeKLabels.join(', ')}</span>
                                                </div>
                                                <div className="space-y-1.5 text-[11px]">
                                                  {k.dags.map((d, dIdx) => {
                                                    const activeDLabels: string[] = [];
                                                    if (d.hasCS && d.csDag) activeDLabels.push(`সি.এস দাগ: ${toBengaliNumber(d.csDag)}`);
                                                    if (d.hasSA && d.saDag) activeDLabels.push(`এস.এ দাগ: ${toBengaliNumber(d.saDag)}`);
                                                    if (d.hasRS && d.rsDag) activeDLabels.push(`আর.এস দাগ: ${toBengaliNumber(d.rsDag)}`);

                                                    if (activeDLabels.length === 0) {
                                                      if (d.csDag) activeDLabels.push(`সি.এস দাগ: ${toBengaliNumber(d.csDag)}`);
                                                      if (d.saDag) activeDLabels.push(`এস.এ দাগ: ${toBengaliNumber(d.saDag)}`);
                                                      if (d.rsDag) activeDLabels.push(`আর.এস দাগ: ${toBengaliNumber(d.rsDag)}`);
                                                    }

                                                    return (
                                                      <div key={d.id || dIdx} className="flex justify-between items-center hover:bg-slate-100/50 p-1 rounded transition-colors">
                                                        <span className="font-medium text-slate-600">{activeDLabels.join(', ')}</span>
                                                        <div className="flex items-center gap-4">
                                                          <div className="flex items-center gap-1 text-slate-500">
                                                            <span>জমির পরিমাণ:</span>
                                                            <strong className="text-slate-700 font-mono">{toBengaliNumber(d.amount)} শতক</strong>
                                                          </div>
                                                          <button
                                                            onClick={() => handleShortcutSearch('dag', d.csDag || d.saDag || d.rsDag || '')}
                                                            className="text-[9px] text-slate-400 hover:text-emerald-700 font-medium border border-slate-200 hover:border-emerald-300 rounded px-1.5 py-0.5 bg-white shadow-xs ml-1"
                                                          >
                                                            ইতিহাস
                                                          </button>
                                                        </div>
                                                      </div>
                                                    );
                                                  })}
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>

                                      {/* Right block: Attachments & Notes */}
                                      <div className="space-y-4">
                                        <div className="space-y-2">
                                          <div className="flex items-center gap-1.5 text-xs text-slate-700 font-bold border-b border-slate-100 pb-2">
                                            <Info size={14} className="text-indigo-600" />
                                            <span>দলিল ও নথিপত্র স্ক্যান কপি ({(t.attachments && t.attachments.length) ? toBengaliNumber(t.attachments.length) : '০'} টি ফাইল)</span>
                                          </div>
                                          {t.attachments && t.attachments.length > 0 ? (
                                            <div className="grid grid-cols-1 gap-1.5 text-[11px]">
                                              {t.attachments.map((file) => (
                                                <div key={file.id} className="flex justify-between items-center bg-slate-100 border border-slate-200 rounded-lg p-2 hover:bg-slate-100 transition-colors">
                                                  <span className="truncate max-w-[130px] sm:max-w-[160px] font-medium text-slate-700" title={file.name}>
                                                    {file.name}
                                                  </span>
                                                  <div className="flex items-center gap-1.5 text-[10px]">
                                                    <span className="text-[9px] text-slate-400 font-mono shrink-0">{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                                                    <div className="flex items-center gap-1.5 border-l border-slate-200 pl-2 shrink-0">
                                                      <button
                                                        type="button"
                                                        onClick={() => openAttachmentInNewTab(file)}
                                                        className="text-[10px] text-rose-700 hover:text-rose-950 font-bold hover:underline cursor-pointer flex items-center gap-0.5 select-none"
                                                      >
                                                        <Eye size={11} />
                                                        দেখুন
                                                      </button>
                                                    </div>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          ) : (
                                            <div className="text-[11px] text-slate-500 italic py-2 text-center border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
                                              সংযুক্ত স্ক্যান করা দলিলের ফাইল পাওয়া যায়নি।
                                            </div>
                                          )}
                                        </div>

                                        {/* Notes display */}
                                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-1.5">
                                          <div className="text-slate-700 font-bold text-xs flex items-center gap-1">
                                            <FileText size={13} className="text-slate-500" />
                                            <span>অতিরিক্ত নোট ও মন্তব্য</span>
                                          </div>
                                          <p className="text-[11px] text-slate-600 leading-relaxed font-sans">
                                            {t.notes ? t.notes : 'এই বিক্রয় দলিলের সাথে বিশেষ কোনো বাড়তি নোট বা মন্তব্য উল্লেখ করা হয়নি।'}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'search' && (
          <SearchQuery 
            transactions={transactions}
            onUpdateTransactions={saveTransactionsData}
            initialSearchQuery={initialSearchQuery}
            onClearInitialQuery={() => setInitialSearchQuery(undefined)}
            onEditTransaction={handleEditTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            onPrintTransaction={setPrintingDeed}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'order' && (
          <OrderList 
            orders={orders} 
            setOrders={saveOrdersData} 
            customers={customers} 
            transactions={transactions} 
          />
        )}

        {activeTab === 'customers' && (
          <Customers 
            customers={customers} 
            setCustomers={saveCustomersData} 
          />
        )}

        {activeTab === 'staff' && (
          <StaffManagement />
        )}

        {activeTab === 'appUsers' && (
          <AppUsers 
            currentUser={currentUser} 
            setAlertConfig={setAlertConfig} 
          />
        )}
      </main>

      {/* Real-time A4 Multi-page/Single-page Voucher Print Layout */}
      {printingDeed && (
        <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs overflow-y-auto p-4 md:p-8 flex items-start justify-center print:p-0 print:bg-white print:backdrop-blur-none">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden flex flex-col my-8 print:my-0 print:border-none print:shadow-none print:max-w-full">
            {/* Control Bar (hidden upon print:hidden) */}
            <div className="bg-slate-50 border-b border-slate-200 p-4 px-6 flex items-center justify-between print:hidden select-none">
              <h3 className="font-sans font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <FileDown className="text-emerald-700" size={16} />
                দলিল পিডিএফ ডাউনলোড ও সেভ (A4 পেজ মেমো)
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleSaveAsPDF(printingDeed);
                    setPrintingDeed(null); // Auto-close the modal overlay
                  }}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all active:scale-95 shadow-sm cursor-pointer"
                >
                  <ExternalLink size={13} />
                  নতুন ট্যাবে পিডিএফ ও প্রিন্ট করুন
                </button>
                <button
                  onClick={() => setPrintingDeed(null)}
                  className="bg-slate-200 hover:bg-slate-400 text-slate-700 text-xs font-bold px-4 py-2 rounded-lg transition-all active:scale-95 cursor-pointer"
                >
                  বন্ধ করুন
                </button>
              </div>
            </div>

            {/* Document sheet */}
            <div id="print-section" className="bg-white p-6 sm:p-12 overflow-x-auto select-text text-slate-800 font-sans mx-auto w-full max-w-[210mm] print:max-w-none print:p-8 print:text-black">
              {/* Double border representing official land documents */}
              <div className="border border-double border-slate-400 p-6 space-y-6 rounded-lg relative overflow-hidden print:border-slate-500">
                
                {/* Accent Corners */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-slate-400 print:border-slate-500" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-slate-400 print:border-slate-500" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-slate-400 print:border-slate-500" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-slate-400 print:border-slate-500" />

                {/* Header */}
                <div className="text-center space-y-2 pb-5 border-b border-slate-300">
                  {currentUser?.userType === 'company' && currentUser?.companyName && (
                    <div className="text-[28px] font-black text-slate-900 tracking-wide mb-1 leading-tight">{currentUser.companyName}</div>
                  )}
                  <h1 className="text-[22px] font-extrabold text-slate-800 tracking-wider">ভূমি হস্তান্তর বিবরণী</h1>
                  <p className="text-xs text-slate-500 uppercase tracking-widest font-extrabold">ডিজিটাল খতিয়ান খাতা ও দাগ হিসাব লেজার মেমো</p>
                  <div className="inline-flex px-3 py-1 rounded-sm bg-slate-100 text-[11px] font-bold text-slate-700 border border-slate-200">
                    শ্রেণী: {printingDeed.type === 'purchase' ? 'ক্রয়কৃত ভূমির দলিল' : 'বিক্রয়কৃত ভূমির দলিল'}
                  </div>
                </div>

                {/* Meta details (Single full-length row) */}
                <div className="text-xs pt-2">
                  <div className="border border-slate-300 p-3.5 rounded-lg bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">দলিল নম্বর ও তারিখ</span>
                      <p className="font-extrabold text-slate-950 text-base mt-1">দলিল নং: {toBengaliNumber(printingDeed.deedNumber)}</p>
                    </div>
                    <div className="sm:text-right space-y-0.5">
                      <p className="font-medium text-slate-700 font-semibold">রেজিস্ট্রেশন তারিখ: {toBengaliNumber(printingDeed.date)}</p>
                      <p className="font-medium text-slate-700">মৌজার নাম: {printingDeed.mouza.replace(/\s*মৌজা\s*$/, '')}</p>
                    </div>
                  </div>
                </div>

                {/* Buyer & Seller details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="border border-slate-200 p-3.5 rounded-lg space-y-1">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">ভূমি ক্রেতা (Buyer)</span>
                    <p className="font-extrabold text-slate-800 text-sm">{printingDeed.buyerName}</p>
                  </div>
                  <div className="border border-slate-200 p-3.5 rounded-lg space-y-1">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">ভূমি বিক্রেতা (Seller)</span>
                    <p className="font-extrabold text-slate-800 text-sm">{printingDeed.sellerName}</p>
                  </div>
                </div>

                {/* khatians & Dags Details Table */}
                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-bold text-slate-700 border-b pb-1.5 uppercase tracking-wide">খতিয়ান ও সংশ্লিষ্ট দাগ বিবরণী</h3>
                  <table className="w-full text-left border-collapse border border-slate-300 text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-300 text-[10px] uppercase">
                        <th className="p-2.5 border-r border-slate-300">খতিয়ান নম্বর সমূহ</th>
                        <th className="p-2.5 border-r border-slate-300">সংশ্লিষ্ট দাগ বিবরণী</th>
                        <th className="p-2.5 border-r border-slate-300">শ্রেণী</th>
                        <th className="p-2.5 border-r border-slate-300 text-right">নামজারী/কাতে পরিমান</th>
                        <th className="p-2.5 text-right">{printingDeed.type === 'purchase' ? 'ক্রয়কৃত পরিমাণ' : 'বিক্রয় পরিমাণ'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {printingDeed.khatians.map((k) => {
                        const kParts: string[] = [];
                        if (k.hasCS && k.csKhatian) kParts.push(`সি.এস: ${k.csKhatian}`);
                        if (k.hasSA && k.saKhatian) kParts.push(`এস.এ: ${k.saKhatian}`);
                        if (k.hasRS && k.rsKhatian) kParts.push(`আর.এস: ${k.rsKhatian}`);
                        if (k.hasNamjari && k.namjariKhatian) kParts.push(`নামজারী: ${k.namjariKhatian}`);

                        return k.dags.map((d, dIdx) => {
                          const dParts: string[] = [];
                          if (d.hasCS && d.csDag) dParts.push(`সি.এস: ${d.csDag}`);
                          if (d.hasSA && d.saDag) dParts.push(`এস.এ: ${d.saDag}`);
                          if (d.hasRS && d.rsDag) dParts.push(`আর.এস: ${d.rsDag}`);
                          const dLabel = dParts.join(', ');

                          return (
                            <tr key={d.id} className="text-[11px] hover:bg-slate-50/50">
                              {dIdx === 0 ? (
                                <td className="p-2.5 font-bold text-slate-800 border-r border-slate-300 align-top leading-relaxed" rowSpan={k.dags.length}>
                                  <div className="flex flex-col space-y-1">
                                    {kParts.map((part, pIdx) => (
                                      <div key={pIdx} className="whitespace-nowrap">{toBengaliNumber(part)}</div>
                                    ))}
                                  </div>
                                </td>
                              ) : null}
                              <td className="p-2.5 text-slate-700 border-r border-slate-300 leading-relaxed font-semibold">
                                {toBengaliNumber(dLabel)}
                              </td>
                              <td className="p-2.5 text-slate-700 border-r border-slate-300 leading-relaxed">
                                {d.landClass || '-'}
                              </td>
                              <td className="p-2.5 text-right font-mono text-slate-700 border-r border-slate-300">
                                {toBengaliNumber(k.hasNamjari ? (d.namjariAmount !== undefined ? d.namjariAmount : 0) : (d.kateAmount !== undefined ? d.kateAmount : 0))} শতক
                              </td>
                              <td className="p-2.5 text-right font-black text-slate-900 font-mono">
                                {toBengaliNumber(d.amount)} শতক
                              </td>
                            </tr>
                          );
                        });
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-slate-300 bg-blue-50/5">
                        <td colSpan={3} className="p-2.5"></td>
                        <td colSpan={2} className="p-2.5 text-right">
                          <div className="inline-flex justify-end w-full gap-3">
                            <div className="border border-slate-300 rounded-lg p-2 bg-slate-50 flex flex-col items-center text-center space-y-0.5">
                              <span className="text-[8px] uppercase font-extrabold text-slate-600 tracking-wider">
                               মোট নামজারী/কাতে জমি:
                              </span>
                              <span className="font-extrabold text-slate-800 text-xs">
                                {toBengaliNumber(printingDeed.khatians.reduce((s, k) => s + k.dags.reduce((ds, d) => ds + (k.hasNamjari ? (Number(d.namjariAmount) || 0) : (Number(d.kateAmount) || 0)), 0), 0))} শতক
                              </span>
                            </div>
                            <div className="border border-blue-400 rounded-lg p-2 bg-blue-50/10 flex flex-col items-center text-center space-y-0.5">
                              <span className="text-[8px] uppercase font-extrabold text-blue-700 tracking-wider">
                                {printingDeed.type === 'purchase' ? 'মোট ক্রয়কৃত জমি:' : 'মোট বিক্রয়কৃত জমি:'}
                              </span>
                              <span className="font-black text-blue-900 text-xs">
                                {toBengaliNumber(printingDeed.transactionAmount)} শতক
                              </span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Signatures region */}
                <div className="pt-20 flex justify-between items-end gap-6 text-xs text-slate-400 select-none">
                  <div className="text-center space-y-1 w-36">
                    <div className="border-t border-dashed border-slate-300 pt-1 text-slate-600 font-bold">গ্রহীতার স্বাক্ষর</div>
                    <p className="text-[9px] text-slate-400 font-light">তারিখ সহ</p>
                  </div>
                  
                  <div className="text-center text-[9px] text-slate-400 italic">
                    হিসাব জেনারেট সম্পন্ন করেছে ডিজিটাল খতিয়ান খাতা
                  </div>
                  
                  <div className="text-center space-y-1 w-36">
                    <div className="border-t border-dashed border-slate-300 pt-1 text-slate-600 font-bold">পরিচালকের স্বাক্ষর</div>
                    <p className="text-[9px] text-slate-400 font-light">তারিখ ও সীলমোহর</p>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal to Wipe Database */}
      {showWipeModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-slate-900 font-sans font-bold text-lg">
              ডাটাবেজ সম্পূর্ণ ডিলিট করুন?
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              আপনি কি নিশ্চিত যে আপনি আপনার ব্রাউজারের সকল জমির ক্রয়-বিক্রয় খতিয়ানের বিবরণী ডিলিট করে দিতে চান? এই প্রক্রিয়টি পরবর্তীতে ফিরানো সম্ভব নয়। কাজ সম্পন্ন করার পূর্বে অনুগ্রহ করে ব্যাকআপ ফাইল ডাউনলোড করে রাখুন।
            </p>
            <div className="pt-2 flex justify-end gap-3">
              <button
                onClick={() => setShowWipeModal(false)}
                className="text-xs text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg font-medium cursor-pointer"
              >
                বাতিল করুন
              </button>
              <button
                onClick={handleWipeData}
                className="text-xs text-white bg-rose-700 hover:bg-rose-900 px-4 py-2 rounded-lg font-bold cursor-pointer"
              >
                হ্যাঁ, সম্পূর্ণ মুছে দিন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal to Delete Transaction */}
      {transactionToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-slate-900 font-sans font-bold text-lg">
              লেনদেন ডিলিট করুন?
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              আপনি কি নিশ্চিত যে এই লেনদেনের দলিলটি ডিলিট করতে চান? এই তথ্যটি আপনার ডাটাবেজ থেকে সম্পূর্ণ মুছে যাবে।
            </p>
            <div className="pt-2 flex justify-end gap-3 font-sans">
              <button
                onClick={() => setTransactionToDelete(null)}
                className="text-xs text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg font-medium cursor-pointer"
              >
                বাতিল করুন
              </button>
              <button
                onClick={() => {
                  const txToDelete = transactions.find(t => t.id === transactionToDelete);
                  const updated = transactions.filter(t => t.id !== transactionToDelete);
                  if (txToDelete) {
                    saveTransactionsData(updated, [...trashTransactions, txToDelete]);
                  } else {
                    saveTransactionsData(updated);
                  }
                  setTransactionToDelete(null);
                  setAlertConfig({
                    message: 'লেনদেনটি ট্রাশে (Trash) পাঠানো হয়েছে!',
                    type: 'success'
                  });
                }}
                className="text-xs text-white bg-rose-600 hover:bg-rose-700 px-4 py-2 rounded-lg font-bold cursor-pointer"
              >
                হ্যাঁ, ডিলিট করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal to Reload Mock Data */}
      {showReloadMockModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-slate-900 font-sans font-bold text-lg">
              ডেমো ডাটা রিলোড করুন?
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              আপনি কি ডেমো ডাটা পুনরায় রিলোড করতে চান? এটি করার ফলে আপনার এন্ট্রি করা সকল ডাটা মুছে যাবে এবং প্রাথমিক ডেমো ডাটা লোড হবে।
            </p>
            <div className="pt-2 flex justify-end gap-3 font-sans">
              <button
                onClick={() => setShowReloadMockModal(false)}
                className="text-xs text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg font-medium cursor-pointer"
              >
                বাতিল করুন
              </button>
              <button
                onClick={() => {
                  saveTransactionsData(INITIAL_TRANSACTIONS);
                  setShowReloadMockModal(false);
                  setAlertConfig({
                    message: 'সফলভাবে ডেমো ডাটা রিলোড করা হয়েছে!',
                    type: 'success'
                  });
                }}
                className="text-xs text-white bg-emerald-700 hover:bg-emerald-900 px-4 py-2 rounded-lg font-bold cursor-pointer"
              >
                হ্যাঁ, রিলোড করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal to Import Database */}
      {importPendingData && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-slate-900 font-sans font-bold text-lg">
              ডাটাবেজ ইম্পোর্ট করুন?
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              আপনি কি নিশ্চিত যে আপনার ব্যাকআপ ফাইলটি ইম্পোর্ট করতে চান? এটি আপনার বর্তমান সকল ডাটা রিপ্লেস করে নতুন ফাইলটি সংযুক্ত করবে।
            </p>
            <div className="pt-2 flex justify-end gap-3 font-sans">
              <button
                onClick={() => setImportPendingData(null)}
                className="text-xs text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg font-medium cursor-pointer"
              >
                বাতিল করুন
              </button>
              <button
                onClick={() => {
                  saveTransactionsData(importPendingData);
                  setImportPendingData(null);
                  setAlertConfig({
                    message: 'সফলভাবে ডাটা ইমপোর্ট সম্পন্ন হয়েছে!',
                    type: 'success'
                  });
                }}
                className="text-xs text-white bg-emerald-700 hover:bg-emerald-900 px-4 py-2 rounded-lg font-bold cursor-pointer"
              >
                হ্যাঁ, ইম্পোর্ট করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      {alertConfig && (
        <div className="fixed inset-0 z-55 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <h3 className={`font-sans font-bold text-lg ${alertConfig.type === 'error' ? 'text-rose-600' : 'text-emerald-800'}`}>
              {alertConfig.type === 'error' ? 'তথ্য' : 'সফল'}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed font-sans mt-1">
              {alertConfig.message}
            </p>
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setAlertConfig(null)}
                className="text-xs text-white bg-slate-800 hover:bg-slate-900 px-4 py-2 rounded-lg font-bold cursor-pointer"
              >
                ঠিক আছে
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
}

