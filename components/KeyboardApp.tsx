import React, { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { useHandTracking } from '../hooks/useHandTracking';
import { Camera, VideoOff, Settings, Sparkles, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Keyboard } from './Keyboard';
import { generateSpeech, playAudioBuffer } from '../services/ai';

export const KeyboardApp: React.FC = () => {
  const [text, setText] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  
  // Settings
  const [showSettings, setShowSettings] = useState(false);
  const [dwellTime, setDwellTime] = useState(800);
  const [hoverColor, setHoverColor] = useState('#000000');

  const webcamRef = useRef<Webcam>(null);
  const { isReady, cursorPosition, error } = useHandTracking(webcamRef, isCameraOn);
  const navigate = useNavigate();

  const handleSpeak = async (textToSpeak: string) => {
    if (!textToSpeak) return;
    setIsSpeaking(true);
    try {
      const audioBuffer = await generateSpeech(textToSpeak);
      if (audioBuffer) {
        await playAudioBuffer(audioBuffer);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setIsSpeaking(false), 2000);
    }
  };

  const handleKeyPress = useCallback((key: string) => {
    if (key === 'BACKSPACE') {
      setText(prev => prev.slice(0, -1));
    } else if (key === 'CLEAR') {
      setText("");
    } else if (key === 'ACTION') {
      setText(prev => {
        handleSpeak(prev);
        return prev;
      });
    } else {
      setText(prev => {
        if (prev.length >= 1000) return prev;
        return prev + key;
      });
    }
  }, []);

  return (
    <div className="relative min-h-screen bg-white text-black flex flex-col overflow-x-hidden selection:bg-black/10">
      
      {/* Header */}
      <header className="relative z-10 p-6 flex justify-between items-center border-b-4 border-black">
        <h1 className="text-4xl font-black tracking-tighter text-black flex items-center gap-1">
          7H<span className="text-2xl mt-1">.ai</span>
        </h1>
        <div className="flex gap-4">
          <button 
            onClick={() => navigate('/mia')}
            className="px-4 py-2 font-bold uppercase tracking-wider text-sm border-2 border-black hover:bg-black hover:text-white transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" /> Mia AI
          </button>
          <button 
            onClick={() => setIsCameraOn(prev => !prev)}
            className={`px-4 py-2 font-bold uppercase tracking-wider text-sm border-2 border-black transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2 ${!isCameraOn ? 'bg-red-500 text-white' : 'hover:bg-black hover:text-white'}`}
          >
            {isCameraOn ? <Camera className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
            {isCameraOn ? 'Cam On' : 'Cam Off'}
          </button>
          <button 
            onClick={() => setShowSettings(true)}
            className="p-2 border-2 border-black hover:bg-black hover:text-white transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button 
            onClick={() => {
              localStorage.removeItem('7h_user');
              navigate('/');
            }}
            className="p-2 border-2 border-black hover:bg-black hover:text-white transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-grow flex flex-col items-center justify-start px-4 gap-6 py-6">
        
        {/* Output Display */}
        <div className="w-full max-w-5xl relative">
             <div className={`relative bg-white border-4 border-black p-6 min-h-[160px] flex flex-col justify-between shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all ${isSpeaking ? 'bg-black text-white' : ''}`}>
                <textarea 
                  value={text}
                  readOnly 
                  placeholder={isCameraOn ? "Hover over keys to type..." : "Camera disabled. Turn on to track hands."}
                  className={`w-full bg-transparent text-4xl md:text-5xl font-bold placeholder-black/20 resize-none outline-none h-32 leading-tight ${isSpeaking ? 'text-white placeholder-white/20' : 'text-black'}`}
                />
                <div className={`flex justify-between items-center pt-4 border-t-4 ${isSpeaking ? 'border-white/20' : 'border-black'}`}>
                    <span className="font-mono text-sm tracking-widest uppercase font-bold">{text.length} Characters</span>
                    {isSpeaking && (
                       <span className="font-mono text-sm tracking-widest uppercase font-bold animate-pulse">Speaking...</span>
                    )}
                </div>
             </div>
        </div>

        {/* Keyboard Area */}
        <div className={`w-full flex-grow flex items-center transition-opacity duration-300 ${!isCameraOn ? 'opacity-50 pointer-events-none' : ''}`}>
            <Keyboard 
              onKeyPress={handleKeyPress} 
              cursorPos={cursorPosition}
              dwellTimeMs={dwellTime}
              hoverColor={hoverColor}
              actionLabel="SPEAK"
            />
        </div>

      </main>

      {/* Hidden Webcam Logic */}
      <div className="fixed bottom-6 right-6 w-48 rounded-none overflow-hidden border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-40 bg-white">
          <Webcam
              ref={webcamRef}
              audio={false}
              mirrored={true}
              className="w-full h-auto bg-black"
              screenshotFormat="image/jpeg"
              videoConstraints={{
                  facingMode: "user",
                  width: { ideal: 640 },
                  height: { ideal: 480 },
                  frameRate: { ideal: 30 }
              }}
          />
          <div className="absolute top-2 left-2 bg-white px-2 py-1 text-[10px] font-mono text-black border-2 border-black font-bold flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isReady ? 'bg-black' : 'bg-black animate-pulse'}`}></div>
              {isReady ? "READY" : "LOADING"}
          </div>
      </div>

      {/* Cursor Overlay */}
      {isCameraOn && cursorPosition && (
        <div 
          className="fixed pointer-events-none z-[100] transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center"
          style={{ left: cursorPosition.x, top: cursorPosition.y }}
        >
          <div 
            className="w-8 h-8 rounded-full border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] backdrop-blur-sm"
            style={{ backgroundColor: hoverColor }}
          ></div>
          <div className="absolute w-2 h-2 bg-black rounded-full"></div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white border-4 border-black p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] max-w-md w-full">
            <h2 className="text-3xl font-black tracking-tighter uppercase mb-6">Settings</h2>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-wider block">Dwell Time ({dwellTime}ms)</label>
                <input 
                  type="range" 
                  min="300" 
                  max="2000" 
                  step="100"
                  value={dwellTime} 
                  onChange={(e) => setDwellTime(Number(e.target.value))}
                  className="w-full h-4 bg-black/10 appearance-none cursor-pointer accent-black"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-wider block">Hover Color</label>
                <div className="flex gap-4">
                  {['#000000', '#FF3366', '#33CCFF', '#00CC66', '#FFCC00'].map(color => (
                    <button
                      key={color}
                      onClick={() => setHoverColor(color)}
                      className={`w-10 h-10 border-4 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${hoverColor === color ? 'scale-110 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : ''}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <button 
              onClick={() => setShowSettings(false)}
              className="w-full mt-8 py-4 bg-black text-white text-xl font-bold border-4 border-black hover:bg-white hover:text-black transition-colors shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {error && (
        <div className="fixed top-6 right-6 bg-white text-black px-6 py-4 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] z-[60] flex items-center gap-3">
            <div>
              <p className="font-black uppercase tracking-wider">Error</p>
              <p className="text-sm font-bold">{error}</p>
            </div>
        </div>
      )}

    </div>
  );
};
