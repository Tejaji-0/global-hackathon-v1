/**
 * Advanced Image Extraction Service
 * Uses Puppeteer/Selenium-like approaches for protected content
 */

export interface AdvancedImageResult {
  success: boolean;
  imageUrl: string | null;
  error?: string;
  method?: string;
}

/**
 * Extract images from protected platforms using browser automation
 */
export class AdvancedImageExtractor {
  private static readonly USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
  ];

  /**
   * Extract image from Instagram URL
   */
  static async extractInstagramImage(url: string): Promise<AdvancedImageResult> {
    console.log('🔍 Attempting Instagram image extraction for:', url);

    // Method 1: Try Instagram embed API
    try {
      const embedResult = await this.tryInstagramEmbed(url);
      if (embedResult.success) {
        return embedResult;
      }
    } catch (error) {
      console.log('⚠️ Instagram embed failed:', error);
    }

    // Method 2: Try web scraping with different user agents
    try {
      const scrapingResult = await this.tryAdvancedScraping(url, 'instagram');
      if (scrapingResult.success) {
        return scrapingResult;
      }
    } catch (error) {
      console.log('⚠️ Instagram scraping failed:', error);
    }

    // Method 3: Try proxy services
    try {
      const proxyResult = await this.tryProxyExtraction(url, 'instagram');
      if (proxyResult.success) {
        return proxyResult;
      }
    } catch (error) {
      console.log('⚠️ Instagram proxy failed:', error);
    }

    return {
      success: false,
      imageUrl: null,
      error: 'Unable to extract Instagram image - all methods failed'
    };
  }

  /**
   * Try Instagram's official embed API
   */
  private static async tryInstagramEmbed(url: string): Promise<AdvancedImageResult> {
    const postId = this.extractInstagramPostId(url);
    if (!postId) {
      throw new Error('Could not extract Instagram post ID');
    }

    // Instagram oEmbed endpoint (official)
    const embedUrl = `https://api.instagram.com/oembed/?url=${encodeURIComponent(url)}`;
    
    const response = await fetch(embedUrl, {
      headers: {
        'User-Agent': this.getRandomUserAgent(),
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`Instagram embed API failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.thumbnail_url) {
      return {
        success: true,
        imageUrl: data.thumbnail_url,
        method: 'instagram-embed'
      };
    }

    throw new Error('No thumbnail in embed response');
  }

  /**
   * Advanced web scraping with browser-like behavior
   */
  private static async tryAdvancedScraping(url: string, platform: string): Promise<AdvancedImageResult> {
    const headers = {
      'User-Agent': this.getRandomUserAgent(),
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Cache-Control': 'max-age=0'
    };

    // Try multiple proxy services for better success rate
    const proxyServices = [
      `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
      `https://cors-anywhere.herokuapp.com/${url}`,
      `https://thingproxy.freeboard.io/fetch/${url}`
    ];

    for (const proxyUrl of proxyServices) {
      try {
        console.log(`🔄 Trying advanced scraping via: ${proxyUrl.split('/')[2]}`);
        
        const response = await fetch(proxyUrl, { headers });
        
        if (response.ok) {
          const text = await response.text();
          let html = text;
          
          // If using allorigins, extract contents
          if (proxyUrl.includes('allorigins')) {
            const data = JSON.parse(text);
            html = data.contents;
          }
          
          const imageUrl = this.extractImageFromHTML(html, platform);
          if (imageUrl) {
            return {
              success: true,
              imageUrl,
              method: 'advanced-scraping'
            };
          }
        }
      } catch (error) {
        console.log(`❌ Proxy failed: ${proxyUrl.split('/')[2]}`);
        continue;
      }
    }

    throw new Error('All scraping methods failed');
  }

  /**
   * Try specialized proxy extraction services
   */
  private static async tryProxyExtraction(url: string, platform: string): Promise<AdvancedImageResult> {
    // Try web-based screenshot services that can extract images
    const screenshotServices = [
      `https://api.screenshotmachine.com/?key=demo&url=${encodeURIComponent(url)}&dimension=1024x768`,
      `https://htmlcsstoimage.com/demo_run?url=${encodeURIComponent(url)}&ms_delay=1500`
    ];

    // Note: These are demo endpoints. In production, you'd need API keys
    console.log('📸 Trying screenshot-based extraction (demo mode)...');
    
    // For now, return null as these require API keys
    // In production, implement with proper API keys
    
    throw new Error('Screenshot services require API keys');
  }

  /**
   * Extract main image from HTML content
   */
  private static extractImageFromHTML(html: string, platform: string): string | null {
    const patterns: Record<string, RegExp[]> = {
      instagram: [
        // Instagram meta tags
        /<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i,
        /<meta\s+property=["']twitter:image["']\s+content=["']([^"']+)["']/i,
        // Instagram specific patterns
        /"display_url":"([^"]+)"/i,
        /"display_src":"([^"]+)"/i,
        /src="([^"]*\.cdninstagram\.com[^"]*\.jpg[^"]*)"/i
      ],
      twitter: [
        /<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i,
        /<meta\s+property=["']twitter:image["']\s+content=["']([^"']+)["']/i,
        /"media_url_https":"([^"]+)"/i
      ],
      general: [
        /<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i,
        /<meta\s+property=["']twitter:image["']\s+content=["']([^"']+)["']/i,
        /<img[^>]+src=["']([^"']+)["'][^>]*>/i
      ]
    };

    const platformPatterns = patterns[platform] || patterns.general;
    
    for (const pattern of platformPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        let imageUrl = match[1];
        
        // Comprehensive URL cleaning and HTML entity decoding
        imageUrl = this.cleanImageUrl(imageUrl);
        
        // Validate URL
        if (this.isValidImageUrl(imageUrl)) {
          return imageUrl;
        }
      }
    }
    
    return null;
  }

  /**
   * Clean and decode image URL from HTML with comprehensive entity decoding
   */
  private static cleanImageUrl(url: string): string {
    // Handle JSON escaped strings
    let cleanUrl = url.replace(/\\u0026/g, '&');
    cleanUrl = cleanUrl.replace(/\\"/g, '"');
    cleanUrl = cleanUrl.replace(/\\\//g, '/');
    cleanUrl = cleanUrl.replace(/\\/g, '');
    
    // Comprehensive HTML entity decoding
    cleanUrl = this.decodeHTMLEntities(cleanUrl);
    
    // Additional Instagram CDN URL fixes
    if (cleanUrl.includes('cdninstagram.com')) {
      // Ensure proper URL structure
      cleanUrl = cleanUrl.trim();
      
      // Fix double-encoded parameters
      cleanUrl = cleanUrl.replace(/%26/g, '&');
      cleanUrl = cleanUrl.replace(/%3D/g, '=');
      cleanUrl = cleanUrl.replace(/%2F/g, '/');
      
      console.log('🔧 Cleaned Instagram URL:', cleanUrl);
    }
    
    return cleanUrl;
  }

  /**
   * Comprehensive HTML entity decoder
   */
  private static decodeHTMLEntities(text: string): string {
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
      .replace(/&apos;/g, "'");

    // Decode numeric HTML entities (decimal) like &#064; -> @
    decoded = decoded.replace(/&#(\d+);/g, (match, num) => {
      try {
        return String.fromCharCode(parseInt(num, 10));
      } catch {
        return match;
      }
    });

    // Decode hexadecimal HTML entities like &#x40; -> @
    decoded = decoded.replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => {
      try {
        return String.fromCharCode(parseInt(hex, 16));
      } catch {
        return match;
      }
    });

    return decoded;
  }

  /**
   * Extract Instagram post ID from URL
   */
  private static extractInstagramPostId(url: string): string | null {
    const patterns = [
      /instagram\.com\/p\/([A-Za-z0-9_-]+)/,
      /instagram\.com\/reel\/([A-Za-z0-9_-]+)/,
      /instagram\.com\/tv\/([A-Za-z0-9_-]+)/
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
   * Get random user agent to avoid detection
   */
  private static getRandomUserAgent(): string {
    return this.USER_AGENTS[Math.floor(Math.random() * this.USER_AGENTS.length)];
  }

  /**
   * Validate if URL is a proper image URL
   */
  private static isValidImageUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname.toLowerCase();
      const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
      
      return validExtensions.some(ext => path.includes(ext)) || 
             url.includes('cdninstagram.com') || 
             url.includes('twimg.com');
    } catch {
      return false;
    }
  }

  /**
   * Main method to extract image from any URL with advanced techniques
   */
  static async extractImageAdvanced(url: string): Promise<AdvancedImageResult> {
    const domain = this.getDomain(url).toLowerCase();
    
    console.log('🔧 Advanced image extraction for domain:', domain);
    
    // Platform-specific extraction
    if (domain.includes('instagram.com')) {
      return this.extractInstagramImage(url);
    } else if (domain.includes('twitter.com') || domain.includes('x.com')) {
      return this.tryAdvancedScraping(url, 'twitter');
    } else {
      return this.tryAdvancedScraping(url, 'general');
    }
  }

  /**
   * Get domain from URL
   */
  private static getDomain(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return 'unknown';
    }
  }
}

