import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Paintbrush, Eraser, RotateCcw } from "lucide-react";

interface ManualMaskEditorProps {
  imageUrl: string;
  overlayColor?: string;
  onMaskChange: (maskData: ImageData | null) => void;
}

export const ManualMaskEditor = ({ imageUrl, overlayColor, onMaskChange }: ManualMaskEditorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState([30]);
  const [opacity, setOpacity] = useState([50]);
  const [mode, setMode] = useState<"draw" | "erase">("draw");

  // Load image
  useEffect(() => {
    const canvas = canvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    if (!canvas || !maskCanvas) return;

    const ctx = canvas.getContext("2d");
    const maskCtx = maskCanvas.getContext("2d");
    if (!ctx || !maskCtx) return;

    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      
      // Set canvas dimensions
      canvas.width = img.width;
      canvas.height = img.height;
      maskCanvas.width = img.width;
      maskCanvas.height = img.height;

      // Draw original image
      ctx.drawImage(img, 0, 0);
      
      // Initialize mask canvas with transparent black
      maskCtx.fillStyle = "rgba(0, 0, 0, 1)";
      maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // Apply overlay
  useEffect(() => {
    const canvas = canvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    if (!canvas || !maskCanvas || !imgRef.current) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Redraw original image
    ctx.drawImage(imgRef.current, 0, 0);

    // Apply overlay with mask
    if (overlayColor) {
      const maskCtx = maskCanvas.getContext("2d");
      if (!maskCtx) return;

      const maskData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) return;

      // Fill with overlay color
      tempCtx.fillStyle = overlayColor;
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
      const overlayData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);

      // Apply mask
      for (let i = 0; i < overlayData.data.length; i += 4) {
        const maskAlpha = maskData.data[i]; // White = show overlay
        const finalAlpha = (maskAlpha / 255) * (opacity[0] / 100);
        overlayData.data[i + 3] = finalAlpha * 255;
      }

      tempCtx.putImageData(overlayData, 0, 0);
      ctx.drawImage(tempCanvas, 0, 0);
    }
  }, [overlayColor, opacity]);

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) return;
    
    const maskCtx = maskCanvas.getContext("2d");
    if (!maskCtx) return;

    const rect = maskCanvas.getBoundingClientRect();
    const scaleX = maskCanvas.width / rect.width;
    const scaleY = maskCanvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    maskCtx.beginPath();
    maskCtx.arc(x, y, brushSize[0], 0, Math.PI * 2);
    maskCtx.fillStyle = mode === "draw" ? "rgba(255, 255, 255, 1)" : "rgba(0, 0, 0, 1)";
    maskCtx.fill();

    // Update mask
    const maskData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
    onMaskChange(maskData);

    // Trigger redraw
    if (overlayColor) {
      const canvas = canvasRef.current;
      if (!canvas || !imgRef.current) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(imgRef.current, 0, 0);

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) return;

      tempCtx.fillStyle = overlayColor;
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
      const overlayData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);

      for (let i = 0; i < overlayData.data.length; i += 4) {
        const maskAlpha = maskData.data[i];
        const finalAlpha = (maskAlpha / 255) * (opacity[0] / 100);
        overlayData.data[i + 3] = finalAlpha * 255;
      }

      tempCtx.putImageData(overlayData, 0, 0);
      ctx.drawImage(tempCanvas, 0, 0);
    }
  };

  const clearMask = () => {
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) return;
    
    const maskCtx = maskCanvas.getContext("2d");
    if (!maskCtx) return;

    maskCtx.fillStyle = "rgba(0, 0, 0, 1)";
    maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
    
    onMaskChange(null);
    
    // Redraw original image
    if (imgRef.current && canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        ctx.drawImage(imgRef.current, 0, 0);
      }
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <div>
        <h3 className="text-xl font-bold text-foreground mb-1">
          Paint Selection Area
        </h3>
        <p className="text-sm text-muted-foreground">
          Draw on your clothes to mark where colors should appear
        </p>
      </div>

      {/* Tools */}
      <div className="flex items-center gap-3">
        <Button
          variant={mode === "draw" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("draw")}
        >
          <Paintbrush className="w-4 h-4 mr-2" />
          Paint
        </Button>
        <Button
          variant={mode === "erase" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("erase")}
        >
          <Eraser className="w-4 h-4 mr-2" />
          Erase
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={clearMask}
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Clear
        </Button>
      </div>

      {/* Brush Size */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">
            Brush Size
          </label>
          <span className="text-sm text-muted-foreground">
            {brushSize[0]}px
          </span>
        </div>
        <Slider
          value={brushSize}
          onValueChange={setBrushSize}
          min={5}
          max={100}
          step={5}
          className="w-full"
        />
      </div>

      {/* Canvas */}
      <div 
        className="relative rounded-lg overflow-hidden shadow-xl bg-muted"
        style={{ cursor: mode === "draw" ? "crosshair" : "not-allowed" }}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-auto absolute inset-0"
        />
        <canvas
          ref={maskCanvasRef}
          className="w-full h-auto relative"
          onMouseDown={() => setIsDrawing(true)}
          onMouseUp={() => setIsDrawing(false)}
          onMouseLeave={() => setIsDrawing(false)}
          onMouseMove={draw}
          style={{ opacity: 0 }}
        />
      </div>

      {/* Opacity Control */}
      {overlayColor && (
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
