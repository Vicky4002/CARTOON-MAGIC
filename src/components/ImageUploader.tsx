import { useCallback, useState, useRef, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Image as ImageIcon, Camera, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { toast } from "sonner";

interface ImageUploaderProps {
  onImageSelect: (file: File) => void;
  disabled?: boolean;
}

export const ImageUploader = ({ onImageSelect, disabled }: ImageUploaderProps) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [isWebcamActive, setIsWebcamActive] = useState(false);
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

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: "user" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
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
            onImageSelect(file);
            const reader = new FileReader();
            reader.onloadend = () => {
              setPreview(reader.result as string);
              stopWebcam();
            };
            reader.readAsDataURL(file);
          }
        }, 'image/png');
      }
    }
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
        <div className="relative rounded-xl overflow-hidden border-2 border-primary">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline
            muted
            onClick={() => videoRef.current?.play()}
            className="w-full h-auto"
          />
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3">
            <Button
              onClick={capturePhoto}
              className="bg-primary hover:bg-primary/90 text-white shadow-glow"
            >
              <Camera className="w-5 h-5 mr-2" />
              Capture
            </Button>
            <Button
              onClick={stopWebcam}
              variant="secondary"
            >
              <X className="w-5 h-5 mr-2" />
              Cancel
            </Button>
          </div>
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
