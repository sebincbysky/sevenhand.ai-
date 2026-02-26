import React, { useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import Webcam from 'react-webcam';

export const useHandTracking = (webcamRef: React.RefObject<Webcam | null>, isEnabled: boolean = true) => {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const requestRef = useRef<number>();
  const [cursorPosition, setCursorPosition] = useState<{ x: number; y: number } | null>(null);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const initMediapipe = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );
        
        handLandmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        });
        
        setIsReady(true);
      } catch (err) {
        console.error(err);
        setError("Failed to initialize hand tracking. Please ensure camera permissions are granted.");
      }
    };

    initMediapipe();

    return () => {
      if (handLandmarkerRef.current) {
        handLandmarkerRef.current.close();
      }
    };
  }, []);

  const detect = () => {
    if (isEnabled && handLandmarkerRef.current && isReady && webcamRef.current?.video) {
       const video = webcamRef.current.video;
       if (video.readyState >= 2 && !video.paused && !video.ended) {
          try {
             const results = handLandmarkerRef.current.detectForVideo(video, performance.now());
             if (results.landmarks && results.landmarks.length > 0) {
               const indexTip = results.landmarks[0][8];
               const rawX = (1 - indexTip.x) * window.innerWidth; 
               const rawY = indexTip.y * window.innerHeight;

               // Smoothing
               const alpha = 0.4; // 0.0 to 1.0 (lower is smoother but more lag)
               let finalX = rawX;
               let finalY = rawY;

               if (lastPosRef.current) {
                 finalX = lastPosRef.current.x + (rawX - lastPosRef.current.x) * alpha;
                 finalY = lastPosRef.current.y + (rawY - lastPosRef.current.y) * alpha;
               }

               lastPosRef.current = { x: finalX, y: finalY };
               setCursorPosition({ x: finalX, y: finalY });
             } else {
               // Optional: clear cursor if hand lost, or keep last position
               // setCursorPosition(null);
               // lastPosRef.current = null;
             }
          } catch (e) {
             // Ignore transient errors
          }
       }
    } else if (!isEnabled) {
       setCursorPosition(null);
       lastPosRef.current = null;
    }
    
    requestRef.current = requestAnimationFrame(detect);
  };

  useEffect(() => {
    if (isReady) {
      requestRef.current = requestAnimationFrame(detect);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isReady, isEnabled]);

  return { isReady, error, cursorPosition };
};