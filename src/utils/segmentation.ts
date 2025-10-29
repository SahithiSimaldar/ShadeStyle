import { pipeline, env } from '@huggingface/transformers';

// Configure transformers to download models
env.allowLocalModels = false;
env.useBrowserCache = true;

let segmenterInstance: any = null;

export const getSegmenter = async () => {
  if (!segmenterInstance) {
    console.log('Loading segmentation model...');
    segmenterInstance = await pipeline(
      'image-segmentation',
      'Xenova/segformer-b0-finetuned-ade-512-512',
      { device: 'webgpu' }
    );
    console.log('Segmentation model loaded');
  }
  return segmenterInstance;
};

export const createBodyMask = async (imageElement: HTMLImageElement): Promise<ImageData | null> => {
  try {
    const segmenter = await getSegmenter();
    
    // Create canvas from image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Resize for performance if image is too large
    const maxDim = 512;
    let width = imageElement.naturalWidth;
    let height = imageElement.naturalHeight;
    
    if (width > maxDim || height > maxDim) {
      if (width > height) {
        height = Math.round((height * maxDim) / width);
        width = maxDim;
      } else {
        width = Math.round((width * maxDim) / height);
        height = maxDim;
      }
    }

    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(imageElement, 0, 0, width, height);

    // Get segmentation results
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    const results = await segmenter(imageData);
    
    console.log('Segmentation complete:', results);

    // Find person segment
    const personSegment = results.find((result: any) => 
      result.label.toLowerCase().includes('person')
    );

    if (!personSegment) {
      console.log('No person segment found');
      return null;
    }

    console.log('Person segment found, creating body-only mask');

    // Create mask from person segment, excluding head/face area
    const maskData = ctx.createImageData(width, height);
    const personMask = personSegment.mask;
    
    // Strategy: Find the topmost person pixel, then exclude top 40% from that point
    let topPersonPixel = height;
    
    // Find where the person actually starts
    for (let i = 0; i < personMask.data.length; i++) {
      if (personMask.data[i] > 0.3) { // Person pixel detected
        const pixelY = Math.floor(i / width);
        topPersonPixel = Math.min(topPersonPixel, pixelY);
      }
    }
    
    // Calculate cutoff: exclude top 40% of the person's height
    const personHeight = height - topPersonPixel;
    const faceCutoff = topPersonPixel + Math.floor(personHeight * 0.40);
    
    console.log(`Person starts at Y=${topPersonPixel}, face cutoff at Y=${faceCutoff}`);
    
    // Apply person mask but only below the face cutoff
    for (let i = 0; i < personMask.data.length; i++) {
      const pixelY = Math.floor(i / width);
      const pixelIndex = i * 4;
      
      // Only include person pixels that are below the face cutoff
      if (pixelY > faceCutoff && personMask.data[i] > 0.3) {
        const maskValue = Math.round(personMask.data[i] * 255);
        maskData.data[pixelIndex + 3] = maskValue;
      } else {
        maskData.data[pixelIndex + 3] = 0; // Transparent
      }
    }
    
    return maskData;
  } catch (error) {
    console.error('Error creating body mask:', error);
    return null;
  }
};
