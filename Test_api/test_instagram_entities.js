/**
 * Test HTML Entity Decoding for Instagram Content
 * Specifically test the &#064; -> @ conversion
 */

// HTML Entity Decoder function (standalone for testing)
function decodeHTMLEntities(text) {
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
    .replace(/&apos;/g, "'");

  // Decode numeric HTML entities (decimal) like &#064; -> @
  decoded = decoded.replace(/&#(\d+);/g, (match, num) => {
    try {
      const charCode = parseInt(num, 10);
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

function cleanDisplayText(text) {
  if (!text) return '';
  
  let cleaned = decodeHTMLEntities(text);
  cleaned = cleaned
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n')
    .trim();
  
  return cleaned;
}

// Your specific Instagram example
const instagramTitle = 'Merrick Hanna on Instagram: "Still gotta follow traffic laws when you Chase The Skies! #minecraftpartner &#064;minecraft"';

const instagramDescription = 'merrickhanna on July 14, 2025: "Still gotta follow traffic laws when you Chase The Skies! #minecraftpartner &#064;minecraft".';

console.log('🧪 Instagram HTML Entity Decoding Test');
console.log('=' .repeat(60));

console.log('\n📋 Testing your specific Instagram content:');

console.log('\n1. Title with &#064; (@ symbol):');
console.log('   Original:', instagramTitle);
const decodedTitle = decodeHTMLEntities(instagramTitle);
console.log('   Decoded: ', decodedTitle);
console.log('   Status:  ', decodedTitle.includes('@minecraft') ? '✅ SUCCESS' : '❌ FAILED');

console.log('\n2. Description with &#064; (@ symbol):');
console.log('   Original:', instagramDescription);
const decodedDescription = decodeHTMLEntities(instagramDescription);
console.log('   Decoded: ', decodedDescription);
console.log('   Status:  ', decodedDescription.includes('@minecraft') ? '✅ SUCCESS' : '❌ FAILED');

console.log('\n3. Cleaned for display:');
const cleanTitle = cleanDisplayText(instagramTitle);
const cleanDescription = cleanDisplayText(instagramDescription);
console.log('   Clean Title:', cleanTitle);
console.log('   Clean Desc: ', cleanDescription);

console.log('\n4. Character code verification:');
console.log('   &#064; should be @:', String.fromCharCode(64) === '@');
console.log('   &#035; should be #:', String.fromCharCode(35) === '#');

// Test various HTML entities that might appear in social media content
const testCases = [
  {
    name: 'At symbol (&#064;)',
    input: '&#064;username',
    expected: '@username'
  },
  {
    name: 'Hash symbol (&#035;)',
    input: '&#035;hashtag',
    expected: '#hashtag'
  },
  {
    name: 'Quote marks',
    input: '&quot;Hello World&quot;',
    expected: '"Hello World"'
  },
  {
    name: 'Ampersand',
    input: 'Tom &amp; Jerry',
    expected: 'Tom & Jerry'
  },
  {
    name: 'Mixed entities',
    input: 'Follow &#064;user &amp; use &#035;hashtag &quot;now&quot;!',
    expected: 'Follow @user & use #hashtag "now"!'
  },
  {
    name: 'Hexadecimal entities',
    input: '&#x40;user &#x23;tag &#x26;symbol',
    expected: '@user #tag &symbol'
  }
];

console.log('\n🔬 Comprehensive Entity Decoding Tests:');
console.log('-' .repeat(60));

let passCount = 0;
testCases.forEach((test, index) => {
  const result = decodeHTMLEntities(test.input);
  const passed = result === test.expected;
  if (passed) passCount++;
  
  console.log(`\n${index + 1}. ${test.name}:`);
  console.log(`   Input:    "${test.input}"`);
  console.log(`   Expected: "${test.expected}"`);
  console.log(`   Result:   "${result}"`);
  console.log(`   Status:   ${passed ? '✅ PASS' : '❌ FAIL'}`);
});

console.log('\n🎯 Test Summary:');
console.log(`   Passed: ${passCount}/${testCases.length}`);
console.log(`   Success Rate: ${Math.round((passCount / testCases.length) * 100)}%`);

if (passCount === testCases.length) {
  console.log('\n🎉 All tests passed! Your Instagram content will display correctly.');
  console.log('\n📱 Integration Ready:');
  console.log('   • Titles will show "@minecraft" instead of "&#064;minecraft"');
  console.log('   • Descriptions will be properly decoded');
  console.log('   • All special characters will render correctly');
  console.log('   • Hashtags and mentions will work properly');
} else {
  console.log('\n⚠️ Some tests failed. Check the implementation.');
}