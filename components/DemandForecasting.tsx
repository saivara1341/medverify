import React, { useState, useEffect } from 'react';
import { TrendingUp, MapPin, Package, AlertCircle, ArrowUpRight, ArrowDownRight, BarChart3, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { DemandInsight } from '../types';

export const DemandForecasting: React.FC = () => {
    const [insights, setInsights] = useState<DemandInsight[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchInsights = async () => {
            try {
                const res = await fetch('/api/demand-insights');
                if (res.ok) {
                    const data = await res.json();
                    setInsights(data);
                }
            } catch (err) {
                console.error("Failed to fetch demand insights", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchInsights();
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white">Demand Forecasting & Insights</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Analyze regional consumption patterns to optimize production.</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-black transition-all text-sm font-bold">
                    <Download className="w-4 h-4" /> Export Report
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {insights.map((insight, idx) => (
                    <div key={idx} className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 space-y-4">
                        <div className="flex justify-between items-start">
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                                <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className={`flex items-center gap-1 text-sm font-bold ${insight.growthRate > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {insight.growthRate > 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                                {Math.abs(insight.growthRate)}%
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xl font-bold dark:text-white">{insight.medicineName}</h3>
                            <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                                <MapPin className="w-4 h-4" />
                                <span>Top Region: <strong>{insight.region}</strong></span>
                            </div>
                        </div>

                        <div className="h-32 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={insight.topSellers}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="name" hide />
                                    <YAxis hide />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Bar dataKey="quantity" radius={[4, 4, 0, 0]}>
                                        {insight.topSellers.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index === 0 ? '#3b82f6' : '#94a3b8'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="space-y-2">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Top Consuming Sellers</p>
                            <div className="space-y-1">
                                {insight.topSellers.map((seller, sIdx) => (
                                    <div key={sIdx} className="flex justify-between items-center text-sm">
                                        <span className="text-slate-600 dark:text-slate-300">{seller.name}</span>
                                        <span className="font-bold dark:text-white">{seller.quantity.toLocaleString()} units</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-lg flex gap-2 items-start">
                            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                                <strong>AI Recommendation:</strong> {insight.recommendation}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-slate-900 rounded-2xl p-8 text-white relative overflow-hidden">
                <div className="relative z-10 max-w-2xl">
                    <h3 className="text-2xl font-bold mb-2">Predictive Production Planning</h3>
                    <p className="text-slate-400 mb-6">Our AI models analyze cross-regional data to predict stockouts before they happen. Manufacturers can now sync production cycles with real-time consumption spikes.</p>
                    <div className="flex gap-4">
                        <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10">
                            <p className="text-3xl font-black text-blue-400">14%</p>
                            <p className="text-xs text-slate-400 uppercase font-bold mt-1">Waste Reduction</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10">
                            <p className="text-3xl font-black text-emerald-400">99.8%</p>
                            <p className="text-xs text-slate-400 uppercase font-bold mt-1">Stock Availability</p>
                        </div>
                    </div>
                </div>
                <BarChart3 className="absolute -right-12 -bottom-12 w-64 h-64 text-white/5" />
            </div>
        </div>
    );
};
