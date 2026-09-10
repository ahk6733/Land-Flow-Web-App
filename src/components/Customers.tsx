import React, { useState } from 'react';
import { Search, Filter, Mail, Phone, MapPin, X, Upload, Image as ImageIcon, FileText, Eye, Edit, Printer, Download, ExternalLink, Trash2 } from 'lucide-react';

interface CustomersProps {
  customers: any[];
  setCustomers: React.Dispatch<React.SetStateAction<any[]>>;
}

export default function Customers({ customers, setCustomers }: CustomersProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewCustomer, setViewCustomer] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    fatherName: '',
    motherName: '',
    dob: '',
    idNumber: '',
    address: '',
    phone: '',
  });

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [idCardFileName, setIdCardFileName] = useState<string | null>(null);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleIdCardUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIdCardFileName(file.name);
    }
  };

  const openModalForAdd = () => {
    setEditingCustomerId(null);
    setFormData({
      name: '', fatherName: '', motherName: '', dob: '', idNumber: '', address: '', phone: ''
    });
    setPhotoPreview(null);
    setIdCardFileName(null);
    setIsModalOpen(true);
  };

  const openModalForEdit = (customer: any) => {
    setEditingCustomerId(customer.id);
    setFormData({
      name: customer.name,
      fatherName: customer.fatherName || '',
      motherName: customer.motherName || '',
      dob: customer.dob || '',
      idNumber: customer.idNumber || '',
      address: customer.address || '',
      phone: customer.phone || ''
    });
    setPhotoPreview(customer.photo || null);
    setIdCardFileName(customer.idCard || null);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("আপনি কি নিশ্চিত যে এই গ্রাহকটিকে মুছে ফেলতে চান?")) {
      setCustomers(customers.filter(c => c.id !== id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingCustomerId) {
      setCustomers(customers.map(c => 
        c.id === editingCustomerId 
          ? { 
              ...c, 
              ...formData,
              photo: photoPreview,
              idCard: idCardFileName
            }
          : c
      ));
    } else {
      const newCustomer = {
        id: `CUST-00${customers.length + 1}`,
        name: formData.name || 'অজ্ঞাত গ্রাহক',
        phone: formData.phone || '-',
        email: '-',
        address: formData.address || '-',
        purchases: 0,
        sales: 0,
        status: 'Active',
        fatherName: formData.fatherName,
        motherName: formData.motherName,
        dob: formData.dob,
        idNumber: formData.idNumber,
        photo: photoPreview,
        idCard: idCardFileName
      };
      setCustomers([newCustomer, ...customers]);
    }
    
    setIsModalOpen(false);
    setFormData({
      name: '', fatherName: '', motherName: '', dob: '', idNumber: '', address: '', phone: ''
    });
    setPhotoPreview(null);
    setIdCardFileName(null);
    setEditingCustomerId(null);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 font-sans text-text-primary animate-in fade-in duration-300 pb-12 relative print:m-0 print:p-0">
      
      {/* Hide this entire wrapper when printing, only show the print section if a modal is open */}
      <div className="print:hidden">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-[22px] font-semibold text-slate-700 tracking-tight">Customers Directory</h1>
          <button 
            onClick={openModalForAdd}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-full text-sm font-semibold transition custom-shadow cursor-pointer"
          >
            Add Customer
          </button>
        </div>

        <div className="bg-white rounded-[20px] custom-shadow border border-border-subtle overflow-hidden flex flex-col">
          <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <h3 className="font-bold text-text-primary text-lg">All Customers</h3>
              <span className="px-2.5 py-0.5 rounded-full bg-table-header text-slate-teal text-xs font-bold">{customers.length} Total</span>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-text-muted">
                  <Search size={14} />
                </span>
                <input 
                  type="text" 
                  placeholder="Search customers..." 
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
                  <th className="py-4 px-6 text-center w-16">সিরিয়াল</th>
                  <th className="py-4 px-6">গ্রাহকের নাম</th>
                  <th className="py-4 px-6">মোবাইল নাম্বার</th>
                  <th className="py-4 px-6 text-center">জমি ক্রয়</th>
                  <th className="py-4 px-6 text-center">জমি বিক্রয়</th>
                  <th className="py-4 px-6 text-center">একশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {customers.map((c, idx) => (
                  <tr key={idx} className="hover:bg-ice-tint/50 transition-colors group">
                    <td className="py-4 px-6 text-center font-semibold text-text-muted">{idx + 1}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        {c.photo ? (
                          <img src={c.photo} alt={c.name} className="w-10 h-10 rounded-full object-cover shrink-0 border-2 border-border-subtle" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-ice-tint flex items-center justify-center text-sm font-bold text-slate-teal shrink-0">
                            {c.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-text-primary">{c.name}</div>
                          <div className="text-[10px] text-text-muted font-mono">{c.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-medium text-slate-700">
                      {c.phone}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded bg-emerald-50 text-emerald-600 font-bold text-xs border border-emerald-100">
                        {c.purchases}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded bg-alert-peach text-rose-700 font-bold text-xs border border-border-subtle">
                        {c.sales}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => setViewCustomer(c)}
                          className="p-2 text-slate-teal hover:text-white bg-ice-tint hover:bg-indigo-600 transition rounded-lg cursor-pointer"
                          title="View"
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          onClick={() => openModalForEdit(c)}
                          className="p-2 text-amber-600 hover:text-white bg-amber-50 hover:bg-amber-500 transition rounded-lg cursor-pointer"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(c.id)}
                          className="p-2 text-rose-700 bg-alert-peach hover:bg-[#f0c4b8] transition rounded-lg cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-border-subtle flex items-center justify-between text-xs text-text-muted bg-ice-tint/30">
            <span>Showing 1 to {customers.length} of {customers.length} entries</span>
            <div className="flex gap-1">
              <button className="px-3 py-1.5 rounded-lg border border-border-subtle hover:bg-white font-medium bg-ice-tint cursor-pointer">Previous</button>
              <button className="px-3 py-1.5 rounded-lg border border-border-subtle hover:bg-white font-medium bg-ice-tint cursor-pointer">Next</button>
            </div>
          </div>
        </div>
      </div>

      {/* View Customer Modal */}
      {viewCustomer && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in print:bg-white print:p-0 print:absolute print:inset-0 print:block">
          <div className="bg-white rounded-[20px] shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200 print:shadow-none print:max-w-full print:h-full print:overflow-visible">
            
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-border-subtle px-6 py-4 flex items-center justify-between z-10 print:hidden">
              <h2 className="text-xl font-bold text-text-primary">গ্রাহকের তথ্য</h2>
              <div className="flex items-center gap-3">
                <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-ice-tint text-slate-teal hover:bg-indigo-600 hover:text-white rounded-xl font-semibold text-sm transition cursor-pointer">
                  <Printer size={16} /> প্রিন্ট
                </button>
                <button onClick={() => setViewCustomer(null)} className="p-2 text-text-muted hover:text-rose-700 hover:bg-alert-peach rounded-full transition cursor-pointer">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Print Header (Only visible in print) */}
            <div className="hidden print:block text-center border-b-2 border-indigo-600 pb-4 mb-6 pt-8">
              <h1 className="text-3xl font-extrabold text-text-primary">Land Management System</h1>
              <h2 className="text-xl font-bold text-text-primary mt-2">গ্রাহকের প্রোফাইল</h2>
            </div>
            
            {/* Body */}
            <div className="p-6 print:p-0 print:px-8">
              <div className="flex flex-col md:flex-row gap-8">
                
                {/* Photo Section */}
                <div className="w-full md:w-48 flex flex-col items-center gap-4 shrink-0">
                  <div className="w-32 h-32 rounded-xl bg-table-header border-2 border-border-subtle overflow-hidden flex items-center justify-center print:border-border-subtle">
                    {viewCustomer.photo ? (
                      <img src={viewCustomer.photo} alt={viewCustomer.name} className="w-full h-full object-contain bg-white" />
                    ) : (
                      <ImageIcon size={40} className="text-slate-300" />
                    )}
                  </div>
                  <div className="text-center print:hidden">
                    <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-full border border-emerald-200">
                      Active Customer
                    </span>
                  </div>
                </div>

                {/* Details Section */}
                <div className="flex-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                    <div>
                      <p className="text-xs font-semibold text-text-muted mb-1 uppercase tracking-wider">গ্রাহকের নাম</p>
                      <p className="text-lg font-bold text-text-primary">{viewCustomer.name}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-text-muted mb-1 uppercase tracking-wider">আইডি নং (Customer ID)</p>
                      <p className="text-base font-bold text-slate-teal font-mono">{viewCustomer.id}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-text-muted mb-1 uppercase tracking-wider">পিতার নাম</p>
                      <p className="text-base font-medium text-slate-700">{viewCustomer.fatherName || 'প্রদান করা হয়নি'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-text-muted mb-1 uppercase tracking-wider">মাতার নাম</p>
                      <p className="text-base font-medium text-slate-700">{viewCustomer.motherName || 'প্রদান করা হয়নি'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-text-muted mb-1 uppercase tracking-wider">জন্ম তারিখ</p>
                      <p className="text-base font-medium text-slate-700">{viewCustomer.dob || 'প্রদান করা হয়নি'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-text-muted mb-1 uppercase tracking-wider">এনআইডি/পাসপোর্ট নং</p>
                      <p className="text-base font-medium text-slate-700">{viewCustomer.idNumber || 'প্রদান করা হয়নি'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-text-muted mb-1 uppercase tracking-wider">মোবাইল নাম্বার</p>
                      <p className="text-base font-medium text-slate-700">{viewCustomer.phone}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-text-muted mb-1 uppercase tracking-wider">ইমেইল</p>
                      <p className="text-base font-medium text-slate-700">{viewCustomer.email}</p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-xs font-semibold text-text-muted mb-1 uppercase tracking-wider">বর্তমান/স্থায়ী ঠিকানা</p>
                      <p className="text-base font-medium text-slate-700">{viewCustomer.address}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Transactions Summary */}
              <div className="mt-8 pt-6 border-t border-border-subtle print:border-border-subtle">
                <h3 className="text-sm font-bold text-text-primary mb-4 uppercase tracking-wider">লেনদেনের সারসংক্ষেপ</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 flex items-center justify-between print:border-emerald-300">
                    <div>
                      <p className="text-xs font-bold text-emerald-600 mb-1">মোট জমি ক্রয়</p>
                      <p className="text-2xl font-black text-emerald-700">{viewCustomer.purchases}</p>
                    </div>
                    <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                      <MapPin size={20} />
                    </div>
                  </div>
                  <div className="bg-alert-peach/50 border border-border-subtle rounded-xl p-4 flex items-center justify-between print:border-rose-300">
                    <div>
                      <p className="text-xs font-bold text-rose-700 mb-1">মোট জমি বিক্রয়</p>
                      <p className="text-2xl font-black text-rose-700">{viewCustomer.sales}</p>
                    </div>
                    <div className="w-12 h-12 bg-rose-100 text-rose-700 rounded-full flex items-center justify-center">
                      <MapPin size={20} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Attachments Section */}
              <div className="mt-8 pt-6 border-t border-border-subtle print:hidden">
                <h3 className="text-sm font-bold text-text-primary mb-4 uppercase tracking-wider">সংযুক্ত ডকুমেন্টস (Attachments)</h3>
                <div className="flex gap-4">
                  <div className="border border-border-subtle rounded-xl p-3 w-48 hover:custom-shadow transition group">
                    <div className="w-full h-24 bg-table-header rounded-lg mb-3 flex items-center justify-center text-slate-300">
                      <FileText size={32} />
                    </div>
                    <p className="text-xs font-bold text-slate-700 mb-2 truncate" title={viewCustomer.idCard || "NID_Card.pdf"}>
                      {viewCustomer.idCard || "NID_Card.pdf"}
                    </p>
                    <div className="flex gap-2">
                      <button className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-ice-tint text-slate-teal rounded text-[10px] font-bold hover:bg-indigo-600 hover:text-white transition">
                        <Eye size={12} /> View
                      </button>
                      <button className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-ice-tint text-slate-teal rounded text-[10px] font-bold hover:bg-slate-200 transition">
                        <Download size={12} /> Save
                      </button>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-0 md:p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in print:hidden">
          <div className="bg-white rounded-none md:rounded-[20px] shadow-xl w-full max-w-4xl h-full md:h-auto max-h-screen md:max-h-[90vh] overflow-x-hidden overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="sticky top-0 bg-white border-b border-border-subtle px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold text-text-primary">
                {editingCustomerId ? 'গ্রাহকের তথ্য ইডিট করুন' : 'নতুন গ্রাহক যুক্ত করুন'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-text-muted hover:text-rose-700 hover:bg-alert-peach rounded-full transition cursor-pointer">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="flex flex-col lg:flex-row gap-8">
                
                {/* Left Side: Text Inputs */}
                <div className="flex-1 space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">গ্রাহকের নাম <span className="text-rose-500">*</span></label>
                    <input required type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-ice-tint border border-border-subtle rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition" placeholder="গ্রাহকের সম্পূর্ণ নাম লিখুন" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">পিতার নাম</label>
                      <input type="text" name="fatherName" value={formData.fatherName} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-ice-tint border border-border-subtle rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition" placeholder="পিতার নাম লিখুন" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">মাতার নাম</label>
                      <input type="text" name="motherName" value={formData.motherName} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-ice-tint border border-border-subtle rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition" placeholder="মাতার নাম লিখুন" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">জন্ম তারিখ</label>
                      <input type="date" name="dob" value={formData.dob} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-ice-tint border border-border-subtle rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">আইডি নং (NID/Passport)</label>
                      <input type="text" name="idNumber" value={formData.idNumber} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-ice-tint border border-border-subtle rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition" placeholder="আইডি কার্ড নাম্বার" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">ঠিকানা</label>
                      <textarea name="address" value={formData.address} onChange={handleInputChange} rows={2} className="w-full px-4 py-2.5 bg-ice-tint border border-border-subtle rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition resize-none" placeholder="বর্তমান বা স্থায়ী ঠিকানা" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">মোবাইল নাম্বার <span className="text-rose-500">*</span></label>
                      <input required type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-ice-tint border border-border-subtle rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition" placeholder="01XXX-XXXXXX" />
                    </div>
                  </div>
                </div>

                {/* Right Side: Attachments */}
                <div className="w-full lg:w-72 flex flex-col gap-6">
                  {/* Photo Attachment */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">গ্রাহকের ছবি</label>
                    <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-300 bg-ice-tint hover:bg-ice-tint hover:border-indigo-300 transition rounded-xl cursor-pointer group overflow-hidden relative">
                      {photoPreview ? (
                        <img src={photoPreview} alt="Preview" className="w-full h-full object-contain p-2" />
                      ) : (
                        <>
                          <div className="w-12 h-12 rounded-full bg-mint-pill text-slate-teal flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                            <ImageIcon size={20} />
                          </div>
                          <span className="text-xs font-semibold text-slate-teal">ছবি আপলোড করুন</span>
                          <span className="text-[10px] text-text-muted mt-1">PNG, JPG (Max 2MB)</span>
                        </>
                      )}
                      <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                    </label>
                  </div>

                  {/* ID Card Attachment */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">আইডি কার্ডের কপি</label>
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 bg-ice-tint hover:bg-emerald-50 hover:border-emerald-300 transition rounded-xl cursor-pointer group text-center px-4">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                        <FileText size={18} />
                      </div>
                      {idCardFileName ? (
                        <span className="text-xs font-semibold text-emerald-600 truncate w-full">{idCardFileName}</span>
                      ) : (
                        <span className="text-xs font-semibold text-emerald-600">আইডি কার্ড আপলোড</span>
                      )}
                      <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleIdCardUpload} />
                    </label>
                  </div>
                </div>

              </div>
              
              <div className="mt-8 pt-6 border-t border-border-subtle flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl border border-border-subtle text-slate-teal font-bold text-sm hover:bg-ice-tint transition cursor-pointer"
                >
                  বাতিল করুন
                </button>
                <button 
                  type="submit" 
                  className="px-8 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 custom-shadow shadow-indigo-600/20 transition cursor-pointer"
                >
                  যুক্ত করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
