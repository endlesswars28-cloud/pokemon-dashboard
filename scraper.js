/**
 * TCGThailand Price Scraper
 * รันโดย GitHub Actions ทุกคืน 02:00 น. (เวลาไทย)
 *
 * วิธีรันมือ:  node scraper.js
 * ต้องการ:    Node.js 18+ (ไม่ต้องติดตั้ง package เพิ่ม)
 */

import { writeFileSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PRICES_FILE = join(__dirname, 'prices.json');

// =====================================================
// ข้อมูลการ์ดที่ต้องติดตาม (id ต้องตรงกับใน index.html)
// URL ของหน้าสินค้าแต่ละใบใน TCGThailand
// =====================================================
const CARD_URLS = [
  { id: 1,  name: 'เมก้าดาร์กไรex (MUR)',  nameTh: 'Mega Darkrai ex',  url: 'https://www.tcgthailand.com/products/mega-darkrai-ex-mur-ma5-t-238' },
  { id: 2,  name: 'เมก้าดาร์กไรex (SAR)',  nameTh: 'Mega Darkrai ex',  url: 'https://www.tcgthailand.com/products/mega-darkrai-ex-sar-ma5-t-229' },
  { id: 3,  name: 'เมก้าเก็คโคกะex (SAR)', nameTh: 'Mega Greninja ex', url: 'https://www.tcgthailand.com/products/mega-greninja-ex-sar-ma5-t' },
  { id: 4,  name: 'มอร์เพโคex (SAR)',       nameTh: 'Morpeko ex',       url: 'https://www.tcgthailand.com/products/morpeko-ex-sar-ma5-t' },
  { id: 5,  name: 'เมก้าเก็คโคกะex (IR)',  nameTh: 'Mega Greninja ex', url: 'https://www.tcgthailand.com/products/mega-greninja-ex-ir-ma5-t' },
  { id: 6,  name: 'แชนดิลูร์ex (SAR)',     nameTh: 'Chandelure ex',    url: 'https://www.tcgthailand.com/products/chandelure-ex-sar-ma5-t' },
  { id: 7,  name: 'เมก้าดาร์กไรex (SR)',   nameTh: 'Mega Darkrai ex',  url: 'https://www.tcgthailand.com/products/mega-darkrai-ex-sr-ma5-t' },
  { id: 8,  name: 'ดราก้อนไนต์ex (SAR)',   nameTh: 'Dragonite ex',     url: 'https://www.tcgthailand.com/products/dragonite-ex-sar-ma5-t' },
  { id: 9,  name: 'เมก้าดาร์กไรex (RR)',   nameTh: 'Mega Darkrai ex',  url: 'https://www.tcgthailand.com/products/mega-darkrai-ex-rr-ma5-t' },
  { id: 10, name: 'มอร์เพโคex (IR)',        nameTh: 'Morpeko ex',       url: 'https://www.tcgthailand.com/products/morpeko-ex-ir-ma5-t' },
  { id: 11, name: 'สโลว์โบร (SAR)',        nameTh: 'Slowbro',           url: 'https://www.tcgthailand.com/products/slowbro-sar-ma5-t' },
  { id: 12, name: 'แชนดิลูร์ex (RR)',      nameTh: 'Chandelure ex',    url: 'https://www.tcgthailand.com/products/chandelure-ex-rr-ma5-t' },
  { id: 13, name: 'เก็คโคกะex (RR)',       nameTh: 'Greninja ex',      url: 'https://www.tcgthailand.com/products/greninja-ex-rr-ma5-t' },
  { id: 14, name: 'มอร์เพโคex (RR)',       nameTh: 'Morpeko ex',       url: 'https://www.tcgthailand.com/products/morpeko-ex-rr-ma5-t' },
  { id: 15, name: 'แชนดิลูร์ex (SR)',      nameTh: 'Chandelure ex',    url: 'https://www.tcgthailand.com/products/chandelure-ex-sr-ma5-t' },
  { id: 16, name: 'ฟรอกกาเดียร์ (SR)',     nameTh: 'Frogadier',        url: 'https://www.tcgthailand.com/products/frogadier-sr-ma5-t' },
  { id: 17, name: 'โฟรเอคกี้ (SR)',        nameTh: 'Froakie',          url: 'https://www.tcgthailand.com/products/froakie-sr-ma5-t' },
  { id: 18, name: 'ดราก้อนไนต์ex (RR)',    nameTh: 'Dragonite ex',     url: 'https://www.tcgthailand.com/products/dragonite-ex-rr-ma5-t' },
  { id: 19, name: 'ดราก้อนไนต์ex (SR)',    nameTh: 'Dragonite ex',     url: 'https://www.tcgthailand.com/products/dragonite-ex-sr-ma5-t' },
  { id: 20, name: 'ฟลอราแกโต (SR)',        nameTh: 'Floragato',        url: 'https://www.tcgthailand.com/products/floragato-sr-ma5-t' },
  { id: 21, name: 'เมียนฟู (SR)',          nameTh: 'Mienfoo',          url: 'https://www.tcgthailand.com/products/mienfoo-sr-ma5-t' },
  { id: 22, name: 'สโลว์โบร (RR)',         nameTh: 'Slowbro',          url: 'https://www.tcgthailand.com/products/slowbro-rr-ma5-t' },
  { id: 23, name: 'ดาร์กไรex (RR)',        nameTh: 'Darkrai ex',       url: 'https://www.tcgthailand.com/products/darkrai-ex-rr-ma5-t' },
  { id: 24, name: 'เมียนเชาว์ (C)',        nameTh: 'Mienshao',         url: 'https://www.tcgthailand.com/products/mienshao-c-ma5-t' },
  { id: 25, name: 'ลิตวิก (C)',            nameTh: 'Litwick',          url: 'https://www.tcgthailand.com/products/litwick-c-ma5-t' },
];

// =====================================================
// ดึงราคาจากหน้าสินค้า TCGThailand (Shopify store)
// ลอง JSON API ก่อน → fallback HTML parse
// =====================================================
async function scrapePrice(card) {
  // Shopify stores expose product JSON at /products/<handle>.json
  const jsonUrl = card.url.replace(/\?.*$/, '') + '.json';
  try {
    const res = await fetch(jsonUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PriceBot/1.0)',
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (res.ok) {
      const data = await res.json();
      const variant = data?.product?.variants?.[0];
      if (variant?.price) {
        const price = Math.round(parseFloat(variant.price));
        console.log(`  ✅ ${card.name}: ฿${price.toLocaleString()}`);
        return price;
      }
    }
  } catch (err) {
    // Shopify JSON not available — fall through to HTML parse
  }

  // Fallback: parse HTML for price tag
  try {
    const res = await fetch(card.url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PriceBot/1.0)' },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();

    // Common Shopify price patterns
    const patterns = [
      /class="price[^"]*"[^>]*>\s*(?:฿|THB)?\s*([\d,]+(?:\.\d{2})?)/i,
      /"price":\s*([\d.]+)/,
      /data-price="([\d]+)"/,
    ];
    for (const rx of patterns) {
      const m = html.match(rx);
      if (m) {
        const price = Math.round(parseFloat(m[1].replace(/,/g, '')));
        if (price > 0) {
          console.log(`  ✅ ${card.name}: ฿${price.toLocaleString()} (HTML)`);
          return price;
        }
      }
    }
    throw new Error('Price pattern not found');
  } catch (err) {
    console.log(`  ⚠️  ${card.name}: ดึงราคาไม่ได้ (${err.message}) — ใช้ราคาเดิม`);
    return null;
  }
}

