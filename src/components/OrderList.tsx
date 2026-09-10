import React, { useState } from 'react';
import { Search, Filter, MoreHorizontal, FileText, ChevronRight, ChevronDown, Plus, Trash2, Edit, Eye, X, Printer, MapPin } from 'lucide-react';
import { LandTransaction, Customer, Order, KhatianInfo, DagInfo } from '../types';

interface OrderListProps {
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  customers: Customer[];
  transactions: LandTransaction[];
}

export default function OrderList({ orders, setOrders, customers, transactions }: OrderListProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [viewOrder, setViewOrder] = useState<Order | null>(null);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [showAdditionalCustomers, setShowAdditionalCustomers] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [scheduleSearchQuery, setScheduleSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    customerId: '',
    additionalCustomers: '',
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    type: 'Purchase' as 'Purchase' | 'Sale' | 'Other',
    status: 'Pending' as 'Pending' | 'Processing' | 'Completed' | 'Cancelled',
    notes: ''
  });

  const [khatians, setKhatians] = useState<KhatianInfo[]>([]);

  // Collect all purchased khatians to show in the "Select Schedule" modal
  const allPurchasedKhatians = transactions
    .filter(t => t.type === 'purchase')
    .flatMap(t => t.khatians.map(k => ({ ...k, _txId: t.id, _mouza: k.mouza?.trim() || t.mouza })));

  const filteredSchedules = allPurchasedKhatians.filter((kh: any) => {
    const query = scheduleSearchQuery.toLowerCase();
    if (!query) return true;
    const mouzaMatch = (kh._mouza || '').toLowerCase().includes(query);
    const khatianMatch = 
      (kh.csKhatian || '').toLowerCase().includes(query) ||
      (kh.saKhatian || '').toLowerCase().includes(query) ||
      (kh.rsKhatian || '').toLowerCase().includes(query) ||
      (kh.namjariKhatian || '').toLowerCase().includes(query);
    const dagMatch = kh.dags?.some((d: any) => 
      (d.csDag || '').toLowerCase().includes(query) ||
      (d.saDag || '').toLowerCase().includes(query) ||
      (d.rsDag || '').toLowerCase().includes(query)
    );
    return mouzaMatch || khatianMatch || dagMatch;
  });

  const openAddModal = () => {
    setEditingOrderId(null);
    setFormData({
      customerId: '',
      additionalCustomers: '',
      date: new Date().toISOString().split('T')[0],
      amount: 0,
      type: 'Purchase',
      status: 'Pending',
      notes: ''
    });
    setShowAdditionalCustomers(false);
    setKhatians([]);
    setIsModalOpen(true);
  };

  const openEditModal = (order: Order) => {
    setEditingOrderId(order.id);
    setFormData({
      customerId: order.customerId,
      additionalCustomers: order.additionalCustomers || '',
      date: order.date,
      amount: order.amount,
      type: order.type,
      status: order.status,
      notes: order.notes || ''
    });
    setShowAdditionalCustomers(!!order.additionalCustomers);
    setKhatians(order.khatians || []);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('আপনি কি নিশ্চিত যে এই অর্ডারটি মুছে ফেলতে চান?')) {
      setOrders(orders.filter(o => o.id !== id));
    }
  };

  const handleSelectSchedule = (khatian: any) => {
    // Copy the selected khatian into the demand schedule
    const newKhatian: KhatianInfo = {
      ...khatian,
      _originalId: khatian.id,
      id: `kh_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`, // New unique ID
    };
    setKhatians(prev => [...prev, newKhatian]);
    // Do not close the modal, allowing user to select multiple
  };

  const handleDagAmountChange = (khatianId: string, dagId: string, newAmount: number) => {
    setKhatians(khatians.map(k => {
      if (k.id === khatianId) {
        return {
          ...k,
          dags: k.dags.map(d => d.id === dagId ? { ...d, amount: newAmount } : d)
        };
      }
      return k;
    }));
  };

  const handleKhatianChange = (khatianId: string, field: string, value: string) => {
    setKhatians(khatians.map(k => k.id === khatianId ? { ...k, [field]: value } : k));
  };

  const handleDagChange = (khatianId: string, dagId: string, field: string, value: string) => {
    setKhatians(khatians.map(k => {
      if (k.id === khatianId) {
        return {
          ...k,
          dags: k.dags.map(d => d.id === dagId ? { ...d, [field]: value } : d)
        };
      }
      return k;
    }));
  };

  const removeKhatian = (id: string) => {
    setKhatians(khatians.filter(k => k.id !== id));
  };

  const calculateTotalAmount = () => {
    return khatians.flatMap(k => k.dags).reduce((sum, dag) => sum + (dag.amount || 0), 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerId) {
      alert("অনুগ্রহ করে একজন গ্রাহক নির্বাচন করুন।");
      return;
    }

    const customer = customers.find(c => c.id === formData.customerId);
    if (editingOrderId) {
      setOrders(orders.map(o => 
        o.id === editingOrderId 
          ? { 
              ...o, 
              ...formData, 
              customerName: customer?.name || 'অজ্ঞাত', 
              additionalCustomers: showAdditionalCustomers ? formData.additionalCustomers : undefined,
              khatians
            }
          : o
      ));
    } else {
      const newOrder: Order = {
        id: `ORD-${Date.now()}`,
        orderNo: `ORD-${new Date().getFullYear()}-${orders.length + 1}`,
        customerId: formData.customerId,
        customerName: customer?.name || 'অজ্ঞাত',
        additionalCustomers: showAdditionalCustomers ? formData.additionalCustomers : undefined,
        date: formData.date,
        amount: formData.amount,
        type: formData.type,
        status: formData.status,
        notes: formData.notes,
        khatians
      };
      setOrders([newOrder, ...orders]);
    }

    setIsModalOpen(false);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 font-sans text-text-primary animate-in fade-in duration-300 pb-12 print:m-0 print:p-0">
      
      <div className="print:hidden">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-[22px] font-semibold text-slate-700 tracking-tight">Order Management</h1>
          <button 
            onClick={openAddModal}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-full text-sm font-semibold transition custom-shadow flex items-center gap-2 cursor-pointer"
          >
            <Plus size={16} /> Create Order
          </button>
        </div>

        <div className="bg-white rounded-[20px] custom-shadow border border-border-subtle overflow-hidden flex flex-col">
          <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <h3 className="font-bold text-text-primary text-lg">All Orders</h3>
              <span className="px-2.5 py-0.5 rounded-full bg-table-header text-slate-teal text-xs font-bold">{orders.length} Total</span>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-text-muted">
                  <Search size={14} />
                </span>
                <input 
                  type="text" 
                  placeholder="Search orders..." 
                  className="bg-ice-tint border border-border-subtle rounded-full py-2 pl-9 pr-4 text-xs focus:outline-none focus:border-indigo-300 w-full sm:w-64 transition"
                />
              </div>
              <button className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-border-subtle text-xs font-semibold text-slate-teal hover:bg-ice-tint">
                <Filter size={14} /> Filters
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="text-text-muted font-medium border-y border-border-subtle text-xs bg-ice-tint/50">
                  <th className="py-4 px-6">Order No</th>
                  <th className="py-4 px-6">Date</th>
                  <th className="py-4 px-6">Customer Name</th>
                  <th className="py-4 px-6">Type</th>
                  <th className="py-4 px-6">Amount</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-ice-tint/50 transition-colors group">
                    <td className="py-4 px-6 text-slate-teal font-bold text-xs font-mono">{o.orderNo}</td>
                    <td className="py-4 px-6 text-text-muted text-sm font-medium">{o.date}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-ice-tint flex items-center justify-center text-xs font-bold text-slate-teal">
                          {o.customerName.charAt(0)}
                        </div>
                        <span className="font-semibold text-slate-700">{o.customerName}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-slate-teal text-xs font-bold flex items-center gap-1.5">
                        <FileText size={14} className="text-text-muted" /> {o.type}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-bold text-text-primary">৳{o.amount.toLocaleString('en-IN')}</td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider
                        ${o.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : 
                          o.status === 'Processing' ? 'bg-blue-50 text-blue-600' :
                          o.status === 'Pending' ? 'bg-orange-50 text-orange-600' : 'bg-alert-peach text-rose-700'}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => setViewOrder(o)}
                          className="p-2 text-slate-teal hover:text-white bg-ice-tint hover:bg-indigo-600 transition rounded-lg cursor-pointer"
                          title="View"
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          onClick={() => openEditModal(o)}
                          className="p-2 text-amber-600 hover:text-white bg-amber-50 hover:bg-amber-500 transition rounded-lg cursor-pointer"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(o.id)}
                          className="p-2 text-rose-700 bg-alert-peach hover:bg-[#f0c4b8] transition rounded-lg cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-text-muted">কোনো অর্ডার পাওয়া যায়নি।</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add / Edit Order Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[50] flex items-center justify-center p-0 md:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in print:hidden">
          <div className="bg-white rounded-none md:rounded-[20px] shadow-xl w-full max-w-4xl h-full md:h-auto max-h-screen md:max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between bg-white shrink-0">
              <h2 className="text-xl font-bold text-text-primary">
                {editingOrderId ? 'অর্ডার ইডিট করুন' : 'নতুন অর্ডার তৈরি করুন'}
              </h2>
              <button type="button" onClick={() => setIsModalOpen(false)} className="p-2 text-text-muted hover:text-rose-700 hover:bg-alert-peach rounded-full transition cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <form id="orderForm" onSubmit={handleSubmit} className="space-y-8">
                
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-sm font-semibold text-slate-700">গ্রাহক যুক্ত করুন <span className="text-rose-500">*</span></label>
                      <button 
                        type="button" 
                        onClick={() => setShowAdditionalCustomers(!showAdditionalCustomers)}
                        className="text-[11px] font-bold text-slate-teal hover:text-indigo-800 bg-ice-tint px-2 py-1 rounded-md transition cursor-pointer"
                      >
                        অতিরিক্ত গ্রাহক থাকলে তার তথ্য
                      </button>
                    </div>
                    <div className="relative">
                      <div 
                        className="w-full px-4 py-2.5 rounded-xl border border-border-subtle focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition text-sm bg-ice-tint font-medium cursor-pointer flex justify-between items-center"
                        onClick={() => setIsCustomerDropdownOpen(!isCustomerDropdownOpen)}
                      >
                        <span className={customers.find(c => c.id === formData.customerId) ? "text-text-primary" : "text-text-muted"}>
                          {customers.find(c => c.id === formData.customerId) ? `${customers.find(c => c.id === formData.customerId)?.name} (${customers.find(c => c.id === formData.customerId)?.phone})` : '-- গ্রাহক নির্বাচন করুন --'}
                        </span>
                        <ChevronDown size={16} className="text-text-muted" />
                      </div>
                      
                      {isCustomerDropdownOpen && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-border-subtle rounded-xl shadow-lg max-h-72 flex flex-col">
                          <div className="p-2 border-b border-border-subtle shrink-0">
                            <input 
                              type="text" 
                              placeholder="নাম বা মোবাইল নাম্বার দিয়ে খুঁজুন..." 
                              className="w-full px-3 py-2 bg-ice-tint border border-border-subtle rounded-lg text-sm focus:outline-none focus:border-indigo-400"
                              value={customerSearchQuery}
                              onChange={(e) => setCustomerSearchQuery(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              autoFocus
                            />
                          </div>
                          <div className="overflow-y-auto p-1">
                            {customers.filter(c => c.name.toLowerCase().includes(customerSearchQuery.toLowerCase()) || c.phone.includes(customerSearchQuery)).map(c => (
                              <div 
                                key={c.id} 
                                className="px-3 py-2 hover:bg-ice-tint cursor-pointer rounded-lg text-sm transition text-slate-700 flex justify-between items-center"
                                onClick={() => {
                                  setFormData({...formData, customerId: c.id});
                                  setIsCustomerDropdownOpen(false);
                                  setCustomerSearchQuery('');
                                }}
                              >
                                <span className="font-bold">{c.name}</span>
                                <span className="text-xs text-text-muted font-mono">{c.phone}</span>
                              </div>
                            ))}
                            {customers.filter(c => c.name.toLowerCase().includes(customerSearchQuery.toLowerCase()) || c.phone.includes(customerSearchQuery)).length === 0 && (
                              <div className="p-3 text-center text-sm text-text-muted">কোনো গ্রাহক পাওয়া যায়নি</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {showAdditionalCustomers && (
                      <div className="mt-3">
                        <label className="block text-[11px] font-bold text-text-muted mb-1">অতিরিক্ত গ্রাহকদের নাম (কমা দিয়ে লিখুন)</label>
                        <input 
                          type="text" 
                          value={formData.additionalCustomers}
                          onChange={(e) => setFormData({...formData, additionalCustomers: e.target.value})}
                          placeholder="যেমন: রহিম, করিম"
                          className="w-full px-4 py-2.5 rounded-xl border border-border-subtle focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition text-sm bg-ice-tint font-medium"
                        />
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">অর্ডারের তারিখ <span className="text-rose-500">*</span></label>
                    <input 
                      type="date" 
                      required
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-xl border border-border-subtle focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition text-sm bg-ice-tint font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">অর্ডারের ধরণ</label>
                    <select 
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                      className="w-full px-4 py-2.5 rounded-xl border border-border-subtle focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition text-sm bg-ice-tint font-medium"
                    >
                      <option value="Purchase">Purchase (ক্রয়)</option>
                      <option value="Sale">Sale (বিক্রয়)</option>
                      <option value="Other">Other (অন্যান্য)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">স্ট্যাটাস</label>
                    <select 
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                      className="w-full px-4 py-2.5 rounded-xl border border-border-subtle focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition text-sm bg-ice-tint font-medium"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Processing">Processing</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">মোট মূল্য (৳)</label>
                    <input 
                      type="number" 
                      value={formData.amount}
                      onChange={(e) => setFormData({...formData, amount: Number(e.target.value)})}
                      className="w-full px-4 py-2.5 rounded-xl border border-border-subtle focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition text-sm bg-ice-tint font-medium"
                    />
                  </div>
                </div>

                {/* Demand Schedule */}
                <div className="border border-border-subtle rounded-xl overflow-hidden bg-ice-tint">
                  <div className="bg-table-header/80 px-4 py-3 border-b border-border-subtle flex items-center justify-between">
                    <h3 className="font-bold text-text-primary">গ্রাহকের চাহিদা তফসিল</h3>
                    <button 
                      type="button"
                      onClick={() => {
                        setIsScheduleModalOpen(true);
                        setScheduleSearchQuery('');
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition custom-shadow cursor-pointer"
                    >
                      <Plus size={14} /> তফসিল যুক্ত করুন
                    </button>
                  </div>
                  
                  <div className="p-4">
                    {khatians.length === 0 ? (
                      <div className="text-center py-6 text-text-muted text-sm">
                        কোনো তফসিল যুক্ত করা হয়নি। "তফসিল যুক্ত করুন" বাটনে ক্লিক করুন।
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {khatians.map((k, idx) => (
                          <div key={k.id} className="bg-white border border-border-subtle rounded-xl p-4 custom-shadow relative">
                            <button 
                              type="button"
                              onClick={() => removeKhatian(k.id)}
                              className="absolute top-4 right-4 text-rose-500 hover:bg-alert-peach p-1.5 rounded-md transition cursor-pointer z-10"
                            >
                              <Trash2 size={16} />
                            </button>
                            <div className="border-b border-border-subtle mb-4 pb-3 relative">
                              <h4 className="font-bold text-slate-700 text-sm absolute top-0 left-0">তফসিল {idx + 1}</h4>
                              <div className="text-center font-extrabold text-slate-teal text-[15px] pt-1">{k._mouza ? `মৌজা: ${k._mouza}` : 'মৌজা: -'}</div>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                              {k.hasCS && <div><span className="text-text-muted text-xs block mb-1">সি.এস খতিয়ান:</span><input type="text" value={k.csKhatian || ''} onChange={(e) => handleKhatianChange(k.id, 'csKhatian', e.target.value)} className="w-full font-bold text-slate-700 px-2 py-1.5 border border-border-subtle rounded focus:outline-none focus:border-indigo-500 bg-white" placeholder="-" /></div>}
                              {k.hasSA && <div><span className="text-text-muted text-xs block mb-1">এস.এ খতিয়ান:</span><input type="text" value={k.saKhatian || ''} onChange={(e) => handleKhatianChange(k.id, 'saKhatian', e.target.value)} className="w-full font-bold text-slate-700 px-2 py-1.5 border border-border-subtle rounded focus:outline-none focus:border-indigo-500 bg-white" placeholder="-" /></div>}
                              {k.hasRS && <div><span className="text-text-muted text-xs block mb-1">আর.এস খতিয়ান:</span><input type="text" value={k.rsKhatian || ''} onChange={(e) => handleKhatianChange(k.id, 'rsKhatian', e.target.value)} className="w-full font-bold text-slate-700 px-2 py-1.5 border border-border-subtle rounded focus:outline-none focus:border-indigo-500 bg-white" placeholder="-" /></div>}
                              {k.hasNamjari && <div><span className="text-text-muted text-xs block mb-1">নামজারি খতিয়ান:</span><input type="text" value={k.namjariKhatian || ''} onChange={(e) => handleKhatianChange(k.id, 'namjariKhatian', e.target.value)} className="w-full font-bold text-slate-700 px-2 py-1.5 border border-border-subtle rounded focus:outline-none focus:border-indigo-500 bg-white" placeholder="-" /></div>}
                            </div>
                            
                            {k.dags && k.dags.length > 0 && (
                              <div className="mt-4 border border-border-subtle rounded-lg overflow-hidden">
                                <table className="w-full text-xs text-left">
                                  <thead className="bg-ice-tint/50 text-indigo-800 font-semibold border-b border-border-subtle">
                                    <tr>
                                      <th className="px-3 py-2">সি.এস দাগ</th>
                                      <th className="px-3 py-2">এস.এ দাগ</th>
                                      <th className="px-3 py-2">আর.এস দাগ</th>
                                      <th className="px-3 py-2 text-right">পরিমান (শতক)</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-indigo-50">
                                    {k.dags.map(dag => (
                                      <tr key={dag.id}>
                                        <td className="px-3 py-2">
                                          {dag.hasCS ? <input type="text" value={dag.csDag || ''} onChange={(e) => handleDagChange(k.id, dag.id, 'csDag', e.target.value)} className="w-16 sm:w-20 px-1.5 py-1 border border-border-subtle rounded text-slate-700 focus:outline-none focus:border-indigo-500 bg-white" placeholder="-" /> : '-'}
                                        </td>
                                        <td className="px-3 py-2">
                                          {dag.hasSA ? <input type="text" value={dag.saDag || ''} onChange={(e) => handleDagChange(k.id, dag.id, 'saDag', e.target.value)} className="w-16 sm:w-20 px-1.5 py-1 border border-border-subtle rounded text-slate-700 focus:outline-none focus:border-indigo-500 bg-white" placeholder="-" /> : '-'}
                                        </td>
                                        <td className="px-3 py-2 font-medium">
                                          {dag.hasRS ? <input type="text" value={dag.rsDag || ''} onChange={(e) => handleDagChange(k.id, dag.id, 'rsDag', e.target.value)} className="w-16 sm:w-20 px-1.5 py-1 border border-border-subtle rounded text-slate-700 focus:outline-none focus:border-indigo-500 bg-white" placeholder="-" /> : '-'}
                                        </td>
                                        <td className="px-3 py-2 text-right">
                                          <input 
                                            type="number" 
                                            value={dag.amount || 0}
                                            onChange={(e) => handleDagAmountChange(k.id, dag.id, Number(e.target.value))}
                                            className="w-24 px-2 py-1 border border-border-subtle rounded text-right text-slate-teal font-bold focus:outline-none focus:border-indigo-500"
                                          />
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        ))}
                        <div className="bg-ice-tint border border-border-subtle rounded-xl p-4 flex justify-between items-center custom-shadow">
                          <span className="font-bold text-text-primary">তফসিলের মোট পরিমাণ:</span>
                          <span className="text-xl font-black text-slate-teal">{calculateTotalAmount()} শতক</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </form>
            </div>

            <div className="p-6 border-t border-border-subtle bg-ice-tint flex justify-end gap-3 shrink-0">
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 rounded-xl font-bold text-slate-teal hover:bg-slate-200 transition cursor-pointer text-sm"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                form="orderForm"
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition custom-shadow shadow-indigo-600/20 cursor-pointer text-sm"
              >
                {editingOrderId ? 'Update Order' : 'Confirm Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Select Schedule Modal */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in print:hidden">
          <div className="bg-white rounded-[20px] shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between bg-white shrink-0">
              <h2 className="text-xl font-bold text-text-primary">তফসিল নির্বাচন করুন</h2>
              <button onClick={() => setIsScheduleModalOpen(false)} className="p-2 text-text-muted hover:text-rose-700 hover:bg-alert-peach rounded-full transition cursor-pointer">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 border-b border-border-subtle bg-ice-tint shrink-0">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-text-muted">
                  <Search size={16} />
                </span>
                <input 
                  type="text"
                  placeholder="মৌজা, খতিয়ান বা দাগ নম্বর দিয়ে খুঁজুন..."
                  value={scheduleSearchQuery}
                  onChange={(e) => setScheduleSearchQuery(e.target.value)}
                  className="w-full bg-white border border-border-subtle rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition"
                  autoFocus
                />
              </div>
            </div>
            <div className="p-4 max-h-[50vh] overflow-y-auto bg-ice-tint">
              {allPurchasedKhatians.length === 0 ? (
                <div className="text-center py-8 text-text-muted">ক্রয়কৃত কোনো তফসিল পাওয়া যায়নি।</div>
              ) : filteredSchedules.length === 0 ? (
                <div className="text-center py-8 text-text-muted">অনুসন্ধানের সাথে কোনো তফসিল মেলেনি।</div>
              ) : (
                <div className="border border-border-subtle rounded-xl overflow-hidden bg-white custom-shadow">
                  <table className="w-full text-center text-sm">
                    <thead className="bg-table-header/80 text-slate-teal font-semibold text-xs border-b border-border-subtle">
                      <tr>
                        <th className="px-4 py-3">মৌজা</th>
                        <th className="px-4 py-3">আর.এস খতিয়ান</th>
                        <th className="px-4 py-3">নামজারী খতিয়ান</th>
                        <th className="px-4 py-3">আর.এস দাগ</th>
                        <th className="px-4 py-3">স্টক (শতক)</th>
                        <th className="px-4 py-3">অ্যাকশন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredSchedules.map((kh: any, i: number) => {
                        const isAdded = khatians.some((k: any) => k._originalId === kh.id || k.id === kh.id);
                        return (
                        <tr key={i} className={`transition group ${isAdded ? 'bg-emerald-50/50' : 'hover:bg-ice-tint/50 cursor-pointer'}`} onClick={() => !isAdded && handleSelectSchedule(kh)}>
                          <td className="px-4 py-3 font-bold text-slate-700">{kh._mouza || '-'}</td>
                          <td className="px-4 py-3 text-slate-teal">{kh.hasRS ? (kh.rsKhatian || '-') : '-'}</td>
                          <td className="px-4 py-3 text-slate-teal">{kh.hasNamjari ? (kh.namjariKhatian || '-') : '-'}</td>
                          <td className="px-4 py-3 text-slate-teal font-medium">
                            {kh.dags?.length > 0 ? kh.dags.filter((d:any) => d.hasRS && d.rsDag).map((d: any) => d.rsDag).join(', ') : '-'}
                          </td>
                          <td className="px-4 py-3 font-bold text-slate-teal">
                            {kh.dags?.reduce((sum: number, d: any) => sum + (Number(d.amount) || 0), 0) || 0}
                          </td>
                          <td className="px-4 py-3">
                            <button 
                              disabled={isAdded}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                                isAdded 
                                  ? 'bg-emerald-100 text-emerald-700 cursor-not-allowed' 
                                  : 'bg-ice-tint text-slate-teal group-hover:bg-indigo-600 group-hover:text-white'
                              }`}
                            >
                              {isAdded ? 'যুক্ত হয়েছে ✓' : 'যুক্ত করুন'}
                            </button>
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* View Order Modal */}
      {viewOrder && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in print:bg-white print:p-0 print:absolute print:inset-0 print:block">
          <div className="bg-white rounded-[20px] shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200 print:shadow-none print:max-w-full print:h-full print:overflow-visible">
            
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-border-subtle px-6 py-4 flex items-center justify-between z-10 print:hidden">
              <h2 className="text-xl font-bold text-text-primary">অর্ডারের তথ্য</h2>
              <div className="flex items-center gap-3">
                <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-ice-tint text-slate-teal hover:bg-indigo-600 hover:text-white rounded-xl font-semibold text-sm transition cursor-pointer">
                  <Printer size={16} /> প্রিন্ট
                </button>
                <button onClick={() => setViewOrder(null)} className="p-2 text-text-muted hover:text-rose-700 hover:bg-alert-peach rounded-full transition cursor-pointer">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Print Header (Only visible in print) */}
            <div className="hidden print:block text-center border-b-2 border-indigo-600 pb-4 mb-6 pt-8">
              <h1 className="text-3xl font-extrabold text-text-primary">Land Management System</h1>
              <h2 className="text-xl font-bold text-text-primary mt-2">অর্ডার ডিটেইলস</h2>
            </div>
            
            {/* Body */}
            <div className="p-6 print:p-0 print:px-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                <div>
                  <p className="text-xs font-semibold text-text-muted mb-1 uppercase tracking-wider">গ্রাহকের নাম</p>
                  <p className="text-lg font-bold text-text-primary">{viewOrder.customerName}</p>
                  {viewOrder.additionalCustomers && (
                    <p className="text-sm font-medium text-text-muted mt-1">
                      <span className="text-xs uppercase tracking-wider text-text-muted">অতিরিক্ত:</span> {viewOrder.additionalCustomers}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold text-text-muted mb-1 uppercase tracking-wider">অর্ডার নং</p>
                  <p className="text-base font-bold text-slate-teal font-mono">{viewOrder.orderNo}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-text-muted mb-1 uppercase tracking-wider">তারিখ</p>
                  <p className="text-base font-medium text-slate-700">{viewOrder.date}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-text-muted mb-1 uppercase tracking-wider">স্ট্যাটাস</p>
                  <p className="text-base font-medium text-emerald-600 font-bold">{viewOrder.status}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-text-muted mb-1 uppercase tracking-wider">অর্ডারের ধরণ</p>
                  <p className="text-base font-medium text-slate-700">{viewOrder.type}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-text-muted mb-1 uppercase tracking-wider">মোট মূল্য</p>
                  <p className="text-base font-bold text-slate-700">৳{viewOrder.amount.toLocaleString('en-IN')}</p>
                </div>
              </div>

              {/* Schedule Section */}
              <div className="mt-8 pt-6 border-t border-border-subtle">
                <h3 className="text-sm font-bold text-text-primary mb-4 uppercase tracking-wider flex items-center gap-2">
                  <MapPin size={16} className="text-indigo-500" /> গ্রাহকের চাহিদা তফসিল
                </h3>
                
                {(!viewOrder.khatians || viewOrder.khatians.length === 0) ? (
                  <p className="text-text-muted text-sm">কোনো তফসিল যুক্ত নেই।</p>
                ) : (
                  <div className="space-y-4">
                    {viewOrder.khatians.map((k, idx) => (
                      <div key={idx} className="bg-ice-tint border border-border-subtle rounded-xl p-4 print:border-border-subtle print:bg-white">
                        <h4 className="font-bold text-slate-700 text-sm mb-3 border-b border-border-subtle pb-2">তফসিল {idx + 1}</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mb-4">
                          {k.hasCS && <div><span className="text-text-muted text-xs block">সি.এস খতিয়ান:</span><span className="font-bold text-slate-700">{k.csKhatian || '-'}</span></div>}
                          {k.hasSA && <div><span className="text-text-muted text-xs block">এস.এ খতিয়ান:</span><span className="font-bold text-slate-700">{k.saKhatian || '-'}</span></div>}
                          {k.hasRS && <div><span className="text-text-muted text-xs block">আর.এস খতিয়ান:</span><span className="font-bold text-slate-700">{k.rsKhatian || '-'}</span></div>}
                          {k.hasNamjari && <div><span className="text-text-muted text-xs block">নামজারি খতিয়ান:</span><span className="font-bold text-slate-700">{k.namjariKhatian || '-'}</span></div>}
                        </div>
                        
                        {k.dags && k.dags.length > 0 && (
                          <div className="border border-border-subtle rounded-lg overflow-hidden">
                            <table className="w-full text-xs text-left">
                              <thead className="bg-ice-tint text-indigo-800 font-semibold border-b border-border-subtle print:bg-ice-tint">
                                <tr>
                                  <th className="px-3 py-2">সি.এস দাগ</th>
                                  <th className="px-3 py-2">এস.এ দাগ</th>
                                  <th className="px-3 py-2">আর.এস দাগ</th>
                                  <th className="px-3 py-2 text-right">পরিমান (শতক)</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-indigo-50">
                                {k.dags.map(dag => (
                                  <tr key={dag.id}>
                                    <td className="px-3 py-2">{dag.hasCS ? dag.csDag : '-'}</td>
                                    <td className="px-3 py-2">{dag.hasSA ? dag.saDag : '-'}</td>
                                    <td className="px-3 py-2 font-medium">{dag.hasRS ? dag.rsDag : '-'}</td>
                                    <td className="px-3 py-2 text-right font-bold text-slate-teal">{dag.amount}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    ))}
                    <div className="mt-4 bg-ice-tint border border-border-subtle rounded-xl p-4 flex justify-between items-center print:border-2 print:border-indigo-600 print:bg-white">
                      <span className="font-bold text-text-primary">তফসিলের মোট পরিমাণ:</span>
                      <span className="text-xl font-black text-slate-teal">
                        {viewOrder.khatians.flatMap(k => k.dags).reduce((sum, dag) => sum + (dag.amount || 0), 0)} শতক
                      </span>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
