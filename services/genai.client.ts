// services/genai.client.ts
// Client-side GenAI helpers for Google AI Studio embed environment
// - Uses injected `window.aistudio` (no API key in code)
// - Robust response parsing (several response shapes)
// - No billing/cost logic included here (the environment controls quotas/billing)

import {
  GenerationParams,
  StylePreset,
  ImageMetadata,
  QualityAssessment,
} from "../types";
import { MICROSTOCK_ENHANCERS } from "../constants";

/**
 * Helper: get injected AI client from Google AI Studio embed.
 * Throws clear error if called in non-embedded environment.
 */
function getInjectedAI() {
  const win = (typeof window !== "undefined" ? window : undefined) as
    | any
    | undefined;
  if (!win) throw new Error("Not running in a browser environment.");
  if (
    win.aistudio &&
    (win.aistudio.getGenerativeAI ||
      win.aistudio.createGenerativeAI ||
      win.aistudio.getAI)
  ) {
    // Support several injection names that Google may expose
    if (typeof win.aistudio.getGenerativeAI === "function")
      return win.aistudio.getGenerativeAI();
    if (typeof win.aistudio.createGenerativeAI === "function")
      return win.aistudio.createGenerativeAI();
    if (typeof win.aistudio.getAI === "function") return win.aistudio.getAI();
  }
  throw new Error(
    "Google AI Studio SDK not found on window.aistudio. Ensure the app is opened inside Google AI Studio or the embed script is injected."
  );
}

/**
 * Build final/enhanced prompt with style and microstock enhancers.
 */
export const buildEnhancedPrompt = (params: GenerationParams): string => {
  let finalPrompt = (params.prompt || "").trim();

  if (params.style && params.style !== StylePreset.NONE) {
    finalPrompt += `, ${params.style} style`;
  }

  if (params.optimizeForMicrostock) {
    // MICROSTOCK_ENHANCERS can be a string or array; make sure final is string
    const enh = Array.isArray(MICROSTOCK_ENHANCERS)
      ? MICROSTOCK_ENHANCERS.join(", ")
      : MICROSTOCK_ENHANCERS;
    finalPrompt += `, ${enh}`;
  }

  return finalPrompt;
};

/**
 * Ask the embed UI if there's a selected API key (returns boolean).
 * This uses the aistudio helper if available; otherwise returns false.
 */
export const checkApiKey = async (): Promise<boolean> => {
  try {
    const win = (typeof window !== "undefined" ? window : undefined) as
      | any
      | undefined;
    if (!win || !win.aistudio) return false;
    if (typeof win.aistudio.hasSelectedApiKey === "function") {
      return await win.aistudio.hasSelectedApiKey();
    }
    // fallback: presence of injected client indicates keys likely injected
    return !!(win.aistudio.getGenerativeAI || win.aistudio.createGenerativeAI);
  } catch (e) {
    console.warn("checkApiKey error", e);
    return false;
  }
};

/**
 * Open AI Studio "select API key" UX if available in embed.
 */
export const promptForApiKey = async (): Promise<void> => {
  try {
    const win = (typeof window !== "undefined" ? window : undefined) as
      | any
      | undefined;
    if (!win || !win.aistudio) {
      console.warn("aistudio not available in this environment.");
      return;
    }
    if (typeof win.aistudio.openSelectKey === "function") {
      await win.aistudio.openSelectKey();
      return;
    }
    console.warn("openSelectKey not supported in injected aistudio SDK.");
  } catch (e) {
    console.warn("promptForApiKey error", e);
  }
};

/**
 * Robust extractor for base64 image data from a variety of Google AI Studio response shapes.
 * Accepts object returned by model.generateContent() and returns base64 string (no data: prefix) or null.
 */
