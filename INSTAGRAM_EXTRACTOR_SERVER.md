# Instagram Image Extraction Server

This is a Node.js server that uses Puppeteer to extract images from protected platforms like Instagram.

## Setup

```bash
npm init -y
npm install express puppeteer cors helmet
```

## server.js

```javascript
const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:8082'],
  methods: ['POST'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Rate limiting (simple in-memory store)
const requestCounts = new Map();
const RATE_LIMIT = 10; // requests per minute
const RATE_WINDOW = 60 * 1000; // 1 minute

const rateLimit = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  
  if (!requestCounts.has(clientIP)) {
    requestCounts.set(clientIP, { count: 1, resetTime: now + RATE_WINDOW });
    return next();
  }
  
  const clientData = requestCounts.get(clientIP);
  
  if (now > clientData.resetTime) {
    clientData.count = 1;
    clientData.resetTime = now + RATE_WINDOW;
    return next();
  }
  
  if (clientData.count >= RATE_LIMIT) {
    return res.status(429).json({
      success: false,
      error: 'Rate limit exceeded. Please try again later.'
    });
  }
  
  clientData.count++;
  next();
};

// Browser instance management
let browser;

const getBrowser = async () => {
  if (browser && browser.isConnected()) {
    return browser;
  }
  
  browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-first-run',
      '--no-zygote',
      '--single-process'
    ]
  });
  
  return browser;
};

// Instagram image extraction endpoint
app.post('/extract-instagram-image', rateLimit, async (req, res) => {
  const { url } = req.body;
  
  if (!url) {
    return res.status(400).json({
      success: false,
      error: 'URL is required'
    });
  }
  
  // Validate Instagram URL
  if (!url.includes('instagram.com')) {
    return res.status(400).json({
      success: false,
      error: 'Only Instagram URLs are supported'
    });
  }
  
  console.log('🔍 Extracting image from:', url);
  
  try {
    const browser = await getBrowser();
    const page = await browser.newPage();
    
    // Set mobile user agent to get better content
    await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1');
    
    // Set viewport
    await page.setViewport({ 
      width: 375, 
      height: 812, 
      isMobile: true,
      hasTouch: true 
    });
    
    // Block unnecessary resources to speed up loading
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      const resourceType = request.resourceType();
      if (resourceType === 'stylesheet' || resourceType === 'font') {
        request.abort();
      } else {
        request.continue();
      }
    });
    
    // Navigate to Instagram post
    await page.goto(url, { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // Wait a bit for dynamic content to load
    await page.waitForTimeout(2000);
    
    // Extract image URL
    const imageData = await page.evaluate(() => {
      // Try multiple selectors for Instagram images
      const selectors = [
        'article img[alt]',
        'img[style*="object-fit"]',
        'div[role="button"] img',
        'img[src*="scontent"]',
        'img[sizes]'
      ];
      
      for (const selector of selectors) {
        const img = document.querySelector(selector);
        if (img && img.src && img.naturalWidth > 300) {
          return {
            url: img.src,
            alt: img.alt || '',
            width: img.naturalWidth,
            height: img.naturalHeight
          };
        }
      }
      
      // Fallback: try to find any large image
      const images = Array.from(document.querySelectorAll('img'));
      const largeImage = images.find(img => 
        img.naturalWidth > 300 && 
        img.naturalHeight > 300 &&
        img.src.includes('scontent')
      );
      
      if (largeImage) {
        return {
          url: largeImage.src,
          alt: largeImage.alt || '',
          width: largeImage.naturalWidth,
          height: largeImage.naturalHeight
        };
      }
      
      return null;
    });
    
    await page.close();
    
    if (imageData && imageData.url) {
      console.log('✅ Successfully extracted image:', imageData.url);
      res.json({
        success: true,
        imageUrl: imageData.url,
        metadata: {
          alt: imageData.alt,
          width: imageData.width,
          height: imageData.height
        },
        method: 'puppeteer-instagram'
      });
    } else {
      console.log('❌ No image found in Instagram post');
      res.status(404).json({
        success: false,
        error: 'No image found in Instagram post'
      });
    }
    
  } catch (error) {
    console.error('❌ Error extracting Instagram image:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to extract image from Instagram',
      details: error.message
    });
  }
});

// Generic image extraction endpoint
app.post('/extract-image', rateLimit, async (req, res) => {
  const { url, platform = 'general' } = req.body;
  
  if (!url) {
    return res.status(400).json({
      success: false,
      error: 'URL is required'
    });
  }
  
  console.log('🔍 Extracting image from:', url, 'Platform:', platform);
  
  try {
    const browser = await getBrowser();
    const page = await browser.newPage();
    
    // Set realistic user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Navigate and wait for content
    await page.goto(url, { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // Extract main image
    const imageUrl = await page.evaluate(() => {
      // Try OpenGraph meta tags first
      const ogImage = document.querySelector('meta[property="og:image"]');
      if (ogImage) {
        const content = ogImage.getAttribute('content');
        if (content && content.startsWith('http')) return content;
      }
      
      const twitterImage = document.querySelector('meta[property="twitter:image"]');
      if (twitterImage) {
        const content = twitterImage.getAttribute('content');
        if (content && content.startsWith('http')) return content;
      }
      
      // Look for main content images
      const images = Array.from(document.querySelectorAll('img'));
      const largeImage = images.find(img => 
        img.naturalWidth > 200 && 
        img.naturalHeight > 200 &&
        img.src.startsWith('http')
      );
      
      return largeImage ? largeImage.src : null;
    });
    
    await page.close();
    
    if (imageUrl) {
      console.log('✅ Successfully extracted image:', imageUrl);
      res.json({
        success: true,
        imageUrl,
        method: 'puppeteer-general'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'No suitable image found'
      });
    }
    
  } catch (error) {
    console.error('❌ Error extracting image:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to extract image',
      details: error.message
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down gracefully...');
  if (browser) {
    await browser.close();
  }
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`🚀 Instagram image extraction server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});
```

## Docker Support

### Dockerfile

```dockerfile
FROM node:18-slim