// =====================================================
// คำนวณ trend เปรียบเทียบราคาเก่า
// =====================================================
function calcTrend(oldPrice, newPrice) {
  if (!oldPrice || oldPrice === 0) return '0%';
  const pct = ((newPrice - oldPrice) / oldPrice) * 100;
  const rounded = Math.round(pct * 10) / 10;
  return (rounded >= 0 ? '+' : '') + rounded + '%';
}

// =====================================================
// Main
// =====================================================
async function main() {
  console.log('🔍 TCGThailand Price Scraper — ' + new Date().toLocaleString('th-TH'));
  console.log('='.repeat(50));

  // โหลดราคาเก่า (ถ้ามี)
  let oldPrices = [];
  try {
    oldPrices = JSON.parse(readFileSync(PRICES_FILE, 'utf8'));
  } catch { /* ไฟล์ใหม่ */ }

  const oldPriceMap = Object.fromEntries(oldPrices.map(p => [p.id, p.price]));
  const today = new Date().toISOString().slice(0, 10);

  // ดึงราคาทีละใบ (rate-limit friendly)
  const results = [];
  for (const card of CARD_URLS) {
    const newPrice = await scrapePrice(card);
    const finalPrice = newPrice ?? (oldPriceMap[card.id] || 0);
    const trend = newPrice ? calcTrend(oldPriceMap[card.id], newPrice) : (oldPrices.find(p=>p.id===card.id)?.trend || '0%');

    results.push({
      id: card.id,
      name: card.name,
      nameTh: card.nameTh,
      price: finalPrice,
      trend,
      updatedAt: today,
    });

    // หน่วงเวลา 800ms ระหว่างการ request เพื่อไม่ให้โดน rate-limit
    await new Promise(r => setTimeout(r, 800));
  }

  // บันทึก prices.json
  writeFileSync(PRICES_FILE, JSON.stringify(results, null, 2), 'utf8');

  const updated = results.filter(r => r.price > 0).length;
  console.log('='.repeat(50));
  console.log(`✅ บันทึก prices.json แล้ว (${results.length} การ์ด, อัพเดทราคาใหม่ ${updated} ใบ)`);
}

main().catch(err => {
  console.error('❌ Scraper error:', err);
  process.exit(1);
});
