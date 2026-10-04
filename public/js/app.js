/**
 * 4S HERO – Waste Segregation Challenge
 * Malkajgiri Municipal Corporation (MMC), Telangana
 * Client-Side Application Core
 */

// Global State
const state = {
  currentLang: 'en',
  participant: null,
  currentLevel: 1,
  score: 0,
  maxScore: 0,
  streak: 0,
  maxStreak: 0,
  correctCount: 0,
  incorrectCount: 0,
  stars: 0,
  rank: '4S LEARNER',
  levelsCompleted: [],
  currentQuestions: [],
  currentQuestionIndex: 0,
  missedQuestions: [],
  timerInterval: null,
  timeLeft: 10,
  certificateData: null,
  settings: {},
  contacts: [],
  logos: [],
  streams: []
};

// Bilingual Dictionary (English & Telugu)
const i18n = {
  en: {
    gov_telangana: 'Government of Telangana',
    corp_name: 'Malkajgiri Municipal Corporation',
    tag_seg_challenge: 'Waste Segregation Challenge',
    nav_home: 'Home',
    nav_streams: '4 Streams Guide',
    nav_game: 'Game Hub',
    nav_leaderboard: 'Leaderboard',
    nav_contact: 'Contact Us',
    nav_admin: 'Admin',
    btn_register_play: 'Play Now',
    campaign_banner_tag: 'Four Streams. One Mission. A Cleaner Malkajgiri.',
    main_challenge_title: 'Waste Segregation Challenge',
    main_msg: '“Which Bin? You Decide!”',
    supporting_msg: '“Learn • Play • Segregate • Become a 4S HERO”',
    open_to_all_ages: '🌟 Open to all age groups! Children, students, youth, citizens, sanitation workers, RWA members, and seniors — test your segregation skills, score 80%+, and earn an Official MMC Certificate of Achievement!',
    btn_join_challenge: 'Join the 4S HERO Challenge',
    btn_learn_streams: 'Learn 4 Streams',
    click_view_poster: 'Click to view official poster',
    stat_participants: 'Total Participants',
    stat_completions: 'Games Completed',
    stat_certificates: 'Certificates Issued',
    stat_avg_score: 'Average Score',
    guide_badge: 'Official 4-Stream Waste Segregation Protocol',
    guide_title: 'The Four Streams of Malkajgiri',
    guide_desc: 'Segregate at source every day. These color mappings must NEVER be interchanged!',
    stream_wet: 'Wet Waste',
    stream_dry: 'Dry Waste',
    stream_sanitary: 'Sanitary Waste',
    stream_special: 'Special-Care Waste',
    wet_desc: 'Biodegradable kitchen scraps, food leftovers, vegetable & fruit peels, egg shells, coffee grounds, garden leaves & pooja flowers.',
    dry_desc: 'Clean recyclables: paper, newspapers, delivery cartons, cardboard, PET plastic bottles, drink cans, intact glass jars, tetra paks.',
    sanitary_desc: 'Used sanitary napkins, baby & adult diapers, cotton swabs, ear buds, used tissues, bandages. Wrap in paper with a red mark!',
    special_desc: 'Domestic hazardous: batteries, CFL/tubelights, expired medicines, broken glass shards, syringes/needles, e-waste, paint cans.',
    view_wet_poster: 'View Official Poster',
    view_dry_poster: 'View Official Poster',
    view_sanitary_poster: 'View Official Poster',
    view_special_poster: 'View Official Poster',
    campaign_posters_title: 'Official 4S HERO Promotional Posters',
    campaign_posters_subtitle: 'Click any poster to inspect official awareness visuals in high resolution',
    reg_title: 'Participant Registration',
    reg_subtitle: 'Open to all age groups! Children, students, youth, adults, and seniors.',
    field_name: 'Participant Full Name',
    field_gender: 'Gender',
    field_age: 'Age / Age Group',
    field_category: 'Participant Category',
    field_org: 'School / College / Organisation',
    sec_jurisdiction: 'Malkajgiri Municipal Jurisdiction',
    field_circle: 'Circle',
    field_ward: 'Ward',
    field_area: 'Area / Locality',
    field_mobile: 'Mobile Number',
    field_email: 'Email Address',
    btn_start_game: 'Start 4S HERO Challenge',
    hud_player: 'Active 4S Hero',
    hud_score: 'Score',
    hud_streak: 'Streak',
    hud_rank: 'Rank',
    hub_title: 'Challenge Missions',
    hub_subtitle: 'Play levels sequentially or choose a mission to hone your segregation mastery',
    lvl1_title: 'Which Bin?',
    lvl1_desc: 'Identify waste items and choose between Green (Wet), Blue (Dry), Red (Sanitary), and Black (Special Care).',
    lvl2_title: 'Drag & Drop Waste',
    lvl2_desc: 'Drag waste objects directly into the correct colored bins. Works with both mouse drag and smartphone touch!',
    lvl3_title: 'Rapid Fire',
    lvl3_desc: '10 quick classification questions against a ticking countdown clock. Build speed and earn streak multipliers!',
    lvl4_title: 'Spot the Mistake',
    lvl4_desc: 'Examine segregated bins. Spot the dangerous or incorrectly placed item and reassign it to its proper stream.',
    lvl5_title: 'Match the Waste',
    lvl5_desc: 'Pair waste cards with their appropriate 4-stream bins in an interactive card-matching game.',
    lvl6_title: 'Clean Malkajgiri',
    lvl6_desc: 'Clean famous Malkajgiri localities like Safilguda Lake & Anandbagh. Segregating waste transforms the scene into a blooming green park!',
    lvl7_title: 'Ultimate 4S HERO Quiz',
    lvl7_desc: '10 comprehensive scenario questions across all four streams. Score 80%+ to unlock your official Malkajgiri Municipal Corporation Certificate of Achievement!',
    btn_play_mission: 'Play Mission',
    btn_start_final: 'Start Ultimate Quiz',
    results_title: 'Challenge Completed!',
    res_score: 'Score',
    res_accuracy: 'Accuracy',
    res_correct: 'Correct',
    res_incorrect: 'Incorrect',
    res_cert_unlocked: 'Official Certificate Unlocked!',
    res_cert_desc: 'Congratulations! You achieved 80% or higher. Your official Malkajgiri Municipal Corporation Certificate of Achievement is ready.',
    res_retry_title: 'Almost There!',
    res_retry_desc: 'The official qualifying score is 80%. Review the missed questions and try again to earn your certificate!',
    btn_view_certificate: 'Get Certificate',
    btn_try_missed: 'Try Missed Questions',
    btn_play_more_levels: 'More Levels',
    btn_leaderboard: 'Leaderboard',
    btn_share_score: 'Share Score',
    cert_title: 'Certificate of Achievement',
    cert_subtitle: 'Malkajgiri Municipal Corporation 4S HERO Source Segregation Challenge',
    btn_download_png: 'Download PNG',
    btn_print_pdf: 'Print / PDF',
    cert_unique_id: 'Unique Certificate ID',
    btn_verify_online: 'Verify Certificate Online',
    leaderboard_title: '4S HERO Leaderboard',
    leaderboard_desc: 'Top waste segregation champions across Malkajgiri Municipal Corporation',
    top_heroes_title: 'Top 4S Heroes',
    top_orgs_title: 'Top Schools & RWAs',
    contact_title: 'Contact Malkajgiri Municipal Corporation',
    contact_desc: 'Get in touch with sanitation officers, report dumping spots, or request awareness workshops.',
    social_title: 'Official Social Media Channels'
  },
  te: {
    gov_telangana: 'తెలంగాణ ప్రభుత్వం',
    corp_name: 'మల్కాజ్‌గిరి మున్సిపల్ కార్పొరేషన్',
    tag_seg_challenge: 'చెత్త వర్గీకరణ సవాలు',
    nav_home: 'హోమ్',
    nav_streams: '4 స్ట్రీమ్స్ గైడ్',
    nav_game: 'గేమ్ హబ్',
    nav_leaderboard: 'లీడర్‌బోర్డ్',
    nav_contact: 'సంప్రదించండి',
    nav_admin: 'అడ్మిన్',
    btn_register_play: 'ఇప్పుడే ఆడండి',
    campaign_banner_tag: '4 స్ట్రీమ్స్. ఒకే మిషన్. పరిశుభ్రమైన మల్కాజ్‌గిరి.',
    main_challenge_title: 'చెత్త వర్గీకరణ సవాలు',
    main_msg: '“ఏ బిన్? మీరే నిర్ణయించండి!”',
    supporting_msg: '“నేర్చుకోండి • ఆడండి • వేరు చేయండి • 4S హీరో అవ్వండి”',
    open_to_all_ages: '🌟 అన్ని వయస్సుల వారికి ప్రవేశం! పిల్లలు, విద్యార్థులు, యువత, పౌరులు, పారిశుధ్య కార్మికులు, RWA సభ్యులు మరియు సీనియర్లు — మీ నైపుణ్యాన్ని పరీక్షించండి, 80%+ స్కోర్ సాధించి అధికారిక MMC సర్టిఫికెట్ అందుకోండి!',
    btn_join_challenge: '4S హీరో ఛాలెంజ్‌లో పాల్గొనండి',
    btn_learn_streams: '4 రకాల చెత్త తెలుసుకోండి',
    click_view_poster: 'అధికారిక పోస్టర్ వీక్షించండి',
    stat_participants: 'మొత్తం పాల్గొన్నవారు',
    stat_completions: 'గేమ్స్ పూర్తయినవి',
    stat_certificates: 'సర్టిఫికెట్లు జారీ చేయబడినవి',
    stat_avg_score: 'సగటు స్కోరు',
    guide_badge: 'అధికారిక 4-స్ట్రీమ్ వర్గీకరణ నియమావళి',
    guide_title: 'మల్కాజ్‌గిరి నాలుగు రకాల వ్యర్థాల విధానం',
    guide_desc: 'ప్రతిరోజూ మూలంలోనే వేరు చేయండి. రంగుల కేటాయింపులను ఎప్పుడూ మార్చవద్దు!',
    stream_wet: 'తడి చెత్త',
    stream_dry: 'పొడి చెత్త',
    stream_sanitary: 'శానిటరీ వ్యర్థాలు',
    stream_special: 'స్పెషల్ కేర్ వ్యర్థాలు',
    wet_desc: 'కూరగాయలు, పండ్ల తొక్కలు, మిగిలిన ఆహారం, గుడ్డు పెంకులు, టీ పొడి, ఎండిన ఆకులు, పూజా పూలు.',
    dry_desc: 'పునర్వినియోగ కాగితం, కార్డ్‌బోర్డ్, ప్లాస్టిక్ సీసాలు, డ్రింక్ క్యాన్లు, గాజు సీసాలు, టెట్రా ప్యాక్‌లు.',
    sanitary_desc: 'శానిటరీ ప్యాడ్లు, బేబీ & అడల్ట్ డైపర్లు, వాడిన టిష్యూలు, బ్యాండేజీలు. పేపరులో చుట్టి ఎరుపు గుర్తు వేయండి!',
    special_desc: 'గృహ ప్రమాదకర వ్యర్థాలు: బ్యాటరీలు, ట్యూబ్‌లైట్లు, మందులు, పగిలిన గాజు ముక్కలు, సూదులు, ఈ-వ్యర్థాలు.',
    view_wet_poster: 'అధికారిక పోస్టర్ చూడండి',
    view_dry_poster: 'అధికారిక పోస్టర్ చూడండి',
    view_sanitary_poster: 'అధికారిక పోస్టర్ చూడండి',
    view_special_poster: 'అధికారిక పోస్టర్ చూడండి',
    campaign_posters_title: 'అధికారిక 4S హీరో ప్రచార పోస్టర్లు',
    campaign_posters_subtitle: 'హై-రిజల్యూషన్‌లో అవగాహన పోస్టర్లను పరిశీలించడానికి క్లిక్ చేయండి',
    reg_title: 'పాల్గొనేవారి నమోదు',
    reg_subtitle: 'అన్ని వయసుల వారికి ముక్తకంఠ ఆహ్వానం! విద్యార్థులు, యువత, పెద్దలు మరియు సీనియర్లు.',
    field_name: 'పూర్తి పేరు',
    field_gender: 'లింగం',
    field_age: 'వయస్సు గ్రూప్',
    field_category: 'విభాగం',
    field_org: 'పాఠశాల / కళాశాల / సంస్థ',
    sec_jurisdiction: 'మల్కాజ్‌గిరి పరిపాలనా పరిధి',
    field_circle: 'సర్కిల్',
    field_ward: 'వార్డు',
    field_area: 'ప్రాంతం / కాలనీ',
    field_mobile: 'మొబైల్ సంఖ్య',
    field_email: 'ఇమెయిల్ చిరునామా',
    btn_start_game: '4S హీరో ఛాలెంజ్ ప్రారంభించండి',
    hud_player: '4S హీరో',
    hud_score: 'స్కోర్',
    hud_streak: 'వరుస స్కోర్',
    hud_rank: 'ర్యాంక్',
    hub_title: 'ఛాలెంజ్ మిషన్లు',
    hub_subtitle: 'క్రమంగా ఆడండి లేదా మీకు నచ్చిన మిషన్‌ను ఎంచుకుని సాధన చేయండి',
    lvl1_title: 'ఏ బిన్?',
    lvl1_desc: 'చెత్త వస్తువులను గుర్తించి ఆకుపచ్చ, నీలం, ఎరుపు, నలుపు బిన్‌లలో సరైనదాన్ని ఎంచుకోండి.',
    lvl2_title: 'డ్రాగ్ & డ్రాప్ వ్యర్థాలు',
    lvl2_desc: 'వ్యర్థాలను నేరుగా సరైన బిన్‌లోకి లాగి వదలండి. మొబైల్ టచ్ మరియు మౌస్ రెండింటిలోనూ పనిచేస్తుంది!',
    lvl3_title: 'రాపిడ్ ఫైర్',
    lvl3_desc: 'సమయంతో పోటీపడుతూ 10 ప్రశ్నలకు వేగంగా సమాధానం ఇవ్వండి. వేగాన్ని బట్టి బోనస్ పాయింట్లు లభిస్తాయి!',
    lvl4_title: 'తప్పును గుర్తించండి',
    lvl4_desc: 'డబ్బాల్లో తప్పుగా వేయబడిన ప్రమాదకర లేదా శానిటరీ వస్తువును గుర్తించి సరైన చోటికి మార్చండి.',
    lvl5_title: 'వ్యర్థాలను జతపరచండి',
    lvl5_desc: 'కార్డుల ఆధారంగా వస్తువులను వాటి సంబంధిత 4 స్ట్రీమ్‌లతో జతపరిచే పజిల్ గేమ్.',
    lvl6_title: 'పరిశుభ్ర మల్కాజ్‌గిరి',
    lvl6_desc: 'సఫీల్‌గూడ, ఆనంద్‌బాగ్ వంటి ప్రాంతాలను శుభ్రం చేయండి. చెత్త తొలగిస్తే ఆ ప్రాంతం పచ్చగా మారుతుంది!',
    lvl7_title: 'అల్టిమేట్ 4S హీరో క్విజ్',
    lvl7_desc: 'నాలుగు స్ట్రీమ్‌లపై 10 కీలక ప్రశ్నలు. 80%+ సాధించి అధికారిక MMC సర్టిఫికెట్ సాధించండి!',
    btn_play_mission: 'మిషన్ ఆడండి',
    btn_start_final: 'క్విజ్ ప్రారంభించండి',
    results_title: 'ఛాలెంజ్ పూర్తయింది!',
    res_score: 'స్కోర్',
    res_accuracy: 'ఖచ్చితత్వం',
    res_correct: 'సరైనవి',
    res_incorrect: 'తప్పులు',
    res_cert_unlocked: 'అధికారిక సర్టిఫికెట్ అన్‌లాక్ అయింది!',
    res_cert_desc: 'అభినందనలు! మీరు 80% లేదా అంతకంటే ఎక్కువ సాధించారు. మీ అధికారిక MMC సర్టిఫికెట్ సిద్ధంగా ఉంది.',
    res_retry_title: 'ఇంకొంచెం ప్రయత్నించండి!',
    res_retry_desc: 'సర్టిఫికెట్ పొందడానికి 80% స్కోర్ అవసరం. తప్పు సమాధానాలను సమీక్షించి మళ్ళీ ప్రయత్నించండి!',
    btn_view_certificate: 'సర్టిఫికెట్ పొందండి',
    btn_try_missed: 'తప్పు ప్రశ్నలను మళ్లీ ఆడండి',
    btn_play_more_levels: 'మరిన్ని లెవెల్స్',
    btn_leaderboard: 'లీడర్‌బోర్డ్',
    btn_share_score: 'స్కోర్ షేర్ చేయండి',
    cert_title: 'అభినందన పత్రం (సర్టిఫికెట్)',
    cert_subtitle: 'మల్కాజ్‌గిరి మున్సిపల్ కార్పొరేషన్ 4S హీరో సోర్స్ సెగ్రిగేషన్ ఛాలెంజ్',
    btn_download_png: 'డౌన్‌లోడ్ PNG',
    btn_print_pdf: 'ప్రింట్ / PDF',
    cert_unique_id: 'ప్రత్యేక సర్టిఫికెట్ ID',
    btn_verify_online: 'ఆన్‌లైన్‌లో ధృవీకరించండి',
    leaderboard_title: '4S హీరో లీడర్‌బోర్డ్',
    leaderboard_desc: 'మల్కాజ్‌గిరి మున్సిపల్ కార్పొరేషన్‌లో అత్యుత్తమ ఛాంపియన్లు',
    top_heroes_title: 'టాప్ 4S హీరోలు',
    top_orgs_title: 'టాప్ పాఠశాలలు & RWAs',
    contact_title: 'మల్కాజ్‌గిరి మున్సిపల్ కార్పొరేషన్‌ను సంప్రదించండి',
    contact_desc: 'పారిశుధ్య అధికారులతో మాట్లాడండి, చెత్త ప్రాంతాలను నివేదించండి లేదా అవగాహన సదస్సులను అభ్యర్థించండి.',
    social_title: 'అధికారిక సోషల్ మీడియా'
  }
};

