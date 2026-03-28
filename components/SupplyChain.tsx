import React, { useState } from 'react';
import { 
  Search, 
  QrCode, 
  CheckCircle2, 
  Factory, 
  Truck, 
  Building2, 
  Store, 
  Package, 
  MapPin, 
  User, 
  TrendingUp, 
  Globe, 
  AlertTriangle, 
  ShieldCheck, 
  Info,
  ArrowRight,
  Shield,
  Activity,
  BarChart3
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import type { Batch, UserRole } from '../types';

interface SupplyChainProps {
  userRole: UserRole;
  trustScores: Record<string, number>;
}

export const SupplyChain: React.FC<SupplyChainProps> = ({ userRole, trustScores }) => {
  const [activeTab, setActiveTab] = useState<'trace' | 'network' | 'prediction' | 'alerts'>('trace');
  const [searchBatch, setSearchBatch] = useState('');
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [isTracing, setIsTracing] = useState(false);

  const consumptionData = [
    { month: 'Jan', consumed: 4000, predicted: 4200 },
    { month: 'Feb', consumed: 3000, predicted: 3100 },
    { month: 'Mar', consumed: 5000, predicted: 4800 },
    { month: 'Apr', consumed: 2780, predicted: 2900 },
    { month: 'May', consumed: 1890, predicted: 2100 },
    { month: 'Jun', consumed: 2390, predicted: 2500 },
    { month: 'Jul', consumed: 3490, predicted: 3600 },
  ];

  const handleTrack = async () => {
    if (!searchBatch) return;
    setIsTracing(true);
    try {
      const res = await fetch(`/api/batches/${searchBatch}`);
      if (res.ok) {
        setSelectedBatch(await res.json());
      } else {
        alert("Batch not found in the global ledger.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsTracing(false);
    }
  };

  const alerts = [
    { id: 1, type: 'warning', title: 'Cold Chain Breach', location: 'Frankfurt Hub', time: '2h ago', description: 'Temperature deviation detected in Batch #B-2024-091.' },
    { id: 2, type: 'critical', title: 'Counterfeit Attempt', location: 'Mumbai Port', time: '5h ago', description: 'Duplicate serial numbers detected for Amoxicillin 500mg.' },
    { id: 3, type: 'info', title: 'Regulatory Update', location: 'Global', time: '1d ago', description: 'New WHO guidelines for pharmaceutical serialization effective next month.' },
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-widest">
            <Globe className="w-3 h-3" /> Global Network
          </div>
          <h2 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight">Supply Chain Intelligence</h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-2xl">
            Real-time visibility into the global pharmaceutical lifecycle. Track batches, monitor network integrity, and predict market demand with Med-Gemma AI.
          </p>
        </div>
        
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl shadow-inner border border-slate-200 dark:border-slate-700">
          {[
            { id: 'trace', label: 'Trace', icon: QrCode },
            { id: 'network', label: 'Network', icon: Building2 },
            { id: 'prediction', label: 'Analytics', icon: BarChart3 },
            { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab.id 
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        
        {/* Sidebar Alerts (Visible on large screens) */}
        <div className="xl:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-lg font-black mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" /> Network Pulse
            </h3>
            <div className="space-y-4">
              {alerts.map(alert => (
                <div key={alert.id} className="group cursor-pointer">
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                      alert.type === 'critical' ? 'bg-red-500 animate-pulse' :
                      alert.type === 'warning' ? 'bg-orange-500' : 'bg-blue-500'
                    }`} />
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-black uppercase tracking-wider text-slate-400">{alert.time}</span>
                        <span className="text-[10px] font-bold text-slate-500">{alert.location}</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-white group-hover:text-blue-500 transition-colors">{alert.title}</h4>
                      <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{alert.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-6 py-3 text-xs font-bold text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all">
              View All Alerts
            </button>
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-lg shadow-blue-500/20">
            <ShieldCheck className="w-10 h-10 mb-4 opacity-80" />
            <h3 className="text-xl font-black mb-2">Network Integrity</h3>
            <p className="text-sm text-blue-100 mb-6">98.4% of all nodes are currently operating within compliant parameters.</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold">
                <span>Verified Nodes</span>
                <span>1,284</span>
              </div>
              <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
                <div className="bg-white h-full w-[98%]" />
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Content Section */}
        <div className="xl:col-span-3 space-y-8">
          
          {activeTab === 'trace' && (
            <div className="space-y-8">
              {/* Search Bar */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="text-xl font-black mb-6 flex items-center gap-2">
                  <Search className="w-6 h-6 text-blue-500" /> Global Ledger Search
                </h3>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <input 
                      type="text" 
                      value={searchBatch}
                      onChange={(e) => setSearchBatch(e.target.value)}
                      placeholder="Enter Batch ID or Serial Number (e.g. BATCH-2024-001)"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl px-6 py-4 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                    />
                  </div>
                  <button 
                    onClick={handleTrack}
                    disabled={isTracing}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-3 shadow-lg shadow-blue-500/20 disabled:opacity-50"
                  >
                    {isTracing ? (
                      <Activity className="w-5 h-5 animate-spin" />
                    ) : (
                      <QrCode className="w-5 h-5" />
                    )}
                    Trace Lifecycle
                  </button>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Recent Searches:</span>
                  {['BATCH-2024-001', 'B-992-X', 'SER-8812'].map(s => (
                    <button key={s} onClick={() => setSearchBatch(s)} className="text-xs font-bold text-blue-500 hover:underline">{s}</button>
                  ))}
                </div>
              </div>

              {/* Trace Results */}
              {selectedBatch ? (
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                  <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex items-center gap-5">
                        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                          <Package className="w-8 h-8" />
                        </div>
                        <div>
                          <h4 className="text-2xl font-black text-slate-800 dark:text-white">{selectedBatch.medicineName}</h4>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-sm font-bold text-slate-500">Batch ID: {selectedBatch.id}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                            <span className="text-sm font-bold text-slate-500">{selectedBatch.manufacturer}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-xl font-black text-xs uppercase tracking-widest border border-emerald-200 dark:border-emerald-800">
                          <ShieldCheck className="w-4 h-4" /> Verified Authentic
                        </div>
                        <span className="text-xs font-bold text-slate-400">Ledger Hash: 0x882a...f912</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-8">
                    <h5 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-8">Chain of Custody Timeline</h5>
                    <div className="relative">
                      <div className="absolute left-[27px] top-4 bottom-4 w-1 bg-slate-100 dark:bg-slate-800 rounded-full" />
                      <div className="space-y-12">
                        {selectedBatch.history.map((step, index) => (
                          <div key={index} className="relative flex gap-8 items-start group">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 z-10 border-4 border-white dark:border-slate-900 shadow-sm transition-all group-hover:scale-110 ${
                              index === 0 ? 'bg-blue-600 text-white shadow-blue-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                            }`}>
                              {step.event.includes('Manufactured') ? <Factory className="w-6 h-6" /> : 
                               step.event.includes('Transit') ? <Truck className="w-6 h-6" /> : 
                               <Store className="w-6 h-6" />}
                            </div>
                            <div className="flex-1 pt-2">
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                                <h4 className="font-black text-slate-800 dark:text-white text-xl">{step.event}</h4>
                                <span className="text-xs font-black text-slate-400 bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-lg border border-slate-100 dark:border-slate-700">
                                  {new Date(step.timestamp).toLocaleString()}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-6">
                                <div className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-400">
                                  <User className="w-4 h-4 text-blue-500" />
                                  {step.actor}
                                </div>
                                <div className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-400">
                                  <MapPin className="w-4 h-4 text-blue-500" />
                                  {step.location}
                                </div>
                              </div>
                              {index === 0 && (
                                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800/50">
                                  <p className="text-xs font-bold text-blue-700 dark:text-blue-300 flex items-center gap-2">
                                    <Info className="w-4 h-4" /> Quality Assurance Note
                                  </p>
                                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                    Batch passed all 12 automated quality gates including potency, purity, and packaging integrity.
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-100 dark:bg-slate-800/50 rounded-3xl p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-700">
                  <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                    <QrCode className="w-10 h-10 text-slate-300" />
                  </div>
                  <h4 className="text-xl font-black text-slate-400">No Batch Selected</h4>
                  <p className="text-slate-500 mt-2">Enter a batch ID above to view its full chain of custody.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'network' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(trustScores).map(([name, score]) => (
                  <div key={name} className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-blue-500/50 transition-all group">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                          name.includes('Pharma') ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-500' :
                          name.includes('Distributor') ? 'bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-500' :
                          'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'
                        }`}>
                          {name.includes('Pharma') ? <Factory className="w-7 h-7" /> : 
                           name.includes('Distributor') ? <Truck className="w-7 h-7" /> : 
                           <Store className="w-7 h-7" />}
                        </div>
                        <div>
                          <h4 className="text-lg font-black text-slate-800 dark:text-white group-hover:text-blue-600 transition-colors">{name}</h4>
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Verified Member</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Trust Score</span>
                        <div className={`text-2xl font-black ${score > 90 ? 'text-emerald-500' : 'text-yellow-500'}`}>
                          {score}%
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                        <span>Compliance Rate</span>
                        <span>{score + 2}%</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className={`h-full ${score > 90 ? 'bg-emerald-500' : 'bg-yellow-500'}`} style={{ width: `${score}%` }} />
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex -space-x-2">
                          {[1,2,3].map(i => (
                            <div key={i} className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-white dark:border-slate-900" />
                          ))}
                          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-[8px] font-bold text-white border-2 border-white dark:border-slate-900">+12</div>
                        </div>
                        <button className="text-xs font-black text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:gap-2 transition-all">
                          View Profile <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'prediction' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                  <h3 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                    <TrendingUp className="w-7 h-7 text-indigo-500" /> Demand Forecasting
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">AI-driven predictive modeling based on global consumption patterns.</p>
                </div>
                <div className="flex gap-6">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-indigo-500" />
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Actual Demand</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-700" />
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Med-Gemma Prediction</span>
                  </div>
                </div>
              </div>
              
              <div className="h-96 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={consumptionData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorConsumed" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.1} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 'bold' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 'bold' }} dx={-10} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '16px', color: '#f8fafc', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                      itemStyle={{ color: '#f8fafc', fontWeight: 'bold' }}
                    />
                    <Area type="monotone" dataKey="predicted" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorPredicted)" />
                    <Area type="monotone" dataKey="consumed" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorConsumed)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              
              <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: 'Forecast Accuracy', value: '94.2%', icon: Shield, color: 'text-emerald-500' },
                  { label: 'Projected Growth', value: '+12.5%', icon: TrendingUp, color: 'text-blue-500' },
                  { label: 'Data Confidence', value: 'High', icon: ShieldCheck, color: 'text-indigo-500' },
                ].map(stat => (
                  <div key={stat.label} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-3 mb-2">
                      <stat.icon className={`w-5 h-5 ${stat.color}`} />
                      <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{stat.label}</span>
                    </div>
                    <div className="text-2xl font-black text-slate-800 dark:text-white">{stat.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'alerts' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                    <AlertTriangle className="w-7 h-7 text-orange-500" /> Network Alerts
                  </h3>
                  <div className="flex gap-2">
                    <button className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold">All Types</button>
                    <button className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold">Critical Only</button>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {alerts.map(alert => (
                    <div key={alert.id} className={`p-6 rounded-3xl border transition-all hover:shadow-md ${
                      alert.type === 'critical' ? 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30' :
                      alert.type === 'warning' ? 'bg-orange-50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-900/30' :
                      'bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30'
                    }`}>
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className={`p-3 rounded-2xl ${
                            alert.type === 'critical' ? 'bg-red-500 text-white' :
                            alert.type === 'warning' ? 'bg-orange-500 text-white' :
                            'bg-blue-500 text-white'
                          }`}>
                            <AlertTriangle className="w-6 h-6" />
                          </div>
                          <div>
                            <h4 className="text-lg font-black text-slate-800 dark:text-white">{alert.title}</h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{alert.description}</p>
                            <div className="flex gap-4 mt-3">
                              <span className="text-xs font-bold text-slate-500 flex items-center gap-1"><MapPin className="w-3 h-3" /> {alert.location}</span>
                              <span className="text-xs font-bold text-slate-500 flex items-center gap-1"><Activity className="w-3 h-3" /> {alert.time}</span>
                            </div>
                          </div>
                        </div>
                        <button className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
                          alert.type === 'critical' ? 'bg-red-600 text-white hover:bg-red-700' :
                          alert.type === 'warning' ? 'bg-orange-600 text-white hover:bg-orange-700' :
                          'bg-blue-600 text-white hover:bg-blue-700'
                        }`}>
                          Take Action
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
