import { GoogleGenAI, Modality } from "@google/genai";

export const getClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

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

export const playAudioBuffer = async (
  audioBuffer: ArrayBuffer,
  onAudioData?: (data: Uint8Array) => void
): Promise<void> => {
  return new Promise((resolve) => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass({ sampleRate: 24000 });
      const int16Data = new Int16Array(audioBuffer);
      const float32Data = new Float32Array(int16Data.length);
      for (let i = 0; i < int16Data.length; i++) {
        float32Data[i] = int16Data[i] / 32768.0;
      }
      const buffer = audioContext.createBuffer(1, float32Data.length, 24000);
      buffer.getChannelData(0).set(float32Data);
      
      const source = audioContext.createBufferSource();
      source.buffer = buffer;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyser.connect(audioContext.destination);

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

export const askMia = async (prompt: string): Promise<string> => {
  try {
    const ai = getClient();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are Mia AI, a helpful, concise, and friendly AI assistant. Keep your answers relatively short so they can be easily read and spoken aloud. The user says: "${prompt}"`,
    });
    return response.text || "I'm not sure how to respond to that.";
  } catch (error) {
    console.error("Mia AI Error:", error);
    return "Sorry, I encountered an error.";
  }
};
