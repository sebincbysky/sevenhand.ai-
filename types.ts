export enum AppState {
  IDLE = 'IDLE',
  LOADING_MODEL = 'LOADING_MODEL',
  TRACKING = 'TRACKING',
  ERROR = 'ERROR'
}

export interface KeyConfig {
  label: string;
  value: string; // The character to type or action ID
  width?: number; // Relative width (1 is standard key)
  type: 'char' | 'action' | 'spacer';
}

export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

export interface Settings {
  dwellTimeMs: number;
  cursorSmoothing: number;
  showCamera: boolean;
  theme: 'dark' | 'light';
}

export interface GeminiResponse {
  text?: string;
  audioData?: string;
}
