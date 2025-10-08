import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploaderProps {
  onImageSelect: (file: File) => void;
  disabled?: boolean;
}

export const ImageUploader = ({ onImageSelect, disabled }: ImageUploaderProps) => {
  const [preview, setPreview] = useState<string | null>(null);

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

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    maxFiles: 1,
    disabled
  });

  return (
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
  );
};