// Web Audio Sound Synthesizer (Zero external dependencies)
function playSound(type) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'correct') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } else if (type === 'wrong') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } else if (type === 'level-up') {
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const noteOsc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        noteOsc.connect(noteGain);
        noteGain.connect(ctx.destination);
        noteOsc.frequency.value = freq;
        noteGain.gain.setValueAtTime(0.15, ctx.currentTime + idx * 0.1);
        noteGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + idx * 0.1 + 0.2);
        noteOsc.start(ctx.currentTime + idx * 0.1);
        noteOsc.stop(ctx.currentTime + idx * 0.1 + 0.2);
      });
    }
  } catch (e) {
    // Audio context not allowed or unsupported
  }
}

// Language Switcher
function setLanguage(lang) {
  state.currentLang = lang;
  document.body.classList.toggle('lang-te', lang === 'te');

  // Update button active state
  document.getElementById('btnLangEn').className = lang === 'en' 
    ? 'px-2.5 py-1 text-xs font-bold rounded-lg transition bg-white text-emerald-700 shadow-sm'
    : 'px-2.5 py-1 text-xs font-bold rounded-lg transition text-slate-600 hover:text-emerald-700';

  document.getElementById('btnLangTe').className = lang === 'te'
    ? 'px-2.5 py-1 text-xs font-bold rounded-lg transition bg-white text-emerald-700 shadow-sm'
    : 'px-2.5 py-1 text-xs font-bold rounded-lg transition text-slate-600 hover:text-emerald-700';

  // Apply translations to all DOM elements with data-i18n
  const dict = i18n[lang] || i18n.en;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (dict[key]) {
      el.textContent = dict[key];
    }
  });

  // Re-render active level if currently playing so questions translate seamlessly!
  if (state.currentLevel && !document.getElementById('view-game-active').classList.contains('hidden')) {
    renderCurrentQuestion();
  }
}

