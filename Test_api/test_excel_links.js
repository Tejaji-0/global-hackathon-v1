import XLSX from 'xlsx';
import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to get OG data from a URL
async function getOGData(url, type) {
  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    // Set a user agent to avoid blocking
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    
    const data = await page.evaluate(() => {
      const title = document.querySelector('meta[property="og:title"]')?.content || 
                   document.querySelector('title')?.textContent || 'No title found';
      const image = document.querySelector('meta[property="og:image"]')?.content || 'No image found';
      const description = document.querySelector('meta[property="og:description"]')?.content || 
                         document.querySelector('meta[name="description"]')?.content || 'No description found';
      const url = document.querySelector('meta[property="og:url"]')?.content || window.location.href;
      
      return { title, image, description, url };
    });
    
    await browser.close();
    return {
      type: type,
      url: url,
      success: true,
      data: data
    };
  } catch (error) {
    return {
      type: type,
      url: url,
      success: false,
      error: error.message
    };
  }
}

// Function to read Excel file and get links
function readExcelLinks(filePath) {
  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert sheet to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (jsonData.length < 2) {
      throw new Error('Excel file must have at least 2 rows (types and links)');
    }
    
    const types = jsonData[0]; // First row - types
    const links = jsonData[1]; // Second row - links
    
    const result = [];
    for (let i = 0; i < Math.min(types.length, links.length); i++) {
      if (types[i] && links[i]) {
        result.push({
          type: types[i],
          link: links[i]
        });
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error reading Excel file:', error.message);
    return [];
  }
}

// Main function to process all links
async function processAllLinks() {
  const excelPath = path.join(__dirname, 'test_links.xlsx');
  console.log('Reading Excel file:', excelPath);
  
  const linksData = readExcelLinks(excelPath);
  
  if (linksData.length === 0) {
    console.log('No valid links found in Excel file');
    return;
  }
  
  console.log(`Found ${linksData.length} links to process:\n`);
  
  const results = [];
  
  for (const linkInfo of linksData) {
    console.log(`Processing ${linkInfo.type}: ${linkInfo.link}`);
    const result = await getOGData(linkInfo.link, linkInfo.type);
    results.push(result);
    
    if (result.success) {
      console.log(`✅ Success - ${result.type}`);
      console.log(`   Title: ${result.data.title.substring(0, 100)}${result.data.title.length > 100 ? '...' : ''}`);
      console.log(`   Image: ${result.data.image !== 'No image found' ? '✅ Found' : '❌ Not found'}`);
    } else {
      console.log(`❌ Failed - ${result.type}: ${result.error}`);
    }
    console.log('');
  }
  
  // Summary
  console.log('=== SUMMARY ===');
  console.log(`Total links processed: ${results.length}`);
  console.log(`Successful: ${results.filter(r => r.success).length}`);
  console.log(`Failed: ${results.filter(r => !r.success).length}`);
  
  // Detailed results
  console.log('\n=== DETAILED RESULTS ===');
  results.forEach((result, index) => {
    console.log(`\n${index + 1}. ${result.type} (${result.url})`);
    if (result.success) {
      console.log(`   Status: ✅ Success`);
      console.log(`   Title: ${result.data.title}`);
      console.log(`   Description: ${result.data.description}`);
      console.log(`   Image: ${result.data.image}`);
    } else {
      console.log(`   Status: ❌ Failed`);
      console.log(`   Error: ${result.error}`);
    }
  });
  
  return results;
}

// Run the script
processAllLinks().catch(console.error);