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
import { Camera, RefreshCw, Check, SwitchCamera, AlertCircle, Sparkles, Car, FileText } from "lucide-react";

export interface VehicleCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageSrc: string) => void;
  title?: string;
  description?: string;
  aspectMode?: "landscape" | "document";
}

export function VehicleCameraModal({
  isOpen,
  onClose,
  onCapture,
  title = "Capture Photo",
  description = "Center the vehicle or document clearly in the frame and ensure sufficient lighting.",
  aspectMode = "landscape",
}: VehicleCameraModalProps) {
  const webcamRef = useRef<Webcam>(null);
  const [capturedSrc, setCapturedSrc] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [hasCameraError, setHasCameraError] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);

  const handleCapture = useCallback(() => {
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 200);

    const screenshot = webcamRef.current?.getScreenshot({
      width: 1920,
      height: 1080,
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

  // Framing dimensions
  const getAspectClass = () => {
    switch (aspectMode) {
      case "document":
        return "aspect-[1.414/1] max-w-lg"; // Standard document landscape ratio
      case "landscape":
      default:
        return "aspect-[16/9] max-w-lg";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-xl p-0 overflow-hidden bg-background border shadow-2xl">
        <DialogHeader className="p-4 pb-2 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-primary/10 text-primary">
              {aspectMode === "document" ? <FileText className="h-4 w-4" /> : <Car className="h-4 w-4" />}
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
                alt="Captured Preview"
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
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                  }}
                  onUserMediaError={() => setHasCameraError(true)}
                />

                {/* Framing Overlay Guide */}
                <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-white/40 rounded-lg m-3 flex flex-col items-center justify-between p-3">
                  <div className="text-[11px] font-medium text-white/90 bg-black/60 px-2.5 py-1 rounded-full backdrop-blur-xs flex items-center gap-1.5 shadow-sm">
                    <Sparkles className="h-3 w-3 text-amber-400" />
                    {aspectMode === "document" ? "Align Official CR / OR Within Bounds" : "Center Tricycle Unit (Front/Side View)"}
                  </div>
                  <div className="w-16 h-1 bg-white/30 rounded-full" />
                </div>
              </>
            )}

            {hasCameraError && !capturedSrc && (
              <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center text-center p-6 text-white gap-2">
                <AlertCircle className="h-8 w-8 text-destructive" />
                <p className="text-sm font-medium">Camera access not available</p>
                <p className="text-xs text-slate-400">
                  Please grant camera permission in your browser or choose file upload directly.
                </p>
              </div>
            )}
          </div>

          {/* Controls below camera preview */}
          <div className="mt-4 flex items-center justify-center gap-3 w-full">
            {capturedSrc ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRetake}
                  className="gap-1.5 text-xs"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Retake Photo
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleConfirm}
                  className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                >
                  <Check className="h-3.5 w-3.5" />
                  Use This Capture
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={toggleFacingMode}
                  title="Switch Front/Back Camera"
                  className="gap-1.5 text-xs"
                  disabled={hasCameraError}
                >
                  <SwitchCamera className="h-3.5 w-3.5" />
                  Flip Camera
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleCapture}
                  disabled={hasCameraError}
                  className="gap-1.5 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-5"
                >
                  <Camera className="h-3.5 w-3.5" />
                  Take Snapshot
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