// View Router
function navigateTo(viewId) {
  const views = ['home', 'register', 'game-hub', 'game-active', 'results', 'certificate', 'leaderboard', 'contact'];
  views.forEach(v => {
    const el = document.getElementById(`view-${v}`);
    if (el) el.classList.add('hidden');
  });

  const target = document.getElementById(`view-${viewId}`);
  if (target) {
    target.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Update nav CTA
  const navCta = document.getElementById('navCtaBtn');
  if (state.participant) {
    navCta.innerHTML = '<i class="fa-solid fa-gamepad"></i> Game Hub';
    navCta.onclick = () => navigateTo('game-hub');
  } else {
    navCta.innerHTML = '<i class="fa-solid fa-play"></i> Play Now';
    navCta.onclick = () => navigateTo('register');
  }

  if (viewId === 'leaderboard') loadLeaderboard();
  if (viewId === 'contact') loadContactInfo();
}

function scrollToSection(id) {
  if (document.getElementById('view-home').classList.contains('hidden')) {
    navigateTo('home');
    setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  } else {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }
}

// Bootstrap Initialization
async function initApp() {
  try {
    const res = await fetch('/api/bootstrap');
    const data = await res.json();
    state.settings = data.settings || {};
    state.contacts = data.contacts || [];
    state.logos = data.logos || [];
    state.streams = data.streams || [];

    // Load active circles for registration
    loadCircles();
    // Load home statistics
    loadStats();

    // Check saved participant session in localStorage
    const saved = localStorage.getItem('mmc_4s_participant');
    if (saved) {
      try {
        state.participant = JSON.parse(saved);
        updateHUD();
      } catch (e) {}
    }
  } catch (err) {
    console.error('Bootstrap error:', err);
  }

  // Register PWA Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
}

// Load Live Statistics
async function loadStats() {
  try {
    const res = await fetch('/api/admin/stats');
    if (res.ok) {
      const data = await res.json();
      if (data.kpis) {
        document.getElementById('statParticipants').textContent = data.kpis.totalParticipants.toLocaleString();
        document.getElementById('statCompletions').textContent = data.kpis.totalCompletions.toLocaleString();
        document.getElementById('statCertificates').textContent = data.kpis.totalCertificates.toLocaleString();
        document.getElementById('statAvgScore').textContent = `${data.kpis.avgScore} Pts`;
      }
    }
  } catch (e) {}
}

// Registration Dependent Dropdowns
async function loadCircles() {
  try {
    const res = await fetch('/api/circles/active');
    const data = await res.json();
    const sel = document.getElementById('regCircle');
    sel.innerHTML = '<option value="">Select Circle</option>';
    data.circles.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = state.currentLang === 'te' ? c.name_te : c.name;
      sel.appendChild(opt);
    });
  } catch (err) {
    console.error('Failed to load circles:', err);
  }
}

async function handleCircleChange(circleId) {
  const wardSel = document.getElementById('regWard');
  const areaSel = document.getElementById('regArea');

  wardSel.innerHTML = '<option value="">Loading Wards...</option>';
  wardSel.disabled = true;
  areaSel.innerHTML = '<option value="">Select Ward First</option>';
  areaSel.disabled = true;

  if (!circleId) {
    wardSel.innerHTML = '<option value="">Select Circle First</option>';
    return;
  }

  try {
    const res = await fetch(`/api/wards/active?circle_id=${circleId}`);
    const data = await res.json();
    wardSel.innerHTML = '<option value="">Select Ward</option>';
    data.wards.forEach(w => {
      const opt = document.createElement('option');
      opt.value = w.id;
      opt.textContent = `Ward ${w.ward_number} - ${state.currentLang === 'te' ? w.name_te : w.name}`;
      wardSel.appendChild(opt);
    });
    wardSel.disabled = false;
  } catch (err) {
    wardSel.innerHTML = '<option value="">Error loading wards</option>';
  }
}

async function handleWardChange(wardId) {
  const areaSel = document.getElementById('regArea');
  areaSel.innerHTML = '<option value="">Loading Areas...</option>';
  areaSel.disabled = true;

  if (!wardId) {
    areaSel.innerHTML = '<option value="">Select Ward First</option>';
    return;
  }

  try {
    const res = await fetch(`/api/areas/active?ward_id=${wardId}`);
    const data = await res.json();
    areaSel.innerHTML = '<option value="">Select Area / Locality (Optional)</option>';
    data.areas.forEach(a => {
      const opt = document.createElement('option');
      opt.value = a.id;
      opt.textContent = `${state.currentLang === 'te' ? a.name_te : a.name} (${a.pincode})`;
      areaSel.appendChild(opt);
    });
    areaSel.disabled = false;
  } catch (err) {
    areaSel.innerHTML = '<option value="">Error loading areas</option>';
  }
}

// Registration Submit Handler
async function handleRegistrationSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById('btnSubmitReg');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Registering...';

  const payload = {
    name: document.getElementById('regName').value,
    age_group: document.getElementById('regAgeGroup').value,
    gender: document.getElementById('regGender').value,
    category: document.getElementById('regCategory').value,
    organisation: document.getElementById('regOrg').value,
    circle_id: document.getElementById('regCircle').value,
    ward_id: document.getElementById('regWard').value,
    area_id: document.getElementById('regArea').value || null,
    mobile: document.getElementById('regMobile').value,
    email: document.getElementById('regEmail').value
  };

  try {
    const res = await fetch('/api/participants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (data.success && data.participant) {
      state.participant = data.participant;
      localStorage.setItem('mmc_4s_participant', JSON.stringify(data.participant));
      updateHUD();
      navigateTo('game-hub');
    } else {
      alert(data.error || 'Failed to register. Please check your inputs.');
    }
  } catch (err) {
    alert('Server connection error. Please try again.');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-flag-checkered text-lg"></i> Start 4S HERO Challenge';
  }
}

function updateHUD() {
  if (!state.participant) return;
  document.getElementById('hudPlayerName').textContent = state.participant.name;
  document.getElementById('hudPlayerDetails').textContent = `${state.participant.category} • ${state.participant.ward_name || 'Malkajgiri'}`;
  document.getElementById('hudScore').textContent = state.score;
  document.getElementById('hudStreakVal').textContent = state.streak;
  document.getElementById('hudRank').textContent = state.rank;
}

// -------------------------------------------------------------
// GAME HUB & LEVEL CONTROLLER
// -------------------------------------------------------------

