#!/usr/bin/env node
/**
 * scraper-auctions.js
 * ดึงข้อมูลประมูล MA5 T จาก TCGThailand แล้วอัพเดท auctionCards ใน index.html
 * รันโดย GitHub Actions ทุก 2 ชั่วโมง
 */

const https = require('https');
const fs    = require('fs');
const path  = require('path');

const AUCTION_PAGE = 'https://www.tcgthailand.com/product?type=auctions&category_ids=26ad5178-3814-4505-a3f8-2cd0add6193d';
const INDEX_PATH   = path.join(__dirname, 'index.html');
const SET_CODE     = 'MA5';

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'th-TH,th;q=0.9,en;q=0.8',
      }
    }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return fetchPage(res.headers.location).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('timeout')); });
  });
}

function extractNuxtPayload(html) {
  const m1 = html.match(/window\.__NUXT__\s*=\s*(\{[\s\S]*?\})\s*<\/script>/);
  if (m1) { try { return JSON.parse(m1[1]); } catch {} }
  const m2 = html.match(/<script[^>]+id="__NUXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (m2) { try { return JSON.parse(m2[1]); } catch {} }
  const m3 = html.match(/window\.__NUXT__\s*=\s*([\s\S]+?);\s*<\/script>/);
  if (m3) { try { return JSON.parse(m3[1]); } catch {} }
  return null;
}

function findAuctionItems(obj, depth = 0, results = []) {
  if (depth > 12 || !obj || typeof obj !== 'object') return results;
  if (Array.isArray(obj)) {
    obj.forEach(i => findAuctionItems(i, depth + 1, results));
    return results;
  }
  const keys = Object.keys(obj);
  if (
    keys.includes('id') && typeof obj.id === 'string' && obj.id.length === 36 &&
    keys.includes('name') && keys.includes('set_code') && keys.includes('status')
  ) {
    results.push(obj);
  }
  keys.forEach(k => findAuctionItems(obj[k], depth + 1, results));
  return results;
}

function buildAuctionCardsCode(items, updatedAt) {
  const lines = items.map(x => {
    const openPrice = parseFloat(x.current_price) > 0
      ? parseFloat(x.current_price)
      : parseFloat(x.opening_price);
    const url = 'https://www.tcgthailand.com/auction/' + x.id;
    return '  { name:"' + x.name + '", cardNo:"' + x.product_code + '", rarity:"' + x.rarity + '", openPrice:' + openPrice + ', fixedPrice:null, marketPrice:null, endTime:"' + x.end_at + '", url:"' + url + '" },';
  });
  return '// ข้อมูลจริงจาก TCGThailand — อัพเดทอัตโนมัติ ' + updatedAt + '\n// url = ลิงก์ตรงเข้าหน้าประมูลแต่ละรายการ (https://www.tcgthailand.com/auction/{uuid})\nconst auctionCards = [\n' + lines.join('\n') + '\n];';
}

function patchIndexHtml(newCode) {
  const html = fs.readFileSync(INDEX_PATH, 'utf8');
  const startMarker = '// ข้อมูลจริงจาก TCGThailand';
  const altMarker   = 'const auctionCards = [';
  const endMarker   = '];';
  let startIdx = html.indexOf(startMarker);
  if (startIdx < 0) startIdx = html.indexOf(altMarker);
  if (startIdx < 0) throw new Error('Cannot find auctionCards block in index.html');
  const endIdx = html.indexOf(endMarker, startIdx) + endMarker.length;
  const patched = html.slice(0, startIdx) + newCode + html.slice(endIdx);
  fs.writeFileSync(INDEX_PATH, patched, 'utf8');
  console.log('index.html patched (' + startIdx + ' to ' + endIdx + ')');
}

(async () => {
  console.log('Fetching TCGThailand auction page...');
  let html;
  try {
    html = await fetchPage(AUCTION_PAGE);
  } catch (err) {
    console.error('Fetch failed:', err.message);
    process.exit(1);
  }
  console.log('HTML length: ' + html.length);
  const nuxt = extractNuxtPayload(html);
  if (!nuxt) {
    console.error('Could not extract __NUXT__ payload');
    const idx = html.indexOf('__NUXT__');
    console.log('snippet:', html.substring(Math.max(0,idx-10), idx+200));
    process.exit(1);
  }
  console.log('Payload found, extracting auctions...');
  const allItems = findAuctionItems(nuxt);
  const seen = new Set();
  const unique = allItems.filter(x => { if(seen.has(x.id)) return false; seen.add(x.id); return true; });
  const ma5Active = unique.filter(x => x.set_code && x.set_code.includes(SET_CODE) && x.status === 'ACTIVE');
  console.log('Found ' + ma5Active.length + ' active MA5 T auctions');
  if (ma5Active.length === 0) {
    console.log('No active MA5 T auctions — keeping existing data');
    process.exit(0);
  }
  ma5Active.sort((a, b) => new Date(a.end_at) - new Date(b.end_at));
  const now = new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok', hour12: false });
  const newCode = buildAuctionCardsCode(ma5Active, now);
  patchIndexHtml(newCode);
  console.log('Done! Updated ' + ma5Active.length + ' auction entries');
})();
