import puppeteer from "puppeteer";

/**
 * Extract OpenGraph metadata from any URL using Puppeteer
 * @param {string} url - The URL to extract metadata from
 * @param {Object} options - Configuration options
 * @returns {Promise<Object>} - Extracted metadata
 */
async function getOpenGraphData(url, options = {}) {
  const {
    headless = true,
    timeout = 30000,
    waitUntil = 'networkidle0',
    userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    viewport = { width: 1920, height: 1080 },
    blockResources = true
  } = options;

  console.log(`🔍 Extracting OpenGraph data from: ${url}`);
  
  const browser = await puppeteer.launch({ 
    headless,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu'
    ]
  });
  
  try {
    const page = await browser.newPage();
    
    // Set realistic user agent and viewport
    await page.setUserAgent(userAgent);
    await page.setViewport(viewport);
    
    // Block unnecessary resources for faster loading
    if (blockResources) {
      await page.setRequestInterception(true);
      page.on('request', (request) => {
        const resourceType = request.resourceType();
        if (['stylesheet', 'font', 'image'].includes(resourceType) && !request.url().includes('og:image')) {
          request.abort();
        } else {
          request.continue();
        }
      });
    }
    
    // Navigate to the URL
    await page.goto(url, { 
      waitUntil,
      timeout 
    });
    
    // Wait a bit for dynamic content to load
    await page.waitForTimeout(2000);
    
    // Extract comprehensive OpenGraph and metadata
    const data = await page.evaluate(() => {
      // Helper function to get meta content
      const getMeta = (selectors) => {
        for (const selector of selectors) {
          const element = document.querySelector(selector);
          if (element) {
            return element.getAttribute('content') || element.getAttribute('value');
          }
        }
        return null;
      };
      
      // Extract all relevant metadata
      const metadata = {
        // OpenGraph data
        title: getMeta([
          'meta[property="og:title"]',
          'meta[name="og:title"]',
          'title'
        ]) || document.title,
        
        description: getMeta([
          'meta[property="og:description"]',
          'meta[name="og:description"]',
          'meta[name="description"]'
        ]),
        
        image: getMeta([
          'meta[property="og:image"]',
          'meta[name="og:image"]',
          'meta[property="twitter:image"]',
          'meta[name="twitter:image"]',
          'meta[property="twitter:image:src"]'
        ]),
        
        url: getMeta([
          'meta[property="og:url"]',
          'meta[name="og:url"]'
        ]) || window.location.href,
        
        siteName: getMeta([
          'meta[property="og:site_name"]',
          'meta[name="og:site_name"]'
        ]),
        
        type: getMeta([
          'meta[property="og:type"]',
          'meta[name="og:type"]'
        ]) || 'website',
        
        // Twitter Card data
        twitterCard: getMeta([
          'meta[name="twitter:card"]',
          'meta[property="twitter:card"]'
        ]),
        
        twitterSite: getMeta([
          'meta[name="twitter:site"]',
          'meta[property="twitter:site"]'
        ]),
        
        // Additional metadata
        author: getMeta([
          'meta[name="author"]',
          'meta[property="author"]',
          'meta[name="twitter:creator"]'
        ]),
        
        publishedTime: getMeta([
          'meta[property="article:published_time"]',
          'meta[name="article:published_time"]'
        ]),
        
        // Fallback image extraction
        fallbackImage: (() => {
          if (getMeta(['meta[property="og:image"]', 'meta[name="og:image"]'])) {
            return null; // Already have og:image
          }
          
          // Try to find a large image on the page
          const images = Array.from(document.querySelectorAll('img'));
          const largeImage = images.find(img => 
            img.src && 
            img.naturalWidth > 300 && 
            img.naturalHeight > 300 &&
            !img.src.includes('data:') &&
            !img.src.includes('base64')
          );
          
          return largeImage ? largeImage.src : null;
        })(),
        
        // Platform detection
        platform: (() => {
          const hostname = window.location.hostname.toLowerCase();
          const platformMap = {
            'youtube.com': 'YouTube',
            'youtu.be': 'YouTube',
            'instagram.com': 'Instagram',
            'twitter.com': 'Twitter',
            'x.com': 'Twitter',
            'linkedin.com': 'LinkedIn',
            'github.com': 'GitHub',
            'medium.com': 'Medium',
            'reddit.com': 'Reddit',
            'tiktok.com': 'TikTok',
            'vimeo.com': 'Vimeo',
            'pinterest.com': 'Pinterest'
          };
          
          for (const [domain, platform] of Object.entries(platformMap)) {
            if (hostname.includes(domain)) {
              return platform;
            }
          }
          return 'Website';
        })(),
        
        // Extract favicon
        favicon: (() => {
          const favicon = document.querySelector('link[rel*="icon"]');
          if (favicon) {
            const href = favicon.getAttribute('href');
            if (href) {
              return href.startsWith('http') ? href : new URL(href, window.location.origin).href;
            }
          }
          return `https://www.google.com/s2/favicons?domain=${window.location.hostname}&sz=32`;
        })()
      };
      
      // Use fallback image if no og:image found
      if (!metadata.image && metadata.fallbackImage) {
        metadata.image = metadata.fallbackImage;
      }
      
      return metadata;
    });
    
    console.log('✅ Successfully extracted metadata:', {
      title: data.title?.substring(0, 50) + '...',
      hasImage: !!data.image,
      platform: data.platform
    });
    
    return {
      success: true,
      data,
      extractedAt: new Date().toISOString(),
      url: url
    };
    
  } catch (error) {
    console.error('❌ Error extracting metadata:', error.message);
    return {
      success: false,
      error: error.message,
      url: url
    };
  } finally {
    await browser.close();
  }
}

