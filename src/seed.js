const { db, initSchema } = require('./db');
const { hashPassword } = require('./auth');

function seedDatabase() {
  initSchema();

  // 1. Seed Waste Streams
  const countStreams = db.prepare('SELECT COUNT(*) as cnt FROM waste_streams').get().cnt;
  if (countStreams === 0) {
    const insertStream = db.prepare(`
      INSERT INTO waste_streams (code, name, name_te, color, bin_color, icon, description, description_te, guidelines, guidelines_te)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertStream.run(
      'WET',
      'Wet Waste',
      'తడి చెత్త',
      '#16a34a',
      'GREEN',
      'fa-apple-alt',
      'Biodegradable organic waste from kitchen and garden that decomposes naturally into nutrient-rich compost.',
      'వంటగది మరియు తోట నుండి వచ్చే సేంద్రీయ వ్యర్థాలు సహజంగా ఎరువుగా మారతాయి.',
      'Do not mix with plastic wrappers, milk packets, or foil. Compost at home or give to green bin collector.',
      'ప్లాస్టిక్ కవర్లు, పాల ప్యాకెట్లు లేదా రేకులతో కలపవద్దు. ఇంట్లోనే కంపోస్ట్ చేయండి లేదా ఆకుపచ్చ బిన్ ద్వారా పంపండి.'
    );

    insertStream.run(
      'DRY',
      'Dry Waste',
      'పొడి చెత్త',
      '#2563eb',
      'BLUE',
      'fa-box-open',
      'Recyclable non-biodegradable waste including paper, cardboard, plastic containers, metals, and glass.',
      'పునర్వినియోగం చేయగల కాగితం, కార్డ్‌బోర్డ్, ప్లాస్టిక్, లోహం మరియు గాజు వ్యర్థాలు.',
      'Rinse food containers before disposal. Keep dry and unsoiled for maximum recycling efficiency.',
      'ఆహార డబ్బాలను నీటితో కడిగి ఆరబెట్టి వేయండి. తడిగా లేదా మురికిగా లేకుండా చూసుకోండి.'
    );

    insertStream.run(
      'SANITARY',
      'Sanitary Waste',
      'శానిటరీ వ్యర్థాలు',
      '#dc2626',
      'RED',
      'fa-hand-holding-medical',
      'Personal hygiene waste containing pathogens requiring safe handling and scientific high-temperature incineration.',
      'వ్యక్తిగత పరిశుభ్రత వ్యర్థాలు. వీటిని ప్రత్యేక పద్ధతిలో కాల్చి వేయడం జరుగుతుంది.',
      'Wrap securely in newspaper with a red cross or use paper bags. Never flush down toilets or throw in open drains.',
      'వార్తాపత్రికలో ఎరుపు మార్కింగ్‌తో చుట్టి వేయండి. టాయిలెట్లలో వేయకండి.'
    );

    insertStream.run(
      'SPECIAL',
      'Special-Care Waste',
      'స్పెషల్ కేర్ వ్యర్థాలు',
      '#1f2937',
      'BLACK',
      'fa-biohazard',
      'Hazardous domestic waste including batteries, electronics, tube lights, expired medicines, paint, and sharps.',
      'గృహ ప్రమాదకర వ్యర్థాలు - బ్యాటరీలు, ఈ-వ్యర్థాలు, మందులు, ట్యూబ్‌లైట్లు మరియు వాడిన సూదులు.',
      'Store separately in a puncture-proof container. Hand over directly to authorized e-waste/hazardous waste collection.',
      'ప్రత్యేక కంటైనర్‌లో భద్రపరచండి. ప్రత్యేక శానిటేషన్ సిబ్బందికి మాత్రమే ఇవ్వండి.'
    );
  }

  // Get stream IDs
  const streamMap = {};
  db.prepare('SELECT id, code FROM waste_streams').all().forEach(s => {
    streamMap[s.code] = s.id;
  });

  // 2. Seed Waste Items
  const countItems = db.prepare('SELECT COUNT(*) as cnt FROM waste_items').get().cnt;
  if (countItems === 0) {
    const insertItem = db.prepare(`
      INSERT INTO waste_items (stream_id, name, name_te, category, image_icon, explanation, explanation_te, mistake_tip, mistake_tip_te, difficulty)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const items = [
      // WET (Green)
      {
        stream: 'WET',
        name: 'Vegetable & Fruit Peels',
        name_te: 'కూరగాయలు మరియు పండ్ల తొక్కలు',
        category: 'Kitchen Waste',
        icon: 'fa-carrot',
        exp: 'Kitchen vegetable scraps decompose quickly into natural organic compost for plants.',
        exp_te: 'కూరగాయల వ్యర్థాలు త్వరగా కుళ్ళి సహజ సేంద్రీయ ఎరువుగా మారుతాయి.',
        mistake: 'Never put peels in plastic bags before throwing into the green bin.',
        mistake_te: 'ప్లాస్టిక్ కవర్లలో కట్టి ఆకుపచ్చ డబ్బాలో వేయకూడదు.',
        diff: 'Easy'
      },
      {
        stream: 'WET',
        name: 'Leftover Cooked Food',
        name_te: 'మిగిలిపోయిన వండిన ఆహారం',
        category: 'Kitchen Waste',
        icon: 'fa-bowl-rice',
        exp: 'Cooked rice, curry leftovers, and breads belong to wet waste for biomethanation or composting.',
        exp_te: 'వండిన అన్నం, కూరల మిగులు తడి చెత్తలోకి వస్తాయి.',
        mistake: 'Drain excess liquid / sambar before placing in the wet bin.',
        mistake_te: 'ద్రవాలను వడకట్టి వేయండి.',
        diff: 'Easy'
      },
      {
        stream: 'WET',
        name: 'Egg Shells',
        name_te: 'గుడ్డు పెంకులు',
        category: 'Kitchen Waste',
        icon: 'fa-egg',
        exp: 'Egg shells are rich in calcium and break down cleanly in wet compost bins.',
        exp_te: 'గుడ్డు పెంకులు కాల్షియం కలిగి ఉండి తడి ఎరువులో కలిసిపోతాయి.',
        mistake: 'Crush them lightly to speed up soil absorption.',
        mistake_te: 'కాస్త పొడిచేసి వేస్తే త్వరగా కలుస్తాయి.',
        diff: 'Easy'
      },
      {
        stream: 'WET',
        name: 'Tea Leaves & Coffee Grounds',
        name_te: 'టీ పొడి & కాఫీ వ్యర్థాలు',
        category: 'Kitchen Waste',
        icon: 'fa-mug-hot',
        exp: 'Used tea dust and coffee grounds are excellent organic fertilizers for gardens.',
        exp_te: 'వాడిన టీ పొడి మొక్కలకు మంచి బలాన్నిస్తుంది.',
        mistake: 'Remove any plastic tea bag tags or staples before composting.',
        mistake_te: 'ప్లాస్టిక్ ట్యాగ్‌లు లేదా పిన్నులు తొలగించండి.',
        diff: 'Easy'
      },
      {
        stream: 'WET',
        name: 'Garden Leaves & Dried Flowers',
        name_te: 'తోట ఆకులు & పూల వ్యర్థాలు',
        category: 'Garden Waste',
        icon: 'fa-leaf',
        exp: 'Pooja flowers, garland marigolds, and fallen garden leaves are 100% biodegradable.',
        exp_te: 'పూజల పువ్వులు మరియు ఎండిన ఆకులు పూర్తిగా తడి చెత్త క్రిందికి వస్తాయి.',
        mistake: 'Do not mix with plastic wrappers, strings, or ribbons from bouquets.',
        mistake_te: 'పూల దండలలోని ప్లాస్టిక్ దారాలను వేరు చేయండి.',
        diff: 'Easy'
      },
      {
        stream: 'WET',
        name: 'Coconut Shells & Husk',
        name_te: 'కొబ్బరి చిప్పలు & పీచు',
        category: 'Kitchen Waste',
        icon: 'fa-circle-notch',
        exp: 'Natural coconut shells and coir are organic materials processed for coco-peat and composting.',
        exp_te: 'కొబ్బరి చిప్పలు మరియు పీచు సేంద్రీయ పదార్థాలు.',
        mistake: 'Keep them in green stream, not dry waste.',
        mistake_te: 'వీటిని పొడి చెత్తలో వేయకండి, తడి చెత్తలోనే వేయండి.',
        diff: 'Medium'
      },

      // DRY (Blue)
      {
        stream: 'DRY',
        name: 'Plastic Water Bottles (PET)',
        name_te: 'ప్లాస్టిక్ నీళ్ల బాటిళ్లు (PET)',
        category: 'Plastic',
        icon: 'fa-bottle-water',
        exp: 'PET bottles can be shredded and recycled into textile polyester, new bottles, and containers.',
        exp_te: 'PET బాటిళ్లను రీసైకిల్ చేసి కొత్త వస్తువులుగా తయారు చేస్తారు.',
        mistake: 'Crush the bottle and keep cap on before placing in blue bin.',
        mistake_te: 'బాటిల్‌ను త్రొక్కి మూత పెట్టి వేయండి.',
        diff: 'Easy'
      },
      {
        stream: 'DRY',
        name: 'Cardboard Boxes & Cartons',
        name_te: 'కార్డ్‌బోర్డు డబ్బాలు & అట్టపెట్టెలు',
        category: 'Paper',
        icon: 'fa-boxes-stacked',
        exp: 'E-commerce shipping boxes and packaging cartons are top-grade recyclable dry materials.',
        exp_te: 'డెలివరీ బాక్సులు మరియు అట్టపెట్టెలు పునర్వినియోగానికి అత్యంత అనుకూలమైనవి.',
        mistake: 'Flatten cardboard boxes to save bin space and prevent water soaking.',
        mistake_te: 'పెట్టెలను చదును చేసి నీరు తగలకుండా పొడిగా ఉంచండి.',
        diff: 'Easy'
      },
      {
        stream: 'DRY',
        name: 'Newspapers & Magazines',
        name_te: 'వార్తాపత్రికలు & మ్యాగజైన్లు',
        category: 'Paper',
        icon: 'fa-newspaper',
        exp: 'Clean paper products are pulped and recycled up to 7 times.',
        exp_te: 'వార్తాపత్రికలను మళ్ళీ రీసైకిల్ పేపర్‌గా తయారు చేయవచ్చు.',
        mistake: 'Do not throw greasy food-stained paper into dry waste.',
        mistake_te: 'నూనె లేదా ఆహారం అంటిన కాగితాలను పొడి చెత్తలో వేయకూడదు.',
        diff: 'Easy'
      },
      {
        stream: 'DRY',
        name: 'Aluminium Beverage Cans',
        name_te: 'అల్యూమినియం డ్రింక్ క్యాన్లు',
        category: 'Metal',
        icon: 'fa-wine-bottle',
        exp: 'Aluminium is infinitely recyclable with zero loss of metal quality.',
        exp_te: 'అల్యూమినియం క్యాన్లను ఎన్నిసార్లయినా నాణ్యత తగ్గకుండా రీసైకిల్ చేయవచ్చు.',
        mistake: 'Rinse can with water to avoid insect attraction.',
        mistake_te: 'తీపి లేకుండా నీటితో కడిగి వేయండి.',
        diff: 'Easy'
      },
      {
        stream: 'DRY',
        name: 'Tetra Paks & Juice Cartons',
        name_te: 'టెట్రా ప్యాక్‌లు & జ్యూస్ ప్యాకెట్లు',
        category: 'Multi-layer Packaging',
        icon: 'fa-cube',
        exp: 'Multi-layered paper-foil-plastic containers are specialized dry recyclables.',
        exp_te: 'టెట్రా ప్యాకులను ప్రత్యేక పరిశ్రమలలో రీసైకిల్ చేస్తారు.',
        mistake: 'Rinse, flatten, and put with dry waste. Do not throw into wet bin!',
        mistake_te: 'కడిగి, నలిపి నీలి రంగు డబ్బాలో వేయండి.',
        diff: 'Medium'
      },
      {
        stream: 'DRY',
        name: 'Glass Jam Jars & Pickle Bottles',
        name_te: 'గాజు జామ్ సీసాలు & పచ్చడి సీసాలు',
        category: 'Glass',
        icon: 'fa-glass-water',
        exp: 'Intact glass containers can be washed and melted back into new glass products.',
        exp_te: 'గాజు సీసాలను కరిగించి కొత్త గాజు పాత్రలు చేస్తారు.',
        mistake: 'Wash thoroughly before placing in blue bin. Broken glass belongs to Special Care.',
        mistake_te: 'పగలని సీసాలు మాత్రమే బ్లూ బిన్; పగిలిన గాజు ముక్కలు బ్లాక్ బిన్‌కు చెందుతాయి.',
        diff: 'Medium'
      },

      // SANITARY (Red)
      {
        stream: 'SANITARY',
        name: 'Sanitary Napkins / Pads',
        name_te: 'శానిటరీ ప్యాడ్లు',
        category: 'Hygiene Waste',
        icon: 'fa-shield-halved',
        exp: 'Menstrual hygiene products harbor bacteria and require high-temperature incinerators.',
        exp_te: 'శానిటరీ ప్యాడ్లు బ్యాక్టీరియాను కలిగి ఉంటాయి కాబట్టి అధిక ఉష్ణోగ్రత వద్ద కాల్చివేయాలి.',
        mistake: 'Always wrap in newspaper with a red dot or cross before placing in Red Bin. Never flush!',
        mistake_te: 'ఎల్లప్పుడూ పేపరులో చుట్టి ఎరుపు గుర్తు వేసి రెడ్ బిన్‌లో వేయండి.',
        diff: 'Easy'
      },
      {
        stream: 'SANITARY',
        name: 'Baby & Adult Diapers',
        name_te: 'బేబీ & అడల్ట్ డైపర్లు',
        category: 'Hygiene Waste',
        icon: 'fa-baby',
        exp: 'Soiled diapers contain pathogenic fecal matter that poses high infection risk to sanitation workers.',
        exp_te: 'డైపర్లలో వ్యాధి కారక క్రిములు ఉంటాయి. శానిటేషన్ కార్మికుల రక్షణకు రెడ్ బిన్ ముఖ్యం.',
        mistake: 'Roll up, fasten with side tabs, wrap tightly in paper, and bin in Red.',
        mistake_te: 'చక్కగా చుట్టి పేపరుతో మూసి రెడ్ బిన్‌లో మాత్రమే వేయాలి.',
        diff: 'Easy'
      },
      {
        stream: 'SANITARY',
        name: 'Used Tissues & Wet Wipes',
        name_te: 'వాడిన టిష్యూలు & వెట్ వైప్స్',
        category: 'Hygiene Waste',
        icon: 'fa-toilet-paper',
        exp: 'Used facial tissues and wet wipes carry mucus, saliva, and bodily secretions.',
        exp_te: 'స్రావాలు మరియు జలుబు తుంపర్లు కలిగిన టిష్యూలు శానిటరీ వ్యర్థాలు.',
        mistake: 'Do not put used facial tissues in dry paper recycling or compost.',
        mistake_te: 'వీటిని పొడి పేపర్లతో లేదా తడి ఎరువుతో కలపకూడదు.',
        diff: 'Medium'
      },
      {
        stream: 'SANITARY',
        name: 'Cotton Swabs & Ear Buds',
        name_te: 'కాటన్ దూది & ఇయర్ బడ్స్',
        category: 'Hygiene Waste',
        icon: 'fa-prescription-bottle',
        exp: 'Cotton buds used for personal ear or wound hygiene are bio-sanitary waste.',
        exp_te: 'చెవులలో లేదా గాయాలకు వాడిన దూది బడ్స్ శానిటరీ కిందకు వస్తాయి.',
        mistake: 'Do not flush down toilets; dispose in red sanitary bin.',
        mistake_te: 'డ్రెయిన్లలో లేదా టాయిలెట్లలో వేయకండి; ఎరుపు బిన్‌లోనే వేయండి.',
        diff: 'Medium'
      },
      {
        stream: 'SANITARY',
        name: 'Used Bandages & Gauze',
        name_te: 'వాడిన బ్యాండేజీలు & గాజుగుడ్డలు',
        category: 'Hygiene Waste',
        icon: 'fa-bandage',
        exp: 'Wound dressings with blood or ointment belong in the red bin for safe medical incineration.',
        exp_te: 'రక్తం లేదా మందులు అంటిన బ్యాండేజీలను ఎరుపు బిన్‌లో వేయాలి.',
        mistake: 'Wrap in paper so workers do not touch open blood stains.',
        mistake_te: 'కాగితంలో చుట్టి మాత్రమే పారవేయండి.',
        diff: 'Easy'
      },

      // SPECIAL-CARE (Black)
      {
        stream: 'SPECIAL',
        name: 'Household Batteries (AA, AAA, Lithium)',
        name_te: 'గృహ బ్యాటరీలు (AA, AAA, లిథియం)',
        category: 'Hazardous / E-Waste',
        icon: 'fa-car-battery',
        exp: 'Batteries contain toxic heavy metals (lead, cadmium, mercury) that poison groundwater if landfilled.',
        exp_te: 'బ్యాటరీలలో విషపూరిత భార లోహాలు ఉంటాయి; ఇవి భూగర్భ జలాలను కలుషితం చేస్తాయి.',
        mistake: 'Never throw in wet or dry bins. Keep separate in black bin for specialized battery recyclers.',
        mistake_te: 'తడి లేదా పొడి చెత్తలో అస్సలు వేయకండి. నల్ల డబ్బాలోనే వేయాలి.',
        diff: 'Easy'
      },
      {
        stream: 'SPECIAL',
        name: 'Expired Medicines & Blister Packs',
        name_te: 'గడువుతీరిన మందులు & టాబ్లెట్ స్ట్రిప్స్',
        category: 'Domestic Hazardous',
        icon: 'fa-pills',
        exp: 'Expired pharmaceuticals can enter local water streams or cause accidental poisoning if discarded loosely.',
        exp_te: 'గడువు తీరిన మందులు నీటి వనరులను కలుషితం చేస్తాయి లేదా ప్రమాదాలకు దారితీస్తాయి.',
        mistake: 'Do not flush medicines down sinks. Deposit in black special care bins.',
        mistake_te: 'సింకులలో లేదా డ్రైన్లలో పోయవద్దు. బ్లాక్ బిన్‌లోనే భద్రపరచండి.',
        diff: 'Easy'
      },
      {
        stream: 'SPECIAL',
        name: 'CFL Bulbs & Tube Lights',
        name_te: 'CFL బల్బులు & ట్యూబ్‌లైట్లు',
        category: 'Domestic Hazardous',
        icon: 'fa-lightbulb',
        exp: 'Fluorescent lights contain poisonous mercury vapor and sharp glass when shattered.',
        exp_te: 'ట్యూబ్‌లైట్లలో పాదరసం (మెర్క్యురీ) ఆవిరి ఉంటుంది.',
        mistake: 'Handle gently without breaking and place in black special care container.',
        mistake_te: 'పగలకుండా జాగ్రత్తగా నల్ల బిన్ లేదా సేకరణ సిబ్బందికి ఇవ్వండి.',
        diff: 'Medium'
      },
      {
        stream: 'SPECIAL',
        name: 'Broken Glass Shards & Mirrors',
        name_te: 'పగిలిన గాజు ముక్కలు & అద్దాలు',
        category: 'Sharps / Hazards',
        icon: 'fa-burst',
        exp: 'Broken glass causes deep severe lacerations to municipal workers handling trash bags.',
        exp_te: 'పగిలిన గాజు ముక్కలు చెత్త ఎత్తే కార్మికుల చేతులకు తీవ్ర గాయాలు చేస్తాయి.',
        mistake: 'Wrap in thick cardboard/newspaper, label "DANGER GLASS", and place in Black Bin.',
        mistake_te: 'మందపాటి అట్టలో చుట్టి బ్లాక్ బిన్‌లో మాత్రమే వేయాలి.',
        diff: 'Medium'
      },
      {
        stream: 'SPECIAL',
        name: 'Used Syringes & Needles',
        name_te: 'వాడేసిన ఇంజెక్షన్ సూదులు & సిరంజిలు',
        category: 'Sharps / Biomedical',
        icon: 'fa-syringe',
        exp: 'Sharps pose severe risk of needle-stick injuries and transmission of bloodborne viruses (HIV, Hepatitis).',
        exp_te: 'సూదులు గుచ్చుకుంటే హెపటైటిస్, హెచ్‌ఐవి వంటి ప్రమాదకర వ్యాధులు వ్యాపిస్తాయి.',
        mistake: 'Store in a puncture-proof plastic bottle with cap sealed. Always dispose in Black bin.',
        mistake_te: 'మూత ఉన్న గట్టి బాటిల్లో పెట్టి బ్లాక్ బిన్‌లో అప్పగించండి.',
        diff: 'Easy'
      },
      {
        stream: 'SPECIAL',
        name: 'E-Waste (Old Mobile, Chargers, Cables)',
        name_te: 'ఈ-వ్యర్థాలు (పాత ఫోన్లు, ఛార్జర్లు, వైర్లు)',
        category: 'Hazardous / E-Waste',
        icon: 'fa-mobile-screen',
        exp: 'Electronic gadgets contain flame retardants and heavy metals requiring certified recycling facilities.',
        exp_te: 'ఎలక్ట్రానిక్స్ వస్తువులలో విష రసాయనాలు ఉంటాయి కాబట్టి ప్రత్యేక ఈ-వేస్ట్ ప్లాంట్లకు పంపాలి.',
        mistake: 'Keep separate from regular dry scrap; put in black special care waste.',
        mistake_te: 'సాధారణ పాత సామానుతో కలపకుండా ప్రత్యేకంగా ఇవ్వండి.',
        diff: 'Medium'
      },
      {
        stream: 'SPECIAL',
        name: 'Paint Cans & Pesticide Bottles',
        name_te: 'పెయింట్ డబ్బాలు & పురుగుమందుల సీసాలు',
        category: 'Chemical Hazardous',
        icon: 'fa-paint-roller',
        exp: 'Residual solvents, lead paints, and insecticides are inflammable and toxic chemicals.',
        exp_te: 'మిగిలిన రసాయనాలు, రంగులు మరియు మందులు అంటుకునే స్వభావం కలవి.',
        mistake: 'Never wash chemicals into sewer drains. Place container in black bin.',
        mistake_te: 'డ్రెయిన్లలో కడిగి పోయకూడదు; బ్లాక్ బిన్‌కు మాత్రమే చెందుతాయి.',
        diff: 'Medium'
      }
    ];

    for (const it of items) {
      insertItem.run(
        streamMap[it.stream],
        it.name,
        it.name_te,
        it.category,
        it.icon,
        it.exp,
        it.exp_te,
        it.mistake,
        it.mistake_te,
        it.diff
      );
    }
  }

  // 3. Seed Quiz Questions for all Levels
  const countQuestions = db.prepare('SELECT COUNT(*) as cnt FROM questions').get().cnt;
  if (countQuestions === 0) {
    const insertQuestion = db.prepare(`
      INSERT INTO questions (level_number, stream_id, question_text, question_text_te, options_json, correct_answer, explanation, explanation_te, difficulty)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const questionsList = [
      // Level 1: Which Bin? (Direct waste object classification)
      {
        lvl: 1,
        stream: 'WET',
        q: 'Where should you throw leftover banana peels and vegetable cuttings?',
        q_te: 'అరటిపండు తొక్కలు మరియు కూరగాయల ముక్కలను ఏ బిన్‌లో వేయాలి?',
        opts: ['Green Bin (Wet Waste)', 'Blue Bin (Dry Waste)', 'Red Bin (Sanitary Waste)', 'Black Bin (Special Care)'],
        ans: 'Green Bin (Wet Waste)',
        exp: 'Organic food residues are 100% compostable and belong in the Green Bin.',
        exp_te: 'సేంద్రీయ ఆహార వ్యర్థాలు ఎరువుగా మారతాయి కాబట్టి ఆకుపచ్చ డబ్బాలో వేయాలి.',
        diff: 'Easy'
      },
      {
        lvl: 1,
        stream: 'DRY',
        q: 'Which bin should be used for discarded milk packets and plastic water bottles?',
        q_te: 'వాడేసిన పాల ప్యాకెట్లు మరియు ప్లాస్టిక్ వాటర్ బాటిళ్లను ఏ బిన్‌లో వేయాలి?',
        opts: ['Green Bin', 'Blue Bin (Dry Waste)', 'Red Bin', 'Black Bin'],
        ans: 'Blue Bin (Dry Waste)',
        exp: 'Clean rinsed plastics are recyclable dry waste and belong in the Blue Bin.',
        exp_te: 'కడిగిన ప్లాస్టిక్ వ్యర్థాలు రీసైక్లింగ్ కోసం నీలి రంగు డబ్బాలో వేయాలి.',
        diff: 'Easy'
      },
      {
        lvl: 1,
        stream: 'SANITARY',
        q: 'Where do used baby diapers and sanitary napkins belong?',
        q_te: 'వాడిన బేబీ డైపర్లు మరియు శానిటరీ ప్యాడ్లు ఏ బిన్‌లో వేయాలి?',
        opts: ['Blue Bin', 'Green Bin', 'Red Bin (Sanitary Waste)', 'Black Bin'],
        ans: 'Red Bin (Sanitary Waste)',
        exp: 'Personal hygiene items require safe handling and scientific incineration in the Red Bin.',
        exp_te: 'పరిశుభ్రత వ్యర్థాలను పేపరులో చుట్టి ఎరుపు రంగు డబ్బాలో మాత్రమే వేయాలి.',
        diff: 'Easy'
      },
      {
        lvl: 1,
        stream: 'SPECIAL',
        q: 'Where should you deposit old remote control batteries and fused CFL bulbs?',
        q_te: 'పాత టీవీ రిమోట్ బ్యాటరీలు మరియు పాడైన CFL బల్బులను ఏ బిన్‌లో వేయాలి?',
        opts: ['Black Bin (Special Care Waste)', 'Green Bin', 'Blue Bin', 'Red Bin'],
        ans: 'Black Bin (Special Care Waste)',
        exp: 'Heavy metals in batteries and mercury in CFL bulbs require the Black Bin for special hazardous handling.',
        exp_te: 'బ్యాటరీల్లోని విష లోహాలు, బల్బుల్లోని మెర్క్యురీ వలన వీటిని నల్ల రంగు డబ్బాలో వేయాలి.',
        diff: 'Easy'
      },

      // Level 3: Rapid Fire Questions
      {
        lvl: 3,
        stream: 'WET',
        q: 'Are puja flowers and garland marigolds considered Wet Waste?',
        q_te: 'పూజా పూలు మరియు బంతిపూల దండలు తడి చెత్తగా పరిగణించబడతాయా?',
        opts: ['Yes, 100% Green Bin', 'No, they are Dry Waste', 'They are Special Care', 'They belong in Red Bin'],
        ans: 'Yes, 100% Green Bin',
        exp: 'Natural flowers decompose into rich organic manure in the Green Bin.',
        exp_te: 'సహజ పూలు ఆకుపచ్చ డబ్బాలో ఎరువుగా మారుతాయి.',
        diff: 'Easy'
      },
      {
        lvl: 3,
        stream: 'SPECIAL',
        q: 'A glass pickle bottle accidentally broke into sharp shards on the floor. Which bin?',
        q_te: 'గాజు పచ్చడి సీసా కిందపడి పగిలిపోయింది. ఆ పదునైన ముక్కలను ఎక్కడ వేయాలి?',
        opts: ['Black Bin (Special Care)', 'Blue Bin (Dry Waste)', 'Green Bin (Wet Waste)', 'Red Bin (Sanitary Waste)'],
        ans: 'Black Bin (Special Care)',
        exp: 'Broken sharp glass is a hazard that injures sanitation workers; wrap safely and place in Black Bin.',
        exp_te: 'పగిలిన గాజు ముక్కలు కార్మికులను గాయపరుస్తాయి; జాగ్రత్తగా చుట్టి బ్లాక్ బిన్‌లో వేయాలి.',
        diff: 'Medium'
      },
      {
        lvl: 3,
        stream: 'DRY',
        q: 'An Amazon cardboard box with paper tape. Which stream does it belong to?',
        q_te: 'ఆన్‌లైన్ డెలివరీ ద్వారా వచ్చిన కార్డ్‌బోర్డ్ బాక్స్ ఏ చెత్తకు చెందుతుంది?',
        opts: ['Blue Bin (Dry Waste)', 'Green Bin (Wet Waste)', 'Red Bin (Sanitary)', 'Black Bin (Special Care)'],
        ans: 'Blue Bin (Dry Waste)',
        exp: 'Clean cardboard is premium dry recyclable paper stream material.',
        exp_te: 'చదును చేసిన కార్డ్‌బోర్డ్ అట్టలు పొడి చెత్త రీసైక్లింగ్‌కు అనువైనవి.',
        diff: 'Easy'
      },
      {
        lvl: 3,
        stream: 'SANITARY',
        q: 'You cleaned an open cut on your finger with cotton and Dettol. Which bin?',
        q_te: 'వేలికి అయిన గాయానికి డెట్టాల్‌తో తుడిచిన దూది ఏ బిన్‌లో వేయాలి?',
        opts: ['Red Bin (Sanitary Waste)', 'Green Bin', 'Blue Bin', 'Black Bin'],
        ans: 'Red Bin (Sanitary Waste)',
        exp: 'Blood and wound swabs are bio-medical sanitary waste destined for the Red Bin.',
        exp_te: 'రక్తం మరియు మందులు అంటిన దూది శానిటరీ వ్యర్థం.',
        diff: 'Medium'
      },
      {
        lvl: 3,
        stream: 'SPECIAL',
        q: 'Expired antibiotic capsules and cough syrup bottle should go to:',
        q_te: 'గడువు ముగిసిన యాంటీబయాటిక్ టాబ్లెట్లు మరియు దగ్గు మందు బాటిల్ ఎక్కడ వేయాలి?',
        opts: ['Black Bin (Special Care)', 'Kitchen Sink drain', 'Blue Bin', 'Green Bin'],
        ans: 'Black Bin (Special Care)',
        exp: 'Never flush medicines into water bodies! Hand them over in the Black Bin.',
        exp_te: 'మందులను సింకులో పోయకూడదు; బ్లాక్ బిన్‌లో మాత్రమే వేయాలి.',
        diff: 'Medium'
      },
      {
        lvl: 3,
        stream: 'DRY',
        q: 'Empty aluminum soft drink can and metal bottle caps belong in:',
        q_te: 'ఖాళీ కూల్ డ్రింక్ క్యాన్ మరియు మెటల్ మూతలు ఏ బిన్‌లో వేయాలి?',
        opts: ['Blue Bin (Dry Waste)', 'Green Bin', 'Red Bin', 'Black Bin'],
        ans: 'Blue Bin (Dry Waste)',
        exp: 'Metals and aluminum are 100% recyclable in the dry stream.',
        exp_te: 'లోహాలు మరియు అల్యూమినియం క్యాన్లు నీలి రంగు పొడి చెత్త బిన్‌కు చెందుతాయి.',
        diff: 'Easy'
      },

      // Level 4: Spot the Mistake Questions
      {
        lvl: 4,
        stream: 'SPECIAL',
        q: 'You inspect a GREEN BIN and find: Potato peels, Rotten tomatoes, AA Battery, and Coconut coir. Which item is MISPLACED?',
        q_te: 'ఆకుపచ్చ డబ్బాలో బంగాళాదుంప తొక్కలు, కుళ్ళిన టమాటాలు, AA బ్యాటరీ, కొబ్బరి పీచు ఉన్నాయి. ఏది తప్పుగా వేయబడింది?',
        opts: ['AA Battery (Belongs in Black Bin)', 'Potato peels', 'Rotten tomatoes', 'Coconut coir'],
        ans: 'AA Battery (Belongs in Black Bin)',
        exp: 'AA Batteries contain hazardous chemicals and must NEVER be placed in wet composting bins!',
        exp_te: 'AA బ్యాటరీ రసాయనాలను కలిగి ఉంటుంది కాబట్టి దీనిని బ్లాక్ బిన్‌లో వేయాలి.',
        diff: 'Medium'
      },
      {
        lvl: 4,
        stream: 'SANITARY',
        q: 'In a BLUE BIN you see: Newspapers, Delivery carton, Used baby diaper, and Plastic bottle. Which item is DANGEROUSLY MISPLACED?',
        q_te: 'నీలి రంగు డబ్బాలో వార్తాపత్రికలు, అట్టపెట్టె, వాడిన డైపర్, ప్లాస్టిక్ బాటిల్ ఉన్నాయి. ఏది తప్పుగా వేయబడింది?',
        opts: ['Used baby diaper (Belongs in Red Bin)', 'Newspapers', 'Delivery carton', 'Plastic bottle'],
        ans: 'Used baby diaper (Belongs in Red Bin)',
        exp: 'A soiled diaper contaminates clean dry paper and exposes recyclers to pathogens; it belongs in Red Bin!',
        exp_te: 'వాడిన డైపర్లు పొడి కాగితాలను కలుషితం చేస్తాయి; వీటిని ఎరుపు బిన్‌లోనే వేయాలి.',
        diff: 'Medium'
      },
      {
        lvl: 4,
        stream: 'DRY',
        q: 'In a RED BIN someone placed: Used sanitary pad, Clean empty cardboard box, and Used bandage. Which item does NOT belong here?',
        q_te: 'రెడ్ బిన్‌లో వాడిన ప్యాడ్, శుభ్రమైన ఖాళీ అట్టపెట్టె, వాడిన బ్యాండేజ్ ఉన్నాయి. ఏది ఇక్కడ ఉండకూడదు?',
        opts: ['Clean empty cardboard box (Belongs in Blue Bin)', 'Used sanitary pad', 'Used bandage', 'None of these'],
        ans: 'Clean empty cardboard box (Belongs in Blue Bin)',
        exp: 'Clean cardboard is valuable dry recyclable material, not sanitary waste!',
        exp_te: 'శుభ్రమైన అట్టపెట్టె పునర్వినియోగం కాగల పొడి చెత్త; దీనిని బ్లూ బిన్‌లో వేయాలి.',
        diff: 'Medium'
      },

      // Final Level: Ultimate 4S HERO Quiz
      {
        lvl: 7,
        stream: 'WET',
        q: 'What happens to the Wet Waste collected by Malkajgiri Municipal Corporation?',
        q_te: 'మల్కాజ్‌గిరి మున్సిపల్ కార్పొరేషన్ సేకరించిన తడి చెత్త ఏమవుతుంది?',
        opts: ['It is converted into organic compost and biogas', 'It is burned in incinerators', 'It is dumped into Safilguda lake', 'It is recycled into paper'],
        ans: 'It is converted into organic compost and biogas',
        exp: 'Wet waste goes to biomethanation and composting plants to produce clean energy and fertilizer.',
        exp_te: 'తడి చెత్తను సేంద్రీయ ఎరువుగా మరియు బయోగ్యాస్‌గా మారుస్తారు.',
        diff: 'Hard'
      },
      {
        lvl: 7,
        stream: 'DRY',
        q: 'Why must food containers be rinsed before placing them in the Blue Bin?',
        q_te: 'ఆహార డబ్బాలను బ్లూ బిన్‌లో వేసే ముందు నీటితో ఎందుకు కడగాలి?',
        opts: ['To prevent bad odor, pests, and contamination of dry recyclables', 'To make them heavier', 'To change their color', 'It is not necessary to rinse'],
        ans: 'To prevent bad odor, pests, and contamination of dry recyclables',
        exp: 'Food residue rots paper and attracts vermin, rendering entire batches of recyclable dry waste useless.',
        exp_te: 'ఆహారపు జిడ్డు కాగితాలను నాశనం చేస్తుంది మరియు పురుగులను ఆకర్షిస్తుంది.',
        diff: 'Hard'
      },
      {
        lvl: 7,
        stream: 'SANITARY',
        q: 'What is the correct civic protocol before disposing of sanitary waste in Malkajgiri?',
        q_te: 'శానిటరీ వ్యర్థాలను పారవేసే ముందు పౌరులు పాటించవలసిన సరైన పద్ధతి ఏమిటి?',
        opts: ['Wrap in newspaper and mark with a red cross or use dedicated sanitary bags', 'Flush directly into the toilet commode', 'Burn openly on the street corner', 'Throw into the open stormwater drain'],
        ans: 'Wrap in newspaper and mark with a red cross or use dedicated sanitary bags',
        exp: 'Wrapping with a red mark protects the dignity and health of municipal frontline sanitation workers.',
        exp_te: 'ఎరుపు గుర్తు వేయడం వల్ల శానిటేషన్ కార్మికుల గౌరవం మరియు ఆరోగ్యం రక్షించబడుతుంది.',
        diff: 'Hard'
      },
      {
        lvl: 7,
        stream: 'SPECIAL',
        q: 'Why should e-waste (like broken cellphones and laptops) NEVER be burnt openly in neighborhoods?',
        q_te: 'ఈ-వ్యర్థాలను కాలనీలలో బహిరంగంగా ఎందుకు కాల్చకూడదు?',
        opts: ['It releases cancer-causing toxic dioxins and heavy metal fumes into our air', 'It creates too much nice light', 'It turns into gold', 'It smells pleasant'],
        ans: 'It releases cancer-causing toxic dioxins and heavy metal fumes into our air',
        exp: 'Open burning of electronic components releases dangerous dioxins, furans, and lead into neighborhood air.',
        exp_te: 'ఈ-వ్యర్థాలను కాల్చడం వల్ల క్యాన్సర్‌కు కారణమయ్యే ప్రమాదకర రసాయన వాయువులు విడుదలవుతాయి.',
        diff: 'Hard'
      },
      {
        lvl: 7,
        stream: 'SPECIAL',
        q: 'A diabetic family member uses daily insulin needles. How should they be stored before collection?',
        q_te: 'ఇన్సులిన్ సూదులను మున్సిపల్ కార్పొరేషన్‌కు ఇచ్చే ముందు ఎలా భద్రపరచాలి?',
        opts: ['In a hard puncture-proof plastic container / bottle and handed into Black Bin', 'Tossed directly into loose garbage bag', 'Thrown into wet kitchen vegetable bin', 'Flushed down toilet'],
        ans: 'In a hard puncture-proof plastic container / bottle and handed into Black Bin',
        exp: 'Puncture-resistant bottles prevent needle-stick injuries to waste collectors and community animals.',
        exp_te: 'సూదులు ఎవరికీ గుచ్చుకోకుండా గట్టి ప్లాస్టిక్ బాటిల్లో పెట్టి బ్లాక్ బిన్‌లో ఇవ్వాలి.',
        diff: 'Hard'
      }
    ];

    for (const q of questionsList) {
      insertQuestion.run(
        q.lvl,
        streamMap[q.stream] || null,
        q.q,
        q.q_te,
        JSON.stringify(q.opts),
        q.ans,
        q.exp,
        q.exp_te,
        q.diff
      );
    }
  }

  // 4. Seed Circles, Wards, Areas (Clearly marked as DEMO DATA)
  const countCircles = db.prepare('SELECT COUNT(*) as cnt FROM circles').get().cnt;
  if (countCircles === 0) {
    const insertCircle = db.prepare(`
      INSERT INTO circles (code, name, name_te, is_active, display_order)
      VALUES (?, ?, ?, 1, ?)
    `);

    const insertWard = db.prepare(`
      INSERT INTO wards (circle_id, ward_number, name, name_te, is_active, display_order)
      VALUES (?, ?, ?, ?, 1, ?)
    `);

    const insertArea = db.prepare(`
      INSERT INTO areas (ward_id, name, name_te, pincode, is_active)
      VALUES (?, ?, ?, ?, 1)
    `);

    // Circle 1: Malkajgiri Circle
    insertCircle.run('CIR-01', 'Malkajgiri Circle (DEMO DATA)', 'మల్కాజ్‌గిరి సర్కిల్ (డెమో డేటా)', 1);
    const circle1Id = db.prepare("SELECT id FROM circles WHERE code = 'CIR-01'").get().id;

    // Malkajgiri Wards
    const c1Wards = [
      {
        num: '136',
        name: 'Neredmet (DEMO DATA)',
        name_te: 'నేరెడ్‌మెట్ (డెమో డేటా)',
        areas: [
          { name: 'Defence Colony', name_te: 'డిఫెన్స్ కాలనీ', pin: '500056' },
          { name: 'Vayupuri', name_te: 'వాయుపురి', pin: '500094' },
          { name: 'Kakatiya Nagar', name_te: 'కాకతీయ నగర్', pin: '500056' },
          { name: 'Sainik Vihar', name_te: 'సైనిక్ విహార్', pin: '500056' }
        ]
      },
      {
        num: '137',
        name: 'Vinayak Nagar (DEMO DATA)',
        name_te: 'వినాయక్ నగర్ (డెమో డేటా)',
        areas: [
          { name: 'Krupa Complex Area', name_te: 'కృపా కాంప్లెక్స్ ఏరియా', pin: '500056' },
          { name: 'Safilguda Old Village', name_te: 'సఫీల్‌గూడ పాత గ్రామం', pin: '500056' },
          { name: 'Gowtham Nagar Colony', name_te: 'గౌతమ్ నగర్ కాలనీ', pin: '500047' }
        ]
      },
      {
        num: '138',
        name: 'Moula Ali (DEMO DATA)',
        name_te: 'మౌలాలీ (డెమో డేటా)',
        areas: [
          { name: 'ZTS Colony', name_te: 'ZTS కాలనీ', pin: '500040' },
          { name: 'Moula Ali Railway Colony', name_te: 'మౌలాలీ రైల్వే కాలనీ', pin: '500040' },
          { name: 'Bharat Nagar', name_te: 'భరత్ నగర్', pin: '500040' }
        ]
      },
      {
        num: '139',
        name: 'East Anandbagh (DEMO DATA)',
        name_te: 'ఈస్ట్ ఆనంద్‌బాగ్ (డెమో డేటా)',
        areas: [
          { name: 'Anandbagh Main Road', name_te: 'ఆనంద్‌బాగ్ మెయిన్ రోడ్డు', pin: '500047' },
          { name: 'Safilguda Lake View Colony', name_te: 'సఫీల్‌గూడ లేక్ వ్యూ కాలనీ', pin: '500047' },
          { name: 'Sitaram Nagar', name_te: 'సీతారాం నగర్', pin: '500047' }
        ]
      },
      {
        num: '140',
        name: 'Malkajgiri (DEMO DATA)',
        name_te: 'మల్కాజ్‌గిరి టౌన్ (డెమో డేటా)',
        areas: [
          { name: 'Geeta Nagar (MMC HQ)', name_te: 'గీతా నగర్ (MMC కార్యాలయం)', pin: '500047' },
          { name: 'Mirjalguda X Roads', name_te: 'మిర్జాల్‌గూడ చౌరస్తా', pin: '500047' },
          { name: 'Station Road Malkajgiri', name_te: 'రైల్వే స్టేషన్ రోడ్డు', pin: '500047' }
        ]
      },
      {
        num: '141',
        name: 'Gautam Nagar (DEMO DATA)',
        name_te: 'గౌతమ్ నగర్ (డెమో డేటా)',
        areas: [
          { name: 'Old Malkajgiri', name_te: 'పాత మల్కాజ్‌గిరి', pin: '500047' },
          { name: 'RK Nagar', name_te: 'ఆర్కే నగర్', pin: '500047' },
          { name: 'Sharadha Nagar', name_te: 'శారద నగర్', pin: '500047' }
        ]
      }
    ];

    let order = 1;
    for (const w of c1Wards) {
      insertWard.run(circle1Id, w.num, w.name, w.name_te, order++);
      const wardId = db.prepare('SELECT id FROM wards WHERE circle_id = ? AND ward_number = ?').get(circle1Id, w.num).id;
      for (const a of w.areas) {
        insertArea.run(wardId, a.name, a.name_te, a.pin);
      }
    }

    // Circle 2: Alwal Circle
    insertCircle.run('CIR-02', 'Alwal Circle (DEMO DATA)', 'అల్వాల్ సర్కిల్ (డెమో డేటా)', 2);
    const circle2Id = db.prepare("SELECT id FROM circles WHERE code = 'CIR-02'").get().id;

    const c2Wards = [
      {
        num: '133',
        name: 'Macha Bolarum (DEMO DATA)',
        name_te: 'మచ్చ బొల్లారం (డెమో డేటా)',
        areas: [
          { name: 'Bolarum Bazaar', name_te: 'బొల్లారం బజార్', pin: '500010' },
          { name: 'Rythu Bazaar Area', name_te: 'రైతు బజార్ ఏరియా', pin: '500010' }
        ]
      },
      {
        num: '134',
        name: 'Alwal (DEMO DATA)',
        name_te: 'అల్వాల్ (డెమో డేటా)',
        areas: [
          { name: 'Old Alwal', name_te: 'ఓల్డ్ అల్వాల్', pin: '500010' },
          { name: 'Lothkunta Junction', name_te: 'లోతుకుంట జంక్షన్', pin: '500015' },
          { name: 'Temple Rock Enclave', name_te: 'టెంపుల్ రాక్ ఎంక్లేవ్', pin: '500010' }
        ]
      },
      {
        num: '135',
        name: 'Venkatapuram (DEMO DATA)',
        name_te: 'వెంకటాపురం (డెమో డేటా)',
        areas: [
          { name: 'Father Balaiah Nagar', name_te: 'ఫాదర్ బాలయ్య నగర్', pin: '500015' },
          { name: 'Subhash Nagar', name_te: 'సుభాష్ నగర్', pin: '500015' }
        ]
      }
    ];

    for (const w of c2Wards) {
      insertWard.run(circle2Id, w.num, w.name, w.name_te, order++);
      const wardId = db.prepare('SELECT id FROM wards WHERE circle_id = ? AND ward_number = ?').get(circle2Id, w.num).id;
      for (const a of w.areas) {
        insertArea.run(wardId, a.name, a.name_te, a.pin);
      }
    }

    // Circle 3: Kapra Circle
    insertCircle.run('CIR-03', 'Kapra Circle (DEMO DATA)', 'కాప్రా సర్కిల్ (డెమో డేటా)', 3);
    const circle3Id = db.prepare("SELECT id FROM circles WHERE code = 'CIR-03'").get().id;

    const c3Wards = [
      {
        num: '1',
        name: 'Kapra (DEMO DATA)',
        name_te: 'కాప్రా (డెమో డేటా)',
        areas: [
          { name: 'Sainikpuri Main Road', name_te: 'సైనిక్‌పురి మెయిన్ రోడ్', pin: '500094' },
          { name: 'ECIL X Roads', name_te: 'ఈసీఐఎల్ చౌరస్తా', pin: '500062' },
          { name: 'Dr. AS Rao Nagar', name_te: 'డాక్టర్ ఎ.ఎస్. రావు నగర్', pin: '500062' }
        ]
      },
      {
        num: '2',
        name: 'Cherlapally (DEMO DATA)',
        name_te: 'చెర్లపల్లి (డెమో డేటా)',
        areas: [
          { name: 'Cherlapally IDA Phase 1', name_te: 'చెర్లపల్లి పారిశ్రామిక వాడ', pin: '500051' },
          { name: 'HCL Colony', name_te: 'హెచ్‌సీఎల్ కాలనీ', pin: '500051' }
        ]
      }
    ];

    for (const w of c3Wards) {
      insertWard.run(circle3Id, w.num, w.name, w.name_te, order++);
      const wardId = db.prepare('SELECT id FROM wards WHERE circle_id = ? AND ward_number = ?').get(circle3Id, w.num).id;
      for (const a of w.areas) {
        insertArea.run(wardId, a.name, a.name_te, a.pin);
      }
    }
  }

  // 5. Seed Website Settings
  const countSettings = db.prepare('SELECT COUNT(*) as cnt FROM website_settings').get().cnt;
  if (countSettings === 0) {
    const insertSetting = db.prepare(`
      INSERT INTO website_settings (setting_key, setting_value, description)
      VALUES (?, ?, ?)
    `);

    insertSetting.run('qualifying_score_percent', '80', 'Minimum percentage required to unlock official Certificate of Achievement');
    insertSetting.run('campaign_title', '4S HERO – Waste Segregation Challenge', 'Official Campaign Name');
    insertSetting.run('campaign_slogan', 'Four Streams. One Mission. A Cleaner Malkajgiri.', 'Official Campaign Slogan');
    insertSetting.run('campaign_slogan_te', '4 స్ట్రీమ్స్. ఒకే మిషన్. పరిశుభ్రమైన మల్కాజ్‌గిరి.', 'Official Campaign Slogan (Telugu)');
    insertSetting.run('main_message', 'Which Bin? You Decide!', 'Primary challenge question');
    insertSetting.run('main_message_te', 'ఏ బిన్? మీరే నిర్ణయించండి!', 'Primary challenge question (Telugu)');
    insertSetting.run('supporting_message', 'Learn • Play • Segregate • Become a 4S HERO', 'Support tagline');
    insertSetting.run('supporting_message_te', 'నేర్చుకోండి • ఆడండి • వేరు చేయండి • 4S హీరో అవ్వండి', 'Support tagline (Telugu)');
    insertSetting.run('commissioner_name', 'T. Vinay Krishna Reddy, I.A.S.', 'Official Issuing Authority Name');
    insertSetting.run('commissioner_title', 'Commissioner, Malkajgiri Municipal Corporation', 'Official Issuing Authority Designation');
    insertSetting.run('signature_asset', '', 'Relative path to uploaded official commissioner signature');
    insertSetting.run('cert_id_prefix', 'MMC-4SH-2026-', 'Prefix for generated certificate numbers');
  }

  // 6. Seed Contact Settings
  const countContact = db.prepare('SELECT COUNT(*) as cnt FROM contact_settings').get().cnt;
  if (countContact === 0) {
    const insertContact = db.prepare(`
      INSERT INTO contact_settings (setting_key, label, label_te, value, value_te, icon, is_active, category, display_order)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
    `);

    insertContact.run(
      'org_name',
      'Organisation Name',
      'సంస్థ పేరు',
      'Malkajgiri Municipal Corporation',
      'మల్కాజ్‌గిరి మున్సిపల్ కార్పొరేషన్',
      'fa-building-columns',
      'general',
      1
    );

    insertContact.run(
      'official_address',
      'Official Address',
      'కార్యాలయ చిరునామా',
      'Head Office, Geeta Nagar Main Road, Malkajgiri, Hyderabad, Telangana 500047',
      'ప్రధాన కార్యాలయం, గీతా నగర్ మెయిన్ రోడ్, మల్కాజ్‌గిరి, హైదరాబాద్, తెలంగాణ 500047',
      'fa-location-dot',
      'address',
      2
    );

    insertContact.run(
      'official_email',
      'Official Email',
      'అధికారిక ఇమెయిల్',
      'commissioner-malkajgiri@telangana.gov.in',
      'commissioner-malkajgiri@telangana.gov.in',
      'fa-envelope',
      'contact',
      3
    );

    insertContact.run(
      'secondary_email',
      'Helpline / Public Grievance Email',
      'ఫిర్యాదుల ఇమెయిల్',
      'swachhmalkajgiri@gmail.com',
      'swachhmalkajgiri@gmail.com',
      'fa-envelope-open-text',
      'contact',
      4
    );

    insertContact.run(
      'official_website',
      'Official Website',
      'అధికారిక వెబ్‌సైట్',
      'https://mmc.telangana.gov.in',
      'https://mmc.telangana.gov.in',
      'fa-globe',
      'contact',
      5
    );

    insertContact.run(
      'helpline_number',
      'MMC Swachhata Toll-Free Helpline',
      'టోల్ ఫ్రీ సహాయ కేంద్రం',
      '1800-425-0000 / 040-27242222',
      '1800-425-0000 / 040-27242222',
      'fa-phone-volume',
      'contact',
      6
    );

    insertContact.run(
      'office_hours',
      'Office Working Hours',
      'కార్యాలయ పనివేళలు',
      'Monday to Saturday: 10:00 AM – 5:30 PM (Closed on 2nd Saturdays & Public Holidays)',
      'సోమవారం నుండి శనివారం: ఉదయం 10:00 – సాయంత్రం 5:30 (రెండో శనివారం & సెలవు దినాలలో సెలవు)',
      'fa-clock',
      'general',
      7
    );

    insertContact.run(
      'map_location_url',
      'Location on Google Maps',
      'గూగుల్ మ్యాప్స్ లింక్',
      'https://maps.google.com/?q=Malkajgiri+Municipal+Corporation',
      'https://maps.google.com/?q=Malkajgiri+Municipal+Corporation',
      'fa-map-pin',
      'address',
      8
    );

    // Social Media
    insertContact.run(
      'social_instagram',
      'Instagram Handle',
      'ఇన్‌స్టాగ్రామ్',
      'https://instagram.com/MCMalkajgiri',
      '@MCMalkajgiri',
      'fa-brands fa-instagram',
      'social',
      9
    );

    insertContact.run(
      'social_facebook',
      'Facebook Page',
      'ఫేస్‌బుక్',
      'https://facebook.com/MCMalkajgiri',
      'Malkajgiri Municipal Corporation',
      'fa-brands fa-facebook',
      'social',
      10
    );

    insertContact.run(
      'social_x',
      'X / Twitter',
      'ట్విట్టర్ / X',
      'https://x.com/MCMalkajgiri',
      '@MCMalkajgiri',
      'fa-brands fa-x-twitter',
      'social',
      11
    );

    insertContact.run(
      'social_youtube',
      'YouTube Channel',
      'యూట్యూబ్',
      'https://youtube.com/@swachhmalkajgiri',
      'Swachh Malkajgiri MMC',
      'fa-brands fa-youtube',
      'social',
      12
    );
  }

  // 7. Seed Official Brand Logos
  const countLogos = db.prepare('SELECT COUNT(*) as cnt FROM brand_logos').get().cnt;
  if (countLogos === 0) {
    const insertLogo = db.prepare(`
      INSERT INTO brand_logos (name, file_path, placement, display_order, is_active, aspect_ratio)
      VALUES (?, ?, ?, ?, 1, ?)
    `);

    insertLogo.run('Malkajgiri Municipal Corporation Logo (Horizontal)', '/assets/logos/mmc-logo-horizontal.jpeg', 'Header', 1, '3:1');
    insertLogo.run('Malkajgiri Municipal Corporation Logo (Vertical)', '/assets/logos/mmc-logo-vertical.jpeg', 'Certificate', 2, '1:1');
    insertLogo.run('Government of Telangana State Emblem', '/assets/logos/telangana-govt-logo.png', 'Header', 3, '1:1');
    insertLogo.run('Telangana Rising Logo', '/assets/logos/telangana-rising-logo.png', 'Header', 4, '1:1');
    insertLogo.run('Official Multi-Authority Logos Header Banner', '/assets/logos/official-govt-logos.png', 'Home Page', 5, '5:1');
    insertLogo.run('4S HERO Mascot - Full Challenge Poster', '/assets/mascot/4s-hero-poster-full.png', 'Home Page', 6, '2:3');
    insertLogo.run('4S HERO Mascot Wet Waste Guide', '/assets/mascot/mascot-wet-guide.png', 'Game Pages', 7, '3:2');
    insertLogo.run('4S HERO Mascot Dry Waste Guide', '/assets/mascot/mascot-dry-guide.png', 'Game Pages', 8, '3:2');
    insertLogo.run('4S HERO Mascot Sanitary Waste Guide', '/assets/mascot/mascot-sanitary-guide.png', 'Game Pages', 9, '3:2');
    insertLogo.run('4S HERO Mascot Special Care Waste Guide', '/assets/mascot/mascot-special-guide.png', 'Game Pages', 10, '3:2');
    insertLogo.run('Telugu 4S HERO Campaign Banner 1', '/assets/banners/telugu-banner-1.png', 'Results', 11, '1:2');
    insertLogo.run('Telugu 4S HERO Campaign Banner 2', '/assets/banners/telugu-banner-2.png', 'Results', 12, '1:2');
  }

  // 8. Seed Super Admin User (if none exists)
  const countAdmins = db.prepare('SELECT COUNT(*) as cnt FROM admin_users').get().cnt;
  if (countAdmins === 0) {
    const { hash, salt } = hashPassword('MmcAdmin@2026!');
    const insertAdmin = db.prepare(`
      INSERT INTO admin_users (username, password_hash, salt, full_name, email, role, is_active)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `);
    insertAdmin.run(
      'admin',
      hash,
      salt,
      'Super Administrator',
      'commissioner-malkajgiri@telangana.gov.in',
      'SUPER_ADMIN'
    );
  }

  console.log('Database seeded successfully!');
}

if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
