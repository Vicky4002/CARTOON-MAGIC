import { useState } from "react";
import { ImageUploader } from "@/components/ImageUploader";
import { ImageEditor } from "@/components/ImageEditor";
import { CartoonResult } from "@/components/CartoonResult";
import { StyleSelector, CartoonStyle } from "@/components/StyleSelector";
import { Button } from "@/components/ui/button";
import { Sparkles, Wand2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

const Index = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [adjustedFile, setAdjustedFile] = useState<File | null>(null);
  const [cartoonImage, setCartoonImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<CartoonStyle>("vibrant");

  const handleImageSelect = (file: File) => {
    setSelectedFile(file);
    setAdjustedFile(file);
    setCartoonImage(null);
  };

  const handleImageAdjusted = (file: File) => {
    setAdjustedFile(file);
  };

  const handleStyleChange = (style: CartoonStyle) => {
    setSelectedStyle(style);
    setCartoonImage(null);
  };

  const handleCartoonify = async () => {
    if (!adjustedFile) return;

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
      reader.readAsDataURL(adjustedFile);
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
      {/* Enhanced animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-br from-primary/20 to-secondary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 right-20 w-[500px] h-[500px] bg-gradient-to-tl from-secondary/20 to-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-gradient-to-br from-accent/15 to-primary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }}></div>
        <div className="absolute bottom-1/3 left-1/4 w-64 h-64 bg-gradient-to-tr from-primary/10 to-secondary/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1.5s" }}></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <header className="text-center mb-16 space-y-6 animate-fade-in">
          <div className="inline-flex items-center justify-center gap-5 mb-6 group cursor-pointer">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500"></div>
              <img 
                src={logo} 
                alt="Cartoon Magic Logo" 
                className="relative w-20 h-20 drop-shadow-2xl transition-all duration-500 group-hover:scale-125 group-hover:rotate-12 group-hover:drop-shadow-[0_0_30px_rgba(168,85,247,0.6)]" 
              />
            </div>
            <h1 className="text-6xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent transition-all duration-500 group-hover:scale-110 drop-shadow-lg">
              Cartoon Magic
            </h1>
          </div>
          <p className="text-2xl text-muted-foreground max-w-3xl mx-auto transition-all duration-300 hover:text-foreground hover:scale-105 leading-relaxed">
            Transform your photos into <span className="font-semibold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">stunning cartoons</span> with AI - upload or capture live!
          </p>
        </header>

        {/* Main Content */}
        <div className="grid md:grid-cols-2 gap-8 items-start">
          {/* Upload Section */}
          <div className="space-y-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <div className="bg-card/80 backdrop-blur-xl rounded-3xl p-8 shadow-card border-2 border-border/50 transition-all duration-300 hover:shadow-glow hover:border-primary/50 hover:scale-[1.02] hover:bg-card/90">
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-3 group">
                <div className="p-2 bg-gradient-to-br from-primary to-secondary rounded-xl group-hover:scale-110 transition-transform duration-300">
                  <Wand2 className="w-7 h-7 text-white transition-transform duration-300 group-hover:rotate-12" />
                </div>
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Upload or Capture</span>
              </h2>
              <ImageUploader
                onImageSelect={handleImageSelect}
                disabled={isProcessing}
              />
            </div>
            
            {selectedFile && (
              <>
                <div className="bg-card/80 backdrop-blur-xl rounded-3xl p-8 shadow-card border-2 border-border/50 transition-all duration-300 hover:shadow-glow hover:border-primary/50">
                  <ImageEditor
                    imageFile={selectedFile}
                    onImageAdjusted={handleImageAdjusted}
                  />
                </div>
                
                <div className="bg-card/80 backdrop-blur-xl rounded-3xl p-8 shadow-card border-2 border-border/50 transition-all duration-300 hover:shadow-glow hover:border-primary/50">
                  <StyleSelector
                    selectedStyle={selectedStyle}
                    onStyleChange={handleStyleChange}
                    disabled={isProcessing}
                  />
                </div>
              </>
            )}
            
              {selectedFile && !cartoonImage && (
              <div className="bg-card/80 backdrop-blur-xl rounded-3xl p-8 shadow-card border-2 border-border/50 transition-all duration-300 hover:shadow-glow hover:border-primary/50">
                <Button
                  onClick={handleCartoonify}
                  disabled={isProcessing}
                  className="w-full bg-gradient-to-r from-primary via-secondary to-accent hover:opacity-90 text-white font-semibold py-6 rounded-xl shadow-glow transition-all duration-300 hover:scale-105 hover:shadow-2xl active:scale-95 group"
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
              </div>
              )}
          </div>

          {/* Result Section */}
          <div className="space-y-6 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <div className="bg-card/80 backdrop-blur-xl rounded-3xl p-8 shadow-card border-2 border-border/50 min-h-[500px] flex flex-col transition-all duration-300 hover:shadow-glow hover:border-secondary/50 hover:scale-[1.02] hover:bg-card/90">
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-3 group">
                <div className="p-2 bg-gradient-to-br from-secondary to-accent rounded-xl group-hover:scale-110 transition-transform duration-300">
                  <Sparkles className="w-7 h-7 text-white transition-all duration-500 group-hover:rotate-180" />
                </div>
                <span className="bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent">Cartoon Result</span>
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
        <div className="mt-20 grid md:grid-cols-3 gap-8 animate-fade-in" style={{ animationDelay: "0.3s" }}>
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
              className="relative bg-card/70 backdrop-blur-lg rounded-2xl p-8 border-2 border-border/50 hover:border-primary transition-all duration-300 hover:shadow-glow hover:scale-105 cursor-pointer group active:scale-95 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-4 transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110 shadow-lg">
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-bold text-xl mb-3 transition-colors duration-300 group-hover:text-primary">{feature.title}</h3>
                <p className="text-muted-foreground transition-colors duration-300 group-hover:text-foreground leading-relaxed">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;
