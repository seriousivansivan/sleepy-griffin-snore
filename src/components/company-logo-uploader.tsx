"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSupabaseAuth } from "@/components/providers/supabase-auth-provider";
import { toast } from "sonner";
import { uploadFileAndGetUrl } from "@/lib/supabase-storage";
import { Loader2, Upload } from "lucide-react";
import Image from "next/image";

type CompanyLogoUploaderProps = {
  companyId: string;
  companyName: string;
  currentLogoUrl: string | null;
  onLogoUpdated: (newUrl: string) => void;
};

// Define the storage bucket name
const LOGO_BUCKET = "company_logos";

export function CompanyLogoUploader({
  companyId,
  companyName,
  currentLogoUrl,
  onLogoUpdated,
}: CompanyLogoUploaderProps) {
  const { supabase, session } = useSupabaseAuth();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
    } else {
      setFile(null);
    }
  };

  const handleUpload = async () => {
    if (!file || !session) {
      toast.error("Please select a file first.");
      return;
    }

    setIsUploading(true);
    const fileExtension = file.name.split(".").pop();
    const storagePath = `logos/${companyId}.${fileExtension}`;

    const publicUrl = await uploadFileAndGetUrl(
      file,
      LOGO_BUCKET,
      storagePath
    );

    if (publicUrl) {
      // Add a cache-busting timestamp to the URL to force browser refresh
      const cacheBusterUrl = `${publicUrl}?v=${new Date().getTime()}`;

      // Update the company record in the database with the new URL
      const { error: dbError } = await supabase
        .from("companies")
        .update({ logo_url: cacheBusterUrl })
        .eq("id", companyId);

      if (dbError) {
        console.error("Database update error:", dbError);
        toast.error("Failed to save logo URL to database.");
      } else {
        toast.success("Company logo updated successfully!");
        onLogoUpdated(cacheBusterUrl);
        setFile(null); // Clear file input
      }
    }

    setIsUploading(false);
  };

  const previewUrl = useMemo(() => {
    if (file) {
      return URL.createObjectURL(file);
    }
    return currentLogoUrl;
  }, [file, currentLogoUrl]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Logo Management for {companyName}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-center space-y-3">
          <Label>Current/New Logo Preview</Label>
          <div className="w-32 h-32 border border-dashed flex items-center justify-center rounded-lg bg-muted/50">
            {previewUrl ? (
              <Image
                src={previewUrl}
                alt="Logo Preview"
                width={128}
                height={128}
                style={{ objectFit: "contain" }}
                className="max-h-full max-w-full p-2"
              />
            ) : (
              <Upload className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
        </div>

        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Label htmlFor="logo-upload">Upload Logo File (PNG/JPG)</Label>
          <Input
            id="logo-upload"
            type="file"
            accept="image/png, image/jpeg"
            onChange={handleFileChange}
            disabled={isUploading}
          />
        </div>

        <Button
          onClick={handleUpload}
          disabled={!file || isUploading}
          className="w-full"
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            "Save Logo"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}