"use client";

import { useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";
import { Button } from "@/components/ui/button";
import { Camera, RefreshCw } from "lucide-react";

export function CameraCapture({ 
  onCapture, 
  label 
}: { 
  onCapture: (imageSrc: string) => void;
  label: string;
}) {
  const webcamRef = useRef<Webcam>(null);
  const [imgSrc, setImgSrc] = useState<string | null>(null);

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setImgSrc(imageSrc);
      onCapture(imageSrc);
    }
  }, [webcamRef, onCapture]);

  const retake = () => {
    setImgSrc(null);
    onCapture("");
  };

  return (
    <div className="flex flex-col items-center space-y-4 border rounded-md p-4 bg-slate-50">
      <h3 className="font-semibold text-sm">{label}</h3>
      
      <div className="relative w-full max-w-sm rounded-md overflow-hidden bg-black aspect-video flex items-center justify-center">
        {imgSrc ? (
          <img src={imgSrc} alt="captured" className="w-full h-full object-cover" />
        ) : (
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            className="w-full h-full object-cover"
            videoConstraints={{
              facingMode: "user"
            }}
          />
        )}
      </div>

      <div className="flex gap-2">
        {imgSrc ? (
          <Button type="button" variant="outline" onClick={retake}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Retake Photo
          </Button>
        ) : (
          <Button type="button" onClick={capture}>
            <Camera className="mr-2 h-4 w-4" />
            Capture Photo
          </Button>
        )}
      </div>
    </div>
  );
}
