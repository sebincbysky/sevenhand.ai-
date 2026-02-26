import { GoogleGenAI, Modality } from "@google/genai";

const getClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates speech from text using Gemini TTS.
 */
export const generateSpeech = async (text: string): Promise<ArrayBuffer | null> => {
  if (!text.trim()) return null;
  
  try {
    const ai = getClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      const binaryString = atob(base64Audio);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes.buffer;
    }
    return null;
  } catch (error) {
    console.error("TTS Error:", error);
    throw error;
  }
};

/**
 * Analyzes a video frame (image) to understand context or suggest text.
 */
export const analyzeFrame = async (base64Image: string): Promise<string> => {
  try {
    const ai = getClient();
    
    // Clean base64 string if it contains header
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanBase64
            }
          },
          {
            text: "Analyze this image and describe what is happening in a single concise sentence suitable for a disabled user trying to communicate about their environment."
          }
        ]
      }
    });

    return response.text || "Could not analyze the scene.";
  } catch (error) {
    console.error("Vision Error:", error);
    return "Error analyzing scene.";
  }
};

/**
 * Plays the raw audio buffer.
 */
export const playAudioBuffer = async (audioBuffer: ArrayBuffer) => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const audioContext = new AudioContextClass();
    const decodedBuffer = await audioContext.decodeAudioData(audioBuffer);
    const source = audioContext.createBufferSource();
    source.buffer = decodedBuffer;
    source.connect(audioContext.destination);
    source.start(0);
  } catch (e) {
    console.error("Error playing audio", e);
  }
};
