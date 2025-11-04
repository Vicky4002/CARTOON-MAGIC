import { useState } from "react";
import { ImageUploader } from "@/components/ImageUploader";
import { CartoonResult } from "@/components/CartoonResult";
import { StyleSelector, CartoonStyle } from "@/components/StyleSelector";
import { Button } from "@/components/ui/button";
import { Sparkles, Wand2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

const Index = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [cartoonImage, setCartoonImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<CartoonStyle>("vibrant");

  const handleImageSelect = (file: File) => {
    setSelectedFile(file);
    setCartoonImage(null);
  };

  const handleStyleChange = (style: CartoonStyle) => {
    setSelectedStyle(style);
    setCartoonImage(null);
  };

  const handleCartoonify = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    toast.loading("Cartoonifying your image...", { id: "cartoonify" });

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result as string;

        // Call the edge function
        const { data, error } = await supabase.functions.invoke("cartoonify-image", {
          body: { image: base64Image, style: selectedStyle },
        });

        if (error) throw error;

        if (data?.cartoon_image) {
          setCartoonImage(data.cartoon_image);
          toast.success("Image cartoonified successfully!", { id: "cartoonify" });
        } else {
          throw new Error("No cartoon image returned");
        }
      };
      reader.readAsDataURL(selectedFile);
    } catch (error: any) {
      console.error("Error cartoonifying image:", error);
      toast.error(error.message || "Failed to cartoonify image", { id: "cartoonify" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!cartoonImage) return;

    const link = document.createElement("a");
    link.href = cartoonImage;
    link.download = `cartoon-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Image downloaded!");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/10 py-12 px-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }}></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <header className="text-center mb-12 space-y-4 animate-fade-in">
          <div className="inline-flex items-center justify-center gap-4 mb-4 group">
            <img 
              src={logo} 
              alt="Cartoon Magic Logo" 
              className="w-16 h-16 drop-shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12" 
            />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent transition-all duration-300 group-hover:scale-105">
              Cartoon Magic
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto transition-all duration-300 hover:text-foreground">
            Transform your photos into stunning cartoons with AI - upload or capture live!
          </p>
        </header>

        {/* Main Content */}
        <div className="grid md:grid-cols-2 gap-8 items-start">
          {/* Upload Section */}
          <div className="space-y-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50 transition-all duration-300 hover:shadow-glow hover:border-primary/50 hover:scale-[1.01]">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 group">
                <Wand2 className="w-6 h-6 text-primary transition-transform duration-300 group-hover:rotate-12" />
                Upload or Capture
              </h2>
              <ImageUploader
                onImageSelect={handleImageSelect}
                disabled={isProcessing}
              />
              {selectedFile && (
                <StyleSelector
                  selectedStyle={selectedStyle}
                  onStyleChange={handleStyleChange}
                  disabled={isProcessing}
                />
              )}
              {selectedFile && !cartoonImage && (
                <Button
                  onClick={handleCartoonify}
                  disabled={isProcessing}
                  className="w-full mt-6 bg-gradient-to-r from-primary via-secondary to-accent hover:opacity-90 text-white font-semibold py-6 rounded-xl shadow-glow transition-all duration-300 hover:scale-105 hover:shadow-2xl active:scale-95 group"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                      Cartoonifying...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2 transition-transform group-hover:rotate-180 duration-500" />
                      Cartoonify Image
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Result Section */}
          <div className="space-y-6 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50 min-h-[400px] flex flex-col transition-all duration-300 hover:shadow-glow hover:border-secondary/50 hover:scale-[1.01]">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 group">
                <Sparkles className="w-6 h-6 text-secondary transition-all duration-500 group-hover:rotate-180 group-hover:scale-125" />
                Cartoon Result
              </h2>
              {cartoonImage ? (
                <CartoonResult
                  imageUrl={cartoonImage}
                  onDownload={handleDownload}
                />
              ) : (
                <div className="flex-1 flex items-center justify-center text-center">
                  <div className="space-y-3 group">
                    <div className="w-20 h-20 mx-auto rounded-full bg-muted flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:bg-primary/20 group-hover:shadow-glow">
                      <Sparkles className="w-10 h-10 text-muted-foreground transition-all duration-500 group-hover:text-primary group-hover:rotate-180" />
                    </div>
                    <p className="text-muted-foreground transition-colors duration-300 group-hover:text-foreground">
                      Upload an image and click "Cartoonify" to see the magic!
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mt-16 grid md:grid-cols-3 gap-6 animate-fade-in" style={{ animationDelay: "0.3s" }}>
          {[
            {
              icon: Sparkles,
              title: "AI Powered",
              description: "Uses advanced Gemini AI for stunning cartoon effects",
            },
            {
              icon: Wand2,
              title: "Instant Results",
              description: "Get your cartoonified image in seconds",
            },
            {
              icon: Sparkles,
              title: "High Quality",
              description: "Professional-grade cartoon transformations",
            },
          ].map((feature, idx) => (
            <div
              key={idx}
              className="bg-card rounded-xl p-6 border border-border/50 hover:border-primary transition-all duration-300 hover:shadow-glow hover:scale-105 cursor-pointer group active:scale-95"
            >
              <feature.icon className="w-8 h-8 text-primary mb-3 transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110" />
              <h3 className="font-semibold text-lg mb-2 transition-colors duration-300 group-hover:text-primary">{feature.title}</h3>
              <p className="text-sm text-muted-foreground transition-colors duration-300 group-hover:text-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;
