import React, { useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';

export const useLightTracking = (webcamRef: React.RefObject<Webcam | null>, isEnabled: boolean = true, mode: 'red' | 'white' = 'red') => {
  const [isReady, setIsReady] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [cursorPosition, setCursorPosition] = useState<{ x: number; y: number } | null>(null);
  
  const requestRef = useRef<number>();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const lastSeenRef = useRef<number>(0);

  useEffect(() => {
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }
  }, []);

  const detect = () => {
    if (isEnabled && webcamRef.current?.video) {
      const video = webcamRef.current.video;
      if (video.readyState >= 2 && !video.paused && !video.ended) {
        const canvas = canvasRef.current!;
        const processWidth = 160;
        const processHeight = 120;
        canvas.width = processWidth;
        canvas.height = processHeight;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
        if (ctx) {
          ctx.drawImage(video, 0, 0, processWidth, processHeight);
          const imageData = ctx.getImageData(0, 0, processWidth, processHeight);
          const data = imageData.data;
          
          let sumX = 0;
          let sumY = 0;
          let count = 0;

          // Find bright pixels
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            let isTargetLight = false;

            if (mode === 'red') {
              // Threshold for a bright red light (high red, low green/blue)
              if (r > 180 && g < 100 && b < 100) {
                isTargetLight = true;
              }
            } else if (mode === 'white') {
              // Threshold for a bright white light (high r, g, b)
              if (r > 220 && g > 220 && b > 220) {
                isTargetLight = true;
              }
            }

            if (isTargetLight) {
              const pixelIndex = i / 4;
              const x = pixelIndex % processWidth;
              const y = Math.floor(pixelIndex / processWidth);
              sumX += x;
              sumY += y;
              count++;
            }
          }

          const now = performance.now();

          // If there are two red lights, this naturally averages their positions to find the centroid.
          if (count > 5) { // Light detected
            lastSeenRef.current = now;
            setIsConnected(true);
            
            const centerX = sumX / count;
            const centerY = sumY / count;
            
            // Mirror X because webcam is mirrored for the user
            const normalizedX = 1 - (centerX / processWidth); 
            const normalizedY = centerY / processHeight;

            // Amplify movement so the user doesn't have to move too far
            const dx = (normalizedX - 0.5) * 2.5; 
            const dy = (normalizedY - 0.5) * 2.5;
            
            let targetX = 0.5 + dx;
            let targetY = 0.5 + dy;
            
            targetX = Math.max(0, Math.min(1, targetX));
            targetY = Math.max(0, Math.min(1, targetY));

            const rawX = targetX * window.innerWidth;
            const rawY = targetY * window.innerHeight;

            const alpha = 0.3; // Smoothing factor
            let finalX = rawX;
            let finalY = rawY;

            if (lastPosRef.current) {
              finalX = lastPosRef.current.x + (rawX - lastPosRef.current.x) * alpha;
              finalY = lastPosRef.current.y + (rawY - lastPosRef.current.y) * alpha;
            }

            lastPosRef.current = { x: finalX, y: finalY };
            setCursorPosition({ x: finalX, y: finalY });
          } else {
            // Allow 1.5 seconds of "off" time for the flashing light before disconnecting
            if (now - lastSeenRef.current > 1500) {
              setIsConnected(false);
            }
          }
        }
      }
    } else if (!isEnabled) {
      setIsConnected(false);
      setCursorPosition(null);
      lastPosRef.current = null;
    }
    
    requestRef.current = requestAnimationFrame(detect);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(detect);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isEnabled, mode]);

  return { isReady, isConnected, cursorPosition, error: null };
};
