import React, { useState } from 'react';
import type { AnalysisOutput } from '../types';
import { Shield, ShieldAlert, ShieldCheck, Pill, CalendarDays, FlaskConical, Stethoscope, AlertTriangle, FileText, Activity, AlertCircle, MapPin, Info, Globe, BellRing, Tag, CheckCircle2, ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { findNearbyFacilities } from '../services/geminiService';

interface AnalysisResultProps {
  result: AnalysisOutput;
  image: string;
  userRole?: import('../types').UserRole;
  onSaveToWatchlist?: (item: any) => void;
}

const getStatusStyles = (status: AnalysisOutput['expiry_status']) => {
  if (!status) return { icon: null, text: '', bg: '' };
  switch (status) {
    case 'expired': return { icon: <AlertTriangle className="text-red-500" />, text: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/30' };
    case 'near_expiry': return { icon: <AlertTriangle className="text-yellow-500" />, text: 'text-yellow-500', bg: 'bg-yellow-100 dark:bg-yellow-900/30' };
    case 'valid': return { icon: <ShieldCheck className="text-green-500" />, text: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/30' };
    default: return { icon: <AlertTriangle className="text-slate-500" />, text: 'text-slate-500', bg: 'bg-slate-200 dark:bg-slate-700' };
  }
};

const RiskScoreIndicator: React.FC<{ score: number }> = ({ score }) => {
    const percentage = score * 100;
    const color = percentage > 75 ? 'bg-red-500' : percentage > 40 ? 'bg-yellow-500' : 'bg-green-500';
    const Icon = percentage > 75 ? ShieldAlert : percentage > 40 ? Shield : ShieldCheck;
    const text = percentage > 75 ? 'High Risk' : percentage > 40 ? 'Moderate Risk' : 'Low Risk';

    return (
        <div className="text-center p-4 rounded-lg bg-slate-100 dark:bg-slate-700">
            <Icon className={`w-12 h-12 mx-auto mb-2 ${color.replace('bg-', 'text-')}`} />
            <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-4">
                <div className={`${color} h-4 rounded-full`} style={{ width: `${percentage}%` }}></div>
            </div>
            <p className="mt-2 text-lg font-bold">{text}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Score: {percentage.toFixed(0)} / 100</p>
        </div>
    );
};

const ConfidenceIndicator: React.FC<{ score: number }> = ({ score }) => {
    const percentage = score * 100;
    const color = percentage > 80 ? 'bg-green-500' : percentage > 50 ? 'bg-yellow-500' : 'bg-red-500';
    
    return (
        <div className="text-center p-4 rounded-lg bg-slate-100 dark:bg-slate-700">
            <Activity className={`w-12 h-12 mx-auto mb-2 ${color.replace('bg-', 'text-')}`} />
            <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-4">
                <div className={`${color} h-4 rounded-full`} style={{ width: `${percentage}%` }}></div>
            </div>
            <p className="mt-2 text-lg font-bold">Analysis Confidence</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{percentage.toFixed(0)}%</p>
        </div>
    );
};


const ResultCard: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode; className?: string }> = ({ icon, title, children, className = "" }) => (
  <div className={`bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md ${className}`}>
    <div className="flex items-center gap-3 mb-3">
      {icon}
      <h3 className="text-lg font-semibold">{title}</h3>
    </div>
    <div className="text-sm text-slate-600 dark:text-slate-300 space-y-2">
        {children}
    </div>
  </div>
);


export const AnalysisResult: React.FC<AnalysisResultProps> = ({ result, image, userRole, onSaveToWatchlist }) => {
  const expiryStyles = getStatusStyles(result.expiry_status);
  const [feedbackGiven, setFeedbackGiven] = useState<'up' | 'down' | null>(null);
  const [nearbyPharmacies, setNearbyPharmacies] = useState<any>(null);
  const [isFindingPharmacies, setIsFindingPharmacies] = useState(false);

  if (result.type === 'invalid') {
    return (
      <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg text-center space-y-4 animate-fade-in">
        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Invalid Image Detected</h2>
        <p className="text-slate-600 dark:text-slate-300 max-w-md mx-auto">
          {result.explanation || "The AI model determined that this image does not contain a valid medicine or medical scan. Please ensure you are uploading a clear photo of a medical subject."}
        </p>
        <div className="pt-4">
          <img src={image} alt="Invalid subject" className="w-48 h-48 object-cover rounded-lg mx-auto opacity-50 grayscale" />
        </div>
        <p className="text-sm text-slate-500 italic">
          Drawback: AI models can sometimes misidentify complex images like screenshots.
        </p>
      </div>
    );
  }

  const handleGenerateReport = () => {
    const { 
      type,
      product_match, 
      counterfeit_risk_score, 
      counterfeit_risk_reasons, 
      expiry_extracted, 
      expiry_status, 
      tablet_integrity, 
      imaging_details,
      symptom_analysis,
      interactions,
      batch_number,
      serial_number,
      distributor_info,
      regulatory_compliance,
      recommended_action, 
      explanation,
      drawbacks
    } = result;

    const doc = new jsPDF();
    let yPos = 20;

    // Title
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(`Medical Analysis E-Report (${type.toUpperCase()})`, 14, yPos);
    yPos += 15;

    // Meta Info
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date of Analysis: ${new Date().toLocaleString()}`, 14, yPos);
    yPos += 7;
    if (batch_number) { doc.text(`Batch Number: ${batch_number}`, 14, yPos); yPos += 7; }
    if (serial_number) { doc.text(`Serial Number: ${serial_number}`, 14, yPos); yPos += 7; }
    if (distributor_info) { doc.text(`Distributor: ${distributor_info.name} (Trust Score: ${distributor_info.trust_score * 100}%)`, 14, yPos); yPos += 7; }
    
    yPos += 5;

    // Summary Section
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('1. Summary of Findings', 14, yPos);
    yPos += 10;
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const splitExplanation = doc.splitTextToSize(`Overall Assessment: ${explanation}`, 180);
    doc.text(splitExplanation, 14, yPos);
    yPos += splitExplanation.length * 6;
    
    const splitAction = doc.splitTextToSize(`Recommended Action: ${recommended_action}`, 180);
    doc.text(splitAction, 14, yPos);
    yPos += splitAction.length * 6 + 5;

    if (regulatory_compliance) {
        doc.text(`Regulatory Compliance: ${regulatory_compliance.status.toUpperCase()}`, 14, yPos); yPos += 6;
        const splitDetails = doc.splitTextToSize(`Compliance Details: ${regulatory_compliance.details}`, 180);
        doc.text(splitDetails, 14, yPos);
        yPos += splitDetails.length * 6 + 5;
    }

    if (type === 'medicine') {
        const riskLevel = (counterfeit_risk_score || 0) > 0.75 ? 'High' : (counterfeit_risk_score || 0) > 0.4 ? 'Moderate' : 'Low';
        
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('2. Counterfeit Risk Assessment', 14, yPos);
        yPos += 10;
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text(`Risk Score: ${((counterfeit_risk_score || 0) * 100).toFixed(0)} / 100`, 14, yPos); yPos += 6;
        doc.text(`Risk Level: ${riskLevel}`, 14, yPos); yPos += 6;
        
        doc.text('Reasons for Assessment:', 14, yPos); yPos += 6;
        if (counterfeit_risk_reasons && counterfeit_risk_reasons.length > 0) {
            counterfeit_risk_reasons.forEach(reason => {
                const splitReason = doc.splitTextToSize(`- ${reason}`, 175);
                doc.text(splitReason, 19, yPos);
                yPos += splitReason.length * 6;
            });
        } else {
            doc.text('- None', 19, yPos); yPos += 6;
        }
        yPos += 5;

        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('3. Expiry Status', 14, yPos);
        yPos += 10;
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text(`Status: ${expiry_status?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'N/A'}`, 14, yPos); yPos += 6;
        doc.text(`Extracted Date (ISO): ${expiry_extracted?.date_iso || 'N/A'}`, 14, yPos); yPos += 6;
        doc.text(`Raw Text Detected: "${expiry_extracted?.raw_text || 'N/A'}"`, 14, yPos); yPos += 6;
        doc.text(`Confidence: ${((expiry_extracted?.confidence || 0) * 100).toFixed(0)}%`, 14, yPos); yPos += 11;

        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('4. Product Information', 14, yPos);
        yPos += 10;
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text(`Product Name: ${product_match?.name || 'N/A'}`, 14, yPos); yPos += 6;
        doc.text(`Manufacturer: ${product_match?.manufacturer || 'N/A'}`, 14, yPos); yPos += 11;
    } else if (type === 'imaging') {
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('2. Imaging Details', 14, yPos);
        yPos += 10;
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text(`Scan Type: ${imaging_details?.scan_type || 'N/A'}`, 14, yPos); yPos += 6;
        doc.text(`Body Part: ${imaging_details?.body_part || 'N/A'}`, 14, yPos); yPos += 6;
        doc.text(`Abnormality Detected: ${imaging_details?.abnormality_detected ? 'Yes' : 'No'}`, 14, yPos); yPos += 6;
        doc.text(`Confidence Score: ${((imaging_details?.confidence_score || 0) * 100).toFixed(0)}%`, 14, yPos); yPos += 11;

        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('3. Findings', 14, yPos);
        yPos += 10;
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        if (imaging_details?.findings && imaging_details.findings.length > 0) {
            imaging_details.findings.forEach(finding => {
                const splitFinding = doc.splitTextToSize(`- ${finding}`, 175);
                doc.text(splitFinding, 19, yPos);
                yPos += splitFinding.length * 6;
            });
        } else {
            doc.text('- None', 19, yPos); yPos += 6;
        }
    }

    // Disclaimer
    if (yPos > 250) {
        doc.addPage();
        yPos = 20;
    } else {
        yPos += 10;
    }
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100);
    const disclaimer = "Disclaimer: This report is generated by an automated AI system and is for informational purposes only. It does not constitute professional medical or pharmaceutical advice. Consult a licensed healthcare provider for any concerns.";
    const splitDisclaimer = doc.splitTextToSize(disclaimer, 180);
    doc.text(splitDisclaimer, 14, yPos);

    doc.save(`${type}-analysis-report-${new Date().toISOString().split('T')[0]}.pdf`);
  };
  
  const handleFindPharmacy = async () => {
    setIsFindingPharmacies(true);
    try {
        let lat = 0, lng = 0;
        try {
            const pos = await new Promise<GeolocationPosition>((res, rej) => 
              navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
            );
            lat = pos.coords.latitude;
            lng = pos.coords.longitude;
        } catch (e) {
            console.warn("Location access denied, using default");
        }
        const res = await findNearbyFacilities("pharmacies", lat, lng);
        setNearbyPharmacies(res);
    } catch (err) {
        console.error("Failed to find pharmacies", err);
        alert("Failed to find nearby pharmacies. Please try again.");
    } finally {
        setIsFindingPharmacies(false);
    }
  };

  const getMonthsToExpiry = () => {
    if (!result.expiry_extracted?.date_iso) return null;
    const expiryDate = new Date(result.expiry_extracted.date_iso);
    if (isNaN(expiryDate.getTime())) return null;
    const today = new Date();
    return (expiryDate.getFullYear() - today.getFullYear()) * 12 + (expiryDate.getMonth() - today.getMonth());
  };

  const monthsToExpiry = getMonthsToExpiry();
  const isDiscountEligible = monthsToExpiry !== null && monthsToExpiry >= 1 && monthsToExpiry <= 4;

  const handleNotifyNetwork = () => {
    alert("Network Notified: Alerts have been sent to local doctors, clients, and distributors regarding this near-expiry medication.");
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 md:p-6 rounded-xl">
        {isDiscountEligible && (
            <div className="mb-6 bg-yellow-100 dark:bg-yellow-900/30 border-l-4 border-yellow-500 p-4 rounded-r-lg flex items-start gap-3">
                <Tag className="w-6 h-6 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <div>
                    <h3 className="font-bold text-yellow-800 dark:text-yellow-300">Discount Required</h3>
                    <p className="text-yellow-700 dark:text-yellow-400 text-sm mt-1">
                        This medication expires within 1-4 months ({monthsToExpiry} months remaining). According to policy, the seller must offer a discount.
                    </p>
                </div>
            </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
                <div className="relative">
                    {image ? (
                        <img src={image} alt="Analyzed medical subject" className="w-full rounded-lg shadow-lg" />
                    ) : (
                        <div className="w-full h-64 bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                            <Stethoscope className="w-16 h-16 text-slate-400" />
                        </div>
                    )}
                    {result.type === 'medicine' && result.expiry_status && (
                        <div className={`absolute top-2 right-2 px-3 py-1 rounded-full font-bold text-sm flex items-center gap-2 ${expiryStyles.bg} ${expiryStyles.text}`}>
                            {expiryStyles.icon}
                            <span className="capitalize">{result.expiry_status.replace('_', ' ')}</span>
                        </div>
                    )}
                </div>
                 <ResultCard icon={<Stethoscope className="text-blue-500" />} title="Recommended Action">
                    <p className="text-base font-medium">{result.recommended_action}</p>
                </ResultCard>
                 <ResultCard icon={<FlaskConical className="text-purple-500" />} title="Analysis Explanation">
                    <p>{result.explanation}</p>
                </ResultCard>
            </div>
            <div className="space-y-6">
                {result.type === 'medicine' && (
                    <>
                        <ResultCard icon={<Shield className="text-red-500" />} title="Counterfeit Risk">
                             <RiskScoreIndicator score={result.counterfeit_risk_score || 0} />
                             {result.counterfeit_risk_reasons && result.counterfeit_risk_reasons.length > 0 && (
                                <ul className="mt-4 list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300">
                                   {result.counterfeit_risk_reasons.map((reason, i) => <li key={i}>{reason}</li>)}
                                </ul>
                             )}
                        </ResultCard>
                        {result.interactions && result.interactions.length > 0 && (
                            <ResultCard icon={<AlertCircle className="text-red-600" />} title="Drug Interactions" className="border-2 border-red-500/30 bg-red-50 dark:bg-red-900/10">
                                <div className="space-y-3">
                                    {result.interactions.map((i, idx) => (
                                        <div key={idx} className="p-3 bg-white dark:bg-slate-800 rounded border border-red-100 dark:border-red-900/30">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className={`text-xs font-bold uppercase px-1.5 py-0.5 rounded ${
                                                    i.severity === 'high' ? 'bg-red-500 text-white' : 'bg-orange-500 text-white'
                                                }`}>
                                                    {i.severity}
                                                </span>
                                                <span className="text-xs font-semibold">{i.affected_drugs.join(' + ')}</span>
                                            </div>
                                            <p className="text-xs">{i.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </ResultCard>
                        )}
                        <ResultCard icon={<CalendarDays className="text-green-500" />} title="Expiry Information">
                            <p><strong>Status:</strong> <span className={`font-semibold ${expiryStyles.text} capitalize`}>{result.expiry_status?.replace('_',' ')}</span></p>
                            <p><strong>Extracted Date:</strong> {result.expiry_extracted?.date_iso || 'Not found'}</p>
                            <p><strong>Confidence:</strong> {((result.expiry_extracted?.confidence || 0) * 100).toFixed(0)}%</p>
                        </ResultCard>
                        <ResultCard icon={<Pill className="text-indigo-500" />} title="Tablet Integrity">
                            <p className="capitalize text-lg font-semibold">{result.tablet_integrity?.replace('_', ' ')}</p>
                        </ResultCard>
                        
                        {result.pill_count_analysis && (
                            <ResultCard icon={<Activity className="text-emerald-500" />} title="Strip-Cut Inventory Calculator">
                                <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                                    <div className="text-center">
                                        <p className="text-xs text-emerald-600 dark:text-emerald-400 uppercase font-bold">Total Capacity</p>
                                        <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300">{result.pill_count_analysis.total_capacity}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs text-blue-600 dark:text-blue-400 uppercase font-bold">Remaining Pills</p>
                                        <p className="text-2xl font-black text-blue-700 dark:text-blue-300">{result.pill_count_analysis.remaining_pills}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs text-slate-500 uppercase font-bold">Confidence</p>
                                        <p className="text-lg font-bold text-slate-700 dark:text-slate-300">{Math.round(result.pill_count_analysis.confidence * 100)}%</p>
                                    </div>
                                </div>
                            </ResultCard>
                        )}

                        {result.generic_recommendation && (
                            <ResultCard icon={<Tag className="text-blue-500" />} title="Jan Aushadhi Generic Recommender">
                                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Generic Equivalent:</span>
                                        <span className="font-bold text-blue-700 dark:text-blue-300">{result.generic_recommendation.generic_name}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Jan Aushadhi Available:</span>
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${result.generic_recommendation.jan_aushadhi_available ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-700'}`}>
                                            {result.generic_recommendation.jan_aushadhi_available ? 'YES' : 'NO'}
                                        </span>
                                    </div>
                                    {result.generic_recommendation.estimated_price_difference_inr > 0 && (
                                        <div className="mt-2 pt-2 border-t border-blue-200 dark:border-blue-800 flex justify-between items-center">
                                            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Estimated Savings:</span>
                                            <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">₹{result.generic_recommendation.estimated_price_difference_inr}</span>
                                        </div>
                                    )}
                                </div>
                            </ResultCard>
                        )}

                        {(result.batch_number || result.serial_number || result.distributor_info || result.regulatory_compliance) && (
                            <ResultCard icon={<ShieldCheck className="text-slate-500" />} title="Institutional Data" className="bg-slate-50 dark:bg-slate-800/50 border-dashed border-2 border-slate-200 dark:border-slate-700">
                                <div className="space-y-3 text-xs">
                                    <div className="grid grid-cols-2 gap-2">
                                        {result.batch_number && <p><strong>Batch:</strong> {result.batch_number}</p>}
                                        {result.serial_number && <p><strong>Serial:</strong> {result.serial_number}</p>}
                                    </div>
                                    
                                    {result.distributor_info && (
                                        <div className="p-2 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                                            <p className="font-bold text-[10px] uppercase text-slate-400 mb-1">Distributor Trust Score</p>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-semibold">{result.distributor_info.name}</span>
                                                <span className={`font-bold ${result.distributor_info.trust_score > 0.7 ? 'text-green-500' : 'text-red-500'}`}>
                                                    {(result.distributor_info.trust_score * 100).toFixed(0)}%
                                                </span>
                                            </div>
                                            <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full ${result.distributor_info.trust_score > 0.7 ? 'bg-green-500' : 'bg-red-500'}`} 
                                                    style={{ width: `${result.distributor_info.trust_score * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {result.regulatory_compliance && (
                                        <div className="pt-1">
                                            <p className="font-bold mb-1">Regulatory Status:</p>
                                            <p className={`px-2 py-0.5 rounded inline-block ${
                                                result.regulatory_compliance.status === 'compliant' ? 'bg-green-100 text-green-700' : 
                                                result.regulatory_compliance.status === 'non-compliant' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
                                            }`}>
                                                {result.regulatory_compliance.status.toUpperCase()}
                                            </p>
                                            <p className="mt-1 text-slate-500">{result.regulatory_compliance.details}</p>
                                        </div>
                                    )}

                                    {result.geographic_market && (
                                        <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                                            <p className="font-bold text-[10px] uppercase text-slate-400 mb-1">Supply Chain Integrity</p>
                                            <div className="flex items-center gap-2 mb-1">
                                                <Globe className="w-3 h-3 text-blue-500" />
                                                <span className="font-semibold">Intended Market: {result.geographic_market}</span>
                                            </div>
                                            {result.diversion_risk && (
                                                <div className={`p-2 rounded text-[10px] ${result.diversion_risk.is_diverted ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                                    <p className="font-bold">{result.diversion_risk.is_diverted ? '⚠️ DIVERSION DETECTED' : '✓ MARKET COMPLIANT'}</p>
                                                    <p className="opacity-80">{result.diversion_risk.reason}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </ResultCard>
                        )}
                    </>
                )}

                {result.type === 'imaging' && (
                    <>
                        <ResultCard icon={<Activity className="text-purple-500" />} title="Imaging Analysis">
                             <ConfidenceIndicator score={result.imaging_details?.confidence_score || 0} />
                             <div className="mt-4 space-y-2">
                                <p><strong>Scan Type:</strong> {result.imaging_details?.scan_type}</p>
                                <p><strong>Body Part:</strong> {result.imaging_details?.body_part}</p>
                                <p><strong>Abnormality:</strong> {result.imaging_details?.abnormality_detected ? 'Detected' : 'Not Detected'}</p>
                             </div>
                        </ResultCard>
                        <ResultCard icon={<FileText className="text-blue-500" />} title="Findings">
                            <ul className="list-disc list-inside space-y-1">
                                {result.imaging_details?.findings.map((finding, i) => <li key={i}>{finding}</li>)}
                            </ul>
                        </ResultCard>
                    </>
                )}

                {result.type === 'qa_testing' && (
                    <>
                        <ResultCard icon={<ShieldAlert className="text-indigo-500" />} title="QA & Compliance Report">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-500 dark:text-slate-400 font-medium">Defect Status</span>
                                    {result.qa_details?.defect_found ? (
                                        <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-bold rounded-full text-sm flex items-center gap-1">
                                            <AlertCircle className="w-4 h-4" /> Defect Found
                                        </span>
                                    ) : (
                                        <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-bold rounded-full text-sm flex items-center gap-1">
                                            <CheckCircle2 className="w-4 h-4" /> Passed
                                        </span>
                                    )}
                                </div>
                                {result.qa_details?.defect_found && (
                                    <div className="p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg">
                                        <p className="font-semibold text-red-800 dark:text-red-300">{result.qa_details.defect_type}</p>
                                        <p className="text-sm text-red-600 dark:text-red-400 mt-1">{result.qa_details.defect_description}</p>
                                    </div>
                                )}
                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Packaging Integrity</p>
                                        <p className="font-medium text-slate-800 dark:text-slate-200 mt-1 capitalize">{result.qa_details?.packaging_integrity}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Label Compliance</p>
                                        <p className="font-medium text-slate-800 dark:text-slate-200 mt-1 capitalize">{result.qa_details?.label_compliance}</p>
                                    </div>
                                </div>
                            </div>
                        </ResultCard>
                        <ResultCard icon={<FileText className="text-blue-500" />} title="Recommended Action">
                            <p className="text-slate-700 dark:text-slate-300">{result.recommended_action}</p>
                            {result.explanation && (
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{result.explanation}</p>
                            )}
                        </ResultCard>
                    </>
                )}

                {result.type === 'symptom' && (
                    <>
                        <ResultCard icon={<Stethoscope className="text-orange-500" />} title="Symptom Triage">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className={`px-4 py-2 rounded-full text-sm font-bold uppercase ${
                                        result.symptom_analysis?.urgency_level === 'emergency' ? 'bg-red-500 text-white animate-pulse' :
                                        result.symptom_analysis?.urgency_level === 'urgent' ? 'bg-orange-500 text-white' : 'bg-blue-500 text-white'
                                    }`}>
                                        {result.symptom_analysis?.urgency_level}
                                    </div>
                                    <span className="text-slate-500 text-sm font-medium">Urgency Level</span>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Suggested Specialist:</p>
                                    <p className="text-lg font-bold text-slate-800 dark:text-white">{result.symptom_analysis?.suggested_specialist}</p>
                                </div>
                            </div>
                        </ResultCard>
                        <ResultCard icon={<Info className="text-blue-500" />} title="Potential Conditions">
                            <ul className="list-disc list-inside space-y-1">
                                {result.symptom_analysis?.potential_conditions.map((condition, i) => <li key={i}>{condition}</li>)}
                            </ul>
                        </ResultCard>

                        {result.vernacular_translation && (
                            <ResultCard icon={<Globe className="text-indigo-500" />} title="Patient Safety Translation">
                                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg space-y-4">
                                    <div className="flex items-center justify-between border-b border-indigo-200 dark:border-indigo-800 pb-2">
                                        <span className="text-xs font-bold uppercase text-indigo-600 dark:text-indigo-400">Language</span>
                                        <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-200 rounded text-xs font-bold">{result.vernacular_translation.language}</span>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-500 uppercase mb-1">Medicine Name</p>
                                        <p className="font-semibold text-lg text-slate-800 dark:text-slate-200">{result.vernacular_translation.translated_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-500 uppercase mb-1">Instructions / Dosage</p>
                                        <p className="text-sm text-slate-700 dark:text-slate-300">{result.vernacular_translation.translated_instructions}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-500 uppercase mb-1">Side Effects</p>
                                        <p className="text-sm text-slate-700 dark:text-slate-300">{result.vernacular_translation.translated_side_effects}</p>
                                    </div>
                                </div>
                            </ResultCard>
                        )}
                    </>
                )}
                
                {result.type === 'prescription' && (
                    <>
                        <ResultCard icon={<FileText className="text-blue-500" />} title="Prescription Details">
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Patient Name</p>
                                        <p className="font-medium text-slate-800 dark:text-slate-200 mt-1">{result.prescription_details?.patient_name || 'Not found'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Doctor Name</p>
                                        <p className="font-medium text-slate-800 dark:text-slate-200 mt-1">{result.prescription_details?.doctor_name || 'Not found'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Date</p>
                                        <p className="font-medium text-slate-800 dark:text-slate-200 mt-1">{result.prescription_details?.date || 'Not found'}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Clinic Info</p>
                                        <p className="font-medium text-slate-800 dark:text-slate-200 mt-1">{result.prescription_details?.clinic_info || 'Not found'}</p>
                                    </div>
                                </div>
                            </div>
                        </ResultCard>

                        <ResultCard icon={<Pill className="text-emerald-500" />} title="Prescribed Medications">
                            <div className="space-y-4">
                                {result.prescription_details?.medications?.map((med, idx) => (
                                    <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                                        <p className="font-bold text-lg text-slate-800 dark:text-white">{med.name}</p>
                                        <div className="flex gap-4 mt-2 text-sm text-slate-600 dark:text-slate-400">
                                            <p><strong>Dosage:</strong> {med.dosage}</p>
                                            <p><strong>Frequency:</strong> {med.frequency}</p>
                                        </div>
                                    </div>
                                ))}
                                {(!result.prescription_details?.medications || result.prescription_details.medications.length === 0) && (
                                    <p className="text-slate-500 italic">No medications found in the prescription.</p>
                                )}
                            </div>
                        </ResultCard>

                        {result.interactions && result.interactions.length > 0 && (
                            <ResultCard icon={<AlertTriangle className="text-red-500" />} title="Potential Interactions">
                                <div className="space-y-3">
                                    {result.interactions.map((interaction, idx) => (
                                        <div key={idx} className={`p-3 rounded-lg border ${
                                            interaction.severity === 'high' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' :
                                            interaction.severity === 'moderate' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' :
                                            'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                                        }`}>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${
                                                    interaction.severity === 'high' ? 'bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200' :
                                                    interaction.severity === 'moderate' ? 'bg-yellow-200 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200' :
                                                    'bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200'
                                                }`}>
                                                    {interaction.severity} Risk
                                                </span>
                                                <span className="font-semibold text-sm">
                                                    {interaction.affected_drugs.join(' + ')}
                                                </span>
                                            </div>
                                            <p className="text-sm mt-1">{interaction.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </ResultCard>
                        )}
                    </>
                )}

                <ResultCard icon={<AlertCircle className="text-orange-500" />} title="AI Drawbacks & Limitations" className="border-l-4 border-orange-500">
                    <ul className="list-disc list-inside space-y-1">
                        {result.drawbacks.map((drawback, i) => <li key={i} className="text-orange-700 dark:text-orange-300 italic">{drawback}</li>)}
                    </ul>
                </ResultCard>
            </div>
        </div>

        <div className="mt-6 border-t border-slate-200 dark:border-slate-700 pt-6">
            <div className="flex flex-col items-center justify-center mb-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-3">Was this analysis accurate and helpful?</p>
                <div className="flex gap-4">
                    <button 
                        onClick={() => setFeedbackGiven('up')}
                        disabled={feedbackGiven !== null}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all ${
                            feedbackGiven === 'up' 
                                ? 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/40 dark:text-green-400 border' 
                                : feedbackGiven === 'down'
                                    ? 'opacity-50 cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-slate-800'
                                    : 'bg-white hover:bg-green-50 text-slate-600 hover:text-green-600 border border-slate-200 hover:border-green-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600'
                        }`}
                    >
                        <ThumbsUp className="w-4 h-4" /> Yes
                    </button>
                    <button 
                        onClick={() => setFeedbackGiven('down')}
                        disabled={feedbackGiven !== null}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all ${
                            feedbackGiven === 'down' 
                                ? 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/40 dark:text-red-400 border' 
                                : feedbackGiven === 'up'
                                    ? 'opacity-50 cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-slate-800'
                                    : 'bg-white hover:bg-red-50 text-slate-600 hover:text-red-600 border border-slate-200 hover:border-red-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600'
                        }`}
                    >
                        <ThumbsDown className="w-4 h-4" /> No
                    </button>
                </div>
                {feedbackGiven && (
                    <p className="text-xs text-slate-500 mt-3 animate-fade-in">Thank you for your feedback! This helps improve our AI models.</p>
                )}
            </div>

            <div className="flex flex-wrap gap-4">
                {userRole === 'seller' && result.type === 'medicine' && (
                    <button
                        onClick={() => onSaveToWatchlist?.(result)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 text-white font-semibold rounded-lg hover:bg-black transition-colors shadow-md border border-slate-700"
                    >
                        <CalendarDays className="w-5 h-5" /> Save to Watchlist
                    </button>
                )}
                {(userRole === 'seller' || userRole === 'distributor' || userRole === 'manufacturer') && result.type === 'medicine' && result.expiry_status === 'near_expiry' && (
                    <button
                        onClick={handleNotifyNetwork}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-yellow-600 text-white font-semibold rounded-lg hover:bg-yellow-700 transition-colors shadow-md"
                    >
                        <BellRing className="w-5 h-5" /> Liquidate on Marketplace
                    </button>
                )}
                <button
                  onClick={handleGenerateReport}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-md"
                >
                  <FileText className="w-5 h-5" /> Generate E-Report
                </button>
                <button
                  onClick={handleFindPharmacy}
                  disabled={isFindingPharmacies}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 disabled:bg-slate-400 transition-colors shadow-md"
                >
                  {isFindingPharmacies ? <Loader2 className="w-5 h-5 animate-spin" /> : <MapPin className="w-5 h-5" />} 
                  Find Nearby Pharmacy
                </button>
            </div>
            
            {nearbyPharmacies && (
                <div className="mt-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl animate-fade-in">
                    <h3 className="font-bold text-emerald-800 dark:text-emerald-300 mb-2 flex items-center gap-2">
                        <MapPin className="w-5 h-5" /> Nearby Pharmacies
                    </h3>
                    <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap mb-4">
                        {nearbyPharmacies.text}
                    </div>
                    {nearbyPharmacies.places && nearbyPharmacies.places.length > 0 && (
                        <div className="space-y-2">
                            {nearbyPharmacies.places.map((place: any, idx: number) => (
                                place.maps?.uri && (
                                    <a 
                                        key={idx} 
                                        href={place.maps.uri} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="block p-3 bg-white dark:bg-slate-800 rounded-lg shadow-sm hover:shadow border border-slate-100 dark:border-slate-700 transition-all"
                                    >
                                        <div className="font-semibold text-blue-600 dark:text-blue-400">{place.maps.title || 'View on Google Maps'}</div>
                                    </a>
                                )
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    </div>
  );
};
