import { GoogleGenAI, Type, Schema } from "@google/genai";
import { RiskAssessment, RiskLevel, SafePlace } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * 1. REAL-TIME MONITORING (Fast)
 * Uses gemini-2.5-flash acting as the Core Risk Fusion Engine.
 */
export const assessRisk = async (
  imageBase64: string | null,
  audioBase64: string | null,
  locationContext: string
): Promise<RiskAssessment> => {
  try {
    const parts: any[] = [];

    // System instruction: The Core Risk Fusion Engine
    const systemInstruction = `You are the Core Risk Fusion Engine of SheShield AI.
    Your goal is to protect the user by fusing audio, vision, and context into a single risk score.

    INPUTS:
    - Audio: User voice snippet (detect distress, screaming, crying).
    - Vision: Camera frame (detect aggressive behavior, weapons, desolate areas).
    - Context: ${locationContext} (Time, Location, Deviation).

    FUSION RULES:
    1. High audio distress + major route deviation = DANGEROUS.
    2. Aggressive behavior detected visually = DANGEROUS.
    3. Isolated area at night increases baseline risk.
    4. IF final_risk_score > 70 THEN recommended_action MUST be 'notify_contacts' or higher.
    5. IF final_risk_score > 85 THEN recommended_action MUST be 'full_emergency_mode'.

    OUTPUT:
    Strictly output the JSON object defined in the schema. 
    You must also include the detailed 'audio_analysis' and 'context_analysis' that led to your decision.`;

    if (imageBase64) {
      parts.push({
        inlineData: { mimeType: "image/jpeg", data: imageBase64 },
      });
    }

    if (audioBase64) {
      parts.push({
        inlineData: { mimeType: "audio/webm", data: audioBase64 },
      });
    }

    if (parts.length === 0) {
      return {
        riskLevel: RiskLevel.SAFE,
        score: 0,
        reason: "No sensor data",
        recommendedAction: "none",
        detectedThreats: [],
      };
    }

    parts.push({ text: "Perform multimodal analysis and FUSE inputs into a final risk assessment." });

    const schema: Schema = {
      type: Type.OBJECT,
      properties: {
        final_risk_score: { type: Type.INTEGER, description: "0-100 score" },
        risk_level: {
          type: Type.STRING,
          enum: ["safe", "uncertain", "suspicious", "dangerous", "critical"],
        },
        primary_risk_drivers: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "e.g., audio_stress, route_deviation",
        },
        recommended_action: {
          type: Type.STRING,
          enum: [
            "none",
            "ask_user_confirmation",
            "notify_contacts",
            "start_audio_recording",
            "start_video_stream",
            "full_emergency_mode",
          ],
        },
        explanation: { type: Type.STRING },
        // detailed analyses included for UI diagnostics
        audio_analysis: {
          type: Type.OBJECT,
          properties: {
            emotional_state: { type: Type.STRING },
            distress_score: { type: Type.INTEGER },
            keywords_detected: { type: Type.ARRAY, items: { type: Type.STRING } },
            tone_analysis: { type: Type.STRING }
          },
          required: ["emotional_state", "distress_score", "keywords_detected", "tone_analysis"]
        },
        context_analysis: {
          type: Type.OBJECT,
          properties: {
            contextual_factors: {
              type: Type.OBJECT,
              properties: {
                time_risk: { type: Type.STRING },
                location_risk: { type: Type.STRING },
                route_deviation: { type: Type.STRING },
                movement_pattern: { type: Type.STRING }
              },
              required: ["time_risk", "location_risk", "route_deviation", "movement_pattern"]
            },
            context_risk_score: { type: Type.INTEGER },
            reasoning: { type: Type.STRING }
          },
          required: ["contextual_factors", "context_risk_score", "reasoning"]
        }
      },
      required: ["final_risk_score", "risk_level", "primary_risk_drivers", "recommended_action", "explanation", "audio_analysis", "context_analysis"],
    };

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.1, // Very low temp for strict rule adherence
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    const rawData = JSON.parse(text);

    // Map strict JSON output to App types
    return {
      riskLevel: rawData.risk_level.toUpperCase() as RiskLevel,
      score: rawData.final_risk_score,
      reason: rawData.explanation,
      recommendedAction: rawData.recommended_action.replace(/_/g, ' '),
      detectedThreats: rawData.primary_risk_drivers,
      audioAnalysis: rawData.audio_analysis,
      contextAnalysis: rawData.context_analysis
    };

  } catch (error) {
    console.error("Risk Assessment Error:", error);
    return {
      riskLevel: RiskLevel.UNCERTAIN,
      score: 15,
      reason: "Fusion engine unavailable",
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
    
    const prompt = `
    You are an AI report generator for a women safety system.

    Task:
    Convert raw logs into a clean, human-readable incident summary for authorities.

    Inputs:
    - Timestamps
    - GPS trace
    - Audio transcript highlights
    - Vision threat events
    - Gemini risk fusion outputs
    - Actions taken by the system

    Raw Logs provided below:
    ${logs.join('\n')}

    Output format:

    INCIDENT REPORT
    -----------------------------
    Time of Incident: <date + time>
    Location Summary: <area + route deviation>
    Detected Threats:
    - <threat 1>
    - <threat 2>
    - ...

    Evidence Collected:
    - Audio clips: <count + summary>
    - Video frames: <count + objects detected>
    - Number plate: <if any>

    AI Analysis Summary:
    <2–3 lines explanation>

    Recommended Next Steps:
    <clear practical next step>

    No JSON. No extra commentary.
    Just the clean formatted report.
    `;

    parts.push({ text: prompt });

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