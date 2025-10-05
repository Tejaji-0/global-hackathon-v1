/**
 * Intelligent Link Categorization Service
 * Analyzes links and automatically assigns them to appropriate collections
 */

export interface LinkCategory {
  name: string;
  description: string;
  keywords: string[];
  domains: string[];
  urlPatterns: RegExp[];
  priority: number;
}

export interface CategoryMatch {
  category: LinkCategory;
  confidence: number;
  reasons: string[];
}

// Predefined collection categories with smart matching rules
export const COLLECTION_CATEGORIES: LinkCategory[] = [
  {
    name: 'Learning Resources',
    description: 'Educational content, tutorials, and courses',
    keywords: [
      'tutorial', 'course', 'learn', 'education', 'training', 'guide', 'how-to',
      'lesson', 'study', 'academy', 'university', 'school', 'certification',
      'documentation', 'docs', 'manual', 'wiki', 'knowledge', 'skill'
    ],
    domains: [
      'coursera.org', 'udemy.com', 'edx.org', 'khanacademy.org', 'codecademy.com',
      'pluralsight.com', 'lynda.com', 'skillshare.com', 'udacity.com',
      'freecodecamp.org', 'w3schools.com', 'mdn.mozilla.org', 'stackoverflow.com'
    ],
    urlPatterns: [
      /\/tutorial/i, /\/course/i, /\/learn/i, /\/education/i, /\/training/i,
      /\/guide/i, /\/how-to/i, /\/docs/i, /\/documentation/i
    ],
    priority: 8
  },
  {
    name: 'Development Tools',
    description: 'Programming resources, libraries, and developer utilities',
    keywords: [
      'github', 'code', 'programming', 'development', 'developer', 'api', 'library',
      'framework', 'tool', 'utility', 'package', 'npm', 'repository', 'open-source',
      'javascript', 'python', 'react', 'node', 'typescript', 'css', 'html'
    ],
    domains: [
      'github.com', 'gitlab.com', 'bitbucket.org', 'npmjs.com', 'pypi.org',
      'codepen.io', 'jsfiddle.net', 'codesandbox.io', 'stackblitz.com',
      'replit.com', 'heroku.com', 'vercel.com', 'netlify.com'
    ],
    urlPatterns: [
      /github\.com/i, /\/api/i, /\/docs/i, /\/npm/i, /\/package/i,
      /\/library/i, /\/framework/i, /\/tool/i
    ],
    priority: 9
  },
  {
    name: 'Design Inspiration',
    description: 'UI/UX designs, creative ideas, and visual inspiration',
    keywords: [
      'design', 'ui', 'ux', 'interface', 'inspiration', 'creative', 'portfolio',
      'dribbble', 'behance', 'figma', 'sketch', 'adobe', 'colors', 'typography',
      'icons', 'mockup', 'wireframe', 'prototype', 'visual', 'graphic'
    ],
    domains: [
      'dribbble.com', 'behance.net', 'figma.com', 'sketch.com', 'invisionapp.com',
      'uxplanet.org', 'smashingmagazine.com', 'awwwards.com', 'pinterest.com',
      'unsplash.com', 'pexels.com', 'flaticon.com', 'fontawesome.com'
    ],
    urlPatterns: [
      /\/design/i, /\/ui/i, /\/ux/i, /\/creative/i, /\/inspiration/i,
      /\/portfolio/i, /\/mockup/i, /\/wireframe/i
    ],
    priority: 7
  },
  {
    name: 'Reading List',
    description: 'Articles, blogs, and long-form content',
    keywords: [
      'article', 'blog', 'post', 'read', 'news', 'story', 'medium', 'substack',
      'newsletter', 'magazine', 'journal', 'publication', 'editorial', 'opinion',
      'review', 'analysis', 'commentary', 'insight', 'essay'
    ],
    domains: [
      'medium.com', 'substack.com', 'dev.to', 'hashnode.com', 'hackernoon.com',
      'css-tricks.com', 'smashingmagazine.com', 'alistapart.com', 'techcrunch.com',
      'wired.com', 'theverge.com', 'ycombinator.com', 'reddit.com'
    ],
    urlPatterns: [
      /\/blog/i, /\/article/i, /\/post/i, /\/news/i, /\/story/i,
      /\/read/i, /\/publication/i, /\/magazine/i
    ],
    priority: 6
  },
  {
    name: 'Entertainment',
    description: 'Videos, games, music, and fun content',
    keywords: [
      'video', 'youtube', 'watch', 'movie', 'film', 'tv', 'show', 'entertainment',
      'game', 'gaming', 'music', 'spotify', 'netflix', 'twitch', 'tiktok',
      'instagram', 'fun', 'meme', 'funny', 'comedy', 'stream', 'podcast'
    ],
    domains: [
      'youtube.com', 'netflix.com', 'spotify.com', 'twitch.tv', 'tiktok.com',
      'instagram.com', 'twitter.com', 'facebook.com', 'reddit.com',
      'steam.com', 'epicgames.com', 'itch.io', 'soundcloud.com'
    ],
    urlPatterns: [
      /\/watch/i, /\/video/i, /\/game/i, /\/music/i, /\/entertainment/i,
      /\/fun/i, /\/stream/i, /\/podcast/i
    ],
    priority: 4
  },
  {
    name: 'Work Resources',
    description: 'Professional tools, business resources, and productivity apps',
    keywords: [
      'work', 'business', 'professional', 'productivity', 'office', 'enterprise',
      'saas', 'tool', 'app', 'service', 'management', 'project', 'team',
      'collaboration', 'communication', 'meeting', 'calendar', 'email'
    ],
    domains: [
      'slack.com', 'notion.so', 'trello.com', 'asana.com', 'monday.com',
      'zoom.us', 'teams.microsoft.com', 'google.com', 'office.com',
      'salesforce.com', 'hubspot.com', 'mailchimp.com', 'zapier.com'
    ],
    urlPatterns: [
      /\/business/i, /\/enterprise/i, /\/work/i, /\/productivity/i,
      /\/saas/i, /\/tool/i, /\/app/i
    ],
    priority: 5
  },
  {
    name: 'Social Media',
    description: 'Social networks, profiles, and community content',
    keywords: [
      'social', 'profile', 'community', 'network', 'follow', 'share',
      'twitter', 'linkedin', 'facebook', 'instagram', 'tiktok', 'snapchat'
    ],
    domains: [
      'twitter.com', 'linkedin.com', 'facebook.com', 'instagram.com',
      'tiktok.com', 'snapchat.com', 'pinterest.com', 'reddit.com'
    ],
    urlPatterns: [
      /\/profile/i, /\/user/i, /\/@/i, /\/social/i, /\/community/i
    ],
    priority: 3
  }
];

