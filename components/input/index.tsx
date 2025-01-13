"use client";

import { useContext, useRef, useState } from "react";
import Image from "next/image";
import { AppContext } from "@/contexts/AppContext";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Upload, Camera } from "lucide-react";

export default function () {
  const router = useRouter();
  const { user } = useContext(AppContext);
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file");
      return;
    }

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    setImageFile(file);
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    handleFile(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    handleFile(file);
  };

  const handleCameraCapture = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) handleFile(file);
        break;
      }
    }
  };

  const handleSubmit = async () => {
    if (!imageFile) {
      toast.error("Please upload an image first");
      return;
    }

    if (!user) {
      toast.error("Please sign in first");
      router.push("/sign-in");
      return;
    }

    try {
      setLoading(true);

      // Send the image directly to identify-product endpoint
      const formData = new FormData();
      formData.append('image', imageFile);

      const response = await fetch("/api/identify-product", {
        method: "POST",
        body: formData,
      });

      const { data, error } = await response.json();

      if (error) {
        throw new Error(error);
      }

      // Check if data is an array of identified products
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error("No products identified in the image");
      }

      // Log identified products for debugging
      console.log("Identified products:", data);

      // Group products by confidence level
      const highConfidence = data.filter(p => p.confidence === 'high').length;
      const mediumConfidence = data.filter(p => p.confidence === 'medium').length;

      // Clear the image after successful processing
      setImageFile(null);
      setImagePreview(null);

      // Show detailed success message
      const message = [
        `${data.length} product(s) identified:`,
        highConfidence > 0 ? `${highConfidence} with high confidence` : null,
        mediumConfidence > 0 ? `${mediumConfidence} with medium confidence` : null
      ].filter(Boolean).join(', ');

      toast.success(message);

      // Redirect to collection page
      router.push('/collection');
    } catch (error: any) {
      console.error("Failed to process image:", error);
      toast.error(error.message || "Failed to process image");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-4 md:mt-16 px-4">
      <div className="flex flex-col items-center space-y-4">
        {/* Hidden file input */}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          ref={fileInputRef}
          onChange={handleImageUpload}
        />

        {/* Image preview or upload area */}
        <div
          className={`w-full aspect-square max-w-md border-2 border-dashed rounded-lg flex flex-col items-center justify-center p-4 relative transition-colors
            ${dragActive ? 'border-primary bg-primary/10' : 'border-primary/50'}
            ${imagePreview ? '' : 'cursor-pointer hover:border-primary hover:bg-primary/5'}`}
          onClick={() => !imagePreview && fileInputRef.current?.click()}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onPaste={handlePaste}
          role="button"
          tabIndex={0}
        >
          {imagePreview ? (
            <div className="relative w-full h-full">
              <Image
                src={imagePreview}
                alt="Preview"
                fill
                className="object-contain rounded-lg"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setImageFile(null);
                  setImagePreview(null);
                }}
                className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
              >
                ×
              </button>
            </div>
          ) : (
            <div className="text-center">
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-sm text-gray-500">
                Drop your cosmetic product image here, or click to upload
              </p>
              <p className="text-xs text-gray-400 mt-1">
                You can also paste an image or use your camera
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Supports JPG, PNG (max 5MB)
              </p>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex space-x-4 w-full max-w-md">
          <button
            className="flex-1 flex items-center justify-center space-x-2 py-3 bg-secondary text-white rounded-lg hover:bg-secondary/90 transition-colors"
            onClick={handleCameraCapture}
          >
            <Camera className="w-5 h-5" />
            <span>Take Photo</span>
          </button>
          <button
            className="flex-1 py-3 bg-primary text-white rounded-lg disabled:opacity-50 hover:bg-primary/90 transition-colors"
            onClick={handleSubmit}
            disabled={!imageFile || loading}
          >
            {loading ? "Processing..." : "Identify Product"}
          </button>
        </div>
      </div>
    </div>
  );
}