/**
 * Test function to extract metadata from multiple URLs
 */
async function testMultipleUrls() {
  const testUrls = [
    'https://www.instagram.com/reel/DMHPn7JR04Y/?igsh=N20wMnI5YnVwZmM2',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://github.com/microsoft/vscode',
    'https://medium.com/@example/some-article',
    'https://twitter.com/elonmusk/status/123456789',
    'https://www.linkedin.com/posts/example'
  ];
  
  console.log('🚀 Testing OpenGraph extraction on multiple platforms...\n');
  
  for (const url of testUrls) {
    try {
      const result = await getOpenGraphData(url);
      console.log(`\n📊 Results for ${result.data?.platform || 'Unknown'}:`);
      console.log({
        url: url,
        success: result.success,
        title: result.data?.title,
        hasImage: !!result.data?.image,
        imageUrl: result.data?.image,
        platform: result.data?.platform,
        siteName: result.data?.siteName
      });
    } catch (error) {
      console.error(`❌ Failed to process ${url}:`, error.message);
    }
  }
}

// Platform-specific optimization options
const platformOptions = {
  instagram: {
    waitUntil: 'networkidle0',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
    viewport: { width: 375, height: 812, isMobile: true }
  },
  youtube: {
    waitUntil: 'domcontentloaded',
    blockResources: true
  },
  twitter: {
    waitUntil: 'networkidle0',
    timeout: 15000
  },
  default: {
    waitUntil: 'networkidle0',
    timeout: 30000
  }
};

/**
 * Smart extraction with platform-specific optimizations
 */
async function smartExtract(url) {
  const hostname = new URL(url).hostname.toLowerCase();
  let options = platformOptions.default;
  
  if (hostname.includes('instagram.com')) {
    options = { ...platformOptions.default, ...platformOptions.instagram };
  } else if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
    options = { ...platformOptions.default, ...platformOptions.youtube };
  } else if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
    options = { ...platformOptions.default, ...platformOptions.twitter };
  }
  
  return await getOpenGraphData(url, options);
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  // Single URL test
  const testUrl = process.argv[2] || 'https://www.instagram.com/reel/DMHPn7JR04Y/?igsh=N20wMnI5YnVwZmM2';
  
  console.log('🔍 Testing single URL extraction...');
  smartExtract(testUrl)
    .then(result => {
      console.log('\n📊 Final Result:');
      console.log(JSON.stringify(result, null, 2));
    })
    .catch(console.error);
  
  // Uncomment to test multiple URLs
  // testMultipleUrls().catch(console.error);
}
