import { GoogleGenAI, Type } from "@google/genai";
import type { AnalysisOutput } from '../types';

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const MODEL_NAME = "gemini-2.5-flash";

const medGemmaInstruction = `You are Med-Gemma, a specialized Medical AI expert with deep knowledge of pharmaceutical safety, clinical reasoning, and healthcare compliance (HIPAA/GDPR). 
Your analysis must be evidence-based, referencing standard medical practices and pharmaceutical regulations.`;

const medicineAnalysisPrompt = `${medGemmaInstruction}
Your task is to analyze medicine packaging and pills for authenticity and safety.
1. Examine for signs of counterfeit packaging, expiry dates, and tablet integrity.
2. Extract Batch Number, Serial Number, and Manufacturer.
3. Assess regulatory compliance (e.g., presence of required markings, barcodes).
4. Geographic Market Check: Identify intended market and flag potential diversion.
5. Strip-Cut Inventory: If the image shows a partially cut blister pack or loose pills, count the total capacity and the remaining pills.
6. Generic Recommender: Suggest a cheaper generic equivalent (especially Jan Aushadhi availability in India) and estimate the price difference in INR.
7. Return valid JSON according to the schema.`;

const prescriptionAnalysisPrompt = `${medGemmaInstruction}
Your task is to analyze a medical prescription image.
1. Extract Patient Name (if visible), Doctor Name, and Clinic Info.
2. List all prescribed medications, dosages, and frequencies.
3. Check for potential drug-drug interactions between the prescribed items.
4. Verify the date of the prescription.
5. Return valid JSON according to the schema.`;

const symptomAnalysisPrompt = `${medGemmaInstruction}
Your task is to perform triage and symptom analysis.
1. Identify potential conditions based on visual evidence or text description.
2. Determine urgency level (routine, urgent, or emergency).
3. Suggest the type of specialist to consult.
4. Always include a strong disclaimer that this is NOT a diagnosis.
5. Return valid JSON according to the schema.`;

const imagingAnalysisPrompt = `${medGemmaInstruction}
Your task is to analyze medical scans (X-ray, MRI, CT, Ultrasound).
1. Identify scan type and body part.
2. Look for abnormalities or findings.
3. Return valid JSON according to the schema.`;

const qaTestingPrompt = `${medGemmaInstruction}
Your task is to perform Pharmaceutical Quality Assurance (QA) on production line images.
1. Detect visual defects (chipped pills, discoloration, cracked vials).
2. Assess packaging integrity and label compliance.
3. Return valid JSON according to the schema.`;

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        type: { type: Type.STRING, description: "Must be 'medicine', 'imaging', 'symptom', 'qa_testing', or 'prescription'" },
        product_match: {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING },
                manufacturer: { type: Type.STRING },
                standard_packaging_image: { type: Type.STRING },
                known_security_features: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
        },
        prescription_details: {
            type: Type.OBJECT,
            properties: {
                patient_name: { type: Type.STRING },
                doctor_name: { type: Type.STRING },
                clinic_info: { type: Type.STRING },
                date: { type: Type.STRING },
                medications: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            dosage: { type: Type.STRING },
                            frequency: { type: Type.STRING }
                        }
                    }
                }
            }
        },
        counterfeit_risk_score: { type: Type.NUMBER },
        counterfeit_risk_reasons: { type: Type.ARRAY, items: { type: Type.STRING } },
        expiry_extracted: {
            type: Type.OBJECT,
            properties: {
                date_iso: { type: Type.STRING },
                confidence: { type: Type.NUMBER },
                method: { type: Type.STRING },
                raw_text: { type: Type.STRING }
            }
        },
        expiry_status: { type: Type.STRING },
        tablet_integrity: { type: Type.STRING },
        batch_number: { type: Type.STRING },
        serial_number: { type: Type.STRING },
        geographic_market: { type: Type.STRING },
        diversion_risk: {
            type: Type.OBJECT,
            properties: {
                is_diverted: { type: Type.BOOLEAN },
                reason: { type: Type.STRING },
                expected_market: { type: Type.STRING }
            }
        },
        distributor_info: {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING },
                trust_score: { type: Type.NUMBER },
                verification_status: { type: Type.STRING }
            }
        },
        regulatory_compliance: {
            type: Type.OBJECT,
            properties: {
                status: { type: Type.STRING },
                details: { type: Type.STRING }
            }
        },
        interactions: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    severity: { type: Type.STRING },
                    description: { type: Type.STRING },
                    affected_drugs: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
            }
        },
        imaging_details: {
            type: Type.OBJECT,
            properties: {
                scan_type: { type: Type.STRING },
                body_part: { type: Type.STRING },
                findings: { type: Type.ARRAY, items: { type: Type.STRING } },
                abnormality_detected: { type: Type.BOOLEAN },
                confidence_score: { type: Type.NUMBER }
            }
        },
        symptom_analysis: {
            type: Type.OBJECT,
            properties: {
                potential_conditions: { type: Type.ARRAY, items: { type: Type.STRING } },
                urgency_level: { type: Type.STRING },
                suggested_specialist: { type: Type.STRING }
            }
        },
        qa_details: {
            type: Type.OBJECT,
            properties: {
                defect_found: { type: Type.BOOLEAN },
                defect_type: { type: Type.STRING },
                defect_description: { type: Type.STRING },
                packaging_integrity: { type: Type.STRING },
                label_compliance: { type: Type.STRING },
                confidence_score: { type: Type.NUMBER }
            }
        },
        pill_count_analysis: {
            type: Type.OBJECT,
            properties: {
                total_capacity: { type: Type.NUMBER },
                remaining_pills: { type: Type.NUMBER },
                confidence: { type: Type.NUMBER }
            }
        },
        generic_recommendation: {
            type: Type.OBJECT,
            properties: {
                generic_name: { type: Type.STRING },
                jan_aushadhi_available: { type: Type.BOOLEAN },
                estimated_price_difference_inr: { type: Type.NUMBER }
            }
        },
        vernacular_translation: {
            type: Type.OBJECT,
            properties: {
                language: { type: Type.STRING },
                translated_name: { type: Type.STRING },
                translated_instructions: { type: Type.STRING },
                translated_side_effects: { type: Type.STRING }
            }
        },
        recommended_action: { type: Type.STRING },
        explanation: { type: Type.STRING },
        drawbacks: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: [
        "type",
        "recommended_action",
        "explanation",
        "drawbacks"
    ]
};