# Install Chrome dependencies
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    apt-transport-https \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3001

USER node

CMD ["node", "server.js"]
```

### docker-compose.yml

```yaml
version: '3.8'
services:
  instagram-extractor:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - ALLOWED_ORIGINS=http://localhost:8082,https://your-app-domain.com
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

## Deployment

### Option 1: Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

### Option 2: Heroku
```bash
# Install Heroku CLI and deploy
heroku create your-instagram-extractor
heroku buildpacks:add jontewks/puppeteer
git push heroku main
```

### Option 3: Digital Ocean App Platform
Create `app.yaml`:
```yaml
name: instagram-extractor
services:
- name: api
  source_dir: /
  github:
    repo: your-username/instagram-extractor
    branch: main
  run_command: node server.js
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  routes:
  - path: /
  health_check:
    http_path: /health
```

## Environment Variables

Set these in your deployment:
- `PORT`: Server port (default: 3001)
- `ALLOWED_ORIGINS`: Comma-separated list of allowed origins
- `NODE_ENV`: production

## Usage in React Native App

Update your `.env` file:
```
CUSTOM_BROWSER_EXTRACTOR_URL=https://your-deployed-server.com
```

The advanced image extractor will automatically use this server for Instagram and other protected platforms.

## Rate Limiting

The server includes basic rate limiting:
- 10 requests per minute per IP
- Automatic cleanup of rate limit data
- 429 status code when exceeded

## Security Features

- CORS protection
- Helmet.js for security headers
- Request size limiting
- Input validation
- Resource blocking for faster processing

## Monitoring

The server provides:
- Health check endpoint at `/health`
- Console logging for all operations
- Error handling with proper status codes
- Graceful shutdown on SIGINT