async function startLevel(lvlNumber) {
  if (!state.participant) {
    alert('Please enter your participant details to start the challenge!');
    navigateTo('register');
    return;
  }

  state.currentLevel = lvlNumber;
  state.currentQuestionIndex = 0;
  state.currentQuestions = [];
  clearInterval(state.timerInterval);

  const container = document.getElementById('levelContentArea');
  container.innerHTML = `
    <div class="text-center py-12">
      <i class="fa-solid fa-circle-notch fa-spin text-4xl text-emerald-600 mb-3"></i>
      <p class="text-sm font-bold text-slate-600">Preparing Level ${lvlNumber} Mission...</p>
    </div>
  `;

  document.getElementById('activeLevelBadge').textContent = `LEVEL ${lvlNumber}`;
  const titles = {
    1: 'Which Bin? – Tap the Right Bin',
    2: 'Drag & Drop Waste Objects',
    3: 'Rapid Fire – Timed Classification',
    4: 'Spot the Mistake – Inspection Challenge',
    5: 'Match the Waste – Card Pairs',
    6: 'Clean Malkajgiri – Street Cleanup',
    7: 'Ultimate 4S HERO Certification Quiz'
  };
  document.getElementById('activeLevelTitle').textContent = titles[lvlNumber] || `Level ${lvlNumber}`;
  document.getElementById('activeScoreVal').textContent = state.score;

  // Toggle timer badge for Level 3
  const timerBadge = document.getElementById('activeTimerContainer');
  if (lvlNumber === 3) {
    timerBadge.classList.remove('hidden');
    timerBadge.classList.add('flex');
  } else {
    timerBadge.classList.add('hidden');
    timerBadge.classList.remove('flex');
  }

  navigateTo('game-active');

  try {
    const res = await fetch(`/api/game/items?level=${lvlNumber}`);
    const data = await res.json();

    if (lvlNumber === 1 || lvlNumber === 3) {
      state.currentQuestions = data.items || [];
      renderWhichBinQuestion();
    } else if (lvlNumber === 2) {
      renderDragAndDropLevel(data.items, data.streams);
    } else if (lvlNumber === 4) {
      renderSpotMistakeLevel(data.scenarios);
    } else if (lvlNumber === 5) {
      renderMatchWasteLevel(data.pairs);
    } else if (lvlNumber === 6) {
      renderCleanMalkajgiriLevel(data.scenes);
    } else if (lvlNumber === 7) {
      state.currentQuestions = data.questions || [];
      renderFinalQuizQuestion();
    }
  } catch (err) {
    container.innerHTML = '<p class="text-rose-600 text-center py-8">Failed to load level items. Please retry.</p>';
  }
}

// LEVEL 1 & 3: Which Bin? & Rapid Fire
function renderWhichBinQuestion() {
  const container = document.getElementById('levelContentArea');
  const total = state.currentQuestions.length;
  const qIdx = state.currentQuestionIndex;

  if (qIdx >= total) {
    finishLevel();
    return;
  }

  document.getElementById('activeProgressCount').textContent = `${qIdx + 1} / ${total}`;

  const item = state.currentQuestions[qIdx];
  const isTelugu = state.currentLang === 'te';
  const itemName = isTelugu ? item.name_te : item.name;
  const itemExp = isTelugu ? item.explanation_te : item.explanation;

  // Reset & start timer for Level 3
  if (state.currentLevel === 3) {
    clearInterval(state.timerInterval);
    state.timeLeft = 10;
    document.getElementById('activeTimerVal').textContent = `${state.timeLeft}s`;
    state.timerInterval = setInterval(() => {
      state.timeLeft--;
      document.getElementById('activeTimerVal').textContent = `${state.timeLeft}s`;
      if (state.timeLeft <= 0) {
        clearInterval(state.timerInterval);
        handleAnswer(null, item.stream_code, itemExp, itemName);
      }
    }, 1000);
  }

  container.innerHTML = `
    <div class="text-center space-y-6">
      <!-- Item Card Display -->
      <div class="bg-gradient-to-b from-slate-50 to-emerald-50/40 p-6 rounded-3xl border border-slate-200 shadow-sm max-w-md mx-auto">
        <div class="w-20 h-20 bg-white rounded-2xl mx-auto flex items-center justify-center text-4xl text-emerald-700 shadow-md border border-slate-100 mb-3">
          <i class="fa-solid ${item.image_icon || 'fa-trash'}"></i>
        </div>
        <span class="text-xs font-bold uppercase tracking-wider text-slate-400">${item.category || 'Waste Item'}</span>
        <h3 class="text-2xl font-black text-slate-900 mt-1">${itemName}</h3>
        <p class="text-xs text-slate-500 mt-1">Which bin does this item belong to?</p>
      </div>

      <!-- 4 Stream Bin Selection Buttons -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto pt-2">
        <!-- GREEN BIN -->
        <button onclick="handleAnswer('WET', '${item.stream_code}', '${encodeURIComponent(itemExp)}', '${encodeURIComponent(itemName)}')" class="bin-wet text-white p-4 rounded-2xl flex flex-col items-center justify-center gap-2 hover:scale-105 active:scale-95 transition shadow-lg group">
          <div class="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-2xl group-hover:scale-110 transition">
            <i class="fa-solid fa-apple-whole"></i>
          </div>
          <span class="text-xs font-black uppercase tracking-wider">GREEN BIN</span>
          <span class="text-[11px] font-bold text-green-100">Wet Waste / తడి</span>
        </button>

        <!-- BLUE BIN -->
        <button onclick="handleAnswer('DRY', '${item.stream_code}', '${encodeURIComponent(itemExp)}', '${encodeURIComponent(itemName)}')" class="bin-dry text-white p-4 rounded-2xl flex flex-col items-center justify-center gap-2 hover:scale-105 active:scale-95 transition shadow-lg group">
          <div class="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-2xl group-hover:scale-110 transition">
            <i class="fa-solid fa-box-open"></i>
          </div>
          <span class="text-xs font-black uppercase tracking-wider">BLUE BIN</span>
          <span class="text-[11px] font-bold text-blue-100">Dry Waste / పొడి</span>
        </button>

        <!-- RED BIN -->
        <button onclick="handleAnswer('SANITARY', '${item.stream_code}', '${encodeURIComponent(itemExp)}', '${encodeURIComponent(itemName)}')" class="bin-sanitary text-white p-4 rounded-2xl flex flex-col items-center justify-center gap-2 hover:scale-105 active:scale-95 transition shadow-lg group">
          <div class="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-2xl group-hover:scale-110 transition">
            <i class="fa-solid fa-shield-halved"></i>
          </div>
          <span class="text-xs font-black uppercase tracking-wider">RED BIN</span>
          <span class="text-[11px] font-bold text-red-100">Sanitary / శానిటరీ</span>
        </button>

        <!-- BLACK BIN -->
        <button onclick="handleAnswer('SPECIAL', '${item.stream_code}', '${encodeURIComponent(itemExp)}', '${encodeURIComponent(itemName)}')" class="bin-special text-white p-4 rounded-2xl flex flex-col items-center justify-center gap-2 hover:scale-105 active:scale-95 transition shadow-lg group">
          <div class="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-2xl group-hover:scale-110 transition">
            <i class="fa-solid fa-biohazard"></i>
          </div>
          <span class="text-xs font-black uppercase tracking-wider">BLACK BIN</span>
          <span class="text-[11px] font-bold text-slate-300">Special / స్పెషల్</span>
        </button>
      </div>
    </div>
  `;
}

function handleAnswer(selectedCode, correctCode, encodedExp, encodedItemName) {
  clearInterval(state.timerInterval);
  const exp = decodeURIComponent(encodedExp);
  const itemName = decodeURIComponent(encodedItemName);
  const isCorrect = selectedCode === correctCode;

  if (isCorrect) {
    playSound('correct');
    state.streak++;
    if (state.streak > state.maxStreak) state.maxStreak = state.streak;

    // +10 points base, +5 streak bonus for 3+ streak
    const bonus = state.streak >= 3 ? 5 : 0;
    state.score += (10 + bonus);
    state.correctCount++;

    // Small celebratory confetti burst for streaks
    if (state.streak >= 3 && window.confetti) {
      window.confetti({ particleCount: 30, spread: 60, origin: { y: 0.8 } });
    }
  } else {
    playSound('wrong');
    state.streak = 0;
    state.incorrectCount++;
    state.missedQuestions.push({
      item: itemName,
      correctCode,
      explanation: exp
    });
  }

  updateHUD();
  document.getElementById('activeScoreVal').textContent = state.score;

  // Show Educational Feedback Modal
  showExplanationModal(isCorrect, itemName, correctCode, exp);
}

