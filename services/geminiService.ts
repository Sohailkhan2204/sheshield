import { GoogleGenAI, Type, Schema } from "@google/genai";
import { RiskAssessment, RiskLevel, SafePlace } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * 1. REAL-TIME MONITORING (Fast)
 * Uses gemini-2.5-flash for multimodal analysis.
 */
export const assessRisk = async (
  imageBase64: string | null,
  audioBase64: string | null,
  locationContext: string
): Promise<RiskAssessment> => {
  try {
    const parts: any[] = [];

    // System instruction for the safety engine
    const systemInstruction = `You are SheShield AI. Analyze the inputs for immediate threats to a woman's safety. 
    Context: ${locationContext}.
    Detect: shouting, crying, glass breaking, following behavior, aggressive men, desolate areas.
    Output JSON only.`;

    if (imageBase64) {
      parts.push({
        inlineData: { mimeType: "image/jpeg", data: imageBase64 },
      });
    }

    if (audioBase64) {
      // Assuming raw PCM or WAV is converted to base64, or WebM
      parts.push({
        inlineData: { mimeType: "audio/webm", data: audioBase64 },
      });
    }

    if (parts.length === 0) {
      return {
        riskLevel: RiskLevel.SAFE,
        score: 0,
        reason: "No sensor data",
        recommendedAction: "Standby",
        detectedThreats: [],
      };
    }

    parts.push({ text: "Assess current safety risk." });

    const schema: Schema = {
      type: Type.OBJECT,
      properties: {
        riskLevel: {
          type: Type.STRING,
          enum: ["SAFE", "CAUTION", "DANGER", "CRITICAL"],
        },
        score: { type: Type.INTEGER },
        reason: { type: Type.STRING },
        recommendedAction: { type: Type.STRING },
        detectedThreats: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
      },
      required: ["riskLevel", "score", "reason", "recommendedAction", "detectedThreats"],
    };

    // Use gemini-2.5-flash for reliability and multimodal support
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.2, // Low temperature for consistent safety checks
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as RiskAssessment;

  } catch (error) {
    console.error("Risk Assessment Error:", error);
    // Fallback safe state on error
    return {
      riskLevel: RiskLevel.CAUTION,
      score: 10,
      reason: "Analysis service unavailable",
      recommendedAction: "Stay alert",
      detectedThreats: ["System offline"],
    };
  }
};

/**
 * 2. SAFE HAVEN FINDER (Grounding)
 * Uses gemini-2.5-flash with googleMaps tool.
 */
export const findSafePlaces = async (lat: number, lng: number): Promise<SafePlace[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Find the nearest open police stations, hospitals, or 24/7 well-lit convenience stores suitable for a woman seeking safety.",
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: { latitude: lat, longitude: lng },
          },
        },
      },
    });

    // Extracting grounding chunks to form a usable list
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const places: SafePlace[] = [];
    
    chunks.forEach((chunk) => {
        if (chunk.maps) {
            places.push({
                name: chunk.maps.title || "Safe Location",
                address: "View on Map",
                distance: "Nearby",
                type: "Safe Haven",
                uri: chunk.maps.uri
            });
        }
    });

    return places.length > 0 ? places : [
        { name: "Emergency Services", address: "Dial 911/112", distance: "N/A", type: "Emergency" }
    ];

  } catch (error) {
    console.error("Safe Place Search Error:", error);
    return [];
  }
};

/**
 * 3. INCIDENT REPORTING (Thinking Mode)
 * Uses gemini-3-pro-preview with thinking budget for detailed analysis.
 */
export const generateIncidentReport = async (
  logs: string[],
  lastImage: string | null
): Promise<string> => {
  try {
    const parts: any[] = [];
    if (lastImage) {
        parts.push({ inlineData: { mimeType: "image/jpeg", data: lastImage }});
    }
    parts.push({ text: `Generate a professional security incident report based on these logs: \n${logs.join('\n')}. Include a summary, timeline, and recommended future precautions.` });

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: { parts },
      config: {
        thinkingConfig: { thinkingBudget: 1024 }, // Enable thinking for reasoning
      }
    });

    return response.text || "Could not generate report.";
  } catch (error) {
    console.error("Reporting Error:", error);
    return "Error generating report.";
  }
};