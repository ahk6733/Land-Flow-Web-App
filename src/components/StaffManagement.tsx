import React from 'react';
import { Search, Filter, MoreHorizontal, Shield, User, Lock, Edit2, Trash2 } from 'lucide-react';

export default function StaffManagement() {
  const mockStaff = [
    { id: 'STF-001', name: 'Admin User', role: 'Super Admin', email: 'admin@landledger.com', lastActive: '2 mins ago', status: 'Active' },
    { id: 'STF-002', name: 'Data Entry Operator 1', role: 'Operator', email: 'operator1@landledger.com', lastActive: '1 hr ago', status: 'Active' },
    { id: 'STF-003', name: 'Manager Sir', role: 'Manager', email: 'manager@landledger.com', lastActive: '5 hrs ago', status: 'Active' },
    { id: 'STF-004', name: 'Data Entry Operator 2', role: 'Operator', email: 'operator2@landledger.com', lastActive: '2 days ago', status: 'Inactive' },
  ];

  return (
    <div className="space-y-6 font-sans text-slate-800 animate-in fade-in duration-300 pb-12">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-[22px] font-semibold text-slate-700 tracking-tight">Staff & Operators</h1>
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-full text-sm font-semibold transition shadow-md flex items-center gap-2">
          <Shield size={16} /> Add Staff
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
        <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <h3 className="font-bold text-slate-800 text-lg">System Users</h3>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">{mockStaff.length} Total</span>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Search size={14} />
              </span>
              <input 
                type="text" 
                placeholder="Search staff..." 
                className="bg-slate-50 border border-slate-200 rounded-full py-2 pl-9 pr-4 text-xs focus:outline-none focus:border-indigo-300 w-full sm:w-64 transition"
              />
            </div>
            <button className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50">
              <Filter size={14} /> Roles
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="text-slate-400 font-medium border-b border-slate-100 text-xs bg-slate-50/50">
                <th className="py-4 px-6">User Name</th>
                <th className="py-4 px-6">Role</th>
                <th className="py-4 px-6">Email Address</th>
                <th className="py-4 px-6">Last Active</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {mockStaff.map((s, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                        <User size={18} />
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">{s.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{s.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold flex items-center gap-1.5 w-max
                      ${s.role === 'Super Admin' ? 'bg-purple-50 text-purple-600' : 
                        s.role === 'Manager' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-600'}`}>
                      {s.role === 'Super Admin' && <Lock size={12} />}
                      {s.role}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-slate-500 font-medium text-xs">{s.email}</td>
                  <td className="py-4 px-6 text-slate-500 text-xs">{s.lastActive}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${s.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                      <span className="text-xs font-semibold text-slate-600">{s.status}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 text-slate-400 hover:text-indigo-600 transition bg-white shadow-sm rounded-lg border border-slate-100">
                        <Edit2 size={14} />
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-rose-600 transition bg-white shadow-sm rounded-lg border border-slate-100">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
