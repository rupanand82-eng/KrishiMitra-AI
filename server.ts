import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase payload limit for base64 image uploads
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Lazy initialisation of Google GenAI SDK
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Helper to standardise error responses
function handleError(res: express.Response, error: any, context: string) {
  console.error(`[Error in ${context}]:`, error);
  res.status(500).json({
    error: error.message || "An unexpected error occurred",
    context,
  });
}

// Retry and fallback helpers to handle transient 503 or model unavailability errors
async function generateContentWithRetry(params: {
  model?: string;
  contents: any;
  config?: any;
}): Promise<any> {
  const ai = getAI();
  const primary = params.model || "gemini-3.5-flash";
  
  // Try models in cascade sequence: primary -> stable flash -> lite flash
  const modelsToTry = [primary];
  if (primary !== "gemini-flash-latest") {
    modelsToTry.push("gemini-flash-latest");
  }
  if (primary !== "gemini-3.1-flash-lite") {
    modelsToTry.push("gemini-3.1-flash-lite");
  }

  let lastError: any = null;

  for (const modelName of modelsToTry) {
    const maxRetries = 2;
    let delay = 500;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await ai.models.generateContent({
          model: modelName,
          contents: params.contents,
          config: params.config,
        });
      } catch (error: any) {
        lastError = error;
        const errorMsg = String(error?.message || "");
        const is503 = error?.status === 503 || 
                      error?.code === 503 || 
                      error?.statusCode === 503 ||
                      errorMsg.includes("503") ||
                      errorMsg.toLowerCase().includes("unavailable") ||
                      errorMsg.toLowerCase().includes("high demand") ||
                      errorMsg.toLowerCase().includes("overloaded");

        if (is503 && attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= 1.5;
        } else {
          break;
        }
      }
    }
  }
  
  throw lastError || new Error("All models failed to generate content");
}

async function sendChatMessageWithRetry(chatParams: {
  history: any[];
  systemInstruction: string;
  message: string;
}): Promise<any> {
  const ai = getAI();
  const modelsToTry = ["gemini-3.5-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];
  let lastError: any = null;

  for (const modelName of modelsToTry) {
    const maxRetries = 2;
    let delay = 500;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const chat = ai.chats.create({
          model: modelName,
          history: chatParams.history,
          config: {
            systemInstruction: chatParams.systemInstruction,
          },
        });
        return await chat.sendMessage({ message: chatParams.message });
      } catch (error: any) {
        lastError = error;
        const errorMsg = String(error?.message || "");
        const is503 = error?.status === 503 || 
                      error?.code === 503 || 
                      error?.statusCode === 503 ||
                      errorMsg.includes("503") ||
                      errorMsg.toLowerCase().includes("unavailable") ||
                      errorMsg.toLowerCase().includes("high demand") ||
                      errorMsg.toLowerCase().includes("overloaded");

        if (is503 && attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= 1.5;
        } else {
          break;
        }
      }
    }
  }

  throw lastError || new Error("All chat models failed");
}

// ==========================================
// 1. SMART CROP RECOMMENDATION ENDPOINT
// ==========================================
app.post("/api/gemini/crop-recommendation", async (req, res) => {
  try {
    const ai = getAI();
    const {
      district,
      village,
      soilType,
      soilPh,
      nitrogen,
      phosphorus,
      potassium,
      groundwaterDepth,
      irrigationAvailable,
      farmSize,
      language = "english",
    } = req.body;

    const prompt = `You are KrishiMitra AI, a master agricultural scientific researcher.
Recommend the top 5 most suitable crops to plant based on these parameters in India:
- Location: Village ${village}, District ${district}
- Soil Type: ${soilType}
- Soil pH: ${soilPh || "Not tested"}
- NPK values (mg/kg): Nitrogen: ${nitrogen || "N/A"}, Phosphorus: ${phosphorus || "N/A"}, Potassium: ${potassium || "N/A"}
- Groundwater Depth: ${groundwaterDepth || "N/A"} meters
- Irrigation Available: ${irrigationAvailable ? "Yes" : "No"}
- Farm Size: ${farmSize || "N/A"} acres

Provide scientific crops with high profitability, specific water and fertilizer management schedules, estimated market yield and pricing, risks, and best sowing windows.
Write all names and summaries in ${language}.`;

    const response = await generateContentWithRetry({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendations: {
              type: Type.ARRAY,
              description: "Top 5 recommended crops and their parameters",
              items: {
                type: Type.OBJECT,
                properties: {
                  cropName: { type: Type.STRING, description: "Name of the crop" },
                  confidence: { type: Type.INTEGER, description: "Suitability confidence percentage (0-100)" },
                  expectedYield: { type: Type.STRING, description: "Expected yield (e.g., '12-15 quintals per acre')" },
                  profitPrediction: { type: Type.STRING, description: "Estimated profit prediction per acre in INR" },
                  waterRequirement: { type: Type.STRING, description: "Water intensity and volume requirements" },
                  fertilizerRequirement: { type: Type.STRING, description: "Recommended NPK & organic fertilizer dosages" },
                  bestSowingDate: { type: Type.STRING, description: "Optimal sowing date range or month" },
                  riskLevel: { type: Type.STRING, description: "Risk classification: Low, Medium, High" },
                  riskDescription: { type: Type.STRING, description: "Key risks (pests, water scarcity, frost, etc.)" },
                  marketDemand: { type: Type.STRING, description: "Market demand trend (High, stable, etc.)" },
                  expectedSellingPrice: { type: Type.STRING, description: "Expected selling price range per quintal" },
                },
                required: [
                  "cropName",
                  "confidence",
                  "expectedYield",
                  "profitPrediction",
                  "waterRequirement",
                  "fertilizerRequirement",
                  "bestSowingDate",
                  "riskLevel",
                  "riskDescription",
                  "marketDemand",
                  "expectedSellingPrice",
                ],
              },
            },
          },
          required: ["recommendations"],
        },
      },
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error) {
    handleError(res, error, "crop-recommendation");
  }
});

