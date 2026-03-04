import React, { useEffect, useState, useRef } from 'react';

export interface KeyConfig {
  label: string;
  value: string;
  width?: number;
  type: 'char' | 'action' | 'spacer';
}

interface KeyboardProps {
  onKeyPress: (key: string) => void;
  cursorPos: { x: number; y: number } | null;
  dwellTimeMs: number;
  hoverColor?: string;
  actionLabel?: string;
  suggestions?: string[];
  onSuggestionClick?: (sug: string) => void;
  isClicking?: boolean;
}

export const KEYS: KeyConfig[][] = [
  [
    { label: 'Q', value: 'Q', type: 'char' }, { label: 'W', value: 'W', type: 'char' }, { label: 'E', value: 'E', type: 'char' },
    { label: 'R', value: 'R', type: 'char' }, { label: 'T', value: 'T', type: 'char' }, { label: 'Y', value: 'Y', type: 'char' },
    { label: 'U', value: 'U', type: 'char' }, { label: 'I', value: 'I', type: 'char' }, { label: 'O', value: 'O', type: 'char' },
    { label: 'P', value: 'P', type: 'char' }, { label: 'DEL', value: 'BACKSPACE', type: 'action' }
  ],
  [
    { label: 'A', value: 'A', type: 'char' }, { label: 'S', value: 'S', type: 'char' }, { label: 'D', value: 'D', type: 'char' },
    { label: 'F', value: 'F', type: 'char' }, { label: 'G', value: 'G', type: 'char' }, { label: 'H', value: 'H', type: 'char' },
    { label: 'J', value: 'J', type: 'char' }, { label: 'K', value: 'K', type: 'char' }, { label: 'L', value: 'L', type: 'char' },
    { label: 'ENTER', value: '\n', type: 'action', width: 1.5 }
  ],
  [
    { label: 'Z', value: 'Z', type: 'char' }, { label: 'X', value: 'X', type: 'char' }, { label: 'C', value: 'C', type: 'char' },
    { label: 'V', value: 'V', type: 'char' }, { label: 'B', value: 'B', type: 'char' }, { label: 'N', value: 'N', type: 'char' },
    { label: 'M', value: 'M', type: 'char' }, { label: ',', value: ',', type: 'char' }, { label: '.', value: '.', type: 'char' },
    { label: '?', value: '?', type: 'char' }, { label: '!', value: '!', type: 'char' }
  ],
  [
    { label: 'SPACE', value: ' ', type: 'char', width: 4 },
    { label: 'CLEAR', value: 'CLEAR', type: 'action', width: 2 },
    { label: 'ACTION', value: 'ACTION', type: 'action', width: 2 }
  ]
];

