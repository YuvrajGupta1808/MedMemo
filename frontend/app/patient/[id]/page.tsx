'use client';

import React, { useState, ReactNode } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Activity,
  User,
  Mic,
  Pill,
  Syringe,
  FileText,
  HeartPulse,
  ClipboardList,
  AppWindow,
  Maximize,
  Sparkles,
  Paperclip,
  Send,
  Download,
  Clock,
  CheckCircle2,
  Droplets,
  ChevronLeft,
  Search,
  Plus,
  Inbox,
  Bell,
  LayoutDashboard,
  MoreHorizontal,
  Info,
  QrCode,
  Image,
  Video,
  Music,
  X,
  Share2
} from 'lucide-react';
import Chatbot from '@/components/Chatbot';
import { Button } from '@/components/ui/button';

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
    image: 'https://images.unsplash.com/photo-1618517047977-854f5c4b6976?w=900&auto=format&fit=crop&q=60',
    provider: 'HealthNet Pro'
  }
];

export default function PatientPage() {
  const { id } = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'user' | 'file' | 'activity' | 'session' | 'pill' | 'syringe'>('user');
  
  const patient = patients.find(p => p.id === Number(id)) || patients[0];

  return (
    <div className="min-h-screen bg-[#F4F5F7] text-slate-900 font-sans flex flex-col overflow-hidden h-screen">
      {/* Top Navigation */}
      <header className="h-20 bg-white px-6 flex items-center justify-between border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-2">
          <button onClick={() => router.push('/')} className="mr-2 p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-500">
            <ChevronLeft size={20} />
          </button>
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
            +
          </div>
          <span className="text-xl font-bold tracking-tight">MediMemo</span>
        </div>

        <nav className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-full border border-slate-100">
          <NavItem 
            icon={<LayoutDashboard size={18} />} 
            label="Dashboard" 
            active={false} 
            onClick={() => router.push('/')} 
          />
          <NavItem 
            icon={<User size={18} />} 
            label="Patients" 
            active={true} 
            onClick={() => {}} 
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
        {/* Narrow Sidebar */}
        <aside className="w-16 bg-white rounded-3xl shadow-sm flex flex-col items-center py-4 gap-4 shrink-0 border border-slate-100 h-fit my-auto">
          <div className="flex flex-col gap-3">
            <SidebarIcon 
              icon={<User size={20} />} 
              active={activeTab === 'user'} 
              onClick={() => setActiveTab('user')}
            />
            <SidebarIcon 
              icon={<ClipboardList size={20} />} 
              active={activeTab === 'activity'} 
              onClick={() => setActiveTab('activity')}
            />
            <SidebarIcon 
              icon={<Mic size={20} />} 
              active={activeTab === 'session'} 
              onClick={() => setActiveTab('session')}
            />
            <SidebarIcon 
              icon={<Pill size={20} />} 
              active={activeTab === 'pill'} 
              onClick={() => setActiveTab('pill')}
            />
            <SidebarIcon 
              icon={<Syringe size={20} />} 
              active={activeTab === 'syringe'} 
              onClick={() => setActiveTab('syringe')}
            />
            <SidebarIcon 
              icon={<FileText size={20} />} 
              active={activeTab === 'file'} 
              onClick={() => setActiveTab('file')}
            />
          </div>
        </aside>

        {/* Left Column */}
        <div className="w-[340px] flex flex-col gap-4 overflow-y-auto custom-scrollbar shrink-0 pb-4">
          {activeTab === 'user' ? (
            <>
              <PatientDetailCard patient={patient} />
              
              <PatientInfoCard patient={patient} />

              {/* Heart Rate Card */}
              <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 p-6 shrink-0 transition-all hover:shadow-md">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm">
                      <HeartPulse size={20} />
                    </div>
                    <div>
                      <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Heart rate</p>
                      <p className="text-xl font-bold text-slate-900">72 <span className="text-xs font-medium text-slate-400">BPM</span></p>
                    </div>
                  </div>
                  <div className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-1 rounded-full">Normal</div>
                </div>
                <div className="h-24 w-full relative">
                  <svg viewBox="0 0 200 60" className="w-full h-full stroke-blue-500 fill-none" preserveAspectRatio="none">
                    <path d="M0,30 L20,30 L25,20 L30,40 L35,10 L40,50 L45,25 L50,30 L70,30 L75,20 L80,40 L85,10 L90,50 L95,25 L100,30 L120,30 L125,20 L130,40 L135,10 L140,50 L145,25 L150,30 L170,30 L175,20 L180,40 L185,10 L190,50 L195,25 L200,30" strokeWidth="2" strokeLinejoin="round" />
                  </svg>
                  <div className="absolute bottom-0 left-0 w-full flex justify-between text-[9px] text-slate-400 font-medium">
                    <span>0</span><span>2</span><span>4</span><span>6</span><span>8</span><span>10</span>
                  </div>
                </div>
              </div>

              {/* Blood Pressure Card */}
              <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 p-6 shrink-0 transition-all hover:shadow-md">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm">
                      <Activity size={20} />
                    </div>
                    <div>
                      <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Blood pressure</p>
                      <p className="text-xl font-bold text-slate-900">120/75 <span className="text-xs font-medium text-slate-400">mmHg</span></p>
                    </div>
                  </div>
                  <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-1 rounded-full">01:34 PM</span>
                </div>
                <div className="h-16 w-full relative">
                  <svg viewBox="0 0 200 40" className="w-full h-full stroke-indigo-400 fill-none" preserveAspectRatio="none">
                    <path d="M0,20 Q10,10 20,20 T40,20 T60,20 T80,20 T100,20 T120,20 T140,20 T160,20 T180,20 T200,20" strokeWidth="2" strokeDasharray="4 4" className="stroke-slate-200" />
                    <path d="M0,20 C10,10 15,30 25,20 C35,10 40,30 50,20 C60,10 65,30 75,20 C85,10 90,30 100,20 C110,10 115,30 125,20 C135,10 140,30 150,20 C160,10 165,30 175,20 C185,10 190,30 200,20" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
              </div>
            </>
          ) : activeTab === 'file' ? (
            <DocumentsView patientName={patient.name} />
          ) : activeTab === 'pill' ? (
            <MedicationView patientName={patient.name} />
          ) : activeTab === 'syringe' ? (
            <InjectionsView patientName={patient.name} />
          ) : activeTab === 'activity' ? (
            <SummaryView patientName={patient.name} />
          ) : activeTab === 'session' ? (
            <SessionView patientName={patient.name} />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-white rounded-[32px] border border-slate-100 p-8">
              <p className="text-sm">Content for {activeTab} tab coming soon.</p>
            </div>
          )}
        </div>

        {/* Center Display Area */}
        <div className="flex-1 bg-slate-50 rounded-[32px] shadow-inner border-2 border-dashed border-slate-200 relative overflow-hidden flex flex-col items-center justify-center p-8 text-center">
          <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-blue-600 mb-4">
            <AppWindow size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">MCP App Display</h3>
          <p className="text-sm text-slate-500 max-w-sm">
            When you ask the AI assistant to use an MCP tool, the interactive app interface will appear here.
          </p>
          
          <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-10">
            <button className="w-10 h-10 bg-white rounded-full shadow-sm border border-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors">
              <Maximize size={18} />
            </button>
          </div>
        </div>

        {/* Right Sidebar - Chatbot */}
        <div className="w-[380px] bg-white rounded-[32px] shadow-sm border border-slate-100 flex flex-col shrink-0 overflow-hidden relative">
          <Chatbot patientName={patient.name} />
        </div>
      </main>
    </div>
  );
}

