const { db } = require('./db');
const { hashPassword, verifyPassword, createSession, validateSession, deleteSession, logAudit, MAX_FAILED_ATTEMPTS, LOCKOUT_MINUTES } = require('./auth');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

// Helper to generate next unique Certificate ID: MMC-4SH-2026-000001
function generateNextCertificateId() {
  const year = new Date().getFullYear();
  const prefix = `MMC-4SH-${year}-`;
  
  // Find highest existing certificate number for this year
  const row = db.prepare(`
    SELECT certificate_id FROM certificates 
    WHERE certificate_id LIKE ? 
    ORDER BY id DESC LIMIT 1
  `).get(`${prefix}%`);

  let nextNum = 1;
  if (row && row.certificate_id) {
    const parts = row.certificate_id.split('-');
    const lastNum = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastNum)) {
      nextNum = lastNum + 1;
    }
  }

  const padded = String(nextNum).padStart(6, '0');
  return `${prefix}${padded}`;
}

// Check RBAC Permissions
const ROLE_PERMISSIONS = {
  SUPER_ADMIN: ['*'],
  CONTENT_ADMIN: ['content', 'waste', 'questions', 'logos'],
  CERTIFICATE_ADMIN: ['certificates', 'participants', 'reports'],
  REPORT_VIEWER: ['reports', 'analytics', 'participants_read'],
  CIRCLE_WARD_USER: ['jurisdiction_view', 'participants_jurisdiction']
};

function hasPermission(user, requiredPerm) {
  if (!user) return false;
  if (user.role === 'SUPER_ADMIN') return true;
  const perms = ROLE_PERMISSIONS[user.role] || [];
  return perms.includes('*') || perms.includes(requiredPerm);
}

