import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { createBodyMask } from "@/utils/segmentation";
import { Loader2 } from "lucide-react";

interface ImagePreviewProps {
  imageUrl: string;
  overlayColor?: string;
}

export const ImagePreview = ({ imageUrl, overlayColor }: ImagePreviewProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [opacity, setOpacity] = useState([50]);
  const [bodyMask, setBodyMask] = useState<ImageData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Load and segment image
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = async () => {
      imgRef.current = img;
      
      // Set canvas dimensions to match image
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw original image
      ctx.drawImage(img, 0, 0);

      // Create body mask for smart overlay
      setIsProcessing(true);
      const mask = await createBodyMask(img);
      setBodyMask(mask);
      setIsProcessing(false);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // Apply overlay when color or opacity changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imgRef.current) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Redraw original image
    ctx.drawImage(imgRef.current, 0, 0);

    // Apply color overlay with mask if available
    if (overlayColor && bodyMask) {
      // Create temporary canvas for overlay
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) return;

      // Fill with overlay color
      tempCtx.fillStyle = overlayColor;
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

      // Get overlay image data
      const overlayData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
      
      // Apply mask to overlay (only show overlay where mask exists)
      for (let i = 0; i < overlayData.data.length; i += 4) {
        const maskAlpha = bodyMask.data[i + 3];
        const finalAlpha = (maskAlpha / 255) * (opacity[0] / 100);
        overlayData.data[i + 3] = finalAlpha * 255;
      }

      // Draw masked overlay on main canvas
      tempCtx.putImageData(overlayData, 0, 0);
      ctx.drawImage(tempCanvas, 0, 0);
    }
  }, [overlayColor, opacity, bodyMask]);

  return (
    <Card className="p-6 space-y-4">
      <div>
        <h3 className="text-xl font-bold text-foreground mb-1">
          Your Photo
        </h3>
        <p className="text-sm text-muted-foreground">
          {isProcessing 
            ? "Detecting body area..." 
            : "Click a color to see it on your clothes"}
        </p>
      </div>

      <div className="relative rounded-lg overflow-hidden shadow-xl bg-muted">
        {isProcessing && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm font-medium text-foreground">
                Analyzing image...
              </p>
            </div>
          </div>
        )}
        <canvas
          ref={canvasRef}
          className="w-full h-auto"
        />
      </div>

      {overlayColor && !isProcessing && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">
              Overlay Opacity
            </label>
            <span className="text-sm text-muted-foreground">
              {opacity[0]}%
            </span>
          </div>
          <Slider
            value={opacity}
            onValueChange={setOpacity}
            min={0}
            max={100}
            step={1}
            className="w-full"
          />
        </div>
      )}
    </Card>
  );
};
