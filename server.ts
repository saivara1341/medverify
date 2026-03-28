import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { WebSocketServer, WebSocket } from "ws";
import { createServer } from "http";
import { analyzeImage, analyzeSymptoms, analyzePrescription, transcribeAudio, findNearbyFacilities, fastTextResponse, searchMedicalInfo, chatWithGemini } from "./services/geminiService";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, "db.json");

// Initialize DB if not exists
if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, JSON.stringify({
    batches: [],
    marketplace: [],
    trustScores: {},
    incidents: [
      {
        id: "INC-1",
        type: "counterfeit",
        medicineName: "Amoxicillin 500mg",
        batchNumber: "AMX-2023-09",
        location: { lat: 34.0522, lng: -118.2437 },
        details: "Packaging inconsistencies detected. Hologram missing.",
        severity: "critical",
        timestamp: Date.now() - 86400000
      },
      {
        id: "INC-2",
        type: "diversion",
        medicineName: "Oxycodone 10mg",
        batchNumber: "OXY-992-11",
        location: { lat: 40.7128, lng: -74.0060 },
        details: "Product intended for EU market found in US supply chain.",
        severity: "warning",
        timestamp: Date.now() - 172800000
      }
    ]
  }, null, 2));
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  const wss = new WebSocketServer({ server });
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' })); // For Twilio webhooks

  const userStates: Record<string, { state: string; role?: string; mode?: string; lastResult?: any }> = {};

  app.post("/api/whatsapp", async (req, res) => {
    const from = req.body.From || 'simulator';
    let body = req.body.Body?.trim() || '';
    const mediaUrl = req.body.MediaUrl0;
    
    if (!userStates[from]) {
      userStates[from] = { state: 'NEW' };
    }
    
    const user = userStates[from];
    let responseText = '';

    try {
      if (body.toLowerCase() === 'reset' || body.toLowerCase() === 'hi' || body.toLowerCase() === 'hello') {
        user.state = 'NEW';
      }

      // Handle Audio Transcription first if audio is sent
      if (mediaUrl && (req.body.MediaContentType0?.startsWith('audio/') || mediaUrl.startsWith('data:audio/'))) {
        try {
            let audioDataUrl = mediaUrl;
            if (!mediaUrl.startsWith('data:')) {
                const audioResp = await fetch(mediaUrl);
                const arrayBuffer = await audioResp.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                const mimeType = audioResp.headers.get('content-type') || 'audio/ogg';
                audioDataUrl = `data:${mimeType};base64,${buffer.toString('base64')}`;
            }
            body = await transcribeAudio(audioDataUrl);
        } catch (audioErr) {
            console.error("Audio transcription failed:", audioErr);
            // Fallback to empty body or handle error
        }
      }

      if (user.state === 'NEW') {
        responseText = await fastTextResponse("Welcome to MedHAI! 🏥\n\nPlease select your role by replying with a number:\n1️⃣ Patient\n2️⃣ Pharmacist / Seller\n3️⃣ Distributor\n4️⃣ Manufacturer");
        user.state = 'AWAITING_ROLE';
      }
      else if (user.state === 'AWAITING_ROLE') {
        const roles: Record<string, string> = { '1': 'Patient', '2': 'Pharmacist', '3': 'Distributor', '4': 'Manufacturer' };
        if (roles[body]) {
          user.role = roles[body];
          responseText = await fastTextResponse(`Role set to *${user.role}*.\n\nWhat would you like to do?\nReply with a number:\n1️⃣ Verify Medicine Authenticity\n2️⃣ Check Prescription Safety\n3️⃣ Symptom Triage & Translation\n4️⃣ Strip-Cut Inventory Calculator\n5️⃣ Find Nearby Pharmacies\n6️⃣ Medical Information Search`);
          user.state = 'AWAITING_FEATURE';
        } else {
          // Attach Gemini Intelligence for non-menu inputs
          responseText = await chatWithGemini(body);
          responseText += "\n\n---\n*Tip:* You can also select a role by replying with 1, 2, 3, or 4.";
        }
      }
      else if (user.state === 'AWAITING_FEATURE') {
        const modes: Record<string, string> = { '1': 'medicine', '2': 'prescription', '3': 'symptom', '4': 'inventory', '5': 'maps', '6': 'search' };
        if (modes[body]) {
          user.mode = modes[body];
          if (user.mode === 'symptom') {
            responseText = await fastTextResponse("Please describe your symptoms (text or audio), OR send a photo of a medicine label for regional translation.");
          } else if (user.mode === 'maps') {
            responseText = await fastTextResponse("Please share your location or type your city/area to find nearby pharmacies.");
          } else if (user.mode === 'search') {
            responseText = await fastTextResponse("What medical information would you like to search for? (e.g., 'Latest FDA recalls for blood pressure medication')");
          } else {
            responseText = await fastTextResponse("Please send a photo to analyze.");
          }
          user.state = 'AWAITING_INPUT';
        } else {
          // Attach Gemini Intelligence for non-menu inputs
          responseText = await chatWithGemini(body);
          responseText += "\n\n---\n*Tip:* You can also select a feature by replying with 1-6.";
        }
      }
      else if (user.state === 'AWAITING_INPUT') {
        let analysisResult;
        let dataUrl = "";
        
        if (user.mode === 'maps') {
            // Use maps grounding
            const mapsResult = await findNearbyFacilities("pharmacies and hospitals", 0, 0, body); 
            responseText = mapsResult.text;
            if (mapsResult.places && mapsResult.places.length > 0) {
                responseText += "\n\n📍 Links:\n" + mapsResult.places.map((p: any) => p.maps?.uri).filter(Boolean).join("\n");
            }
            user.state = 'AWAITING_FEEDBACK';
            responseText += await fastTextResponse("\n\n---\nWas this helpful? Reply 👍 or 👎");
        } else if (user.mode === 'search') {
            // Use search grounding
            const searchResult = await searchMedicalInfo(body);
            responseText = searchResult;
            user.state = 'AWAITING_FEEDBACK';
            responseText += await fastTextResponse("\n\n---\nWas this search helpful? Reply 👍 or 👎");
        } else {
            if (mediaUrl && !req.body.MediaContentType0?.startsWith('audio/')) {
              if (mediaUrl.startsWith('data:')) {
                dataUrl = mediaUrl;
              } else {
                const imageResp = await fetch(mediaUrl);
                const arrayBuffer = await imageResp.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                const mimeType = imageResp.headers.get('content-type') || 'image/jpeg';
                dataUrl = `data:${mimeType};base64,${buffer.toString('base64')}`;
              }
              
              if (user.mode === 'prescription') {
                analysisResult = await analyzePrescription(dataUrl);
              } else if (user.mode === 'symptom') {
                analysisResult = await analyzeSymptoms("", dataUrl);
              } else {
                analysisResult = await analyzeImage(dataUrl);
              }
            } else if (body && user.mode === 'symptom') {
              analysisResult = await analyzeSymptoms(body, "");
            } else {
              responseText = await fastTextResponse("Please send a valid image or text input.");
              if (req.headers['content-type'] === 'application/json') {
                return res.json({ reply: responseText });
              } else {
                res.set('Content-Type', 'text/xml');
                return res.send(`<?xml version="1.0" encoding="UTF-8"?><Response><Message>${responseText}</Message></Response>`);
              }
            }

            const formattedResponse = formatWhatsAppResponse(analysisResult);
            responseText = await fastTextResponse(formattedResponse);
            user.lastResult = analysisResult;
            user.state = 'AWAITING_FEEDBACK'; 
            responseText += await fastTextResponse("\n\n---\nWas this analysis accurate? Reply 👍 or 👎 to help us improve.");
        }
      }
      else if (user.state === 'AWAITING_FEEDBACK') {
          const nextMenu = "\n\nWhat would you like to do next?\n1️⃣ Verify Medicine\n2️⃣ Check Prescription\n3️⃣ Symptom/Translation\n4️⃣ Strip-Cut Inventory\n5️⃣ Find Nearby Pharmacies\n6️⃣ Medical Search";
          if (body.includes('👍')) {
              responseText = await fastTextResponse("Thank you for your feedback! We're glad it helped." + nextMenu);
          } else if (body.includes('👎')) {
              responseText = await fastTextResponse("Thank you for your feedback. We will use this to improve our AI models." + nextMenu);
          } else {
              responseText = await fastTextResponse(nextMenu);
          }
          user.state = 'AWAITING_FEATURE';
      }
    } catch (error: any) {
      console.error("WhatsApp Bot Error:", error);
      const errorMsg = `Sorry, an error occurred: ${error.message}. Please try again or type 'reset' to start over.`;
      responseText = await fastTextResponse(errorMsg);
      // Don't change the state, allow retry in current state
    }

    if (req.headers['content-type'] === 'application/json') {
      res.json({ reply: responseText });
    } else {
      res.set('Content-Type', 'text/xml');
      res.send(`<?xml version="1.0" encoding="UTF-8"?><Response><Message>${responseText}</Message></Response>`);
    }
  });

  function formatWhatsAppResponse(result: any): string {
    let text = `*MedHAI Analysis Report*\n\n`;
    
    if (result.type === 'medicine' || result.type === 'qa_testing') {
      text += `*Status:* ${result.expiry_status?.toUpperCase() || 'UNKNOWN'}\n`;
      text += `*Counterfeit Risk:* ${(result.counterfeit_risk_score || 0) > 0.5 ? '⚠️ HIGH' : '✅ LOW'}\n`;
      if (result.product_match?.name) text += `*Product:* ${result.product_match.name}\n`;
      
      if (result.generic_recommendation) {
        text += `\n💡 *Generic Alternative:*\n`;
        text += `- Name: ${result.generic_recommendation.generic_name}\n`;
        text += `- Jan Aushadhi: ${result.generic_recommendation.jan_aushadhi_available ? '✅ YES' : '❌ NO'}\n`;
        if (result.generic_recommendation.estimated_price_difference_inr) {
          text += `- Est. Savings: ₹${result.generic_recommendation.estimated_price_difference_inr}\n`;
        }
      }
      
      if (result.pill_count_analysis) {
        text += `\n💊 *Inventory Count:*\n`;
        text += `- Capacity: ${result.pill_count_analysis.total_capacity}\n`;
        text += `- Remaining: ${result.pill_count_analysis.remaining_pills}\n`;
      }
    } 
    else if (result.type === 'prescription') {
      text += `*Prescription Details*\n`;
      if (result.prescription_details?.medications) {
        result.prescription_details.medications.forEach((m: any) => {
          text += `- ${m.name} (${m.dosage}): ${m.frequency}\n`;
        });
      }
      if (result.interactions && result.interactions.length > 0) {
        text += `\n⚠️ *Interactions Found:*\n`;
        result.interactions.forEach((i: any) => {
          text += `- ${i.affected_drugs.join(' + ')}: ${i.severity.toUpperCase()}\n`;
        });
      }
    }
    else if (result.type === 'symptom') {
      if (result.vernacular_translation) {
        text += `🗣️ *Translation (${result.vernacular_translation.language}):*\n`;
        text += `*Name:* ${result.vernacular_translation.translated_name}\n`;
        text += `*Instructions:* ${result.vernacular_translation.translated_instructions}\n`;
        text += `*Side Effects:* ${result.vernacular_translation.translated_side_effects}\n`;
      } else {
        text += `*Triage Level:* ${result.symptom_analysis?.urgency_level?.toUpperCase()}\n`;
        text += `*Suggested Specialist:* ${result.symptom_analysis?.suggested_specialist}\n`;
        text += `\n*Potential Conditions:*\n`;
        result.symptom_analysis?.potential_conditions?.forEach((c: string) => {
          text += `- ${c}\n`;
        });
      }
    }
    
    text += `\n*Action:* ${result.recommended_action}\n`;
    return text;
  }

  const getDB = () => {
    const db = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
    if (!db.incidents) {
      db.incidents = [
        {
          id: "INC-1",
          type: "counterfeit",
          medicineName: "Dolo 650",
          batchNumber: "DL-2023-09",
          location: { lat: 28.7041, lng: 77.1025 }, // Delhi
          details: "Packaging inconsistencies detected. Hologram missing.",
          severity: "critical",
          timestamp: Date.now() - 86400000
        },
        {
          id: "INC-2",
          type: "diversion",
          medicineName: "Shelcal 500",
          batchNumber: "SHL-992-11",
          location: { lat: 19.0760, lng: 72.8777 }, // Mumbai
          details: "Product intended for government hospital found in private pharmacy.",
          severity: "warning",
          timestamp: Date.now() - 172800000
        },
        {
          id: "INC-3",
          type: "counterfeit",
          medicineName: "Augmentin 625 Duo",
          batchNumber: "AUG-445-12",
          location: { lat: 12.9716, lng: 77.5946 }, // Bangalore
          details: "Pill morphology mismatch. Color is slightly off.",
          severity: "critical",
          timestamp: Date.now() - 43200000
        }
      ];
      fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
    }
    return db;
  };
  const saveDB = (data: any) => fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));

  // API Routes
  
  app.get("/api/incidents", (req, res) => {
    const db = getDB();
    res.json(db.incidents || []);
  });

  app.post("/api/incidents", (req, res) => {
    const db = getDB();
    if (!db.incidents) db.incidents = [];
    const newIncident = { ...req.body, id: `INC-${Date.now()}` };
    db.incidents.push(newIncident);
    saveDB(db);
    res.status(201).json(newIncident);
  });

  app.get("/api/stats", (req, res) => {
    const db = getDB();
    const incidents = db.incidents || [];
    const stats = {
      totalAlerts: incidents.length + 124,
      highRiskBatches: incidents.filter((i: any) => i.severity === 'critical').length + 12,
      complianceRate: 98.2,
    };
    res.json(stats);
  });

  // 1. OpenFDA Proxy (to avoid CORS and handle rate limits)
  app.get("/api/fda/drug", async (req, res) => {
    const { name } = req.query;
    try {
      const response = await fetch(`https://api.fda.gov/drug/label.json?search=openfda.brand_name:"${name}"&limit=1`);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch from OpenFDA" });
    }
  });

  app.get("/api/fda/recalls", async (req, res) => {
    const { name } = req.query;
    try {
      const response = await fetch(`https://api.fda.gov/drug/enforcement.json?search=product_description:"${name}"&limit=5`);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recalls from OpenFDA" });
    }
  });

  // 2. Batch Tracking (Blockchain-inspired Ledger)
  app.get("/api/batches", (req, res) => {
    res.json(getDB().batches);
  });

  app.get("/api/batches/:id", (req, res) => {
    const batch = getDB().batches.find((b: any) => b.id === req.params.id);
    if (batch) res.json(batch);
    else res.status(404).json({ error: "Batch not found" });
  });

  app.post("/api/batches", (req, res) => {
    const db = getDB();
    const newBatch = {
      ...req.body,
      id: `BATCH-${Date.now()}`,
      history: [{ event: "Registered", location: "Origin", timestamp: new Date().toISOString(), actor: req.body.manufacturer }],
      trustScore: 100
    };
    db.batches.push(newBatch);
    saveDB(db);
    res.status(201).json(newBatch);
  });

  // 3. Trust Scores
  app.get("/api/trust-scores", (req, res) => {
    res.json(getDB().trustScores);
  });

  // 4. Marketplace
  app.get("/api/marketplace", (req, res) => {
    res.json(getDB().marketplace);
  });

  app.post("/api/marketplace", (req, res) => {
    const db = getDB();
    const newItem = { ...req.body, id: `LIST-${Date.now()}` };
    db.marketplace.push(newItem);
    saveDB(db);
    res.status(201).json(newItem);
  });

  // 5. Sales & Demand Tracking
  app.get("/api/sales", (req, res) => {
    const db = getDB();
    res.json(db.sales || []);
  });

  app.post("/api/sales", (req, res) => {
    const db = getDB();
    if (!db.sales) db.sales = [];
    const newRecords = Array.isArray(req.body) ? req.body : [req.body];
    const recordsWithIds = newRecords.map(r => ({
        ...r,
        id: `SALE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now()
    }));
    db.sales.push(...recordsWithIds);
    saveDB(db);
    res.status(201).json(recordsWithIds);
  });

  app.get("/api/demand-insights", (req, res) => {
    const db = getDB();
    const sales = db.sales || [];
    
    // Simple analysis logic
    const insightsByMedicine: Record<string, any> = {};
    
    sales.forEach((sale: any) => {
        if (!insightsByMedicine[sale.medicineName]) {
            insightsByMedicine[sale.medicineName] = {
                medicineName: sale.medicineName,
                totalQuantity: 0,
                regions: {},
                sellers: {}
            };
        }
        const insight = insightsByMedicine[sale.medicineName];
        insight.totalQuantity += sale.quantity;
        insight.regions[sale.region] = (insight.regions[sale.region] || 0) + sale.quantity;
        insight.sellers[sale.sellerName] = (insight.sellers[sale.sellerName] || 0) + sale.quantity;
    });

    const finalInsights = Object.values(insightsByMedicine).map(insight => {
        const topRegion = Object.entries(insight.regions).sort((a: any, b: any) => b[1] - a[1])[0];
        const topSellers = Object.entries(insight.sellers)
            .sort((a: any, b: any) => b[1] - a[1])
            .slice(0, 3)
            .map(([name, quantity]) => ({ name, quantity: quantity as number }));

        return {
            medicineName: insight.medicineName,
            totalQuantity: insight.totalQuantity,
            region: topRegion ? topRegion[0] : 'Unknown',
            growthRate: Math.floor(Math.random() * 20) + 5, // Mock growth rate
            topSellers,
            recommendation: insight.totalQuantity > 1000 ? "High demand detected. Increase production by 25%." : "Stable demand. Maintain current production levels."
        };
    });

    res.json(finalInsights);
  });

  // WebSocket Presence & Updates
  wss.on("connection", (ws) => {
    ws.on("message", (message) => {
      const data = JSON.parse(message.toString());
      if (data.type === "batch:update") {
        const db = getDB();
        const batchIndex = db.batches.findIndex((b: any) => b.id === data.batchId);
        if (batchIndex !== -1) {
          db.batches[batchIndex].history.push(data.event);
          db.batches[batchIndex].status = data.event.event;
          saveDB(db);
          broadcast({ type: "batch:updated", batch: db.batches[batchIndex] });
        }
      }
    });
  });

  function broadcast(data: any) {
    const payload = JSON.stringify(data);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });
  }

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Nexus Server running on http://localhost:${PORT}`);
  });
}

startServer();
