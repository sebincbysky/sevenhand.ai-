import React, { useEffect, useRef, useState } from 'react';
import { FilesetResolver, FaceLandmarker } from '@mediapipe/tasks-vision';
import Webcam from 'react-webcam';

export const useHeadTracking = (webcamRef: React.RefObject<Webcam | null>, isEnabled: boolean = true) => {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const requestRef = useRef<number>();
  const [cursorPosition, setCursorPosition] = useState<{ x: number; y: number } | null>(null);
  const [isClicking, setIsClicking] = useState(false);
  
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  
  // Double click logic state
  const lastMouthOpenTime = useRef<number>(0);
  const isMouthCurrentlyOpen = useRef<boolean>(false);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const initMediapipe = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );
        
        faceLandmarkerRef.current = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numFaces: 1
        });
        
        setIsReady(true);
      } catch (err) {
        console.error(err);
        setError("Failed to initialize head tracking. Please ensure camera permissions are granted.");
      }
    };

    initMediapipe();

    return () => {
      if (faceLandmarkerRef.current) {
        faceLandmarkerRef.current.close();
      }
    };
  }, []);

  const detect = () => {
    if (isEnabled && faceLandmarkerRef.current && isReady && webcamRef.current?.video) {
       const video = webcamRef.current.video;
       if (video.readyState >= 2 && !video.paused && !video.ended) {
          try {
             const results = faceLandmarkerRef.current.detectForVideo(video, performance.now());
             if (results.faceLandmarks && results.faceLandmarks.length > 0) {
               const face = results.faceLandmarks[0];
               
               // Use nose tip (landmark 1) for cursor
               const noseTip = face[1];
               
               // Mouth open detection for clicking
               const upperLip = face[13];
               const lowerLip = face[14];
               const mouthDistance = Math.abs(upperLip.y - lowerLip.y);
               
               const now = performance.now();
               const isMouthOpen = mouthDistance > 0.02; // Threshold for mouth open
               
               if (isMouthOpen && !isMouthCurrentlyOpen.current) {
                 // Mouth just opened
                 isMouthCurrentlyOpen.current = true;
                 
                 if (now - lastMouthOpenTime.current < 800) {
                   // Double click detected!
                   setIsClicking(true);
                   lastMouthOpenTime.current = 0; // Reset
                   
                   if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
                   clickTimeoutRef.current = setTimeout(() => {
                     setIsClicking(false);
                   }, 300); // Keep click active for 300ms
                 } else {
                   lastMouthOpenTime.current = now;
                 }
               } else if (!isMouthOpen) {
                 isMouthCurrentlyOpen.current = false;
               }
               
               const dx = (0.5 - noseTip.x) * 2; 
               const dy = (noseTip.y - 0.5) * 2; 
               
               const sensitivityX = 1.5;
               const sensitivityY = 1.5;
               
               let targetX = 0.5 + (dx * sensitivityX);
               let targetY = 0.5 + (dy * sensitivityY);
               
               targetX = Math.max(0, Math.min(1, targetX));
               targetY = Math.max(0, Math.min(1, targetY));
               
               const rawX = targetX * window.innerWidth;
               const rawY = targetY * window.innerHeight;

               const alpha = 0.7; // Increased from 0.3 to reduce lag
               let finalX = rawX;
               let finalY = rawY;

               if (lastPosRef.current) {
                 finalX = lastPosRef.current.x + (rawX - lastPosRef.current.x) * alpha;
                 finalY = lastPosRef.current.y + (rawY - lastPosRef.current.y) * alpha;
               }

               lastPosRef.current = { x: finalX, y: finalY };
               setCursorPosition({ x: finalX, y: finalY });
             }
          } catch (e) {
             // Ignore transient errors
          }
       }
    } else if (!isEnabled) {
       setCursorPosition(null);
       setIsClicking(false);
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
      if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
    };
  }, [isReady, isEnabled]);

  return { isReady, error, cursorPosition, isClicking };
};
