const https = require('https');

https.get('https://thedeepcleanerz.in/sitemap.xml', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Sitemap status:', res.statusCode);
    console.log('Sitemap length:', data.length);
    console.log('Sitemap snippet:\n', data.substring(0, 300));
  });
}).on('error', console.error);

https.get('https://thedeepcleanerz.in/google639a710a1902b697.html', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Verification status:', res.statusCode);
    console.log('Verification content:', data.trim());
  });
}).on('error', console.error);