// Register API Handlers
function handleApiRequest(req, res, url, body, cookies) {
  const method = req.method;
  const pathname = url.pathname;
  const searchParams = url.searchParams;

  // Extract Session / Auth
  const token = cookies['mmc_admin_session'] || (req.headers['authorization'] || '').replace('Bearer ', '');
  const currentUser = validateSession(token);

  // Helper response functions
  const json = (data, status = 200) => {
    res.writeHead(status, {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store'
    });
    res.end(JSON.stringify(data));
  };

  const error = (message, status = 400, details = null) => {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: message, details, success: false }));
  };

  // -------------------------------------------------------------
  // PUBLIC ENDPOINTS
  // -------------------------------------------------------------

  // 1. App Bootstrap (General settings, active logos, contact info, streams)
  if (pathname === '/api/bootstrap' && method === 'GET') {
    const settingsRows = db.prepare('SELECT setting_key, setting_value FROM website_settings').all();
    const settings = {};
    settingsRows.forEach(r => { settings[r.setting_key] = r.setting_value; });

    const contactRows = db.prepare('SELECT * FROM contact_settings WHERE is_active = 1 ORDER BY display_order ASC').all();
    const logosRows = db.prepare('SELECT * FROM brand_logos WHERE is_active = 1 ORDER BY display_order ASC').all();
    const streamsRows = db.prepare('SELECT * FROM waste_streams ORDER BY id ASC').all();

    return json({
      settings,
      contacts: contactRows,
      logos: logosRows,
      streams: streamsRows
    });
  }

  // 2. Dynamic Circles (Active only)
  if (pathname === '/api/circles/active' && method === 'GET') {
    const circles = db.prepare('SELECT id, code, name, name_te FROM circles WHERE is_active = 1 ORDER BY display_order ASC, name ASC').all();
    return json({ circles });
  }

  // 3. Dynamic Wards (Active only, filtered by circle_id)
  if (pathname === '/api/wards/active' && method === 'GET') {
    const circleId = searchParams.get('circle_id');
    if (!circleId) return error('circle_id is required');
    const wards = db.prepare('SELECT id, circle_id, ward_number, name, name_te FROM wards WHERE circle_id = ? AND is_active = 1 ORDER BY display_order ASC, ward_number ASC').all(circleId);
    return json({ wards });
  }

  // 4. Dynamic Areas (Active only, filtered by ward_id)
  if (pathname === '/api/areas/active' && method === 'GET') {
    const wardId = searchParams.get('ward_id');
    if (!wardId) return error('ward_id is required');
    const areas = db.prepare('SELECT id, ward_id, name, name_te, pincode FROM areas WHERE ward_id = ? AND is_active = 1 ORDER BY name ASC').all(wardId);
    return json({ areas });
  }

  // 5. Waste Streams & Master Items
  if (pathname === '/api/waste-streams' && method === 'GET') {
    const streams = db.prepare('SELECT * FROM waste_streams ORDER BY id ASC').all();
    return json({ streams });
  }

  if (pathname === '/api/waste-items' && method === 'GET') {
    const streamId = searchParams.get('stream_id');
    let items;
    if (streamId) {
      items = db.prepare('SELECT i.*, s.name as stream_name, s.color as stream_color, s.bin_color FROM waste_items i JOIN waste_streams s ON i.stream_id = s.id WHERE i.is_active = 1 AND i.stream_id = ? ORDER BY i.name ASC').all(streamId);
    } else {
      items = db.prepare('SELECT i.*, s.name as stream_name, s.color as stream_color, s.bin_color FROM waste_items i JOIN waste_streams s ON i.stream_id = s.id WHERE i.is_active = 1 ORDER BY i.stream_id ASC, i.name ASC').all();
    }
    return json({ items });
  }

  // 6. Game Content Generator per Level
  if (pathname === '/api/game/items' && method === 'GET') {
    const level = parseInt(searchParams.get('level') || '1', 10);
    
    // Level 1: Which Bin? (Return all active waste items with 4 stream options)
    if (level === 1) {
      const items = db.prepare(`
        SELECT i.id, i.name, i.name_te, i.category, i.image_icon, i.explanation, i.explanation_te, i.stream_id,
               s.code as stream_code, s.name as stream_name, s.bin_color, s.color as stream_color
        FROM waste_items i
        JOIN waste_streams s ON i.stream_id = s.id
        WHERE i.is_active = 1
        ORDER BY RANDOM() LIMIT 15
      `).all();
      return json({ level: 1, items });
    }

    // Level 2: Drag & Drop (Return sets of items across all 4 streams)
    if (level === 2) {
      const items = db.prepare(`
        SELECT i.id, i.name, i.name_te, i.category, i.image_icon, i.explanation, i.explanation_te, i.stream_id,
               s.code as stream_code, s.name as stream_name, s.bin_color, s.color as stream_color
        FROM waste_items i
        JOIN waste_streams s ON i.stream_id = s.id
        WHERE i.is_active = 1
        ORDER BY RANDOM() LIMIT 12
      `).all();
      const streams = db.prepare('SELECT id, code, name, name_te, bin_color, color FROM waste_streams ORDER BY id ASC').all();
      return json({ level: 2, items, streams });
    }

    // Level 3: Rapid Fire (10 timed questions)
    if (level === 3) {
      const items = db.prepare(`
        SELECT i.id, i.name, i.name_te, i.category, i.image_icon, i.explanation, i.explanation_te, i.stream_id,
               s.code as stream_code, s.name as stream_name, s.bin_color, s.color as stream_color
        FROM waste_items i
        JOIN waste_streams s ON i.stream_id = s.id
        WHERE i.is_active = 1
        ORDER BY RANDOM() LIMIT 10
      `).all();
      return json({ level: 3, items, timePerItemSeconds: 10 });
    }

    // Level 4: Spot the Mistake (Realistic scenarios where 1 item is placed wrongly)
    if (level === 4) {
      const scenarios = [
        {
          id: 1,
          title: 'Morning Kitchen Bin Inspection',
          title_te: 'ఉదయం వంటగది డబ్బా తనిఖీ',
          bin: { name: 'Green Bin (Wet Waste)', name_te: 'ఆకుపచ్చ డబ్బా (తడి చెత్త)', color: '#16a34a', code: 'WET' },
          items: [
            { name: 'Apple Core & Peels', name_te: 'ఆపిల్ తొక్కలు', correct_code: 'WET', icon: 'fa-apple-whole' },
            { name: 'Cooked Rice Leftover', name_te: 'మిగిలిన అన్నం', correct_code: 'WET', icon: 'fa-bowl-rice' },
            { name: 'Used AA TV Remote Battery', name_te: 'వాడిన రిమోట్ బ్యాటరీ', correct_code: 'SPECIAL', is_mistake: true, icon: 'fa-car-battery', target_bin: 'Black Bin (Special Care Waste)', reason: 'Batteries contain hazardous lead and acid which poison organic compost!' },
            { name: 'Pooja Garland Marigolds', name_te: 'పూజా పూల దండలు', correct_code: 'WET', icon: 'fa-leaf' }
          ]
        },
        {
          id: 2,
          title: 'Office Dry Recyclables Collection',
          title_te: 'కార్యాలయ పొడి చెత్త సేకరణ',
          bin: { name: 'Blue Bin (Dry Waste)', name_te: 'నీలి రంగు డబ్బా (పొడి చెత్త)', color: '#2563eb', code: 'DRY' },
          items: [
            { name: 'Newspaper Bundle', name_te: 'వార్తాపత్రికల కట్ట', correct_code: 'DRY', icon: 'fa-newspaper' },
            { name: 'Cardboard Box', name_te: 'కార్డ్‌బోర్డు పెట్టె', correct_code: 'DRY', icon: 'fa-box' },
            { name: 'Soiled Baby Diaper', name_te: 'వాడిన బేబీ డైపర్', correct_code: 'SANITARY', is_mistake: true, icon: 'fa-baby', target_bin: 'Red Bin (Sanitary Waste)', reason: 'Soiled diapers contain infectious pathogens that contaminate clean paper recycling!' },
            { name: 'Crushed Sprite Can', name_te: 'అల్యూమినియం క్యాన్', correct_code: 'DRY', icon: 'fa-wine-bottle' }
          ]
        },
        {
          id: 3,
          title: 'Health Clinic Restroom Disposal',
          title_te: 'క్లినిక్ వాష్‌రూమ్ వ్యర్థాల తనిఖీ',
          bin: { name: 'Red Bin (Sanitary Waste)', name_te: 'ఎరుపు డబ్బా (శానిటరీ వ్యర్థాలు)', color: '#dc2626', code: 'SANITARY' },
          items: [
            { name: 'Used Sanitary Napkin', name_te: 'వాడిన శానిటరీ ప్యాడ్', correct_code: 'SANITARY', icon: 'fa-shield-halved' },
            { name: 'Clean Amazon Delivery Box', name_te: 'శుభ్రమైన అట్టపెట్టె', correct_code: 'DRY', is_mistake: true, icon: 'fa-boxes-packing', target_bin: 'Blue Bin (Dry Waste)', reason: 'Clean cardboard is recyclable dry waste and must not be incinerated with bio-sanitary waste!' },
            { name: 'Used Wound Bandage', name_te: 'వాడిన బ్యాండేజీ', correct_code: 'SANITARY', icon: 'fa-bandage' },
            { name: 'Ear Cotton Swab', name_te: 'ఇయర్ బడ్స్', correct_code: 'SANITARY', icon: 'fa-prescription-bottle' }
          ]
        },
        {
          id: 4,
          title: 'Hazardous Waste Sorting Point',
          title_te: 'ప్రమాదకర వ్యర్థాల కేంద్రం',
          bin: { name: 'Black Bin (Special Care)', name_te: 'నల్ల డబ్బా (స్పెషల్ కేర్)', color: '#1f2937', code: 'SPECIAL' },
          items: [
            { name: 'Fused Tube Light', name_te: 'పాడైన ట్యూబ్‌లైట్', correct_code: 'SPECIAL', icon: 'fa-lightbulb' },
            { name: 'Expired Cough Syrup Bottle', name_te: 'గడువుతీరిన మందు సీసా', correct_code: 'SPECIAL', icon: 'fa-pills' },
            { name: 'Broken Mirror Shards', name_te: 'పగిలిన అద్దం ముక్కలు', correct_code: 'SPECIAL', icon: 'fa-burst' },
            { name: 'Banana Peel', name_te: 'అరటిపండు తొక్క', correct_code: 'WET', is_mistake: true, icon: 'fa-carrot', target_bin: 'Green Bin (Wet Waste)', reason: 'Fruit peels are harmless organic matter and belong in the Green composting bin!' }
          ]
        }
      ];
      return json({ level: 4, scenarios });
    }

    // Level 5: Match the Waste (Memory matching pairs)
    if (level === 5) {
      const streams = db.prepare('SELECT id, code, name, name_te, bin_color, color FROM waste_streams ORDER BY id ASC').all();
      const pairs = [
        { item: 'Wet Vegetable Peels', item_te: 'కూరగాయల తొక్కలు', stream: 'WET', bin: 'Green Bin (Wet)', color: '#16a34a' },
        { item: 'Plastic Water Bottle', item_te: 'ప్లాస్టిక్ బాటిల్', stream: 'DRY', bin: 'Blue Bin (Dry)', color: '#2563eb' },
        { item: 'Soiled Sanitary Pad', item_te: 'శానిటరీ ప్యాడ్', stream: 'SANITARY', bin: 'Red Bin (Sanitary)', color: '#dc2626' },
        { item: 'Old AA Battery', item_te: 'పాత బ్యాటరీ', stream: 'SPECIAL', bin: 'Black Bin (Special Care)', color: '#1f2937' },
        { item: 'Egg Shells', item_te: 'గుడ్డు పెంకులు', stream: 'WET', bin: 'Green Bin (Wet)', color: '#16a34a' },
        { item: 'Cardboard Box', item_te: 'కార్డ్‌బోర్డు బాక్స్', stream: 'DRY', bin: 'Blue Bin (Dry)', color: '#2563eb' }
      ];
      return json({ level: 5, pairs, streams });
    }

    // Level 6: Clean Malkajgiri (Neighborhood Street Cleaning)
    if (level === 6) {
      const scenes = [
        {
          id: 's1',
          name: 'Safilguda Mini Tank Bund Park',
          name_te: 'సఫీల్‌గూడ మినీ ట్యాంక్ బండ్ పార్క్',
          litter: [
            { id: 'lit-1', name: 'Plastic Soda Bottle', name_te: 'ప్లాస్టిక్ సోడా బాటిల్', correct_stream: 'DRY', x: 22, y: 72, icon: 'fa-bottle-water' },
            { id: 'lit-2', name: 'Discarded Samosa & Chutney', name_te: 'మిగిలిన సమోసా & చట్నీ', correct_stream: 'WET', x: 45, y: 78, icon: 'fa-bowl-food' },
            { id: 'lit-3', name: 'Broken Glass Cold Drink Bottle', name_te: 'పగిలిన గాజు సీసా', correct_stream: 'SPECIAL', x: 68, y: 70, icon: 'fa-burst' },
            { id: 'lit-4', name: 'Used Hand Sanitizer Wipe', name_te: 'వాడిన శానిటైజర్ వైప్', correct_stream: 'SANITARY', x: 82, y: 75, icon: 'fa-toilet-paper' }
          ]
        },
        {
          id: 's2',
          name: 'Anandbagh Main Commercial Circle',
          name_te: 'ఆనంద్‌బాగ్ మెయిన్ సర్కిల్',
          litter: [
            { id: 'lit-5', name: 'Sweet Shop Cardboard Box', name_te: 'స్వీట్ షాప్ కార్డ్‌బోర్డు డబ్బా', correct_stream: 'DRY', x: 18, y: 68, icon: 'fa-boxes-packing' },
            { id: 'lit-6', name: 'Sugarcane Bagasse & Peels', name_te: 'చెరకు పిప్పి & తొక్కలు', correct_stream: 'WET', x: 38, y: 75, icon: 'fa-leaf' },
            { id: 'lit-7', name: 'Discarded Mobile Charger Cable', name_te: 'పాడైన ఛార్జర్ కేబుల్', correct_stream: 'SPECIAL', x: 62, y: 72, icon: 'fa-plug' },
            { id: 'lit-8', name: 'Baby Wet Diaper in Paper', name_te: 'వాడిన బేబీ డైపర్', correct_stream: 'SANITARY', x: 80, y: 76, icon: 'fa-baby' }
          ]
        }
      ];
      return json({ level: 6, scenes });
    }

    // Final Level: Ultimate 4S HERO Quiz (10 mixed questions)
    if (level === 7) {
      const questions = db.prepare(`
        SELECT id, question_text, question_text_te, options_json, correct_answer, explanation, explanation_te, difficulty
        FROM questions
        WHERE is_active = 1
        ORDER BY RANDOM() LIMIT 10
      `).all().map(q => ({
        ...q,
        options: JSON.parse(q.options_json)
      }));
      return json({ level: 7, questions });
    }

    return error('Invalid level');
  }

  // 7. Participant Registration (ALL AGE GROUPS, NO AGE RESTRICTION)
  if (pathname === '/api/participants' && method === 'POST') {
    const { name, age, age_group, gender, category, organisation, circle_id, ward_id, area_id, mobile, email } = body || {};

    if (!name || !name.trim()) return error('Participant Name is required');
    if (!gender) return error('Gender is required');
    if (!category) return error('Participant Category is required');
    if (!circle_id) return error('Circle is required');
    if (!ward_id) return error('Ward is required');

    // Validate circle exists in DB
    const circle = db.prepare('SELECT id, name FROM circles WHERE id = ? AND is_active = 1').get(circle_id);
    if (!circle) return error('Selected Circle does not exist or is inactive');

    // Validate ward belongs to circle
    const ward = db.prepare('SELECT id, name FROM wards WHERE id = ? AND circle_id = ? AND is_active = 1').get(ward_id, circle_id);
    if (!ward) return error('Selected Ward does not belong to the selected Circle or is inactive');

    // Validate area if provided
    let areaRecord = null;
    if (area_id) {
      areaRecord = db.prepare('SELECT id, name FROM areas WHERE id = ? AND ward_id = ? AND is_active = 1').get(area_id, ward_id);
    }

    // IP address
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

    const insert = db.prepare(`
      INSERT INTO participants (name, age, age_group, gender, category, organisation, circle_id, ward_id, area_id, mobile, email, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insert.run(
      name.trim(),
      age ? parseInt(age, 10) : null,
      age_group || (age ? (age < 18 ? 'Below 18' : age < 60 ? '18-59' : '60+') : 'Not specified'),
      gender,
      category,
      organisation ? organisation.trim() : null,
      circle_id,
      ward_id,
      areaRecord ? areaRecord.id : null,
      mobile ? mobile.trim() : null,
      email ? email.trim() : null,
      ip
    );

    const participantId = Number(result.lastInsertRowid);
    const participant = db.prepare(`
      SELECT p.*, c.name as circle_name, w.name as ward_name, w.ward_number, a.name as area_name
      FROM participants p
      JOIN circles c ON p.circle_id = c.id
      JOIN wards w ON p.ward_id = w.id
      LEFT JOIN areas a ON p.area_id = a.id
      WHERE p.id = ?
    `).get(participantId);

    return json({ success: true, participantId, participant });
  }

  // 8. Submit Game Result & Generate Certificate
  if (pathname === '/api/game/submit' && method === 'POST') {
    const { participant_id, score, max_score, correct_count, incorrect_count, streak_max, stars_earned, rank_title, level_reached, completed, duration_seconds, answers } = body || {};

    if (!participant_id) return error('participant_id is required');

    const participant = db.prepare('SELECT * FROM participants WHERE id = ?').get(participant_id);
    if (!participant) return error('Participant not found');

    const finalScore = parseInt(score || 0, 10);
    const finalMax = parseInt(max_score || 100, 10);
    const percentage = finalMax > 0 ? parseFloat(((finalScore / finalMax) * 100).toFixed(1)) : 0;

    // Determine Rank
    let rank = rank_title;
    if (!rank) {
      if (percentage >= 80) rank = '4S HERO';
      else if (percentage >= 70) rank = '4S CHAMPION';
      else if (percentage >= 50) rank = 'SEGREGATION STAR';
      else rank = '4S LEARNER';
    }

    // Insert Game Attempt
    const insertAttempt = db.prepare(`
      INSERT INTO game_attempts (participant_id, score, max_score, percentage, correct_count, incorrect_count, streak_max, stars_earned, rank_title, level_reached, completed, duration_seconds, answers_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const attemptResult = insertAttempt.run(
      participant_id,
      finalScore,
      finalMax,
      percentage,
      parseInt(correct_count || 0, 10),
      parseInt(incorrect_count || 0, 10),
      parseInt(streak_max || 0, 10),
      parseInt(stars_earned || 0, 10),
      rank,
      parseInt(level_reached || 7, 10),
      completed ? 1 : 1,
      parseInt(duration_seconds || 0, 10),
      answers ? JSON.stringify(answers) : null
    );

    const attemptId = Number(attemptResult.lastInsertRowid);

    // Get Qualifying Score % from Admin settings (default 80%)
    const qualSetting = db.prepare("SELECT setting_value FROM website_settings WHERE setting_key = 'qualifying_score_percent'").get();
    const qualifyingThreshold = qualSetting ? parseFloat(qualSetting.setting_value) : 80.0;
    const isQualified = percentage >= qualifyingThreshold;

    let certificate = null;

    if (isQualified) {
      // Generate Unique Certificate ID
      const certId = generateNextCertificateId();
      const host = req.headers['host'] || 'localhost:3000';
      const protocol = req.headers['x-forwarded-proto'] || 'http';
      const verifyUrl = `${protocol}://${host}/verify/${certId}`;

      const commNameRow = db.prepare("SELECT setting_value FROM website_settings WHERE setting_key = 'commissioner_name'").get();
      const commTitleRow = db.prepare("SELECT setting_value FROM website_settings WHERE setting_key = 'commissioner_title'").get();
      const sigRow = db.prepare("SELECT setting_value FROM website_settings WHERE setting_key = 'signature_asset'").get();

      const commName = commNameRow ? commNameRow.setting_value : 'T. Vinay Krishna Reddy, I.A.S.';
      const commTitle = commTitleRow ? commTitleRow.setting_value : 'Commissioner, Malkajgiri Municipal Corporation';
      const sigAsset = sigRow ? sigRow.setting_value : '';

      const insertCert = db.prepare(`
        INSERT INTO certificates (certificate_id, participant_id, attempt_id, score, percentage, commissioner_name, commissioner_title, qr_code_data, signature_path, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active')
      `);

      insertCert.run(
        certId,
        participant_id,
        attemptId,
        finalScore,
        percentage,
        commName,
        commTitle,
        verifyUrl,
        sigAsset
      );

      certificate = {
        certificate_id: certId,
        verify_url: verifyUrl,
        score: finalScore,
        percentage,
        issue_date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        commissioner_name: commName,
        commissioner_title: commTitle,
        signature_path: sigAsset
      };
    }

    return json({
      success: true,
      attemptId,
      score: finalScore,
      percentage,
      rank,
      isQualified,
      qualifyingThreshold,
      certificate
    });
  }

  // 9. QR Certificate Verification API: /api/certificates/:certId
  if (pathname.startsWith('/api/certificates/') && method === 'GET') {
    const certId = pathname.replace('/api/certificates/', '').trim();
    const cert = db.prepare(`
      SELECT c.certificate_id, c.score, c.percentage, c.issue_date, c.commissioner_name, c.commissioner_title, c.status,
             p.name as participant_name, p.organisation, p.category,
             ci.name as circle_name, w.name as ward_name, w.ward_number
      FROM certificates c
      JOIN participants p ON c.participant_id = p.id
      JOIN circles ci ON p.circle_id = ci.id
      JOIN wards w ON p.ward_id = w.id
      WHERE c.certificate_id = ?
    `).get(certId);

    if (!cert) {
      return json({ verified: false, message: 'Certificate not found or invalid' }, 404);
    }

    if (cert.status !== 'Active') {
      return json({ verified: false, message: 'This certificate has been revoked by administration', status: cert.status }, 403);
    }

    // Notice: mobile and email are deliberately NOT exposed in public verification for participant privacy!
    return json({
      verified: true,
      certificate: {
        certificate_id: cert.certificate_id,
        participant_name: cert.participant_name,
        organisation: cert.organisation || 'Citizen',
        category: cert.category,
        score: cert.score,
        percentage: cert.percentage,
        issue_date: cert.issue_date,
        commissioner_name: cert.commissioner_name,
        commissioner_title: cert.commissioner_title,
        circle_name: cert.circle_name,
        ward_name: cert.ward_name,
        campaign: '4S HERO – 4 Stream Source Segregation Challenge',
        issuing_authority: 'Malkajgiri Municipal Corporation (MMC), Government of Telangana'
      }
    });
  }

  // 10. Public Leaderboard API
  if (pathname === '/api/leaderboard' && method === 'GET') {
    // Top 4S Heroes (Privacy-conscious masking: e.g. "Ramesh K." or "Deepa S.")
    const topHeroesRaw = db.prepare(`
      SELECT p.name, p.category, p.organisation, a.score, a.percentage, a.rank_title, a.stars_earned, a.created_at,
             w.name as ward_name, c.name as circle_name
      FROM game_attempts a
      JOIN participants p ON a.participant_id = p.id
      JOIN circles c ON p.circle_id = c.id
      JOIN wards w ON p.ward_id = w.id
      ORDER BY a.score DESC, a.created_at ASC
      LIMIT 15
    `).all();

    const topHeroes = topHeroesRaw.map(h => {
      // Privacy-conscious display name
      const parts = h.name.trim().split(/\s+/);
      const maskedName = parts.length > 1 ? `${parts[0]} ${parts[1][0]}.` : parts[0];
      return {
        display_name: maskedName,
        category: h.category,
        organisation: h.organisation || 'Citizen',
        score: h.score,
        percentage: h.percentage,
        rank_title: h.rank_title,
        stars_earned: h.stars_earned,
        ward_name: h.ward_name,
        circle_name: h.circle_name
      };
    });

    // Top Schools / Colleges / Organisations
    const topOrgs = db.prepare(`
      SELECT p.organisation, COUNT(DISTINCT p.id) as participant_count, AVG(a.score) as avg_score, MAX(a.score) as max_score
      FROM participants p
      JOIN game_attempts a ON p.id = a.participant_id
      WHERE p.organisation IS NOT NULL AND TRIM(p.organisation) != ''
      GROUP BY p.organisation
      ORDER BY participant_count DESC, avg_score DESC
      LIMIT 10
    `).all();

    // Top Circles
    const topCircles = db.prepare(`
      SELECT c.name as circle_name, COUNT(DISTINCT p.id) as total_participants, AVG(a.score) as avg_score,
             SUM(CASE WHEN c_cert.id IS NOT NULL THEN 1 ELSE 0 END) as certificates_earned
      FROM circles c
      JOIN participants p ON c.id = p.circle_id
      LEFT JOIN game_attempts a ON p.id = a.participant_id
      LEFT JOIN certificates c_cert ON p.id = c_cert.participant_id
      GROUP BY c.id
      ORDER BY total_participants DESC
    `).all();

    // Top Wards
    const topWards = db.prepare(`
      SELECT w.ward_number, w.name as ward_name, c.name as circle_name, COUNT(DISTINCT p.id) as total_participants, AVG(a.score) as avg_score
      FROM wards w
      JOIN circles c ON w.circle_id = c.id
      JOIN participants p ON w.id = p.ward_id
      LEFT JOIN game_attempts a ON p.id = a.participant_id
      GROUP BY w.id
      ORDER BY total_participants DESC
      LIMIT 10
    `).all();

    return json({ topHeroes, topOrgs, topCircles, topWards });
  }

  // 11. Public Contact Details API
  if (pathname === '/api/contact' && method === 'GET') {
    const contacts = db.prepare('SELECT setting_key, label, label_te, value, value_te, icon, category FROM contact_settings WHERE is_active = 1 ORDER BY display_order ASC').all();
    return json({ contacts });
  }

  // -------------------------------------------------------------
  // ADMIN AUTHENTICATION
  // -------------------------------------------------------------

  // First-run Status Check
  if (pathname === '/api/admin/first-run-status' && method === 'GET') {
    const count = db.prepare('SELECT COUNT(*) as cnt FROM admin_users').get().cnt;
    return json({ needsFirstRun: count === 0 });
  }

  // First-run Initial Setup (Create Super Admin if none exists)
  if (pathname === '/api/admin/first-run' && method === 'POST') {
    const count = db.prepare('SELECT COUNT(*) as cnt FROM admin_users').get().cnt;
    if (count > 0) {
      return error('First-run setup has already been completed.');
    }

    const { username, password, full_name, email } = body || {};
    if (!username || !password || !full_name) {
      return error('Username, full name, and password are required');
    }
    if (password.length < 8) {
      return error('Password must be at least 8 characters long');
    }

    const { hash, salt } = hashPassword(password);
    const insert = db.prepare(`
      INSERT INTO admin_users (username, password_hash, salt, full_name, email, role, is_active)
      VALUES (?, ?, ?, ?, ?, 'SUPER_ADMIN', 1)
    `);
    const resAdmin = insert.run(username.trim().toLowerCase(), hash, salt, full_name.trim(), email ? email.trim() : null);

    const adminId = Number(resAdmin.lastInsertRowid);
    const session = createSession(adminId);
    logAudit(adminId, username, 'FIRST_RUN_SUPER_ADMIN_CREATED', 'admin_users', adminId, { username, role: 'SUPER_ADMIN' }, req.socket.remoteAddress);

    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Set-Cookie': `mmc_admin_session=${session.token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`
    });
    return res.end(JSON.stringify({
      success: true,
      message: 'Super Admin created successfully',
      user: { id: adminId, username, full_name, role: 'SUPER_ADMIN' },
      token: session.token
    }));
  }

  // Admin Login
  if (pathname === '/api/admin/login' && method === 'POST') {
    const { username, password } = body || {};
    if (!username || !password) return error('Username and password are required');

    const cleanUsername = username.trim().toLowerCase();
    const user = db.prepare('SELECT * FROM admin_users WHERE username = ?').get(cleanUsername);

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

    if (!user) {
      logAudit(null, cleanUsername, 'LOGIN_FAILED_UNKNOWN_USER', 'admin_users', null, { ip }, ip);
      return error('Invalid credentials', 401);
    }

    // Check account active
    if (!user.is_active) {
      return error('Your account is deactivated. Please contact Super Admin.', 403);
    }

    // Check lockout
    if (user.lockout_until) {
      const lockUntil = new Date(user.lockout_until);
      if (lockUntil > new Date()) {
        const remainingMinutes = Math.ceil((lockUntil - new Date()) / 60000);
        return error(`Account locked due to multiple failed attempts. Please retry in ${remainingMinutes} minutes.`, 429);
      }
    }

    // Verify Password
    const isValid = verifyPassword(password, user.password_hash, user.salt);

    if (!isValid) {
      const failedCount = (user.failed_logins || 0) + 1;
      let lockoutDate = null;
      if (failedCount >= MAX_FAILED_ATTEMPTS) {
        lockoutDate = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000).toISOString();
      }

      db.prepare(`
        UPDATE admin_users SET failed_logins = ?, lockout_until = ? WHERE id = ?
      `).run(failedCount, lockoutDate, user.id);

      logAudit(user.id, user.username, 'LOGIN_FAILED_WRONG_PASSWORD', 'admin_users', user.id, { failedCount, ip }, ip);
      return error('Invalid credentials', 401);
    }

    // Reset failed logins on success
    db.prepare(`
      UPDATE admin_users SET failed_logins = 0, lockout_until = NULL, updated_at = datetime('now', 'localtime') WHERE id = ?
    `).run(user.id);

    // Create session
    const session = createSession(user.id);
    logAudit(user.id, user.username, 'LOGIN_SUCCESS', 'admin_users', user.id, { role: user.role, ip }, ip);

    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Set-Cookie': `mmc_admin_session=${session.token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`
    });
    return res.end(JSON.stringify({
      success: true,
      token: session.token,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        circle_id: user.circle_id,
        ward_id: user.ward_id
      }
    }));
  }

  // Admin Logout
  if (pathname === '/api/admin/logout' && method === 'POST') {
    if (token) {
      if (currentUser) {
        logAudit(currentUser.id, currentUser.username, 'LOGOUT', 'admin_users', currentUser.id, null, req.socket.remoteAddress);
      }
      deleteSession(token);
    }
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Set-Cookie': 'mmc_admin_session=; Path=/; HttpOnly; Max-Age=0'
    });
    return res.end(JSON.stringify({ success: true, message: 'Logged out successfully' }));
  }

  // Admin Current Profile (Me)
  if (pathname === '/api/admin/me' && method === 'GET') {
    if (!currentUser) return error('Unauthorized', 401);
    return json({ user: currentUser });
  }

  // -------------------------------------------------------------
  // SECURED ADMIN MODULES (SERVER-SIDE ENFORCED RBAC)
  // -------------------------------------------------------------

  // Guard all subsequent admin routes
  if (pathname.startsWith('/api/admin/')) {
    if (!currentUser) return error('Unauthorized. Please log in.', 401);

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

    // 1. Dashboard Stats
    if (pathname === '/api/admin/stats' && method === 'GET') {
      let circleFilter = currentUser.role === 'CIRCLE_WARD_USER' ? currentUser.circle_id : null;
      let wardFilter = currentUser.role === 'CIRCLE_WARD_USER' ? currentUser.ward_id : null;

      // KPI Counts
      const totalParticipants = db.prepare(`
        SELECT COUNT(*) as cnt FROM participants
        WHERE (? IS NULL OR circle_id = ?) AND (? IS NULL OR ward_id = ?)
      `).get(circleFilter, circleFilter, wardFilter, wardFilter).cnt;

      const todayParticipants = db.prepare(`
        SELECT COUNT(*) as cnt FROM participants
        WHERE date(created_at) = date('now', 'localtime')
          AND (? IS NULL OR circle_id = ?) AND (? IS NULL OR ward_id = ?)
      `).get(circleFilter, circleFilter, wardFilter, wardFilter).cnt;

      const totalCompletions = db.prepare(`
        SELECT COUNT(a.id) as cnt FROM game_attempts a
        JOIN participants p ON a.participant_id = p.id
        WHERE (? IS NULL OR p.circle_id = ?) AND (? IS NULL OR p.ward_id = ?)
      `).get(circleFilter, circleFilter, wardFilter, wardFilter).cnt;

      const totalCertificates = db.prepare(`
        SELECT COUNT(c.id) as cnt FROM certificates c
        JOIN participants p ON c.participant_id = p.id
        WHERE (? IS NULL OR p.circle_id = ?) AND (? IS NULL OR p.ward_id = ?)
      `).get(circleFilter, circleFilter, wardFilter, wardFilter).cnt;

      const scoreStats = db.prepare(`
        SELECT AVG(a.score) as avg_score, AVG(a.percentage) as avg_pct FROM game_attempts a
        JOIN participants p ON a.participant_id = p.id
        WHERE (? IS NULL OR p.circle_id = ?) AND (? IS NULL OR p.ward_id = ?)
      `).get(circleFilter, circleFilter, wardFilter, wardFilter);

      // Gender Breakdown
      const genderStats = db.prepare(`
        SELECT gender, COUNT(*) as cnt FROM participants
        WHERE (? IS NULL OR circle_id = ?) AND (? IS NULL OR ward_id = ?)
        GROUP BY gender
      `).all(circleFilter, circleFilter, wardFilter, wardFilter);

      // Category Breakdown
      const categoryStats = db.prepare(`
        SELECT category, COUNT(*) as cnt FROM participants
        WHERE (? IS NULL OR circle_id = ?) AND (? IS NULL OR ward_id = ?)
        GROUP BY category
      `).all(circleFilter, circleFilter, wardFilter, wardFilter);

      // Circle Breakdown
      const circleStats = db.prepare(`
        SELECT c.name, COUNT(p.id) as count
        FROM circles c
        LEFT JOIN participants p ON c.id = p.circle_id
        GROUP BY c.id
      `).all();

      // Recent attempts
      const recentAttempts = db.prepare(`
        SELECT a.id, p.name as participant_name, a.score, a.percentage, a.rank_title, a.created_at,
               c.name as circle_name, w.name as ward_name
        FROM game_attempts a
        JOIN participants p ON a.participant_id = p.id
        JOIN circles c ON p.circle_id = c.id
        JOIN wards w ON p.ward_id = w.id
        WHERE (? IS NULL OR p.circle_id = ?) AND (? IS NULL OR p.ward_id = ?)
        ORDER BY a.created_at DESC LIMIT 8
      `).all(circleFilter, circleFilter, wardFilter, wardFilter);

      return json({
        kpis: {
          totalParticipants,
          todayParticipants,
          totalCompletions,
          totalCertificates,
          avgScore: scoreStats.avg_score ? parseFloat(scoreStats.avg_score.toFixed(1)) : 0,
          passPercentage: totalCompletions > 0 ? parseFloat(((totalCertificates / totalCompletions) * 100).toFixed(1)) : 0
        },
        genderStats,
        categoryStats,
        circleStats,
        recentAttempts
      });
    }

    // 2. Participants CRUD & List
    if (pathname === '/api/admin/participants' && method === 'GET') {
      const search = searchParams.get('search') || '';
      const circleId = searchParams.get('circle_id');
      const wardId = searchParams.get('ward_id');
      const category = searchParams.get('category');
      const gender = searchParams.get('gender');

      let query = `
        SELECT p.*, c.name as circle_name, w.name as ward_name, w.ward_number, a.name as area_name,
               att.score, att.percentage, att.rank_title, cert.certificate_id
        FROM participants p
        JOIN circles c ON p.circle_id = c.id
        JOIN wards w ON p.ward_id = w.id
        LEFT JOIN areas a ON p.area_id = a.id
        LEFT JOIN (
          SELECT participant_id, MAX(score) as score, percentage, rank_title 
          FROM game_attempts GROUP BY participant_id
        ) att ON p.id = att.participant_id
        LEFT JOIN certificates cert ON p.id = cert.participant_id
        WHERE (p.name LIKE ? OR p.organisation LIKE ? OR p.mobile LIKE ?)
      `;
      const params = [`%${search}%`, `%${search}%`, `%${search}%`];

      if (circleId) {
        query += ' AND p.circle_id = ?';
        params.push(circleId);
      }
      if (wardId) {
        query += ' AND p.ward_id = ?';
        params.push(wardId);
      }
      if (category) {
        query += ' AND p.category = ?';
        params.push(category);
      }
      if (gender) {
        query += ' AND p.gender = ?';
        params.push(gender);
      }

      query += ' ORDER BY p.id DESC LIMIT 100';

      const participants = db.prepare(query).all(...params);
      return json({ participants });
    }

    // 3. Circle CRUD
    if (pathname === '/api/admin/circles' && method === 'GET') {
      const circles = db.prepare(`
        SELECT c.*, COUNT(w.id) as ward_count, COUNT(DISTINCT p.id) as participant_count
        FROM circles c
        LEFT JOIN wards w ON c.id = w.circle_id
        LEFT JOIN participants p ON c.id = p.circle_id
        GROUP BY c.id
        ORDER BY c.display_order ASC, c.name ASC
      `).all();
      return json({ circles });
    }

    if (pathname === '/api/admin/circles' && method === 'POST') {
      if (!hasPermission(currentUser, 'SUPER_ADMIN')) return error('Forbidden', 403);
      const { code, name, name_te, display_order, is_active } = body || {};
      if (!code || !name) return error('Circle code and name are required');

      try {
        const insert = db.prepare('INSERT INTO circles (code, name, name_te, is_active, display_order) VALUES (?, ?, ?, ?, ?)');
        const resCircle = insert.run(code.trim().toUpperCase(), name.trim(), name_te ? name_te.trim() : name.trim(), is_active !== false ? 1 : 0, display_order || 0);
        const circleId = Number(resCircle.lastInsertRowid);
        logAudit(currentUser.id, currentUser.username, 'CREATE_CIRCLE', 'circles', circleId, { code, name }, ip);
        return json({ success: true, circleId });
      } catch (e) {
        return error(e.message);
      }
    }

    if (pathname.startsWith('/api/admin/circles/') && method === 'PUT') {
      if (!hasPermission(currentUser, 'SUPER_ADMIN')) return error('Forbidden', 403);
      const id = parseInt(pathname.replace('/api/admin/circles/', ''), 10);
      const { code, name, name_te, display_order, is_active } = body || {};

      try {
        db.prepare(`
          UPDATE circles SET code = ?, name = ?, name_te = ?, display_order = ?, is_active = ? WHERE id = ?
        `).run(code.trim().toUpperCase(), name.trim(), name_te ? name_te.trim() : name.trim(), display_order || 0, is_active ? 1 : 0, id);
        logAudit(currentUser.id, currentUser.username, 'UPDATE_CIRCLE', 'circles', id, { code, name, is_active }, ip);
        return json({ success: true });
      } catch (e) {
        return error(e.message);
      }
    }

    if (pathname.startsWith('/api/admin/circles/') && method === 'DELETE') {
      if (!hasPermission(currentUser, 'SUPER_ADMIN')) return error('Forbidden', 403);
      const id = parseInt(pathname.replace('/api/admin/circles/', ''), 10);
      try {
        // Toggle active status instead of hard delete to preserve historical integrity
        db.prepare('UPDATE circles SET is_active = 0 WHERE id = ?').run(id);
        logAudit(currentUser.id, currentUser.username, 'DEACTIVATE_CIRCLE', 'circles', id, null, ip);
        return json({ success: true });
      } catch (e) {
        return error(e.message);
      }
    }

    // 4. Ward CRUD
    if (pathname === '/api/admin/wards' && method === 'GET') {
      const circleId = searchParams.get('circle_id');
      let query = `
        SELECT w.*, c.name as circle_name, c.code as circle_code, COUNT(a.id) as area_count, COUNT(DISTINCT p.id) as participant_count
        FROM wards w
        JOIN circles c ON w.circle_id = c.id
        LEFT JOIN areas a ON w.id = a.ward_id
        LEFT JOIN participants p ON w.id = p.ward_id
      `;
      const params = [];
      if (circleId) {
        query += ' WHERE w.circle_id = ?';
        params.push(circleId);
      }
      query += ' GROUP BY w.id ORDER BY w.circle_id ASC, w.display_order ASC, w.ward_number ASC';
      const wards = db.prepare(query).all(...params);
      return json({ wards });
    }

    if (pathname === '/api/admin/wards' && method === 'POST') {
      if (!hasPermission(currentUser, 'SUPER_ADMIN')) return error('Forbidden', 403);
      const { circle_id, ward_number, name, name_te, display_order, is_active } = body || {};
      if (!circle_id || !ward_number || !name) return error('Circle, ward number, and name are required');

      try {
        const insert = db.prepare('INSERT INTO wards (circle_id, ward_number, name, name_te, is_active, display_order) VALUES (?, ?, ?, ?, ?, ?)');
        const resWard = insert.run(circle_id, ward_number.trim(), name.trim(), name_te ? name_te.trim() : name.trim(), is_active !== false ? 1 : 0, display_order || 0);
        const wardId = Number(resWard.lastInsertRowid);
        logAudit(currentUser.id, currentUser.username, 'CREATE_WARD', 'wards', wardId, { ward_number, name, circle_id }, ip);
        return json({ success: true, wardId });
      } catch (e) {
        return error(e.message);
      }
    }

    if (pathname.startsWith('/api/admin/wards/') && method === 'PUT') {
      if (!hasPermission(currentUser, 'SUPER_ADMIN')) return error('Forbidden', 403);
      const id = parseInt(pathname.replace('/api/admin/wards/', ''), 10);
      const { circle_id, ward_number, name, name_te, display_order, is_active } = body || {};

      try {
        db.prepare(`
          UPDATE wards SET circle_id = ?, ward_number = ?, name = ?, name_te = ?, display_order = ?, is_active = ? WHERE id = ?
        `).run(circle_id, ward_number.trim(), name.trim(), name_te ? name_te.trim() : name.trim(), display_order || 0, is_active ? 1 : 0, id);
        logAudit(currentUser.id, currentUser.username, 'UPDATE_WARD', 'wards', id, { ward_number, name, circle_id, is_active }, ip);
        return json({ success: true });
      } catch (e) {
        return error(e.message);
      }
    }

    if (pathname.startsWith('/api/admin/wards/') && method === 'DELETE') {
      if (!hasPermission(currentUser, 'SUPER_ADMIN')) return error('Forbidden', 403);
      const id = parseInt(pathname.replace('/api/admin/wards/', ''), 10);
      try {
        db.prepare('UPDATE wards SET is_active = 0 WHERE id = ?').run(id);
        logAudit(currentUser.id, currentUser.username, 'DEACTIVATE_WARD', 'wards', id, null, ip);
        return json({ success: true });
      } catch (e) {
        return error(e.message);
      }
    }

    // 5. Area CRUD
    if (pathname === '/api/admin/areas' && method === 'GET') {
      const wardId = searchParams.get('ward_id');
      let query = `
        SELECT a.*, w.name as ward_name, w.ward_number, c.name as circle_name
        FROM areas a
        JOIN wards w ON a.ward_id = w.id
        JOIN circles c ON w.circle_id = c.id
      `;
      const params = [];
      if (wardId) {
        query += ' WHERE a.ward_id = ?';
        params.push(wardId);
      }
      query += ' ORDER BY a.name ASC';
      const areas = db.prepare(query).all(...params);
      return json({ areas });
    }

    if (pathname === '/api/admin/areas' && method === 'POST') {
      if (!hasPermission(currentUser, 'SUPER_ADMIN')) return error('Forbidden', 403);
      const { ward_id, name, name_te, pincode, is_active } = body || {};
      if (!ward_id || !name) return error('Ward and area name are required');

      try {
        const insert = db.prepare('INSERT INTO areas (ward_id, name, name_te, pincode, is_active) VALUES (?, ?, ?, ?, ?)');
        const resArea = insert.run(ward_id, name.trim(), name_te ? name_te.trim() : name.trim(), pincode ? pincode.trim() : '500047', is_active !== false ? 1 : 0);
        const areaId = Number(resArea.lastInsertRowid);
        logAudit(currentUser.id, currentUser.username, 'CREATE_AREA', 'areas', areaId, { name, ward_id }, ip);
        return json({ success: true, areaId });
      } catch (e) {
        return error(e.message);
      }
    }

    if (pathname.startsWith('/api/admin/areas/') && method === 'PUT') {
      if (!hasPermission(currentUser, 'SUPER_ADMIN')) return error('Forbidden', 403);
      const id = parseInt(pathname.replace('/api/admin/areas/', ''), 10);
      const { ward_id, name, name_te, pincode, is_active } = body || {};

      try {
        db.prepare('UPDATE areas SET ward_id = ?, name = ?, name_te = ?, pincode = ?, is_active = ? WHERE id = ?')
          .run(ward_id, name.trim(), name_te ? name_te.trim() : name.trim(), pincode ? pincode.trim() : '500047', is_active ? 1 : 0, id);
        logAudit(currentUser.id, currentUser.username, 'UPDATE_AREA', 'areas', id, { name, ward_id, is_active }, ip);
        return json({ success: true });
      } catch (e) {
        return error(e.message);
      }
    }

    if (pathname.startsWith('/api/admin/areas/') && method === 'DELETE') {
      if (!hasPermission(currentUser, 'SUPER_ADMIN')) return error('Forbidden', 403);
      const id = parseInt(pathname.replace('/api/admin/areas/', ''), 10);
      try {
        db.prepare('UPDATE areas SET is_active = 0 WHERE id = ?').run(id);
        logAudit(currentUser.id, currentUser.username, 'DEACTIVATE_AREA', 'areas', id, null, ip);
        return json({ success: true });
      } catch (e) {
        return error(e.message);
      }
    }

    // 6. Waste Master CRUD
    if (pathname === '/api/admin/waste-items' && method === 'GET') {
      const items = db.prepare(`
        SELECT i.*, s.name as stream_name, s.code as stream_code, s.color as stream_color, s.bin_color
        FROM waste_items i
        JOIN waste_streams s ON i.stream_id = s.id
        ORDER BY i.stream_id ASC, i.name ASC
      `).all();
      return json({ items });
    }

    if (pathname === '/api/admin/waste-items' && method === 'POST') {
      if (!hasPermission(currentUser, 'content')) return error('Forbidden', 403);
      const { stream_id, name, name_te, category, image_icon, explanation, explanation_te, mistake_tip, mistake_tip_te, difficulty, is_active } = body || {};
      if (!stream_id || !name || !explanation) return error('Stream, name, and explanation are required');

      try {
        const insert = db.prepare(`
          INSERT INTO waste_items (stream_id, name, name_te, category, image_icon, explanation, explanation_te, mistake_tip, mistake_tip_te, difficulty, is_active)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const resItem = insert.run(
          stream_id,
          name.trim(),
          name_te ? name_te.trim() : name.trim(),
          category ? category.trim() : 'General',
          image_icon || 'fa-trash',
          explanation.trim(),
          explanation_te ? explanation_te.trim() : explanation.trim(),
          mistake_tip || null,
          mistake_tip_te || null,
          difficulty || 'Medium',
          is_active !== false ? 1 : 0
        );
        const itemId = Number(resItem.lastInsertRowid);
        logAudit(currentUser.id, currentUser.username, 'CREATE_WASTE_ITEM', 'waste_items', itemId, { name, stream_id }, ip);
        return json({ success: true, itemId });
      } catch (e) {
        return error(e.message);
      }
    }

    if (pathname.startsWith('/api/admin/waste-items/') && method === 'PUT') {
      if (!hasPermission(currentUser, 'content')) return error('Forbidden', 403);
      const id = parseInt(pathname.replace('/api/admin/waste-items/', ''), 10);
      const { stream_id, name, name_te, category, image_icon, explanation, explanation_te, mistake_tip, mistake_tip_te, difficulty, is_active } = body || {};

      try {
        db.prepare(`
          UPDATE waste_items SET stream_id = ?, name = ?, name_te = ?, category = ?, image_icon = ?,
                 explanation = ?, explanation_te = ?, mistake_tip = ?, mistake_tip_te = ?, difficulty = ?, is_active = ?
          WHERE id = ?
        `).run(
          stream_id,
          name.trim(),
          name_te ? name_te.trim() : name.trim(),
          category ? category.trim() : 'General',
          image_icon || 'fa-trash',
          explanation.trim(),
          explanation_te ? explanation_te.trim() : explanation.trim(),
          mistake_tip || null,
          mistake_tip_te || null,
          difficulty || 'Medium',
          is_active ? 1 : 0,
          id
        );
        logAudit(currentUser.id, currentUser.username, 'UPDATE_WASTE_ITEM', 'waste_items', id, { name, stream_id }, ip);
        return json({ success: true });
      } catch (e) {
        return error(e.message);
      }
    }

    if (pathname.startsWith('/api/admin/waste-items/') && method === 'DELETE') {
      if (!hasPermission(currentUser, 'content')) return error('Forbidden', 403);
      const id = parseInt(pathname.replace('/api/admin/waste-items/', ''), 10);
      try {
        db.prepare('UPDATE waste_items SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END WHERE id = ?').run(id);
        logAudit(currentUser.id, currentUser.username, 'TOGGLE_WASTE_ITEM', 'waste_items', id, null, ip);
        return json({ success: true });
      } catch (e) {
        return error(e.message);
      }
    }

    // 7. Questions CRUD
    if (pathname === '/api/admin/questions' && method === 'GET') {
      const questions = db.prepare(`
        SELECT q.*, s.name as stream_name, s.code as stream_code, s.color as stream_color
        FROM questions q
        LEFT JOIN waste_streams s ON q.stream_id = s.id
        ORDER BY q.level_number ASC, q.id ASC
      `).all().map(q => ({
        ...q,
        options: JSON.parse(q.options_json || '[]')
      }));
      return json({ questions });
    }

    if (pathname === '/api/admin/questions' && method === 'POST') {
      if (!hasPermission(currentUser, 'content')) return error('Forbidden', 403);
      const { level_number, stream_id, question_text, question_text_te, options, correct_answer, explanation, explanation_te, difficulty, is_active } = body || {};
      if (!level_number || !question_text || !correct_answer || !options) {
        return error('Level, question text, options, and correct answer are required');
      }

      try {
        const insert = db.prepare(`
          INSERT INTO questions (level_number, stream_id, question_text, question_text_te, options_json, correct_answer, explanation, explanation_te, difficulty, is_active)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const resQ = insert.run(
          level_number,
          stream_id || null,
          question_text.trim(),
          question_text_te ? question_text_te.trim() : question_text.trim(),
          JSON.stringify(options),
          correct_answer.trim(),
          explanation ? explanation.trim() : '',
          explanation_te ? explanation_te.trim() : (explanation ? explanation.trim() : ''),
          difficulty || 'Medium',
          is_active !== false ? 1 : 0
        );
        const qId = Number(resQ.lastInsertRowid);
        logAudit(currentUser.id, currentUser.username, 'CREATE_QUESTION', 'questions', qId, { question_text, level_number }, ip);
        return json({ success: true, questionId: qId });
      } catch (e) {
        return error(e.message);
      }
    }

    if (pathname.startsWith('/api/admin/questions/') && method === 'PUT') {
      if (!hasPermission(currentUser, 'content')) return error('Forbidden', 403);
      const id = parseInt(pathname.replace('/api/admin/questions/', ''), 10);
      const { level_number, stream_id, question_text, question_text_te, options, correct_answer, explanation, explanation_te, difficulty, is_active } = body || {};

      try {
        db.prepare(`
          UPDATE questions SET level_number = ?, stream_id = ?, question_text = ?, question_text_te = ?,
                 options_json = ?, correct_answer = ?, explanation = ?, explanation_te = ?, difficulty = ?, is_active = ?
          WHERE id = ?
        `).run(
          level_number,
          stream_id || null,
          question_text.trim(),
          question_text_te ? question_text_te.trim() : question_text.trim(),
          JSON.stringify(options),
          correct_answer.trim(),
          explanation ? explanation.trim() : '',
          explanation_te ? explanation_te.trim() : (explanation ? explanation.trim() : ''),
          difficulty || 'Medium',
          is_active ? 1 : 0,
          id
        );
        logAudit(currentUser.id, currentUser.username, 'UPDATE_QUESTION', 'questions', id, { question_text }, ip);
        return json({ success: true });
      } catch (e) {
        return error(e.message);
      }
    }

    if (pathname.startsWith('/api/admin/questions/') && method === 'DELETE') {
      if (!hasPermission(currentUser, 'content')) return error('Forbidden', 403);
      const id = parseInt(pathname.replace('/api/admin/questions/', ''), 10);
      try {
        db.prepare('UPDATE questions SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END WHERE id = ?').run(id);
        logAudit(currentUser.id, currentUser.username, 'TOGGLE_QUESTION', 'questions', id, null, ip);
        return json({ success: true });
      } catch (e) {
        return error(e.message);
      }
    }

    // 8. Certificates List & Status
    if (pathname === '/api/admin/certificates' && method === 'GET') {
      const search = searchParams.get('search') || '';
      const certificates = db.prepare(`
        SELECT c.*, p.name as participant_name, p.category, p.organisation, ci.name as circle_name, w.name as ward_name
        FROM certificates c
        JOIN participants p ON c.participant_id = p.id
        JOIN circles ci ON p.circle_id = ci.id
        JOIN wards w ON p.ward_id = w.id
        WHERE (c.certificate_id LIKE ? OR p.name LIKE ? OR p.organisation LIKE ?)
        ORDER BY c.id DESC LIMIT 100
      `).all(`%${search}%`, `%${search}%`, `%${search}%`);
      return json({ certificates });
    }

    if (pathname.startsWith('/api/admin/certificates/') && pathname.endsWith('/status') && method === 'PUT') {
      if (!hasPermission(currentUser, 'certificates')) return error('Forbidden', 403);
      const id = parseInt(pathname.replace('/api/admin/certificates/', '').replace('/status', ''), 10);
      const { status } = body || {};
      if (!status) return error('Status is required');

      try {
        db.prepare('UPDATE certificates SET status = ? WHERE id = ?').run(status, id);
        logAudit(currentUser.id, currentUser.username, 'UPDATE_CERTIFICATE_STATUS', 'certificates', id, { status }, ip);
        return json({ success: true });
      } catch (e) {
        return error(e.message);
      }
    }

    // 9. Brand Asset Manager (Upload / Add / Reorder / Placement / Activate)
    if (pathname === '/api/admin/logos' && method === 'GET') {
      const logos = db.prepare('SELECT * FROM brand_logos ORDER BY placement ASC, display_order ASC, id ASC').all();
      return json({ logos });
    }

    if (pathname === '/api/admin/logos' && method === 'POST') {
      if (!hasPermission(currentUser, 'logos')) return error('Forbidden', 403);
      const { name, file_path, placement, display_order, is_active, aspect_ratio, base64_data } = body || {};

      let finalPath = file_path;

      // Handle base64 image upload if provided
      if (base64_data) {
        try {
          const matches = base64_data.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
          if (matches && matches.length === 3) {
            const ext = matches[1].split('/')[1] || 'png';
            const buffer = Buffer.from(matches[2], 'base64');
            const fileName = `logo_${Date.now()}_${crypto.randomBytes(4).toString('hex')}.${ext}`;
            const uploadDir = path.join(__dirname, '..', 'uploads');
            if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
            const filePath = path.join(uploadDir, fileName);
            fs.writeFileSync(filePath, buffer);
            finalPath = `/uploads/${fileName}`;
          }
        } catch (uploadErr) {
          return error('Failed to process image upload: ' + uploadErr.message);
        }
      }

      if (!name || !finalPath || !placement) {
        return error('Name, file path/upload, and placement are required');
      }

      try {
        const insert = db.prepare(`
          INSERT INTO brand_logos (name, file_path, placement, display_order, is_active, aspect_ratio)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        const resLogo = insert.run(name.trim(), finalPath, placement, display_order || 0, is_active !== false ? 1 : 0, aspect_ratio || 'auto');
        const logoId = Number(resLogo.lastInsertRowid);
        logAudit(currentUser.id, currentUser.username, 'CREATE_LOGO', 'brand_logos', logoId, { name, placement, path: finalPath }, ip);
        return json({ success: true, logoId, file_path: finalPath });
      } catch (e) {
        return error(e.message);
      }
    }

    if (pathname.startsWith('/api/admin/logos/') && method === 'PUT') {
      if (!hasPermission(currentUser, 'logos')) return error('Forbidden', 403);
      const id = parseInt(pathname.replace('/api/admin/logos/', ''), 10);
      const { name, file_path, placement, display_order, is_active, aspect_ratio, base64_data } = body || {};

      let finalPath = file_path;
      if (base64_data) {
        try {
          const matches = base64_data.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
          if (matches && matches.length === 3) {
            const ext = matches[1].split('/')[1] || 'png';
            const buffer = Buffer.from(matches[2], 'base64');
            const fileName = `logo_${Date.now()}_${crypto.randomBytes(4).toString('hex')}.${ext}`;
            const uploadDir = path.join(__dirname, '..', 'uploads');
            if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
            const filePath = path.join(uploadDir, fileName);
            fs.writeFileSync(filePath, buffer);
            finalPath = `/uploads/${fileName}`;
          }
        } catch (uploadErr) {
          return error('Failed to process image upload: ' + uploadErr.message);
        }
      }

      try {
        db.prepare(`
          UPDATE brand_logos SET name = ?, file_path = COALESCE(?, file_path), placement = ?, display_order = ?, is_active = ?, aspect_ratio = ?
          WHERE id = ?
        `).run(name.trim(), finalPath, placement, display_order || 0, is_active ? 1 : 0, aspect_ratio || 'auto', id);
        logAudit(currentUser.id, currentUser.username, 'UPDATE_LOGO', 'brand_logos', id, { name, placement, is_active }, ip);
        return json({ success: true, file_path: finalPath });
      } catch (e) {
        return error(e.message);
      }
    }

    if (pathname.startsWith('/api/admin/logos/') && method === 'DELETE') {
      if (!hasPermission(currentUser, 'logos')) return error('Forbidden', 403);
      const id = parseInt(pathname.replace('/api/admin/logos/', ''), 10);
      try {
        db.prepare('DELETE FROM brand_logos WHERE id = ?').run(id);
        logAudit(currentUser.id, currentUser.username, 'DELETE_LOGO', 'brand_logos', id, null, ip);
        return json({ success: true });
      } catch (e) {
        return error(e.message);
      }
    }

    // 10. Contact Details CMS
    if (pathname === '/api/admin/contact-settings' && method === 'GET') {
      const contacts = db.prepare('SELECT * FROM contact_settings ORDER BY display_order ASC, id ASC').all();
      return json({ contacts });
    }

    if (pathname === '/api/admin/contact-settings' && method === 'PUT') {
      if (!hasPermission(currentUser, 'SUPER_ADMIN')) return error('Forbidden', 403);
      const { items } = body || {};
      if (!Array.isArray(items)) return error('Array of items required');

      const update = db.prepare(`
        UPDATE contact_settings SET value = ?, value_te = ?, is_active = ?, label = ?, label_te = ?, icon = ?
        WHERE setting_key = ?
      `);

      for (const it of items) {
        update.run(
          it.value || '',
          it.value_te || it.value || '',
          it.is_active ? 1 : 0,
          it.label || '',
          it.label_te || '',
          it.icon || 'fa-info-circle',
          it.setting_key
        );
      }
      logAudit(currentUser.id, currentUser.username, 'UPDATE_CONTACT_SETTINGS', 'contact_settings', 'ALL', { count: items.length }, ip);
      return json({ success: true, message: 'Contact details updated' });
    }

    // 11. Website Settings (Qualifying score %, Commissioner, Campaign)
    if (pathname === '/api/admin/website-settings' && method === 'GET') {
      const settings = db.prepare('SELECT * FROM website_settings').all();
      return json({ settings });
    }

    if (pathname === '/api/admin/website-settings' && method === 'PUT') {
      if (!hasPermission(currentUser, 'SUPER_ADMIN')) return error('Forbidden', 403);
      const { settings, signature_base64 } = body || {};

      let sigPath = null;
      if (signature_base64) {
        try {
          const matches = signature_base64.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
          if (matches && matches.length === 3) {
            const ext = matches[1].split('/')[1] || 'png';
            const buffer = Buffer.from(matches[2], 'base64');
            const fileName = `sig_${Date.now()}.${ext}`;
            const uploadDir = path.join(__dirname, '..', 'uploads');
            if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
            fs.writeFileSync(path.join(uploadDir, fileName), buffer);
            sigPath = `/uploads/${fileName}`;
          }
        } catch (sigErr) {
          console.error('Signature upload error:', sigErr.message);
        }
      }

      const update = db.prepare(`
        INSERT INTO website_settings (setting_key, setting_value, updated_at)
        VALUES (?, ?, datetime('now', 'localtime'))
        ON CONFLICT(setting_key) DO UPDATE SET setting_value = excluded.setting_value, updated_at = datetime('now', 'localtime')
      `);

      if (settings && typeof settings === 'object') {
        for (const [k, v] of Object.entries(settings)) {
          update.run(k, String(v));
        }
      }

      if (sigPath) {
        update.run('signature_asset', sigPath);
      }

      logAudit(currentUser.id, currentUser.username, 'UPDATE_WEBSITE_SETTINGS', 'website_settings', 'ALL', settings, ip);
      return json({ success: true, message: 'Settings updated successfully', signature_path: sigPath });
    }

    // 12. Admin Users Management
    if (pathname === '/api/admin/users' && method === 'GET') {
      if (!hasPermission(currentUser, 'SUPER_ADMIN')) return error('Forbidden', 403);
      const users = db.prepare(`
        SELECT u.id, u.username, u.full_name, u.email, u.role, u.circle_id, u.ward_id, u.is_active, u.created_at,
               c.name as circle_name, w.name as ward_name
        FROM admin_users u
        LEFT JOIN circles c ON u.circle_id = c.id
        LEFT JOIN wards w ON u.ward_id = w.id
        ORDER BY u.id ASC
      `).all();
      return json({ users });
    }

    if (pathname === '/api/admin/users' && method === 'POST') {
      if (!hasPermission(currentUser, 'SUPER_ADMIN')) return error('Forbidden', 403);
      const { username, password, full_name, email, role, circle_id, ward_id } = body || {};
      if (!username || !password || !full_name || !role) {
        return error('Username, password, full name, and role are required');
      }

      const cleanUser = username.trim().toLowerCase();
      const existing = db.prepare('SELECT id FROM admin_users WHERE username = ?').get(cleanUser);
      if (existing) return error('Username already taken');

      const { hash, salt } = hashPassword(password);
      const insert = db.prepare(`
        INSERT INTO admin_users (username, password_hash, salt, full_name, email, role, circle_id, ward_id, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
      `);
      const resUser = insert.run(cleanUser, hash, salt, full_name.trim(), email ? email.trim() : null, role, circle_id || null, ward_id || null);
      const newId = Number(resUser.lastInsertRowid);
      logAudit(currentUser.id, currentUser.username, 'CREATE_ADMIN_USER', 'admin_users', newId, { username: cleanUser, role }, ip);
      return json({ success: true, userId: newId });
    }

    if (pathname.startsWith('/api/admin/users/') && method === 'PUT') {
      if (!hasPermission(currentUser, 'SUPER_ADMIN')) return error('Forbidden', 403);
      const id = parseInt(pathname.replace('/api/admin/users/', ''), 10);
      const { full_name, email, role, circle_id, ward_id, is_active, new_password } = body || {};

      try {
        if (new_password && new_password.length >= 6) {
          const { hash, salt } = hashPassword(new_password);
          db.prepare(`
            UPDATE admin_users SET full_name = ?, email = ?, role = ?, circle_id = ?, ward_id = ?, is_active = ?,
                   password_hash = ?, salt = ?, updated_at = datetime('now', 'localtime')
            WHERE id = ?
          `).run(full_name.trim(), email ? email.trim() : null, role, circle_id || null, ward_id || null, is_active ? 1 : 0, hash, salt, id);
        } else {
          db.prepare(`
            UPDATE admin_users SET full_name = ?, email = ?, role = ?, circle_id = ?, ward_id = ?, is_active = ?,
                   updated_at = datetime('now', 'localtime')
            WHERE id = ?
          `).run(full_name.trim(), email ? email.trim() : null, role, circle_id || null, ward_id || null, is_active ? 1 : 0, id);
        }
        logAudit(currentUser.id, currentUser.username, 'UPDATE_ADMIN_USER', 'admin_users', id, { role, is_active }, ip);
        return json({ success: true });
      } catch (e) {
        return error(e.message);
      }
    }

    // 13. Audit Logs
    if (pathname === '/api/admin/audit-logs' && method === 'GET') {
      if (!hasPermission(currentUser, 'SUPER_ADMIN')) return error('Forbidden', 403);
      const logs = db.prepare('SELECT * FROM audit_logs ORDER BY id DESC LIMIT 100').all();
      return json({ logs });
    }

    // 14. Report CSV Export
    if (pathname === '/api/admin/reports/export' && method === 'GET') {
      const type = searchParams.get('type') || 'participants';

      if (type === 'participants') {
        const rows = db.prepare(`
          SELECT p.id, p.name, p.gender, p.age, p.category, p.organisation,
                 c.name as circle, w.name as ward, w.ward_number,
                 a.score, a.percentage, a.rank_title, cert.certificate_id, p.created_at
          FROM participants p
          JOIN circles c ON p.circle_id = c.id
          JOIN wards w ON p.ward_id = w.id
          LEFT JOIN (SELECT participant_id, MAX(score) as score, percentage, rank_title FROM game_attempts GROUP BY participant_id) a ON p.id = a.participant_id
          LEFT JOIN certificates cert ON p.id = cert.participant_id
          ORDER BY p.id DESC
        `).all();

        const csvHeaders = 'ID,Name,Gender,Age,Category,Organisation,Circle,Ward,Ward No,Score,Percentage,Rank,Certificate ID,Registered At\n';
        const csvRows = rows.map(r => [
          r.id,
          `"${(r.name || '').replace(/"/g, '""')}"`,
          r.gender,
          r.age || '',
          `"${(r.category || '').replace(/"/g, '""')}"`,
          `"${(r.organisation || '').replace(/"/g, '""')}"`,
          `"${(r.circle || '').replace(/"/g, '""')}"`,
          `"${(r.ward || '').replace(/"/g, '""')}"`,
          r.ward_number,
          r.score || 0,
          r.percentage || 0,
          `"${r.rank_title || ''}"`,
          r.certificate_id || 'Not Qualified',
          r.created_at
        ].join(',')).join('\n');

        res.writeHead(200, {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="mmc-4s-hero-participants.csv"'
        });
        return res.end(csvHeaders + csvRows);
      }

      if (type === 'certificates') {
        const rows = db.prepare(`
          SELECT c.certificate_id, p.name, p.category, p.organisation, ci.name as circle, w.name as ward,
                 c.score, c.percentage, c.issue_date, c.commissioner_name, c.status
          FROM certificates c
          JOIN participants p ON c.participant_id = p.id
          JOIN circles ci ON p.circle_id = ci.id
          JOIN wards w ON p.ward_id = w.id
          ORDER BY c.id DESC
        `).all();

        const csvHeaders = 'Certificate ID,Participant Name,Category,Organisation,Circle,Ward,Score,Percentage,Issue Date,Commissioner,Status\n';
        const csvRows = rows.map(r => [
          r.certificate_id,
          `"${(r.name || '').replace(/"/g, '""')}"`,
          `"${(r.category || '').replace(/"/g, '""')}"`,
          `"${(r.organisation || '').replace(/"/g, '""')}"`,
          `"${(r.circle || '').replace(/"/g, '""')}"`,
          `"${(r.ward || '').replace(/"/g, '""')}"`,
          r.score,
          r.percentage,
          r.issue_date,
          `"${r.commissioner_name}"`,
          r.status
        ].join(',')).join('\n');

        res.writeHead(200, {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="mmc-4s-hero-certificates.csv"'
        });
        return res.end(csvHeaders + csvRows);
      }

      return error('Invalid export type');
    }
  }

  // 404 for unhandled API route
  return error('Endpoint not found', 404);
}

module.exports = { handleApiRequest };
