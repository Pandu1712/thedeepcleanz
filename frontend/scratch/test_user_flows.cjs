const http = require('http');

function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const reqOptions = {
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {}
        resolve({ status: res.statusCode, headers: res.headers, body: data, json });
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function testAllUserFlows() {
  console.log('====================================================');
  console.log('🚀 COMPREHENSIVE END-TO-END USER-SIDE FLOW TEST');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(name, condition, details = '') {
    if (condition) {
      console.log(`✅ PASS: ${name} ${details}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${name} ${details}`);
      failed++;
    }
  }

  try {
    // 1. Unified Catalog API (Categories + Services)
    const catalogRes = await request('http://localhost:4000/api/catalog');
    assert(
      '1. Fetch Unified Catalog (/api/catalog)',
      catalogRes.status === 200 && Array.isArray(catalogRes.json?.categories) && Array.isArray(catalogRes.json?.services),
      `(${catalogRes.json?.categories?.length || 0} Categories, ${catalogRes.json?.services?.length || 0} Services)`
    );

    // 2. Customized Services API
    const custRes = await request('http://localhost:4000/api/customized-services');
    assert(
      '2. Fetch Customized Services (/api/customized-services)',
      custRes.status === 200 && Array.isArray(custRes.json),
      `(${custRes.json?.length || 0} Customized Services)`
    );

    // 3. Coupons API & Validation Engine
    const couponRes = await request('http://localhost:4000/api/coupons');
    assert(
      '3. Fetch Active Coupons (/api/coupons)',
      couponRes.status === 200 && Array.isArray(couponRes.json),
      `(${couponRes.json?.length || 0} Active Coupons)`
    );

    const validateRes = await request('http://localhost:4000/api/coupons/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'WELCOME500', total: 2000 })
    });
    assert(
      '4. Validate Coupon WELCOME500 (/api/coupons/validate)',
      validateRes.status === 200 && validateRes.json?.coupon?.discount === 500,
      `(Discount applied: ₹${validateRes.json?.coupon?.discount || 0})`
    );

    // 4. Transformations / Before-After Gallery
    const transRes = await request('http://localhost:4000/api/transformations');
    assert(
      '5. Fetch Transformations Gallery (/api/transformations)',
      transRes.status === 200 && Array.isArray(transRes.json),
      `(${transRes.json?.length || 0} Transformations)`
    );

    // 5. User Registration Flow (/api/auth/register)
    const testEmail = `ramesh_${Date.now()}@gmail.com`;
    const testPhone = `9${Math.floor(100000000 + Math.random() * 900000000)}`;

    const regRes = await request('http://localhost:4000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Ramesh Sharma',
        phone: testPhone,
        email: testEmail,
        password: 'Password123!'
      })
    });
    assert(
      '6. User Registration Flow (/api/auth/register)',
      regRes.status === 200 && regRes.json?.ok === true,
      `(${testEmail})`
    );

    // 6. User Login Flow (/api/auth/login)
    const loginRes = await request('http://localhost:4000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emailOrPhone: testEmail,
        password: 'Password123!'
      })
    });
    assert(
      '7. User Login Flow (/api/auth/login)',
      loginRes.status === 200 && loginRes.json?.ok === true && loginRes.json?.user?.email === testEmail,
      `(User ID: ${loginRes.json?.user?.id})`
    );
    const user = loginRes.json?.user || {};

    // 6b. Mobile OTP Send & Verify Flow
    const otpPhone = `9${Math.floor(100000000 + Math.random() * 900000000)}`;
    const sendOtpRes = await request('http://localhost:4000/api/auth/mobile-otp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: otpPhone, name: 'Sita Verma' })
    });
    const devOtp = sendOtpRes.json?.devOtp;
    assert(
      '7b. Mobile OTP Send Flow (/api/auth/mobile-otp/send)',
      sendOtpRes.status === 200 && sendOtpRes.json?.ok === true && Boolean(devOtp),
      `(Phone: +91 ${otpPhone}, OTP: ${devOtp})`
    );

    const verifyOtpRes = await request('http://localhost:4000/api/auth/mobile-otp/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: otpPhone, otp: devOtp, name: 'Sita Verma' })
    });
    assert(
      '7c. Mobile OTP Verify Flow (/api/auth/mobile-otp/verify)',
      verifyOtpRes.status === 200 && verifyOtpRes.json?.ok === true && verifyOtpRes.json?.user?.phone === otpPhone,
      `(User verified & Profile created: ${verifyOtpRes.json?.user?.name})`
    );

    const profilePhoneRes = await request(`http://localhost:4000/api/auth/profile-by-phone?phone=${otpPhone}`);
    assert(
      '7d. Profile Lookup by Phone (/api/auth/profile-by-phone)',
      profilePhoneRes.status === 200 && profilePhoneRes.json?.user?.name === 'Sita Verma',
      `(Profile retrieved for +91 ${otpPhone})`
    );

    // 7. Booking Creation Flow (/api/bookings)
    const bookingPayload = {
      customer: {
        name: user.name || 'Ramesh Sharma',
        phone: user.phone || testPhone,
        email: user.email || testEmail,
        address: 'Flat 402, Lotus Towers, Arundelpet',
        landmark: 'Opposite Guntur Public School',
        city: 'Guntur',
        pincode: '522002'
      },
      schedule: {
        date: '2026-09-18',
        time: '10:00 AM'
      },
      items: [
        {
          id: '1bhk-furnished',
          title: '1 BHK Furnished Deep Cleaning',
          plan: 'Classic',
          price: 2199,
          quantity: 1
        }
      ],
      notes: 'Please bring steam machine. Valuables will be locked.',
      coupon: 'WELCOME500',
      discount: 500,
      total: 1699,
      userId: user.id || null
    };

    const bookRes = await request('http://localhost:4000/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingPayload)
    });
    assert(
      '8. Create Booking Flow (/api/bookings)',
      bookRes.status === 200 && bookRes.json?.ok === true,
      `(Booking ID: ${bookRes.json?.booking?.id})`
    );
    const booking = bookRes.json?.booking || {};

    // 8. Fetch User's Bookings (/api/bookings)
    const allBookingsRes = await request('http://localhost:4000/api/bookings');
    const userBookings = Array.isArray(allBookingsRes.json)
      ? allBookingsRes.json.filter(b => b.userId === user.id || b.customer?.email === testEmail)
      : [];
    assert(
      '9. Fetch User Order History (/api/bookings filter)',
      allBookingsRes.status === 200 && userBookings.length > 0,
      `(Retrieved ${userBookings.length} active booking)`
    );

    // 9. Reschedule Booking Flow (/api/bookings/:id/reschedule)
    if (booking.id) {
      const reschedRes = await request(`http://localhost:4000/api/bookings/${encodeURIComponent(booking.id)}/reschedule`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: '2026-09-20',
          time: '02:00 PM',
          rescheduledBy: 'Client'
        })
      });
      assert(
        '10. Reschedule Booking Flow (/api/bookings/:id/reschedule)',
        reschedRes.status === 200 && reschedRes.json?.ok === true,
        `(Updated schedule to 2026-09-20 02:00 PM)`
      );
    }

    // 10. Service Review Submission & Retrieval (/api/reviews)
    const reviewRes = await request('http://localhost:4000/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serviceId: '1bhk-furnished',
        userName: 'Ramesh Sharma',
        rating: 5,
        comment: 'Outstanding hospital-grade sanitization. Arundelpet team was on time and very courteous!'
      })
    });
    assert('11. Submit Service Review (/api/reviews)', reviewRes.status === 200 && reviewRes.json?.ok === true);

    const getReviewsRes = await request('http://localhost:4000/api/reviews/1bhk-furnished');
    assert(
      '12. Fetch Service Reviews (/api/reviews/:serviceId)',
      getReviewsRes.status === 200 && Array.isArray(getReviewsRes.json),
      `(${getReviewsRes.json?.length || 0} reviews)`
    );

    // 11. Visitor Location Tracking (/api/locations)
    const locRes = await request('http://localhost:4000/api/locations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id || null,
        latitude: '16.307888',
        longitude: '80.438993'
      })
    });
    assert('13. Visitor Live Location Logging (/api/locations)', locRes.status === 200 && locRes.json?.ok === true);

    // 12. Frontend User Routes Integrity
    const routes = [
      { path: '/', label: 'Home Page' },
      { path: '/services', label: 'All Services Catalog' },
      { path: '/customized', label: 'Customized Package Builder' },
      { path: '/service-detail?id=1bhk-furnished', label: 'Service Detail (1 BHK Furnished)' },
      { path: '/login', label: 'Login & Register Portal' },
      { path: '/my-bookings', label: 'My Bookings & Tracking' }
    ];

    for (let i = 0; i < routes.length; i++) {
      const r = routes[i];
      const rRes = await request(`http://localhost:8080${r.path}`);
      assert(`${14 + i}. Route [${r.label}] (${r.path})`, rRes.status === 200, `Status: ${rRes.status}`);
    }

  } catch (err) {
    console.error('Fatal testing error:', err);
    failed++;
  }

  console.log('\n====================================================');
  console.log(`📊 ALL USER FLOW TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');
}

testAllUserFlows();
