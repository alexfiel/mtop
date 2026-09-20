"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Camera,
  Upload,
  Trash2,
  Eye,
  FileCheck,
  Loader2,
  Car,
  FileText,
  ExternalLink,
} from "lucide-react";
import { VehicleCameraModal } from "./vehicle-camera-modal";
import { toast } from "sonner";

export interface VehicleMediaUploaderProps {
  label: string;
  description?: string;
  value?: string | null;
  onChange: (url: string) => void;
  aspectMode?: "landscape" | "document";
  iconType?: "car" | "document";
  required?: boolean;
}

export function VehicleMediaUploader({
  label,
  description = "Upload a high-resolution photo or scan.",
  value,
  onChange,
  aspectMode = "landscape",
  iconType = "car",
  required = false,
}: VehicleMediaUploaderProps) {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isPdf = value?.toLowerCase().endsWith(".pdf");

  const uploadFile = async (file: File) => {
    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("File upload failed");
      const data = await res.json();
      if (data.url) {
        onChange(data.url);
        toast.success(`${label} uploaded successfully.`);
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to upload file. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  const handleCameraCapture = async (base64Img: string) => {
    try {
      setIsUploading(true);
      const res = await fetch(base64Img);
      const blob = await res.blob();
      const file = new File([blob], `vehicle-${Date.now()}.jpg`, {
        type: "image/jpeg",
      });
      await uploadFile(file);
    } catch (err) {
      console.error(err);
      // Fallback: use raw base64 if upload fails
      onChange(base64Img);
      setIsUploading(false);
      toast.success(`${label} captured.`);
    }
  };

  const handleRemove = () => {
    onChange("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-2.5 p-3.5 border rounded-xl bg-card/70 shadow-2xs hover:border-primary/40 transition-colors">
      {/* HEADER */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="p-1 rounded-md bg-primary/10 text-primary">
              {iconType === "car" ? <Car className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
            </span>
            <span className="text-xs font-bold text-foreground">{label}</span>
            {required && <span className="text-xs font-semibold text-destructive">*</span>}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">{description}</p>
        </div>

        {value && (
          <Badge variant="outline" className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1 bg-emerald-500/5">
            <FileCheck className="h-3 w-3" />
            Attached
          </Badge>
        )}
      </div>

      {/* BODY / PREVIEW AREA */}
      {value ? (
        <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 border">
          {/* Thumbnail / Document Box */}
          <div className="relative h-16 w-24 rounded-md overflow-hidden bg-muted border shrink-0 flex items-center justify-center">
            {isPdf ? (
              <div className="flex flex-col items-center justify-center p-1 text-center">
                <FileText className="h-6 w-6 text-primary" />
                <span className="text-[9px] font-mono uppercase text-muted-foreground mt-0.5">PDF Scan</span>
              </div>
            ) : (
              <img
                src={value}
                alt={label}
                className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                onClick={() => window.open(value, "_blank")}
              />
            )}
          </div>

          {/* Details & Actions */}
          <div className="flex-1 min-w-0 space-y-1">
            <div className="text-xs font-medium truncate text-foreground">
              {value.split("/").pop() || "Document"}
            </div>
            <div className="flex items-center gap-1.5 pt-0.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-[11px] gap-1 px-2"
                onClick={() => window.open(value, "_blank")}
              >
                <Eye className="h-3 w-3" />
                View Full
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-[11px] gap-1 px-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={handleRemove}
              >
                <Trash2 className="h-3 w-3" />
                Remove
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* UPLOAD / CAPTURE BUTTONS */
        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/png, image/jpeg, image/webp, application/pdf"
            className="hidden"
          />

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="h-8 text-xs gap-1.5 font-medium"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-3.5 w-3.5 text-muted-foreground" />
                Upload File
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isUploading}
            onClick={() => setIsCameraOpen(true)}
            className="h-8 text-xs gap-1.5 font-medium text-primary hover:text-primary hover:bg-primary/5 border-primary/30"
          >
            <Camera className="h-3.5 w-3.5" />
            Capture with Camera
          </Button>

          <span className="text-[10px] text-muted-foreground ml-auto hidden sm:inline font-mono">
            JPG, PNG or PDF
          </span>
        </div>
      )}

      {/* CAMERA CAPTURE MODAL */}
      <VehicleCameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
        title={`Capture ${label}`}
        description={`Center the ${label.toLowerCase()} in the camera frame.`}
        aspectMode={aspectMode}
      />
    </div>
  );
}
