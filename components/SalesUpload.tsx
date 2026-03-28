import React, { useState } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, Plus, Trash2 } from 'lucide-react';

export const SalesUpload: React.FC = () => {
    const [isUploading, setIsUploading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [sales, setSales] = useState<any[]>([
        { medicineName: '', quantity: 0, region: 'Delhi', category: 'Analgesic' }
    ]);

    const addRow = () => {
        setSales([...sales, { medicineName: '', quantity: 0, region: 'Delhi', category: 'Analgesic' }]);
    };

    const removeRow = (idx: number) => {
        setSales(sales.filter((_, i) => i !== idx));
    };

    const updateRow = (idx: number, field: string, value: any) => {
        const newSales = [...sales];
        newSales[idx][field] = value;
        setSales(newSales);
    };

    const handleSubmit = async () => {
        if (sales.some(s => !s.medicineName || s.quantity <= 0)) {
            alert("Please fill in all fields with valid data.");
            return;
        }

        setIsUploading(true);
        try {
            const res = await fetch('/api/sales', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(sales.map(s => ({
                    ...s,
                    sellerName: 'City Pharma', // Mock seller name
                    sellerId: 'SELL-001',
                    date: new Date().toISOString().split('T')[0]
                })))
            });

            if (res.ok) {
                setSuccess(true);
                setSales([{ medicineName: '', quantity: 0, region: 'Delhi', category: 'Analgesic' }]);
                setTimeout(() => setSuccess(false), 5000);
            }
        } catch (err) {
            console.error("Failed to upload sales", err);
            alert("Failed to upload sales data.");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold dark:text-white flex items-center gap-2">
                        <FileText className="w-6 h-6 text-blue-500" /> Sales Data Upload
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Log your daily sales to help manufacturers predict demand and prevent stockouts.</p>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
                        Upload CSV
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                <div className="grid grid-cols-12 gap-4 px-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <div className="col-span-4">Medicine Name</div>
                    <div className="col-span-2">Quantity</div>
                    <div className="col-span-3">Region</div>
                    <div className="col-span-2">Category</div>
                    <div className="col-span-1"></div>
                </div>

                <div className="space-y-2">
                    {sales.map((sale, idx) => (
                        <div key={idx} className="grid grid-cols-12 gap-4 items-center animate-fade-in">
                            <div className="col-span-4">
                                <input 
                                    type="text" 
                                    value={sale.medicineName}
                                    onChange={(e) => updateRow(idx, 'medicineName', e.target.value)}
                                    placeholder="e.g., Dolo 650"
                                    className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div className="col-span-2">
                                <input 
                                    type="number" 
                                    value={sale.quantity || ''}
                                    onChange={(e) => updateRow(idx, 'quantity', parseInt(e.target.value))}
                                    placeholder="0"
                                    className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div className="col-span-3">
                                <select 
                                    value={sale.region}
                                    onChange={(e) => updateRow(idx, 'region', e.target.value)}
                                    className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="Delhi">Delhi</option>
                                    <option value="Mumbai">Mumbai</option>
                                    <option value="Bangalore">Bangalore</option>
                                    <option value="Hyderabad">Hyderabad</option>
                                    <option value="Chennai">Chennai</option>
                                </select>
                            </div>
                            <div className="col-span-2">
                                <select 
                                    value={sale.category}
                                    onChange={(e) => updateRow(idx, 'category', e.target.value)}
                                    className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="Analgesic">Analgesic</option>
                                    <option value="Antibiotic">Antibiotic</option>
                                    <option value="Supplement">Supplement</option>
                                    <option value="Cardiac">Cardiac</option>
                                    <option value="Diabetic">Diabetic</option>
                                </select>
                            </div>
                            <div className="col-span-1 flex justify-end">
                                <button 
                                    onClick={() => removeRow(idx)}
                                    disabled={sales.length === 1}
                                    className="p-2 text-slate-400 hover:text-rose-500 disabled:opacity-30 transition-colors"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <button 
                    onClick={addRow}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-bold text-sm transition-all"
                >
                    <Plus className="w-4 h-4" /> Add Another Row
                </button>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    {success && (
                        <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm animate-fade-in">
                            <CheckCircle2 className="w-5 h-5" /> Data uploaded successfully!
                        </div>
                    )}
                </div>
                <button 
                    onClick={handleSubmit}
                    disabled={isUploading}
                    className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-bold rounded-xl shadow-lg transition-all flex items-center gap-2"
                >
                    {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                    Submit Sales Data
                </button>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex gap-3 items-start">
                <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed">
                    <strong>Why this matters:</strong> By sharing your sales data, you contribute to a transparent supply chain. Our AI uses this data to alert manufacturers about high-demand regions, ensuring you always have stock when patients need it most.
                </p>
            </div>
        </div>
    );
};