function extractBase64FromResponse(resp: any): string | null {
  if (!resp) return null;

  // Common shapes:
  // 1) resp.candidates[0].content.parts[].inlineData.data
  // 2) resp.output?.[0]?.content?.[0]?.image?.b64
  // 3) resp.outputText / resp.text (string) that may contain JSON with base64
  try {
    // shape 1
    if (resp.candidates && Array.isArray(resp.candidates)) {
      const cand = resp.candidates[0];
      if (cand?.content?.parts && Array.isArray(cand.content.parts)) {
        for (const p of cand.content.parts) {
          if (p?.inlineData?.data) return String(p.inlineData.data);
        }
      }
    }

    // shape 2
    if (resp.output && Array.isArray(resp.output)) {
      for (const out of resp.output) {
        if (out?.content && Array.isArray(out.content)) {
          for (const c of out.content) {
            if (c?.image?.b64) return String(c.image.b64);
            if (c?.image?.data) return String(c.image.data);
          }
        }
      }
    }

    // shape 3: sometimes there's `response` or `outputText`
    if (typeof resp.response === "string") {
      // try to find base64 substring (heuristic)
      const b = resp.response.match(/(?:[A-Za-z0-9+/]{100,}={0,2})/);
      if (b) return b[0];
    }
    if (typeof resp.outputText === "string" || typeof resp.text === "string") {
      const t = resp.outputText || resp.text;
      // try parse JSON
      try {
        const parsed = JSON.parse(t);
        // if parsed contains image fields:
        if (parsed?.image?.b64) return String(parsed.image.b64);
        if (
          parsed?.candidates &&
          parsed.candidates[0]?.content?.parts?.[0]?.inlineData?.data
        ) {
          return String(parsed.candidates[0].content.parts[0].inlineData.data);
        }
      } catch (_) {
        // fallback: regex base64
        const b = t.match(/(?:[A-Za-z0-9+/]{100,}={0,2})/);
        if (b) return b[0];
      }
    }
  } catch (err) {
    console.warn("extractBase64FromResponse error:", err);
  }

  return null;
}

/**
 * Generate image using injected Google AI client.
 * Returns a data-url string: "data:image/png;base64,...."
 *
 * NOTE: This runs on browser (client). For server-side generation (service account),
 * create a separate server-side module and call Google AI Studio server APIs there.
 */
export const generateImage = async (
  params: GenerationParams
): Promise<string> => {
  const ai = getInjectedAI();
  // Model choice: prefer a vision/image-capable model available in the environment.
  // Do not hardcode billing. The environment / embed controls the allowed model & quotas.
  const modelName = params.modelName || "gemini-3-pro-image-preview";

  const enhancedPrompt = buildEnhancedPrompt(params);

  // Build contents array compatible with several SDK shapes
  const payload = {
    model: modelName,
    contents: [
      {
        role: "user",
        parts: [{ text: enhancedPrompt }],
      },
    ],
    // generation config: follow common property names; embed only non-sensitive options
    generationConfig: {
      image: {
        // Accept either explicit size or quality token
        size: params.imageSize || params.quality || "2048x2048",
        aspectRatio: params.aspectRatio || undefined,
      },
      // other optional safe flags may go here
    },
  };

  try {
    // call generate; some injected SDKs expose `generateContent` or `generate`
    const model = ai.getGenerativeModel
      ? ai.getGenerativeModel({ model: modelName })
      : ai;
    // Choose method that exists
    let response: any;
    if (model.generateContent) {
      response = await model.generateContent(payload);
    } else if (ai.generateContent) {
      response = await ai.generateContent(payload);
    } else if (model.generate) {
      response = await model.generate(payload);
    } else {
      throw new Error(
        "Injected AI client does not support generateContent/generate APIs."
      );
    }

    // Try to extract base64 from response
    const b64 = extractBase64FromResponse(response);
    if (!b64) {
      // If response has `outputText` and contains JSON, parse it
      const altText = response?.outputText || response?.text;
      if (altText) {
        try {
          const parsed =
            typeof altText === "string" ? JSON.parse(altText) : altText;
          const pb64 = extractBase64FromResponse(parsed);
          if (pb64) return `data:image/png;base64,${pb64}`;
        } catch (_) {
          // ignore
        }
      }
      throw new Error("No image payload found in AI response");
    }

    // return data-url
    return `data:image/png;base64,${b64}`;
  } catch (err) {
    // Normalize error for caller
    console.error("[generateImage] failed:", err);
    throw err;
  }
};

