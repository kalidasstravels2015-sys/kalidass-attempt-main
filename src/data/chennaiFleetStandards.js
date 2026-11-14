/**
 * Canonical Vehicle Models, Chennai Hub Zones, 120+ Official Localities (with Pincodes & Common Alias Matching),
 * and Indian Vehicle Registration Plate Formatter for Kalidass Travels Fleet & Dispatch Operations.
 */

export const VEHICLE_CATEGORIES = [
  {
    id: 'Sedan',
    label: 'Sedan (4+1)',
    shortLabel: 'Sedan',
    models: [
      'Swift Dzire',
      'Toyota Etios',
      'Hyundai Aura / Xcent',
      'Honda Amaze',
      'Tata Tigor / Zest',
      'Other Sedan (4+1)'
    ]
  },
  {
    id: 'SUV / Ertiga',
    label: 'SUV / MUV (6–7S)',
    shortLabel: 'Ertiga / SUV',
    models: [
      'Maruti Ertiga',
      'Maruti XL6',
      'Kia Carens',
      'Mahindra Marazzo',
      'Chevrolet Tavera',
      'Mahindra Xylo / Bolero'
    ]
  },
  {
    id: 'Innova Crysta',
    label: 'Innova / Prime SUV',
    shortLabel: 'Innova Crysta',
    models: [
      'Innova Crysta',
      'Toyota Innova',
      'Innova Hycross',
      'Toyota Fortuner'
    ]
  },
  {
    id: 'Tempo Traveller',
    label: 'Tempo / Van (12–26S)',
    shortLabel: 'Tempo / Van',
    models: [
      'Tempo Traveller 12-Seater',
      'Tempo Traveller 14-Seater',
      'Tempo Traveller 17-Seater',
      'Tempo Traveller 20-Seater',
      'Tempo Traveller 26-Seater',
      'Force Urbania'
    ]
  }
];

export const ALL_STANDARDIZED_MODELS = VEHICLE_CATEGORIES.flatMap(cat =>
  cat.models.map(model => ({
    model,
    category: cat.id,
    categoryLabel: cat.label
  }))
);