// ==========================================
// 2. AI CROP DOCTOR ENDPOINT (VISION/DESCRIPTION)
// ==========================================
app.post("/api/gemini/crop-doctor", async (req, res) => {
  try {
    const ai = getAI();
    const { imageBase64, mimeType, voiceText, description, language = "english" } = req.body;

    let contents: any[] = [];
    let imagePrompt = `You are KrishiMitra AI Crop Doctor, an advanced expert plant pathologist.`;

    if (imageBase64 && mimeType) {
      contents.push({
        inlineData: {
          mimeType: mimeType,
          data: imageBase64,
        },
      });
      imagePrompt += ` Analyze this plant/leaf/fruit image to diagnose if there is any disease, infestation, or nutritional deficiency.`;
    }

    const textualClues = [
      voiceText ? `User described by voice: "${voiceText}"` : null,
      description ? `User described by text: "${description}"` : null,
    ]
      .filter(Boolean)
      .join("\n");

    if (textualClues) {
      imagePrompt += ` Use these symptoms/clues described by the farmer:\n${textualClues}\n`;
    } else if (!imageBase64) {
      return res.status(400).json({ error: "Please provide either an image, voice text, or text description of the crop symptoms." });
    }

    imagePrompt += ` Provide an accurate diagnosis containing:
- Disease Name (or healthy status)
- Diagnosis Confidence Score (0-100)
- Severity Level (Low, Medium, High, Critical)
- Cause of disease (fungus, bacteria, virus, pests, or nutrient deficiency)
- Symptoms list
- Organic Solution (natural/eco-friendly control methods)
- Chemical Solution (appropriate fungicides/pesticides with safe usage tips)
- Prevention Tips (long term soil/crop management)
- Healthy vs Infected comparison: Describe what a healthy version looks like compared to this.

Provide all explanations and suggestions in ${language}.`;

    contents.push(imagePrompt);

    const response = await generateContentWithRetry({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            diseaseName: { type: Type.STRING },
            confidence: { type: Type.INTEGER },
            severity: { type: Type.STRING },
            cause: { type: Type.STRING },
            symptoms: { type: Type.ARRAY, items: { type: Type.STRING } },
            organicSolution: { type: Type.STRING },
            chemicalSolution: { type: Type.STRING },
            preventionTips: { type: Type.ARRAY, items: { type: Type.STRING } },
            healthyComparison: { type: Type.STRING },
          },
          required: [
            "diseaseName",
            "confidence",
            "severity",
            "cause",
            "symptoms",
            "organicSolution",
            "chemicalSolution",
            "preventionTips",
            "healthyComparison",
          ],
        },
      },
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error) {
    handleError(res, error, "crop-doctor");
  }
});

