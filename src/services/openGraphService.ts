/**
 * OpenGraph metadata extraction service for React Native
 * Extract and process metadata from URLs
 */

export interface OpenGraphData {
  url: string;
  title: string;
  description: string;
  image: string | null;
  siteName: string;
  type: string;
  author: string | null;
  publishedTime: string | null;
  platform: string;
  domain: string;
}

export interface OpenGraphResult {
  success: boolean;
  data: OpenGraphData;
  error?: string;
}

/**
 * Extract OpenGraph metadata from a URL
 * For React Native, we use a simplified approach
 * In production, you'd want to use a server-side scraper
 */
export async function extractOpenGraphData(url: string): Promise<OpenGraphResult> {
  try {
    // Validate URL
    if (!url || !isValidUrl(url)) {
      throw new Error('Invalid URL provided');
    }

    // For React Native, we'll create basic metadata from the URL
    // In a real app, you'd want to use a server-side scraper
    const domain = getDomain(url);
    const platform = detectPlatform(url);
    
    const metadata: OpenGraphData = {
      url: url,
      title: extractTitleFromUrl(url),
      description: `Content from ${domain}`,
      image: null,
      siteName: domain,
      type: 'website',
      author: null,
      publishedTime: null,
      platform: platform,
      domain: domain,
    };

    return {
      success: true,
      data: metadata,
    };
  } catch (error) {
    console.error('Error extracting OpenGraph data:', (error as Error).message);
    return {
      success: false,
      error: (error as Error).message,
      data: {
        url: url,
        title: 'Unable to fetch title',
        description: 'Unable to fetch description',
        image: null,
        siteName: getDomain(url),
        type: 'website',
        author: null,
        publishedTime: null,
        platform: detectPlatform(url),
        domain: getDomain(url),
      },
    };
  }
}

/**
 * Extract a basic title from URL
 */
function extractTitleFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    let title = pathname.split('/').filter(Boolean).pop() || 'Untitled';
    
    // Clean up the title
    title = title.replace(/[-_]/g, ' ');
    title = title.replace(/\.(html|php|aspx?)$/i, '');
    title = title.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
    
    return title || 'Untitled Content';
  } catch {
    return 'Untitled Content';
  }
}

/**
 * Detect the platform/source of the URL
 */
function detectPlatform(url: string): string {
  const domain = getDomain(url).toLowerCase();
  
  const platformMap: Record<string, string> = {
    'youtube.com': 'YouTube',
    'youtu.be': 'YouTube',
    'instagram.com': 'Instagram',
    'twitter.com': 'Twitter',
    'x.com': 'Twitter',
    'linkedin.com': 'LinkedIn',
    'pinterest.com': 'Pinterest',
    'pin.it': 'Pinterest',
    'tiktok.com': 'TikTok',
    'reddit.com': 'Reddit',
    'medium.com': 'Medium',
    'github.com': 'GitHub',
    'dribbble.com': 'Dribbble',
    'behance.net': 'Behance',
    'vimeo.com': 'Vimeo',
    'twitch.tv': 'Twitch',
  };

  for (const [key, platform] of Object.entries(platformMap)) {
    if (domain.includes(key)) {
      return platform;
    }
  }

  return 'Website';
}

/**
 * Extract domain from URL
 */
function getDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return 'unknown';
  }
}

/**
 * Validate if string is a proper URL
 */
function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
}

/**
 * Generate AI tags for content (placeholder - integrate with OpenAI later)
 */
export async function generateAITags(metadata: OpenGraphData): Promise<string[]> {
  // This will be implemented with OpenAI integration
  // For now, return basic tags based on platform and content
  const tags: string[] = [];
  
  // Add platform tag
  if (metadata.platform) {
    tags.push(metadata.platform.toLowerCase());
  }

  // Add basic content type tags based on title/description
  const content = `${metadata.title} ${metadata.description}`.toLowerCase();
  
  const tagMap: Record<string, string[]> = {
    'tutorial': ['tutorial', 'how to', 'guide', 'learn'],
    'news': ['news', 'breaking', 'report', 'update'],
    'entertainment': ['funny', 'comedy', 'entertainment', 'fun'],
    'technology': ['tech', 'technology', 'coding', 'programming', 'software'],
    'design': ['design', 'ui', 'ux', 'graphic', 'visual'],
    'business': ['business', 'startup', 'entrepreneur', 'marketing'],
    'health': ['health', 'fitness', 'medical', 'wellness'],
    'travel': ['travel', 'vacation', 'trip', 'destination'],
    'food': ['food', 'recipe', 'cooking', 'restaurant'],
    'music': ['music', 'song', 'artist', 'album'],
    'video': ['video', 'watch', 'movie', 'film'],
  };

  for (const [tag, keywords] of Object.entries(tagMap)) {
    if (keywords.some(keyword => content.includes(keyword))) {
      tags.push(tag);
    }
  }

  return tags.length > 0 ? tags : ['general'];
}