import React from 'react';
import { Package, Copy, Activity, Stethoscope, CalendarDays, Link as LinkIcon, AlertCircle, TrendingUp, QrCode, Globe, Store, Search, BarChart3, Upload } from 'lucide-react';
import type { UserRole } from '../types';

interface ModeSelectorProps {
    onModeSelect: (mode: 'single' | 'multiple' | 'imaging' | 'symptom' | 'watchlist' | 'supply-chain' | 'qa_testing' | 'marketplace' | 'prescription' | 'search' | 'demand-forecasting' | 'sales-upload') => void;
    userRole: UserRole;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({ onModeSelect, userRole }) => {
    return (
        <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-xl shadow-lg text-center animate-fade-in">
            <h2 className="text-2xl font-bold mb-2 text-slate-800 dark:text-white">Choose Analysis Type</h2>
            <p className="text-slate-600 dark:text-slate-300 mb-6">What would you like to analyze today?</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {(userRole === 'patient' || userRole === 'seller' || userRole === 'distributor' || userRole === 'manufacturer') && (
                    <button
                        onClick={() => onModeSelect('single')}
                        className="p-6 border-2 border-transparent rounded-lg bg-slate-100 dark:bg-slate-700/50 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all"
                    >
                        <Package className="w-10 h-10 mx-auto mb-3 text-blue-500" />
                        <h3 className="font-semibold text-lg">Visual Authenticity & QA</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Analyze micro-textures and pill morphology to detect sophisticated fakes.</p>
                    </button>
                )}
                
                {(userRole === 'seller' || userRole === 'distributor' || userRole === 'manufacturer') && (
                    <button
                        onClick={() => onModeSelect('multiple')}
                        className="p-6 border-2 border-transparent rounded-lg bg-slate-100 dark:bg-slate-700/50 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/30 transition-all"
                    >
                        <Copy className="w-10 h-10 mx-auto mb-3 text-green-500" />
                        <div className="flex items-center justify-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg">Cut-Strip Recovery</h3>
                            <span className="text-[10px] bg-green-500 text-white px-1.5 py-0.5 rounded-full font-bold uppercase tracking-tighter">AI</span>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Identify loose pills and cut strips missing expiry dates via visual AI.</p>
                    </button>
                )}

                {userRole === 'manufacturer' && (
                    <>
                        <button
                            onClick={() => onModeSelect('qa_testing')}
                            className="p-6 border-2 border-transparent rounded-lg bg-slate-100 dark:bg-slate-700/50 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all"
                        >
                            <AlertCircle className="w-10 h-10 mx-auto mb-3 text-indigo-500" />
                            <h3 className="font-semibold text-lg">QA & Compliance</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Test manufactured batches for defects and label compliance.</p>
                        </button>
                        <button
                            onClick={() => onModeSelect('demand-forecasting')}
                            className="p-6 border-2 border-transparent rounded-lg bg-slate-100 dark:bg-slate-700/50 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all"
                        >
                            <BarChart3 className="w-10 h-10 mx-auto mb-3 text-blue-500" />
                            <h3 className="font-semibold text-lg">Demand Insights</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Analyze regional consumption to optimize production.</p>
                        </button>
                    </>
                )}

                {userRole === 'patient' && (
                    <>
                        <button
                            onClick={() => onModeSelect('imaging')}
                            className="p-6 border-2 border-transparent rounded-lg bg-slate-100 dark:bg-slate-700/50 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-all"
                        >
                            <Activity className="w-10 h-10 mx-auto mb-3 text-purple-500" />
                            <h3 className="font-semibold text-lg">Medical Imaging</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Analyze X-rays, MRI, CT scans, or Ultrasounds.</p>
                        </button>
                        <button
                            onClick={() => onModeSelect('symptom')}
                            className="p-6 border-2 border-transparent rounded-lg bg-slate-100 dark:bg-slate-700/50 hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/30 transition-all"
                        >
                            <Stethoscope className="w-10 h-10 mx-auto mb-3 text-orange-500" />
                            <h3 className="font-semibold text-lg">Patient Safety & Info</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Translate complex labels into simple, local-language instructions.</p>
                        </button>
                        <button
                            onClick={() => onModeSelect('prescription')}
                            className="p-6 border-2 border-transparent rounded-lg bg-slate-100 dark:bg-slate-700/50 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all"
                        >
                            <QrCode className="w-10 h-10 mx-auto mb-3 text-blue-500" />
                            <h3 className="font-semibold text-lg">Prescription Scanner</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Scan prescriptions to extract medications and check safety.</p>
                        </button>
                    </>
                )}

                <button
                    onClick={() => onModeSelect('search')}
                    className="p-6 border-2 border-transparent rounded-lg bg-slate-100 dark:bg-slate-700/50 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all"
                >
                    <Search className="w-10 h-10 mx-auto mb-3 text-blue-500" />
                    <h3 className="font-semibold text-lg">Medical Search</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Search for up-to-date medical info and drug recalls.</p>
                </button>

                {userRole === 'seller' && (
                    <>
                        <button
                            onClick={() => onModeSelect('watchlist')}
                            className="p-6 border-2 border-transparent rounded-lg bg-slate-900/50 hover:border-emerald-500 hover:bg-emerald-900/10 transition-all border-dashed border-slate-700"
                        >
                            <CalendarDays className="w-10 h-10 mx-auto mb-3 text-emerald-500" />
                            <div className="flex items-center justify-center gap-2 mb-1">
                                <h3 className="font-semibold text-lg text-white">Loose Inventory</h3>
                                <span className="text-[10px] bg-emerald-500 text-white px-1.5 py-0.5 rounded-full font-bold uppercase tracking-tighter">Edge</span>
                            </div>
                            <p className="text-sm text-slate-400">Digitize and track loose pill inventory to reduce waste and improve safety.</p>
                        </button>
                        <button
                            onClick={() => onModeSelect('sales-upload')}
                            className="p-6 border-2 border-transparent rounded-lg bg-slate-100 dark:bg-slate-700/50 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all"
                        >
                            <Upload className="w-10 h-10 mx-auto mb-3 text-blue-500" />
                            <h3 className="font-semibold text-lg">Log Sales</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Upload daily sales data to sync with the supply chain.</p>
                        </button>
                    </>
                )}

                {(userRole === 'seller' || userRole === 'distributor' || userRole === 'manufacturer') && (
                    <button
                        onClick={() => onModeSelect('supply-chain')}
                        className="p-6 border-2 border-transparent rounded-lg bg-slate-900/50 hover:border-indigo-500 hover:bg-indigo-900/10 transition-all border-dashed border-slate-700"
                    >
                        <LinkIcon className="w-10 h-10 mx-auto mb-3 text-indigo-500" />
                        <div className="flex items-center justify-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg text-white">Edge Network</h3>
                            <span className="text-[10px] bg-indigo-500 text-white px-1.5 py-0.5 rounded-full font-bold uppercase tracking-tighter">Sync</span>
                        </div>
                        <p className="text-sm text-slate-400">Sync local pharmacy visual QA data with the broader supply chain ledger.</p>
                    </button>
                )}

                {(userRole === 'seller' || userRole === 'distributor' || userRole === 'manufacturer') && (
                    <button
                        onClick={() => onModeSelect('marketplace')}
                        className="p-6 border-2 border-transparent rounded-lg bg-slate-900/50 hover:border-yellow-500 hover:bg-yellow-900/10 transition-all border-dashed border-slate-700"
                    >
                        <TrendingUp className="w-10 h-10 mx-auto mb-3 text-yellow-500" />
                        <div className="flex items-center justify-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg text-white">Adverse Reporting</h3>
                            <span className="text-[10px] bg-yellow-500 text-white px-1.5 py-0.5 rounded-full font-bold uppercase tracking-tighter">Alert</span>
                        </div>
                        <p className="text-sm text-slate-400">Report visual anomalies or adverse reactions directly from the pharmacy edge.</p>
                    </button>
                )}
            </div>
        </div>
    );
};
