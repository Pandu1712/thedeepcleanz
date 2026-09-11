const https = require('https');

https.get('https://thedeepcleanerz.in/', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status code:', res.statusCode);
    const title = data.match(/<title>[\s\S]*?<\/title>/i);
    console.log('Title on live site:', title ? title[0] : 'NO TITLE FOUND');

    const canonical = data.match(/<link[^>]*rel=["']canonical["'][^>]*>/i);
    console.log('Canonical on live site:', canonical ? canonical[0] : 'NO CANONICAL FOUND');

    const metaTags = data.match(/<meta[^>]*>/gi) || [];
    console.log('Total meta tags on live site:', metaTags.length);
    metaTags.slice(0, 10).forEach(m => console.log('  ', m));

    console.log('Contains 404 text:', data.includes('404'));
    console.log('Contains "Page not found":', data.includes('Page not found'));
    console.log('Contains "This page didn":', data.includes("This page didn't load"));
    console.log('Contains "frontend":', data.includes('frontend'));
    console.log('Contains "thedeepcleanerz.com":', data.includes('thedeepcleanerz.com'));
    console.log('Contains "thedeepcleanerz.in":', data.includes('thedeepcleanerz.in'));
    console.log('Contains "google-site-verification":', data.includes('google-site-verification'));
  });
}).on('error', console.error);
