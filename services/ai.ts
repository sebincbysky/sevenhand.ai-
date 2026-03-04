import { GoogleGenAI, Modality } from "@google/genai";

export const getClient = () => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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

let currentAudioContext: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;

export const playAudioBuffer = async (
  audioBuffer: ArrayBuffer,
  onAudioData?: (data: Uint8Array) => void
): Promise<void> => {
  return new Promise((resolve) => {
    try {
      if (currentSource) {
        currentSource.stop();
        currentSource.disconnect();
      }

      if (!currentAudioContext) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        currentAudioContext = new AudioContextClass({ sampleRate: 24000 });
      }

      const int16Data = new Int16Array(audioBuffer);
      const float32Data = new Float32Array(int16Data.length);
      for (let i = 0; i < int16Data.length; i++) {
        float32Data[i] = int16Data[i] / 32768.0;
      }
      const buffer = currentAudioContext.createBuffer(1, float32Data.length, 24000);
      buffer.getChannelData(0).set(float32Data);
      
      const source = currentAudioContext.createBufferSource();
      source.buffer = buffer;
      currentSource = source;

      const analyser = currentAudioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyser.connect(currentAudioContext.destination);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      let animationFrameId: number;
      const updateVisualizer = () => {
        analyser.getByteFrequencyData(dataArray);
        if (onAudioData) onAudioData(dataArray);
        animationFrameId = requestAnimationFrame(updateVisualizer);
      };
      
      source.onended = () => {
        cancelAnimationFrame(animationFrameId);
        if (onAudioData) onAudioData(new Uint8Array(analyser.frequencyBinCount));
        if (currentSource === source) {
          currentSource = null;
        }
        resolve();
      };
      
      source.start(0);
      updateVisualizer();
    } catch (e) {
      console.error("Error playing audio", e);
      resolve();
    }
  });
};

export const getSuggestions = async (text: string): Promise<string[]> => {
  if (!text.trim()) return [];
  try {
    const ai = getClient();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are an autocomplete engine. The user is typing: "${text}". Provide 3 short, likely completions for the entire phrase. Return ONLY a JSON array of strings. Example: ["hello there", "how are you", "help me"]`,
      config: {
        responseMimeType: "application/json",
      }
    });
    const suggestions = JSON.parse(response.text || "[]");
    return Array.isArray(suggestions) ? suggestions.slice(0, 3) : [];
  } catch (error) {
    console.error("Autocomplete Error:", error);
    return [];
  }
};