/**
 * Generate IPTC-style metadata for a generated image (vision if image provided).
 * Returns structured ImageMetadata (title, description, keywords[], keywordAnalysis, category, contentType, author, isAI).
 */
export const generateMetadata = async (
  params: GenerationParams,
  imageBase64?: string
): Promise<ImageMetadata> => {
  const ai = getInjectedAI();

  // choose model name: vision-capable if image present
  const modelName = imageBase64
    ? "gemini-2.5-flash"
    : "gemini-flash-lite-latest";

  const systemInstruction = `You are a Vision-Based Microstock Metadata Engine.
Analyze the input (text and/or image) to generate professional stock photography metadata.

OUTPUT RULES:
- Title: Max 70 chars, descriptive.
- Description: 2-3 sentences.
- Author: use the provided author if available or "{{author}}".
- isAI: true
- Keywords: unique array, 30-50 items.
- Keyword categories: broad, medium, niche, trending.
- Category: choose one microstock category.
- contentType: one of Photography, Illustration, 3D Render, Vector.

Return ONLY a single JSON object that matches the schema. Do NOT include extra commentary.`;

  // Build contents
  const parts: any[] = [];
  if (imageBase64) {
    const base64Data = imageBase64.replace(
      /^data:image\/[a-zA-Z]+;base64,/,
      ""
    );
    parts.push({ inlineData: { mimeType: "image/png", data: base64Data } });
    parts.push({
      text: "Visually analyze the image and describe exactly what is seen (lighting, style, mood).",
    });
  }

  parts.push({
    text: `Generate metadata for:
Original Prompt: "${params.prompt}"
Style: ${params.style || "default"}
Author: ${params.author || "{{author}}"}
Ensure keywords count 30-50 (unique). Remove duplicates. Output JSON only.`,
  });

  const payload = {
    model: modelName,
    contents: [
      {
        role: "user",
        parts,
      },
    ],
    // Use responseSchema if the injected SDK supports it; else return JSON text
    responseMimeType: "application/json",
    // We avoid strict SDK-only types here; rely on the model to return JSON
  };

  try {
    const model = ai.getGenerativeModel
      ? ai.getGenerativeModel({ model: modelName })
      : ai;
    let response: any;
    if (model.generateContent) {
      response = await model.generateContent(payload);
    } else if (ai.generateContent) {
      response = await ai.generateContent(payload);
    } else if (model.generate) {
      response = await model.generate(payload);
    } else {
      throw new Error(
        "Injected AI client does not support generateContent/generate APIs."
      );
    }

    // Attempt to extract text/json
    const rawText =
      response?.outputText ||
      response?.text ||
      response?.response ||
      (response?.candidates &&
        response.candidates[0]?.content?.parts?.find((p: any) => p.text)?.text);
    let parsed: any = null;
    if (rawText) {
      try {
        parsed = typeof rawText === "string" ? JSON.parse(rawText) : rawText;
      } catch (e) {
        // sometimes model returns JSON in candidates -> try locate JSON-like string
        const candidate = response?.candidates?.[0]?.content?.parts?.find(
          (p: any) =>
            typeof p.text === "string" && p.text.trim().startsWith("{")
        );
        if (candidate && candidate.text) {
          try {
            parsed = JSON.parse(candidate.text);
          } catch {}
        }
      }
    }

    if (!parsed) {
      // fallback: ask model to produce JSON explicitly (could be a second round)
      throw new Error(
        "Metadata generation: no JSON payload found in AI response."
      );
    }

    // Minimal sanitization: ensure keywords array and counts
    if (!Array.isArray(parsed.keywords))
      parsed.keywords = Array.isArray(parsed.keywordAnalysis?.broad)
        ? [
            ...(parsed.keywordAnalysis?.broad || []),
            ...(parsed.keywordAnalysis?.medium || []),
            ...(parsed.keywordAnalysis?.niche || []),
          ]
        : typeof parsed.keywords === "string"
        ? parsed.keywords.split(",").map((k: string) => k.trim())
        : [];

    // dedupe
    parsed.keywords = Array.from(new Set(parsed.keywords)).slice(0, 50);

    // fill defaults
    parsed.title = (parsed.title || "").toString().slice(0, 140);
    parsed.description = (parsed.description || "").toString();
    parsed.author = parsed.author || params.author || "{{author}}";
    parsed.isAI = parsed.isAI === true || parsed.isAI === "true";

    return parsed as ImageMetadata;
  } catch (err) {
    console.error("[generateMetadata] failed:", err);
    throw err;
  }
};