// --- Helper Components ---

function NavItem({ icon, label, active, onClick }: { icon: ReactNode; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors relative ${
        active ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200/50'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function SidebarIcon({ icon, active, onClick }: { icon: ReactNode; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
        active ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
      }`}
    >
      {icon}
    </button>
  );
}

function PatientDetailCard({ patient }: { patient: any }) {
  return (
    <div className="bg-indigo-50/40 rounded-[32px] shadow-sm flex flex-col relative shrink-0 border border-white overflow-hidden">
      <div className="relative pt-6 px-6 pb-10 overflow-hidden shrink-0">
        <div className="absolute right-[-20px] bottom-0 w-56 h-56 pointer-events-none">
          <img 
            src={patient.image} 
            alt={patient.name} 
            className="w-full h-full object-cover object-top mix-blend-multiply" 
            style={{ filter: 'contrast(1.1) brightness(1.05)' }} 
          />
        </div>
        <div className="relative z-10 w-2/3 mt-8">
          <div className="flex items-center gap-1 text-blue-600 font-bold text-[10px] uppercase tracking-wider mb-1">
            <CheckCircle2 size={12} />
            <span>{patient.provider}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-5">{patient.name}</h1>
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
          <button className="flex-1 bg-slate-900 text-white rounded-full font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors text-sm py-3">
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

function PatientInfoCard({ patient }: { patient: any }) {
  return (
    <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 p-6 shrink-0">
      <div className="flex gap-2 mb-6">
        <button className="w-10 h-10 rounded-full border border-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-50 transition-colors shrink-0">
          <Share2 size={18} />
        </button>
        <button className="flex-1 bg-blue-600 text-white rounded-full font-medium flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors text-sm">
          <Info size={16} />
          Patient info
        </button>
        <button className="w-10 h-10 rounded-full border border-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-50 transition-colors shrink-0">
          <MoreHorizontal size={18} />
        </button>
      </div>
      <div className="flex gap-4 items-center">
        <div className="w-20 h-20 bg-slate-100 rounded-xl shrink-0 p-1 flex items-center justify-center">
          <QrCode size={64} className="text-slate-800" />
        </div>
        <div className="flex flex-col gap-2.5 text-xs">
          <div>
            <span className="text-slate-400 block mb-0.5">Policy number</span>
            <span className="font-medium text-[13px] text-slate-800">{patient.policyNumber}</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Plan type</span>
            <span className="font-medium text-[13px] text-slate-800">{patient.planType || 'SHP-2025048723'}</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Residence</span>
            <span className="font-medium text-[13px] text-slate-800">{patient.residence}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const SummaryView = ({ patientName }: { patientName: string }) => {
  const summary = {
    lastConversation: "Oct 28, 2025 • 15 mins",
    keyPoints: [
      "Patient reported mild chest tightness after exercise.",
      "Discussed medication adherence for Lisinopril.",
      "Reviewed recent blood test results showing improved glucose levels.",
      "Patient expressed concern about occasional dizziness in the morning."
    ],
    followUps: [
      { id: 1, task: "Schedule follow-up X-ray for lungs", status: "Pending", priority: "High" },
      { id: 2, task: "Monitor blood pressure twice daily", status: "In Progress", priority: "Medium" },
      { id: 3, task: "Adjust Metformin dosage if glucose stays high", status: "Planned", priority: "Low" }
    ]
  };

  return (
    <div className="flex flex-col gap-6 text-left animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-xl font-bold text-slate-900">Patient Summary</h3>
        <button className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
          <Download size={12} />
          Download PDF
        </button>
      </div>

      <div className="flex flex-col gap-6">
        <div className="bg-blue-600 text-white rounded-[32px] p-6 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <Sparkles size={16} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">Last Conversation</span>
            </div>
            <p className="text-lg font-medium leading-relaxed mb-4">
              "Patient is recovering well but needs to monitor morning dizziness. Overall progress is positive."
            </p>
            <div className="flex items-center gap-2 text-[10px] font-bold opacity-70">
              <Clock size={12} />
              <span>{summary.lastConversation}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Key Discussion Points</h4>
          <div className="flex flex-col gap-3">
            {summary.keyPoints.map((point, i) => (
              <div key={i} className="flex gap-3">
                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0"></div>
                <p className="text-sm text-slate-600 leading-relaxed">{point}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-50 rounded-[32px] p-6 border border-slate-100">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Follow-up Actions</h4>
          <div className="flex flex-col gap-4">
            {summary.followUps.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-bold text-slate-800">{item.task}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                      item.priority === 'High' ? 'bg-rose-50 text-rose-600' : 
                      item.priority === 'Medium' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'
                    }`}>
                      {item.priority}
                    </span>
                    <span className="text-[9px] font-medium text-slate-400">{item.status}</span>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                  <CheckCircle2 size={16} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const SessionView = ({ patientName }: { patientName: string }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript] = useState([
    { role: 'doctor', text: 'Good morning, Curtis. How are you feeling today?', time: '10:02 AM' },
    { role: 'patient', text: 'I\'ve been having some tightness in my chest when I exercise.', time: '10:02 AM' },
    { role: 'doctor', text: 'I see. When did this start happening?', time: '10:03 AM' },
  ]);

  return (
    <div className="flex flex-col h-full gap-6 text-left animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-xl font-bold text-slate-900">Live Session</h3>
        <div className="flex items-center gap-2">
          {isRecording && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-[10px] font-bold animate-pulse">
              <div className="w-1.5 h-1.5 rounded-full bg-rose-600"></div>
              RECORDING
            </div>
          )}
          <button className="text-xs font-bold text-slate-400 hover:text-slate-600">Settings</button>
        </div>
      </div>

      <div className="bg-slate-900 rounded-[40px] p-8 flex flex-col items-center justify-center gap-6 relative overflow-hidden shadow-xl">
        <div className={`absolute inset-0 bg-blue-500/10 blur-[100px] transition-opacity duration-1000 ${isRecording ? 'opacity-100' : 'opacity-0'}`}></div>
        
        <div className="relative z-10 flex flex-col items-center gap-4">
          <button 
            onClick={() => setIsRecording(!isRecording)}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500 ${
              isRecording 
                ? 'bg-rose-500 shadow-[0_0_30px_rgba(244,63,94,0.4)] scale-110' 
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            {isRecording ? <X size={32} className="text-white" /> : <Mic size={32} className="text-white" />}
          </button>
          
          <div className="text-center">
            <p className="text-white font-bold text-lg tracking-tight">
              {isRecording ? '04:12' : 'Start Recording'}
            </p>
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-1">
              {isRecording ? 'Tap to stop' : 'Tap to begin session'}
            </p>
          </div>
        </div>

        {isRecording && (
          <div className="flex items-end gap-1 h-12 mt-4">
            {[...Array(20)].map((_, i) => (
              <div 
                key={i} 
                className="w-1 bg-blue-400/60 rounded-full animate-pulse"
                style={{ 
                  height: `${20 + Math.random() * 80}%`,
                  animationDelay: `${i * 0.05}s`
                }}
              ></div>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">Live Transcription</h4>
        <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-4 custom-scrollbar">
          {transcript.map((entry, i) => (
            <div key={i} className={`flex flex-col gap-1 ${entry.role === 'doctor' ? 'items-end' : 'items-start'}`}>
              <div className="flex items-center gap-2 px-2">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{entry.role}</span>
                <span className="text-[9px] text-slate-300">{entry.time}</span>
              </div>
              <div className={`max-w-[85%] p-4 rounded-3xl text-sm leading-relaxed ${
                entry.role === 'doctor' 
                  ? 'bg-blue-600 text-white rounded-tr-none' 
                  : 'bg-slate-100 text-slate-700 rounded-tl-none'
              }`}>
                {entry.text}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const MedicationView = ({ patientName }: { patientName: string }) => {
  const medications = [
    { id: 1, name: 'Aspirin', dosage: '1 pill, 25 mg', icon: <Pill size={16} />, color: 'bg-indigo-600', bgColor: 'bg-indigo-50/50', taken: false, time: 'Before lunch' },
    { id: 2, name: 'Vitamin B2', dosage: '8 drops', icon: <Droplets size={16} />, color: 'bg-orange-400', bgColor: 'bg-orange-50/50', taken: true, time: 'Before lunch' },
    { id: 3, name: 'Lisinopril', dosage: '1 pill, 10 mg', icon: <Pill size={16} />, color: 'bg-blue-500', bgColor: 'bg-blue-50/50', taken: false, time: 'After dinner' },
    { id: 4, name: 'Metformin', dosage: '1 pill, 500 mg', icon: <Pill size={16} />, color: 'bg-emerald-500', bgColor: 'bg-emerald-50/50', taken: false, time: 'After dinner' },
  ];

  return (
    <div className="flex flex-col gap-6 text-left animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-xl font-bold text-slate-900">Medication</h3>
        <button className="text-xs font-bold text-blue-600 hover:underline">See all</button>
      </div>

      <div className="flex flex-col gap-8">
        <div>
          <p className="text-xs text-slate-400 mb-4 px-2 font-medium uppercase tracking-wider">Before lunch</p>
          <div className="grid grid-cols-2 gap-4">
            {medications.filter(m => m.time === 'Before lunch').map(med => (
              <div key={med.id} className={`${med.bgColor} rounded-[32px] p-5 shadow-sm border border-white flex flex-col gap-4 transition-transform hover:scale-[1.02]`}>
                <div className={`w-10 h-10 ${med.color} text-white rounded-full flex items-center justify-center shadow-sm`}>
                  {med.icon}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{med.name}</h4>
                  <p className="text-[10px] text-slate-400">{med.dosage}</p>
                </div>
                <button 
                  className={`w-full py-2.5 rounded-full text-[11px] font-bold transition-colors ${
                    med.taken 
                      ? 'bg-white/60 text-slate-400' 
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  {med.taken ? 'Taken' : 'Take'}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs text-slate-400 mb-4 px-2 font-medium uppercase tracking-wider">After dinner</p>
          <div className="grid grid-cols-2 gap-4">
            {medications.filter(m => m.time === 'After dinner').map(med => (
              <div key={med.id} className={`${med.bgColor} rounded-[32px] p-5 shadow-sm border border-white flex flex-col gap-4 transition-transform hover:scale-[1.02]`}>
                <div className={`w-10 h-10 ${med.color} text-white rounded-full flex items-center justify-center shadow-sm`}>
                  {med.icon}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{med.name}</h4>
                  <p className="text-[10px] text-slate-400">{med.dosage}</p>
                </div>
                <button 
                  className={`w-full py-2.5 rounded-full text-[11px] font-bold transition-colors ${
                    med.taken 
                      ? 'bg-white/60 text-slate-400' 
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  {med.taken ? 'Taken' : 'Take'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const InjectionsView = ({ patientName }: { patientName: string }) => {
  const injections = [
    { id: 1, name: 'Insulin Glargine', dosage: '10 units', icon: <Syringe size={16} />, color: 'bg-rose-500', bgColor: 'bg-rose-50/50', taken: true, time: 'Morning' },
    { id: 2, name: 'Vitamin B12', dosage: '1000 mcg', icon: <Syringe size={16} />, color: 'bg-blue-500', bgColor: 'bg-blue-50/50', taken: false, time: 'Morning' },
    { id: 3, name: 'Insulin Lispro', dosage: '5 units', icon: <Syringe size={16} />, color: 'bg-rose-600', bgColor: 'bg-rose-50/50', taken: false, time: 'Evening' },
  ];

  return (
    <div className="flex flex-col gap-6 text-left animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-xl font-bold text-slate-900">Injections & Shots</h3>
        <button className="text-xs font-bold text-blue-600 hover:underline">See all</button>
      </div>

      <div className="flex flex-col gap-8">
        <div>
          <p className="text-xs text-slate-400 mb-4 px-2 font-medium uppercase tracking-wider">Morning</p>
          <div className="grid grid-cols-2 gap-4">
            {injections.filter(m => m.time === 'Morning').map(inj => (
              <div key={inj.id} className={`${inj.bgColor} rounded-[32px] p-5 shadow-sm border border-white flex flex-col gap-4 transition-transform hover:scale-[1.02]`}>
                <div className={`w-10 h-10 ${inj.color} text-white rounded-full flex items-center justify-center shadow-sm`}>
                  {inj.icon}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{inj.name}</h4>
                  <p className="text-[10px] text-slate-400">{inj.dosage}</p>
                </div>
                <button 
                  className={`w-full py-2.5 rounded-full text-[11px] font-bold transition-colors ${
                    inj.taken 
                      ? 'bg-white/60 text-slate-400' 
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  {inj.taken ? 'Administered' : 'Administer'}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs text-slate-400 mb-4 px-2 font-medium uppercase tracking-wider">Evening</p>
          <div className="grid grid-cols-2 gap-4">
            {injections.filter(m => m.time === 'Evening').map(inj => (
              <div key={inj.id} className={`${inj.bgColor} rounded-[32px] p-5 shadow-sm border border-white flex flex-col gap-4 transition-transform hover:scale-[1.02]`}>
                <div className={`w-10 h-10 ${inj.color} text-white rounded-full flex items-center justify-center shadow-sm`}>
                  {inj.icon}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{inj.name}</h4>
                  <p className="text-[10px] text-slate-400">{inj.dosage}</p>
                </div>
                <button 
                  className={`w-full py-2.5 rounded-full text-[11px] font-bold transition-colors ${
                    inj.taken 
                      ? 'bg-white/60 text-slate-400' 
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  {inj.taken ? 'Administered' : 'Administer'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const DocumentsView = ({ patientName }: { patientName: string }) => {
  const docs = [
    { id: 1, title: 'Chest X-Ray', date: 'Oct 27, 2025', type: 'Image', size: 'large', color: 'bg-blue-600', bgColor: 'bg-blue-50/50', icon: <Image size={20} /> },
    { id: 2, title: 'Blood Test', date: 'Oct 25, 2025', type: 'Document', size: 'small', color: 'bg-emerald-500', bgColor: 'bg-emerald-50/50', icon: <FileText size={18} /> },
    { id: 3, title: 'MRI Scan', date: 'Oct 20, 2025', type: 'Image', size: 'small', color: 'bg-cyan-500', bgColor: 'bg-cyan-50/50', icon: <Image size={18} /> },
    { id: 4, title: 'Prescription', date: 'Oct 15, 2025', type: 'Document', size: 'medium', color: 'bg-orange-400', bgColor: 'bg-orange-50/50', icon: <FileText size={20} /> },
  ];

  return (
    <div className="flex flex-col gap-6 text-left animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-xl font-bold text-slate-900">Documents</h3>
        <button className="text-xs font-bold text-blue-600 hover:underline">See all</button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {docs.map((doc) => (
          <div 
            key={doc.id}
            className={`${doc.bgColor} rounded-[32px] p-5 shadow-sm border border-white flex flex-col justify-between transition-all hover:scale-[1.02] cursor-pointer hover:shadow-md ${
              doc.size === 'large' ? 'col-span-2 h-40' : doc.size === 'medium' ? 'col-span-2 h-32' : 'h-36'
            }`}
          >
            <div className="flex justify-between items-start">
              <div className={`w-10 h-10 ${doc.color} text-white rounded-full flex items-center justify-center shadow-sm`}>
                {doc.icon}
              </div>
              <span className="bg-white/60 text-slate-500 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                {doc.type}
              </span>
            </div>
            
            <div>
              <h4 className="font-bold text-slate-900 text-sm mb-0.5">{doc.title}</h4>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{doc.date}</p>
            </div>
          </div>
        ))}

        <div className="bg-slate-50 rounded-[32px] p-5 border border-dashed border-slate-200 flex flex-col justify-center items-center gap-3 transition-all hover:scale-[1.02] cursor-pointer hover:bg-slate-100 h-36">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-slate-900 shadow-sm">
            <Plus size={24} />
          </div>
          <div className="text-center">
            <h4 className="font-bold text-slate-600 text-sm">Upload File</h4>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Image, Video, Doc</p>
          </div>
        </div>
      </div>
    </div>
  );
};
