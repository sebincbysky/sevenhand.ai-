import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, Keyboard as KeyboardIcon, ArrowLeft } from 'lucide-react';
import Webcam from 'react-webcam';
import { useHandTracking } from '../hooks/useHandTracking';
import { Keyboard } from './Keyboard';
import { askMia, generateSpeech, playAudioBuffer } from '../services/ai';

type AIState = 'idle' | 'listening' | 'processing' | 'speaking';

const VoiceVisualizer: React.FC<{ state: AIState, audioData: Uint8Array | null }> = ({ state, audioData }) => {
  let volume = 0;
  if (state === 'speaking' && audioData) {
    const sum = audioData.reduce((a, b) => a + b, 0);
    volume = sum / audioData.length;
  }

  const scale = state === 'speaking' ? 1 + (volume / 255) * 1.2 : 1;

  return (
    <div className="flex items-center justify-center h-64 w-full relative overflow-hidden bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      {/* Status Text */}
      <div className="absolute top-4 left-4 text-sm font-bold uppercase tracking-widest text-black/40">
        {state === 'idle' && 'Ready'}
        {state === 'listening' && 'Listening...'}
        {state === 'processing' && 'Thinking...'}
        {state === 'speaking' && 'Speaking'}
      </div>

      {/* The Orb */}
      <div 
        className={`
          transition-all duration-75 ease-out
          ${state === 'idle' ? 'w-24 h-24 rounded-full bg-black' : ''}
          ${state === 'listening' ? 'w-24 h-24 rounded-full bg-black/80 scale-110 animate-pulse' : ''}
          ${state === 'processing' ? 'w-20 h-20 rounded-none bg-black animate-spin' : ''}
          ${state === 'speaking' ? 'w-24 h-24 rounded-full bg-black' : ''}
        `}
        style={state === 'speaking' ? { 
          transform: `scale(${scale})`,
          boxShadow: `0 0 0 ${volume * 0.4}px rgba(0,0,0,0.1), 0 0 0 ${volume * 0.8}px rgba(0,0,0,0.05)`
        } : {}}
      />
    </div>
  );
}

export const MiaApp: React.FC = () => {
  const [mode, setMode] = useState<'voice' | 'hand'>('voice');
  const [inputText, setInputText] = useState('');
  const [aiState, setAiState] = useState<AIState>('idle');
  const [isListening, setIsListening] = useState(false);
  const [audioData, setAudioData] = useState<Uint8Array | null>(null);
  
  const webcamRef = useRef<Webcam>(null);
  const { isReady, cursorPosition } = useHandTracking(webcamRef, mode === 'hand');
  const navigate = useNavigate();
  
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('');
        setInputText(transcript);
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  useEffect(() => {
    if (!isListening && inputText && mode === 'voice' && aiState === 'idle') {
      handleAskMia(inputText);
    }
  }, [isListening]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setInputText('');
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const handleAskMia = async (text: string) => {
    if (!text.trim()) return;
    setAiState('processing');
    
    try {
      const reply = await askMia(text);
      const buffer = await generateSpeech(reply);
      if (buffer) {
        setAiState('speaking');
        await playAudioBuffer(buffer, (data) => {
          setAudioData(new Uint8Array(data));
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAiState('idle');
      setAudioData(null);
      if (mode === 'hand') {
        setInputText('');
      }
    }
  };

  const inputTextRef = useRef(inputText);
  useEffect(() => { inputTextRef.current = inputText; }, [inputText]);

  const handleKeyPress = useCallback((key: string) => {
    if (key === 'BACKSPACE') {
      setInputText(prev => prev.slice(0, -1));
    } else if (key === 'CLEAR') {
      setInputText("");
    } else if (key === 'ACTION') {
      handleAskMia(inputTextRef.current);
    } else {
      setInputText(prev => prev + key);
    }
  }, []);

  const visualizerState = isListening ? 'listening' : aiState;

  return (
    <div className="min-h-screen bg-white text-black flex flex-col font-sans selection:bg-black/10">
      <header className="border-b-4 border-black p-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/app')} className="p-2 border-4 border-black hover:bg-black hover:text-white transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-4xl font-black tracking-tighter uppercase">Mia AI</h1>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setMode('voice')}
            className={`px-6 py-3 font-bold uppercase tracking-wider border-4 border-black transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2 ${mode === 'voice' ? 'bg-black text-white' : 'bg-white text-black hover:bg-black/5'}`}
          >
            <Mic className="w-5 h-5" /> Voice
          </button>
          <button 
            onClick={() => setMode('hand')}
            className={`px-6 py-3 font-bold uppercase tracking-wider border-4 border-black transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2 ${mode === 'hand' ? 'bg-black text-white' : 'bg-white text-black hover:bg-black/5'}`}
          >
            <KeyboardIcon className="w-5 h-5" /> Hand Typing
          </button>
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center p-8 gap-8 max-w-6xl mx-auto w-full">
        
        <VoiceVisualizer state={visualizerState} audioData={audioData} />

        {/* Input Area */}
        {mode === 'voice' ? (
          <div className="flex-grow flex flex-col items-center justify-center w-full gap-8">
            <button 
              onClick={toggleListening}
              className={`w-48 h-48 rounded-full border-8 border-black flex items-center justify-center transition-all shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] ${isListening ? 'bg-red-500 text-white animate-pulse scale-105' : 'bg-white text-black hover:bg-black/5'}`}
            >
              <Mic className="w-20 h-20" />
            </button>
            <div className="text-center">
              <p className="text-2xl font-bold uppercase">{isListening ? 'Listening...' : 'Click to Speak'}</p>
              <p className="text-xl mt-4 font-medium min-h-[2rem]">{inputText}</p>
            </div>
          </div>
        ) : (
          <div className="w-full flex flex-col gap-6">
            <div className="w-full bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <h2 className="text-xs font-bold uppercase tracking-widest text-black/50 mb-2">Your Message:</h2>
              <p className="text-2xl font-bold min-h-[3rem]">{inputText || <span className="text-black/20">Type something...</span>}</p>
            </div>
            <div className="w-full">
              <Keyboard 
                onKeyPress={handleKeyPress} 
                cursorPos={cursorPosition}
                dwellTimeMs={800}
                hoverColor="#000000"
                actionLabel="ASK MIA"
              />
            </div>
          </div>
        )}
      </main>

      {/* Hidden Webcam Logic */}
      {mode === 'hand' && (
        <div className="fixed bottom-6 right-6 w-32 rounded-none overflow-hidden border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-40 bg-white">
            <Webcam
                ref={webcamRef}
                audio={false}
                mirrored={true}
                className="w-full h-auto bg-black"
                videoConstraints={{ facingMode: "user" }}
            />
        </div>
      )}

      {/* Cursor Overlay */}
      {mode === 'hand' && cursorPosition && (
        <div 
          className="fixed pointer-events-none z-[100] transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center"
          style={{ left: cursorPosition.x, top: cursorPosition.y }}
        >
          <div className="w-8 h-8 rounded-full border-4 border-black bg-white/50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] backdrop-blur-sm"></div>
          <div className="absolute w-2 h-2 bg-black rounded-full"></div>
        </div>
      )}
    </div>
  );
};