export const CHENNAI_ZONES = [
  {
    id: 'South & OMR',
    label: 'South & OMR',
    subtitle: 'Medavakkam, Velachery, Sholinganallur, Pallikaranai, Siruseri',
    areas: [
      { name: 'Medavakkam', pincode: '600100', aliases: ['medavakam', 'medavkm', 'bhel nagar', 'united colony'] },
      { name: 'Pallikaranai', pincode: '600100', aliases: ['palikaranai', 'pallikarni'] },
      { name: 'Velachery', pincode: '600042', aliases: ['velacheri', 'vijayanagar'] },
      { name: 'Sholinganallur', pincode: '600119', aliases: ['sholinganallur', 'shollinganallur', 'omr sholinganallur'] },
      { name: 'Madipakkam', pincode: '600091', aliases: ['madipakam', 'keelkattalai', 'kilkattalai'] },
      { name: 'Keelkattalai', pincode: '600117', aliases: ['kilkattalai', 'keelakattalai'] },
      { name: 'Perumbakkam', pincode: '600100', aliases: ['perumbakam', 'global hospital'] },
      { name: 'Kovilambakkam', pincode: '600129', aliases: ['kovilambakam', 'vellakal'] },
      { name: 'Sithalapakkam', pincode: '600126', aliases: ['sithalapakam', 'ootiyambakkam'] },
      { name: 'Nanganallur', pincode: '600061', aliases: ['nanganallur', 'pazhavanthangal'] },
      { name: 'Adambakkam', pincode: '600088', aliases: ['adambakam', 'st thomas mount'] },
      { name: 'Perungudi', pincode: '600096', aliases: ['perungudi', 'kandanchavadi', 'thoraipakkam'] },
      { name: 'Thoraipakkam', pincode: '600097', aliases: ['thoraipakam', 'okkium thoraipakkam', 'karapakkam'] },
      { name: 'Navalur', pincode: '600130', aliases: ['navallur', 'egattur', 'thalambur'] },
      { name: 'Siruseri', pincode: '603103', aliases: ['sipcot siruseri', 'padur', 'kazhipattur'] },
      { name: 'Kelambakkam', pincode: '603103', aliases: ['kelambakam', 'pudupakkam', 'vengambakkam'] },
      { name: 'Gowrivakkam', pincode: '600073', aliases: ['gowrivakam', 'sembakkam', 'camp road'] },
      { name: 'Sembakkam', pincode: '600073', aliases: ['sembakam', 'kamarajapuram'] }
    ]
  },
  {
    id: 'GST & Airport',
    label: 'GST & Airport',
    subtitle: 'Tambaram, Chromepet, Pallavaram, Airport, Guduvanchery',
    areas: [
      { name: 'Tambaram', pincode: '600045', aliases: ['tambaram west', 'tambaram east', 'selaiyur', 'irumbuliyur'] },
      { name: 'Selaiyur', pincode: '600073', aliases: ['selaiyur', 'east tambaram', 'aiyappa nagar'] },
      { name: 'Chromepet', pincode: '600044', aliases: ['chrompet', 'chitlapakkam', 'hastinapuram', 'radha nagar'] },
      { name: 'Pallavaram', pincode: '600043', aliases: ['palavaram', 'old pallavaram', 'zamin pallavaram', 'pammal'] },
      { name: 'Chennai Airport (MAA)', pincode: '600027', aliases: ['meenambakkam', 'airport', 'tirusulam', 'cargo'] },
      { name: 'Pammal', pincode: '600075', aliases: ['pamal', 'nagalkeni', 'shankar nagar'] },
      { name: 'Anakaputhur', pincode: '600070', aliases: ['anakaputhur', 'pozichalur', 'polichalur'] },
      { name: 'Perungalathur', pincode: '600063', aliases: ['new perungalathur', 'old perungalathur', 'peerkankaranai'] },
      { name: 'Vandalur', pincode: '600048', aliases: ['vandaloor', 'mannivakkam', 'otteri'] },
      { name: 'Urapakkam', pincode: '603210', aliases: ['urappakkam', 'oorapakkam', 'kilambakkam'] },
      { name: 'Guduvanchery', pincode: '603202', aliases: ['guduvancheri', 'nandivaram', 'potheri', 'kattankulathur'] },
      { name: 'Maraimalai Nagar', pincode: '603209', aliases: ['mm nagar', 'maraimalainagar', 'ford'] },
      { name: 'Singaperumal Koil', pincode: '603204', aliases: ['sp koil', 'singaperumalkoil', 'mahindra city'] }
    ]
  },
  {
    id: 'Central Chennai',
    label: 'Central Chennai',
    subtitle: 'Guindy, T. Nagar, Vadapalani, Mylapore, Egmore, Nungambakkam',
    areas: [
      { name: 'Guindy', pincode: '600032', aliases: ['guindi', 'ekattuthangal', 'ekkattuthangal', 'alandur'] },
      { name: 'Alandur', pincode: '600016', aliases: ['st thomas mount', 'parangi malai'] },
      { name: 'T. Nagar', pincode: '600017', aliases: ['tnagar', 'thyagaraya nagar', 'pondhbazaar', 'west mambalam'] },
      { name: 'West Mambalam', pincode: '600033', aliases: ['mambalam', 'ashok pillar'] },
      { name: 'Ashok Nagar', pincode: '600083', aliases: ['ashoknagar', 'pudur'] },
      { name: 'K.K. Nagar', pincode: '600078', aliases: ['kk nagar', 'kknagar', 'mgr nagar'] },
      { name: 'Vadapalani', pincode: '600026', aliases: ['vadapazhani', 'saligramam'] },
      { name: 'Kodambakkam', pincode: '600024', aliases: ['kodambakam', 'power house', 'trustpuram'] },
      { name: 'Saidapet', pincode: '600015', aliases: ['saidapettai', 'little mount', 'kotturpuram'] },
      { name: 'Mylapore', pincode: '600004', aliases: ['mailapur', 'mandaveli', 'santhome', 'luz'] },
      { name: 'Alwarpet', pincode: '600018', aliases: ['teynampet', 'abiramapuram', 'ra puram'] },
      { name: 'Nungambakkam', pincode: '600034', aliases: ['nungambakam', 'chetpet', 'chintadripet'] },
      { name: 'Egmore', pincode: '600008', aliases: ['ezhumbur', 'vepery', 'central station', 'park town'] },
      { name: 'Kilpauk', pincode: '600010', aliases: ['kellys', 'purasawalkam', 'purasaiwalkam', 'aminjikarai'] },
      { name: 'Royapettah', pincode: '600014', aliases: ['triplicane', 'ice house', 'marina'] }
    ]
  },
  {
    id: 'West Chennai',
    label: 'West Chennai',
    subtitle: 'Anna Nagar, Porur, Koyambedu, Mogappair, Poonamallee',
    areas: [
      { name: 'Anna Nagar', pincode: '600040', aliases: ['annanagar', 'anna nagar east', 'anna nagar west', 'shenoy nagar', 'thirumangalam'] },
      { name: 'Koyambedu', pincode: '600107', aliases: ['cmbt', 'arumbakkam', 'nerkundram'] },
      { name: 'Porur', pincode: '600116', aliases: ['poroor', 'mugalivakkam', 'manapakkam', 'gerugambakkam'] },
      { name: 'Manapakkam', pincode: '600125', aliases: ['dlf porur', 'nandambakkam', 'ramapuram'] },
      { name: 'Ramapuram', pincode: '600089', aliases: ['valasaravakkam', 'virugambakkam', 'nesapakkam'] },
      { name: 'Valasaravakkam', pincode: '600087', aliases: ['valasaravakam', 'alwartirunagar'] },
      { name: 'Mogappair', pincode: '600037', aliases: ['mogapair', 'mugappair', 'nolambur', 'collector nagar'] },
      { name: 'Maduravoyal', pincode: '600095', aliases: ['madhuravoyal', 'vanagaram', 'adayalampattu'] },
      { name: 'Iyyappanthangal', pincode: '600056', aliases: ['ayyappanthangal', 'kattupakkam', 'karambakkam'] },
      { name: 'Poonamallee', pincode: '600056', aliases: ['poonamalee', 'poovirundhavalli', 'nazarathpet', 'chembarambakkam'] },
      { name: 'Kundrathur', pincode: '600069', aliases: ['kundrathoor', 'kovur', 'mangadu'] },
      { name: 'Mangadu', pincode: '600122', aliases: ['mangadoo', 'paraniputhur', 'pattur'] }
    ]
  },
  {
    id: 'North Chennai',
    label: 'North Chennai',
    subtitle: 'Ambattur, Avadi, Perambur, Kolathur, Red Hills, Madhavaram',
    areas: [
      { name: 'Ambattur', pincode: '600053', aliases: ['ambatur', 'ambattur ot', 'korattur', 'padi', 'ayapakkam'] },
      { name: 'Avadi', pincode: '600054', aliases: ['aavadi', 'thirumullaivoyal', 'pattabiram', 'nemilichery'] },
      { name: 'Kolathur', pincode: '600099', aliases: ['retteri', 'villivakkam', 'korattur'] },
      { name: 'Perambur', pincode: '600011', aliases: ['vyasarpadi', 'sembium', 'moolakadai', 'kodungaiyur'] },
      { name: 'Madhavaram', pincode: '600060', aliases: ['madavaram', 'manali', 'mathur', 'puzhal'] },
      { name: 'Red Hills', pincode: '600052', aliases: ['redhills', 'padiyanallur', 'sholavaram', 'karanodai'] },
      { name: 'Villivakkam', pincode: '600049', aliases: ['icf', 'ayanavaram', 'padi'] },
      { name: 'Tondiarpet', pincode: '600081', aliases: ['washermanpet', 'royapuram', 'mint', 'kasimedu', 'tiruvottiyur', 'ennore'] }
    ]
  },
  {
    id: 'ECR & Coast',
    label: 'ECR & Coast',
    subtitle: 'Adyar, Thiruvanmiyur, Neelankarai, Injambakkam, Kovalam',
    areas: [
      { name: 'Adyar', pincode: '600020', aliases: ['adayar', 'besant nagar', 'indira nagar', 'kasturba nagar'] },
      { name: 'Thiruvanmiyur', pincode: '600041', aliases: ['tiruvanmiyur', 'tidle park', 'kottivakkam', 'palavakkam'] },
      { name: 'Neelankarai', pincode: '600115', aliases: ['vettuvankeni', 'injambakkam', 'panaiyur'] },
      { name: 'Akkarai', pincode: '600119', aliases: ['uthandi', 'kanathur', 'muttukadu'] },
      { name: 'Kovalam', pincode: '603112', aliases: ['covelong', 'nemmeli', 'mahabalipuram', 'mamallapuram'] }
    ]
  },
  {
    id: 'Outer Suburbs',
    label: 'Suburbs & Outstation',
    subtitle: 'Chengalpattu, Kanchipuram, Sriperumbudur, Oragadam, Tiruvallur',
    areas: [
      { name: 'Chengalpattu', pincode: '603001', aliases: ['chengalpet', 'paranur', 'melmaruvathur', 'maduranthakam'] },
      { name: 'Kanchipuram', pincode: '631501', aliases: ['kancheepuram', 'kanchi', 'walajabad', 'sunguvarchatram'] },
      { name: 'Sriperumbudur', pincode: '602105', aliases: ['sriperumpudur', 'irungattukottai', 'pennalur'] },
      { name: 'Oragadam', pincode: '602105', aliases: ['padappai', 'mannivakkam', 'walajabad road'] },
      { name: 'Tiruvallur', pincode: '602001', aliases: ['thiruvallur', 'kakkalur', 'veppampattu', 'sevvapet', 'tiruttani', 'arakkonam'] },
      { name: 'Thiruporur', pincode: '603110', aliases: ['tiruporur', 'kalavakkam', 'manamai'] },
      { name: 'Gummidipoondi', pincode: '601201', aliases: ['ponneri', 'minjur', 'kavarapettai'] }
    ]
  }
];