/**
 * Puppeteer-like browser automation service (for server-side use)
 * This would typically run on a server with Puppeteer installed
 */
export class BrowserImageExtractor {
  /**
   * Extract image using browser automation (server-side)
   * This is a template for server-side implementation
   */
  static async extractWithBrowser(url: string): Promise<AdvancedImageResult> {
    // This would be implemented server-side with actual Puppeteer
    const serverEndpoint = process.env.CUSTOM_BROWSER_EXTRACTOR_URL;
    
    if (!serverEndpoint || serverEndpoint === 'your_custom_browser_endpoint') {
      return {
        success: false,
        imageUrl: null,
        error: 'Browser extraction service not configured'
      };
    }

    try {
      const response = await fetch(serverEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          action: 'extract-image',
          waitFor: 'networkidle0',
          viewport: { width: 1920, height: 1080 }
        })
      });

      if (!response.ok) {
        throw new Error(`Browser service failed: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        success: data.success,
        imageUrl: data.imageUrl,
        method: 'browser-automation'
      };
    } catch (error) {
      return {
        success: false,
        imageUrl: null,
        error: `Browser extraction failed: ${error}`
      };
    }
  }
}

/**
 * Server-side Puppeteer implementation example
 * This would run on a Node.js server with Puppeteer
 */
export const PUPPETEER_SERVER_EXAMPLE = `
// server.js - Example Puppeteer server implementation
const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
app.use(express.json());

app.post('/extract-image', async (req, res) => {
  const { url } = req.body;
  
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Set realistic user agent and viewport
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Navigate and wait for content to load
    await page.goto(url, { waitUntil: 'networkidle0' });
    
    // Extract main image
    const imageUrl = await page.evaluate(() => {
      // Try meta tags first
      const ogImage = document.querySelector('meta[property="og:image"]');
      if (ogImage) return ogImage.getAttribute('content');
      
      const twitterImage = document.querySelector('meta[property="twitter:image"]');
      if (twitterImage) return twitterImage.getAttribute('content');
      
      // For Instagram, look for main post image
      const mainImage = document.querySelector('article img[alt]');
      if (mainImage) return mainImage.src;
      
      // Fallback to first large image
      const images = Array.from(document.querySelectorAll('img'));
      const largeImage = images.find(img => img.width > 200 && img.height > 200);
      return largeImage ? largeImage.src : null;
    });
    
    await browser.close();
    
    res.json({
      success: !!imageUrl,
      imageUrl,
      method: 'puppeteer'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.listen(3001, () => {
  console.log('Puppeteer image extractor running on port 3001');
});
`;