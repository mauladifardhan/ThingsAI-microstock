import { AspectRatio, ImageQuality, StylePreset, PromptExample } from './types';
import { Camera, Briefcase, Cpu, Box, Coffee, Layers } from 'lucide-react';

export const ASPECT_RATIOS = Object.values(AspectRatio);
export const QUALITIES = Object.values(ImageQuality);
export const STYLES = Object.values(StylePreset);

export const MICROSTOCK_NEGATIVE_PROMPT = "text, watermark, signature, logo, brand name, trademark, blurry, low quality, distorted, ugly, bad anatomy, extra limbs, copyright symbol";

export const MICROSTOCK_ENHANCERS = "professional stock photography, high resolution, sharp focus, perfect lighting, commercial quality, royalty free style, clean composition";

export const EXAMPLES: PromptExample[] = [
  {
    label: "Lifestyle",
    prompt: "A diverse group of friends laughing and having a picnic in a sunlit park, golden hour lighting, candid shot, high resolution lifestyle photography",
    icon: "Coffee"
  },
  {
    label: "Business",
    prompt: "Modern minimalist office workspace with a laptop, glass of water, and a succulent plant on a white desk, professional business photography, soft lighting",
    icon: "Briefcase"
  },
  {
    label: "AI Background",
    prompt: "Abstract technological background with glowing neural network connections, deep blue and purple gradients, futuristic AI concept, 3d render, 8k",
    icon: "Cpu"
  },
  {
    label: "3D Render",
    prompt: "A cute isometric 3D render of a cozy futuristic living room with neon accents, clay render style, soft shadows, pastel colors",
    icon: "Box"
  },
  {
    label: "Flat Lay",
    prompt: "Knolling photography of artist supplies: brushes, paints, sketchbook, and pencils arranged neatly on a wooden texture, top down view, flat lay, sharp focus",
    icon: "Layers"
  }
];