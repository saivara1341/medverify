import React, { useState } from 'react';
import { Tag, TrendingDown, Search, Filter, MapPin, Package, Clock, ArrowRight, Phone, ShieldCheck } from 'lucide-react';
import type { UserRole } from '../types';

interface MarketplaceProps {
    userRole: UserRole;
}

const mockListings = [
    { id: 1, name: 'Amoxicillin 500mg', batch: 'AMX-2023-99', quantity: 5000, expiry: '2024-05-15', originalPrice: 12000, discountPrice: 4800, discountPercent: 60, seller: 'City Pharma Dist.', location: 'New York, NY', verified: true },
    { id: 2, name: 'Lisinopril 10mg', batch: 'LIS-882-A', quantity: 1200, expiry: '2024-06-01', originalPrice: 3600, discountPrice: 1800, discountPercent: 50, seller: 'HealthCorp Logistics', location: 'Chicago, IL', verified: true },
    { id: 3, name: 'Metformin 1000mg', batch: 'MET-001-X', quantity: 8500, expiry: '2024-04-20', originalPrice: 25500, discountPrice: 5100, discountPercent: 80, seller: 'Global Meds Inc.', location: 'Miami, FL', verified: false },
];

const mockRequests = [
    { id: 101, name: 'Paracetamol 500mg', quantity: 10000, maxPrice: 0.05, urgency: 'High', buyer: 'Downtown Clinic', location: 'New York, NY' },
    { id: 102, name: 'Ibuprofen 400mg', quantity: 5000, maxPrice: 0.08, urgency: 'Medium', buyer: 'CarePlus Pharmacy', location: 'Boston, MA' },
];

export const Marketplace: React.FC<MarketplaceProps> = ({ userRole }) => {
    const [activeTab, setActiveTab] = useState<'buy' | 'sell' | 'requests'>('buy');

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <Tag className="w-6 h-6 text-indigo-500" /> B2B Liquidation Marketplace
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">
                            Buy and sell near-expiry medicines at discounted rates to reduce waste and recover revenue.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 p-1 rounded-lg">
                        <button 
                            onClick={() => setActiveTab('buy')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'buy' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800/50'}`}
                        >
                            Buy Stock
                        </button>
                        <button 
                            onClick={() => setActiveTab('requests')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'requests' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800/50'}`}
                        >
                            Buyer Requests
                        </button>
                        <button 
                            onClick={() => setActiveTab('sell')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'sell' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800/50'}`}
                        >
                            List Product
                        </button>
                    </div>
                </div>

                {activeTab === 'buy' && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="relative flex-1">
                                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input 
                                    type="text" 
                                    placeholder="Search medicines, batches, or sellers..." 
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-white"
                                />
                            </div>
                            <button className="p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                                <Filter className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {mockListings.map(listing => (
                                <div key={listing.id} className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden hover:shadow-md transition-shadow bg-white dark:bg-slate-800 flex flex-col">
                                    <div className="p-5 flex-1 space-y-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-bold text-lg text-slate-800 dark:text-white">{listing.name}</h3>
                                                <p className="text-xs text-slate-500 font-mono mt-1">Batch: {listing.batch}</p>
                                            </div>
                                            <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                                                <TrendingDown className="w-3 h-3" /> {listing.discountPercent}% OFF
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                                            <div className="flex items-center gap-2">
                                                <Package className="w-4 h-4 text-slate-400" />
                                                <span>Qty: <strong>{listing.quantity.toLocaleString()}</strong> units</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-orange-400" />
                                                <span>Expires: <strong className="text-orange-600 dark:text-orange-400">{listing.expiry}</strong></span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-slate-400" />
                                                <span>{listing.location}</span>
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex items-end justify-between">
                                            <div>
                                                <p className="text-xs text-slate-500 line-through">${listing.originalPrice.toLocaleString()}</p>
                                                <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">${listing.discountPrice.toLocaleString()}</p>
                                            </div>
                                            <div className="flex items-center gap-1 text-xs text-slate-500">
                                                {listing.verified && <ShieldCheck className="w-4 h-4 text-emerald-500" />}
                                                {listing.seller}
                                            </div>
                                        </div>
                                    </div>
                                    <button className="w-full py-3 bg-slate-50 dark:bg-slate-900/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-semibold border-t border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-center gap-2">
                                        Contact Seller <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'requests' && (
                    <div className="space-y-4">
                        <p className="text-slate-600 dark:text-slate-300 mb-6">These buyers are actively looking for discounted stock. If you have these items near expiry, you can fulfill their requests immediately.</p>
                        
                        {mockRequests.map(req => (
                            <div key={req.id} className="flex flex-col md:flex-row md:items-center justify-between p-5 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <h3 className="font-bold text-lg text-slate-800 dark:text-white">{req.name}</h3>
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${req.urgency === 'High' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                                            {req.urgency} Urgency
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                        Needs <strong>{req.quantity.toLocaleString()}</strong> units • Max price: <strong>${req.maxPrice}/unit</strong>
                                    </p>
                                    <div className="flex items-center gap-4 text-xs text-slate-500 mt-2">
                                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {req.location}</span>
                                        <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-emerald-500" /> {req.buyer}</span>
                                    </div>
                                </div>
                                <button className="shrink-0 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2">
                                    <Phone className="w-4 h-4" /> Contact Buyer
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'sell' && (
                    <div className="max-w-2xl mx-auto py-8">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Package className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white">List Near-Expiry Stock</h3>
                            <p className="text-slate-500 dark:text-slate-400 mt-2">Turn potential waste into revenue by offering discounts to other network members.</p>
                        </div>

                        <form className="space-y-5">
                            <div className="grid grid-cols-2 gap-5">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Medicine Name</label>
                                    <input type="text" className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" placeholder="e.g. Amoxicillin 500mg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Batch Number</label>
                                    <input type="text" className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Expiry Date</label>
                                    <input type="date" className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Quantity Available</label>
                                    <input type="number" className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Discounted Price (Total)</label>
                                    <input type="number" className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" placeholder="$" />
                                </div>
                            </div>
                            <button type="button" className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors mt-6">
                                Publish Listing
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};
