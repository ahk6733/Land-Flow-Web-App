import React, { useState } from 'react';
import { Search, Filter, MoreHorizontal, FileText, ChevronRight, Plus, Trash2, Edit, Eye, X, Printer, MapPin } from 'lucide-react';
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
    .flatMap(t => t.khatians.map(k => ({ ...k, _txId: t.id, _mouza: t.mouza })));

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
      id: `kh_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`, // New unique ID
    };
    setKhatians([...khatians, newKhatian]);
    setIsScheduleModalOpen(false);
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
    <div className="space-y-6 font-sans text-slate-800 animate-in fade-in duration-300 pb-12 print:m-0 print:p-0">
      
      <div className="print:hidden">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-[22px] font-semibold text-slate-700 tracking-tight">Order Management</h1>
          <button 
            onClick={openAddModal}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-full text-sm font-semibold transition shadow-md flex items-center gap-2 cursor-pointer"
          >
            <Plus size={16} /> Create Order
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
          <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <h3 className="font-bold text-slate-800 text-lg">All Orders</h3>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">{orders.length} Total</span>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Search size={14} />
                </span>
                <input 
                  type="text" 
                  placeholder="Search orders..." 
                  className="bg-slate-50 border border-slate-200 rounded-full py-2 pl-9 pr-4 text-xs focus:outline-none focus:border-indigo-300 w-full sm:w-64 transition"
                />
              </div>
              <button className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                <Filter size={14} /> Filters
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="text-slate-400 font-medium border-y border-slate-100 text-xs bg-slate-50/50">
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
                  <tr key={o.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="py-4 px-6 text-indigo-600 font-bold text-xs font-mono">{o.orderNo}</td>
                    <td className="py-4 px-6 text-slate-500 text-sm font-medium">{o.date}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-xs font-bold text-indigo-600">
                          {o.customerName.charAt(0)}
                        </div>
                        <span className="font-semibold text-slate-700">{o.customerName}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-slate-600 text-xs font-bold flex items-center gap-1.5">
                        <FileText size={14} className="text-slate-400" /> {o.type}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-bold text-slate-800">৳{o.amount.toLocaleString('en-IN')}</td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider
                        ${o.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : 
                          o.status === 'Processing' ? 'bg-blue-50 text-blue-600' :
                          o.status === 'Pending' ? 'bg-orange-50 text-orange-600' : 'bg-rose-50 text-rose-600'}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => setViewOrder(o)}
                          className="p-2 text-indigo-600 hover:text-white bg-indigo-50 hover:bg-indigo-600 transition rounded-lg cursor-pointer"
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
                          className="p-2 text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-500 transition rounded-lg cursor-pointer"
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
                    <td colSpan={7} className="py-8 text-center text-slate-500">কোনো অর্ডার পাওয়া যায়নি।</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add / Edit Order Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[50] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in print:hidden">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              <h2 className="text-xl font-bold text-slate-800">
                {editingOrderId ? 'অর্ডার ইডিট করুন' : 'নতুন অর্ডার তৈরি করুন'}
              </h2>
              <button type="button" onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition cursor-pointer">
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
                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-1 rounded-md transition cursor-pointer"
                      >
                        অতিরিক্ত গ্রাহক থাকলে তার তথ্য
                      </button>
                    </div>
                    <select 
                      required
                      value={formData.customerId}
                      onChange={(e) => setFormData({...formData, customerId: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition text-sm bg-slate-50 font-medium"
                    >
                      <option value="">-- গ্রাহক নির্বাচন করুন --</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                      ))}
                    </select>

                    {showAdditionalCustomers && (
                      <div className="mt-3">
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">অতিরিক্ত গ্রাহকদের নাম (কমা দিয়ে লিখুন)</label>
                        <input 
                          type="text" 
                          value={formData.additionalCustomers}
                          onChange={(e) => setFormData({...formData, additionalCustomers: e.target.value})}
                          placeholder="যেমন: রহিম, করিম"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition text-sm bg-slate-50 font-medium"
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
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition text-sm bg-slate-50 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">অর্ডারের ধরণ</label>
                    <select 
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition text-sm bg-slate-50 font-medium"
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
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition text-sm bg-slate-50 font-medium"
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
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition text-sm bg-slate-50 font-medium"
                    />
                  </div>
                </div>

                {/* Demand Schedule */}
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                  <div className="bg-slate-100/80 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                    <h3 className="font-bold text-slate-800">গ্রাহকের চাহিদা তফসিল</h3>
                    <button 
                      type="button"
                      onClick={() => setIsScheduleModalOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition shadow-sm cursor-pointer"
                    >
                      <Plus size={14} /> তফসিল যুক্ত করুন
                    </button>
                  </div>
                  
                  <div className="p-4">
                    {khatians.length === 0 ? (
                      <div className="text-center py-6 text-slate-400 text-sm">
                        কোনো তফসিল যুক্ত করা হয়নি। "তফসিল যুক্ত করুন" বাটনে ক্লিক করুন।
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {khatians.map((k, idx) => (
                          <div key={k.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm relative">
                            <button 
                              type="button"
                              onClick={() => removeKhatian(k.id)}
                              className="absolute top-4 right-4 text-rose-500 hover:bg-rose-50 p-1.5 rounded-md transition cursor-pointer"
                            >
                              <Trash2 size={16} />
                            </button>
                            <h4 className="font-bold text-slate-700 text-sm mb-3 border-b border-slate-100 pb-2">তফসিল {idx + 1}</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                              {k.hasCS && <div><span className="text-slate-400 text-xs block">সি.এস খতিয়ান:</span><span className="font-bold text-slate-700">{k.csKhatian || '-'}</span></div>}
                              {k.hasSA && <div><span className="text-slate-400 text-xs block">এস.এ খতিয়ান:</span><span className="font-bold text-slate-700">{k.saKhatian || '-'}</span></div>}
                              {k.hasRS && <div><span className="text-slate-400 text-xs block">আর.এস খতিয়ান:</span><span className="font-bold text-slate-700">{k.rsKhatian || '-'}</span></div>}
                              {k.hasNamjari && <div><span className="text-slate-400 text-xs block">নামজারি খতিয়ান:</span><span className="font-bold text-slate-700">{k.namjariKhatian || '-'}</span></div>}
                            </div>
                            
                            {k.dags && k.dags.length > 0 && (
                              <div className="mt-4 border border-indigo-100 rounded-lg overflow-hidden">
                                <table className="w-full text-xs text-left">
                                  <thead className="bg-indigo-50/50 text-indigo-800 font-semibold border-b border-indigo-100">
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
                                        <td className="px-3 py-2 text-right">
                                          <input 
                                            type="number" 
                                            value={dag.amount || 0}
                                            onChange={(e) => handleDagAmountChange(k.id, dag.id, Number(e.target.value))}
                                            className="w-24 px-2 py-1 border border-indigo-200 rounded text-right text-indigo-700 font-bold focus:outline-none focus:border-indigo-500"
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
                        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex justify-between items-center shadow-sm">
                          <span className="font-bold text-indigo-900">তফসিলের মোট পরিমাণ:</span>
                          <span className="text-xl font-black text-indigo-700">{calculateTotalAmount()} শতক</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </form>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition cursor-pointer text-sm"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                form="orderForm"
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition shadow-md shadow-indigo-600/20 cursor-pointer text-sm"
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
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              <h2 className="text-xl font-bold text-slate-800">তফসিল নির্বাচন করুন</h2>
              <button onClick={() => setIsScheduleModalOpen(false)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition cursor-pointer">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 max-h-[60vh] overflow-y-auto space-y-3 bg-slate-50">
              {allPurchasedKhatians.length === 0 ? (
                <div className="text-center py-8 text-slate-500">ক্রয়কৃত কোনো তফসিল পাওয়া যায়নি।</div>
              ) : (
                allPurchasedKhatians.map((kh: any, i) => (
                  <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between hover:border-indigo-300 transition group cursor-pointer" onClick={() => handleSelectSchedule(kh)}>
                    <div>
                      <h4 className="font-bold text-slate-700 text-sm">মৌজা: {kh._mouza || 'অজানা'}</h4>
                      <p className="text-xs text-slate-500 mt-1">
                        {kh.hasRS && `আর.এস খতিয়ান: ${kh.rsKhatian || '-'} `}
                        {kh.dags?.length > 0 && `| দাগ সংখ্যা: ${kh.dags.length}`}
                      </p>
                    </div>
                    <button className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold group-hover:bg-indigo-600 group-hover:text-white transition">
                      যুক্ত করুন
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* View Order Modal */}
      {viewOrder && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in print:bg-white print:p-0 print:absolute print:inset-0 print:block">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200 print:shadow-none print:max-w-full print:h-full print:overflow-visible">
            
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10 print:hidden">
              <h2 className="text-xl font-bold text-slate-800">অর্ডারের তথ্য</h2>
              <div className="flex items-center gap-3">
                <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white rounded-xl font-semibold text-sm transition cursor-pointer">
                  <Printer size={16} /> প্রিন্ট
                </button>
                <button onClick={() => setViewOrder(null)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition cursor-pointer">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Print Header (Only visible in print) */}
            <div className="hidden print:block text-center border-b-2 border-indigo-600 pb-4 mb-6 pt-8">
              <h1 className="text-3xl font-extrabold text-indigo-900">Land Management System</h1>
              <h2 className="text-xl font-bold text-slate-800 mt-2">অর্ডার ডিটেইলস</h2>
            </div>
            
            {/* Body */}
            <div className="p-6 print:p-0 print:px-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                <div>
                  <p className="text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">গ্রাহকের নাম</p>
                  <p className="text-lg font-bold text-slate-800">{viewOrder.customerName}</p>
                  {viewOrder.additionalCustomers && (
                    <p className="text-sm font-medium text-slate-500 mt-1">
                      <span className="text-xs uppercase tracking-wider text-slate-400">অতিরিক্ত:</span> {viewOrder.additionalCustomers}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">অর্ডার নং</p>
                  <p className="text-base font-bold text-indigo-600 font-mono">{viewOrder.orderNo}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">তারিখ</p>
                  <p className="text-base font-medium text-slate-700">{viewOrder.date}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">স্ট্যাটাস</p>
                  <p className="text-base font-medium text-emerald-600 font-bold">{viewOrder.status}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">অর্ডারের ধরণ</p>
                  <p className="text-base font-medium text-slate-700">{viewOrder.type}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">মোট মূল্য</p>
                  <p className="text-base font-bold text-slate-700">৳{viewOrder.amount.toLocaleString('en-IN')}</p>
                </div>
              </div>

              {/* Schedule Section */}
              <div className="mt-8 pt-6 border-t border-slate-100">
                <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider flex items-center gap-2">
                  <MapPin size={16} className="text-indigo-500" /> গ্রাহকের চাহিদা তফসিল
                </h3>
                
                {(!viewOrder.khatians || viewOrder.khatians.length === 0) ? (
                  <p className="text-slate-500 text-sm">কোনো তফসিল যুক্ত নেই।</p>
                ) : (
                  <div className="space-y-4">
                    {viewOrder.khatians.map((k, idx) => (
                      <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-4 print:border-indigo-100 print:bg-white">
                        <h4 className="font-bold text-slate-700 text-sm mb-3 border-b border-slate-100 pb-2">তফসিল {idx + 1}</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mb-4">
                          {k.hasCS && <div><span className="text-slate-400 text-xs block">সি.এস খতিয়ান:</span><span className="font-bold text-slate-700">{k.csKhatian || '-'}</span></div>}
                          {k.hasSA && <div><span className="text-slate-400 text-xs block">এস.এ খতিয়ান:</span><span className="font-bold text-slate-700">{k.saKhatian || '-'}</span></div>}
                          {k.hasRS && <div><span className="text-slate-400 text-xs block">আর.এস খতিয়ান:</span><span className="font-bold text-slate-700">{k.rsKhatian || '-'}</span></div>}
                          {k.hasNamjari && <div><span className="text-slate-400 text-xs block">নামজারি খতিয়ান:</span><span className="font-bold text-slate-700">{k.namjariKhatian || '-'}</span></div>}
                        </div>
                        
                        {k.dags && k.dags.length > 0 && (
                          <div className="border border-indigo-100 rounded-lg overflow-hidden">
                            <table className="w-full text-xs text-left">
                              <thead className="bg-indigo-50 text-indigo-800 font-semibold border-b border-indigo-100 print:bg-indigo-50">
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
                                    <td className="px-3 py-2 text-right font-bold text-indigo-700">{dag.amount}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    ))}
                    <div className="mt-4 bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex justify-between items-center print:border-2 print:border-indigo-600 print:bg-white">
                      <span className="font-bold text-indigo-900">তফসিলের মোট পরিমাণ:</span>
                      <span className="text-xl font-black text-indigo-700">
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
