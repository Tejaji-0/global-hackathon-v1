/**
 * OpenGraph metadata extraction service for React Native
 * Optimized for fast metadata extraction using working proxy
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
 * Optimized for fast extraction using the working proxy method
 */
export async function extractOpenGraphData(url: string): Promise<OpenGraphResult> {
  try {
    // Validate URL
    if (!url || !isValidUrl(url)) {
      throw new Error('Invalid URL provided');
    }

    console.log('🔍 Extracting metadata from URL...');

    // Use the working proxy method directly (api.codetabs.com)
    try {
      const proxyResult = await fetchOpenGraphFromWorkingProxy(url);
      if (proxyResult.success) {
        console.log('✅ OpenGraph data extracted:', proxyResult.data);
        return proxyResult;
      }
    } catch (error) {
      console.log('⚠️ Proxy extraction failed, using fallback...');
    }

    // Fallback to enhanced URL-based metadata
    console.log('📝 Using enhanced fallback method...');
    return createEnhancedFallbackMetadata(url);

  } catch (error) {
    console.error('Error extracting OpenGraph data:', (error as Error).message);
    return createErrorMetadata(url, (error as Error).message);
  }
}



/**
 * Fetch metadata using the working proxy (api.codetabs.com)
 */
async function fetchOpenGraphFromWorkingProxy(url: string): Promise<OpenGraphResult> {
  // Use only the working proxy to reduce latency
  const proxyUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`;
  
  const response = await fetch(proxyUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
  });

  if (!response.ok) {
    throw new Error(`Proxy request failed: ${response.status}`);
  }

  const html = await response.text();
  const metadata = parseHTMLForOpenGraph(html, url);
  
  return {
    success: true,
    data: metadata
  };
}

/**
 * Decode HTML entities including numeric ones
 */
function decodeHTMLEntities(text: string): string {
  let decoded = text
    // Named entities
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&apos;/g, "'")
    .replace(/&cent;/g, '¢')
    .replace(/&pound;/g, '£')
    .replace(/&yen;/g, '¥')
    .replace(/&euro;/g, '€')
    .replace(/&copy;/g, '©')
    .replace(/&reg;/g, '®')
    .replace(/&trade;/g, '™');

  // Decode numeric HTML entities (decimal) like &#064; -> @
  decoded = decoded.replace(/&#(\d+);/g, (match, num) => {
    try {
      return String.fromCharCode(parseInt(num, 10));
    } catch {
      return match; // Return original if conversion fails
    }
  });

  // Decode hexadecimal HTML entities like &#x40; -> @
  decoded = decoded.replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => {
    try {
      return String.fromCharCode(parseInt(hex, 16));
    } catch {
      return match; // Return original if conversion fails
    }
  });

  return decoded;
}

/**
 * Parse HTML content for OpenGraph metadata
 */
function parseHTMLForOpenGraph(html: string, url: string): OpenGraphData {
  const domain = getDomain(url);
  const platform = detectPlatform(url);
  
  // Extract OpenGraph meta tags using regex (since we can't use DOM in React Native)
  const extractMeta = (property: string): string | null => {
    const patterns = [
      new RegExp(`<meta\\s+property=["']og:${property}["']\\s+content=["']([^"']+)["']`, 'i'),
      new RegExp(`<meta\\s+content=["']([^"']+)["']\\s+property=["']og:${property}["']`, 'i'),
      new RegExp(`<meta\\s+name=["']${property}["']\\s+content=["']([^"']+)["']`, 'i'),
      new RegExp(`<meta\\s+content=["']([^"']+)["']\\s+name=["']${property}["']`, 'i')
    ];
    
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        // Decode HTML entities and clean the content
        let content = match[1].trim();
        content = decodeHTMLEntities(content);
        return content;
      }
    }
    return null;
  };

  // Extract title from various sources
  const title = extractMeta('title') || 
                extractMeta('twitter:title') || 
                extractTitleTag(html) || 
                extractTitleFromUrl(url);

  // Extract description
  const description = extractMeta('description') || 
                     extractMeta('twitter:description') || 
                     extractMetaDescription(html) || 
                     `Content from ${domain}`;

  // Extract image with platform-specific fallbacks
  let image = extractMeta('image') || 
              extractMeta('twitter:image') || 
              null;

  // If no image found, try platform-specific extraction
  if (!image && platform === 'YouTube') {
    const videoId = extractYouTubeVideoId(url);
    if (videoId) {
      image = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    }
  } else if (!image && platform === 'GitHub') {
    image = extractGitHubAvatar(url);
  }

  // Extract other metadata
  const siteName = extractMeta('site_name') || domain;
  const type = extractMeta('type') || 'website';
  const author = extractMeta('author') || extractMeta('twitter:creator') || null;
  const publishedTime = extractMeta('published_time') || extractMeta('article:published_time') || null;

  return {
    url,
    title,
    description,
    image,
    siteName,
    type,
    author,
    publishedTime,
    platform,
    domain
  };
}

