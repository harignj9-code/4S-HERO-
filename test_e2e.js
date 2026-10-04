// End-to-End Automated Verification Test Suite for 4S HERO MMC
const http = require('node:http');

const BASE_URL = 'http://localhost:3000';

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = [];
      res.on('data', chunk => data.push(chunk));
      res.on('end', () => {
        const raw = Buffer.concat(data).toString('utf-8');
        let json = null;
        try { json = JSON.parse(raw); } catch (e) {}
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: raw,
          json
        });
      });
    });
    req.on('error', reject);
    if (body) {
      if (typeof body === 'object') {
        req.setHeader('Content-Type', 'application/json');
        req.write(JSON.stringify(body));
      } else {
        req.write(body);
      }
    }
    req.end();
  });
}

async function runTests() {
  console.log('==================================================');
  console.log('STARTING 4S HERO MMC END-TO-END VALIDATION SUITE');
  console.log('==================================================');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Test Server Root / Static Index
    console.log('\n--- 1. Testing Web Server Static Serving ---');
    const rootRes = await request({ hostname: 'localhost', port: 3000, path: '/', method: 'GET' });
    assert(rootRes.statusCode === 200, 'GET / returned status 200');
    assert(rootRes.body.includes('4S HERO'), 'GET / HTML includes "4S HERO"');
    assert(rootRes.body.includes('Malkajgiri Municipal Corporation'), 'GET / HTML includes "Malkajgiri Municipal Corporation"');

    // 2. Test Admin SPA serving
    console.log('\n--- 2. Testing Admin SPA Serving ---');
    const adminRes = await request({ hostname: 'localhost', port: 3000, path: '/admin', method: 'GET' });
    assert(adminRes.statusCode === 200, 'GET /admin returned status 200');
    assert(adminRes.body.includes('Admin Portal'), 'GET /admin HTML includes "Admin Portal"');

    // 3. Test Bootstrap API
    console.log('\n--- 3. Testing Public Bootstrap API ---');
    const bootRes = await request({ hostname: 'localhost', port: 3000, path: '/api/bootstrap', method: 'GET' });
    assert(bootRes.statusCode === 200, 'GET /api/bootstrap status 200');
    assert(bootRes.json && bootRes.json.streams && bootRes.json.streams.length === 4, 'Bootstrap returns exactly 4 waste streams');
    assert(bootRes.json.settings && bootRes.json.settings.qualifying_score_percent === '80', 'Default qualifying score is 80%');
    assert(bootRes.json.settings.commissioner_name === 'T. Vinay Krishna Reddy, I.A.S.', 'Official Commissioner name matches exactly');

    // 4. Test Dynamic Circle / Ward / Area Hierarchy
    console.log('\n--- 4. Testing Dependent Dropdowns (Circle -> Ward -> Area) ---');
    const circlesRes = await request({ hostname: 'localhost', port: 3000, path: '/api/circles/active', method: 'GET' });
    assert(circlesRes.statusCode === 200, 'GET /api/circles/active status 200');
    assert(circlesRes.json.circles.length > 0, `Returned ${circlesRes.json.circles.length} active circles`);
    const firstCircle = circlesRes.json.circles[0];

    const wardsRes = await request({ hostname: 'localhost', port: 3000, path: `/api/wards/active?circle_id=${firstCircle.id}`, method: 'GET' });
    assert(wardsRes.statusCode === 200, `GET /api/wards/active?circle_id=${firstCircle.id} status 200`);
    assert(wardsRes.json.wards.length > 0, `Returned ${wardsRes.json.wards.length} wards mapped to Circle ${firstCircle.name}`);
    const firstWard = wardsRes.json.wards[0];

    const areasRes = await request({ hostname: 'localhost', port: 3000, path: `/api/areas/active?ward_id=${firstWard.id}`, method: 'GET' });
    assert(areasRes.statusCode === 200, `GET /api/areas/active?ward_id=${firstWard.id} status 200`);
    assert(areasRes.json.areas.length > 0, `Returned ${areasRes.json.areas.length} areas mapped to Ward ${firstWard.name}`);
    const firstArea = areasRes.json.areas[0];

    // 5. Test Game Levels Content
    console.log('\n--- 5. Testing Game Content (All 7 Levels) ---');
    for (let lvl = 1; lvl <= 7; lvl++) {
      const gRes = await request({ hostname: 'localhost', port: 3000, path: `/api/game/items?level=${lvl}`, method: 'GET' });
      assert(gRes.statusCode === 200, `Level ${lvl} API returned status 200`);
      if (lvl === 1 || lvl === 2 || lvl === 3) {
        assert(gRes.json.items && gRes.json.items.length > 0, `Level ${lvl} returned ${gRes.json.items.length} items`);
      } else if (lvl === 4) {
        assert(gRes.json.scenarios && gRes.json.scenarios.length > 0, `Level 4 returned ${gRes.json.scenarios.length} Spot the Mistake scenarios`);
      } else if (lvl === 5) {
        assert(gRes.json.pairs && gRes.json.pairs.length > 0, `Level 5 returned ${gRes.json.pairs.length} Match pairs`);
      } else if (lvl === 6) {
        assert(gRes.json.scenes && gRes.json.scenes.length > 0, `Level 6 returned ${gRes.json.scenes.length} Clean Malkajgiri scenes`);
      } else if (lvl === 7) {
        assert(gRes.json.questions && gRes.json.questions.length > 0, `Level 7 returned ${gRes.json.questions.length} Ultimate Quiz questions`);
      }
    }

    // 6. Test Participant Registration (ALL AGE GROUPS, NO RESTRICTIONS)
    console.log('\n--- 6. Testing Participant Registration & Progress Persistence ---');
    const participantPayload = {
      name: 'Ramesh Goud',
      age: 42,
      age_group: '18-59',
      gender: 'Male',
      category: 'Citizen',
      organisation: 'Safilguda Residents Welfare Association',
      circle_id: firstCircle.id,
      ward_id: firstWard.id,
      area_id: firstArea.id,
      mobile: '9849012345',
      email: 'ramesh.goud@example.com'
    };

    const regRes = await request({ hostname: 'localhost', port: 3000, path: '/api/participants', method: 'POST' }, participantPayload);
    assert(regRes.statusCode === 200, 'POST /api/participants status 200');
    assert(regRes.json && regRes.json.success === true, 'Participant registered successfully');
    const participantId = regRes.json.participantId;
    assert(participantId > 0, `Participant ID generated: ${participantId}`);

    // 7. Test Game Submission with Qualifying Score (90% => 4S HERO)
    console.log('\n--- 7. Testing Game Submission & Dynamic Certificate Generation ---');
    const gameSubmitPayload = {
      participant_id: participantId,
      score: 90,
      max_score: 100,
      correct_count: 9,
      incorrect_count: 1,
      streak_max: 6,
      stars_earned: 3,
      rank_title: '4S HERO',
      level_reached: 7,
      completed: true,
      duration_seconds: 140
    };

    const submitRes = await request({ hostname: 'localhost', port: 3000, path: '/api/game/submit', method: 'POST' }, gameSubmitPayload);
    assert(submitRes.statusCode === 200, 'POST /api/game/submit status 200');
    assert(submitRes.json.isQualified === true, 'Participant scored 90% and qualified for certificate');
    const cert = submitRes.json.certificate;
    assert(cert !== null, 'Certificate object returned');
    assert(cert.certificate_id.startsWith('MMC-4SH-2026-'), `Certificate ID matches format MMC-4SH-2026-xxxxxx: ${cert.certificate_id}`);
    assert(cert.commissioner_name === 'T. Vinay Krishna Reddy, I.A.S.', 'Certificate displays official Commissioner name');
    const generatedCertId = cert.certificate_id;

    // 8. Test Public Certificate Verification API and Route
    console.log('\n--- 8. Testing Public Certificate Verification (/verify/:id) ---');
    const certVerifyRes = await request({ hostname: 'localhost', port: 3000, path: `/api/certificates/${generatedCertId}`, method: 'GET' });
    assert(certVerifyRes.statusCode === 200, `GET /api/certificates/${generatedCertId} status 200`);
    assert(certVerifyRes.json.verified === true, 'Certificate verified against official municipal database');
    assert(certVerifyRes.json.certificate.participant_name === 'Ramesh Goud', 'Verified participant name matches');
    assert(!certVerifyRes.json.certificate.mobile, 'Privacy protection: Mobile number is redacted from public verification');

    const verifyPageRes = await request({ hostname: 'localhost', port: 3000, path: `/verify/${generatedCertId}`, method: 'GET' });
    assert(verifyPageRes.statusCode === 200, `GET /verify/${generatedCertId} page loads status 200`);
    assert(verifyPageRes.body.includes('CERTIFICATE VERIFIED'), 'Verification page contains "CERTIFICATE VERIFIED" header');

    // 9. Test Admin Authentication & Security
    console.log('\n--- 9. Testing Admin Authentication & RBAC ---');
    // Wrong password test
    const wrongAuthRes = await request({ hostname: 'localhost', port: 3000, path: '/api/admin/login', method: 'POST' }, { username: 'admin', password: 'WrongPassword123!' });
    assert(wrongAuthRes.statusCode === 401, 'Invalid password correctly rejected with status 401');

    // Successful Super Admin login
    const loginRes = await request({ hostname: 'localhost', port: 3000, path: '/api/admin/login', method: 'POST' }, { username: 'admin', password: 'MmcAdmin@2026!' });
    assert(loginRes.statusCode === 200, 'Admin login succeeded with status 200');
    assert(loginRes.json.user.role === 'SUPER_ADMIN', 'Logged in as SUPER_ADMIN');
    const adminToken = loginRes.json.token;
    const cookieHeader = loginRes.headers['set-cookie'] ? loginRes.headers['set-cookie'][0] : `mmc_admin_session=${adminToken}`;

    // Admin profile check
    const meRes = await request({ hostname: 'localhost', port: 3000, path: '/api/admin/me', method: 'GET', headers: { Cookie: cookieHeader } });
    assert(meRes.statusCode === 200, 'GET /api/admin/me returned profile');
    assert(meRes.json.user.username === 'admin', 'Profile username matches admin');

    // Admin Dashboard Stats
    const statsRes = await request({ hostname: 'localhost', port: 3000, path: '/api/admin/stats', method: 'GET', headers: { Cookie: cookieHeader } });
    assert(statsRes.statusCode === 200, 'GET /api/admin/stats returned status 200');
    assert(statsRes.json.kpis.totalParticipants >= 1, `KPI Total participants: ${statsRes.json.kpis.totalParticipants}`);
    assert(statsRes.json.kpis.totalCertificates >= 1, `KPI Total certificates: ${statsRes.json.kpis.totalCertificates}`);

    // 10. Test Admin CRUD Operations
    console.log('\n--- 10. Testing Admin CRUD Operations ---');
    // Circle CRUD
    const uniqueCirCode = `TC_${Date.now().toString().slice(-5)}`;
    const addCircleRes = await request({
      hostname: 'localhost', port: 3000, path: '/api/admin/circles', method: 'POST',
      headers: { Cookie: cookieHeader }
    }, {
      code: uniqueCirCode,
      name: 'Test Autonomous Circle',
      name_te: 'టెస్ట్ సర్కిల్',
      display_order: 99,
      is_active: true
    });
    assert(addCircleRes.statusCode === 200, 'Created new Circle via Admin API');
    const testCircleId = addCircleRes.json ? addCircleRes.json.circleId : null;

    // Ward CRUD
    const uniqueWardNum = `W${Date.now().toString().slice(-4)}`;
    const addWardRes = await request({
      hostname: 'localhost', port: 3000, path: '/api/admin/wards', method: 'POST',
      headers: { Cookie: cookieHeader }
    }, {
      circle_id: testCircleId || firstCircle.id,
      ward_number: uniqueWardNum,
      name: 'Test Innovation Ward',
      name_te: 'టెస్ట్ వార్డ్',
      display_order: 99,
      is_active: true
    });
    assert(addWardRes.statusCode === 200, 'Created new Ward mapped to circle via Admin API');
    const testWardId = addWardRes.json ? addWardRes.json.wardId : null;

    // Move Ward to firstCircle
    if (testWardId) {
      const moveWardRes = await request({
        hostname: 'localhost', port: 3000, path: `/api/admin/wards/${testWardId}`, method: 'PUT',
        headers: { Cookie: cookieHeader }
      }, {
        circle_id: firstCircle.id,
        ward_number: uniqueWardNum,
        name: 'Test Innovation Ward Moved',
        name_te: 'టెస్ట్ వార్డ్',
        display_order: 99,
        is_active: true
      });
      assert(moveWardRes.statusCode === 200, 'Moved Ward between Circles via Admin API');
    }

    // Waste Item CRUD
    const addWasteRes = await request({
      hostname: 'localhost', port: 3000, path: '/api/admin/waste-items', method: 'POST',
      headers: { Cookie: cookieHeader }
    }, {
      stream_id: 1,
      name: 'Watermelon Rind & Seeds',
      name_te: 'పుచ్చకాయ తొక్కలు',
      category: 'Kitchen Organics',
      image_icon: 'fa-apple-whole',
      explanation: 'Watermelon rinds decompose rapidly into nutrient-rich organic compost.',
      explanation_te: 'పుచ్చకాయ తొక్కలు త్వరగా కంపోస్ట్‌గా మారతాయి.',
      difficulty: 'Easy',
      is_active: true
    });
    assert(addWasteRes.statusCode === 200, 'Created new Waste Master item via Admin API');

    // CSV Reports Export
    const csvPartRes = await request({
      hostname: 'localhost', port: 3000, path: '/api/admin/reports/export?type=participants', method: 'GET',
      headers: { Cookie: cookieHeader }
    });
    assert(csvPartRes.statusCode === 200, 'GET participants CSV export returned status 200');
    assert(csvPartRes.body.includes('Ramesh Goud'), 'CSV export includes registered participant');

    // Audit Log Check
    const auditRes = await request({
      hostname: 'localhost', port: 3000, path: '/api/admin/audit-logs', method: 'GET',
      headers: { Cookie: cookieHeader }
    });
    assert(auditRes.statusCode === 200, 'GET /api/admin/audit-logs returned status 200');
    assert(auditRes.json.logs.length > 0, `Recorded ${auditRes.json.logs.length} security audit events`);

    console.log('\n==================================================');
    console.log(`TEST SUITE FINISHED: ${passed} PASSED, ${failed} FAILED`);
    console.log('==================================================');
  } catch (err) {
    console.error('Test Suite encountered unhandled error:', err);
  }
}

// If run directly
if (require.main === module) {
  runTests();
}

module.exports = { runTests };