export const ALL_CHENNAI_LOCALITIES = CHENNAI_ZONES.flatMap(zone =>
  zone.areas.map(area => ({
    name: area.name,
    pincode: area.pincode,
    zoneId: zone.id,
    zoneLabel: zone.label,
    aliases: area.aliases || [],
    displayLabel: `${area.name} (${zone.id})`
  }))
);

/**
 * Formats any raw Indian vehicle registration number into clean "TN 14 AK 2026" format.
 */
export function formatIndianPlateNumber(raw = '') {
  const cleaned = String(raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!cleaned) return '';

  // Match pattern: 2 letters (State) + 1-2 digits (RTO) + 1-3 letters (Series) + 1-4 digits (Number)
  const match = cleaned.match(/^([A-Z]{2})(\d{1,2})([A-Z]{1,3})(\d{1,4})$/);
  if (match) {
    const [, state, rto, series, num] = match;
    return `${state} ${rto.padStart(2, '0')} ${series} ${num}`;
  }

  // Partial typing progressive formatting
  const partial1 = cleaned.match(/^([A-Z]{2})(\d{1,2})([A-Z]{1,3})$/);
  if (partial1) {
    return `${partial1[1]} ${partial1[2]} ${partial1[3]}`;
  }
  const partial2 = cleaned.match(/^([A-Z]{2})(\d{1,2})$/);
  if (partial2) {
    return `${partial2[1]} ${partial2[2]}`;
  }

  return cleaned.slice(0, 13);
}