/**
 * Analyzes a link and determines the best collection category
 */
export class LinkCategorizer {
  /**
   * Categorize a link based on its URL, title, and description
   */
  static categorizeLink(
    url: string,
    title?: string,
    description?: string
  ): CategoryMatch | null {
    const matches: CategoryMatch[] = [];
    
    for (const category of COLLECTION_CATEGORIES) {
      const match = this.calculateMatch(category, url, title, description);
      if (match.confidence > 0) {
        matches.push(match);
      }
    }
    
    // Sort by confidence and priority
    matches.sort((a, b) => {
      const confidenceDiff = b.confidence - a.confidence;
      if (Math.abs(confidenceDiff) < 0.1) {
        return b.category.priority - a.category.priority;
      }
      return confidenceDiff;
    });
    
    return matches.length > 0 ? matches[0] : null;
  }
  
  /**
   * Calculate match confidence for a category
   */
  private static calculateMatch(
    category: LinkCategory,
    url: string,
    title?: string,
    description?: string
  ): CategoryMatch {
    let confidence = 0;
    const reasons: string[] = [];
    const urlLower = url.toLowerCase();
    const titleLower = (title || '').toLowerCase();
    const descLower = (description || '').toLowerCase();
    const combinedText = `${urlLower} ${titleLower} ${descLower}`;
    
    // Check domain matches (high confidence)
    for (const domain of category.domains) {
      if (urlLower.includes(domain)) {
        confidence += 0.8;
        reasons.push(`Domain match: ${domain}`);
        break;
      }
    }
    
    // Check URL pattern matches (medium-high confidence)
    for (const pattern of category.urlPatterns) {
      if (pattern.test(url)) {
        confidence += 0.6;
        reasons.push(`URL pattern match`);
        break;
      }
    }
    
    // Check keyword matches (medium confidence)
    let keywordMatches = 0;
    for (const keyword of category.keywords) {
      if (combinedText.includes(keyword)) {
        keywordMatches++;
      }
    }
    
    if (keywordMatches > 0) {
      const keywordConfidence = Math.min(keywordMatches * 0.15, 0.7);
      confidence += keywordConfidence;
      reasons.push(`${keywordMatches} keyword matches`);
    }
    
    // Normalize confidence to 0-1 range
    confidence = Math.min(confidence, 1);
    
    return {
      category,
      confidence,
      reasons
    };
  }
  
  /**
   * Get suggested collection name based on existing collections
   */
  static getSuggestedCollectionName(
    category: LinkCategory,
    existingCollections: string[]
  ): string {
    const existingLower = existingCollections.map(c => c.toLowerCase());
    
    // Check if exact match exists
    if (existingLower.includes(category.name.toLowerCase())) {
      return category.name;
    }
    
    // Check for similar existing collections
    const variations = [
      category.name,
      category.name.replace(' Resources', ''),
      category.name.replace(' Tools', ''),
      category.name.replace(' List', ''),
      category.name.split(' ')[0] // First word only
    ];
    
    for (const variation of variations) {
      const match = existingLower.find(existing => 
        existing.includes(variation.toLowerCase()) ||
        variation.toLowerCase().includes(existing)
      );
      if (match) {
        return existingCollections[existingLower.indexOf(match)];
      }
    }
    
    return category.name;
  }
}