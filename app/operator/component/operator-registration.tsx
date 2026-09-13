"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Camera,
  Upload,
  User,
  CreditCard,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ShieldCheck,
  RotateCcw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileText,
} from "lucide-react";
import { registerOperator, getNextOperatorId } from "../actions";
import { OperatorCameraModal } from "./operator-camera-modal";
import { DocumentUploader } from "./document-uploader";

// Common Philippine Valid IDs
const VALID_ID_OPTIONS = [
  "Philippine National ID (PhilSys)",
  "Driver's License (LTO)",
  "Unified Multi-Purpose ID (UMID)",
  "Philippine Passport (DFA)",
  "Postal ID (PhilPost)",
  "Voter's ID / Comelec Certificate",
  "Professional Regulation Commission (PRC) ID",
  "Social Security System (SSS) ID",
  "Government Service Insurance System (GSIS) eCard",
  "Senior Citizen ID",
  "Barangay Identification Certificate with Photo",
];

// Common Tagbilaran City Barangays for easy selection
const TAGBILARAN_BARANGAYS = [
  "Bool",
  "Booy",
  "Cabawan",
  "Cogon",
  "Dampas",
  "Dao",
  "Manga",
  "Mansasa",
  "Poblacion 1",
  "Poblacion 2",
  "Poblacion 3",
  "San Isidro",
  "Taloto",
  "Tiptip",
  "Ubujan",
];

const operatorSchema = z.object({
  operatorId: z.string().optional(),
  name: z.string().min(3, "Full Name must be at least 3 characters"),
  email: z.string().email("Please enter a valid email address"),
  mobileNo: z
    .string()
    .min(10, "Mobile number must be at least 10 digits")
    .regex(/^[0-9+() -]+$/, "Invalid mobile number format"),
  dateOfBirth: z.string().min(1, "Date of Birth is required"),

  // Complete Address: house number, street name, purok name, barangay, city/municipality, province, nation, zip code
  houseNumber: z.string().optional(),
  streetName: z.string().optional(),
  purokName: z.string().min(1, "Purok name is required"),
  barangay: z.string().min(1, "Barangay is required"),
  cityMunicipality: z.string().min(1, "City/Municipality is required"),
  province: z.string().min(1, "Province is required"),
  nation: z.string().min(1, "Nation is required"),
  zipCode: z.string().min(2, "Zip code is required"),

  validIDType: z.string().min(1, "Please select a Valid ID Type"),
  validIDNumber: z.string().min(2, "Valid ID Number is required"),
  validIDExpiryDate: z.string().min(1, "Valid ID Expiry Date is required"),
});

type OperatorFormData = z.infer<typeof operatorSchema>;