function dataUrlToGeminiPart(dataUrl: string) {
    const [header, data] = dataUrl.split(',');
    const mimeType = header.match(/:(.*?);/)?.[1];
    if (!mimeType || !data) {
        throw new Error("Invalid data URL format");
    }
    return {
        inlineData: {
            mimeType,
            data,
        },
    };
}

const performAnalysis = async (parts: any[]): Promise<AnalysisOutput> => {
     try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: { parts: [...parts] },
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
        });

        if (!response.text) {
          throw new Error("API returned an empty response.");
        }

        let jsonText = response.text.trim();
        if (jsonText.startsWith('```')) {
            jsonText = jsonText.replace(/^```(json)?\n?/, '').replace(/\n?```$/, '').trim();
        }
        return JSON.parse(jsonText) as AnalysisOutput;

    } catch (error: any) {
        console.error("Error analyzing image with Gemini API:", error);
        throw new Error(`Gemini API Error: ${error.message}`);
    }
}

export const analyzeSingleMedicine = async (imageDataUrls: string[]): Promise<AnalysisOutput> => {
    const imageParts = imageDataUrls.map(dataUrlToGeminiPart);
    const allParts = [{ text: medicineAnalysisPrompt }, ...imageParts];
    return performAnalysis(allParts);
}

export const analyzeImage = async (imageDataUrl: string): Promise<AnalysisOutput> => {
    const imagePart = dataUrlToGeminiPart(imageDataUrl);
    const allParts = [{ text: medicineAnalysisPrompt }, imagePart];
    return performAnalysis(allParts);
};

export const analyzeMedicalImaging = async (imageDataUrl: string, clinicalContext?: string): Promise<AnalysisOutput> => {
    const imagePart = dataUrlToGeminiPart(imageDataUrl);
    let promptText = imagingAnalysisPrompt;
    if (clinicalContext && clinicalContext.trim() !== '') {
        promptText += `\n\nClinical Context provided by patient: ${clinicalContext}\nPlease incorporate this context into your analysis to provide a more accurate and comprehensive report, considering the patient's symptoms and history.`;
    }
    const allParts = [{ text: promptText }, imagePart];
    return performAnalysis(allParts);
};

export const analyzeSymptoms = async (text: string, imageDataUrl?: string): Promise<AnalysisOutput> => {
    const parts: any[] = [{ text: `${symptomAnalysisPrompt}\n\nUser Description: ${text}` }];
    if (imageDataUrl) {
        parts.push(dataUrlToGeminiPart(imageDataUrl));
    }
    return performAnalysis(parts);
};

