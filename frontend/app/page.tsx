'use client';

import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  LayoutDashboard, 
  User, 
  Inbox, 
  Bell,
  CheckCircle2,
  Info,
  MoreHorizontal
} from 'lucide-react';
import { useRouter } from 'next/navigation';

// --- Mock Data ---
const patients = [
  {
    id: 1,
    name: 'Curtis Valk',
    dob: 'March 28, 1997',
    gender: 'Male',
    bloodType: 'O+',
    policyNumber: 'XY-2025-3487',
    planType: 'SHP-2025048723',
    residence: 'San Francisco, CA',
    image: 'https://images.unsplash.com/flagged/photo-1567514650496-be446ae38bdb?q=80&w=1974&auto=format&fit=crop',
    provider: 'PrimeCare Plus'
  },
  {
    id: 2,
    name: 'Sarah Jenkins',
    dob: 'April 12, 1985',
    gender: 'Female',
    bloodType: 'A-',
    policyNumber: 'XY-2025-9982',
    planType: 'SHP-2025048723',
    residence: 'Oakland, CA',
    image: 'https://images.unsplash.com/photo-1685688739798-bce206ab6b42?q=80&w=2070&auto=format&fit=crop',
    provider: 'PrimeCare Plus'
  },
  {
    id: 3,
    name: 'Marcus Chen',
    dob: 'Nov 05, 1990',
    gender: 'Male',
    bloodType: 'B+',
    policyNumber: 'XY-2025-1122',
    planType: 'SHP-2025048723',
    residence: 'San Jose, CA',
    image: 'https://images.unsplash.com/photo-1618517047977-854f5c4b6976?w=900&auto=format&fit=crop',
    provider: 'HealthNet Pro'
  },
  {
    id: 4,
    name: 'Emily Davis',
    dob: 'Jan 19, 2001',
    gender: 'Female',
    bloodType: 'O-',
    policyNumber: 'XY-2025-4455',
    planType: 'SHP-2025048723',
    residence: 'Berkeley, CA',
    image: 'https://images.unsplash.com/photo-1685688739798-bce206ab6b42?q=80&w=2070&auto=format&fit=crop',
    provider: 'PrimeCare Plus'
  },
  {
    id: 5,
    name: 'James Wilson',
    dob: 'Aug 14, 1978',
    gender: 'Male',
    bloodType: 'AB+',
    policyNumber: 'XY-2025-7788',
    planType: 'SHP-2025048723',
    residence: 'Palo Alto, CA',
    image: 'https://images.unsplash.com/photo-1618517047977-854f5c4b6976?w=900&auto=format&fit=crop',
    provider: 'HealthNet Pro'
  },
  {
    id: 6,
    name: 'Olivia Martinez',
    dob: 'Dec 03, 1992',
    gender: 'Female',
    bloodType: 'A+',
    policyNumber: 'XY-2025-2233',
    planType: 'SHP-2025048723',
    residence: 'San Mateo, CA',
    image: 'https://images.unsplash.com/photo-1685688739798-bce206ab6b42?q=80&w=2070&auto=format&fit=crop',
    provider: 'PrimeCare Plus'
  }
];

export default function DashboardPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#F4F5F7] text-slate-900 font-sans flex flex-col overflow-hidden h-screen">
      {/* Top Navigation */}
      <header className="h-20 bg-white px-6 flex items-center justify-between border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
            +
          </div>
          <span className="text-xl font-bold tracking-tight">MediMemo</span>
        </div>

        <nav className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-full border border-slate-100">
          <NavItem 
            icon={<LayoutDashboard size={18} />} 
            label="Dashboard" 
            active={true} 
            onClick={() => router.push('/')} 
          />
          <NavItem 
            icon={<User size={18} />} 
            label="Patients" 
            active={false} 
            onClick={() => router.push('/')} 
          />
        </nav>

        <div className="flex items-center gap-4">
          <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
            <Inbox size={20} />
          </button>
          <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors relative">
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-blue-600 rounded-full border-2 border-white"></span>
          </button>
          <img
            src="https://images.unsplash.com/flagged/photo-1567514650496-be446ae38bdb?q=80&w=1974&auto=format&fit=crop"
            alt="User"
            className="w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover"
          />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden p-4 gap-4">
        <section className="flex-1 p-8 overflow-y-auto custom-scrollbar">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
              <p className="text-slate-500 mt-1">Manage and view patient records</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search patients..." 
                  className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-64"
                />
              </div>
              <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-full text-sm font-medium hover:bg-blue-700 transition-colors">
                <Plus size={18} />
                Add Patient
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-6">
            {patients.map(patient => (
              <PatientCard key={patient.id} patient={patient} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
        active 
          ? 'bg-white text-blue-600 shadow-sm border border-slate-200' 
          : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function PatientCard({ patient }: { patient: typeof patients[0] }) {
  const router = useRouter();
  
  return (
    <div 
      onClick={() => router.push(`/patient/${patient.id}`)}
      className="w-[340px] bg-indigo-50/40 rounded-[32px] shadow-sm flex flex-col shrink-0 relative hover:shadow-md transition-all cursor-pointer border border-white overflow-hidden"
    >
      <div className="relative pt-6 px-6 pb-10 overflow-hidden shrink-0">
        <div className="absolute right-[-20px] bottom-0 w-56 h-56 pointer-events-none">
          <img
            src={patient.image}
            alt={patient.name}
            className="w-full h-full object-cover object-top mix-blend-multiply"
            style={{ filter: 'contrast(1.1) brightness(1.05)' }}
          />
        </div>
        
        <div className="relative z-10 w-2/3">
          <div className="flex items-center gap-1 text-blue-600 font-bold text-[10px] uppercase tracking-wider mb-1">
            <CheckCircle2 size={12} />
            <span>{patient.provider}</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-5">{patient.name}</h2>
          
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Date of birth</span>
              <span className="font-bold text-[13px] text-slate-800">{patient.dob}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Gender</span>
              <span className="font-bold text-[13px] text-slate-800">{patient.gender}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Blood type</span>
              <span className="font-bold text-[13px] text-slate-800">{patient.bloodType}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[28px] mx-2 -mt-4 mb-2 p-5 relative z-20 shadow-sm shrink-0">
        <div className="w-8 h-1 bg-slate-200 rounded-full mx-auto mb-5"></div>
        <div className="flex gap-2 mb-6">
          <button onClick={(e) => { e.stopPropagation(); router.push(`/patient/${patient.id}`); }} className="flex-1 bg-slate-900 text-white rounded-full font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors text-sm py-3">
            <Info size={16} />
            Patient info
          </button>
          <button className="w-10 h-10 rounded-full border border-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-50 transition-colors shrink-0">
            <MoreHorizontal size={18} />
          </button>
        </div>
        <div className="flex flex-col gap-2.5">
          <div>
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block mb-0.5">Policy number</span>
            <span className="font-bold text-[13px] text-slate-800">{patient.policyNumber}</span>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block mb-0.5">Residence</span>
            <span className="font-bold text-[13px] text-slate-800">{patient.residence}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