function showExplanationModal(isCorrect, itemName, correctCode, exp) {
  const modal = document.getElementById('explanationModal');
  const icon = document.getElementById('expModalIcon');
  const title = document.getElementById('expModalTitle');
  const text = document.getElementById('expModalText');

  const streamNames = {
    WET: 'Green Bin (Wet Waste / తడి చెత్త)',
    DRY: 'Blue Bin (Dry Waste / పొడి చెత్త)',
    SANITARY: 'Red Bin (Sanitary Waste / శానిటరీ)',
    SPECIAL: 'Black Bin (Special Care / స్పెషల్ కేర్)'
  };

  if (isCorrect) {
    icon.className = 'w-16 h-16 rounded-full mx-auto flex items-center justify-center text-3xl font-black bg-emerald-100 text-emerald-600';
    icon.innerHTML = '<i class="fa-solid fa-check"></i>';
    title.textContent = state.streak >= 3 ? `Superb! Streak x${state.streak}! 🔥` : 'Spot On! +10 Points!';
    title.className = 'text-xl font-black text-emerald-800';
  } else {
    icon.className = 'w-16 h-16 rounded-full mx-auto flex items-center justify-center text-3xl font-black bg-rose-100 text-rose-600';
    icon.innerHTML = '<i class="fa-solid fa-xmark"></i>';
    title.textContent = `Oops! Belongs in ${streamNames[correctCode] || correctCode}`;
    title.className = 'text-xl font-black text-rose-800';
  }

  text.innerHTML = `<strong>${itemName}</strong>: ${exp}`;
  modal.classList.remove('hidden');
}

function dismissExplanationModal() {
  document.getElementById('explanationModal').classList.add('hidden');
  state.currentQuestionIndex++;
  if (state.currentLevel === 1 || state.currentLevel === 3) {
    renderWhichBinQuestion();
  } else if (state.currentLevel === 7) {
    renderFinalQuizQuestion();
  }
}

// -------------------------------------------------------------
// LEVEL 2: DRAG & DROP (Touch & Mouse Support)
// -------------------------------------------------------------
function renderDragAndDropLevel(items, streams) {
  const container = document.getElementById('levelContentArea');
  const itemQueue = [...(items || [])];
  let remainingCount = itemQueue.length;

  document.getElementById('activeProgressCount').textContent = `Remaining: ${remainingCount}`;

  container.innerHTML = `
    <div class="space-y-6 select-none">
      <div class="text-center">
        <h4 class="text-lg font-black text-slate-900">Drag each object into the correct bin</h4>
        <p class="text-xs text-slate-500">Touch and hold on mobile or drag with mouse</p>
      </div>

      <!-- Draggable Items Shelf -->
      <div id="dragItemsShelf" class="flex flex-wrap items-center justify-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 min-h-[100px]">
        <!-- Populated below -->
      </div>

      <!-- 4 Target Bins -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
        <!-- Green Wet Bin -->
        <div data-stream="WET" class="drop-target bin-wet text-white p-4 rounded-2xl flex flex-col items-center justify-center gap-2 border-2 border-transparent transition min-h-[140px]">
          <i class="fa-solid fa-apple-whole text-3xl"></i>
          <span class="text-xs font-black uppercase">GREEN BIN</span>
          <span class="text-[10px] text-green-100">Wet Waste</span>
        </div>

        <!-- Blue Dry Bin -->
        <div data-stream="DRY" class="drop-target bin-dry text-white p-4 rounded-2xl flex flex-col items-center justify-center gap-2 border-2 border-transparent transition min-h-[140px]">
          <i class="fa-solid fa-box-open text-3xl"></i>
          <span class="text-xs font-black uppercase">BLUE BIN</span>
          <span class="text-[10px] text-blue-100">Dry Waste</span>
        </div>

        <!-- Red Sanitary Bin -->
        <div data-stream="SANITARY" class="drop-target bin-sanitary text-white p-4 rounded-2xl flex flex-col items-center justify-center gap-2 border-2 border-transparent transition min-h-[140px]">
          <i class="fa-solid fa-shield-halved text-3xl"></i>
          <span class="text-xs font-black uppercase">RED BIN</span>
          <span class="text-[10px] text-red-100">Sanitary Waste</span>
        </div>

        <!-- Black Special Care Bin -->
        <div data-stream="SPECIAL" class="drop-target bin-special text-white p-4 rounded-2xl flex flex-col items-center justify-center gap-2 border-2 border-transparent transition min-h-[140px]">
          <i class="fa-solid fa-biohazard text-3xl"></i>
          <span class="text-xs font-black uppercase">BLACK BIN</span>
          <span class="text-[10px] text-slate-300">Special Care</span>
        </div>
      </div>
    </div>
  `;

  const shelf = document.getElementById('dragItemsShelf');
  itemQueue.slice(0, 5).forEach((item, idx) => {
    const el = createDraggableElement(item);
    shelf.appendChild(el);
  });

  setupDragAndDropHandlers();
}

function createDraggableElement(item) {
  const isTelugu = state.currentLang === 'te';
  const name = isTelugu ? item.name_te : item.name;
  const exp = isTelugu ? item.explanation_te : item.explanation;

  const div = document.createElement('div');
  div.className = 'draggable-item bg-white text-slate-900 px-4 py-2.5 rounded-xl shadow-md border-2 border-slate-200 text-xs font-extrabold flex items-center gap-2 cursor-grab active:cursor-grabbing hover:border-emerald-500';
  div.setAttribute('draggable', 'true');
  div.setAttribute('data-stream', item.stream_code);
  div.setAttribute('data-name', name);
  div.setAttribute('data-exp', exp);
  div.innerHTML = `<i class="fa-solid ${item.image_icon || 'fa-trash'} text-emerald-600"></i> ${name}`;
  return div;
}

function setupDragAndDropHandlers() {
  const draggables = document.querySelectorAll('.draggable-item');
  const dropTargets = document.querySelectorAll('.drop-target');

  let draggedEl = null;

  draggables.forEach(item => {
    // HTML5 Drag Events for Desktop
    item.addEventListener('dragstart', (e) => {
      draggedEl = item;
      e.dataTransfer.setData('text/plain', item.getAttribute('data-stream'));
      item.classList.add('opacity-50');
    });

    item.addEventListener('dragend', () => {
      item.classList.remove('opacity-50');
      draggedEl = null;
    });

    // Touch Events for Mobile Screen Drag & Drop
    let touchStartX = 0;
    let touchStartY = 0;
    let origParent = null;

    item.addEventListener('touchstart', (e) => {
      const touch = e.touches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      draggedEl = item;
      origParent = item.parentNode;
      item.style.position = 'relative';
      item.style.zIndex = '1000';
    }, { passive: false });

    item.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const dx = touch.clientX - touchStartX;
      const dy = touch.clientY - touchStartY;
      item.style.transform = `translate(${dx}px, ${dy}px) scale(1.08)`;

      // Highlight target under touch
      const elemBelow = document.elementFromPoint(touch.clientX, touch.clientY);
      const target = elemBelow?.closest('.drop-target');
      dropTargets.forEach(dt => dt.classList.remove('drag-over'));
      if (target) target.classList.add('drag-over');
    }, { passive: false });

    item.addEventListener('touchend', (e) => {
      const touch = e.changedTouches[0];
      const elemBelow = document.elementFromPoint(touch.clientX, touch.clientY);
      const target = elemBelow?.closest('.drop-target');

      dropTargets.forEach(dt => dt.classList.remove('drag-over'));
      item.style.position = '';
      item.style.transform = '';
      item.style.zIndex = '';

      if (target) {
        handleDrop(item, target.getAttribute('data-stream'));
      }
    });
  });

  dropTargets.forEach(target => {
    target.addEventListener('dragover', (e) => {
      e.preventDefault();
      target.classList.add('drag-over');
    });

    target.addEventListener('dragleave', () => {
      target.classList.remove('drag-over');
    });

    target.addEventListener('drop', (e) => {
      e.preventDefault();
      target.classList.remove('drag-over');
      if (draggedEl) {
        handleDrop(draggedEl, target.getAttribute('data-stream'));
      }
    });
  });

  function handleDrop(itemEl, targetStream) {
    const itemStream = itemEl.getAttribute('data-stream');
    const itemName = itemEl.getAttribute('data-name');
    const itemExp = itemEl.getAttribute('data-exp');
    const isCorrect = itemStream === targetStream;

    if (isCorrect) {
      playSound('correct');
      state.score += 10;
      state.correctCount++;
      state.streak++;
      itemEl.remove();

      // Check if more items in level
      const shelf = document.getElementById('dragItemsShelf');
      if (shelf && shelf.children.length === 0) {
        playSound('level-up');
        finishLevel();
      }
    } else {
      playSound('wrong');
      state.streak = 0;
      state.incorrectCount++;
      showExplanationModal(false, itemName, itemStream, itemExp);
    }

    updateHUD();
    document.getElementById('activeScoreVal').textContent = state.score;
  }
}

