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

export const Keyboard: React.FC<KeyboardProps> = ({ onKeyPress, cursorPos, dwellTimeMs, hoverColor = '#000000', actionLabel = "SPEAK" }) => {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const lastKeyRef = useRef<string | null>(null);
  const animationFrameRef = useRef<number>();
  const justTypedRef = useRef<boolean>(false);

  useEffect(() => {
    const checkHover = () => {
      if (!cursorPos) {
        setHoveredKey(null);
        setProgress(0);
        startTimeRef.current = null;
        justTypedRef.current = false;
        return;
      }

      const element = document.elementFromPoint(cursorPos.x, cursorPos.y);
      const keyButton = element?.closest('[data-key-value]') as HTMLElement;

      if (keyButton) {
        const keyValue = keyButton.dataset.keyValue;
        
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
             if (keyValue) onKeyPress(keyValue);
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
      animationFrameRef.current = requestAnimationFrame(checkHover);
    };

    animationFrameRef.current = requestAnimationFrame(checkHover);
    return () => {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [cursorPos, dwellTimeMs, onKeyPress]);

  return (
    <div className="flex flex-col gap-2 w-full max-w-5xl mx-auto p-4 select-none">
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
                  relative h-14 md:h-20 rounded-none flex items-center justify-center
                  text-xl md:text-2xl font-semibold transition-all duration-150 ease-out overflow-hidden
                  border-2 border-black
                  ${isHovered ? 'scale-[1.02] z-10 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : 'shadow-sm'}
                  ${isAction ? 'text-base font-bold uppercase tracking-wider' : ''}
                `}
              >
                <div 
                    className={`absolute bottom-0 left-0 w-full transition-all duration-75 ease-linear ${isHovered ? 'bg-white/30' : 'bg-black/10'}`}
                    style={{ height: isHovered ? `${progress}%` : '0%' }}
                />
                <span className="relative z-10 flex flex-col items-center">
                  {displayLabel}
                  {isHovered && progress > 0 && progress < 100 && (
                    <span className="text-[10px] absolute -bottom-4 font-mono opacity-80">{secondsRemaining}s</span>
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
