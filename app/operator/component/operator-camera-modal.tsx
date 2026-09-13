"use client";

import { useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Camera, RefreshCw, Check, SwitchCamera, AlertCircle, Sparkles } from "lucide-react";

interface OperatorCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageSrc: string) => void;
  title?: string;
  description?: string;
  aspectMode?: "portrait" | "idCard" | "landscape";
}

export function OperatorCameraModal({
  isOpen,
  onClose,
  onCapture,
  title = "Capture Photo",
  description = "Center the subject within the frame and ensure adequate lighting.",
  aspectMode = "portrait",
}: OperatorCameraModalProps) {
  const webcamRef = useRef<Webcam>(null);
  const [capturedSrc, setCapturedSrc] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [hasCameraError, setHasCameraError] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);

  const handleCapture = useCallback(() => {
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 200);

    const screenshot = webcamRef.current?.getScreenshot({
      width: 1280,
      height: 960,
    });

    if (screenshot) {
      setCapturedSrc(screenshot);
    }
  }, [webcamRef]);

  const handleConfirm = () => {
    if (capturedSrc) {
      onCapture(capturedSrc);
      setCapturedSrc(null);
      onClose();
    }
  };

  const handleRetake = () => {
    setCapturedSrc(null);
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  const handleClose = () => {
    setCapturedSrc(null);
    setHasCameraError(false);
    onClose();
  };

  // Framing dimensions based on aspectMode
  const getAspectClass = () => {
    switch (aspectMode) {
      case "idCard":
        return "aspect-[1.586/1] max-w-md"; // standard CR80 ID card ratio
      case "portrait":
        return "aspect-[3/4] max-w-xs";
      case "landscape":
      default:
        return "aspect-video max-w-md";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden bg-background border shadow-2xl">
        <DialogHeader className="p-4 pb-2 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-primary/10 text-primary">
              <Camera className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">{title}</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-4 flex flex-col items-center justify-center bg-slate-950/5">
          <div
            className={`relative w-full ${getAspectClass()} rounded-xl overflow-hidden bg-slate-900 border-2 border-primary/20 shadow-inner flex items-center justify-center`}
          >
            {isFlashing && (
              <div className="absolute inset-0 bg-white z-20 pointer-events-none animate-out fade-out duration-200" />
            )}

            {capturedSrc ? (
              <img
                src={capturedSrc}
                alt="Captured Operator"
                className="w-full h-full object-cover"
              />
            ) : (
              <>
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  screenshotQuality={0.92}
                  className={`w-full h-full object-cover ${
                    facingMode === "user" ? "scale-x-[-1]" : ""
                  }`}
                  videoConstraints={{
                    facingMode,
                    width: { ideal: 1280 },
                    height: { ideal: 960 },
                  }}
                  onUserMediaError={() => setHasCameraError(true)}
                />

                {/* Framing Overlay Guide */}
                <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-white/30 rounded-lg m-3 flex flex-col items-center justify-between p-3">
                  <div className="text-[11px] font-medium text-white/70 bg-black/40 px-2 py-0.5 rounded backdrop-blur-xs flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-amber-400" />
                    {aspectMode === "idCard" ? "Align Card In Frame" : "Center Face In Frame"}
                  </div>
                  <div className="w-12 h-0.5 bg-white/20 rounded" />
                </div>
              </>
            )}

            {hasCameraError && !capturedSrc && (
              <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center text-center p-6 text-white gap-2">
                <AlertCircle className="h-8 w-8 text-destructive" />
                <p className="text-sm font-medium">Camera access not available</p>
                <p className="text-xs text-slate-400">
                  Please enable camera permissions in your browser or upload a photo directly.
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons below preview */}
          <div className="mt-4 flex items-center justify-center gap-3 w-full">
            {capturedSrc ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRetake}
                  className="gap-1.5"
                >
                  <RefreshCw className="h-4 w-4" />
                  Retake Photo
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleConfirm}
                  className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Check className="h-4 w-4" />
                  Use This Photo
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={toggleFacingMode}
                  title="Switch Camera"
                  className="gap-1.5"
                  disabled={hasCameraError}
                >
                  <SwitchCamera className="h-4 w-4" />
                  Flip Camera
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleCapture}
                  disabled={hasCameraError}
                  className="gap-2 px-6 shadow-sm"
                >
                  <Camera className="h-4 w-4" />
                  Snap Photo
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