// ==========================================
// 3. VOICE & CHAT ASSISTANT (CONVERSATIONAL)
// ==========================================
app.post("/api/gemini/chat", async (req, res) => {
  try {
    const ai = getAI();
    const { history, message, language = "english", farmerProfile } = req.body;

    const systemInstruction = `You are KrishiMitra AI, a compassionate, hyper-local agricultural voice and text assistant for farmers in India.
Your mission is to provide clear, actionable, and scientific agricultural answers to help marginal farmers increase yields, adapt to climate changes, and cut costs.
${farmerProfile ? `The active farmer profile:
- Name: ${farmerProfile.name}
- Location: Village ${farmerProfile.village}, District ${farmerProfile.district}
- Soil Type: ${farmerProfile.soilType}
- Soil pH: ${farmerProfile.soilPh || "Unknown"}
- Farm Size: ${farmerProfile.farmSize || "Unknown"} acres` : ""}

Guidelines:
1. Always respond in the selected language: ${language}.
2. Keep answers professional, friendly, empathetic, and scannable. Use clear bullet points if giving lists.
3. Keep answers concise so they can easily be read aloud or sent as SMS.
4. Support inquiries about crop selection, irrigation times, fertilizer calculations, pest alerts, nearby markets, and government schemes.`;

    const chatHistory = (history || []).map((msg: any) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));

    const chatResult = await sendChatMessageWithRetry({
      history: chatHistory,
      systemInstruction,
      message,
    });

    res.json({
      reply: chatResult.text,
    });
  } catch (error) {
    handleError(res, error, "chat-assistant");
  }
});

// ==========================================
// 4. SMS ADVISORY GENERATOR
// ==========================================
app.post("/api/gemini/sms-advisory", async (req, res) => {
  try {
    const ai = getAI();
    const { type, language = "english", farmerName, details } = req.body;

    const prompt = `Create a highly concise, native language SMS alert for an Indian farmer.
Farmer Name: ${farmerName}
Alert Type: ${type} (Options: Rain Alert, Pest Alert, Irrigation Schedule, Fertilizer Reminder, Harvest Reminder)
Context/Details: ${JSON.stringify(details)}
Language: ${language}

The SMS must fit inside 160 characters (excluding standard links), be highly direct, urgent, and include exact remedial action. Provide the translated text and a short summary.`;

    const response = await generateContentWithRetry({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            smsText: { type: Type.STRING, description: "The exact 160-char SMS message in native language" },
            englishTranslation: { type: Type.STRING, description: "English translation of the message" },
            actionRequired: { type: Type.STRING, description: "Immediate action required by the farmer" },
          },
          required: ["smsText", "englishTranslation", "actionRequired"],
        },
      },
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error) {
    handleError(res, error, "sms-advisory");
  }
});

// ==========================================
// 5. FARM HEALTH SCORE GENERATOR
// ==========================================
app.post("/api/gemini/farm-health", async (req, res) => {
  try {
    const ai = getAI();
    const { soilPh, nitrogen, phosphorus, potassium, groundwaterDepth, weatherAlertsCount, cropHealthReport } = req.body;

    const prompt = `Analyze the health metrics of an Indian farm and calculate an agricultural health score out of 100.
Metrics:
- Soil pH: ${soilPh || "N/A"}
- Nitrogen: ${nitrogen || "N/A"} mg/kg (optimal is ~280-560)
- Phosphorus: ${phosphorus || "N/A"} mg/kg (optimal is ~23-57)
- Potassium: ${potassium || "N/A"} mg/kg (optimal is ~140-280)
- Groundwater Depth: ${groundwaterDepth || "N/A"} meters
- Active Weather Alerts: ${weatherAlertsCount || 0}
- Recent crop observations: "${cropHealthReport || "None"}"

Calculate a score and compile 4 precise diagnostic subsections: Soil Health, Water Security, Climate Risk, and Crop Condition. Suggest 3 high-impact improvement suggestions.`;

    const response = await generateContentWithRetry({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER, description: "Total agricultural health score (0-100)" },
            breakdown: {
              type: Type.OBJECT,
              properties: {
                soilScore: { type: Type.INTEGER },
                waterScore: { type: Type.INTEGER },
                climateScore: { type: Type.INTEGER },
                cropScore: { type: Type.INTEGER },
              },
              required: ["soilScore", "waterScore", "climateScore", "cropScore"],
            },
            diagnostics: {
              type: Type.OBJECT,
              properties: {
                soilAnalysis: { type: Type.STRING },
                waterAnalysis: { type: Type.STRING },
                climateAnalysis: { type: Type.STRING },
                cropAnalysis: { type: Type.STRING },
              },
              required: ["soilAnalysis", "waterAnalysis", "climateAnalysis", "cropAnalysis"],
            },
            actionPlan: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Three targeted high-impact items to improve the farm score",
            },
          },
          required: ["score", "breakdown", "diagnostics", "actionPlan"],
        },
      },
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error) {
    handleError(res, error, "farm-health");
  }
});

// ==========================================
// 6. HEALTH CHECK
// ==========================================
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "KrishiMitra AI Server" });
});

// ==========================================
// VITE DEV SERVER & STATIC FILES COMPILING
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Inject Vite Dev Server as a middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("[Dev Mode] Mounted Vite dev middleware.");
  } else {
    // Serve production static assets from dist
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("[Production Mode] Serving static assets from /dist.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[KrishiMitra AI] Server listening on http://localhost:${PORT}`);
  });
}

startServer();
