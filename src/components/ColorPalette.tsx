import { Tone, colorData, ColorShade } from "@/data/colorData";
import { Card } from "@/components/ui/card";
import { useState } from "react";

interface ColorPaletteProps {
  tone: Tone;
  onColorSelect: (color: string) => void;
  selectedColor?: string;
}

export const ColorPalette = ({ tone, onColorSelect, selectedColor }: ColorPaletteProps) => {
  const colors = colorData[tone];
  const [hoveredColor, setHoveredColor] = useState<ColorShade | null>(null);

  const getToneGradient = (tone: Tone) => {
    switch (tone) {
      case "warm":
        return "from-orange-400 to-amber-500";
      case "cool":
        return "from-blue-400 to-purple-500";
      case "neutral":
        return "from-stone-400 to-zinc-500";
    }
  };

  const getToneLabel = (tone: Tone) => {
    return tone.charAt(0).toUpperCase() + tone.slice(1);
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${getToneGradient(tone)} shadow-md`} />
        <div>
          <h3 className="text-xl font-bold text-foreground">
            {getToneLabel(tone)} Tone
          </h3>
          <p className="text-sm text-muted-foreground">
            {colors.length} perfect shades for you
          </p>
        </div>
      </div>

      <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
        {colors.map((color) => (
          <button
            key={color.hex}
            onClick={() => onColorSelect(color.hex)}
            onMouseEnter={() => setHoveredColor(color)}
            onMouseLeave={() => setHoveredColor(null)}
            className={`
              aspect-square rounded-lg transition-all duration-200 
              hover:scale-110 hover:shadow-lg
              ${selectedColor === color.hex ? "ring-4 ring-primary scale-105" : ""}
            `}
            style={{ backgroundColor: color.hex }}
            aria-label={color.name}
          />
        ))}
      </div>

      {hoveredColor && (
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
          <div
            className="w-10 h-10 rounded-lg shadow-sm"
            style={{ backgroundColor: hoveredColor.hex }}
          />
          <div>
            <p className="font-semibold text-foreground">{hoveredColor.name}</p>
            <p className="text-xs text-muted-foreground font-mono">
              {hoveredColor.hex}
            </p>
          </div>
        </div>
      )}
    </Card>
  );
};
