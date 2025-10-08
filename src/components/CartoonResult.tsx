import { Download, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CartoonResultProps {
  imageUrl: string;
  onDownload: () => void;
}

export const CartoonResult = ({ imageUrl, onDownload }: CartoonResultProps) => {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-primary via-secondary to-accent rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity"></div>
        <div className="relative border-2 border-primary/50 rounded-xl overflow-hidden bg-card shadow-glow">
          <img
            src={imageUrl}
            alt="Cartoonified result"
            className="w-full h-auto"
          />
          <div className="absolute top-3 right-3">
            <div className="bg-gradient-to-r from-primary to-secondary text-white px-3 py-1.5 rounded-full text-sm font-semibold flex items-center gap-2 shadow-lg">
              <Sparkles className="w-4 h-4" />
              Cartoonified!
            </div>
          </div>
        </div>
      </div>
      
      <Button
        onClick={onDownload}
        className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white font-semibold py-6 rounded-xl shadow-glow transition-all hover:scale-[1.02]"
      >
        <Download className="w-5 h-5 mr-2" />
        Download Cartoon Image
      </Button>
    </div>
  );
};
