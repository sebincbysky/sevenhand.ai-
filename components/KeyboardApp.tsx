import React, { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { useRedLightTracking } from '../hooks/useRedLightTracking';
import { useHandTracking } from '../hooks/useHandTracking';
import { useHeadTracking } from '../hooks/useHeadTracking';
import { Camera, VideoOff, Settings, Sparkles, LogOut, Radio, Hand, User, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Keyboard } from './Keyboard';
import { generateSpeech, playAudioBuffer, getSuggestions } from '../services/ai';

export const KeyboardApp: React.FC = () => {
  const [text, setText] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [trackingMode, setTrackingMode] = useState<'hand' | 'head' | 'red-light'>('hand');
  
  // Settings
  const [showSettings, setShowSettings] = useState(false);
  const [dwellTime, setDwellTime] = useState(800);
  const [hoverColor, setHoverColor] = useState('#000000');
  const [showTrackingDropdown, setShowTrackingDropdown] = useState(false);
  const [typingMode, setTypingMode] = useState<'normal' | 'point-to-type'>('normal');

  // Load settings on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('7h_settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        if (parsed.dwellTime) setDwellTime(parsed.dwellTime);
        if (parsed.hoverColor) setHoverColor(parsed.hoverColor);
        if (parsed.trackingMode) setTrackingMode(parsed.trackingMode);
        if (parsed.typingMode) setTypingMode(parsed.typingMode);
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }
  }, []);

  // Save settings when they change
  useEffect(() => {
    const settings = { dwellTime, hoverColor, trackingMode, typingMode };
    localStorage.setItem('7h_settings', JSON.stringify(settings));
    
    const email = localStorage.getItem('7h_user');
    if (email) {
      fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, settings })
      }).catch(console.error);
    }
  }, [dwellTime, hoverColor, trackingMode]);

  const webcamRef = useRef<Webcam>(null);
  
  const redLight = useRedLightTracking(webcamRef, isCameraOn && trackingMode === 'red-light');
  const hand = useHandTracking(webcamRef, isCameraOn && trackingMode === 'hand');
  const head = useHeadTracking(webcamRef, isCameraOn && trackingMode === 'head');
  
  let activeCursorPosition = null;
  let isReady = false;
  let error = null;
  let isClicking = false;

  if (trackingMode === 'red-light') {
    activeCursorPosition = redLight.cursorPosition;
    isReady = redLight.isReady;
    error = redLight.error;
  } else if (trackingMode === 'hand') {
    activeCursorPosition = hand.cursorPosition;
    isReady = hand.isReady;
    error = hand.error;
    isClicking = hand.isClicking;
  } else if (trackingMode === 'head') {
    activeCursorPosition = head.cursorPosition;
    isReady = head.isReady;
    error = head.error;
    isClicking = head.isClicking;
  }

  const navigate = useNavigate();

  // Mouse cursor emulation
  useEffect(() => {
    if (activeCursorPosition) {
      const event = new MouseEvent('mousemove', {
        clientX: activeCursorPosition.x,
        clientY: activeCursorPosition.y,
        bubbles: true,
        cancelable: true,
      });
      document.dispatchEvent(event);
    }
  }, [activeCursorPosition]);

  // Autocomplete Suggestions
  useEffect(() => {
    if (!text.trim()) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      const words = text.split(' ');
      const lastWord = words[words.length - 1];
      if (lastWord) {
        const sugs = await getSuggestions(lastWord);
        setSuggestions(sugs);
      } else {
        setSuggestions([]);
      }
    }, 1500); // Increased debounce to 1.5s to save quota
    return () => clearTimeout(timer);
  }, [text]);

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

  const handleSuggestionClick = useCallback((sug: string) => {
    setText(prev => {
      const words = prev.split(' ');
      words.pop(); // Remove the incomplete word
      const newText = words.length > 0 ? words.join(' ') + ' ' + sug + ' ' : sug + ' ';
      return newText;
    });
  }, []);

  const cycleTrackingMode = () => {
    setTrackingMode(prev => {
      if (prev === 'hand') return 'head';
      if (prev === 'head') return 'red-light';
      return 'hand';
    });
  };

  const renderHandSkeleton = () => {
    if (trackingMode !== 'hand' || !hand.landmarks) return null;
    
    // Connections for hand skeleton
    const connections = [
      [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
      [0, 5], [5, 6], [6, 7], [7, 8], // Index finger
      [5, 9], [9, 10], [10, 11], [11, 12], // Middle finger
      [9, 13], [13, 14], [14, 15], [15, 16], // Ring finger
      [13, 17], [0, 17], [17, 18], [18, 19], [19, 20] // Pinky
    ];

    return (
      <svg className="fixed inset-0 pointer-events-none z-50 w-full h-full">
        {connections.map(([startIdx, endIdx], i) => {
          const start = hand.landmarks![startIdx];
          const end = hand.landmarks![endIdx];
          if (!start || !end) return null;
          
          // Mirror X
          const startX = (1 - start.x) * window.innerWidth;
          const startY = start.y * window.innerHeight;
          const endX = (1 - end.x) * window.innerWidth;
          const endY = end.y * window.innerHeight;

          return (
            <line 
              key={i}
              x1={startX} y1={startY} x2={endX} y2={endY}
              stroke={hand.isClicking ? "#ef4444" : "#000000"} 
              strokeWidth="4"
              strokeLinecap="round"
              className="transition-colors duration-150"
            />
          );
        })}
        {hand.landmarks.map((lm, i) => {
          const x = (1 - lm.x) * window.innerWidth;
          const y = lm.y * window.innerHeight;
          return (
            <circle 
              key={i}
              cx={x} cy={y} r="6"
              fill={hand.isClicking ? "#ef4444" : "#ffffff"}
              stroke="#000000"
              strokeWidth="2"
              className="transition-colors duration-150"
            />
          );
        })}
      </svg>
    );
  };

  return (
    <div className="relative min-h-screen bg-[#FAFAFA] text-zinc-900 flex flex-col overflow-x-hidden selection:bg-zinc-200">
      
      {/* Header */}
      <header className="relative z-50 p-6 flex justify-between items-center border-b border-zinc-200 bg-white">
        <h1 className="text-3xl font-bold tracking-tighter text-zinc-900 flex items-center gap-1">
          7H<span className="text-zinc-900">.ai</span>
        </h1>
        <div className="flex gap-3">
          <div 
            className="relative"
            onMouseEnter={() => setShowTrackingDropdown(true)}
            onMouseLeave={() => setShowTrackingDropdown(false)}
          >
            <button 
              className="px-4 py-2 font-medium text-sm border border-zinc-200 rounded-full hover:bg-zinc-50 hover:text-zinc-900 transition-all shadow-sm flex items-center gap-2 text-zinc-700"
            >
              {trackingMode === 'hand' && <><Hand className="w-4 h-4" /> Hand Tracking</>}
              {trackingMode === 'head' && <><User className="w-4 h-4" /> Head Tracking</>}
              {trackingMode === 'red-light' && <><Radio className="w-4 h-4" /> Next Link</>}
              <ChevronDown className="w-3 h-3 ml-1 opacity-50" />
            </button>
            
            {showTrackingDropdown && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-zinc-200 rounded-2xl shadow-lg py-2 z-50 flex flex-col">
                <button 
                  onClick={() => setTrackingMode('hand')}
                  className={`px-4 py-2 text-sm text-left flex items-center gap-2 hover:bg-zinc-50 transition-colors ${trackingMode === 'hand' ? 'font-semibold text-zinc-900' : 'text-zinc-600'}`}
                >
                  <Hand className="w-4 h-4" /> Hand Tracking
                </button>
                <button 
                  onClick={() => setTrackingMode('head')}
                  className={`px-4 py-2 text-sm text-left flex items-center gap-2 hover:bg-zinc-50 transition-colors ${trackingMode === 'head' ? 'font-semibold text-zinc-900' : 'text-zinc-600'}`}
                >
                  <User className="w-4 h-4" /> Head Tracking
                </button>
                <button 
                  onClick={() => setTrackingMode('red-light')}
                  className={`px-4 py-2 text-sm text-left flex items-center gap-2 hover:bg-zinc-50 transition-colors ${trackingMode === 'red-light' ? 'font-semibold text-zinc-900' : 'text-zinc-600'}`}
                >
                  <Radio className="w-4 h-4" /> Next Link
                </button>
              </div>
            )}
          </div>

          <button 
            onClick={() => setIsCameraOn(prev => !prev)}
            className={`px-4 py-2 font-medium text-sm border border-zinc-200 rounded-full transition-all shadow-sm flex items-center gap-2 ${!isCameraOn ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' : 'hover:bg-zinc-50 text-zinc-700'}`}
          >
            {isCameraOn ? <Camera className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
            {isCameraOn ? 'Tracking On' : 'Tracking Off'}
          </button>
          <button 
            onClick={() => setShowSettings(true)}
            className="p-2 border border-zinc-200 rounded-full hover:bg-zinc-50 text-zinc-700 transition-all shadow-sm"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button 
            onClick={() => {
              localStorage.removeItem('7h_user');
              navigate('/');
            }}
            className="p-2 border border-zinc-200 rounded-full hover:bg-zinc-50 text-zinc-700 transition-all shadow-sm"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-grow flex flex-col items-center justify-start px-4 gap-6 py-6">
        
        {isCameraOn && trackingMode === 'red-light' && (
          <div className="w-full max-w-5xl flex flex-col gap-2">
            <div className={`w-full p-4 text-center font-medium rounded-2xl border border-zinc-200 transition-colors shadow-sm ${redLight.isConnected ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-500'}`}>
              <span className="flex items-center justify-center gap-3">
                <div className={`w-3 h-3 rounded-full ${redLight.isConnected ? 'bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-zinc-300'}`}></div>
                {redLight.isConnected ? 'Next Link is Enabled' : 'Next Link is Disabled'}
              </span>
            </div>
          </div>
        )}

        {/* Output Display */}
        <div className="w-full max-w-5xl relative">
             <div className={`relative bg-white border border-zinc-200 p-8 rounded-3xl min-h-[160px] flex flex-col justify-between shadow-sm transition-all ${isSpeaking ? 'bg-zinc-900 text-white border-zinc-800' : ''}`}>
                <textarea 
                  value={text}
                  readOnly 
                  placeholder={isCameraOn ? "Hover over keys to type..." : "Camera disabled. Turn on to track."}
                  className={`w-full bg-transparent text-4xl md:text-5xl font-medium placeholder-zinc-300 resize-none outline-none h-32 leading-tight ${isSpeaking ? 'text-white placeholder-zinc-600' : 'text-zinc-900'}`}
                />
                <div className={`flex justify-between items-center pt-6 border-t ${isSpeaking ? 'border-zinc-800' : 'border-zinc-100'}`}>
                    <span className="font-mono text-sm text-zinc-400 font-medium">{text.length} Characters</span>
                    {isSpeaking && (
                       <span className="font-mono text-sm text-zinc-400 font-medium animate-pulse">Speaking...</span>
                    )}
                </div>
             </div>
        </div>

        {/* Keyboard Area */}
        <div className={`w-full flex-grow flex items-center transition-opacity duration-300 ${!isCameraOn ? 'opacity-50 pointer-events-none' : ''}`}>
            <Keyboard 
              onKeyPress={handleKeyPress} 
              cursorPos={activeCursorPosition}
              dwellTimeMs={typingMode === 'normal' ? 9999999 : dwellTime}
              hoverColor={hoverColor}
              actionLabel="SPEAK"
              isClicking={isClicking}
              suggestions={suggestions}
              onSuggestionClick={handleSuggestionClick}
            />
        </div>

      </main>

      {/* Footer */}
      <footer className="relative z-10 p-6 border-t border-zinc-200 flex justify-center items-center bg-white text-zinc-500 group cursor-default">
        <p className="font-medium text-sm">
          Made by <span className="text-zinc-900 transition-colors duration-300">SebInc</span>
        </p>
      </footer>

      {/* Hidden Webcam Logic */}
      <div className="fixed bottom-6 right-6 w-48 rounded-2xl overflow-hidden border border-zinc-200 shadow-lg z-40 bg-white">
          <Webcam
              ref={webcamRef}
              audio={false}
              mirrored={true}
              className="w-full h-auto bg-zinc-900"
              screenshotFormat="image/jpeg"
              videoConstraints={{
                  facingMode: "user",
                  width: { ideal: 640 },
                  height: { ideal: 480 },
                  frameRate: { ideal: 30 }
              }}
          />
          <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-[10px] font-mono text-zinc-900 border border-zinc-200 font-medium flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${isReady ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></div>
              {isReady ? "READY" : "LOADING"}
          </div>
      </div>

      {/* Hand Skeleton Overlay */}
      {renderHandSkeleton()}

      {/* Cursor Overlay */}
      {isCameraOn && activeCursorPosition && (
        <div 
          className="fixed pointer-events-none z-[100] transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center"
          style={{ left: activeCursorPosition.x, top: activeCursorPosition.y }}
        >
          <div 
            className={`w-8 h-8 rounded-full border-2 border-white shadow-lg backdrop-blur-sm transition-transform ${isClicking ? 'scale-75' : 'scale-100'}`}
            style={{ backgroundColor: hoverColor === '#000000' ? '#18181b' : hoverColor }}
          ></div>
          <div className="absolute w-1.5 h-1.5 bg-white rounded-full"></div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm p-4">
          <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-semibold tracking-tight mb-6">Settings & Tutorial</h2>
            
            <div className="space-y-8">
              
              {/* Tracking Mode Selection */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-zinc-600 block">Tracking Mode</label>
                <div className="flex flex-col gap-2">
                  <button 
                    onClick={() => setTrackingMode('hand')}
                    className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${trackingMode === 'hand' ? 'border-zinc-900 bg-zinc-50 text-zinc-900' : 'border-zinc-200 text-zinc-500 hover:border-zinc-300'}`}
                  >
                    <Hand className="w-5 h-5" />
                    <div className="text-left">
                      <p className="font-semibold text-sm">Hand Tracking</p>
                      <p className="text-xs opacity-80">Move hand to point. Pinch to click instantly.</p>
                    </div>
                  </button>
                  <button 
                    onClick={() => setTrackingMode('head')}
                    className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${trackingMode === 'head' ? 'border-zinc-900 bg-zinc-50 text-zinc-900' : 'border-zinc-200 text-zinc-500 hover:border-zinc-300'}`}
                  >
                    <User className="w-5 h-5" />
                    <div className="text-left">
                      <p className="font-semibold text-sm">Head Tracking</p>
                      <p className="text-xs opacity-80">Use nose to point. Open mouth twice to click.</p>
                    </div>
                  </button>
                  <button 
                    onClick={() => setTrackingMode('red-light')}
                    className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${trackingMode === 'red-light' ? 'border-zinc-900 bg-zinc-50 text-zinc-900' : 'border-zinc-200 text-zinc-500 hover:border-zinc-300'}`}
                  >
                    <Radio className="w-5 h-5" />
                    <div className="text-left">
                      <p className="font-semibold text-sm">Next Link</p>
                      <p className="text-xs opacity-80">Use a red laser/light. Hover to type.</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Typing Mode Selection */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-zinc-600 block">Typing Mode</label>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setTypingMode('normal')}
                    className={`flex-1 p-3 rounded-xl border transition-all ${typingMode === 'normal' ? 'border-zinc-900 bg-zinc-50 text-zinc-900 font-semibold' : 'border-zinc-200 text-zinc-500 hover:border-zinc-300'}`}
                  >
                    Normal (Click)
                  </button>
                  <button 
                    onClick={() => setTypingMode('point-to-type')}
                    className={`flex-1 p-3 rounded-xl border transition-all ${typingMode === 'point-to-type' ? 'border-zinc-900 bg-zinc-50 text-zinc-900 font-semibold' : 'border-zinc-200 text-zinc-500 hover:border-zinc-300'}`}
                  >
                    Point-to-type (Hover)
                  </button>
                </div>
              </div>

              {typingMode === 'point-to-type' && (
                <div className="space-y-3">
                  <label className="text-sm font-medium text-zinc-600 block">Dwell Time ({dwellTime}ms)</label>
                  <input 
                    type="range" 
                    min="300" 
                    max="2000" 
                    step="100"
                    value={dwellTime} 
                    onChange={(e) => setDwellTime(Number(e.target.value))}
                    className="w-full h-2 bg-zinc-100 rounded-full appearance-none cursor-pointer accent-zinc-900"
                  />
                </div>
              )}

              <div className="space-y-3">
                <label className="text-sm font-medium text-zinc-600 block">Hover Color</label>
                <div className="flex gap-4">
                  {['#000000', '#FF3366', '#33CCFF', '#00CC66', '#FFCC00'].map(color => (
                    <button
                      key={color}
                      onClick={() => setHoverColor(color)}
                      className={`w-10 h-10 rounded-full border-2 border-white shadow-sm transition-transform ${hoverColor === color ? 'scale-110 ring-2 ring-zinc-900 ring-offset-2' : 'hover:scale-105'}`}
                      style={{ backgroundColor: color === '#000000' ? '#18181b' : color }}
                    />
                  ))}
                </div>
              </div>

              {/* More Products */}
              <div className="space-y-3 pt-4 border-t border-zinc-100">
                <label className="text-sm font-medium text-zinc-600 block">More Products by SebInc</label>
                <div className="grid grid-cols-1 gap-2">
                  <button 
                    className="p-3 rounded-xl border border-zinc-200 text-left hover:border-zinc-300 hover:bg-zinc-50 transition-all flex flex-col gap-1 opacity-50 cursor-not-allowed"
                  >
                    <span className="font-semibold text-zinc-900 text-sm">Coming Soon</span>
                    <span className="text-xs text-zinc-500">More AI tools</span>
                  </button>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setShowSettings(false)}
              className="w-full mt-8 py-3 bg-zinc-900 text-white text-lg font-medium rounded-full hover:bg-zinc-800 transition-colors shadow-sm"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {error && (
        <div className="fixed top-6 right-6 bg-white text-zinc-900 px-6 py-4 rounded-2xl border border-zinc-200 shadow-lg z-[60] flex items-center gap-3">
            <div>
              <p className="font-semibold text-sm text-red-500">Error</p>
              <p className="text-sm text-zinc-600">{error}</p>
            </div>
        </div>
      )}

    </div>
  );
};
