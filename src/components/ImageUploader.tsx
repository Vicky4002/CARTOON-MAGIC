import { useCallback, useState, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Image as ImageIcon, Camera, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

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
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user', 
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        videoRef.current.playsInline = true;
        try {
          await videoRef.current.play();
          setIsWebcamActive(true);
        } catch (playError) {
          console.error('Error playing video:', playError);
          stopWebcam();
          alert('Unable to start webcam preview. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error accessing webcam:', error);
      alert('Unable to access webcam. Please ensure you have granted camera permissions.');
    }
  };

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsWebcamActive(false);
  };

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
