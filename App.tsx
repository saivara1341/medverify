import React, { useState, useCallback, useEffect } from 'react';
import { ShieldCheck, Info, Building2, User, Globe, AlertCircle, TrendingUp, Map as MapIcon, CalendarDays, Pill, ArrowLeft, BellRing, Tag, Truck, Factory, Store, Activity, Package, QrCode, Link as LinkIcon, Search, CheckCircle2, ChevronDown, Database } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { ImageUploader } from './components/ImageUploader';
import { CameraView } from './components/CameraView';
import { AnalysisResult } from './components/AnalysisResult';
import { ModeSelector } from './components/ModeSelector';
import { analyzeSingleMedicine, analyzeImage, analyzeMedicalImaging, analyzeSymptoms, analyzePrescription, searchMedicalInfo } from './services/geminiService';
import type { AnalysisOutput, AnalysisJob, WatchlistItem } from './types';

import { QATesting } from './components/QATesting';
import { Marketplace } from './components/Marketplace';
import { SupplyChain } from './components/SupplyChain';
import { DemandForecasting } from './components/DemandForecasting';
import { SalesUpload } from './components/SalesUpload';
import { WhatsAppSimulator } from './components/WhatsAppSimulator';
import { TechnicalOverview } from './components/TechnicalOverview';
import Markdown from 'react-markdown';

