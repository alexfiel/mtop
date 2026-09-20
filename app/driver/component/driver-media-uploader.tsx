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
  User,
  CreditCard,
  FileText,
  ExternalLink,
} from "lucide-react";
import { DriverCameraModal } from "./driver-camera-modal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export interface DriverMediaUploaderProps {
  label: string;
  description?: string;
  value?: string | null;
  onChange: (url: string) => void;
  mode?: "portrait" | "card";
  required?: boolean;
}

export function DriverMediaUploader({
  label,
  description = "Upload a high-resolution photo or scan.",
  value,
  onChange,
  mode = "portrait",
  required = false,
}: DriverMediaUploaderProps) {
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
      const file = new File([blob], `driver-${mode}-${Date.now()}.jpg`, {
        type: "image/jpeg",
      });
      await uploadFile(file);
    } catch (err) {
      console.error(err);
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
              {mode === "portrait" ? <User className="h-3.5 w-3.5" /> : <CreditCard className="h-3.5 w-3.5" />}
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
          {/* Thumbnail Box */}
          <div
            className={`relative ${
              mode === "portrait" ? "h-16 w-16" : "h-16 w-24"
            } rounded-md overflow-hidden bg-muted border shrink-0 flex items-center justify-center`}
          >
            {isPdf ? (
              <div className="flex flex-col items-center justify-center p-1 text-center">
                <FileText className="h-6 w-6 text-primary" />
                <span className="text-[9px] font-mono uppercase text-muted-foreground mt-0.5">PDF</span>
              </div>
            ) : (
              <img
                src={value}
                alt={label}
                className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                onClick={() => setPreviewOpen(true)}
              />
            )}
          </div>

          {/* Details & Actions */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 text-xs font-medium text-foreground truncate">
              <span className="truncate">{value.split("/").pop()}</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Ready for driver verification
            </p>

            <div className="flex items-center gap-2 mt-2">
              {!isPdf && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewOpen(true)}
                  className="h-6 px-2 text-[11px] gap-1"
                >
                  <Eye className="h-3 w-3" />
                  View
                </Button>
              )}
              {isPdf && (
                <a
                  href={value}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center h-6 px-2 text-[11px] gap-1 rounded-md border border-input bg-background hover:bg-muted text-foreground transition-colors"
                >
                  <ExternalLink className="h-3 w-3" />
                  Open PDF
                </a>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                className="h-6 px-2 text-[11px] text-destructive hover:text-destructive gap-1 hover:bg-destructive/10"
              >
                <Trash2 className="h-3 w-3" />
                Remove
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept={mode === "portrait" ? "image/*" : "image/*,.pdf"}
            className="hidden"
          />

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="h-8 text-xs gap-1.5 bg-background shadow-2xs hover:bg-muted"
          >
            {isUploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Upload className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            Upload File
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isUploading}
            onClick={() => setIsCameraOpen(true)}
            className="h-8 text-xs gap-1.5 bg-background shadow-2xs hover:bg-muted"
          >
            <Camera className="h-3.5 w-3.5 text-primary" />
            Take Snapshot
          </Button>

          <span className="text-[10px] text-muted-foreground">
            {mode === "portrait" ? "JPG or PNG photo" : "JPG, PNG, or PDF"}
          </span>
        </div>
      )}

      {/* CAMERA CAPTURE MODAL */}
      <DriverCameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
        title={`Capture ${label}`}
        description={
          mode === "portrait"
            ? "Frame the driver's face clearly looking straight into the camera."
            : "Place the LTO Driver's License flat and align with the frame."
        }
        mode={mode}
      />

      {/* FULL PREVIEW MODAL */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-2xl p-4 bg-background">
          <DialogHeader className="pb-2 border-b">
            <DialogTitle className="text-sm font-semibold">{label} Preview</DialogTitle>
          </DialogHeader>
          <div className="py-2 flex items-center justify-center max-h-[75vh] overflow-auto">
            {value && !isPdf && (
              <img
                src={value}
                alt={label}
                className="max-h-[65vh] w-auto rounded-lg object-contain border shadow-md"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
