const http = require('http');

function postJson(url, data) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const bodyStr = JSON.stringify(data);
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyStr),
      }
    }, (res) => {
      let d = '';
      res.on('data', chunk => d += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: d ? JSON.parse(d) : {} }));
    });
    req.on('error', reject);
    req.write(bodyStr);
    req.end();
  });
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let d = '';
      res.on('data', chunk => d += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: d ? JSON.parse(d) : {} }));
    }).on('error', reject);
  });
}

function deleteJson(url) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname,
      method: 'DELETE',
    }, (res) => {
      let d = '';
      res.on('data', chunk => d += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: d ? JSON.parse(d) : {} }));
    });
    req.on('error', reject);
    req.end();
  });
}

async function runTests() {
  console.log('=== TESTING BLOCKED DATES & PAST DATES RESTRICTION ===');

  const testDate = '2026-09-20';
  const pastDate = '2026-09-01';
  const validFutureDate = '2026-09-25';

  // 1. Block date 2026-09-20
  console.log(`\n1. Blocking date ${testDate} with reason "Ganesh Chaturthi / Festival Holiday"...`);
  const blockRes = await postJson('http://localhost:4000/api/blocked-dates', {
    date: testDate,
    reason: 'Ganesh Chaturthi / Festival Holiday'
  });
  console.log('Status:', blockRes.status, 'Response:', blockRes.body);
  const blockId = blockRes.body?.blockedDate?.id;

  // 2. Fetch list of blocked dates
  console.log('\n2. Fetching blocked dates list...');
  const listRes = await getJson('http://localhost:4000/api/blocked-dates');
  console.log('Status:', listRes.status, 'Count:', listRes.body.length, 'Dates:', listRes.body.map(b => `${b.date} (${b.reason})`));

  // 3. Attempt to book on past date (2026-09-01) -> Expected 400 rejection
  console.log(`\n3. Attempting booking on past date (${pastDate})...`);
  const pastBookingRes = await postJson('http://localhost:4000/api/bookings', {
    customer: { name: 'Test User', phone: '9876543210', email: 'test@example.com', address: 'Arundelpet, Guntur' },
    schedule: { date: pastDate, time: '10:00 AM' },
    total: 1499,
    items: [{ id: '1bhk-furnished', title: '1 BHK Furnished Deep Cleaning', price: 1499 }]
  });
  console.log('Status:', pastBookingRes.status, 'Error:', pastBookingRes.body.error);

  // 4. Attempt to book on blocked date (2026-09-20) -> Expected 400 rejection
  console.log(`\n4. Attempting booking on blocked festival date (${testDate})...`);
  const blockedBookingRes = await postJson('http://localhost:4000/api/bookings', {
    customer: { name: 'Test User', phone: '9876543210', email: 'test@example.com', address: 'Arundelpet, Guntur' },
    schedule: { date: testDate, time: '10:00 AM' },
    total: 1499,
    items: [{ id: '1bhk-furnished', title: '1 BHK Furnished Deep Cleaning', price: 1499 }]
  });
  console.log('Status:', blockedBookingRes.status, 'Error:', blockedBookingRes.body.error);

  // 5. Attempt booking on unblocked valid future date (2026-09-25) -> Expected 200 success
  console.log(`\n5. Attempting booking on valid open future date (${validFutureDate})...`);
  const validBookingRes = await postJson('http://localhost:4000/api/bookings', {
    customer: { name: 'Test User', phone: '9876543210', email: 'test@example.com', address: 'Arundelpet, Guntur' },
    schedule: { date: validFutureDate, time: '10:00 AM' },
    total: 1499,
    items: [{ id: '1bhk-furnished', title: '1 BHK Furnished Deep Cleaning', price: 1499 }]
  });
  console.log('Status:', validBookingRes.status, 'Booking ID:', validBookingRes.body?.booking?.id);

  console.log('\n=== ALL TESTS COMPLETED ===');
}

runTests().catch(console.error);
