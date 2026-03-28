
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera, X, ScanLine } from 'lucide-react';
import type { CameraGuidance } from '../types';

interface CameraViewProps {
  onCapture: (imageDataUrl: string) => void;
  onExit: () => void;
}

const guidanceSteps: CameraGuidance[] = [
  { message: 'Center the medicine package in the frame', boxVisible: true, boxColor: 'border-yellow-400' },
  { message: 'Ensure good lighting', boxVisible: true, boxColor: 'border-yellow-400' },
  { message: 'Move a little closer...', boxVisible: true, boxColor: 'border-yellow-400' },
  { message: 'Hold steady...', boxVisible: true, boxColor: 'border-green-400' },
];

export const CameraView: React.FC<CameraViewProps> = ({ onCapture, onExit }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [guidance, setGuidance] = useState<CameraGuidance>(guidanceSteps[0]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let guidanceInterval: number;
    
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }

        let step = 0;
        guidanceInterval = window.setInterval(() => {
          step = (step + 1) % guidanceSteps.length;
          setGuidance(guidanceSteps[step]);
        }, 2500);

      } catch (err) {
        console.error("Error accessing camera:", err);
        setError("Could not access the camera. Please check permissions and try again.");
      }
    };
    
    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      clearInterval(guidanceInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCapture = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      const context = canvas.getContext('2d');
      if (context) {
        const MAX_WIDTH = 1024;
        const MAX_HEIGHT = 1024;
        let width = video.videoWidth;
        let height = video.videoHeight;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        context.drawImage(video, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        onCapture(dataUrl);
      }
    }
  }, [onCapture]);

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center text-white p-4">
        <h2 className="text-xl font-bold text-red-500 mb-4">{error}</h2>
        <button
          onClick={onExit}
          className="mt-4 px-6 py-2 bg-slate-600 rounded-lg text-white font-semibold hover:bg-slate-700"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center">
      <video ref={videoRef} autoPlay playsInline className="absolute top-0 left-0 w-full h-full object-cover"></video>
      <canvas ref={canvasRef} className="hidden"></canvas>
      
      {/* Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
        <div className={`w-full max-w-sm h-48 border-4 ${guidance.boxColor} rounded-2xl bg-black/20 transition-all`}></div>
        <p className="mt-4 text-white text-lg font-semibold bg-black/50 px-4 py-2 rounded-lg">{guidance.message}</p>
      </div>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent flex justify-around items-center">
        <button onClick={onExit} className="p-4 rounded-full bg-white/20 hover:bg-white/30 text-white">
          <X className="w-8 h-8" />
        </button>
        <button onClick={handleCapture} className="p-4 rounded-full bg-white ring-4 ring-offset-4 ring-offset-transparent ring-white">
          <Camera className="w-10 h-10 text-slate-800" />
        </button>
        <div className="w-20"></div> {/* Spacer */}
      </div>
    </div>
  );
};
