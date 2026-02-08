import { GoogleGenAI, Type } from "@google/genai";
import { GeminiAnalysisResult } from "../types";

export const analyzePlaylistVibe = async (tracks: string[]): Promise<GeminiAnalysisResult> => {
  if (!process.env.API_KEY) {
    throw new Error("Gemini API Key is missing");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Limit to first 30 tracks to avoid token limits and latency
  const trackListString = tracks.slice(0, 30).join(", ");
  
  const prompt = `Analyze the following list of songs from a Spotify playlist and describe the overall "vibe", mood, and energy. Provide 3 short tags (e.g., "Upbeat", "Melancholic", "Gym") and 3 suggested artists that are similar but NOT in the list.
  
  Songs: ${trackListString}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            vibe: { type: Type.STRING, description: "A 2-sentence description of the playlist's mood and musical style." },
            tags: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "3 short stylistic tags"
            },
            suggestedArtists: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "3 artists similar to the playlist vibe"
            }
          }
        }
      }
    });

    const resultText = response.text;
    if (!resultText) throw new Error("No response from Gemini");

    return JSON.parse(resultText) as GeminiAnalysisResult;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};