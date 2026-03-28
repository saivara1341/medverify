import React from 'react';
import { Database, Cpu, Globe, Shield, Code, BarChart3, FileJson, ExternalLink } from 'lucide-react';

export const TechnicalOverview: React.FC = () => {
  const datasets = [
    {
      title: "OpenFDA Public Dataset",
      icon: <Database className="w-6 h-6 text-blue-500" />,
      description: "Real-time integration with the US Food & Drug Administration's open database.",
      details: [
        "Drug Labeling (SPL): 150,000+ active drug labels",
        "Enforcement Reports: 10,000+ recall records",
        "Adverse Events: 10M+ patient safety reports",
        "NDC Directory: National Drug Code cross-referencing"
      ],
      link: "https://open.fda.gov/apis/"
    },
    {
      title: "Gemini Vision Training Set",
      icon: <Cpu className="w-6 h-6 text-purple-500" />,
      description: "Powered by Google's multi-modal foundation models trained on diverse medical imagery.",
      details: [
        "Pharmaceutical Packaging & Blister Packs",
        "Handwritten Prescriptions & Clinical Notes",
        "Medical Imaging (X-Ray, MRI, CT Scans)",
        "Multi-lingual OCR & Semantic Translation"
      ]
    },
    {
      title: "Synthetic Supply Chain Data",
      icon: <BarChart3 className="w-6 h-6 text-emerald-500" />,
      description: "Custom generated dataset for demonstrating Pro-tier analytics and forecasting.",
      details: [
        "10,000+ Simulated Pharmacy Transactions",
        "Geospatial Incident Logs (Heatmap Data)",
        "Inventory Turnover & Expiry Velocity Metrics",
        "Demand Forecasting Time-Series Data"
      ]
    },
    {
      title: "Google Search Grounding",
      icon: <Globe className="w-6 h-6 text-cyan-500" />,
      description: "Dynamic web-scale dataset for real-time medical news and recalls.",
      details: [
        "Real-time News Indexing",
        "Regulatory Agency Bulletins",
        "Global Health Organization Reports",
        "Verified Medical Journal Abstracts"
      ]
    }
  ];

  const incidentSchema = {
    id: "uuid-v4",
    medicineName: "Lisinopril 10mg",
    batchNumber: "LIS-2023-11",
    location: { lat: 28.6139, lng: 77.2090 },
    severity: "critical",
    type: "counterfeit_detected",
    timestamp: "2024-03-10T14:30:00Z",
    reporter: "Pharmacy_ID_882"
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-blue-500/10 rounded-xl">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold dark:text-white">Technical Architecture & Data Sources</h2>
            <p className="text-slate-500 dark:text-slate-400">A comprehensive look at the datasets powering MedEdge AI.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {datasets.map((ds, i) => (
            <div key={i} className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-blue-500/50 transition-all">
              <div className="flex items-center gap-3 mb-4">
                {ds.icon}
                <h3 className="font-bold text-lg dark:text-white">{ds.title}</h3>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{ds.description}</p>
              <ul className="space-y-2">
                {ds.details.map((detail, j) => (
                  <li key={j} className="text-xs flex items-start gap-2 text-slate-500 dark:text-slate-500">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1 shrink-0" />
                    {detail}
                  </li>
                ))}
              </ul>
              {ds.link && (
                <a 
                  href={ds.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
                >
                  View API Documentation <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-slate-900 rounded-2xl p-8 shadow-xl border border-slate-800">
          <div className="flex items-center gap-3 mb-6">
            <FileJson className="w-6 h-6 text-emerald-400" />
            <h3 className="text-xl font-bold text-white">Data Schema: Incident Report</h3>
          </div>
          <p className="text-sm text-slate-400 mb-6">
            This JSON structure represents how MedEdge captures and synchronizes counterfeit or safety incidents across the edge network.
          </p>
          <div className="bg-black/50 p-6 rounded-xl border border-slate-700 font-mono text-sm overflow-x-auto">
            <pre className="text-emerald-400">
              {JSON.stringify(incidentSchema, null, 2)}
            </pre>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-6">
            <Code className="w-6 h-6 text-blue-500" />
            <h3 className="text-xl font-bold dark:text-white">Tech Stack</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
              <span className="text-sm font-medium dark:text-slate-300">Frontend</span>
              <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded">React + Tailwind</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
              <span className="text-sm font-medium dark:text-slate-300">AI Engine</span>
              <span className="text-xs font-bold bg-purple-100 text-purple-700 px-2 py-1 rounded">Gemini 3.1 Pro</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
              <span className="text-sm font-medium dark:text-slate-300">Grounding</span>
              <span className="text-xs font-bold bg-cyan-100 text-cyan-700 px-2 py-1 rounded">Google Search</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
              <span className="text-sm font-medium dark:text-slate-300">Maps API</span>
              <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded">Leaflet + Carto</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
              <span className="text-sm font-medium dark:text-slate-300">Backend</span>
              <span className="text-xs font-bold bg-slate-200 text-slate-700 px-2 py-1 rounded">Express.js</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
