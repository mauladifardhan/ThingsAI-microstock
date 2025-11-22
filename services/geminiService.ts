
import { GoogleGenAI, Type } from "@google/genai";
import { GenerationParams, StylePreset, ImageMetadata, QualityAssessment } from "../types";
import { MICROSTOCK_ENHANCERS } from "../constants";

/**
 * Enhances the user prompt based on selected style and microstock optimization.
 */
const buildEnhancedPrompt = (params: GenerationParams): string => {
  let finalPrompt = params.prompt;

  if (params.style !== StylePreset.NONE) {
    finalPrompt += `, ${params.style} style`;
  }

  if (params.optimizeForMicrostock) {
    finalPrompt += `, ${MICROSTOCK_ENHANCERS}`;
  }

  return finalPrompt;
};

export const checkApiKey = async (): Promise<boolean> => {
  const win = window as any;
  if (win.aistudio && win.aistudio.hasSelectedApiKey) {
    return await win.aistudio.hasSelectedApiKey();
  }
  return false;
};

export const promptForApiKey = async (): Promise<void> => {
  const win = window as any;
  if (win.aistudio && win.aistudio.openSelectKey) {
    await win.aistudio.openSelectKey();
  } else {
    console.warn("AI Studio API Key selection not available in this environment.");
  }
};

export const generateImage = async (params: GenerationParams): Promise<string> => {
  // CRITICAL: Initialize the client right before the call to capture the injected key.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const enhancedPrompt = buildEnhancedPrompt(params);

  try {
    // Using gemini-3-pro-image-preview as it supports 4K (High Quality) and is the SOTA image model.
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [
          {
            text: enhancedPrompt,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: params.aspectRatio,
          imageSize: params.quality, // 1K, 2K, or 4K
        },
      },
    });

    // Iterate through parts to find the image
    if (response.candidates && response.candidates[0] && response.candidates[0].content && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const base64EncodeString: string = part.inlineData.data;
          return `data:image/png;base64,${base64EncodeString}`;
        }
      }
    }

    throw new Error("No image data found in response");

  } catch (error) {
    console.error("Generation failed:", error);
    throw error;
  }
};

/**
 * Generates microstock-optimized metadata using Gemini.
 * Uses vision (Gemini 2.5 Flash) if image is provided, otherwise uses text-only (Flash Lite).
 */
export const generateMetadata = async (params: GenerationParams, imageBase64?: string): Promise<ImageMetadata> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // If we have an image, use Gemini 2.5 Flash for Vision understanding
  // If not, use Gemini Flash Lite for text-only generation
  const model = imageBase64 ? "gemini-2.5-flash" : "gemini-flash-lite-latest";

  const systemInstruction = `You are a Vision-Based Microstock Metadata Engine.
  Analyze the input (text and/or image) to generate professional stock photography metadata.
  
  GOALS:
  1. Maximize SEO visibility on Shutterstock, Adobe Stock, and Getty.
  2. Generate exactly 30-50 unique keywords.
  3. Categorize keywords into:
     - BROAD: Generic concepts (e.g., "business", "nature")
     - MEDIUM: Descriptive actions/objects (e.g., "working", "laptop", "green leaves")
     - NICHE: Specific details, feelings, or unique elements (e.g., "biophilic design", "remote work struggle")
  4. Identify TRENDING keywords based on stock photography aesthetics.
  
  OUTPUT RULES:
  - Title: Max 70 chars, descriptive.
  - Description: 2-3 sentences.
  - Author: "{{author}}"
  - isAI: true
  - Keywords: Flattened list of all unique keywords from the categories.
  `;

  const parts: any[] = [];
  
  // Add Image part if available (strip data:image/png;base64, prefix if present)
  if (imageBase64) {
    const base64Data = imageBase64.split(',')[1] || imageBase64;
    parts.push({
      inlineData: {
        mimeType: "image/png",
        data: base64Data
      }
    });
    parts.push({ text: "Analyze this image visually. Describe exactly what is seen, the lighting, the style, and the mood." });
  }

  parts.push({ 
    text: `Generate metadata for this image.
    Original Prompt: "${params.prompt}".
    Style: ${params.style}.
    
    Ensure keyword count is between 30 and 50. Remove duplicates.` 
  });

  try {
    const response = await ai.models.generateContent({
      model,
      contents: { parts },
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            keywords: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Combined list of all keywords (30-50 items)" 
            },
            keywordAnalysis: {
              type: Type.OBJECT,
              properties: {
                broad: { type: Type.ARRAY, items: { type: Type.STRING } },
                medium: { type: Type.ARRAY, items: { type: Type.STRING } },
                niche: { type: Type.ARRAY, items: { type: Type.STRING } },
                trending: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["broad", "medium", "niche", "trending"]
            },
            category: { type: Type.STRING },
            contentType: { 
              type: Type.STRING, 
              enum: ["Photography", "Illustration", "3D Render", "Vector"] 
            },
            author: { type: Type.STRING },
            isAI: { type: Type.BOOLEAN }
          },
          required: ["title", "description", "keywords", "keywordAnalysis", "category", "contentType", "author", "isAI"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No metadata generated");
    
    return JSON.parse(text) as ImageMetadata;
  } catch (error) {
    console.error("Metadata generation failed:", error);
    throw error;
  }
};

/**
 * Analyzes an image for microstock quality compliance using Vision.
 */
export const assessImageQuality = async (imageBase64: string): Promise<QualityAssessment> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = "gemini-2.5-flash"; // Vision-capable model

  const base64Data = imageBase64.split(',')[1] || imageBase64;

  const prompt = `You are an Image Quality Detection AI specialized in microstock compliance.
  Analyze the provided image for technical and anatomical flaws that would cause rejection on Shutterstock, Adobe Stock, or Getty Images.

  CHECK FOR:
  1. Hand/Limb Deformation: Extra fingers, missing limbs, unnatural joints.
  2. Incorrect Anatomy: Asymmetrical eyes, distorted faces (if realistic).
  3. Background Artifacts: Floating objects, incoherent structures, weird textures.
  4. Noise/Compression: Pixelation, jpeg artifacts, blurriness (unless artistic).
  5. Warped Text: Any gibberish text that looks like letters but isn't.
  6. Proportion Errors: Objects scaling incorrectly relative to surroundings.

  SCORING:
  - 0-59: Critical Failure (e.g., 6 fingers, severe artifacting).
  - 60-79: Needs Work (Minor glitches, slightly soft focus).
  - 80-100: High Quality (Clean, sharp, anatomically correct).

  PASS/FAIL:
  - Fail if Score < 80.
  - Pass if Score >= 80.

  Provide a score, a list of specific issues found (if any), and a brief explanation.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/png",
              data: base64Data
            }
          },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER, description: "Quality score 0-100" },
            issues: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of specific defects found" },
            explanation: { type: Type.STRING, description: "Summary of why it passed or failed" },
            microstock_pass: { type: Type.BOOLEAN, description: "True if score >= 80" }
          },
          required: ["score", "issues", "explanation", "microstock_pass"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No assessment generated");

    const assessment = JSON.parse(text) as QualityAssessment;
    assessment.timestamp = Date.now();
    return assessment;

  } catch (error) {
    console.error("Quality assessment failed:", error);
    throw error;
  }
};
