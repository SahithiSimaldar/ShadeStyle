import { Tone } from "@/data/colorData";

export const analyzeTone = async (imageFile: File): Promise<Tone> => {
  return new Promise((resolve) => {
    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);

      // Sample pixels from the image
      const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
      if (!imageData) {
        resolve("neutral");
        return;
      }

      let totalR = 0, totalG = 0, totalB = 0;
      const pixels = imageData.data;
      const sampleRate = 10; // Sample every 10th pixel for performance

      let count = 0;
      for (let i = 0; i < pixels.length; i += 4 * sampleRate) {
        totalR += pixels[i];
        totalG += pixels[i + 1];
        totalB += pixels[i + 2];
        count++;
      }

      const avgR = totalR / count;
      const avgG = totalG / count;
      const avgB = totalB / count;

      // Determine tone based on color temperature
      const warmScore = avgR - avgB; // More red than blue = warm
      const coolScore = avgB - avgR; // More blue than red = cool
      
      // If the difference is significant, assign warm or cool
      if (warmScore > 20) {
        resolve("warm");
      } else if (coolScore > 20) {
        resolve("cool");
      } else {
        resolve("neutral");
      }
    };

    img.src = URL.createObjectURL(imageFile);
  });
};
