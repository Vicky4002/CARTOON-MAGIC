import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

export type CartoonStyle = 
  | "vibrant"
  | "anime"
  | "comic"
  | "watercolor"
  | "sketch";

interface StyleSelectorProps {
  selectedStyle: CartoonStyle;
  onStyleChange: (style: CartoonStyle) => void;
  disabled?: boolean;
}

const styles: { value: CartoonStyle; label: string; description: string }[] = [
  {
    value: "vibrant",
    label: "🎨 Vibrant",
    description: "Bold colors & outlines"
  },
  {
    value: "anime",
    label: "✨ Anime",
    description: "Japanese animation style"
  },
  {
    value: "comic",
    label: "💥 Comic",
    description: "Comic book art style"
  },
  {
    value: "watercolor",
    label: "🖌️ Watercolor",
    description: "Soft painted style"
  },
  {
    value: "sketch",
    label: "✏️ Sketch",
    description: "Hand-drawn pencil style"
  }
];

export const StyleSelector = ({ selectedStyle, onStyleChange, disabled }: StyleSelectorProps) => {
  return (
    <div className="space-y-3">
      <label className="text-sm font-semibold text-foreground">Choose Cartoon Style</label>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {styles.map((style) => (
          <Button
            key={style.value}
            onClick={() => onStyleChange(style.value)}
            disabled={disabled}
            variant="outline"
            className={cn(
              "flex flex-col items-start gap-1 h-auto py-3 px-4 text-left transition-all",
              selectedStyle === style.value
                ? "border-primary bg-primary/10 shadow-glow"
                : "hover:border-primary/50 hover:bg-primary/5"
            )}
          >
            <span className="font-semibold text-sm">{style.label}</span>
            <span className="text-xs text-muted-foreground">{style.description}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};