export const Keyboard: React.FC<KeyboardProps> = ({ onKeyPress, cursorPos, dwellTimeMs, hoverColor = '#000000', actionLabel = "SPEAK", suggestions = [], onSuggestionClick, isClicking = false }) => {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const lastKeyRef = useRef<string | null>(null);
  const animationFrameRef = useRef<number>();
  const justTypedRef = useRef<boolean>(false);
  const prevIsClickingRef = useRef<boolean>(false);

  useEffect(() => {
    const checkHover = () => {
      if (!cursorPos) {
        setHoveredKey(null);
        setProgress(0);
        startTimeRef.current = null;
        justTypedRef.current = false;
        prevIsClickingRef.current = isClicking;
        return;
      }

      const element = document.elementFromPoint(cursorPos.x, cursorPos.y);
      const keyButton = element?.closest('[data-key-value]') as HTMLElement;

      if (keyButton) {
        const keyValue = keyButton.dataset.keyValue;
        
        // Handle instant click
        if (isClicking && !prevIsClickingRef.current && !justTypedRef.current && keyValue) {
          if (keyValue.startsWith('SUG_')) {
            const idx = parseInt(keyValue.replace('SUG_', ''));
            if (suggestions && suggestions[idx] && onSuggestionClick) {
              onSuggestionClick(suggestions[idx]);
            }
          } else {
            onKeyPress(keyValue);
          }
          justTypedRef.current = true;
          setProgress(100);
        }
        
        if (keyValue !== lastKeyRef.current) {
          lastKeyRef.current = keyValue || null;
          setHoveredKey(keyValue || null);
          startTimeRef.current = performance.now();
          setProgress(0);
          justTypedRef.current = false;
        } else if (startTimeRef.current && !justTypedRef.current) {
          const elapsed = performance.now() - startTimeRef.current;
          const newProgress = Math.min((elapsed / dwellTimeMs) * 100, 100);
          setProgress(newProgress);

          if (newProgress >= 100) {
             if (keyValue) {
               if (keyValue.startsWith('SUG_')) {
                 const idx = parseInt(keyValue.replace('SUG_', ''));
                 if (suggestions && suggestions[idx] && onSuggestionClick) {
                   onSuggestionClick(suggestions[idx]);
                 }
               } else {
                 onKeyPress(keyValue);
               }
             }
             justTypedRef.current = true;
             setProgress(100);
          }
        }
      } else {
        if (lastKeyRef.current) {
            lastKeyRef.current = null;
            setHoveredKey(null);
            setProgress(0);
            startTimeRef.current = null;
            justTypedRef.current = false;
        }
      }
      
      prevIsClickingRef.current = isClicking;
      animationFrameRef.current = requestAnimationFrame(checkHover);
    };

    animationFrameRef.current = requestAnimationFrame(checkHover);
    return () => {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [cursorPos, dwellTimeMs, onKeyPress, suggestions, onSuggestionClick, isClicking]);

  return (
    <div className="flex flex-col gap-2 w-full max-w-5xl mx-auto p-4 select-none">
      {suggestions && suggestions.length > 0 && (
        <div className="flex gap-2 justify-center w-full mb-2">
          {suggestions.map((sug, i) => {
            const keyVal = `SUG_${i}`;
            const isHovered = hoveredKey === keyVal;
            const secondsRemaining = Math.max(0, Math.ceil((dwellTimeMs - (progress / 100) * dwellTimeMs) / 1000));
            return (
              <div
                key={keyVal}
                data-key-value={keyVal}
                style={{ 
                  flex: `1 1 0`,
                  backgroundColor: isHovered ? hoverColor : 'white',
                  color: isHovered ? (hoverColor === '#000000' ? 'white' : 'black') : 'black'
                }}
                className={`
                  relative h-10 md:h-14 rounded-2xl flex items-center justify-center
                  text-sm md:text-base font-medium transition-all duration-150 ease-out overflow-hidden
                  border border-zinc-200
                  ${isHovered ? 'scale-[1.02] z-10 shadow-md border-zinc-300' : 'shadow-sm hover:shadow-md'}
                `}
              >
                <div 
                    className={`absolute bottom-0 left-0 w-full transition-all duration-75 ease-linear ${isHovered ? 'bg-zinc-900/10' : 'bg-transparent'}`}
                    style={{ height: isHovered ? `${progress}%` : '0%' }}
                />
                <span className="relative z-10 flex flex-col items-center">
                  {sug}
                  {isHovered && progress > 0 && progress < 100 && dwellTimeMs < 10000 && (
                    <span className="text-[10px] absolute -bottom-4 font-mono text-zinc-500">{secondsRemaining}s</span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      )}
      {KEYS.map((row, rowIndex) => (
        <div key={rowIndex} className="flex gap-2 justify-center w-full">
          {row.map((key) => {
            const isHovered = hoveredKey === key.value;
            const flexGrow = key.width || 1;
            const isAction = key.type === 'action';
            const displayLabel = key.value === 'ACTION' ? actionLabel : key.label;
            
            const secondsRemaining = Math.max(0, Math.ceil((dwellTimeMs - (progress / 100) * dwellTimeMs) / 1000));
            
            return (
              <div
                key={key.value}
                data-key-value={key.value}
                style={{ 
                  flex: `${flexGrow} 1 0`,
                  backgroundColor: isHovered ? hoverColor : 'white',
                  color: isHovered ? (hoverColor === '#000000' ? 'white' : 'black') : 'black'
                }}
                className={`
                  relative h-14 md:h-20 rounded-2xl flex items-center justify-center
                  text-xl md:text-2xl font-medium transition-all duration-150 ease-out overflow-hidden
                  border border-zinc-200
                  ${isHovered ? 'scale-[1.02] z-10 shadow-md border-zinc-300' : 'shadow-sm hover:shadow-md'}
                  ${isAction ? 'text-sm font-semibold uppercase tracking-wider text-zinc-600' : ''}
                `}
              >
                <div 
                    className={`absolute bottom-0 left-0 w-full transition-all duration-75 ease-linear ${isHovered ? 'bg-zinc-900/10' : 'bg-transparent'}`}
                    style={{ height: isHovered ? `${progress}%` : '0%' }}
                />
                <span className="relative z-10 flex flex-col items-center">
                  {displayLabel}
                  {isHovered && progress > 0 && progress < 100 && dwellTimeMs < 10000 && (
                    <span className="text-[10px] absolute -bottom-5 font-mono text-zinc-500">{secondsRemaining}s</span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};
