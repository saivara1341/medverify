import React, { useState, useRef } from 'react';
import { Camera, Upload, AlertCircle, CheckCircle, ShieldAlert, FileText, Loader2, RefreshCw } from 'lucide-react';
import { analyzeQA } from '../services/geminiService';
import type { AnalysisOutput } from '../types';
import { AnalysisResult } from './AnalysisResult';

export const QATesting: React.FC = () => {
    const [image, setImage] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<AnalysisOutput | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            setImage(reader.result as string);
            setResult(null);
            setError(null);
        };
        reader.readAsDataURL(file);
    };

    const runAnalysis = async () => {
        if (!image) return;
        setIsAnalyzing(true);
        setError(null);
        try {
            const res = await analyzeQA(image);
            setResult(res);
        } catch (err: any) {
            setError(err.message || 'Failed to analyze QA image.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const reset = () => {
        setImage(null);
        setResult(null);
        setError(null);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
                        <ShieldAlert className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">QA & Compliance Testing</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Upload images of manufactured batches to check for visual defects, packaging integrity, and label compliance.</p>
                    </div>
                </div>

                {!image ? (
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-12 text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept="image/*" 
                            onChange={handleFileUpload} 
                        />
                        <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">Upload Sample Image</h3>
                        <p className="text-slate-500 text-sm">Click to browse or drag and drop an image of the pill, vial, or packaging.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="relative rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 aspect-video flex items-center justify-center">
                            <img src={image} alt="QA Sample" className="max-h-full max-w-full object-contain" />
                            <button 
                                onClick={reset}
                                className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-sm transition-colors"
                            >
                                <RefreshCw className="w-5 h-5" />
                            </button>
                        </div>

                        {!result && !isAnalyzing && (
                            <button 
                                onClick={runAnalysis}
                                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
                            >
                                <ShieldAlert className="w-5 h-5" /> Run QA Analysis
                            </button>
                        )}

                        {isAnalyzing && (
                            <div className="py-12 flex flex-col items-center justify-center space-y-4">
                                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                                <p className="text-slate-600 dark:text-slate-300 font-medium">Analyzing sample for defects and compliance...</p>
                            </div>
                        )}

                        {error && (
                            <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                <p>{error}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {result && (
                <AnalysisResult result={result} image={image!} userRole="manufacturer" />
            )}
        </div>
    );
};
