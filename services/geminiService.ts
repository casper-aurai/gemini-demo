
import { GoogleGenAI, Type } from "@google/genai";
import { BOMItem, ProjectTask } from '../types';

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

/**
 * Analyzes a technical sketch or photo.
 * Uses gemini-2.5-flash for multimodal reasoning.
 */
export const analyzeSketch = async (
    history: { role: string; parts: { text?: string; inlineData?: { mimeType: string; data: string } }[] }[], 
    newMessage: string, 
    newImages?: string[],
    projectContext?: string
) => {
  try {
    const systemInstruction = `You are a Chief Engineer and Master Constructor. The user is an expert veteran. 
    ${projectContext ? `CURRENT PROJECT CONTEXT: ${projectContext}` : ''}
    Do not summarize basics. Analyze uploaded sketches/schematics for failure points, electrical errors, or structural weaknesses. Provide high-level technical feedback, calculation verification, and fabrication advice.`;

    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      history: history,
      config: {
        systemInstruction: systemInstruction,
      }
    });

    const parts: any[] = [{ text: newMessage }];
    
    // Add images if present
    if (newImages && newImages.length > 0) {
      newImages.forEach(base64 => {
        const cleanBase64 = base64.split(',')[1];
        parts.push({
          inlineData: {
            mimeType: 'image/jpeg',
            data: cleanBase64
          }
        });
      });
    }

    const result = await chat.sendMessage({ 
        content: { parts } 
    });
    return result.text;
  } catch (error) {
    console.error("Analysis failed:", error);
    throw error;
  }
};

/**
 * Generates a structured Bill of Materials from a description.
 */
export const generateBOM = async (description: string): Promise<BOMItem[]> => {
  const schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        itemName: { type: Type.STRING, description: "Name of the component or material" },
        quantity: { type: Type.NUMBER, description: "Exact quantity needed" },
        specifications: { type: Type.STRING, description: "Technical specs (dimensions, voltage, tolerance, material grade)" },
        category: { type: Type.STRING, description: "Category (e.g., Electronics, Hydraulics, Lumber, Masonry)" },
        unitCost: { type: Type.NUMBER, description: "Estimated unit cost in USD. Set to 0 if unknown." },
        notes: { type: Type.STRING, description: "Fabrication notes or part numbers" }
      },
      required: ["itemName", "quantity", "specifications", "category"],
    }
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate a comprehensive Bill of Materials (BOM) for: ${description}. Include all necessary hardware, fasteners, and consumables. Group by category. Estimate unit costs where reasonable.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      }
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text) as BOMItem[];
  } catch (error) {
    console.error("BOM generation failed:", error);
    throw error;
  }
};

/**
 * Generates a fabrication protocol (list of tasks).
 */
export const generateOperations = async (description: string): Promise<ProjectTask[]> => {
    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                id: { type: Type.STRING },
                text: { type: Type.STRING, description: "Actionable fabrication step" },
                status: { type: Type.STRING, enum: ['pending'] }
            },
            required: ["text", "status"]
        }
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Create a step-by-step professional fabrication protocol for: ${description}. Break down into logical phases (Prep, Fabrication, Assembly, Wiring, Testing). Return as a flat list of actionable tasks.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema
            }
        });
        
        const text = response.text;
        if (!text) return [];
        const tasks = JSON.parse(text) as any[];
        return tasks.map((t, i) => ({
            id: Date.now().toString() + i,
            text: t.text,
            status: 'pending'
        }));
    } catch (error) {
        console.error("Operations generation failed", error);
        throw error;
    }
}
