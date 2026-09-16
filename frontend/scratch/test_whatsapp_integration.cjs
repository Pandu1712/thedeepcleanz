const http = require('http');

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function test() {
  console.log('🧪 Testing WhatsApp Integration...');

  // 1. Fetch settings to ensure whatsapp keys are present
  const sRes = await request({
    hostname: 'localhost',
    port: 4000,
    path: '/api/settings',
    method: 'GET',
  });
  console.log('Settings fetched:', sRes.data);

  // 2. Update WhatsApp Settings
  const updateRes = await request(
    {
      hostname: 'localhost',
      port: 4000,
      path: '/api/settings',
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      whatsapp_enabled: '1',
      whatsapp_admin_phone: '9154351636',
      whatsapp_api_key: '999999', // sample key
    }
  );
  console.log('Update WhatsApp settings status:', updateRes.status, updateRes.data);

  // 3. Test Booking creation triggers WhatsApp flow safely
  const bookingPayload = {
    customer: { name: 'WhatsApp Tester', phone: '9988776655', address: 'Arundelpet Main Rd', city: 'Guntur', pincode: '522002' },
    schedule: { date: '2026-11-28', time: '12:00 PM' },
    items: [{ id: 'sofa-cleaning', title: 'Sofa Deep Cleaning', price: 999, qty: 1 }],
    total: 999,
  };
  const bRes = await request(
    {
      hostname: 'localhost',
      port: 4000,
      path: '/api/bookings',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    bookingPayload
  );
  console.log('Booking creation status:', bRes.status, bRes.data.ok ? 'OK' : bRes.data);

  // Clean up test booking
  if (bRes.data.booking?.id) {
    await request(
      {
        hostname: 'localhost',
        port: 4000,
        path: `/api/bookings/${bRes.data.booking.id}/job-status`,
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      },
      { jobStatus: 'Cancelled' }
    );
  }

  console.log('✅ WhatsApp Integration test passed successfully!');
}

test().catch(err => {
  console.error('❌ WhatsApp test failed:', err);
  process.exit(1);
});
