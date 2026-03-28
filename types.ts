export type UserRole = 'patient' | 'seller' | 'distributor' | 'manufacturer';

export interface WatchlistItem {
  id: string;
  name: string;
  batchNumber: string;
  expiryDate: string;
  originalPrice: number;
  currentValue: number;
  status: 'healthy' | 'warning' | 'critical' | 'expired';
  revenuePotential: number; // 0 to 100
  leadGenerated: boolean;
  timestamp: number;
}

export type AppState = 'idle' | 'analyzing';

export type AnalysisJobStatus = 'pending' | 'analyzing' | 'completed' | 'failed';

export interface AnalysisJob {
  id: string;
  image: string;
  status: AnalysisJobStatus;
  result?: AnalysisOutput;
  error?: string;
  timestamp?: number;
}

// FIX: Export CameraGuidance type to be used in CameraView.tsx
export interface CameraGuidance {
  message: string;
  boxVisible: boolean;
  boxColor: string;
}

export type AnalysisType = 'medicine' | 'imaging' | 'symptom' | 'qa_testing' | 'prescription' | 'invalid';

export interface AnalysisOutput {
  type: AnalysisType;
  // Common fields
  recommended_action: string;
  explanation: string;
  drawbacks: string[];
  
  // Professional/Institutional fields
  batch_number?: string;
  serial_number?: string;
  geographic_market?: string;
  diversion_risk?: {
    is_diverted: boolean;
    reason: string;
    expected_market: string;
  };
  distributor_info?: {
    name: string;
    trust_score: number; // 0 to 1
    verification_status: 'verified' | 'unverified' | 'flagged';
  };
  regulatory_compliance?: {
    status: 'compliant' | 'non-compliant' | 'unknown';
    details: string;
  };
  
  // Medicine specific fields
  product_match?: {
    name: string;
    manufacturer: string;
    standard_packaging_image: string;
    known_security_features: string[];
  } | null;
  counterfeit_risk_score?: number;
  counterfeit_risk_reasons?: string[];
  expiry_extracted?: {
    date_iso: string;
    confidence: number;
    method: 'OCR' | 'ML-impute';
    raw_text: string;
  };
  expiry_status?: 'expired' | 'near_expiry' | 'valid' | 'unknown';
  tablet_integrity?: 'whole' | 'cut' | 'cracked' | 'powdered' | 'coated_missing' | 'unknown';
  
  // Interaction fields (for multiple medicines)
  interactions?: {
    severity: 'low' | 'moderate' | 'high';
    description: string;
    affected_drugs: string[];
  }[];

  // Imaging specific fields
  imaging_details?: {
    scan_type: 'X-ray' | 'MRI' | 'CT' | 'Ultrasound' | 'Other';
    body_part: string;
    findings: string[];
    abnormality_detected: boolean;
    confidence_score: number;
  };

  // Symptom specific fields
  symptom_analysis?: {
    potential_conditions: string[];
    urgency_level: 'routine' | 'urgent' | 'emergency';
    suggested_specialist: string;
  };

  // QA Testing specific fields
  qa_details?: {
    defect_found: boolean;
    defect_type: string;
    defect_description: string;
    packaging_integrity: 'intact' | 'damaged' | 'tampered' | 'unknown';
    label_compliance: 'compliant' | 'non-compliant' | 'unknown';
    confidence_score: number;
  };

  // Prescription specific fields
  prescription_details?: {
    patient_name: string;
    doctor_name: string;
    clinic_info: string;
    date: string;
    medications: {
      name: string;
      dosage: string;
      frequency: string;
    }[];
  };

  // Strip-Cut Inventory Calculator
  pill_count_analysis?: {
    total_capacity: number;
    remaining_pills: number;
    confidence: number;
  };

  // Jan Aushadhi Generic Recommender
  generic_recommendation?: {
    generic_name: string;
    jan_aushadhi_available: boolean;
    estimated_price_difference_inr: number;
  };

  // Vernacular Translation
  vernacular_translation?: {
    language: string;
    translated_name: string;
    translated_instructions: string;
    translated_side_effects: string;
  };
}

export interface Batch {
  id: string;
  medicineName: string;
  manufacturer: string;
  expiryDate: string;
  status: 'authentic' | 'recalled' | 'flagged';
  history: {
    event: string;
    actor: string;
    location: string;
    timestamp: number;
  }[];
}

export interface SalesRecord {
  id: string;
  medicineName: string;
  quantity: number;
  date: string;
  sellerId: string;
  sellerName: string;
  region: string;
  distributorId?: string;
  category: string;
}

export interface DemandInsight {
  medicineName: string;
  totalQuantity: number;
  region: string;
  growthRate: number; // percentage
  topSellers: { name: string; quantity: number }[];
  recommendation: string;
}
