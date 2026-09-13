"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Upload, Trash2, Eye, FileCheck, Loader2 } from "lucide-react";
import { OperatorCameraModal } from "./operator-camera-modal";

interface DocumentUploaderProps {
  label: string;
  description?: string;
  value?: string;
  onChange: (url: string) => void;
  required?: boolean;
}

export function DocumentUploader({
  label,
  description = "Upload a clear scan or photo of your document.",
  value,
  onChange,
  required = false,
}: DocumentUploaderProps) {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      }
    } catch (err) {
      console.error(err);
      alert("Failed to upload file. Please try again.");
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
      const file = new File([blob], `captured-${Date.now()}.jpg`, {
        type: "image/jpeg",
      });
      await uploadFile(file);
    } catch (err) {
      console.error(err);
      // Fallback: use raw base64 if upload fails
      onChange(base64Img);
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    onChange("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-2 p-4 border rounded-xl bg-card/60 backdrop-blur-xs shadow-xs hover:border-primary/40 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold text-foreground">{label}</span>
            {required && <span className="text-xs font-semibold text-destructive">*</span>}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>

        {value && (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
            <FileCheck className="h-3 w-3" />
            Uploaded
          </span>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/png,image/webp,application/pdf"
        className="hidden"
      />

      {isUploading ? (
        <div className="h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 bg-muted/20 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-xs font-medium">Uploading document...</span>
        </div>
      ) : value ? (
        <div className="relative group rounded-lg overflow-hidden border bg-muted/30 aspect-[1.586/1] max-h-44 flex items-center justify-center">
          <img
            src={value}
            alt={label}
            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-102"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <a
              href={value}
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-full bg-white/20 hover:bg-white/40 text-white backdrop-blur-xs transition"
              title="Preview Image"
            >
              <Eye className="h-4 w-4" />
            </a>
            <button
              type="button"
              onClick={handleRemove}
              className="p-2 rounded-full bg-red-500/80 hover:bg-red-600 text-white backdrop-blur-xs transition"
              title="Remove Image"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="border-2 border-dashed border-border rounded-lg p-4 flex flex-col items-center justify-center text-center gap-3 bg-muted/10 hover:bg-muted/20 transition-colors">
          <p className="text-xs text-muted-foreground">
            Capture with camera or upload image (JPG, PNG)
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCameraOpen(true)}
              className="gap-1.5 bg-background shadow-xs hover:border-primary"
            >
              <Camera className="h-4 w-4 text-primary" />
              Capture with Camera
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="gap-1.5 shadow-xs"
            >
              <Upload className="h-4 w-4" />
              Browse File
            </Button>
          </div>
        </div>
      )}

      {/* Camera Capture Modal */}
      <OperatorCameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
        title={`Capture ${label}`}
        description="Position the ID document steadily within the card frame and take a photo."
        aspectMode="idCard"
      />
    </div>
  );
}
