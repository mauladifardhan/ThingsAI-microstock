
export enum AspectRatio {
  SQUARE = "1:1",
  PORTRAIT_3_4 = "3:4",
  LANDSCAPE_4_3 = "4:3",
  PORTRAIT_9_16 = "9:16",
  LANDSCAPE_16_9 = "16:9"
}

export enum ImageQuality {
  ONE_K = "1K",
  TWO_K = "2K",
  FOUR_K = "4K"
}

export enum StylePreset {
  NONE = "None",
  PHOTREALISTIC = "Photorealistic",
  CINEMATIC = "Cinematic",
  THREE_D_RENDER = "3D Render",
  FLAT_LAY = "Flat Lay",
  ANIME = "Anime",
  DIGITAL_ART = "Digital Art",
  ISO_METRIC = "Isometric"
}

export interface GenerationParams {
  prompt: string;
  aspectRatio: AspectRatio;
  quality: ImageQuality;
  style: StylePreset;
  optimizeForMicrostock: boolean;
}

export interface KeywordAnalysis {
  broad: string[];
  medium: string[];
  niche: string[];
  trending: string[];
}

export interface ImageMetadata {
  title: string;
  description: string;
  keywords: string[];
  category: string;
  contentType: 'Photography' | 'Illustration' | '3D Render' | 'Vector';
  isAI: boolean;
  author: string;
  keywordAnalysis?: KeywordAnalysis;
}

export interface QualityAssessment {
  score: number;
  issues: string[];
  explanation: string;
  microstock_pass: boolean;
  timestamp: number;
}

export interface GeneratedImage {
  id: string;
  url: string;
  params: GenerationParams;
  timestamp: number;
  metadata?: ImageMetadata;
  qualityAssessment?: QualityAssessment;
}

export interface PromptExample {
  label: string;
  prompt: string;
  icon: string;
}

export interface ValidationIssue {
  type: 'error' | 'warning' | 'info';
  message: string;
  field?: keyof ImageMetadata;
}

export interface ValidationResult {
  score: number;
  issues: ValidationIssue[];
  recommendations: string[];
}
