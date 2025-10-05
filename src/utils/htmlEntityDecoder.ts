/**
 * HTML Entity Decoder Utility
 * Comprehensive decoding for all HTML entities including numeric ones
 */

/**
 * Decode all types of HTML entities in text content
 * Handles named entities, decimal numeric entities, and hexadecimal entities
 * 
 * Examples:
 * - &amp; → &
 * - &#064; → @
 * - &#x40; → @
 * - &quot; → "
 */
export function decodeHTMLEntities(text: string): string {
  if (!text || typeof text !== 'string') {
    return text;
  }

  let decoded = text
    // Common named entities
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
    .replace(/&trade;/g, '™')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&hellip;/g, '…')
    .replace(/&lsquo;/g, '\u2018')
    .replace(/&rsquo;/g, '\u2019')
    .replace(/&ldquo;/g, '\u201C')
    .replace(/&rdquo;/g, '\u201D');

  // Decode numeric HTML entities (decimal) like &#064; -> @
  decoded = decoded.replace(/&#(\d+);/g, (match, num) => {
    try {
      const charCode = parseInt(num, 10);
      // Validate char code range to prevent issues
      if (charCode >= 0 && charCode <= 1114111) {
        return String.fromCharCode(charCode);
      }
      return match;
    } catch {
      return match;
    }
  });

  // Decode hexadecimal HTML entities like &#x40; -> @
  decoded = decoded.replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => {
    try {
      const charCode = parseInt(hex, 16);
      // Validate char code range to prevent issues
      if (charCode >= 0 && charCode <= 1114111) {
        return String.fromCharCode(charCode);
      }
      return match;
    } catch {
      return match;
    }
  });

  return decoded;
}

/**
 * Clean and decode content for display
 * Removes extra whitespace and decodes HTML entities
 */
export function cleanDisplayText(text: string): string {
  if (!text) return '';
  
  // Decode HTML entities
  let cleaned = decodeHTMLEntities(text);
  
  // Clean up whitespace
  cleaned = cleaned
    .replace(/\s+/g, ' ') // Multiple spaces to single space
    .replace(/\n\s*\n/g, '\n') // Multiple newlines to single newline
    .trim();
  
  return cleaned;
}

/**
 * Clean Instagram-specific content
 * Handles hashtags and @ mentions properly
 */
export function cleanInstagramContent(text: string): string {
  if (!text) return '';
  
  // First decode HTML entities
  let cleaned = decodeHTMLEntities(text);
  
  // Clean up common Instagram patterns
  cleaned = cleaned
    .replace(/\\n/g, '\n') // Unescape newlines
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();
  
  return cleaned;
}

/**
 * Extract hashtags from text after decoding
 */
export function extractHashtags(text: string): string[] {
  if (!text) return [];
  
  const cleaned = decodeHTMLEntities(text);
  const hashtagRegex = /#[\w\u00C0-\u017F]+/g;
  const matches = cleaned.match(hashtagRegex);
  
  return matches ? matches.map(tag => tag.toLowerCase()) : [];
}

/**
 * Extract @ mentions from text after decoding
 */
export function extractMentions(text: string): string[] {
  if (!text) return [];
  
  const cleaned = decodeHTMLEntities(text);
  const mentionRegex = /@[\w\u00C0-\u017F.]+/g;
  const matches = cleaned.match(mentionRegex);
  
  return matches ? matches.map(mention => mention.toLowerCase()) : [];
}

/**
 * Format text for React Native display
 * Ensures proper line breaks and character encoding
 */
export function formatForDisplay(text: string, maxLength?: number): string {
  if (!text) return '';
  
  // Decode and clean
  let formatted = cleanDisplayText(text);
  
  // Truncate if needed
  if (maxLength && formatted.length > maxLength) {
    formatted = formatted.substring(0, maxLength - 3) + '...';
  }
  
  return formatted;
}

// Export test function to verify entity decoding
export function testHTMLEntityDecoding(): void {
  const testCases = [
    {
      name: 'Instagram @ mention',
      input: 'Follow &#064;minecraft for updates!',
      expected: 'Follow @minecraft for updates!'
    },
    {
      name: 'Mixed entities',
      input: '&quot;Still gotta follow traffic laws&quot; &amp; have fun! &#064;user',
      expected: '"Still gotta follow traffic laws" & have fun! @user'
    },
    {
      name: 'Hexadecimal entities',
      input: 'Check out &#x40;username &#x26; &#x23;hashtag',
      expected: 'Check out @username & #hashtag'
    },
    {
      name: 'Special characters',
      input: 'Price: &pound;100 &euro;85 &copy;2025',
      expected: 'Price: £100 €85 ©2025'
    }
  ];

  console.log('🧪 HTML Entity Decoding Tests:');
  console.log('=' .repeat(50));
  
  testCases.forEach((test, index) => {
    const result = decodeHTMLEntities(test.input);
    const passed = result === test.expected;
    
    console.log(`\n${index + 1}. ${test.name}:`);
    console.log(`   Input:    "${test.input}"`);
    console.log(`   Expected: "${test.expected}"`);
    console.log(`   Result:   "${result}"`);
    console.log(`   Status:   ${passed ? '✅ PASS' : '❌ FAIL'}`);
  });
}