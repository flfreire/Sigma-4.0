
import { GoogleGenAI } from "@google/genai";
import { Equipment, PredictiveAnalysis, Quote, Partner, User } from '../types';

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
      // FIX: Removed deprecated `responseMimeType` config. The prompt already instructs the model to return JSON.
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

export const generateQuoteEmailBody = async (quote: Quote, partner: Partner, currentUser: User, language: 'pt' | 'en'): Promise<string> => {
    const ai = getAiClient();
    if (!ai) {
        throw new Error("Gemini API key not configured. The AI Assistant is unavailable.");
    }

    const languageInstruction = language === 'pt' ? 'em Português do Brasil' : 'in English';

    const itemsList = quote.items.map(item => `- ${item.quantity}x ${item.description}`).join('\n');

    const prompt = `
        Act as a procurement professional from SIGMA 4.0. Write a clear and professional email to request a price quote. The email body must be entirely ${languageInstruction}. Do not include a subject line.

        Here is the information for the email:
        - Recipient Name: ${partner.contactPerson}
        - Recipient Company: ${partner.name}
        - Sender Name: ${currentUser.name}
        - Sender Company: SIGMA 4.0
        - Quote Title/Subject: ${quote.title}
        - General Description: ${quote.description}
        - Items to be quoted:
        ${itemsList}
        - Attachments: The email should mention that there are attachments if the quote has them. This quote has ${quote.attachments?.length || 0} attachments.

        Start the email with a polite greeting (e.g., "Prezado(a) ${partner.contactPerson}," or "Dear ${partner.contactPerson},").
        Clearly state the purpose of the email is to request a quotation for the listed items/services.
        Include the detailed list of items.
        If there are attachments, mention them.
        End with a professional closing (e.g., "Atenciosamente," or "Sincerely,") followed by the sender's name and company.
        Do not add any text before the greeting or after the signature.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        
        return response.text.trim();

    } catch (error) {
        console.error("Error generating quote email from Gemini:", error);
        if (error instanceof Error && error.message.includes("API key not valid")) {
            throw new Error("The configured Gemini API key is invalid. Please check your configuration.");
        }
        throw new Error("Failed to generate quote email. The AI service may be temporarily unavailable.");
    }
};
