/* BRITEMAKERS ERP — dummy data (seeded, relative to "today" so the demo always feels live).
   All people, plates, numbers and invoices are fictional. Branch phone numbers are the public ones from the brand's bio. */
(function (BM) {
  'use strict';
  const { hash } = BM.util;

  /* ---------- seeded RNG ---------- */
  function mulberry(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const R = mulberry(20261117);
  const pick = (a, r = R) => a[Math.floor(r() * a.length)];
  const between = (a, b, r = R) => Math.round(a + r() * (b - a));
  const shuffle = (a, r = R) => { const x = a.slice(); for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [x[i], x[j]] = [x[j], x[i]]; } return x; };

  const NOW = new Date();
  const TODAY = new Date(NOW); TODAY.setHours(0, 0, 0, 0);
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const minsAgo = (m) => new Date(NOW.getTime() - m * 60000);
  const minsAhead = (m) => new Date(NOW.getTime() + m * 60000);
  const iso = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');

  const data = BM.data;
  data.NOW = NOW; data.TODAY = TODAY; data.addDays = addDays; data.iso = iso; data.mulberry = mulberry;

  /* ---------- branches ---------- */
  data.branches = [
    { id: 'ktym', name: 'Kottayam', code: 'KTYM', phone: '080894 99779', bays: 6, manager: 'Arjun Menon', color: 'var(--c2)', hours: '9:00 AM – 7:00 PM', base: 62000 },
    { id: 'kochi', name: 'Kochi', code: 'KOCHI', phone: '97544 04040', bays: 8, manager: 'Rahul Varghese', color: 'var(--c1)', hours: '9:00 AM – 7:30 PM', base: 98000 },
    { id: 'tvm', name: 'Trivandrum', code: 'TVM', phone: '062628 58585', bays: 6, manager: 'Lekshmi Nair', color: 'var(--c3)', hours: '9:00 AM – 7:00 PM', base: 56000 },
  ];
  data.branchById = Object.fromEntries(data.branches.map((b) => [b.id, b]));

  /* ---------- services ---------- */
  data.svcCats = {
    coating: { label: 'Coatings', color: 'var(--c1)', icon: 'shield' },
    ppf: { label: 'Paint Protection Film', color: 'var(--c2)', icon: 'layers' },
    interior: { label: 'Interior', color: 'var(--c3)', icon: 'car' },
    exterior: { label: 'Exterior & Polish', color: 'var(--c4)', icon: 'sparkles' },
    film: { label: 'Sun Film', color: 'var(--c5)', icon: 'sun2' },
    bike: { label: 'Two-Wheeler', color: 'var(--c6)', icon: 'bike' },
  };
  data.classes = ['Hatchback', 'Sedan', 'SUV', 'Luxury'];
  data.bikeClasses = ['Commuter', 'Mid-size', 'Premium', 'Superbike'];
  data.services = [
    { id: 'gra', name: 'Graphene Coating Pro', cat: 'coating', tiers: [24000, 28000, 34000, 48000], dur: 18, warranty: 7, margin: 62, blurb: 'Heat-dispersing graphene nano-coat. Water-spot resistant, deep candy gloss for years.' },
    { id: 'cer', name: 'Ceramic Coating 9H', cat: 'coating', tiers: [16000, 19000, 24000, 36000], dur: 14, warranty: 5, margin: 58, blurb: 'Hard 9H ceramic shell that locks in gloss and makes washing effortless.' },
    { id: 'bor', name: 'Borophene Shield', cat: 'coating', tiers: [32000, 38000, 46000, 65000], dur: 20, warranty: 8, margin: 66, blurb: 'Next-gen borophene formula — extreme hardness, anti-scratch and thermal stability.' },
    { id: 'ppf-full', name: 'PPF Full Body · Gloss', cat: 'ppf', tiers: [78000, 95000, 125000, 185000], dur: 38, warranty: 10, margin: 44, blurb: 'Self-healing TPU film on every painted panel. Invisible armour against chips and swirls.' },
    { id: 'ppf-matte', name: 'PPF Full Body · Satin/Matte', cat: 'ppf', tiers: [92000, 110000, 145000, 210000], dur: 44, warranty: 10, margin: 46, blurb: 'Factory-matte finish without the maintenance headache — protected and unmistakable.' },
    { id: 'ppf-front', name: 'PPF Front Kit', cat: 'ppf', tiers: [24000, 28000, 36000, 52000], dur: 9, warranty: 8, margin: 48, blurb: 'Bonnet, bumper, fenders, mirrors and headlights — the high-impact zone, covered.' },
    { id: 'int-deep', name: 'Interior Deep Clean', cat: 'interior', tiers: [3500, 4200, 5800, 8500], dur: 5, warranty: 0, margin: 71, blurb: 'Full vacuum, steam, extraction and conditioning. Smells and looks showroom-fresh.' },
    { id: 'int-leather', name: 'Leather Restoration & Care', cat: 'interior', tiers: [6500, 8000, 11000, 16000], dur: 9, warranty: 0, margin: 64, blurb: 'Deep clean, colour restore and protective nano-sealant for seats and trims.' },
    { id: 'int-steam', name: 'Steam Sanitise + Ozone', cat: 'interior', tiers: [1800, 2200, 2800, 3800], dur: 2, warranty: 0, margin: 78, blurb: 'Hospital-grade steam and ozone treatment to neutralise bacteria and odour.' },
    { id: 'wash', name: 'Premium Foam Wash', cat: 'exterior', tiers: [800, 1000, 1400, 2200], dur: 1.5, warranty: 0, margin: 74, blurb: 'pH-neutral foam, hand wash, wheel and arch detail, spot-free dry.' },
    { id: 'polish', name: 'Paint Correction · 2-Stage', cat: 'exterior', tiers: [9500, 12000, 16000, 26000], dur: 12, warranty: 0, margin: 59, blurb: 'Machine compound + finish polish removes swirls, haze and oxidation.' },
    { id: 'headlight', name: 'Headlight Restoration', cat: 'exterior', tiers: [2500, 2800, 3400, 5200], dur: 2.5, warranty: 0, margin: 68, blurb: 'Wet-sand, polish and UV-seal yellowed or hazy headlamps.' },
    { id: 'engine', name: 'Engine Bay Detailing', cat: 'exterior', tiers: [2200, 2600, 3200, 4800], dur: 2, warranty: 0, margin: 70, blurb: 'Degrease, dress and protect — a clean bay that reads like new.' },
    { id: 'film-ir', name: 'Sun Film · Ceramic IR', cat: 'film', tiers: [9500, 12000, 16000, 24000], dur: 5, warranty: 10, margin: 52, blurb: 'Rejects up to 99% IR heat and UV. Not just privacy — real cabin cooling.' },
    { id: 'film-std', name: 'Sun Film · Premium', cat: 'film', tiers: [4500, 5500, 7500, 11000], dur: 4, warranty: 5, margin: 49, blurb: 'Dual-layer carbon film for glare reduction, privacy and a sleek look.' },
    { id: 'bike-cer', name: 'Two-Wheeler Ceramic', cat: 'bike', tiers: [4500, 6500, 9500, 15000], dur: 5, warranty: 3, margin: 63, blurb: 'Ceramic armour for tank, fairings and fenders on every kind of bike.' },
    { id: 'bike-ppf', name: 'Two-Wheeler PPF Kit', cat: 'bike', tiers: [7500, 11000, 16000, 26000], dur: 8, warranty: 5, margin: 47, blurb: 'Tank, fender and headlight PPF kit. Keeps the paint show-ready.' },
    { id: 'bike-detail', name: 'Two-Wheeler Full Detail', cat: 'bike', tiers: [1800, 2600, 3800, 6000], dur: 3.5, warranty: 0, margin: 72, blurb: 'Degrease, deep clean, chain care, polish and protect. Rides like day one.' },
  ];
  data.svcById = Object.fromEntries(data.services.map((s) => [s.id, s]));
  data.priceFor = (svcId, tier) => data.svcById[svcId].tiers[tier];
  data.svcMix = { coating: 31, ppf: 27, interior: 13, exterior: 10, film: 12, bike: 7 };

  /* ---------- vehicle models: [make, model, class, shape, tier, isBike] ---------- */
  const MODELS = [
    ['Porsche', 'Cayenne', 'Luxury', 'suv', 3], ['Porsche', 'Macan', 'Luxury', 'suv', 3], ['BMW', 'X5', 'Luxury', 'suv', 3], ['BMW', '3 Series', 'Sedan', 'sedan', 1],
    ['Mercedes-Benz', 'GLE', 'Luxury', 'suv', 3], ['Mercedes-Benz', 'C-Class', 'Sedan', 'sedan', 1], ['Audi', 'Q7', 'Luxury', 'suv', 3], ['Audi', 'A6', 'Sedan', 'sedan', 1],
    ['Range Rover', 'Velar', 'Luxury', 'suv', 3], ['Toyota', 'Land Cruiser 300', 'Luxury', 'suv', 3], ['Volvo', 'XC90', 'Luxury', 'suv', 3], ['Lexus', 'NX', 'Luxury', 'suv', 3],
    ['Porsche', '911 Carrera', 'Luxury', 'sport', 3], ['Toyota', 'Fortuner', 'SUV', 'suv', 2], ['Toyota', 'Innova Hycross', 'SUV', 'suv', 2], ['Hyundai', 'Creta', 'SUV', 'suv', 2],
    ['Kia', 'Seltos', 'SUV', 'suv', 2], ['Kia', 'Carens', 'SUV', 'suv', 2], ['Mahindra', 'Thar', 'SUV', 'suv', 2], ['Mahindra', 'XUV700', 'SUV', 'suv', 2], ['Tata', 'Harrier', 'SUV', 'suv', 2],
    ['MG', 'Hector', 'SUV', 'suv', 2], ['Honda', 'City', 'Sedan', 'sedan', 1], ['Skoda', 'Slavia', 'Sedan', 'sedan', 1], ['Maruti Suzuki', 'Swift', 'Hatchback', 'hatch', 0],
    ['Hyundai', 'i20', 'Hatchback', 'hatch', 0], ['Tata', 'Altroz', 'Hatchback', 'hatch', 0],
  ];
  const BIKES = [
    ['Royal Enfield', 'Classic 350', 'Bike', 'bike', 1], ['Royal Enfield', 'Himalayan 450', 'Bike', 'bike', 2], ['Kawasaki', 'Ninja ZX-10R', 'Bike', 'bike', 3],
    ['Triumph', 'Speed 400', 'Bike', 'bike', 2], ['Ducati', 'Panigale V2', 'Bike', 'bike', 3], ['KTM', 'Duke 390', 'Bike', 'bike', 2], ['Yamaha', 'R15 V4', 'Bike', 'bike', 1],
  ];
  const LUX = MODELS.filter((m) => m[2] === 'Luxury'), MAIN = MODELS.filter((m) => m[2] !== 'Luxury');
  const COLORS = [['Jet Black', '#2b2b31'], ['Pearl White', '#e8e8ec'], ['Gunmetal Grey', '#5b6068'], ['Racing Red', '#c93a33'], ['Midnight Blue', '#27407a'], ['Burnt Orange', '#d96a1f'], ['Forest Green', '#2f5b46'], ['Silver', '#aeb2b8'], ['Champagne', '#c8b08a'], ['Sand Beige', '#b9a27f']];
  const RTO = { Kottayam: '05', Kochi: '07', Trivandrum: '01', Alappuzha: '04', Thrissur: '08', Kollam: '02', Pathanamthitta: '03' };
  const LETTERS = 'ABCDEFGHJKLMNPRSTUVW';
  const plate = (city) => `KL ${RTO[city] || '07'} ${pick(LETTERS)}${pick(LETTERS)} ${String(between(1000, 9899))}`;
  const cityBranch = { Kottayam: 'ktym', Alappuzha: 'ktym', Pathanamthitta: 'ktym', Kochi: 'kochi', Thrissur: 'kochi', Trivandrum: 'tvm', Kollam: 'tvm' };

  /* ---------- team ---------- */
  const T = (id, name, role, branch, skills, extra = {}) => ({ id, name, role, branch, skills, tech: true, ...extra });
  const S = (id, name, role, branch, extra = {}) => ({ id, name, role, branch, skills: [], tech: false, ...extra });
  data.staff = [
    T('t01', 'Arun Chandran', 'Master Detailer', 'ktym', ['Ceramic', 'Graphene', 'Paint Correction'], { cert: 'Certified Coating Applicator' }),
    T('t02', 'Sabu Thomas', 'PPF Installer', 'ktym', ['PPF', 'Sun Film'], { cert: 'Certified PPF Installer' }),
    T('t03', 'Vishnu Prasad', 'Interior Specialist', 'ktym', ['Interior', 'Leather']),
    T('t04', 'Midhun Raj', 'Polisher', 'ktym', ['Paint Correction', 'Wash']),
    T('t05', 'Anoop Kurian', 'Bike Detailer', 'ktym', ['Two-Wheeler', 'Ceramic']),
    T('t06', 'Sreejith Mohan', 'Master Detailer', 'kochi', ['Ceramic', 'Graphene', 'Borophene'], { cert: 'Certified Coating Applicator' }),
    T('t07', 'Faisal Rahman', 'PPF Installer', 'kochi', ['PPF', 'Colour PPF'], { cert: 'Certified PPF Installer' }),
    T('t08', 'Jithin Joseph', 'Coating Specialist', 'kochi', ['Ceramic', 'Borophene']),
    T('t09', 'Akhil Das', 'Interior Specialist', 'kochi', ['Interior', 'Leather', 'Steam']),
    T('t10', 'Naveen Pillai', 'Sun Film Installer', 'kochi', ['Sun Film', 'PPF']),
    T('t11', 'Ajmal Basheer', 'Polisher', 'kochi', ['Paint Correction', 'Headlights']),
    T('t12', 'Basil Paul', 'Bike Detailer', 'kochi', ['Two-Wheeler', 'PPF']),
    T('t13', 'Shibu Varghese', 'Master Detailer', 'tvm', ['Ceramic', 'Graphene', 'Paint Correction'], { cert: 'Certified Coating Applicator' }),
    T('t14', 'Rohith Sasi', 'PPF Installer', 'tvm', ['PPF', 'Sun Film'], { cert: 'Certified PPF Installer' }),
    T('t15', 'Adithya Nair', 'Coating Specialist', 'tvm', ['Ceramic', 'Graphene']),
    T('t16', 'Manu Gopan', 'Interior Specialist', 'tvm', ['Interior', 'Steam']),
    T('t17', 'Sajith Kumar', 'Polisher', 'tvm', ['Paint Correction', 'Wash']),
    S('s01', 'Arjun Menon', 'Branch Manager', 'ktym'), S('s02', 'Rahul Varghese', 'Branch Manager', 'kochi'), S('s03', 'Lekshmi Nair', 'Branch Manager', 'tvm'),
    S('s04', 'Devika Suresh', 'Service Advisor', 'kochi'), S('s05', 'Anjana Mohan', 'Front Desk', 'ktym'), S('s06', 'Gokul Krishna', 'Service Advisor', 'tvm'),
    S('s07', 'Nikhil Raj', 'Operations Head', 'all'),
  ];
  data.staff.forEach((p, i) => {
    const r = mulberry(hash(p.id));
    p.jobs = p.tech ? between(16, 40, r) : between(0, 0, r);
    p.rating = +(4.5 + r() * 0.47).toFixed(2);
    p.util = p.tech ? between(62, 96, r) : 0;
    p.attendance = i % 11 === 4 ? 'leave' : i % 7 === 3 ? 'late' : 'present';
    p.phone = `+91 9${between(0, 9, r)}${between(0, 9, r)}•• ••${between(100, 999, r)}`;
    p.revenue = p.tech ? p.jobs * between(9000, 17500, r) : 0;
    p.joined = iso(addDays(TODAY, -between(120, 1800, r)));
  });
  data.staffById = Object.fromEntries(data.staff.map((s) => [s.id, s]));
  data.techs = data.staff.filter((s) => s.tech);
  data.me = data.staffById.s07;

  /* ---------- customers ---------- */
  const CUST = [
    ['Anand Krishnan', 'Kottayam'], ['Neha Thomas', 'Kochi'], ['Rohit Nair', 'Trivandrum'], ['Fathima Basheer', 'Kochi'], ['Joseph Mathew', 'Kottayam'],
    ['Aswin Raj', 'Alappuzha'], ['Dr. Meera Pillai', 'Trivandrum'], ['Sanjay Kurian', 'Kottayam'], ['Shabana Rahim', 'Kochi'], ['Vivek Menon', 'Thrissur'],
    ['Priya Varma', 'Kochi'], ['Tomy Abraham', 'Kottayam'], ['Hari Govind', 'Trivandrum'], ['Remya Suresh', 'Kollam'], ['Nithin Philip', 'Kochi'],
    ['Aleena Jose', 'Kottayam'], ['Jaison Chacko', 'Pathanamthitta'], ['Karthik Subramanian', 'Trivandrum'], ['Sneha Mohandas', 'Kochi'], ['Abdul Rasheed', 'Kochi'],
    ['Binoy Varghese', 'Kottayam'], ['Gayathri Devi', 'Trivandrum'], ['Ebin Sam', 'Kochi'], ['Dilshad Hameed', 'Thrissur'], ['Rijo Antony', 'Kottayam'],
    ['Malavika Unni', 'Kochi'], ['Sreenath Kumar', 'Trivandrum'], ['Liya Francis', 'Kochi'], ['Giridhar Nambiar', 'Kochi'], ['Anson George', 'Kottayam'],
    ['Malabar Cabs Pvt Ltd', 'Kochi', 'fleet'], ['Meenachil Motors', 'Kottayam', 'fleet'], ['Capital City Rentals', 'Trivandrum', 'fleet'],
  ];
  const TAGS = ['Prefers WhatsApp', 'Weekend slots', 'Pickup & drop', 'Referral partner', 'Annual care plan', 'Corporate billing', 'Enthusiast'];
  const combosCar = [['gra'], ['cer', 'int-deep'], ['ppf-full'], ['ppf-front', 'film-ir'], ['bor', 'int-steam'], ['polish', 'cer'], ['int-deep', 'wash'], ['film-ir'], ['ppf-matte'], ['int-leather', 'int-steam'], ['gra', 'film-ir'], ['wash', 'engine'], ['polish', 'wash'], ['headlight', 'polish'], ['ppf-full', 'cer']];
  const combosBike = [['bike-cer'], ['bike-ppf', 'bike-detail'], ['bike-detail'], ['bike-cer', 'bike-detail']];
  const combosLux = [['ppf-full', 'cer'], ['bor'], ['gra', 'film-ir'], ['ppf-matte'], ['gra', 'int-leather'], ['ppf-full', 'film-ir'], ['bor', 'int-steam', 'film-ir']];
  const comboFor = (v, r = R) => (v.shape === 'bike' ? pick(combosBike, r) : v.cls === 'Luxury' ? pick(combosLux, r) : pick(combosCar, r));
  const mkVehicle = (m, city, idx) => {
    const [cn, hex] = pick(COLORS);
    return { id: `V-${1000 + idx}`, make: m[0], model: m[1], cls: m[2], shape: m[3], tier: m[4], plate: plate(city), color: hex, colorName: cn, year: between(2019, 2026), bike: m[2] === 'Bike' };
  };
  const priceVeh = (svcId, v) => data.priceFor(svcId, v.tier);
  const cleanTotal = (svcs, v) => svcs.reduce((t, id) => t + priceVeh(id, v), 0);

  let vIdx = 0;
  data.customers = CUST.map(([name, city, kind], i) => {
    const branch = cityBranch[city];
    const r = mulberry(hash(name));
    const vehicles = [];
    if (kind === 'fleet') {
      const fm = [MODELS.find((m) => m[1] === 'Innova Hycross'), MODELS.find((m) => m[1] === 'Honda City' || m[1] === 'City'), MODELS.find((m) => m[1] === 'Creta')];
      fm.forEach((m) => vehicles.push(mkVehicle(m, city, vIdx++)));
    } else {
      const lux = i % 4 === 0 || i % 7 === 1;
      vehicles.push(mkVehicle(lux ? pick(LUX, r) : pick(MAIN, r), city, vIdx++));
      if (i % 3 === 0) vehicles.push(mkVehicle(pick(MAIN, r), city, vIdx++));
      if (i % 5 === 2) vehicles.push(mkVehicle(pick(BIKES, r), city, vIdx++));
    }
    const nVisits = kind === 'fleet' ? between(7, 11, r) : between(2, 6, r);
    const history = [];
    for (let k = 0; k < nVisits; k++) {
      const v = pick(vehicles, r);
      const svcs = comboFor(v, r);
      const date = addDays(TODAY, -between(kind === 'fleet' ? 6 : 9, 1050, r));
      history.push({ date, vehicleId: v.id, svcs, amount: cleanTotal(svcs, v), branch: r() < 0.88 ? branch : pick(['ktym', 'kochi', 'tvm'], r) });
    }
    history.sort((a, b) => b.date - a.date);
    const ltv = history.reduce((t, h) => t + h.amount, 0);
    const tier = kind === 'fleet' ? 'Fleet' : ltv >= 300000 ? 'Signature' : ltv >= 110000 ? 'Gold' : 'Regular';
    const first = name.replace(/^Dr\.?\s+/, '').split(' ')[0].toLowerCase();
    const last = name.split(' ').slice(-1)[0].toLowerCase();
    return {
      id: `C-${2001 + i}`, name, city, branch, kind: kind || 'person', tier, vehicles, history, ltv, visits: history.length, last: history[0].date,
      phone: `+91 9${between(0, 9, r)}${between(0, 9, r)}•• ••${between(100, 999, r)}`,
      email: kind === 'fleet' ? `accounts@${name.split(' ')[0].toLowerCase()}.example.com` : `${first}.${last}@example.com`,
      tags: shuffle(TAGS, r).slice(0, between(1, 3, r)).concat(kind === 'fleet' ? ['Corporate billing'] : []).filter((x, ix, a) => a.indexOf(x) === ix),
      nps: between(7, 10, r), since: addDays(history[history.length - 1].date, -between(0, 160, r)),
      notes: pick(['Prefers morning drop-offs.', 'Wants photo updates on WhatsApp during work.', 'Sensitive about swirl marks — always inspect under lights.', 'Referred 3 friends last season.', 'Pay on delivery via UPI.', 'Likes matte finishes. Upsell satin PPF.', 'Pickup & drop from residence.'], r),
    };
  });
  data.custById = Object.fromEntries(data.customers.map((c) => [c.id, c]));
  data.vehById = {}; data.customers.forEach((c) => c.vehicles.forEach((v) => { v.custId = c.id; data.vehById[v.id] = v; }));

  /* ---------- job cards ---------- */
  data.STATUS = [
    { id: 'checkin', label: 'Check-in', kind: 'info', hint: 'Vehicle received' },
    { id: 'inspection', label: 'Inspection', kind: 'violet', hint: 'Pre-work audit' },
    { id: 'progress', label: 'In Progress', kind: 'accent', hint: 'On the bay' },
    { id: 'qc', label: 'Quality Check', kind: 'warn', hint: 'Final inspection' },
    { id: 'ready', label: 'Ready', kind: 'ok', hint: 'Awaiting delivery' },
    { id: 'delivered', label: 'Delivered', kind: '', hint: 'Handed over today' },
  ];
  data.statusById = Object.fromEntries(data.STATUS.map((s) => [s.id, s]));
  const CHECKS = {
    coating: ['Wash & decontamination', 'Clay bar & iron removal', 'Paint correction pass', 'IPA panel wipe-down', 'Coating application', 'IR curing', 'Final inspection under lights'],
    ppf: ['Wash & decontamination', 'Panel mapping & pre-cut', 'Surface prep & clay', 'Film application', 'Edge wrap & sealing', 'Heat-set & cure', 'QC & handover'],
    interior: ['Vacuum & air purge', 'Dashboard & console clean', 'Seat extraction', 'Leather / fabric conditioning', 'Steam sanitise', 'Glass & screens', 'Final inspection'],
    exterior: ['Foam wash & decon', 'Masking & inspection', 'Compound pass', 'Finish polish', 'Panel wipe', 'Sealant / wax', 'Final inspection'],
    film: ['Glass clean & prep', 'Pattern cut', 'Film application', 'Squeegee & edge seal', 'Cure check', 'QC & handover'],
    bike: ['Degrease & wash', 'Decontamination', 'Polish / correction', 'Coating or film', 'Chain & hardware care', 'Final inspection'],
  };
  data.checklistFor = (job) => CHECKS[data.svcById[job.svcs[0]].cat];
  const roleFor = { coating: ['Master Detailer', 'Coating Specialist'], ppf: ['PPF Installer'], interior: ['Interior Specialist'], exterior: ['Polisher', 'Master Detailer'], film: ['Sun Film Installer', 'PPF Installer'], bike: ['Bike Detailer'] };
  const pattern = {
    ktym: ['checkin', 'checkin', 'inspection', 'progress', 'progress', 'progress', 'qc', 'ready', 'delivered', 'delivered'],
    kochi: ['checkin', 'checkin', 'checkin', 'inspection', 'progress', 'progress', 'progress', 'progress', 'qc', 'qc', 'ready', 'ready', 'delivered', 'delivered', 'delivered'],
    tvm: ['checkin', 'inspection', 'progress', 'progress', 'progress', 'qc', 'ready', 'ready', 'delivered', 'delivered'],
  };
  data.jobs = [];
  let jn = 0;
  data.branches.forEach((b) => {
    const pool = shuffle(data.customers.filter((c) => c.branch === b.id).flatMap((c) => c.vehicles.map((v) => ({ c, v }))));
    const bayCursor = { n: 1 };
    pattern[b.id].forEach((status, k) => {
      const { c, v } = pool[k % pool.length];
      const svcs = comboFor(v);
      const cat = data.svcById[svcs[0]].cat;
      const pr = (roleFor[cat] || []);
      const bt = data.techs.filter((t) => t.branch === b.id);
      const lead = bt.find((t) => pr.includes(t.role)) || pick(bt);
      const helper = pick(bt.filter((t) => t.id !== lead.id));
      const dur = Math.max(...svcs.map((s) => data.svcById[s].dur));
      const amount = cleanTotal(svcs, v);
      const inBay = ['inspection', 'progress', 'qc'].includes(status);
      let created, eta, progress, deliveredAt;
      if (status === 'checkin') { created = minsAgo(between(8, 50)); eta = minsAhead(dur * 60 * 0.9 + between(60, 400)); progress = 0; }
      else if (status === 'inspection') { created = minsAgo(between(55, 130)); eta = minsAhead(dur * 60 * 0.85); progress = between(4, 12); }
      else if (status === 'progress') { progress = between(24, 86); created = minsAgo(Math.min(60 * 40, Math.round(dur * 60 * (progress / 100) + between(30, 120)))); eta = minsAhead(Math.max(40, Math.round(dur * 60 * (1 - progress / 100)))); }
      else if (status === 'qc') { progress = between(90, 97); created = minsAgo(between(60 * 9, 60 * 30)); eta = minsAhead(between(20, 110)); }
      else if (status === 'ready') { progress = 100; created = minsAgo(between(60 * 26, 60 * 70)); eta = minsAgo(between(10, 90)); }
      else { progress = 100; created = minsAgo(between(60 * 28, 60 * 80)); deliveredAt = minsAgo(between(40, 60 * 7)); eta = deliveredAt; }
      const job = {
        id: `JC-${4180 + jn++}`, status, custId: c.id, vehId: v.id, branch: b.id, svcs, techs: [lead.id, helper.id], bay: inBay ? bayCursor.n++ : null,
        progress, created, eta, deliveredAt, amount, priority: pick(['low', 'med', 'med', 'high', 'low']), advance: status === 'delivered' ? amount : Math.round(amount * pick([0.2, 0.3, 0.5]) / 100) * 100,
        notes: pick(['Customer wants updates on WhatsApp.', 'Pre-existing scratch on RH rear door — photographed at check-in.', 'Delivery slated for evening. Keep ready by 5 PM.', 'Upsell: sun film on next visit.', 'Customer dropped keys at reception — pickup service used.', 'Handle with care: freshly repainted bumper (4 months).']),
        doneChecks: 0,
      };
      job.doneChecks = status === 'delivered' || status === 'ready' ? 99 : Math.floor((progress / 100) * data.checklistFor(job).length);
      data.jobs.push(job);
    });
  });
  data.jobById = Object.fromEntries(data.jobs.map((j) => [j.id, j]));
  data.jobTotal = (job) => cleanTotal(job.svcs, data.vehById[job.vehId]);
  data.priceLine = (svcId, vehId) => priceVeh(svcId, data.vehById[vehId]);

  /* ---------- invoices ---------- */
  data.invoices = [];
  const mkInv = (c, date, svcs, vehId, branch, status, jobId) => {
    const v = data.vehById[vehId];
    const sub = cleanTotal(svcs, v);
    const disc = ['Signature', 'Gold'].includes(c.tier) && hash(c.id + +date) % 3 === 0 ? Math.round(sub * 0.05 / 100) * 100 : 0;
    const taxable = sub - disc, gst = Math.round(taxable * 0.18), total = taxable + gst;
    const r = mulberry(hash(c.id + +date));
    const paid = status === 'paid' ? total : status === 'partial' ? Math.round(total * pick([0.3, 0.5, 0.6], r) / 100) * 100 : 0;
    data.invoices.push({ date, custId: c.id, vehId, svcs, branch, sub, disc, gst, total, paid, status, method: pick(['UPI', 'UPI', 'Card', 'Cash', 'Bank transfer'], r), jobId: jobId || null, due: addDays(date, c.kind === 'fleet' ? 30 : 7) });
  };
  data.customers.forEach((c) => c.history.forEach((h) => {
    const age = Math.round((TODAY - h.date) / 864e5);
    const r = mulberry(hash(c.id + +h.date + 'st'));
    let st = 'paid';
    if (age < 26) st = pick(['paid', 'partial', 'pending', 'pending', 'paid'], r);
    else if (c.kind === 'fleet' && age < 90 && r() < 0.5) st = 'overdue';
    else if (age < 75 && r() < 0.1) st = 'overdue';
    mkInv(c, h.date, h.svcs, h.vehicleId, h.branch, st, null);
  }));
  data.jobs.filter((j) => ['delivered', 'ready'].includes(j.status)).forEach((j) => mkInv(data.custById[j.custId], j.deliveredAt || j.eta, j.svcs, j.vehId, j.branch, j.status === 'delivered' ? 'paid' : 'partial', j.id));
  data.invoices.sort((a, b) => b.date - a.date);
  data.invoices.slice().reverse().forEach((inv, i) => { inv.id = `INV-26-${String(1180 + i).padStart(4, '0')}`; });
  data.invById = Object.fromEntries(data.invoices.map((i) => [i.id, i]));

  /* ---------- warranties ---------- */
  data.warranties = [];
  let wn = 0;
  data.customers.forEach((c) => c.history.forEach((h) => {
    h.svcs.forEach((sid) => {
      const s = data.svcById[sid];
      if (!s.warranty) return;
      const applied = h.date, years = s.warranty;
      const expiry = new Date(applied); expiry.setFullYear(expiry.getFullYear() + years);
      const monthsSince = (TODAY - applied) / (864e5 * 30.44);
      const nextCheck = new Date(applied); nextCheck.setMonth(nextCheck.getMonth() + Math.ceil((monthsSince + 0.05) / 6) * 6);
      const daysToCheck = Math.round((nextCheck - TODAY) / 864e5);
      const r = mulberry(hash(c.id + sid + +applied));
      let status = daysToCheck <= 30 ? 'due' : 'active';
      let claim = null;
      if (r() < 0.035) { status = 'claim'; claim = { issue: pick(['Water-spotting on bonnet', 'Edge lifting at bumper corner', 'Hazing on windscreen film', 'Swirl marks after third-party wash', 'Yellowing at PPF seam']), opened: addDays(TODAY, -between(2, 18, r)) }; }
      data.warranties.push({ id: `WR-${7100 + wn++}`, custId: c.id, vehId: h.vehicleId, svcId: sid, applied, years, expiry, nextCheck, daysToCheck, status, claim, branch: h.branch, cert: `BM-${hash(c.id + sid).toString(36).toUpperCase().slice(0, 6)}` });
    });
  }));
  data.warranties.sort((a, b) => a.daysToCheck - b.daysToCheck);

  /* ---------- inventory ---------- */
  const INV = [
    ['Graphene Coat Pro · 50 ml kit', 'Coatings', 'kits', [14, 22, 11], [8, 10, 6], 6800, 'NanoShield Distributors', 12],
    ['Ceramic 9H Coat · 30 ml bottle', 'Coatings', 'bottles', [26, 41, 19], [12, 20, 10], 2900, 'NanoShield Distributors', 31],
    ['Borophene Shield · 50 ml kit', 'Coatings', 'kits', [5, 9, 3], [4, 6, 3], 9800, 'NanoShield Distributors', 5],
    ['PPF Gloss Roll · 1.52 m × 15 m', 'Film', 'rolls', [3, 6, 2], [2, 4, 2], 118000, 'Armour Film Co.', 2.4],
    ['PPF Satin/Matte Roll · 1.52 m × 15 m', 'Film', 'rolls', [1, 3, 1], [1, 2, 1], 132000, 'Armour Film Co.', 1.1],
    ['Colour PPF · Satin Black roll', 'Film', 'rolls', [0, 2, 1], [1, 1, 1], 148000, 'Armour Film Co.', .6],
    ['Sun Film Ceramic IR · 1.52 m × 30 m', 'Film', 'rolls', [4, 7, 3], [2, 4, 2], 38500, 'FilmWorks India', 2.1],
    ['Sun Film Premium · 1.52 m × 30 m', 'Film', 'rolls', [5, 8, 4], [2, 3, 2], 21500, 'FilmWorks India', 2.8],
    ['PPF Slip Solution · 5 L', 'Chemicals', 'cans', [9, 14, 8], [4, 6, 4], 1450, 'ShineChem Traders', 9],
    ['Iron Remover · 5 L', 'Chemicals', 'cans', [7, 12, 6], [4, 6, 4], 2100, 'ShineChem Traders', 8],
    ['Foam Shampoo pH-neutral · 20 L', 'Chemicals', 'cans', [6, 11, 5], [3, 5, 3], 3600, 'ShineChem Traders', 6],
    ['All-Purpose Cleaner · 20 L', 'Chemicals', 'cans', [4, 9, 6], [3, 4, 3], 2800, 'ShineChem Traders', 4],
    ['Heavy-Cut Compound · 1 L', 'Polish', 'bottles', [8, 14, 7], [4, 6, 4], 2250, 'ProCoat Supplies', 9],
    ['Finishing Polish · 1 L', 'Polish', 'bottles', [7, 13, 6], [4, 6, 4], 2050, 'ProCoat Supplies', 8],
    ['Leather Conditioner · 5 L', 'Interior', 'cans', [3, 6, 3], [2, 3, 2], 3900, 'ProCoat Supplies', 3],
    ['Glass Cleaner · 5 L', 'Chemicals', 'cans', [8, 12, 7], [3, 5, 3], 780, 'ShineChem Traders', 6],
    ['Microfiber Towels · pack of 12', 'Consumables', 'packs', [24, 38, 21], [14, 20, 12], 950, 'ProCoat Supplies', 34],
    ['Polishing Pads · pack of 6', 'Consumables', 'packs', [9, 15, 8], [6, 8, 5], 1300, 'ProCoat Supplies', 11],
    ['IPA Panel Wipe · 5 L', 'Chemicals', 'cans', [3, 8, 2], [3, 5, 3], 1100, 'ShineChem Traders', 7],
    ['Nitrile Gloves · box of 100', 'Consumables', 'boxes', [12, 20, 10], [8, 12, 8], 480, 'ProCoat Supplies', 14],
  ];
  data.inventory = INV.map(([name, cat, unit, stock, reorder, cost, supplier, usage], i) => ({ id: `SKU-${300 + i}`, name, cat, unit, stock: { ktym: stock[0], kochi: stock[1], tvm: stock[2] }, reorder: { ktym: reorder[0], kochi: reorder[1], tvm: reorder[2] }, cost, supplier, usage, lead: 3 + (i % 4) }));
  data.stockFor = (it, branch) => (branch === 'all' ? it.stock.ktym + it.stock.kochi + it.stock.tvm : it.stock[branch]);
  data.reorderFor = (it, branch) => (branch === 'all' ? it.reorder.ktym + it.reorder.kochi + it.reorder.tvm : it.reorder[branch]);
  const stat1 = (it, b) => { const s = it.stock[b], r = it.reorder[b]; return s <= r * 0.6 ? 'critical' : s <= r ? 'low' : 'ok'; };
  const RANK = { ok: 0, low: 1, critical: 2 };
  /* "all" = the worst branch, because a stock-out at one branch is what hurts */
  data.stockStatus = (it, branch) => (branch === 'all' ? ['ktym', 'kochi', 'tvm'].map((b) => stat1(it, b)).sort((a, b) => RANK[b] - RANK[a])[0] : stat1(it, branch));
  /* the branch that is hurting most for an item, used to explain an "all branches" alert */
  data.worstBranch = (it) => ['ktym', 'kochi', 'tvm'].map((b) => ({ b, ratio: it.stock[b] / it.reorder[b] })).sort((x, y) => x.ratio - y.ratio)[0].b;
  data.stockWhere = (it) => ['ktym', 'kochi', 'tvm'].filter((b) => stat1(it, b) !== 'ok');

  /* ---------- leads ---------- */
  data.leadStages = [
    { id: 'new', label: 'New enquiry', kind: 'info' }, { id: 'contacted', label: 'Contacted', kind: 'violet' }, { id: 'quoted', label: 'Quote sent', kind: 'warn' },
    { id: 'booked', label: 'Booked', kind: 'ok' }, { id: 'lost', label: 'Lost', kind: 'bad' },
  ];
  data.leadSources = { Instagram: 'insta', WhatsApp: 'chat', 'Walk-in': 'pin', Referral: 'users', 'Google Maps': 'globe', 'Dealer tie-up': 'link' };
  const LEADS = [
    ['Akshay Rajan', 'Mahindra XUV700', ['ppf-full'], 'Instagram', 'new', 'kochi', 14, 'hot'], ['Ria Mathew', 'Kia Seltos', ['cer'], 'WhatsApp', 'new', 'ktym', 42, 'warm'],
    ['Vishal Nambiar', 'BMW 3 Series', ['gra', 'film-ir'], 'Instagram', 'new', 'tvm', 95, 'hot'], ['Sherin Paul', 'Hyundai Creta', ['film-ir'], 'Google Maps', 'new', 'kochi', 160, 'cold'],
    ['Prasad Warrier', 'Toyota Fortuner', ['ppf-front', 'cer'], 'Referral', 'contacted', 'kochi', 60 * 5, 'hot'], ['Mehrin Ali', 'Mercedes-Benz GLE', ['bor'], 'Instagram', 'contacted', 'kochi', 60 * 8, 'warm'],
    ['Jacob Eapen', 'Royal Enfield Himalayan 450', ['bike-cer', 'bike-detail'], 'Walk-in', 'contacted', 'ktym', 60 * 22, 'warm'], ['Divya Ramesh', 'Tata Harrier', ['int-deep', 'polish'], 'WhatsApp', 'contacted', 'tvm', 60 * 30, 'cold'],
    ['Roshan Cherian', 'Porsche Macan', ['ppf-matte'], 'Dealer tie-up', 'quoted', 'kochi', 60 * 26, 'hot'], ['Alka Pradeep', 'Skoda Slavia', ['gra'], 'Instagram', 'quoted', 'ktym', 60 * 50, 'warm'],
    ['Noufal Hassan', 'Land Cruiser 300', ['ppf-full', 'bor'], 'Referral', 'quoted', 'tvm', 60 * 70, 'hot'], ['Teena Sabu', 'Honda City', ['cer', 'int-steam'], 'WhatsApp', 'quoted', 'kochi', 60 * 90, 'warm'],
    ['Gopika Anil', 'Audi Q7', ['ppf-full', 'cer'], 'Instagram', 'booked', 'kochi', 60 * 52, 'hot'], ['Sumesh Babu', 'Kawasaki Ninja ZX-10R', ['bike-ppf'], 'Instagram', 'booked', 'ktym', 60 * 80, 'hot'],
    ['Lakshmi Prabhu', 'Maruti Suzuki Swift', ['int-deep'], 'Walk-in', 'booked', 'tvm', 60 * 100, 'warm'], ['Irfan Khalid', 'Thar', ['film-std', 'cer'], 'WhatsApp', 'lost', 'kochi', 60 * 140, 'cold'],
    ['Maya Kurup', 'Hyundai i20', ['wash'], 'Google Maps', 'lost', 'ktym', 60 * 160, 'cold'], ['Tinu Joy', 'Duke 390', ['bike-cer'], 'Instagram', 'new', 'kochi', 28, 'warm'],
  ];
  data.leads = LEADS.map(([name, vehicle, svcs, source, stage, branch, ago, temp], i) => {
    const tier = vehicle.match(/Porsche|BMW|Mercedes|Audi|Land Cruiser|Range|Ninja|Ducati/) ? 3 : vehicle.match(/Fortuner|XUV|Seltos|Creta|Harrier|Thar|Himalayan|Duke/) ? 2 : 1;
    const value = svcs.reduce((t, s) => t + (data.svcById[s].tiers[data.svcById[s].cat === 'bike' ? Math.min(3, tier) : tier] || 0), 0);
    return { id: `L-${900 + i}`, name, vehicle, svcs, source, stage, branch, at: minsAgo(ago), temp, value, owner: pick(data.staff.filter((s) => ['Service Advisor', 'Front Desk', 'Branch Manager'].includes(s.role) && (s.branch === branch || s.branch === 'all')) .concat([data.staffById.s04])).name };
  });

  /* ---------- revenue series ---------- */
  const DOW = [1.2, 0.82, 0.88, 0.92, 0.97, 1.08, 1.38];
  const SEASON = [0.96, 0.9, 1.0, 1.05, 0.92, 0.84, 0.82, 1.0, 1.08, 1.1, 1.17, 1.2];
  data.daily = [];
  const dayR = mulberry(777);
  for (let i = 800; i >= 0; i--) {
    const d = addDays(TODAY, -i);
    const row = { date: d, total: 0 };
    data.branches.forEach((b) => {
      let v = b.base * DOW[d.getDay()] * SEASON[d.getMonth()] * (1 + (800 - i) * 0.00048) * (0.86 + dayR() * 0.28);
      if (i === 0) v *= Math.min(1, Math.max(0.18, (NOW.getHours() + NOW.getMinutes() / 60 - 9) / 10));
      row[b.id] = Math.round(v / 100) * 100; row.total += row[b.id];
    });
    data.daily.push(row);
  }
  data.heat = (() => { const r = mulberry(4242); const rows = []; for (let d = 0; d < 7; d++) { const row = []; for (let h = 9; h < 19; h++) { const peak = Math.exp(-Math.pow((h - 14) / 3.2, 2)); const wk = [0.8, 0.55, 0.62, 0.68, 0.75, 0.88, 1][d]; row.push(Math.round(Math.min(98, (28 + 64 * peak) * wk * (0.9 + r() * 0.2)))); } rows.push(row); } return rows; })();

  /* ---------- notifications & activity ---------- */
  const J = data.jobs;
  const pickJob = (status, n = 0) => J.filter((j) => j.status === status)[n] || J[0];
  const jv = (j) => data.vehById[j.vehId];
  data.notifications = [
    { icon: 'alert', title: 'PPF Gloss roll below reorder level', sub: 'Trivandrum has 2 rolls left — about 5 days of cover', t: 12, unread: true },
    { icon: 'shield', title: '9 ceramic check-ups due this week', sub: 'Send WhatsApp reminders in Warranty & Care', t: 38, unread: true },
    { icon: 'check', title: `${pickJob('qc').id} passed quality check`, sub: `${jv(pickJob('qc')).make} ${jv(pickJob('qc')).model} is ready for handover`, t: 64, unread: true },
    { icon: 'target', title: '3 hot leads from Instagram', sub: 'Kochi · replied within 15 min wins 2× conversions', t: 120, unread: false },
    { icon: 'receipt', title: 'Invoice payment received · ₹48,300', sub: 'UPI · auto-reconciled', t: 190, unread: false },
    { icon: 'star', title: 'New 5★ Google review', sub: '“Mirror finish on my Cayenne. Worth every rupee.”', t: 60 * 7, unread: false },
  ];
  data.activity = [
    { icon: 'check', who: 'Sreejith Mohan', what: `moved ${pickJob('qc').id} to Quality Check`, t: 9 },
    { icon: 'receipt', who: 'Devika Suresh', what: `generated invoice ${data.invoices[0].id}`, t: 21 },
    { icon: 'camera', who: 'Faisal Rahman', what: `uploaded 6 before/after photos to ${pickJob('progress').id}`, t: 34 },
    { icon: 'userPlus', who: 'Anjana Mohan', what: 'added a new customer profile · Kottayam', t: 52 },
    { icon: 'truck', who: 'Shibu Varghese', what: `handed over ${pickJob('delivered').id} to customer`, t: 71 },
    { icon: 'package', who: 'Lekshmi Nair', what: 'raised PO #PO-2291 for PPF slip solution', t: 96 },
    { icon: 'target', who: 'Devika Suresh', what: 'booked a Graphene coating from an Instagram lead', t: 128 },
    { icon: 'wrench', who: 'Arun Chandran', what: `started coating application on ${pickJob('progress', 1).id}`, t: 155 },
  ].map((a) => ({ ...a, at: minsAgo(a.t) }));

  /* ---------- schedule generator (bay timeline) ---------- */
  data.appointments = (branchId, date) => {
    const key = iso(date), b = data.branchById[branchId], r = mulberry(hash(branchId + key));
    const out = [], isToday = key === iso(TODAY), nowH = NOW.getHours() + NOW.getMinutes() / 60;
    const used = new Map(); // bay -> next free hour
    const bayJobs = isToday ? data.jobs.filter((j) => j.branch === branchId && j.bay) : [];
    bayJobs.forEach((j) => {
      const v = jv(j), s = data.svcById[j.svcs[0]];
      const end = Math.min(19, Math.max(nowH + 0.8, 9 + Math.max(2, s.dur)));
      out.push({ bay: j.bay, start: 9, end: Math.min(19, end), title: `${v.make} ${v.model}`, sub: s.name, tech: data.staffById[j.techs[0]].name, cat: s.cat, state: 'live', jobId: j.id, cust: data.custById[j.custId].name });
      used.set(j.bay, Math.min(19, end) + 0.25);
    });
    for (let bay = 1; bay <= b.bays; bay++) {
      let cursor = used.get(bay) || 9 + (r() < 0.3 ? 1 : 0);
      let guard = 0;
      while (cursor < 17.2 && guard++ < 3) {
        if (isToday && bayJobs.some((j) => j.bay === bay) && cursor >= 18) break;
        const c = pick(data.customers.filter((c2) => c2.branch === branchId || r() < 0.3), r), v = pick(c.vehicles, r);
        const sid = pick(v.bike ? ['bike-cer', 'bike-detail', 'bike-ppf'] : ['int-deep', 'wash', 'film-ir', 'polish', 'cer', 'ppf-front', 'gra', 'int-steam', 'engine', 'headlight'], r);
        const s = data.svcById[sid];
        if (r() < 0.22) { cursor += 0.5 + r(); continue; }
        const len = Math.min(8.5, Math.max(1.5, s.dur > 8 ? between(6, 8, r) : s.dur));
        const end = Math.min(19, cursor + len);
        if (end - cursor < 1) break;
        const state = isToday ? (end < nowH ? 'done' : cursor <= nowH ? 'live' : 'booked') : date < TODAY ? 'done' : 'booked';
        out.push({ bay, start: cursor, end, title: `${v.make} ${v.model}`, sub: s.name, tech: pick(data.techs.filter((t) => t.branch === branchId), r).name, cat: s.cat, state, cust: c.name });
        cursor = end + 0.25 + (r() < 0.4 ? 0.5 : 0);
      }
    }
    return out;
  };

  /* ---------- selectors (respect global branch filter) ---------- */
  const inB = (x) => BM.state.branch === 'all' || x.branch === BM.state.branch;
  BM.sel = {
    jobs: () => data.jobs.filter(inB),
    customers: () => data.customers.filter(inB),
    invoices: () => data.invoices.filter(inB),
    leads: () => data.leads.filter(inB),
    staff: () => data.staff.filter((s) => BM.state.branch === 'all' || s.branch === BM.state.branch || s.branch === 'all'),
    warranties: () => data.warranties.filter(inB),
    branchIds: () => (BM.state.branch === 'all' ? data.branches.map((b) => b.id) : [BM.state.branch]),
  };
  /* revenue in [fromDaysAgo, toDaysAgo) summed for selected branches */
  data.revenue = (days, offset = 0, branchIds = BM.sel.branchIds()) => {
    const end = data.daily.length - offset, start = end - days;
    return data.daily.slice(Math.max(0, start), end).reduce((t, d) => t + branchIds.reduce((x, b) => x + d[b], 0), 0);
  };
  data.revenueMTD = () => {
    const ids = BM.sel.branchIds();
    const dayN = TODAY.getDate();
    const cur = data.daily.slice(-dayN).reduce((t, d) => t + ids.reduce((x, b) => x + d[b], 0), 0);
    const prevStart = data.daily.length - dayN - new Date(TODAY.getFullYear(), TODAY.getMonth(), 0).getDate();
    const prev = data.daily.slice(prevStart, prevStart + dayN).reduce((t, d) => t + ids.reduce((x, b) => x + d[b], 0), 0);
    return { cur, prev, dayN };
  };
})(window.BM);