// -------------------------------------------------------------
// LEVEL 4: SPOT THE MISTAKE
// -------------------------------------------------------------
function renderSpotMistakeLevel(scenarios) {
  const container = document.getElementById('levelContentArea');
  let currentScenarioIdx = 0;

  function showScenario(idx) {
    if (idx >= scenarios.length) {
      finishLevel();
      return;
    }

    const sc = scenarios[idx];
    const isTe = state.currentLang === 'te';
    const title = isTe ? sc.title_te : sc.title;
    const binName = isTe ? sc.bin.name_te : sc.bin.name;

    document.getElementById('activeProgressCount').textContent = `Scenario ${idx + 1} / ${scenarios.length}`;

    container.innerHTML = `
      <div class="space-y-6">
        <div class="text-center">
          <span class="text-xs font-black uppercase text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-200">
            Inspector Challenge
          </span>
          <h4 class="text-xl font-black text-slate-900 mt-2">${title}</h4>
          <p class="text-xs text-slate-500">
            One item in this <strong>${binName}</strong> is misplaced and dangerous. Click the mistake!
          </p>
        </div>

        <div class="grid grid-cols-2 gap-4 max-w-lg mx-auto">
          ${sc.items.map((it, itemIdx) => `
            <button onclick="handleSpotSelection(${idx}, ${itemIdx})" class="p-5 rounded-2xl bg-slate-50 border-2 border-slate-200 hover:border-amber-500 hover:shadow-lg transition text-left flex items-center gap-3 group">
              <div class="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-xl text-slate-700 shadow-sm border border-slate-100 group-hover:scale-110 transition">
                <i class="fa-solid ${it.icon || 'fa-trash'}"></i>
              </div>
              <div>
                <p class="text-xs font-extrabold text-slate-900">${isTe ? it.name_te : it.name}</p>
                <span class="text-[10px] text-slate-400 font-semibold">Inspect item</span>
              </div>
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }

  window.handleSpotSelection = (scIdx, itemIdx) => {
    const sc = scenarios[scIdx];
    const it = sc.items[itemIdx];

    if (it.is_mistake) {
      playSound('correct');
      state.score += 20;
      state.correctCount++;
      state.streak += 2;
      alert(`Correct! You spotted the violation: ${it.name} does NOT belong here. ${it.reason}`);
      showScenario(scIdx + 1);
    } else {
      playSound('wrong');
      state.incorrectCount++;
      state.streak = 0;
      alert(`Incorrect! ${it.name} is correctly placed in this stream.`);
    }

    updateHUD();
    document.getElementById('activeScoreVal').textContent = state.score;
  };

  showScenario(0);
}

// -------------------------------------------------------------
// LEVEL 5: MATCH THE WASTE
// -------------------------------------------------------------
function renderMatchWasteLevel(pairs) {
  const container = document.getElementById('levelContentArea');
  let selectedItem = null;
  let matchesFound = 0;
  const totalMatches = pairs.length;

  const shuffledItems = [...pairs].sort(() => Math.random() - 0.5);
  const shuffledStreams = [
    { code: 'WET', name: 'Green Bin (Wet)', color: '#16a34a' },
    { code: 'DRY', name: 'Blue Bin (Dry)', color: '#2563eb' },
    { code: 'SANITARY', name: 'Red Bin (Sanitary)', color: '#dc2626' },
    { code: 'SPECIAL', name: 'Black Bin (Special Care)', color: '#1f2937' }
  ];

  container.innerHTML = `
    <div class="space-y-6">
      <div class="text-center">
        <h4 class="text-lg font-black text-slate-900">Match Waste Cards to Streams</h4>
        <p class="text-xs text-slate-500">Tap an item card on the left, then tap its matching stream on the right</p>
      </div>

      <div class="grid grid-cols-2 gap-6 max-w-lg mx-auto">
        <!-- Waste Items Column -->
        <div class="space-y-3" id="matchItemsCol">
          ${shuffledItems.map((p, idx) => `
            <div data-match-stream="${p.stream}" onclick="selectMatchItem(this)" class="match-item-card p-3 bg-white border-2 border-slate-200 rounded-xl text-xs font-bold text-slate-800 shadow-sm cursor-pointer hover:border-emerald-500 transition">
              ${state.currentLang === 'te' ? p.item_te : p.item}
            </div>
          `).join('')}
        </div>

        <!-- Streams Column -->
        <div class="space-y-3">
          ${shuffledStreams.map(s => `
            <div onclick="selectMatchTarget('${s.code}')" class="p-3 text-white rounded-xl text-xs font-extrabold shadow-sm cursor-pointer hover:scale-105 transition" style="background-color: ${s.color};">
              ${s.name}
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  window.selectMatchItem = (el) => {
    document.querySelectorAll('.match-item-card').forEach(c => c.classList.remove('ring-2', 'ring-emerald-500', 'bg-emerald-50'));
    selectedItem = el;
    el.classList.add('ring-2', 'ring-emerald-500', 'bg-emerald-50');
  };

  window.selectMatchTarget = (streamCode) => {
    if (!selectedItem) {
      alert('Please select a waste item first!');
      return;
    }

    const itemStream = selectedItem.getAttribute('data-match-stream');
    if (itemStream === streamCode) {
      playSound('correct');
      state.score += 10;
      state.correctCount++;
      matchesFound++;
      selectedItem.classList.add('opacity-30', 'pointer-events-none', 'line-through');
      selectedItem.classList.remove('ring-2', 'ring-emerald-500', 'bg-emerald-50');
      selectedItem = null;

      if (matchesFound >= totalMatches) {
        playSound('level-up');
        finishLevel();
      }
    } else {
      playSound('wrong');
      state.incorrectCount++;
      state.streak = 0;
      alert('Mismatch! Try again.');
    }

    updateHUD();
    document.getElementById('activeScoreVal').textContent = state.score;
  };
}

// -------------------------------------------------------------
// LEVEL 6: CLEAN MALKAJGIRI (Neighborhood Cleaning Challenge)
// -------------------------------------------------------------
function renderCleanMalkajgiriLevel(scenes) {
  const container = document.getElementById('levelContentArea');
  let sceneIdx = 0;

  function showScene(idx) {
    if (idx >= scenes.length) {
      finishLevel();
      return;
    }

    const sc = scenes[idx];
    const isTe = state.currentLang === 'te';
    const sceneName = isTe ? sc.name_te : sc.name;
    let litterRemaining = sc.litter.length;

    container.innerHTML = `
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <h4 class="text-base font-black text-slate-900">${sceneName}</h4>
            <p class="text-xs text-slate-500">Pick up litter from the road and segregate to green the neighborhood!</p>
          </div>
          <span id="litterRemainingBadge" class="text-xs font-bold bg-amber-100 text-amber-900 px-3 py-1 rounded-full">
            ${litterRemaining} litter items
          </span>
        </div>

        <!-- Interactive Scene Canvas Container -->
        <div id="malkajgiriScene" class="scene-container scene-dirty relative w-full h-72 sm:h-80 rounded-3xl overflow-hidden border-2 border-slate-300 shadow-inner bg-gradient-to-b from-sky-200 via-emerald-100 to-amber-100">
          <!-- Background Decor Elements -->
          <div class="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] opacity-20"></div>
          <div class="absolute top-4 left-6 text-2xl text-amber-400"><i class="fa-solid fa-sun animate-spin" style="animation-duration: 20s;"></i></div>
          
          <!-- Road/Street -->
          <div class="absolute bottom-0 left-0 right-0 h-28 bg-slate-700 border-t-4 border-slate-600 flex items-center justify-center">
            <div class="w-full border-b-2 border-dashed border-amber-300"></div>
          </div>

          <!-- Scatter Litter Items -->
          ${sc.litter.map(l => `
            <div id="${l.id}" onclick="pickUpLitter('${l.id}', '${l.correct_stream}', '${l.name}')" class="absolute cursor-pointer transform hover:scale-125 transition active:scale-95 bg-white/90 p-2 rounded-xl shadow-lg border border-slate-300 text-slate-800 text-xs font-bold flex items-center gap-1.5" style="left: ${l.x}%; top: ${l.y}%;">
              <i class="fa-solid ${l.icon} text-emerald-700"></i>
              <span class="hidden sm:inline">${isTe ? l.name_te : l.name}</span>
            </div>
          `).join('')}

          <!-- Cleanliness Mascot Celebration Indicator -->
          <div id="sceneCelebration" class="hidden absolute inset-0 bg-emerald-600/20 backdrop-blur-[2px] flex items-center justify-center text-center p-4">
            <div class="bg-white p-6 rounded-3xl shadow-2xl border border-emerald-200 space-y-2 max-w-xs">
              <div class="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full mx-auto flex items-center justify-center text-2xl font-black">
                <i class="fa-solid fa-seedling"></i>
              </div>
              <h5 class="text-base font-extrabold text-slate-900">Area Cleaned & Greened!</h5>
              <p class="text-xs text-slate-600">Great segregation! Malkajgiri looks cleaner!</p>
              <button onclick="nextCleanScene(${idx + 1})" class="bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-xl">Next Area</button>
            </div>
          </div>
        </div>
      </div>
    `;

    window.pickUpLitter = (id, correctStream, name) => {
      const chosen = prompt(`Which stream for "${name}"?\nType 1 for Green (Wet)\nType 2 for Blue (Dry)\nType 3 for Red (Sanitary)\nType 4 for Black (Special Care)`);
      const map = { '1': 'WET', '2': 'DRY', '3': 'SANITARY', '4': 'SPECIAL' };
      if (!chosen || !map[chosen]) return;

      if (map[chosen] === correctStream) {
        playSound('correct');
        state.score += 15;
        state.correctCount++;
        document.getElementById(id)?.remove();
        litterRemaining--;
        document.getElementById('litterRemainingBadge').textContent = `${litterRemaining} litter items`;

        if (litterRemaining <= 0) {
          const sceneEl = document.getElementById('malkajgiriScene');
          sceneEl.classList.remove('scene-dirty');
          sceneEl.classList.add('scene-clean');
          document.getElementById('sceneCelebration').classList.remove('hidden');
          playSound('level-up');
        }
      } else {
        playSound('wrong');
        state.incorrectCount++;
        alert(`Wrong bin! ${name} belongs to ${correctStream}`);
      }

      updateHUD();
      document.getElementById('activeScoreVal').textContent = state.score;
    };

    window.nextCleanScene = (nextIdx) => {
      showScene(nextIdx);
    };
  }

  showScene(0);
}