export const analyzeQA = async (imageDataUrl: string): Promise<AnalysisOutput> => {
    const imagePart = dataUrlToGeminiPart(imageDataUrl);
    const allParts = [{ text: qaTestingPrompt }, imagePart];
    return performAnalysis(allParts);
};

export const analyzePrescription = async (imageDataUrl: string): Promise<AnalysisOutput> => {
    const imagePart = dataUrlToGeminiPart(imageDataUrl);
    const allParts = [{ text: prescriptionAnalysisPrompt }, imagePart];
    return performAnalysis(allParts);
};

export const transcribeAudio = async (audioDataUrl: string): Promise<string> => {
    const audioPart = dataUrlToGeminiPart(audioDataUrl);
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: { parts: [{ text: "Transcribe this audio accurately. Return only the transcribed text." }, audioPart] }
    });
    return response.text || "";
};

export const chatWithGemini = async (message: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `You are Med-Gemma, a helpful medical assistant. The user is asking: "${message}". 
            Respond helpfully in English. Keep it concise for WhatsApp.`,
        });
        return response.text || "I'm sorry, I couldn't process that request.";
    } catch (error) {
        console.error("Error in chatWithGemini:", error);
        return "I'm sorry, I'm having trouble connecting to my medical brain right now.";
    }
};

export const searchMedicalInfo = async (query: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Search for the following medical query: "${query}". 
        Provide an accurate, up-to-date summary in English. 
        Format your response using Markdown with the following structure (if applicable to the query):
        
        ### 📋 Overview
        [Brief summary of the drug, condition, or topic]
        
        ### 📰 Recent Updates & Medical Info
        [Any recent news, studies, or changes in guidelines]
        
        ### ⚠️ Drug Recalls & Safety Alerts
        [List any recent FDA/regulatory recalls, warnings, or severe side effects. If none, state "No recent major recalls found."]
        
        ### 💡 Key Takeaways
        [Bullet points of the most important information for a patient or consumer]
        
        Keep the tone professional, objective, and easy to understand.`,
        config: {
            tools: [{ googleSearch: {} }]
        }
    });
    return response.text || "";
};

export const findNearbyFacilities = async (query: string, lat: number, lng: number, locationName?: string): Promise<any> => {
    try {
        const prompt = locationName 
            ? `Find ${query} in or near ${locationName} and summarize the best options in English.`
            : `Find nearby ${query} and summarize the best options in English.`;
        
        const config: any = {
            tools: [{ googleMaps: {} }, { googleSearch: {} }]
        };

        // Only add latLng if we have non-zero coordinates
        if (lat !== 0 || lng !== 0) {
            config.toolConfig = {
                retrievalConfig: {
                    latLng: {
                        latitude: lat,
                        longitude: lng
                    }
                }
            };
        }

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: [{ text: prompt }] },
            config: config
        });

        let text = response.text || "";
        
        // If text is empty, try to get it from candidates
        if (!text && response.candidates?.[0]?.content?.parts?.[0]?.text) {
            text = response.candidates[0].content.parts[0].text;
        }

        return {
            text: text || "I found some locations for you. Please check the links below.",
            places: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
        };
    } catch (error) {
        console.error("Error in findNearbyFacilities:", error);
        // Fallback to a simpler search if maps grounding fails
        try {
            const fallbackResponse = await ai.models.generateContent({
                model: "gemini-3-flash-preview",
                contents: `Find ${query} in ${locationName || 'my area'} and provide a summary in English.`,
                config: { tools: [{ googleSearch: {} }] }
            });
            return {
                text: fallbackResponse.text || "I'm having trouble finding specific locations right now.",
                places: []
            };
        } catch (fallbackError) {
            return {
                text: "Sorry, I encountered an error while searching for facilities. Please try again later.",
                places: []
            };
        }
    }
};

export const fastTextResponse = async (text: string): Promise<string> => {
    return text;
};

export const fetchOpenFDAData = async (medicineName: string) => {
    try {
        const [drugRes, recallRes] = await Promise.all([
            fetch(`/api/fda/drug?name=${encodeURIComponent(medicineName)}`),
            fetch(`/api/fda/recalls?name=${encodeURIComponent(medicineName)}`)
        ]);
        const drugData = await drugRes.json();
        const recallData = await recallRes.json();
        return { drugData, recallData };
    } catch (error) {
        console.error("Error fetching OpenFDA data:", error);
        return null;
    }
};
