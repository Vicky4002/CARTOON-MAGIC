import { useCallback, useState, useRef, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Image as ImageIcon, Camera, X, Trash2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { toast } from "sonner";

interface ImageUploaderProps {
  onImageSelect: (file: File) => void;
  disabled?: boolean;
}

type QualityPreset = 'low' | 'medium' | 'high';

interface CapturedImage {
  file: File;
  preview: string;
  id: string;
}

const QUALITY_PRESETS = {
  low: { width: 640, height: 480 },
  medium: { width: 1280, height: 720 },
  high: { width: 1920, height: 1080 },
};

export const ImageUploader = ({ onImageSelect, disabled }: ImageUploaderProps) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [capturedImages, setCapturedImages] = useState<CapturedImage[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>(() => {
    return (localStorage.getItem('camera-facing') as 'user' | 'environment') || 'user';
  });
  const [quality, setQuality] = useState<QualityPreset>(() => {
    return (localStorage.getItem('camera-quality') as QualityPreset) || 'medium';
  });
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      onImageSelect(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, [onImageSelect]);

  const startWebcam = async () => {
    if (!("mediaDevices" in navigator) || !navigator.mediaDevices.getUserMedia) {
      toast.error("Camera not supported in this browser.");
      return;
    }

    try {
      // Stop any existing stream before starting a new one
      if (isWebcamActive) {
        stopWebcam();
      }

      const qualitySettings = QUALITY_PRESETS[quality];
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: qualitySettings.width },
          height: { ideal: qualitySettings.height },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        const v = videoRef.current;
        v.srcObject = stream;
        v.muted = true;
        v.playsInline = true;
        v.setAttribute("playsinline", "true");
        v.setAttribute("muted", "true");
        try {
          await v.play();
          setIsWebcamActive(true);
        } catch (playError) {
          console.error("Error playing video:", playError);
          // Some browsers require a second user gesture
          setIsWebcamActive(true);
          toast.message("Tap the video to start preview", { description: "Your browser blocked autoplay. Tap once to start the camera." });
        }
      }
    } catch (error: any) {
      console.error("Error accessing webcam:", error);
      let message = "Unable to access webcam.";
      if (error?.name === "NotAllowedError") message = "Camera permission denied. Please enable permissions.";
      if (error?.name === "NotFoundError") message = "No camera device found.";
      if (error?.name === "NotReadableError") message = "Camera is in use by another app.";
      toast.error(message);
    }
  };

  const stopWebcam = () => {
    const stream = streamRef.current;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      const v = videoRef.current;
      try { v.pause(); } catch {}
      (v as any).srcObject = null;
    }
    setIsWebcamActive(false);
  };

  const toggleCamera = () => {
    const newMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newMode);
    localStorage.setItem('camera-facing', newMode);
    if (isWebcamActive) {
      stopWebcam();
      setTimeout(() => startWebcam(), 100);
    }
  };

  const changeQuality = (newQuality: QualityPreset) => {
    setQuality(newQuality);
    localStorage.setItem('camera-quality', newQuality);
    if (isWebcamActive) {
      stopWebcam();
      setTimeout(() => startWebcam(), 100);
    }
  };

  useEffect(() => {
    return () => {
      stopWebcam();
    };
  }, []);

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `webcam-${Date.now()}.png`, { type: 'image/png' });
            const reader = new FileReader();
            reader.onloadend = () => {
              const id = Date.now().toString();
              const newImage: CapturedImage = {
                file,
                preview: reader.result as string,
                id,
              };
              setCapturedImages(prev => [...prev, newImage]);
              toast.success("Photo captured!");
            };
            reader.readAsDataURL(file);
          }
        }, 'image/png');
      }
    }
  };

  const deleteImage = (id: string) => {
    setCapturedImages(prev => prev.filter(img => img.id !== id));
    if (selectedImageId === id) {
      setSelectedImageId(null);
      setPreview(null);
    }
  };

  const selectImage = (image: CapturedImage) => {
    setSelectedImageId(image.id);
    setPreview(image.preview);
    onImageSelect(image.file);
  };

  const closeGallery = () => {
    setCapturedImages([]);
    setSelectedImageId(null);
    setPreview(null);
    stopWebcam();
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    maxFiles: 1,
    disabled: disabled || isWebcamActive
  });

  return (
    <div className="space-y-4">
      {isWebcamActive ? (
        <div className="space-y-4">
          <div className="relative rounded-xl overflow-hidden border-2 border-primary">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline
              muted
              onClick={() => videoRef.current?.play()}
              className="w-full h-auto"
            />
            <div className="absolute top-4 right-4 flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={toggleCamera}
                className="shadow-lg"
              >
                <Camera className="w-4 h-4" />
              </Button>
              <select
                value={quality}
                onChange={(e) => changeQuality(e.target.value as QualityPreset)}
                className="text-sm rounded-md bg-secondary text-secondary-foreground px-3 shadow-lg border-0"
              >
                <option value="low">Low (640p)</option>
                <option value="medium">Medium (720p)</option>
                <option value="high">High (1080p)</option>
              </select>
            </div>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3">
              <Button
                onClick={capturePhoto}
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow"
              >
                <Camera className="w-5 h-5 mr-2" />
                Capture
              </Button>
              <Button
                onClick={stopWebcam}
                variant="secondary"
              >
                <X className="w-5 h-5 mr-2" />
                {capturedImages.length > 0 ? 'Done' : 'Cancel'}
              </Button>
            </div>
          </div>
          
          {capturedImages.length > 0 && (
            <div className="rounded-xl border-2 border-border bg-card p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground">
                  Captured Photos ({capturedImages.length})
                </h3>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {capturedImages.map((image) => (
                  <div
                    key={image.id}
                    className={cn(
                      "relative group rounded-lg overflow-hidden border-2 cursor-pointer transition-all",
                      selectedImageId === image.id
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <img
                      src={image.preview}
                      alt="Captured"
                      className="w-full aspect-square object-cover"
                      onClick={() => selectImage(image)}
                    />
                    {selectedImageId === image.id && (
                      <div className="absolute top-2 left-2 bg-primary text-primary-foreground rounded-full p-1">
                        <Check className="w-4 h-4" />
                      </div>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteImage(image.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : capturedImages.length > 0 && !preview ? (
        <div className="rounded-xl border-2 border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">
              Select a Photo to Cartoonify
            </h3>
            <Button
              size="sm"
              variant="ghost"
              onClick={closeGallery}
            >
              <X className="w-4 h-4 mr-2" />
              Clear All
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {capturedImages.map((image) => (
              <div
                key={image.id}
                className={cn(
                  "relative group rounded-lg overflow-hidden border-2 cursor-pointer transition-all hover:scale-105",
                  selectedImageId === image.id
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-border hover:border-primary/50"
                )}
                onClick={() => selectImage(image)}
              >
                <img
                  src={image.preview}
                  alt="Captured"
                  className="w-full aspect-square object-cover"
                />
                {selectedImageId === image.id && (
                  <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                    <div className="bg-primary text-primary-foreground rounded-full p-2">
                      <Check className="w-6 h-6" />
                    </div>
                  </div>
                )}
                <Button
                  size="sm"
                  variant="destructive"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteImage(image.id);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button
            onClick={startWebcam}
            variant="outline"
            className="w-full mt-4 border-2 border-primary/30 hover:border-primary hover:bg-primary/5"
          >
            <Camera className="w-5 h-5 mr-2" />
            Capture More Photos
          </Button>
        </div>
      ) : (
        <>
          <div
            {...getRootProps()}
            className={cn(
              "relative border-2 border-dashed rounded-xl p-8 transition-all cursor-pointer",
              "hover:border-primary hover:bg-primary/5",
              isDragActive && "border-primary bg-primary/10 scale-[1.02]",
              disabled && "opacity-50 cursor-not-allowed",
              !preview && "aspect-square flex items-center justify-center",
              preview && "border-primary/50"
            )}
          >
            <input {...getInputProps()} />
            
            {!preview ? (
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-glow">
                  <Upload className="w-8 h-8 text-white" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-foreground">
                    {isDragActive ? "Drop your image here" : "Upload an image"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Drag & drop or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG, JPEG, WEBP
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <img
                  src={preview}
                  alt="Upload preview"
                  className="w-full h-auto rounded-lg shadow-lg"
                />
                <p className="text-sm text-center text-muted-foreground flex items-center justify-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  Click or drop a new image to replace
                </p>
              </div>
            )}
          </div>
          {!preview && (
            <Button
              onClick={startWebcam}
              disabled={disabled}
              variant="outline"
              className="w-full border-2 border-primary/30 hover:border-primary hover:bg-primary/5"
            >
              <Camera className="w-5 h-5 mr-2" />
              Use Webcam
            </Button>
          )}
        </>
      )}
    </div>
  );
};
