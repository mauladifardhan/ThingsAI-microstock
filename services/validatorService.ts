
import { ImageMetadata, ValidationResult, ValidationIssue } from '../types';

// A comprehensive list of banned words for microstock (Brands, trademarks, copyrighted characters)
const BANNED_KEYWORDS = [
  // Tech
  "iphone", "ipad", "apple", "macbook", "ios", "airpods",
  "android", "google", "pixel", "samsung", "galaxy", "windows", "microsoft",
  "facebook", "instagram", "twitter", "tiktok", "whatsapp", "youtube", "linkedin",
  "adobe", "photoshop", "illustrator", "zoom", "skype",
  // Auto
  "bmw", "mercedes", "audi", "tesla", "ferrari", "porsche", "lamborghini", "toyota", "honda", "ford", "jeep",
  // Fashion/Retail
  "nike", "adidas", "puma", "reebok", "gucci", "prada", "louis vuitton", "chanel", "zara", "h&m",
  // Entertainment/Toys
  "disney", "marvel", "dc comics", "star wars", "lego", "barbie", "hot wheels", "nerf", "mickey mouse",
  // Food/Drink
  "coca-cola", "pepsi", "coke", "mcdonalds", "starbucks", "kfc", "burger king",
  // Camera Gear
  "canon", "nikon", "sony", "fujifilm", "leica", "gopro"
];

/**
 * Validates image metadata against standard microstock requirements (Shutterstock, Adobe Stock, iStock).
 */
export const validateMetadata = (metadata: ImageMetadata): ValidationResult => {
  const issues: ValidationIssue[] = [];
  const recommendations: string[] = [];
  let score = 100;

  // --- 1. Title Validation ---
  const titleLen = metadata.title.length;
  if (titleLen > 70) {
    issues.push({ type: 'error', message: `Title is too long (${titleLen}/70 chars). It will be truncated on Adobe Stock.`, field: 'title' });
    score -= 15;
  } else if (titleLen < 20) {
    issues.push({ type: 'warning', message: 'Title is too short. Use descriptive phrases for better SEO.', field: 'title' });
    score -= 5;
  }

  const titleWords = metadata.title.split(/\s+/).length;
  if (titleWords < 5) {
    issues.push({ type: 'warning', message: 'Title word count is low (< 5 words).', field: 'title' });
    score -= 5;
  }

  // --- 2. Description Validation ---
  const descWords = metadata.description.split(/\s+/).length;
  if (descWords < 10) {
    issues.push({ type: 'warning', message: 'Description is very sparse. Aim for 2-3 complete sentences.', field: 'description' });
    score -= 10;
  }

  // --- 3. Keyword Validation ---
  const keywordCount = metadata.keywords.length;
  if (keywordCount < 30) {
    const missing = 30 - keywordCount;
    issues.push({ type: 'error', message: `Found only ${keywordCount} keywords. Minimum 30 required for optimal visibility.`, field: 'keywords' });
    score -= (missing * 1.5); // Heavy penalty for low keywords
    recommendations.push(`Add ${missing} more keywords to reach the minimum of 30.`);
  } else if (keywordCount > 50) {
    const extra = keywordCount - 50;
    issues.push({ type: 'error', message: `Found ${keywordCount} keywords. Max 50 allowed on most platforms.`, field: 'keywords' });
    score -= (extra * 2);
    recommendations.push(`Remove ${extra} least relevant keywords.`);
  }

  // Check for duplicates (case-insensitive)
  const uniqueKeywords = new Set(metadata.keywords.map(k => k.toLowerCase().trim()));
  if (uniqueKeywords.size !== metadata.keywords.length) {
    const diff = metadata.keywords.length - uniqueKeywords.size;
    issues.push({ type: 'warning', message: `Found ${diff} duplicate keywords.`, field: 'keywords' });
    score -= (diff * 3);
    recommendations.push("Remove duplicate keywords to save space for unique terms.");
  }

  // Check for single-word keywords that are too generic (basic heuristic)
  const tooShortKeywords = metadata.keywords.filter(k => k.length < 3);
  if (tooShortKeywords.length > 3) {
    issues.push({ type: 'info', message: `${tooShortKeywords.length} keywords are very short/generic (e.g. "${tooShortKeywords[0]}").`, field: 'keywords' });
    recommendations.push("Replace short 2-letter keywords with more specific terms.");
  }

  // --- 4. Risk / Content Compliance ---
  const lowerTitle = metadata.title.toLowerCase();
  const lowerDesc = metadata.description.toLowerCase();
  const lowerKeywords = metadata.keywords.map(k => k.toLowerCase());

  const foundBanned = BANNED_KEYWORDS.filter(banned => 
    lowerKeywords.some(k => k.includes(banned)) || 
    lowerTitle.includes(banned) ||
    lowerDesc.includes(banned)
  );

  if (foundBanned.length > 0) {
    issues.push({ 
      type: 'error', 
      message: `Potential Trademark/Brand Violation: ${foundBanned.join(', ')}. Commercial stock must be free of brands.`, 
      field: 'keywords' 
    });
    score -= (25 * foundBanned.length); // Major penalty
    recommendations.push(`Remove all instances of: ${foundBanned.join(', ')}.`);
  }

  // --- 5. Technical / Format Checks ---
  if (!metadata.isAI) {
    issues.push({ type: 'warning', message: 'isAI flag is false. Most platforms now require marking AI content explicitly.', field: 'isAI' });
    score -= 10;
  }

  if (!metadata.author.includes("{{author}}")) {
    issues.push({ type: 'info', message: "Author field does not contain dynamic placeholder.", field: 'author' });
  }

  // Clamp score
  score = Math.max(0, Math.min(100, Math.round(score)));

  return {
    score,
    issues,
    recommendations
  };
};
