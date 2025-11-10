import { useEffect, useRef, useState } from "react";
import { Slider } from "./ui/slider";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { RotateCcw } from "lucide-react";

interface ImageEditorProps {
  imageFile: File;
  onImageAdjusted: (adjustedFile: File) => void;
}

interface Adjustments {
  brightness: number;
  contrast: number;
  saturation: number;
}

export const ImageEditor = ({ imageFile, onImageAdjusted }: ImageEditorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [adjustments, setAdjustments] = useState<Adjustments>({
    brightness: 100,
    contrast: 100,
    saturation: 100,
  });
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setOriginalImage(img);
      applyFilters(img, adjustments);
    };
    img.src = URL.createObjectURL(imageFile);

    return () => {
      URL.revokeObjectURL(img.src);
    };
  }, [imageFile]);

  useEffect(() => {
    if (originalImage) {
      applyFilters(originalImage, adjustments);
      exportAdjustedImage();
    }
  }, [adjustments, originalImage]);

  const applyFilters = (img: HTMLImageElement, adj: Adjustments) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = img.width;
    canvas.height = img.height;

    // Apply CSS filters
    ctx.filter = `brightness(${adj.brightness}%) contrast(${adj.contrast}%) saturate(${adj.saturation}%)`;
    ctx.drawImage(img, 0, 0);
    ctx.filter = 'none';
  };

  const exportAdjustedImage = () => {
    if (!canvasRef.current) return;

    canvasRef.current.toBlob((blob) => {
      if (blob) {
        const adjustedFile = new File([blob], imageFile.name, { type: 'image/png' });
        onImageAdjusted(adjustedFile);
      }
    }, 'image/png');
  };

  const resetAdjustments = () => {
    setAdjustments({
      brightness: 100,
      contrast: 100,
      saturation: 100,
    });
  };

  const hasAdjustments = 
    adjustments.brightness !== 100 || 
    adjustments.contrast !== 100 || 
    adjustments.saturation !== 100;

  return (
    <div className="space-y-6 rounded-xl border-2 border-border bg-card p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Adjust Image</h3>
        {hasAdjustments && (
          <Button
            size="sm"
            variant="outline"
            onClick={resetAdjustments}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        )}
      </div>

      <div className="relative rounded-lg overflow-hidden border border-border">
        <canvas 
          ref={canvasRef} 
          className="w-full h-auto"
        />
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="brightness" className="text-sm font-medium">
              Brightness
            </Label>
            <span className="text-sm text-muted-foreground">
              {adjustments.brightness}%
            </span>
          </div>
          <Slider
            id="brightness"
            min={0}
            max={200}
            step={1}
            value={[adjustments.brightness]}
            onValueChange={([value]) => 
              setAdjustments(prev => ({ ...prev, brightness: value }))
            }
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="contrast" className="text-sm font-medium">
              Contrast
            </Label>
            <span className="text-sm text-muted-foreground">
              {adjustments.contrast}%
            </span>
          </div>
          <Slider
            id="contrast"
            min={0}
            max={200}
            step={1}
            value={[adjustments.contrast]}
            onValueChange={([value]) => 
              setAdjustments(prev => ({ ...prev, contrast: value }))
            }
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="saturation" className="text-sm font-medium">
              Saturation
            </Label>
            <span className="text-sm text-muted-foreground">
              {adjustments.saturation}%
            </span>
          </div>
          <Slider
            id="saturation"
            min={0}
            max={200}
            step={1}
            value={[adjustments.saturation]}
            onValueChange={([value]) => 
              setAdjustments(prev => ({ ...prev, saturation: value }))
            }
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
};
