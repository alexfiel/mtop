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
import { Camera, RefreshCw, Check, SwitchCamera, AlertCircle, User, CreditCard } from "lucide-react";

export interface DriverCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageSrc: string) => void;
  title?: string;
  description?: string;
  mode?: "portrait" | "card";
}

export function DriverCameraModal({
  isOpen,
  onClose,
  onCapture,
  title = "Capture Photo",
  description = "Frame the subject clearly with adequate lighting.",
  mode = "portrait",
}: DriverCameraModalProps) {
  const webcamRef = useRef<Webcam>(null);
  const [capturedSrc, setCapturedSrc] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">(mode === "portrait" ? "user" : "environment");
  const [hasCameraError, setHasCameraError] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);

  const handleCapture = useCallback(() => {
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 200);

    const screenshot = webcamRef.current?.getScreenshot({
      width: mode === "portrait" ? 1080 : 1600,
      height: mode === "portrait" ? 1080 : 1000,
    });

    if (screenshot) {
      setCapturedSrc(screenshot);
    }
  }, [webcamRef, mode]);

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

  const frameClass = mode === "portrait" ? "aspect-square max-w-xs" : "aspect-[1.58/1] max-w-lg";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-xl p-0 overflow-hidden bg-background border shadow-2xl">
        <DialogHeader className="p-4 pb-2 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-primary/10 text-primary">
              {mode === "portrait" ? <User className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />}
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
            className={`relative w-full ${frameClass} rounded-xl overflow-hidden bg-slate-900 border-2 border-primary/20 shadow-inner flex items-center justify-center`}
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
                  videoConstraints={{
                    facingMode: facingMode,
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                  }}
                  onUserMediaError={() => setHasCameraError(true)}
                  className="w-full h-full object-cover"
                />

                {/* Framing Guidelines Overlay */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  {mode === "portrait" ? (
                    <div className="w-48 h-56 border-2 border-dashed border-white/60 rounded-full flex items-center justify-center">
                      <span className="text-[10px] text-white/70 bg-black/40 px-2 py-0.5 rounded-full">
                        Face Outline
                      </span>
                    </div>
                  ) : (
                    <div className="w-5/6 h-4/5 border-2 border-dashed border-white/60 rounded-lg flex items-center justify-center">
                      <span className="text-[10px] text-white/70 bg-black/40 px-2 py-0.5 rounded-full">
                        Align ID Card Here
                      </span>
                    </div>
                  )}
                </div>
              </>
            )}

            {hasCameraError && (
              <div className="absolute inset-0 bg-background/90 flex flex-col items-center justify-center p-4 text-center">
                <AlertCircle className="h-8 w-8 text-destructive mb-2" />
                <p className="text-sm font-medium text-destructive">Camera Access Denied or Unavailable</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  Please enable camera permissions in your browser or upload an image file instead.
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between w-full max-w-md">
            {!capturedSrc ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={toggleFacingMode}
                  className="gap-1 text-xs"
                >
                  <SwitchCamera className="h-3.5 w-3.5" />
                  Flip Camera
                </Button>

                <Button
                  type="button"
                  onClick={handleCapture}
                  disabled={hasCameraError}
                  className="gap-2 px-6 shadow-md"
                >
                  <Camera className="h-4 w-4" />
                  Take Snapshot
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  className="text-xs"
                >
                  Cancel
                </Button>
              </>
            ) : (
              <div className="flex items-center justify-center gap-3 w-full">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleRetake}
                  className="gap-1.5"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Retake Photo
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirm}
                  className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Check className="h-3.5 w-3.5" />
                  Use Photo
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