/**
 * Assess image quality using injected vision-capable model.
 * Returns QualityAssessment with score, issues[], explanation, microstock_pass boolean.
 */
export const assessImageQuality = async (
  imageBase64: string
): Promise<QualityAssessment> => {
  const ai = getInjectedAI();
  const modelName = "gemini-2.5-flash"; // vision-capable

  const base64Data = imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, "");

  const prompt = `You are an Image Quality Detection AI specialized in microstock compliance.
Analyze the image for: hand/limb deformation, incorrect anatomy, background artifacts, noise/compression, warped text, proportion errors.
Return ONLY a JSON object:
{
  "score": <int 0-100>,
  "issues": ["..."],
  "explanation": "...",
  "microstock_pass": <boolean>
}
Fail if score < 80.`;

  const payload = {
    model: modelName,
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { mimeType: "image/png", data: base64Data } },
          { text: prompt },
        ],
      },
    ],
    responseMimeType: "application/json",
  };

  try {
    const model = ai.getGenerativeModel
      ? ai.getGenerativeModel({ model: modelName })
      : ai;
    let response: any;
    if (model.generateContent) {
      response = await model.generateContent(payload);
    } else if (ai.generateContent) {
      response = await ai.generateContent(payload);
    } else if (model.generate) {
      response = await model.generate(payload);
    } else {
      throw new Error(
        "Injected AI client does not support generateContent/generate APIs."
      );
    }

    // try to parse JSON text
    const rawText =
      response?.outputText ||
      response?.text ||
      response?.response ||
      (response?.candidates &&
        response.candidates[0]?.content?.parts?.find((p: any) => p.text)?.text);
    let parsed: any = null;
    if (rawText) {
      try {
        parsed = typeof rawText === "string" ? JSON.parse(rawText) : rawText;
      } catch (e) {
        // search candidate parts for JSON
        const candidate = response?.candidates?.[0]?.content?.parts?.find(
          (p: any) =>
            typeof p.text === "string" && p.text.trim().startsWith("{")
        );
        if (candidate && candidate.text) {
          try {
            parsed = JSON.parse(candidate.text);
          } catch {}
        }
      }
    }

    if (!parsed)
      throw new Error(
        "Quality assessment: no JSON payload found in AI response."
      );

    // normalize
    parsed.score = Number(parsed.score || 0);
    parsed.issues = Array.isArray(parsed.issues)
      ? parsed.issues
      : parsed.issues
      ? [String(parsed.issues)]
      : [];
    parsed.explanation = parsed.explanation || "";
    parsed.microstock_pass = !!parsed.microstock_pass;
    parsed.timestamp = parsed.timestamp || Date.now();

    return parsed as QualityAssessment;
  } catch (err) {
    console.error("[assessImageQuality] failed:", err);
    throw err;
  }
};