// -------------------------------------------------------------
// FINAL LEVEL: ULTIMATE 4S HERO QUIZ (10 Questions)
// -------------------------------------------------------------
function renderFinalQuizQuestion() {
  const container = document.getElementById('levelContentArea');
  const total = state.currentQuestions.length;
  const qIdx = state.currentQuestionIndex;

  if (qIdx >= total) {
    submitGameResults();
    return;
  }

  document.getElementById('activeProgressCount').textContent = `Question ${qIdx + 1} / ${total}`;

  const q = state.currentQuestions[qIdx];
  const isTe = state.currentLang === 'te';
  const qText = isTe ? q.question_text_te : q.question_text;
  const exp = isTe ? q.explanation_te : q.explanation;

  container.innerHTML = `
    <div class="space-y-6">
      <div class="bg-slate-50 p-6 rounded-3xl border border-slate-200">
        <span class="text-[10px] font-black uppercase text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
          Question ${qIdx + 1} of ${total}
        </span>
        <h3 class="text-lg sm:text-xl font-black text-slate-900 mt-3 leading-snug">${qText}</h3>
      </div>

      <div class="space-y-3 max-w-xl mx-auto">
        ${q.options.map(opt => `
          <button onclick="handleFinalQuizAnswer('${encodeURIComponent(opt)}', '${encodeURIComponent(q.correct_answer)}', '${encodeURIComponent(exp)}')" class="w-full text-left p-4 rounded-2xl bg-white border-2 border-slate-200 hover:border-emerald-600 hover:bg-emerald-50/50 transition font-medium text-xs sm:text-sm text-slate-800 shadow-sm flex items-center justify-between group">
            <span>${opt}</span>
            <i class="fa-solid fa-circle-chevron-right text-slate-300 group-hover:text-emerald-600 transition"></i>
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

function handleFinalQuizAnswer(encodedSelected, encodedCorrect, encodedExp) {
  const selected = decodeURIComponent(encodedSelected);
  const correct = decodeURIComponent(encodedCorrect);
  const exp = decodeURIComponent(encodedExp);
  const isCorrect = selected === correct;

  if (isCorrect) {
    playSound('correct');
    state.score += 10;
    state.correctCount++;
    state.streak++;
  } else {
    playSound('wrong');
    state.streak = 0;
    state.incorrectCount++;
    state.missedQuestions.push({
      item: 'Quiz Scenario',
      correctCode: correct,
      explanation: exp
    });
  }

  updateHUD();
  document.getElementById('activeScoreVal').textContent = state.score;
  showExplanationModal(isCorrect, 'Final Quiz Question', correct, exp);
}

// -------------------------------------------------------------
// FINISH LEVEL & RESULTS
// -------------------------------------------------------------
function finishLevel() {
  if (!state.levelsCompleted.includes(state.currentLevel)) {
    state.levelsCompleted.push(state.currentLevel);
  }

  if (state.currentLevel < 7) {
    alert(`Level ${state.currentLevel} Completed! Great progress, 4S Hero.`);
    navigateTo('game-hub');
  } else {
    submitGameResults();
  }
}

async function submitGameResults() {
  const totalQuestions = state.correctCount + state.incorrectCount;
  const percentage = totalQuestions > 0 ? ((state.correctCount / totalQuestions) * 100) : 0;

  try {
    const res = await fetch('/api/game/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        participant_id: state.participant.id,
        score: state.score,
        max_score: totalQuestions * 10,
        correct_count: state.correctCount,
        incorrect_count: state.incorrectCount,
        streak_max: state.maxStreak,
        stars_earned: Math.min(3, Math.ceil(percentage / 33)),
        rank_title: state.rank,
        level_reached: state.currentLevel,
        completed: 1,
        duration_seconds: 120
      })
    });

    const data = await res.json();
    if (data.success) {
      state.certificateData = data.certificate;
      showResultsView(data);
    }
  } catch (err) {
    console.error('Failed to submit results:', err);
    showResultsView({ score: state.score, percentage: 85, isQualified: true });
  }
}

function showResultsView(data) {
  navigateTo('results');

  const pct = Math.round(data.percentage || 0);
  document.getElementById('resScore').textContent = data.score || state.score;
  document.getElementById('resPercentage').textContent = `${pct}%`;
  document.getElementById('resCorrect').textContent = state.correctCount;
  document.getElementById('resIncorrect').textContent = state.incorrectCount;
  document.getElementById('resultPlayerName').textContent = state.participant?.name || 'Citizen';

  // Determine Rank
  let rank = '4S LEARNER';
  if (pct >= 80) rank = '4S HERO';
  else if (pct >= 70) rank = '4S CHAMPION';
  else if (pct >= 50) rank = 'SEGREGATION STAR';
  state.rank = rank;
  document.getElementById('resultRankBadge').textContent = rank;

  if (data.isQualified || pct >= 80) {
    document.getElementById('qualifySuccessBox').classList.remove('hidden');
    document.getElementById('qualifyRetryBox').classList.add('hidden');
    if (window.confetti) {
      window.confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
    }
  } else {
    document.getElementById('qualifySuccessBox').classList.add('hidden');
    document.getElementById('qualifyRetryBox').classList.remove('hidden');
  }
}

function retryMissedQuestions() {
  if (state.missedQuestions.length === 0) {
    alert('You had no missed questions! Great job.');
    startLevel(1);
    return;
  }
  startLevel(1);
}

function shareScore() {
  const text = `I just scored ${state.score} points on the Malkajgiri Municipal Corporation 4S HERO Waste Segregation Challenge! 🟢 Wet 🔵 Dry 🔴 Sanitary ⚫ Special Care. Take the challenge!`;
  if (navigator.share) {
    navigator.share({ title: '4S HERO Malkajgiri', text, url: window.location.origin });
  } else {
    navigator.clipboard.writeText(text);
    alert('Score copied to clipboard! Share with your friends & neighbors.');
  }
}

