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

async function runTests() {
  console.log('🧪 Starting Single-Booking-Per-Slot Test Suite...');
  const testDate = '2026-11-20';
  const testTime1 = '10:00 AM';
  const testTime2 = '02:00 PM';

  // 1. Initial check: booked slots on testDate
  console.log('\n--- TEST 1: Check initial booked slots for test date ---');
  let res = await request({
    hostname: 'localhost',
    port: 4000,
    path: `/api/bookings/booked-slots?date=${testDate}`,
    method: 'GET',
  });
  console.log('GET /api/bookings/booked-slots:', res.status, res.data);
  if (res.status !== 200) throw new Error('Failed to fetch booked slots');

  // 2. Book Slot 1 (10:00 AM)
  console.log('\n--- TEST 2: Book slot (10:00 AM on 2026-11-20) ---');
  const booking1Payload = {
    customer: { name: 'Test User A', phone: '9876543210', address: 'Arundelpet, Guntur' },
    schedule: { date: testDate, time: testTime1 },
    items: [{ id: 'test-item', title: 'Deep Cleaning', price: 999, qty: 1 }],
    total: 999,
  };
  res = await request(
    {
      hostname: 'localhost',
      port: 4000,
      path: '/api/bookings',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    booking1Payload
  );
  console.log('Booking 1 response:', res.status, res.data.ok ? 'Created OK' : res.data);
  if (res.status !== 200 || !res.data.ok) throw new Error('Failed to create initial booking');
  const booking1Id = res.data.booking.id;

  // 3. Verify that GET /api/bookings/booked-slots reflects 10:00 AM
  console.log('\n--- TEST 3: Verify 10:00 AM is in booked slots list ---');
  res = await request({
    hostname: 'localhost',
    port: 4000,
    path: `/api/bookings/booked-slots?date=${testDate}`,
    method: 'GET',
  });
  console.log('Booked slots after Booking 1:', res.data);
  if (!res.data.normalizedSlots.includes('10:00')) {
    throw new Error('Expected 10:00 to be in normalizedSlots list');
  }

  // 4. Try duplicate booking for SAME slot (10:00 AM or 10:00)
  console.log('\n--- TEST 4: Attempt duplicate booking for same slot (10:00 AM) ---');
  const duplicatePayload = {
    customer: { name: 'Test User B (Conflict)', phone: '9123456780', address: 'Brodipet, Guntur' },
    schedule: { date: testDate, time: testTime1 },
    items: [{ id: 'test-item', title: 'Deep Cleaning', price: 999, qty: 1 }],
    total: 999,
  };
  res = await request(
    {
      hostname: 'localhost',
      port: 4000,
      path: '/api/bookings',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    duplicatePayload
  );
  console.log('Duplicate Booking response:', res.status, res.data);
  if (res.status !== 400) {
    throw new Error(`Expected HTTP 400 rejection for duplicate slot, got ${res.status}`);
  }
  console.log('✅ Correctly rejected duplicate booking with error:', res.data.error);

  // 5. Book DIFFERENT slot on same date (02:00 PM) -> Should succeed
  console.log('\n--- TEST 5: Book different slot (02:00 PM) on same date ---');
  const booking2Payload = {
    customer: { name: 'Test User C', phone: '9555555555', address: 'Nallapadu, Guntur' },
    schedule: { date: testDate, time: testTime2 },
    items: [{ id: 'test-item', title: 'Deep Cleaning', price: 999, qty: 1 }],
    total: 999,
  };
  res = await request(
    {
      hostname: 'localhost',
      port: 4000,
      path: '/api/bookings',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    booking2Payload
  );
  console.log('Booking 2 response:', res.status, res.data.ok ? 'Created OK' : res.data);
  if (res.status !== 200 || !res.data.ok) throw new Error('Failed to book different slot');
  const booking2Id = res.data.booking.id;

  // 6. Try to reschedule Booking 2 into occupied slot (10:00 AM) -> Should fail
  console.log('\n--- TEST 6: Reschedule Booking 2 to occupied slot (10:00 AM) ---');
  res = await request(
    {
      hostname: 'localhost',
      port: 4000,
      path: `/api/bookings/${booking2Id}/reschedule`,
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
    },
    { date: testDate, time: testTime1 }
  );
  console.log('Reschedule conflict response:', res.status, res.data);
  if (res.status !== 400) {
    throw new Error(`Expected HTTP 400 for reschedule to occupied slot, got ${res.status}`);
  }
  console.log('✅ Correctly prevented reschedule conflict with error:', res.data.error);

  // 7. Reschedule Booking 2 to an available slot (06:00 PM) -> Should succeed
  console.log('\n--- TEST 7: Reschedule Booking 2 to free slot (06:00 PM) ---');
  res = await request(
    {
      hostname: 'localhost',
      port: 4000,
      path: `/api/bookings/${booking2Id}/reschedule`,
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
    },
    { date: testDate, time: '06:00 PM' }
  );
  console.log('Reschedule free slot response:', res.status, res.data);
  if (res.status !== 200) throw new Error('Failed to reschedule to free slot');

  // 8. Cancel Booking 1 and verify slot 10:00 AM is freed
  console.log('\n--- TEST 8: Cancel Booking 1 and verify slot 10:00 AM is released ---');
  res = await request(
    {
      hostname: 'localhost',
      port: 4000,
      path: `/api/bookings/${booking1Id}/job-status`,
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
    },
    { jobStatus: 'Cancelled' }
  );
  console.log('Cancel Booking 1 response:', res.status, res.data);

  res = await request({
    hostname: 'localhost',
    port: 4000,
    path: `/api/bookings/booked-slots?date=${testDate}`,
    method: 'GET',
  });
  console.log('Booked slots after cancellation:', res.data);
  if (res.data.normalizedSlots.includes('10:00')) {
    throw new Error('Cancelled booking should release the slot from bookedSlots list');
  }

  // Clean up Booking 2
  await request(
    {
      hostname: 'localhost',
      port: 4000,
      path: `/api/bookings/${booking2Id}/job-status`,
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
    },
    { jobStatus: 'Cancelled' }
  );

  console.log('\n🎉 ALL 8 TESTS PASSED SUCCESSFULLY! Exclusive Slot Booking protection is fully functional.');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
