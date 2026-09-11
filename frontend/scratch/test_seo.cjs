const http = require('http');

function checkUrl(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    }).on('error', reject);
  });
}

async function runTests() {
  console.log('--- Testing SEO Endpoints on Backend (http://localhost:4000) ---');

  // 1. Google Verification
  const verifyRes = await checkUrl('http://localhost:4000/google639a710a1902b697.html');
  console.log('1. /google639a710a1902b697.html Status:', verifyRes.status);
  console.log('   Content:', verifyRes.body.trim());

  // 2. Robots.txt
  const robotsRes = await checkUrl('http://localhost:4000/robots.txt');
  console.log('2. /robots.txt Status:', robotsRes.status);
  console.log('   Sitemap directive:', robotsRes.body.includes('https://thedeepcleanerz.in/sitemap.xml'));

  // 3. Sitemap.xml
  const sitemapRes = await checkUrl('http://localhost:4000/sitemap.xml');
  console.log('3. /sitemap.xml Status:', sitemapRes.status, 'Content-Type:', sitemapRes.headers['content-type']);
  console.log('   Contains home page loc:', sitemapRes.body.includes('<loc>https://thedeepcleanerz.in/</loc>'));
  console.log('   Contains service-detail loc:', sitemapRes.body.includes('/service-detail?id='));
  console.log('   Total <url> entries:', (sitemapRes.body.match(/<url>/g) || []).length);

  // 4. Home page SSR/HTML
  const homeRes = await checkUrl('http://localhost:4000/');
  console.log('4. Home Page (/) Status:', homeRes.status);
  console.log('   Contains G-KCXSZYY046 Google Tag:', homeRes.body.includes('G-KCXSZYY046'));
  console.log('   Contains Google Verification:', homeRes.body.includes('google639a710a1902b697'));
  console.log('   Contains JSON-LD Schemas:', homeRes.body.includes('application/ld+json'));
  console.log('   Contains Canonical https://thedeepcleanerz.in/:', homeRes.body.includes('https://thedeepcleanerz.in/'));
  console.log('   Contains Arundelpet, Guntur metadata:', homeRes.body.includes('Arundelpet'));
  console.log('   Title tag match:', homeRes.body.match(/<title>[\s\S]*?<\/title>/i)?.[0]);
}

runTests().catch(console.error);