// -------------------------------------------------------------
// CERTIFICATE DYNAMIC CANVAS RENDERER & QR CODE
// -------------------------------------------------------------
async function renderCertificate() {
  const canvas = document.getElementById('certificateCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  canvas.width = 1200;
  canvas.height = 850;

  // Background Parchment / Cream
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Outer Border & Gold / Green Accents
  ctx.lineWidth = 14;
  ctx.strokeStyle = '#059669'; // Emerald
  ctx.strokeRect(15, 15, canvas.width - 30, canvas.height - 30);

  ctx.lineWidth = 2;
  ctx.strokeStyle = '#d97706'; // Gold
  ctx.strokeRect(26, 26, canvas.width - 52, canvas.height - 52);

  // Header Title
  ctx.fillStyle = '#064e3b';
  ctx.font = 'bold 22px Poppins, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('MALKAJGIRI MUNICIPAL CORPORATION', canvas.width / 2, 85);

  ctx.fillStyle = '#4b5563';
  ctx.font = '600 13px Poppins, sans-serif';
  ctx.fillText('GOVERNMENT OF TELANGANA • SWACHH BHARAT MISSION (URBAN)', canvas.width / 2, 108);

  // Main Ribbon / Heading
  ctx.fillStyle = '#1e293b';
  ctx.font = '900 38px Poppins, sans-serif';
  ctx.fillText('CERTIFICATE OF ACHIEVEMENT', canvas.width / 2, 175);

  ctx.fillStyle = '#d97706';
  ctx.font = 'bold 16px Poppins, sans-serif';
  ctx.fillText('FOUR STREAMS SOURCE SEGREGATION CHALLENGE', canvas.width / 2, 205);

  // Body Text
  ctx.fillStyle = '#4b5563';
  ctx.font = '500 18px Poppins, sans-serif';
  ctx.fillText('This is to certify that', canvas.width / 2, 265);

  // Participant Name
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 36px Poppins, sans-serif';
  const name = state.participant?.name || 'Citizen Participant';
  ctx.fillText(name.toUpperCase(), canvas.width / 2, 320);

  // Underline
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#059669';
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2 - 250, 335);
  ctx.lineTo(canvas.width / 2 + 250, 335);
  ctx.stroke();

  // Organisation / Category
  ctx.fillStyle = '#047857';
  ctx.font = '600 18px Poppins, sans-serif';
  const org = state.participant?.organisation ? `of ${state.participant.organisation}` : `Category: ${state.participant?.category || 'Citizen'}`;
  ctx.fillText(org, canvas.width / 2, 370);

  // Citation Paragraph
  ctx.fillStyle = '#334155';
  ctx.font = 'normal 17px Poppins, sans-serif';
  ctx.fillText('has successfully completed the 4S HERO – 4 Stream Source Segregation Challenge', canvas.width / 2, 425);
  ctx.fillText('and demonstrated awareness and understanding of responsible 4-stream source segregation.', canvas.width / 2, 455);

  // 4 Streams Color Badges on Certificate
  const streams = [
    { label: '🟢 Wet Waste', color: '#16a34a', x: canvas.width / 2 - 270 },
    { label: '🔵 Dry Waste', color: '#2563eb', x: canvas.width / 2 - 90 },
    { label: '🔴 Sanitary Waste', color: '#dc2626', x: canvas.width / 2 + 90 },
    { label: '⚫ Special Care', color: '#1e293b', x: canvas.width / 2 + 270 }
  ];
  streams.forEach(s => {
    ctx.fillStyle = s.color;
    ctx.font = 'bold 15px Poppins, sans-serif';
    ctx.fillText(s.label, s.x, 510);
  });

  // Unique Certificate ID & Date
  const certId = state.certificateData?.certificate_id || 'MMC-4SH-2026-000001';
  const dateStr = state.certificateData?.issue_date || new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  ctx.fillStyle = '#64748b';
  ctx.font = '600 14px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`Certificate ID: ${certId}`, 70, 715);
  ctx.fillText(`Issue Date: ${dateStr}`, 70, 738);
  ctx.fillText(`Final Score: ${state.score} Points`, 70, 761);

  // Draw QR Code onto Canvas
  const qrCanvas = document.createElement('canvas');
  const baseUrl = window.APP_URL || window.location.origin;
    const verifyUrl = `${baseUrl}/verify/${certId}`;
  if (window.drawQRCodeToCanvas) {
    window.drawQRCodeToCanvas(qrCanvas, verifyUrl, 110);
    ctx.drawImage(qrCanvas, 70, 580, 110, 110);
  }

  // Draw Designated Signature Area and Commissioner Name
  ctx.textAlign = 'right';
  ctx.fillStyle = '#475569';
  ctx.font = '500 14px Poppins, sans-serif';
  ctx.fillText('Issued by', canvas.width - 70, 640);

  // Signature Area line
  ctx.lineWidth = 1;
  ctx.strokeStyle = '#94a3b8';
  ctx.beginPath();
  ctx.moveTo(canvas.width - 320, 680);
  ctx.lineTo(canvas.width - 70, 680);
  ctx.stroke();

  // If authorized commissioner signature exists
  if (state.certificateData?.signature_path) {
    try {
      const sigImg = new Image();
      sigImg.crossOrigin = 'anonymous';
      sigImg.src = state.certificateData.signature_path;
      sigImg.onload = () => {
        ctx.drawImage(sigImg, canvas.width - 250, 615, 140, 55);
      };
    } catch (e) {}
  }

  const commName = state.certificateData?.commissioner_name || 'T. Vinay Krishna Reddy, I.A.S.';
  const commTitle = state.certificateData?.commissioner_title || 'Commissioner, Malkajgiri Municipal Corporation';

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 18px Poppins, sans-serif';
  ctx.fillText(commName, canvas.width - 70, 710);

  ctx.fillStyle = '#64748b';
  ctx.font = '500 14px Poppins, sans-serif';
  ctx.fillText(commTitle, canvas.width - 70, 735);

  // Certificate Footer Slogan
  ctx.textAlign = 'center';
  ctx.fillStyle = '#065f46';
  ctx.font = 'bold 14px Poppins, sans-serif';
  ctx.fillText('“Four Streams. One Mission. A Cleaner Malkajgiri.”', canvas.width / 2, 805);

  // Update UI Elements
  document.getElementById('certUniqueIdDisplay').textContent = certId;
  document.getElementById('certVerifyLink').href = `/verify/${certId}`;
}

function downloadCertificate() {
  const canvas = document.getElementById('certificateCanvas');
  const link = document.createElement('a');
  link.download = `MMC-4S-HERO-Certificate-${state.certificateData?.certificate_id || '2026'}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

// -------------------------------------------------------------
// LEADERBOARD & CONTACT LOADERS
// -------------------------------------------------------------
async function loadLeaderboard() {
  try {
    const res = await fetch('/api/leaderboard');
    const data = await res.json();

    const tbody = document.getElementById('topHeroesTableBody');
    tbody.innerHTML = '';
    (data.topHeroes || []).forEach((h, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="py-3 px-3 font-black text-slate-500">${idx + 1}</td>
        <td class="py-3 px-3">
          <strong class="font-extrabold text-slate-900">${h.display_name}</strong>
          <span class="text-[10px] text-slate-400 block">${h.organisation}</span>
        </td>
        <td class="py-3 px-3 font-semibold text-emerald-800">${h.category}</td>
        <td class="py-3 px-3 font-medium text-slate-600">${h.ward_name}</td>
        <td class="py-3 px-3 text-right font-black text-emerald-700">${h.score} Pts</td>
      `;
      tbody.appendChild(tr);
    });

    const orgsList = document.getElementById('topOrgsList');
    orgsList.innerHTML = '';
    (data.topOrgs || []).forEach(o => {
      const div = document.createElement('div');
      div.className = 'p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs';
      div.innerHTML = `
        <span class="font-extrabold text-slate-800">${o.organisation}</span>
        <span class="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-black">${o.participant_count} Heroes</span>
      `;
      orgsList.appendChild(div);
    });
  } catch (err) {
    console.error('Error loading leaderboard:', err);
  }
}

async function loadContactInfo() {
  try {
    const res = await fetch('/api/contact');
    const data = await res.json();

    const grid = document.getElementById('dynamicContactGrid');
    const social = document.getElementById('dynamicSocialLinks');
    grid.innerHTML = '';
    social.innerHTML = '';

    (data.contacts || []).forEach(c => {
      const isTe = state.currentLang === 'te';
      const label = isTe ? c.label_te : c.label;
      const value = isTe ? (c.value_te || c.value) : c.value;

      if (c.category === 'social') {
        const a = document.createElement('a');
        a.href = value.startsWith('http') ? value : `https://${value}`;
        a.target = '_blank';
        a.className = 'flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-800 hover:text-emerald-700 border border-slate-200 text-xs font-bold transition';
        a.innerHTML = `<i class="${c.icon}"></i> <span>${label}</span>`;
        social.appendChild(a);
      } else {
        const div = document.createElement('div');
        div.className = 'bg-slate-50 rounded-2xl p-5 border border-slate-200 flex items-start gap-3.5';
        div.innerHTML = `
          <div class="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-emerald-700 text-lg shrink-0 border border-slate-200">
            <i class="fa-solid ${c.icon}"></i>
          </div>
          <div>
            <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500">${label}</h4>
            <p class="text-sm font-extrabold text-slate-900 mt-1">${value}</p>
          </div>
        `;
        grid.appendChild(div);
      }
    });
  } catch (err) {
    console.error('Error loading contacts:', err);
  }
}

// Modal Helpers
function openPosterModal(src) {
  document.getElementById('posterModalImg').src = src;
  document.getElementById('posterModal').classList.remove('hidden');
}

function closePosterModal() {
  document.getElementById('posterModal').classList.add('hidden');
}

// Lifecycle Init on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  initApp();

  // Watch for navigate to certificate to render canvas
  const observer = new MutationObserver(() => {
    const certView = document.getElementById('view-certificate');
    if (certView && !certView.classList.contains('hidden')) {
      setTimeout(renderCertificate, 100);
    }
  });
  const mainEl = document.querySelector('main');
  if (mainEl) observer.observe(mainEl, { attributes: true, subtree: true });
});