/**
 * Validates whether a plate string looks like a valid Indian registration number.
 */
export function isValidIndianPlateNumber(plate = '') {
  const cleaned = String(plate || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  return /^[A-Z]{2}\d{1,2}[A-Z]{0,3}\d{3,4}$/.test(cleaned);
}

/**
 * Resolves any typed query, pincode, or alias to a canonical Chennai locality & zone.
 */
export function matchChennaiLocality(query = '', preferredZoneId = '') {
  const q = String(query || '').trim().toLowerCase();
  if (!q) {
    if (preferredZoneId) {
      return ALL_CHENNAI_LOCALITIES.filter(loc => loc.zoneId === preferredZoneId);
    }
    return ALL_CHENNAI_LOCALITIES;
  }

  const scored = [];
  for (const loc of ALL_CHENNAI_LOCALITIES) {
    const nameLow = loc.name.toLowerCase();
    let score = 0;

    if (nameLow === q || loc.pincode === q) {
      score = 100;
    } else if (nameLow.startsWith(q)) {
      score = 85;
    } else if (loc.aliases.some(a => a.toLowerCase() === q)) {
      score = 90;
    } else if (loc.aliases.some(a => a.toLowerCase().startsWith(q))) {
      score = 75;
    } else if (nameLow.includes(q) || loc.pincode.includes(q)) {
      score = 60;
    } else if (loc.aliases.some(a => a.toLowerCase().includes(q))) {
      score = 50;
    } else if (loc.zoneId.toLowerCase().includes(q)) {
      score = 30;
    }

    if (score > 0) {
      if (preferredZoneId && loc.zoneId === preferredZoneId) {
        score += 10;
      }
      scored.push({ loc, score });
    }
  }

  scored.sort((a, b) => b.score - a.score || a.loc.name.localeCompare(b.loc.name));
  return scored.map(s => s.loc);
}

/**
 * Infers which Chennai Zone a pickup address belongs to for smart dispatch matching.
 */
export function inferZoneFromAddress(address = '') {
  const lower = String(address || '').toLowerCase();
  if (!lower) return '';
  for (const loc of ALL_CHENNAI_LOCALITIES) {
    if (lower.includes(loc.name.toLowerCase()) || lower.includes(loc.pincode)) {
      return loc.zoneId;
    }
    if (loc.aliases.some(alias => alias.length > 3 && lower.includes(alias.toLowerCase()))) {
      return loc.zoneId;
    }
  }
  return '';
}

/**
 * Maps any vehicle string from a website booking to our canonical Vehicle Category ID.
 */
export function normalizeVehicleCategory(vehicleStr = '') {
  const v = String(vehicleStr || '').toLowerCase();
  if (v.includes('tempo') || v.includes('urbania') || v.includes('12') || v.includes('14') || v.includes('17') || v.includes('20') || v.includes('26') || v.includes('coach') || v.includes('bus')) {
    return 'Tempo Traveller';
  }
  if (v.includes('innova') || v.includes('crysta') || v.includes('hycross') || v.includes('fortuner') || v.includes('prime')) {
    return 'Innova Crysta';
  }
  if (v.includes('ertiga') || v.includes('xl6') || v.includes('carens') || v.includes('marazzo') || v.includes('tavera') || v.includes('xylo') || v.includes('6-seater') || v.includes('7-seater') || v.includes('suv') || v.includes('muv')) {
    return 'SUV / Ertiga';
  }
  if (v.includes('acting') || v.includes('chauffeur')) {
    return 'Acting Driver';
  }
  return 'Sedan';
}

