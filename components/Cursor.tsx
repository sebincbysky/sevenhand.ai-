import React from 'react';

interface CursorProps {
  position: { x: number; y: number } | null;
}

export const Cursor: React.FC<CursorProps> = ({ position }) => {
  if (!position) return null;

  return (
    <div 
      className="fixed pointer-events-none z-50 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
      style={{ 
        left: position.x, 
        top: position.y,
      }}
    >
      <div className="w-8 h-8 rounded-full border-4 border-blue-500 bg-white/20 shadow-[0_0_15px_rgba(59,130,246,0.8)] backdrop-blur-sm"></div>
      <div className="absolute w-2 h-2 bg-blue-500 rounded-full"></div>
    </div>
  );
};