const createCustomIcon = (severity: string) => {
  return L.divIcon({
    className: 'bg-transparent border-none',
    html: `<div class="w-4 h-4 rounded-full ${severity === 'critical' ? 'bg-red-500' : 'bg-yellow-500'} animate-pulse shadow-[0_0_10px_rgba(0,0,0,0.5)]"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });
};

type AppMode = 'unselected' | 'single' | 'multiple' | 'imaging' | 'symptom' | 'watchlist' | 'supply-chain' | 'qa_testing' | 'marketplace' | 'prescription' | 'search' | 'demand-forecasting' | 'sales-upload' | 'technical-info';

const App: React.FC = () => {
  const [appMode, setAppMode] = useState<AppMode>('unselected');
  const [showCamera, setShowCamera] = useState(false);
  const [userRole, setUserRole] = useState<import('./types').UserRole>('patient');
  const isProMode = userRole !== 'patient';
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([
    {
      id: crypto.randomUUID(),
      name: "Ibuprofen 400mg",
      batchNumber: "IBU-2023-10",
      expiryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      originalPrice: 15.00,
      currentValue: 3.75,
      status: 'critical',
      revenuePotential: 25,
      leadGenerated: true,
      timestamp: Date.now() - 86400000
    },
    {
      id: crypto.randomUUID(),
      name: "Lisinopril 10mg",
      batchNumber: "LIS-2023-11",
      expiryDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      originalPrice: 25.00,
      currentValue: 12.50,
      status: 'warning',
      revenuePotential: 50,
      leadGenerated: true,
      timestamp: Date.now() - 172800000
    }
  ]);
  const [realIncidents, setRealIncidents] = useState<any[]>([]);
  const [proStats, setProStats] = useState({ totalAlerts: 1284, highRiskBatches: 42, complianceRate: 98.2 });

  // State for 'single' mode
  const [singleAnalysisResult, setSingleAnalysisResult] = useState<AnalysisOutput | null>(null);
  const [singleAnalysisImages, setSingleAnalysisImages] = useState<string[]>([]);
  const [isSingleLoading, setIsSingleLoading] = useState(false);
  const [singleError, setSingleError] = useState<string | null>(null);

  // State for 'multiple' mode
  const [jobs, setJobs] = useState<AnalysisJob[]>([]);
  const [isProcessingJobs, setIsProcessingJobs] = useState(false);

  // State for 'symptom' mode
  const [symptomText, setSymptomText] = useState('');
  const [watchlistFilter, setWatchlistFilter] = useState<'all' | 'critical' | 'warning' | 'expired' | 'healthy'>('all');

  // State for 'search' mode
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // State for 'imaging' mode context
  const [selectedImagingImage, setSelectedImagingImage] = useState<string | null>(null);
  const [imagingContext, setImagingContext] = useState<string>('');

  const [trustScores, setTrustScores] = useState<Record<string, number>>({});

  const resetState = () => {
    setAppMode('unselected');
    setShowCamera(false);
    setSingleAnalysisResult(null);
    setSingleAnalysisImages([]);
    setIsSingleLoading(false);
    setSingleError(null);
    setJobs([]);
    setIsProcessingJobs(false);
    setSymptomText('');
    setWatchlistFilter('all');
    setSearchQuery('');
    setSearchResult(null);
    setIsSearching(false);
    setSelectedImagingImage(null);
    setImagingContext('');
  };

  const handleModeSelect = (mode: AppMode) => {
    setAppMode(mode);
  };

  const handleSaveToWatchlist = (result: AnalysisOutput) => {
    if (!result.product_match || !result.expiry_extracted) return;
    
    const expiryDate = new Date(result.expiry_extracted.date_iso);
    const today = new Date();
    const diffDays = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    let status: WatchlistItem['status'] = 'healthy';
    let revenuePotential = 100;
    
    if (diffDays < 0) {
      status = 'expired';
      revenuePotential = 0;
    } else if (diffDays < 30) {
      status = 'critical';
      revenuePotential = 25;
    } else if (diffDays < 90) {
      status = 'warning';
      revenuePotential = 50;
    }

    const newItem: WatchlistItem = {
      id: crypto.randomUUID(),
      name: result.product_match.name,
      batchNumber: result.batch_number || 'UNKNOWN',
      expiryDate: result.expiry_extracted.date_iso,
      originalPrice: 100, // Mock price
      currentValue: (100 * revenuePotential) / 100,
      status,
      revenuePotential,
      leadGenerated: status === 'critical' || status === 'warning',
      timestamp: Date.now(),
    };

    setWatchlist(prev => [newItem, ...prev]);
    alert("Added to Expiry Watchlist. Lead generation active for this batch.");
  };

  useEffect(() => {
    if (isProMode) {
      const fetchData = async () => {
        try {
          const [incRes, statsRes] = await Promise.all([
            fetch('/api/incidents'),
            fetch('/api/stats')
          ]);
          if (incRes.ok) setRealIncidents(await incRes.json());
          if (statsRes.ok) setProStats(await statsRes.json());
        } catch (err) {
          console.error("Failed to fetch pro data", err);
        }
      };
      fetchData();
      const interval = setInterval(fetchData, 30000); // Refresh every 30s
      return () => clearInterval(interval);
    }
  }, [isProMode]);

  const reportIncident = async (result: AnalysisOutput) => {
    if (result.type !== 'medicine') return;
    
    const isHighRisk = (result.counterfeit_risk_score || 0) > 0.7 || result.diversion_risk?.is_diverted;
    if (!isHighRisk) return;

    try {
      // Get location if possible
      let location = { lat: 20 + Math.random() * 10, lng: 70 + Math.random() * 10 }; // Default to general region
      try {
        const pos = await new Promise<GeolocationPosition>((res, rej) => 
          navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
        );
        location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      } catch (e) {
        console.warn("Location access denied, using approximate region");
      }

      await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: result.diversion_risk?.is_diverted ? 'diversion' : 'counterfeit',
          medicineName: result.product_match?.name || 'Unknown',
          batchNumber: result.batch_number || 'UNKNOWN',
          location,
          details: result.explanation,
          severity: (result.counterfeit_risk_score || 0) > 0.9 ? 'critical' : 'high'
        })
      });
    } catch (err) {
      console.error("Failed to report incident", err);
    }
  };

  const handleImagesSelected = async (imageDataUrls: string[]) => {
    setShowCamera(false);

    if (appMode === 'single') {
        setSingleAnalysisImages(imageDataUrls);
        setIsSingleLoading(true);
        setSingleError(null);
        try {
            const result = await analyzeSingleMedicine(imageDataUrls);
            setSingleAnalysisResult(result);
            if (isProMode) reportIncident(result);
        } catch (err) {
            setSingleError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsSingleLoading(false);
        }
    } else if (appMode === 'imaging') {
        setSelectedImagingImage(imageDataUrls[0]);
    } else if (appMode === 'prescription') {
        setSingleAnalysisImages(imageDataUrls);
        setIsSingleLoading(true);
        setSingleError(null);
        try {
            const result = await analyzePrescription(imageDataUrls[0]);
            setSingleAnalysisResult(result);
        } catch (err) {
            setSingleError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsSingleLoading(false);
        }
    } else if (appMode === 'multiple') {
        const newJobs: AnalysisJob[] = imageDataUrls.map((dataUrl) => ({
          id: crypto.randomUUID(),
          image: dataUrl,
          status: 'pending',
        }));
        setJobs(prevJobs => [...prevJobs, ...newJobs]);
        setIsProcessingJobs(true);
    } else if (appMode === 'symptom') {
        setSingleAnalysisImages(imageDataUrls);
        setIsSingleLoading(true);
        setSingleError(null);
        try {
            const result = await analyzeSymptoms(symptomText, imageDataUrls[0]);
            setSingleAnalysisResult(result);
        } catch (err) {
            setSingleError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsSingleLoading(false);
        }
    }
  };

  const processJobsQueue = useCallback(async () => {
    const jobToProcess = jobs.find(j => j.status === 'pending');
    if (!jobToProcess || !isProcessingJobs) {
      if (!jobs.some(j => j.status === 'pending' || j.status === 'analyzing')) {
        setIsProcessingJobs(false);
      }
      return;
    }

    setJobs(prev => prev.map(j => j.id === jobToProcess.id ? { ...j, status: 'analyzing' } : j));

    try {
      const result = await analyzeImage(jobToProcess.image);
      setJobs(prev => prev.map(j => j.id === jobToProcess.id ? { ...j, status: 'completed', result } : j));
      if (isProMode) reportIncident(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setJobs(prev => prev.map(j => j.id === jobToProcess.id ? { ...j, status: 'failed', error: errorMessage } : j));
    }
  }, [jobs, isProcessingJobs, isProMode]);
  
  useEffect(() => {
    if (appMode === 'multiple' && isProcessingJobs) {
      processJobsQueue();
    }
  }, [jobs, appMode, isProcessingJobs, processJobsQueue]);

  const handleSearchSubmit = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSingleError(null);
    try {
        const result = await searchMedicalInfo(searchQuery);
        setSearchResult(result);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setSingleError(errorMessage);
    } finally {
        setIsSearching(false);
    }
  };

  const renderContent = () => {
    if (showCamera) {
      return <CameraView onCapture={(img) => handleImagesSelected([img])} onExit={() => setShowCamera(false)} />;
    }

    if (appMode === 'search') {
        return (
            <div className="space-y-6 animate-fade-in">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg space-y-4">
                    <h2 className="text-xl font-bold dark:text-white flex items-center gap-2">
                        <Search className="w-6 h-6 text-blue-500" /> Medical Information Search
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Search for up-to-date medical information, drug recalls, or general health queries. Powered by Google Search Grounding.
                    </p>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearchSubmit()}
                            placeholder="e.g., Latest FDA recalls for blood pressure medication..."
                            className="flex-1 p-4 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                        <button
                            onClick={handleSearchSubmit}
                            disabled={isSearching || !searchQuery.trim()}
                            className="px-6 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-bold rounded-lg shadow-lg transition-all flex items-center gap-2"
                        >
                            {isSearching ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Search className="w-5 h-5" />}
                            Search
                        </button>
                    </div>
                    {singleError && (
                        <div className="p-4 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg">
                            {singleError}
                        </div>
                    )}
                </div>
                {searchResult && (
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg animate-fade-in">
                        <h3 className="text-lg font-bold dark:text-white mb-4">Search Results</h3>
                        <div className="prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-300">
                            <Markdown>{searchResult}</Markdown>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    if (appMode === 'demand-forecasting') {
        return <DemandForecasting />;
    }

    if (appMode === 'sales-upload') {
        return <SalesUpload />;
    }

    if (appMode === 'technical-info') {
        return <TechnicalOverview />;
    }

    if (appMode === 'unselected') {
      if (isProMode) {
        return (
          <div className="space-y-6 animate-fade-in">
            {/* Pro Dashboard Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Globe className="w-5 h-5 text-blue-400" />
                  </div>
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                    {userRole === 'seller' ? 'Local Alerts' : userRole === 'distributor' ? 'Transit Alerts' : 'Global Alerts'}
                  </span>
                </div>
                <p className="text-2xl font-black text-white">{userRole === 'seller' ? '12' : userRole === 'distributor' ? '84' : proStats.totalAlerts.toLocaleString()}</p>
                <p className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3" /> +12% from last week
                </p>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-red-500/20 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                  </div>
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">High Risk Batches</span>
                </div>
                <p className="text-2xl font-black text-white">{userRole === 'seller' ? '2' : userRole === 'distributor' ? '14' : proStats.highRiskBatches}</p>
                <p className="text-[10px] text-red-400 flex items-center gap-1 mt-1">
                  Active recalls in your network
                </p>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-emerald-500/20 rounded-lg">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  </div>
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                    {userRole === 'seller' ? 'Verified Stock' : userRole === 'distributor' ? 'Delivery Success' : 'Verified Shops'}
                  </span>
                </div>
                <p className="text-2xl font-black text-white">{proStats.complianceRate}%</p>
                <p className="text-[10px] text-slate-500 mt-1">Compliance rate across network</p>
              </div>
            </div>

            {/* Simulated Heatmap */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <MapIcon className="w-5 h-5 text-blue-400" /> Edge Network Surveillance
                  </h3>
                  <p className="text-xs text-slate-500">Real-time visual QA reporting from connected pharmacies</p>
                </div>
                <div className="flex gap-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Critical</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-yellow-500" />
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Warning</span>
                  </div>
                </div>
              </div>
              
              <div className="h-96 bg-slate-800 rounded-xl relative overflow-hidden border border-slate-700 z-0">
                <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: '100%', width: '100%' }} className="z-0">
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                  />
                  {realIncidents.map((inc) => (
                    <Marker 
                      key={inc.id} 
                      position={[inc.location.lat, inc.location.lng]}
                      icon={createCustomIcon(inc.severity)}
                    >
                      <Popup className="text-slate-800">
                        <div className="font-bold">{inc.medicineName}</div>
                        <div className="text-xs">Batch: {inc.batchNumber}</div>
                        <div className={`text-xs font-bold ${inc.severity === 'critical' ? 'text-red-500' : 'text-yellow-500'}`}>
                          {inc.type.toUpperCase()}
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
                <div className="absolute bottom-4 left-4 z-[1000] bg-black/80 p-2 rounded text-center pointer-events-none">
                  <p className="text-slate-400 text-sm font-medium">Live Surveillance Active</p>
                  <p className="text-[10px] text-slate-600">{realIncidents.length} Connected Nodes Reporting</p>
                </div>
              </div>

              {/* Real Incidents Feed */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800">
                  <h4 className="text-[10px] uppercase font-bold text-slate-500 mb-2">Recent Cut-Strip Recoveries</h4>
                  <div className="space-y-2">
                    {realIncidents.filter(i => i.type === 'diversion').slice(0, 3).map(inc => (
                      <div key={inc.id} className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-300">Batch #{inc.batchNumber} ({inc.medicineName})</span>
                        <span className="text-emerald-400 font-bold">Identified</span>
                      </div>
                    ))}
                    {realIncidents.filter(i => i.type === 'diversion').length === 0 && (
                      <p className="text-[10px] text-slate-600 italic">No recent recoveries reported</p>
                    )}
                  </div>
                </div>
                <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800">
                  <h4 className="text-[10px] uppercase font-bold text-slate-500 mb-2">Visual QA Anomalies</h4>
                  <div className="space-y-2">
                    {realIncidents.filter(i => i.type === 'counterfeit').slice(0, 3).map(inc => (
                      <div key={inc.id} className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-300">{inc.medicineName} (Batch #{inc.batchNumber})</span>
                        <span className="text-orange-400 font-bold">Flagged</span>
                      </div>
                    ))}
                    {realIncidents.filter(i => i.type === 'counterfeit').length === 0 && (
                      <p className="text-[10px] text-slate-600 italic">No recent anomalies reported</p>
                    )}
                  </div>
                </div>
                <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800">
                  <h4 className="text-[10px] uppercase font-bold text-slate-500 mb-2">Loose Inventory Alerts</h4>
                  <div className="space-y-2">
                    {watchlist.filter(i => i.status === 'warning' || i.status === 'critical').slice(0, 3).map(inc => (
                      <div key={inc.id} className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-300">{inc.name} (Batch #{inc.batchNumber})</span>
                        <span className="text-yellow-400 font-bold">Expiring Soon</span>
                      </div>
                    ))}
                    {watchlist.filter(i => i.status === 'warning' || i.status === 'critical').length === 0 && (
                      <p className="text-[10px] text-slate-600 italic">No items near expiry in watchlist</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <ModeSelector onModeSelect={handleModeSelect} userRole={userRole} />
          </div>
        );
      }
      return <ModeSelector onModeSelect={handleModeSelect} userRole={userRole} />;
    }

    if (appMode === 'single') {
        if (isSingleLoading) {
            return (
                <div className="text-center p-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                    <h3 className="mt-4 text-xl font-semibold">Analyzing your medicine...</h3>
                    <p className="text-slate-500">The AI is reviewing all images provided.</p>
                </div>
            );
        }
        if (singleAnalysisResult) {
            return (
                <AnalysisResult 
                    result={singleAnalysisResult} 
                    image={singleAnalysisImages[0]} 
                    userRole={userRole}
                    onSaveToWatchlist={handleSaveToWatchlist}
                />
            );
        }
        if (singleError) {
            return (
                <div className="text-center p-8 bg-red-100 dark:bg-red-900/30 rounded-lg">
                    <h3 className="text-xl font-semibold text-red-600 dark:text-red-300">Analysis Failed</h3>
                    <p className="text-red-500 dark:text-red-400 mt-2">{singleError}</p>
                </div>
            );
        }
        return (
            <ImageUploader 
                onImageSelect={handleImagesSelected} 
                onUseCamera={() => setShowCamera(true)}
                title="Analyze a Single Medicine"
                description="Upload multiple photos (front, back, tablets) of the same medicine for a comprehensive analysis."
            />
        );
    }

    if (appMode === 'imaging') {
        if (isSingleLoading) {
            return (
                <div className="text-center p-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
                    <h3 className="mt-4 text-xl font-semibold">Analyzing Medical Scan...</h3>
                    <p className="text-slate-500">The AI is reviewing your medical image.</p>
                </div>
            );
        }
        if (singleAnalysisResult) {
            return <AnalysisResult result={singleAnalysisResult} image={singleAnalysisImages[0]} />;
        }
        if (singleError) {
            return (
                <div className="text-center p-8 bg-red-100 dark:bg-red-900/30 rounded-lg">
                    <h3 className="text-xl font-semibold text-red-600 dark:text-red-300">Analysis Failed</h3>
                    <p className="text-red-500 dark:text-red-400 mt-2">{singleError}</p>
                </div>
            );
        }
        if (selectedImagingImage) {
            return (
                <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-6 border border-slate-200 dark:border-slate-800">
                    <h3 className="text-xl font-bold mb-2">Provide Clinical Context</h3>
                    <p className="text-sm text-slate-500 mb-6">
                        To provide a more accurate analysis, please tell us why you got this scan, what symptoms you are experiencing, and any relevant medical history.
                    </p>
                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="w-full md:w-1/3">
                            <img src={selectedImagingImage} alt="Selected scan" className="w-full h-auto object-contain rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
                        </div>
                        <div className="w-full md:w-2/3 flex flex-col">
                            <textarea
                                className="w-full flex-grow p-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all resize-none min-h-[150px]"
                                placeholder="E.g., I have been experiencing lower back pain for 3 weeks, radiating down my left leg. My doctor suggested an MRI to check for a herniated disc."
                                value={imagingContext}
                                onChange={(e) => setImagingContext(e.target.value)}
                            />
                            <div className="flex justify-end gap-3 mt-4">
                                <button 
                                    onClick={() => {
                                        setSelectedImagingImage(null);
                                        setImagingContext('');
                                    }}
                                    className="px-4 py-2 rounded-xl font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={async () => {
                                        setSingleAnalysisImages([selectedImagingImage]);
                                        setIsSingleLoading(true);
                                        setSingleError(null);
                                        try {
                                            const result = await analyzeMedicalImaging(selectedImagingImage, imagingContext);
                                            setSingleAnalysisResult(result);
                                        } catch (err) {
                                            setSingleError(err instanceof Error ? err.message : 'An unknown error occurred.');
                                        } finally {
                                            setIsSingleLoading(false);
                                            setSelectedImagingImage(null);
                                            setImagingContext('');
                                        }
                                    }}
                                    className="px-4 py-2 rounded-xl font-medium bg-purple-600 hover:bg-purple-700 text-white transition-colors"
                                >
                                    Analyze Scan
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }
        return (
            <ImageUploader 
                onImageSelect={handleImagesSelected} 
                onUseCamera={() => setShowCamera(true)}
                title="Analyze Medical Imaging"
                description="Upload an X-ray, MRI, CT scan, or Ultrasound for AI-assisted analysis."
            />
        );
    }

    if (appMode === 'prescription') {
        if (isSingleLoading) {
            return (
                <div className="text-center p-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                    <h3 className="mt-4 text-xl font-semibold">Scanning Prescription...</h3>
                    <p className="text-slate-500">The AI is extracting medications and checking safety.</p>
                </div>
            );
        }
        if (singleAnalysisResult) {
            return <AnalysisResult result={singleAnalysisResult} image={singleAnalysisImages[0]} />;
        }
        if (singleError) {
            return (
                <div className="text-center p-8 bg-red-100 dark:bg-red-900/30 rounded-lg">
                    <h3 className="text-xl font-semibold text-red-600 dark:text-red-300">Analysis Failed</h3>
                    <p className="text-red-500 dark:text-red-400 mt-2">{singleError}</p>
                </div>
            );
        }
        return (
            <ImageUploader 
                onImageSelect={handleImagesSelected} 
                onUseCamera={() => setShowCamera(true)}
                title="Scan Prescription"
                description="Upload a photo of a prescription to extract medications and check safety."
            />
        );
    }


    if (appMode === 'symptom') {
        if (isSingleLoading) {
            return (
                <div className="text-center p-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
                    <h3 className="mt-4 text-xl font-semibold">Analyzing Symptoms...</h3>
                    <p className="text-slate-500">The AI is performing triage based on your input.</p>
                </div>
            );
        }
        if (singleAnalysisResult) {
            return <AnalysisResult result={singleAnalysisResult} image={singleAnalysisImages[0] || ''} />;
        }
        if (singleError) {
            return (
                <div className="text-center p-8 bg-red-100 dark:bg-red-900/30 rounded-lg">
                    <h3 className="text-xl font-semibold text-red-600 dark:text-red-300">Analysis Failed</h3>
                    <p className="text-red-500 dark:text-red-400 mt-2">{singleError}</p>
                </div>
            );
        }
        return (
            <div className="space-y-6 animate-fade-in">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg space-y-4">
                    <h2 className="text-xl font-bold dark:text-white">Describe Your Symptoms</h2>
                    <textarea
                        value={symptomText}
                        onChange={(e) => setSymptomText(e.target.value)}
                        placeholder="e.g., I have a persistent dry cough and mild fever for 2 days..."
                        className="w-full h-32 p-4 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                    />
                    <p className="text-sm text-slate-500 italic">Optional: Upload a photo of visible symptoms (like a rash or swelling) below.</p>
                </div>
                
                <ImageUploader 
                    onImageSelect={handleImagesSelected} 
                    onUseCamera={() => setShowCamera(true)}
                    title="Symptom Photo (Optional)"
                    description="Upload a photo to help the AI analyze visible symptoms."
                />

                {symptomText.length > 10 && (
                    <button
                        onClick={() => handleImagesSelected([])}
                        className="w-full py-4 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-lg transition-all"
                    >
                        Analyze Symptoms Now
                    </button>
                )}
            </div>
        );
    }
    
    if (appMode === 'watchlist') {
      const filteredWatchlist = watchlistFilter === 'all' ? watchlist : watchlist.filter(item => item.status === watchlistFilter);
      
      const totalPotentialRevenue = watchlist.reduce((acc, item) => acc + (item.currentValue || 0), 0);
      const activeLeadsCount = watchlist.filter(i => i.leadGenerated).length;

      return (
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-slate-800 dark:text-white">Expiry Watchlist & Lead Gen</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Manage expiring inventory and generate sales leads.</p>
            </div>
            <div className="flex gap-3">
              <div className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-4 py-2 rounded-xl text-sm font-bold border border-emerald-200 dark:border-emerald-500/30 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                ${totalPotentialRevenue.toFixed(2)} Potential
              </div>
              <div className="bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 px-4 py-2 rounded-xl text-sm font-bold border border-blue-200 dark:border-blue-500/30 flex items-center gap-2">
                <BellRing className="w-4 h-4" />
                {activeLeadsCount} Active Leads
              </div>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {['all', 'critical', 'warning', 'healthy', 'expired'].map(filter => (
              <button
                key={filter}
                onClick={() => setWatchlistFilter(filter as any)}
                className={`px-4 py-2 rounded-full text-xs font-bold capitalize whitespace-nowrap transition-colors ${
                  watchlistFilter === filter 
                    ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900' 
                    : 'bg-slate-200 text-slate-600 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
                }`}
              >
                {filter} ({filter === 'all' ? watchlist.length : watchlist.filter(i => i.status === filter).length})
              </button>
            ))}
          </div>

          {filteredWatchlist.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-12 rounded-2xl text-center shadow-sm">
              <CalendarDays className="w-16 h-16 text-slate-400 dark:text-slate-700 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-700 dark:text-slate-400">No items found</h3>
              <p className="text-sm text-slate-500 dark:text-slate-600 mt-2">
                {watchlist.length === 0 
                  ? "Scan medicines and save them here to track expiry and generate sales leads."
                  : `No medicines match the "${watchlistFilter}" filter.`}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredWatchlist.map(item => (
                <div key={item.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:border-blue-300 dark:hover:border-slate-600 transition-all shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${
                      item.status === 'expired' ? 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-500' :
                      item.status === 'critical' ? 'bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-500' :
                      item.status === 'warning' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-500' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-500'
                    }`}>
                      <Pill className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-white text-lg">{item.name}</h4>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded uppercase tracking-wider font-semibold">Batch: {item.batchNumber}</span>
                        <span className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded uppercase tracking-wider font-semibold">Exp: {item.expiryDate}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between md:justify-end gap-6 md:gap-8 border-t md:border-t-0 border-slate-100 dark:border-slate-800 pt-4 md:pt-0">
                    <div className="text-left md:text-right">
                      <div className="flex flex-col mb-1">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Est. Value</span>
                        <span className="text-sm font-black text-slate-700 dark:text-slate-300">
                          ${item.currentValue?.toFixed(2) || '0.00'}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center gap-2 justify-end mb-1">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Revenue Potential</span>
                        <span className={`text-sm font-black ${
                          item.revenuePotential === 100 ? 'text-emerald-500 dark:text-emerald-400' :
                          item.revenuePotential >= 50 ? 'text-yellow-600 dark:text-yellow-400' :
                          item.revenuePotential > 0 ? 'text-orange-500 dark:text-orange-400' : 'text-red-500 dark:text-red-400'
                        }`}>
                          {item.revenuePotential}%
                        </span>
                      </div>
                      {item.leadGenerated ? (
                        <div className="bg-blue-100 text-blue-700 dark:bg-blue-600 dark:text-white text-[10px] font-black px-2 py-0.5 rounded inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-white animate-pulse"></span>
                          LEAD GENERATED
                        </div>
                      ) : (
                        <div className="bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded inline-block">
                          MONITORING
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                        <button className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-colors" title="Contact Buyers">
                            <User className="w-4 h-4" />
                        </button>
                        {item.status === 'warning' || item.status === 'critical' ? (
                            <button className="p-2 bg-orange-100 hover:bg-orange-200 dark:bg-orange-900/30 dark:hover:bg-orange-900/50 text-orange-600 dark:text-orange-400 rounded-lg transition-colors" title="Offer Discount">
                                <Tag className="w-4 h-4" />
                            </button>
                        ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (appMode === 'supply-chain') {
      return <SupplyChain userRole={userRole} trustScores={trustScores} />;
    }

    if (appMode === 'qa_testing') {
        return <QATesting />;
    }

    if (appMode === 'marketplace') {
        return <Marketplace userRole={userRole} />;
    }

    if (appMode === 'multiple') {
        if (jobs.length > 0) {
            return (
              <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg text-center">
                <h3 className="text-xl font-bold mb-4">Batch Analysis in Progress</h3>
                <p className="text-slate-500">Multiple medicine analysis is currently being processed. Please check back shortly.</p>
              </div>
            );
        }
        return (
            <ImageUploader 
                onImageSelect={handleImagesSelected} 
                onUseCamera={() => setShowCamera(true)}
                title="Analyze Multiple Medicines"
                description="Upload one photo for each different medicine you want to check."
            />
        );
    }
    return null;
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isProMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200'} font-sans`}>
      <header className={`sticky top-0 z-50 backdrop-blur-md border-b transition-all duration-300 ${
        isProMode ? 'bg-slate-900/80 border-slate-700 text-white' : 'bg-white/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'
      }`}>
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={resetState}>
            <div className={`p-2 rounded-lg ${isProMode ? 'bg-blue-600' : 'bg-blue-500'}`}>
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">MedEdge <span className="text-blue-500">{isProMode ? 'Pro' : 'AI'}</span></h1>
              <p className="text-[10px] uppercase tracking-widest opacity-60 font-bold">
                {userRole === 'patient' ? 'Last-Mile Health Guard' : 
                 userRole === 'seller' ? 'Pharmacy Edge Suite' : 
                 userRole === 'distributor' ? 'Logistics & Distribution' : 
                 'Manufacturer Dashboard'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative flex items-center">
              <div className={`absolute left-2.5 pointer-events-none ${isProMode ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                {userRole === 'patient' ? <User className="w-3.5 h-3.5" /> : 
                 userRole === 'seller' ? <Store className="w-3.5 h-3.5" /> : 
                 userRole === 'distributor' ? <Truck className="w-3.5 h-3.5" /> : 
                 <Factory className="w-3.5 h-3.5" />}
              </div>
              <select
                value={userRole}
                onChange={(e) => {
                  setUserRole(e.target.value as import('./types').UserRole);
                  resetState();
                }}
                className={`appearance-none pl-8 pr-8 py-1.5 rounded-full text-xs font-bold transition-all outline-none cursor-pointer ${
                  isProMode 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 border border-blue-500' 
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600'
                }`}
              >
                <option value="patient">Patient / Consumer</option>
                <option value="seller">Pharmacy / Hospital</option>
                <option value="distributor">Distributor / Logistics</option>
                <option value="manufacturer">Manufacturer</option>
              </select>
              <div className={`absolute right-2.5 pointer-events-none ${isProMode ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                <ChevronDown className="w-3.5 h-3.5" />
              </div>
            </div>
            {appMode !== 'unselected' && (
               <button onClick={resetState} className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-full shadow-md hover:bg-blue-700 transition-colors">
                  Start Over
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          {appMode !== 'unselected' && !showCamera && (
            <button 
              onClick={resetState} 
              className="mb-6 flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors font-semibold"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Main Menu
            </button>
          )}
          {renderContent()}

          {appMode === 'unselected' && (
             <footer className="mt-8 text-center text-xs text-slate-500 dark:text-slate-400 p-4 bg-slate-200 dark:bg-slate-800/50 rounded-lg">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Info className="w-4 h-4" />
                  <strong>Why MedEdge?</strong>
                </div>
                <p className="mt-1">
                  Traditional supply chains track boxes via barcodes. We track the pill. MedEdge uses Visual AI to bridge the gap between the barcode and the patient, identifying loose pills, cut strips, and visual defects that standard scans miss.
                </p>
                <p className="mt-2 opacity-75 text-[10px]">
                  Disclaimer: This tool provides an informational analysis and does not replace professional medical or pharmaceutical advice. Always consult a licensed pharmacist or healthcare provider for any concerns about your medication.
                </p>
                <button 
                  onClick={() => setAppMode('technical-info')}
                  className="mt-4 inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-bold text-[10px] uppercase tracking-widest"
                >
                  <Database className="w-3 h-3" /> Technical Architecture & Datasets
                </button>
              </footer>
          )}
        </div>
      </main>
      <WhatsAppSimulator />
    </div>
  );
};

export default App;