interface OperatorRegistrationProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function OperatorRegistration({ onSuccess, onCancel }: OperatorRegistrationProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string>("");
  const [validIdFront, setValidIdFront] = useState<string>("");
  const [validIdBack, setValidIdBack] = useState<string>("");
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [registeredSuccess, setRegisteredSuccess] = useState(false);
  const [isGeneratingId, setIsGeneratingId] = useState(false);
  const profileFileInputRef = useRef<HTMLInputElement>(null);

  // Fallback initial suggested Operator ID (format: OP-154-YYYY-0001)
  const generateFallbackOperatorId = () => {
    const year = new Date().getFullYear();
    return `OP-154-${year}-0001`;
  };

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm<OperatorFormData>({
    resolver: zodResolver(operatorSchema),
    defaultValues: {
      operatorId: generateFallbackOperatorId(),
      validIDType: VALID_ID_OPTIONS[0],
      houseNumber: "",
      streetName: "",
      purokName: "",
      barangay: "",
      cityMunicipality: "Tagbilaran City",
      province: "Bohol",
      nation: "Philippines",
      zipCode: "6300",
    },
  });

  // Fetch next incremental operator ID on mount
  useEffect(() => {
    let isMounted = true;
    getNextOperatorId()
      .then((id) => {
        if (isMounted && id) {
          setValue("operatorId", id);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch next sequential operator ID:", err);
      });

    return () => {
      isMounted = false;
    };
  }, [setValue]);

  const handleFetchNextId = async () => {
    try {
      setIsGeneratingId(true);
      const nextId = await getNextOperatorId();
      if (nextId) {
        setValue("operatorId", nextId);
        toast.info(`Updated to next sequential Operator ID: ${nextId}`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Could not fetch next Operator ID from server.");
    } finally {
      setIsGeneratingId(false);
    }
  };

  // Helper: format address as "house number, street name, purok name, barangay, city/municipality, province, nation, zip code"
  const formatCompleteAddress = (fields: {
    houseNumber?: string;
    streetName?: string;
    purokName?: string;
    barangay?: string;
    cityMunicipality?: string;
    province?: string;
    nation?: string;
    zipCode?: string;
  }) => {
    const parts = [
      fields.houseNumber?.trim(),
      fields.streetName?.trim(),
      fields.purokName?.trim(),
      fields.barangay?.trim(),
      fields.cityMunicipality?.trim(),
      fields.province?.trim(),
      fields.nation?.trim(),
      fields.zipCode?.trim(),
    ].filter(Boolean);

    return parts.join(", ");
  };

  // Watch address fields for real-time live preview
  const watchedAddress = watch([
    "houseNumber",
    "streetName",
    "purokName",
    "barangay",
    "cityMunicipality",
    "province",
    "nation",
    "zipCode",
  ]);

  const liveFormattedAddress = formatCompleteAddress({
    houseNumber: watchedAddress[0],
    streetName: watchedAddress[1],
    purokName: watchedAddress[2],
    barangay: watchedAddress[3],
    cityMunicipality: watchedAddress[4],
    province: watchedAddress[5],
    nation: watchedAddress[6],
    zipCode: watchedAddress[7],
  });

  const uploadBase64IfLocal = async (source: string, filename: string): Promise<string> => {
    // If it's already an uploaded URL like /uploads/..., keep as is
    if (source.startsWith("/uploads/") || source.startsWith("http")) {
      return source;
    }
    // Convert base64 data URI to a file and upload to /api/upload
    try {
      const fetchRes = await fetch(source);
      const blob = await fetchRes.blob();
      const file = new File([blob], filename, { type: "image/jpeg" });
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      return data.url || source;
    } catch (e) {
      console.warn("Base64 upload failed, falling back to data uri", e);
      return source;
    }
  };

  const handleProfileCameraCapture = async (base64Img: string) => {
    try {
      const uploadedUrl = await uploadBase64IfLocal(base64Img, `operator-face-${Date.now()}.jpg`);
      setProfilePicture(uploadedUrl);
    } catch {
      setProfilePicture(base64Img);
    }
  };

  const handleProfileFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      if (data.url) {
        setProfilePicture(data.url);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload profile photo.");
    }
  };

  const onSubmit = async (data: OperatorFormData) => {
    setServerError(null);

    if (!profilePicture) {
      setServerError("Operator photo is required. Please capture using camera or upload a photo.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (!validIdFront) {
      setServerError("Please upload or capture the Front of the Valid ID.");
      return;
    }

    try {
      setIsSubmitting(true);

      const finalProfilePic = await uploadBase64IfLocal(
        profilePicture,
        `operator-profile-${Date.now()}.jpg`
      );
      const finalIdFront = await uploadBase64IfLocal(
        validIdFront,
        `operator-id-front-${Date.now()}.jpg`
      );
      const finalIdBack = validIdBack
        ? await uploadBase64IfLocal(validIdBack, `operator-id-back-${Date.now()}.jpg`)
        : "";
      const {
        houseNumber,
        streetName,
        purokName,
        barangay,
        cityMunicipality,
        province,
        nation,
        zipCode,
        ...coreData
      } = data;

      const completeAddress = formatCompleteAddress({
        houseNumber,
        streetName,
        purokName,
        barangay,
        cityMunicipality,
        province,
        nation,
        zipCode,
      });

      const res = await registerOperator({
        ...coreData,
        address: completeAddress,
        profilePicture: finalProfilePic,
        validIdFront: finalIdFront,
        validIdBack: finalIdBack,
      });

      if (!res.success) {
        setServerError(res.error || "Failed to register operator.");
        return;
      }

      toast.success("Operator enrolled successfully!");
      setRegisteredSuccess(true);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setServerError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterAnother = async () => {
    let nextId = generateFallbackOperatorId();
    try {
      const fetchedId = await getNextOperatorId();
      if (fetchedId) nextId = fetchedId;
    } catch (err) {
      console.error(err);
    }

    reset({
      operatorId: nextId,
      validIDType: VALID_ID_OPTIONS[0],
      name: "",
      email: "",
      mobileNo: "",
      dateOfBirth: "",
      houseNumber: "",
      streetName: "",
      purokName: "",
      barangay: "",
      cityMunicipality: "Tagbilaran City",
      province: "Bohol",
      nation: "Philippines",
      zipCode: "6300",
      validIDNumber: "",
      validIDExpiryDate: "",
    });
    setProfilePicture("");
    setValidIdFront("");
    setValidIdBack("");
    setServerError(null);
    setRegisteredSuccess(false);
  };

  if (registeredSuccess) {
    return (
      <Card className="max-w-2xl mx-auto shadow-lg border-emerald-200 dark:border-emerald-800 bg-card">
        <CardContent className="pt-10 pb-10 flex flex-col items-center text-center gap-4">
          <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Operator Successfully Registered!
          </h2>
          <p className="text-sm text-muted-foreground max-w-md">
            The operator profile has been enrolled into the MTOP licensing database. The records are
            now pending verification and ready for franchise assignment.
          </p>

          <div className="flex gap-3 mt-4">
            <Button onClick={handleRegisterAnother} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Enroll Another Operator
            </Button>
            {onCancel && (
              <Button variant="outline" onClick={onCancel}>
                Return to List
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Form Card */}
      <Card className="shadow-md border bg-card">
        <CardHeader className="border-b bg-muted/20 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
                  MTOP Regulatory Registry
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  One-Operator One-Franchise
                </Badge>
              </div>
              <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
                Tricycle Operator Registration
              </CardTitle>
              <CardDescription className="text-sm mt-1">
                Enroll a new tricycle operator, capture biometric photo, and upload required government
                identification documents.
              </CardDescription>
            </div>
            <div className="p-3 bg-primary/5 rounded-xl border border-primary/20 flex items-center gap-3">
              <ShieldCheck className="h-8 w-8 text-primary" />
              <div className="text-xs text-muted-foreground">
                <p className="font-semibold text-foreground">BPLO Verified</p>
                <p>Anti-Fraud Security</p>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 sm:p-8">
          {serverError && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Registration Error</AlertTitle>
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* 1. OPERATOR PHOTO BIOMETRICS */}
            <div className="p-5 rounded-xl border bg-slate-50/50 dark:bg-slate-900/30">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                {/* Photo Avatar */}
                <div className="relative group shrink-0">
                  <div className="w-32 h-32 rounded-2xl overflow-hidden border-2 border-dashed border-primary/40 bg-muted/40 flex items-center justify-center shadow-inner">
                    {profilePicture ? (
                      <img
                        src={profilePicture}
                        alt="Operator Photo"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-muted-foreground p-2 text-center">
                        <User className="h-10 w-10 stroke-[1.5] mb-1 text-muted-foreground/60" />
                        <span className="text-[11px] font-medium leading-tight">No Photo</span>
                      </div>
                    )}
                  </div>

                  {profilePicture && (
                    <span className="absolute -bottom-2 -right-2 bg-emerald-600 text-white p-1.5 rounded-full shadow-md border-2 border-background">
                      <CheckCircle2 className="h-4 w-4" />
                    </span>
                  )}
                </div>

                {/* Photo Action Controls */}
                <div className="flex-1 space-y-2 text-center sm:text-left">
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <h3 className="text-base font-semibold text-foreground">
                      Operator Facial Biometrics
                    </h3>
                    <Badge variant="destructive" className="text-[10px] uppercase font-bold">
                      Required
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground max-w-md">
                    Capture the operator's live facial portrait using the webcam or upload a recent
                    passport-sized colored photograph with plain background.
                  </p>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 pt-2">
                    <Button
                      type="button"
                      onClick={() => setIsCameraOpen(true)}
                      className="gap-2 shadow-xs bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      <Camera className="h-4 w-4" />
                      {profilePicture ? "Retake Live Photo" : "Capture Operator via Camera"}
                    </Button>

                    <input
                      type="file"
                      ref={profileFileInputRef}
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleProfileFileChange}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => profileFileInputRef.current?.click()}
                      className="gap-2 shadow-xs"
                    >
                      <Upload className="h-4 w-4 text-muted-foreground" />
                      Upload Photo File
                    </Button>

                    {profilePicture && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setProfilePicture("")}
                        className="text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        Clear Photo
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. PERSONAL INFORMATION */}
            <div className="space-y-4">
              <div className="border-b pb-2">
                <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  Personal Information
                </h3>
                <p className="text-xs text-muted-foreground">
                  Official personal details matching the operator's government-issued credentials.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {/* Operator ID */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="operatorId" className="text-xs font-semibold">
                      Operator ID Number
                    </Label>
                    <button
                      type="button"
                      onClick={handleFetchNextId}
                      disabled={isGeneratingId}
                      className="text-[11px] text-primary hover:underline flex items-center gap-1 disabled:opacity-50"
                    >
                      {isGeneratingId ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" />
                          <span>Fetching...</span>
                        </>
                      ) : (
                        <>
                          <RotateCcw className="h-3 w-3" />
                          <span>Fetch Next ID</span>
                        </>
                      )}
                    </button>
                  </div>
                  <Input
                    id="operatorId"
                    placeholder={`OP-154-${new Date().getFullYear()}-0001`}
                    {...register("operatorId")}
                    className="font-mono text-sm bg-muted/20"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Format: OP-154-YYYY-XXXX (Auto-assigned sequentially)
                  </p>
                  {errors.operatorId && (
                    <p className="text-xs text-destructive">{errors.operatorId.message}</p>
                  )}
                </div>

                {/* Full Name */}
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="name" className="text-xs font-semibold">
                    Full Legal Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="e.g. Juan De La Cruz"
                    {...register("name")}
                  />
                  {errors.name && (
                    <p className="text-xs text-destructive">{errors.name.message}</p>
                  )}
                </div>

                {/* Date of Birth */}
                <div className="space-y-1.5">
                  <Label htmlFor="dateOfBirth" className="text-xs font-semibold">
                    Date of Birth <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    {...register("dateOfBirth")}
                  />
                  {errors.dateOfBirth && (
                    <p className="text-xs text-destructive">{errors.dateOfBirth.message}</p>
                  )}
                </div>

                {/* Mobile Number */}
                <div className="space-y-1.5">
                  <Label htmlFor="mobileNo" className="text-xs font-semibold">
                    Mobile Contact Number <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="mobileNo"
                      placeholder="09123456789"
                      className="pl-9"
                      {...register("mobileNo")}
                    />
                  </div>
                  {errors.mobileNo && (
                    <p className="text-xs text-destructive">{errors.mobileNo.message}</p>
                  )}
                </div>

                {/* Email Address */}
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-semibold">
                    Email Address <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="operator@email.com"
                      className="pl-9"
                      {...register("email")}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-destructive">{errors.email.message}</p>
                  )}
                </div>

                {/* Complete Residential Address Section */}
                <div className="sm:col-span-3 pt-3 border-t space-y-3">
                  <div>
                    <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-primary" />
                      Complete Residential Address
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      Format: House Number, Street Name, Purok Name, Barangay, City/Municipality, Province, Nation, Zip Code
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    {/* 1. House Number */}
                    <div className="space-y-1">
                      <Label htmlFor="houseNumber" className="text-[11px] font-medium text-muted-foreground">
                        House / Bldg No.
                      </Label>
                      <Input
                        id="houseNumber"
                        placeholder="e.g. 124 or Lot 5"
                        {...register("houseNumber")}
                        className="h-9 text-xs"
                      />
                      {errors.houseNumber && (
                        <p className="text-[11px] text-destructive">{errors.houseNumber.message}</p>
                      )}
                    </div>

                    {/* 2. Street Name */}
                    <div className="space-y-1">
                      <Label htmlFor="streetName" className="text-[11px] font-medium text-muted-foreground">
                        Street Name
                      </Label>
                      <Input
                        id="streetName"
                        placeholder="e.g. Rizal Street"
                        {...register("streetName")}
                        className="h-9 text-xs"
                      />
                      {errors.streetName && (
                        <p className="text-[11px] text-destructive">{errors.streetName.message}</p>
                      )}
                    </div>

                    {/* 3. Purok Name */}
                    <div className="space-y-1">
                      <Label htmlFor="purokName" className="text-[11px] font-medium text-muted-foreground">
                        Purok Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="purokName"
                        placeholder="e.g. Purok 4"
                        {...register("purokName")}
                        className="h-9 text-xs"
                      />
                      {errors.purokName && (
                        <p className="text-[11px] text-destructive">{errors.purokName.message}</p>
                      )}
                    </div>

                    {/* 4. Barangay */}
                    <div className="space-y-1">
                      <Label htmlFor="barangay" className="text-[11px] font-medium text-muted-foreground">
                        Barangay <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="barangay"
                        list="tagbilaran-barangays"
                        placeholder="e.g. Poblacion 2"
                        {...register("barangay")}
                        className="h-9 text-xs"
                      />
                      <datalist id="tagbilaran-barangays">
                        {TAGBILARAN_BARANGAYS.map((brgy) => (
                          <option key={brgy} value={brgy} />
                        ))}
                      </datalist>
                      {errors.barangay && (
                        <p className="text-[11px] text-destructive">{errors.barangay.message}</p>
                      )}
                    </div>

                    {/* 5. City/Municipality */}
                    <div className="space-y-1">
                      <Label htmlFor="cityMunicipality" className="text-[11px] font-medium text-muted-foreground">
                        City / Municipality <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="cityMunicipality"
                        placeholder="Tagbilaran City"
                        {...register("cityMunicipality")}
                        className="h-9 text-xs"
                      />
                      {errors.cityMunicipality && (
                        <p className="text-[11px] text-destructive">{errors.cityMunicipality.message}</p>
                      )}
                    </div>

                    {/* 6. Province */}
                    <div className="space-y-1">
                      <Label htmlFor="province" className="text-[11px] font-medium text-muted-foreground">
                        Province <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="province"
                        placeholder="Bohol"
                        {...register("province")}
                        className="h-9 text-xs"
                      />
                      {errors.province && (
                        <p className="text-[11px] text-destructive">{errors.province.message}</p>
                      )}
                    </div>

                    {/* 7. Nation */}
                    <div className="space-y-1">
                      <Label htmlFor="nation" className="text-[11px] font-medium text-muted-foreground">
                        Nation / Country <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="nation"
                        placeholder="Philippines"
                        {...register("nation")}
                        className="h-9 text-xs"
                      />
                      {errors.nation && (
                        <p className="text-[11px] text-destructive">{errors.nation.message}</p>
                      )}
                    </div>

                    {/* 8. Zip Code */}
                    <div className="space-y-1">
                      <Label htmlFor="zipCode" className="text-[11px] font-medium text-muted-foreground">
                        Zip Code <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="zipCode"
                        placeholder="6300"
                        {...register("zipCode")}
                        className="h-9 text-xs font-mono"
                      />
                      {errors.zipCode && (
                        <p className="text-[11px] text-destructive">{errors.zipCode.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Real-Time Formatted Address Preview */}
                  <div className="p-3 rounded-lg bg-muted/30 border text-xs flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2">
                    <span className="font-semibold text-muted-foreground whitespace-nowrap flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                      Formatted Address:
                    </span>
                    <span className="font-medium text-foreground break-all">
                      {liveFormattedAddress || (
                        <span className="text-muted-foreground italic">
                          Fill in address fields above to see live formatted address...
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. VALID GOVERNMENT IDENTIFICATION */}
            <div className="space-y-4">
              <div className="border-b pb-2">
                <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-primary" />
                  Government Valid Identification
                </h3>
                <p className="text-xs text-muted-foreground">
                  Specify the primary valid government-issued ID card and provide digital copies.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* ID Type */}
                <div className="space-y-1.5">
                  <Label htmlFor="validIDType" className="text-xs font-semibold">
                    Valid ID Type <span className="text-destructive">*</span>
                  </Label>
                  <select
                    id="validIDType"
                    {...register("validIDType")}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {VALID_ID_OPTIONS.map((idType) => (
                      <option key={idType} value={idType}>
                        {idType}
                      </option>
                    ))}
                  </select>
                  {errors.validIDType && (
                    <p className="text-xs text-destructive">{errors.validIDType.message}</p>
                  )}
                </div>

                {/* ID Number */}
                <div className="space-y-1.5">
                  <Label htmlFor="validIDNumber" className="text-xs font-semibold">
                    Valid ID Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="validIDNumber"
                    placeholder="e.g. N01-12-123456"
                    {...register("validIDNumber")}
                  />
                  {errors.validIDNumber && (
                    <p className="text-xs text-destructive">{errors.validIDNumber.message}</p>
                  )}
                </div>

                {/* ID Expiry Date */}
                <div className="space-y-1.5">
                  <Label htmlFor="validIDExpiryDate" className="text-xs font-semibold">
                    ID Expiration Date <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="validIDExpiryDate"
                    type="date"
                    {...register("validIDExpiryDate")}
                  />
                  {errors.validIDExpiryDate && (
                    <p className="text-xs text-destructive">{errors.validIDExpiryDate.message}</p>
                  )}
                </div>
              </div>

              {/* Document Uploads for Front and Back */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <DocumentUploader
                  label="Front of Valid ID"
                  description="Capture or upload the front face of the ID card showing photo and details."
                  value={validIdFront}
                  onChange={setValidIdFront}
                  required
                />

                <DocumentUploader
                  label="Back of Valid ID"
                  description="Capture or upload the back face of the ID card showing barcode or signature."
                  value={validIdBack}
                  onChange={setValidIdBack}
                />
              </div>
            </div>

            {/* 4. SUBMIT / CANCEL BUTTONS */}
            <div className="pt-4 border-t flex flex-col sm:flex-row items-center justify-end gap-3">
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              )}

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-8 gap-2 bg-primary hover:bg-primary/90 shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enrolling Operator...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Register Operator
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Operator Camera Modal */}
      <OperatorCameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleProfileCameraCapture}
        title="Capture Operator Portrait"
        description="Position the operator directly facing the camera with good lighting."
        aspectMode="portrait"
      />
    </div>
  );
}
