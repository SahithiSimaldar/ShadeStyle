import { useState } from "react";
import { ImageUploader } from "@/components/ImageUploader";
import { ColorPalette } from "@/components/ColorPalette";
import { ManualMaskEditor } from "@/components/ManualMaskEditor";
import { analyzeTone } from "@/utils/toneAnalyzer";
import { Tone } from "@/data/colorData";
import { Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [detectedTone, setDetectedTone] = useState<Tone | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | undefined>();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [maskData, setMaskData] = useState<ImageData | null>(null);
  const { toast } = useToast();

  const handleImageUpload = async (file: File) => {
    setIsAnalyzing(true);
    
    // Create preview URL
    const url = URL.createObjectURL(file);
    setImageUrl(url);

    // Analyze tone
    try {
      const tone = await analyzeTone(file);
      setDetectedTone(tone);
      toast({
        title: "Analysis Complete!",
        description: `Your ${tone} tone has been detected`,
      });
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: "Please try another image",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/30 backdrop-blur-md sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Color Tone Analyzer
              </h1>
              <p className="text-sm text-muted-foreground">
                Discover your perfect color palette
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        {!imageUrl ? (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
                Upload Your Photo
              </h2>
              <p className="text-muted-foreground text-lg">
                Let AI analyze your colors and recommend the perfect tones
              </p>
            </div>
            <ImageUploader onImageUpload={handleImageUpload} />
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-8">
              <ManualMaskEditor
                imageUrl={imageUrl}
                overlayColor={selectedColor}
                onMaskChange={setMaskData}
              />
            </div>
            
            <div className="space-y-8">
              {isAnalyzing ? (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent animate-pulse" />
                  <p className="text-lg font-medium text-foreground">
                    Analyzing your colors...
                  </p>
                </div>
              ) : detectedTone ? (
                <ColorPalette
                  tone={detectedTone}
                  onColorSelect={setSelectedColor}
                  selectedColor={selectedColor}
                />
              ) : null}
              
              <button
                onClick={() => {
                  setImageUrl(null);
                  setDetectedTone(null);
                  setSelectedColor(undefined);
                  setMaskData(null);
                }}
                className="w-full px-6 py-3 bg-card hover:bg-muted text-foreground font-medium rounded-xl transition-colors duration-200 border border-border"
              >
                Upload New Photo
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