/**
 * Extract title from HTML title tag
 */
function extractTitleTag(html: string): string | null {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match ? match[1].trim() : null;
}

/**
 * Extract meta description
 */
function extractMetaDescription(html: string): string | null {
  const patterns = [
    /<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i,
    /<meta\s+content=["']([^"']+)["']\s+name=["']description["']/i
  ];
  
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return null;
}

/**
 * Create enhanced fallback metadata with better URL analysis
 */
function createEnhancedFallbackMetadata(url: string): OpenGraphResult {
  const domain = getDomain(url);
  const platform = detectPlatform(url);
  
  // Enhanced title extraction based on platform
  let title = extractTitleFromUrl(url);
  let description = `Content from ${domain}`;
  let image: string | null = null;

  // Platform-specific enhancements
  if (platform === 'YouTube') {
    const videoId = extractYouTubeVideoId(url);
    if (videoId) {
      title = `YouTube Video: ${videoId}`;
      description = 'YouTube video content';
      // Try different YouTube thumbnail qualities
      image = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    }
  } else if (platform === 'Instagram') {
    title = 'Instagram Post';
    description = 'Instagram content';
    // Instagram images are harder to extract without API, but we can try
    const instagramId = extractInstagramId(url);
    if (instagramId) {
      // Note: Instagram doesn't allow direct image access, but we set up for future API integration
      image = null;
    }
  } else if (platform === 'Twitter') {
    title = 'Twitter Post';
    description = 'Tweet content';
    // Twitter images require API access for reliable extraction
  } else if (platform === 'TikTok') {
    title = 'TikTok Video';
    description = 'TikTok video content';
    // TikTok thumbnails are also API-dependent
  } else if (platform === 'GitHub') {
    title = extractGitHubTitle(url);
    description = 'GitHub repository or content';
    image = extractGitHubAvatar(url);
  } else if (platform === 'LinkedIn') {
    title = 'LinkedIn Post';
    description = 'Professional content from LinkedIn';
  } else if (platform === 'Medium') {
    title = extractMediumTitle(url);
    description = 'Article from Medium';
  }

  return {
    success: true,
    data: {
      url,
      title,
      description,
      image,
      siteName: domain,
      type: 'website',
      author: null,
      publishedTime: null,
      platform,
      domain,
    }
  };
}

/**
 * Create error metadata
 */
function createErrorMetadata(url: string, error: string): OpenGraphResult {
  return {
    success: false,
    error,
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

/**
 * Extract YouTube video ID from URL
 */
function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
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
 * Extract Instagram post ID from URL
 */
function extractInstagramId(url: string): string | null {
  const patterns = [
    /instagram\.com\/p\/([^\/\?]+)/,
    /instagram\.com\/reel\/([^\/\?]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

/**
 * Extract GitHub title from URL structure
 */
function extractGitHubTitle(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const parts = pathname.split('/').filter(Boolean);
    
    if (parts.length >= 2) {
      return `${parts[0]}/${parts[1]}`;
    }
    return 'GitHub Repository';
  } catch {
    return 'GitHub Content';
  }
}

/**
 * Extract GitHub avatar URL
 */
function extractGitHubAvatar(url: string): string | null {
  try {
    const pathname = new URL(url).pathname;
    const parts = pathname.split('/').filter(Boolean);
    
    if (parts.length >= 1) {
      const username = parts[0];
      return `https://github.com/${username}.png?size=200`;
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * Extract Medium title from URL
 */
function extractMediumTitle(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const parts = pathname.split('/').filter(Boolean);
    
    // Medium URLs often have title in the path
    const lastPart = parts[parts.length - 1];
    if (lastPart && lastPart.includes('-')) {
      return lastPart.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
    }
    return 'Medium Article';
  } catch {
    return 'Medium Content';
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