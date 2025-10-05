const puppeteer = require('puppeteer');

/**
 * Universal OpenGraph metadata extractor
 * Works with any website including Instagram, YouTube, Twitter, etc.
 */
async function getOpenGraphData(url, options = {}) {
  const {
    headless = true,
    timeout = 30000,
    waitUntil = 'networkidle0',
    userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    viewport = { width: 1920, height: 1080 }
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
    
    // Navigate to the URL
    await page.goto(url, { 
      waitUntil,
      timeout 
    });
    
    // Wait for dynamic content
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Extract comprehensive metadata
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
      
      const metadata = {
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
          'meta[name="twitter:image"]'
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
        
        platform: (() => {
          const hostname = window.location.hostname.toLowerCase();
          if (hostname.includes('instagram.com')) return 'Instagram';
          if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) return 'YouTube';
          if (hostname.includes('twitter.com') || hostname.includes('x.com')) return 'Twitter';
          if (hostname.includes('linkedin.com')) return 'LinkedIn';
          if (hostname.includes('github.com')) return 'GitHub';
          if (hostname.includes('medium.com')) return 'Medium';
          return 'Website';
        })(),
        
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
      
      return metadata;
    });
    
    console.log('✅ Successfully extracted metadata');
    console.log(`   Platform: ${data.platform}`);
    console.log(`   Title: ${data.title?.substring(0, 60)}...`);
    console.log(`   Has Image: ${!!data.image}`);
    
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

// Platform-specific configurations
const platformConfigs = {
  instagram: {
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
    viewport: { width: 375, height: 812 },
    waitUntil: 'networkidle0'
  },
  youtube: {
    waitUntil: 'domcontentloaded'
  },
  twitter: {
    waitUntil: 'networkidle0',
    timeout: 15000
  }
};

/**
 * Smart extraction with platform detection
 */
async function smartExtract(url) {
  const hostname = new URL(url).hostname.toLowerCase();
  let config = {};
  
  if (hostname.includes('instagram.com')) {
    config = platformConfigs.instagram;
  } else if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
    config = platformConfigs.youtube;
  } else if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
    config = platformConfigs.twitter;
  }
  
  return await getOpenGraphData(url, config);
}

// Test function
async function runTest() {
  const testUrls = [
    'https://www.instagram.com/reel/DMHPn7JR04Y/?igsh=N20wMnI5YnVwZmM2',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://github.com/microsoft/vscode'
  ];
  
  console.log('🚀 Testing Universal OpenGraph Extractor\n');
  
  for (const url of testUrls) {
    console.log(`\n${'='.repeat(60)}`);
    try {
      const result = await smartExtract(url);
      
      if (result.success) {
        console.log(`\n📊 Results for ${result.data.platform}:`);
        console.log(`   URL: ${url}`);
        console.log(`   Title: ${result.data.title}`);
        console.log(`   Description: ${result.data.description?.substring(0, 100)}...`);
        console.log(`   Image: ${result.data.image}`);
        console.log(`   Site: ${result.data.siteName}`);
        console.log(`   Type: ${result.data.type}`);
        console.log(`   Favicon: ${result.data.favicon}`);
      } else {
        console.log(`❌ Failed to extract from ${url}: ${result.error}`);
      }
    } catch (error) {
      console.error(`❌ Error processing ${url}:`, error.message);
    }
  }
}

// Run if called directly
if (require.main === module) {
  const testUrl = process.argv[2] || 'https://www.instagram.com/reel/DMHPn7JR04Y/?igsh=N20wMnI5YnVwZmM2';
  
  console.log('🔍 Testing single URL extraction...');
  smartExtract(testUrl)
    .then(result => {
      console.log('\n📊 Final Result:');
      console.log(JSON.stringify(result, null, 2));
    })
    .catch(console.error);
}

module.exports = { getOpenGraphData, smartExtract };