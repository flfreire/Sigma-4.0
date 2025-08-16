
import { GoogleGenAI } from "@google/genai";
import { Equipment, PredictiveAnalysis } from '../types';

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    // Return null or throw a specific error if the key is not available.
    return null;
  }
  return new GoogleGenAI({ apiKey });
};


export const getPredictiveMaintenanceAnalysis = async (equipment: Equipment, language: 'pt' | 'en'): Promise<PredictiveAnalysis> => {
  const ai = getAiClient();
  if (!ai) {
    throw new Error("Gemini API key not configured. The AI Assistant is unavailable.");
  }

  const languageInstruction = language === 'pt' ? 'em Português do Brasil' : 'in English';

  const prompt = `
    Analyze the following industrial equipment data and provide a predictive maintenance assessment.

    Equipment Data:
    - Name: ${equipment.name}
    - Type: ${equipment.type}
    - Installation Date: ${equipment.installDate}
    - Total Usage Hours: ${equipment.usageHours}
    - Current Status: ${equipment.status}
    - Maintenance History: ${JSON.stringify(equipment.maintenanceHistory, null, 2)}

    Based on this data, act as an expert industrial maintenance engineer. Provide your analysis in a JSON object format. All text content within the JSON object must be ${languageInstruction}. The JSON object must have the following three keys: "healthAnalysis", "nextMaintenanceRecommendation", and "potentialRisks".
    - "healthAnalysis": A brief paragraph summarizing the equipment's current condition.
    - "nextMaintenanceRecommendation": A specific, actionable recommendation for the next maintenance schedule (e.g., "Schedule preventive maintenance within the next 150 usage hours or by YYYY-MM-DD.").
    - "potentialRisks": An array of strings, where each string is a potential risk or failure mode to watch out for.

    Do not include any text outside of the JSON object.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const jsonStr = response.text.trim();
    const parsedData = JSON.parse(jsonStr) as PredictiveAnalysis;
    return parsedData;

  } catch (error) {
    console.error("Error fetching predictive analysis from Gemini:", error);
    // Forward a more generic error to the user
    if (error instanceof Error && error.message.includes("API key not valid")) {
        throw new Error("The configured Gemini API key is invalid. Please check your configuration.");
    }
    throw new Error("Failed to get predictive analysis. The service may be temporarily unavailable.");
  }
};