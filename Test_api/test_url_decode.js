/**
 * URL Decoder Test - Test HTML entity decoding for Instagram URLs
 */

// Test the problem URLs
const testUrls = [
  // Original working URL (manual test)
  'https://scontent-hkg4-1.cdninstagram.com/v/t51.71878-15/520037909_1072098801102743_1331972295570739051_n.jpg?stp=cmp1_dst-jpg_e35_s640x640_tt6&_nc_cat=106&ccb=1-7&_nc_sid=18de74&efg=eyJlZmdfdGFnIjoiQ0xJUFMuYmVzdF9pbWFnZV91cmxnZW4uQzMifQ%3D%3D&_nc_ohc=q0FrBU_p1KQQ7kNvwFS_z7q&_nc_oc=Adn3YaN4C_9-0_ekJirrEkR7Nr1w2lHRVjYiut2mWmE7aCLh0BnPTTklltc-6nVtToA&_nc_zt=23&_nc_ht=scontent-hkg4-1.cdninstagram.com&_nc_gid=lACu2bhbWVhjeSF4YG5pWg&oh=00_AffLu2jBepvpI0IZ4sJEeA99VViXFY8TX7p6Zk4sXa4bDQ&oe=68E7E8A4',
  
  // Problematic URL from app (with &amp;)
  'https://scontent-cdg4-3.cdninstagram.com/v/t51.71878-15/520037909_1072098801102743_1331972295570739051_n.jpg?stp=cmp1_dst-jpg_e35_s640x640_tt6&amp;_nc_cat=106&amp;ccb=1-7&amp;_nc_sid=18de74&amp;efg=eyJlZmdfdGFnIjoiQ0xJUFMuYmVzdF9pbWFnZV91cmxnZW4uQzMifQ%3D%3D&amp;_nc_ohc=q0FrBU_p1KQQ7kNvwG49p3l&amp;_nc_oc=AdlnVPaQmynmqxXAPEWWI3MDtH9YiMUyoahGQK-jLP5P4PpJOA7bb6hrBLbgs7FK9UY&amp;_nc_zt=23&amp;_nc_ht=scontent-cdg4-3.cdninstagram.com&amp;_nc_gid=sIldtNocqHjeCckdJsbRAA&amp;oh=00_AfeDmr2L13lyO_qbNV9hV4LmOgy_HMeNG1uXYqXvHaTmvg&amp;oe=68E7E8A4'
];

/**
 * Clean and decode image URL from HTML
 */
function cleanImageUrl(url) {
  console.log('🔧 Original URL:', url);
  
  // Handle JSON escaped strings
  let cleanUrl = url.replace(/\\u0026/g, '&');
  cleanUrl = cleanUrl.replace(/\\"/g, '"');
  cleanUrl = cleanUrl.replace(/\\\//g, '/');
  cleanUrl = cleanUrl.replace(/\\/g, '');
  
  // HTML entity decoding
  cleanUrl = cleanUrl.replace(/&amp;/g, '&');
  cleanUrl = cleanUrl.replace(/&lt;/g, '<');
  cleanUrl = cleanUrl.replace(/&gt;/g, '>');
  cleanUrl = cleanUrl.replace(/&quot;/g, '"');
  cleanUrl = cleanUrl.replace(/&#x27;/g, "'");
  cleanUrl = cleanUrl.replace(/&#x2F;/g, '/');
  
  // Additional Instagram CDN URL fixes
  if (cleanUrl.includes('cdninstagram.com')) {
    // Ensure proper URL structure
    cleanUrl = cleanUrl.trim();
    
    // Fix double-encoded parameters
    cleanUrl = cleanUrl.replace(/%26/g, '&');
    cleanUrl = cleanUrl.replace(/%3D/g, '=');
    cleanUrl = cleanUrl.replace(/%2F/g, '/');
    
    console.log('✅ Cleaned Instagram URL:', cleanUrl);
  }
  
  return cleanUrl;
}

/**
 * Test URL accessibility
 */
async function testUrlAccess(url) {
  try {
    console.log(`\n🔍 Testing URL access: ${url.substring(0, 100)}...`);
    
    const response = await fetch(url, {
      method: 'HEAD', // Just check headers, don't download content
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
      }
    });
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log(`   Content-Type: ${response.headers.get('content-type')}`);
    console.log(`   Content-Length: ${response.headers.get('content-length')} bytes`);
    
    if (response.ok) {
      console.log('   ✅ URL is accessible');
      return true;
    } else {
      console.log('   ❌ URL failed');
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return false;
  }
}

/**
 * Run the URL decoding test
 */
async function runTest() {
  console.log('🚀 URL Decoding Test for Instagram Images\n');
  console.log('=' .repeat(60));
  
  for (let i = 0; i < testUrls.length; i++) {
    const originalUrl = testUrls[i];
    
    console.log(`\n📋 Test ${i + 1}:`);
    console.log('Type:', i === 0 ? 'Working URL (manual)' : 'Problematic URL (from app)');
    
    // Clean the URL
    const cleanedUrl = cleanImageUrl(originalUrl);
    
    // Compare URLs
    const hasChanged = originalUrl !== cleanedUrl;
    console.log(`🔄 URL Changed: ${hasChanged ? 'Yes' : 'No'}`);
    
    if (hasChanged) {
      console.log('📝 Changes:');
      if (originalUrl.includes('&amp;') && !cleanedUrl.includes('&amp;')) {
        console.log('   - Decoded &amp; to &');
      }
      if (originalUrl.includes('scontent-cdg4-3') && cleanedUrl.includes('scontent-cdg4-3')) {
        console.log('   - CDN server: scontent-cdg4-3.cdninstagram.com');
      }
    }
    
    // Test accessibility
    const isAccessible = await testUrlAccess(cleanedUrl);
    
    console.log('-'.repeat(40));
  }
  
  console.log('\n🎯 Summary:');
  console.log('The issue is likely HTML entity encoding (&amp; instead of &)');
  console.log('The cleanImageUrl function should fix this in your app.');
  console.log('Different CDN servers (scontent-hkg4-1 vs scontent-cdg4-3) are normal.');
}

// Run the test
runTest().catch(console.error);