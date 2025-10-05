/**
 * AI Service with fallback classification
 * In production, you would integrate with OpenAI API
 */

import { OpenGraphData } from './openGraphService';

export interface AIClassificationData {
  tags: string[];
  mood: string;
  summary: string;
  category: string;
  aiGenerated: boolean;
}

export interface AIClassificationResult {
  success: boolean;
  data: AIClassificationData;
  error?: string;
}

export interface AISummaryResult {
  success: boolean;
  summary: string;
  error?: string;
}

export interface AIRecommendationsResult {
  success: boolean;
  recommendations: any[];
  message?: string;
  error?: string;
}

/**
 * Classify content using AI
 */
export async function classifyContent(metadata: OpenGraphData): Promise<AIClassificationResult> {
  try {
    const { title, description, platform, url } = metadata;
    
    const prompt = `
Analyze this content and provide:
1. 3-5 relevant tags/categories
2. A mood/sentiment (educational, entertaining, inspiring, informative, etc.)
3. A brief summary (max 50 words)

Content:
Title: ${title}
Description: ${description}
Platform: ${platform}
URL: ${url}

Please respond in JSON format:
{
  "tags": ["tag1", "tag2", "tag3"],
  "mood": "educational",
  "summary": "Brief summary here",
  "category": "main category"
}
`;

    // For now, use fallback classification
    // In production, you would integrate with OpenAI API
    console.log('Using fallback classification - add OpenAI API key for AI features');
    const result = await fallbackClassification(metadata);
    
    return {
      success: true,
      data: {
        tags: result.tags || [],
        mood: result.mood || 'neutral',
        summary: result.summary || '',
        category: result.category || 'general',
        aiGenerated: false,
      }
    };

  } catch (error) {
    console.error('Error classifying content:', error);
    
    // Fallback classification
    return {
      success: false,
      data: await fallbackClassification(metadata),
      error: (error as Error).message,
    };
  }
}

/**
 * Fallback classification when AI is not available
 */
async function fallbackClassification(metadata: OpenGraphData): Promise<AIClassificationData> {
  const { title, description, platform } = metadata;
  const content = `${title} ${description}`.toLowerCase();
  
  // Basic keyword-based classification
  const categories: Record<string, string[]> = {
    technology: ['tech', 'coding', 'programming', 'software', 'app', 'digital', 'computer', 'ai', 'machine learning'],
    design: ['design', 'ui', 'ux', 'graphics', 'visual', 'creative', 'art', 'aesthetic'],
    business: ['business', 'startup', 'entrepreneur', 'marketing', 'sales', 'finance', 'strategy'],
    education: ['learn', 'tutorial', 'course', 'education', 'teach', 'guide', 'how to', 'study'],
    entertainment: ['funny', 'comedy', 'entertainment', 'fun', 'game', 'movie', 'show', 'music'],
    health: ['health', 'fitness', 'medical', 'wellness', 'exercise', 'nutrition', 'mental health'],
    travel: ['travel', 'vacation', 'trip', 'destination', 'explore', 'adventure', 'journey'],
    food: ['food', 'recipe', 'cooking', 'restaurant', 'cuisine', 'chef', 'meal', 'dining'],
    news: ['news', 'breaking', 'update', 'report', 'current', 'politics', 'world', 'local'],
    lifestyle: ['lifestyle', 'fashion', 'beauty', 'home', 'decor', 'personal', 'daily'],
  };

  const moods: Record<string, string[]> = {
    educational: ['learn', 'tutorial', 'guide', 'how to', 'tips', 'advice', 'course'],
    entertaining: ['funny', 'comedy', 'fun', 'entertainment', 'amusing', 'hilarious'],
    inspiring: ['inspiring', 'motivational', 'success', 'achievement', 'dream', 'goal'],
    informative: ['news', 'information', 'facts', 'data', 'research', 'study', 'report'],
    creative: ['creative', 'art', 'design', 'innovative', 'original', 'artistic'],
  };

  // Find matching category
  let category = 'general';
  let maxMatches = 0;
  
  for (const [cat, keywords] of Object.entries(categories)) {
    const matches = keywords.filter(keyword => content.includes(keyword)).length;
    if (matches > maxMatches) {
      maxMatches = matches;
      category = cat;
    }
  }

  // Find matching mood
  let mood = 'neutral';
  let maxMoodMatches = 0;
  
  for (const [m, keywords] of Object.entries(moods)) {
    const matches = keywords.filter(keyword => content.includes(keyword)).length;
    if (matches > maxMoodMatches) {
      maxMoodMatches = matches;
      mood = m;
    }
  }

  // Generate basic tags
  const tags = [category];
  if (platform) tags.push(platform.toLowerCase());
  if (mood !== 'neutral') tags.push(mood);

  return {
    tags: tags.slice(0, 5),
    mood,
    summary: `${platform || 'Content'} about ${category}`,
    category,
    aiGenerated: false,
  };
}

/**
 * Generate AI summary for content
 */
export async function generateSummary(metadata: OpenGraphData): Promise<AISummaryResult> {
  try {
    const { title, description } = metadata;
    
    const prompt = `Summarize this content in 2-3 sentences (max 100 words):
Title: ${title}
Description: ${description}`;

    // For now, return a basic summary
    // In production, you would use OpenAI API
    return {
      success: true,
      summary: `${metadata.title.substring(0, 100)}...`,
    };

  } catch (error) {
    console.error('Error generating summary:', error);
    return {
      success: false,
      summary: `${metadata.title.substring(0, 100)}...`,
      error: (error as Error).message,
    };
  }
}

/**
 * Get content recommendations based on saved links
 */
export async function getRecommendations(userLinks: any[], limit: number = 10): Promise<AIRecommendationsResult> {
  try {
    // This would analyze user's saved links and suggest similar content
    // For now, return a placeholder response
    return {
      success: true,
      recommendations: [],
      message: 'Recommendations feature coming soon!',
    };
  } catch (error) {
    console.error('Error getting recommendations:', error);
    return {
      success: false,
      recommendations: [],
      error: (error as Error).message,
    };
  }
}