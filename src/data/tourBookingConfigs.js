// Master Tour Booking Configurations for Kalidass Travels Tour Engines
// Strictly adheres to Motor Vehicles Rules, Consumer Protection Act, and .agents/rules/booking-engine-specifications.md

export const TOUR_CONFIGS = {
  'tirupati-package': {
    slug: 'tirupati-package',
    serviceTitle: 'Chennai to Tirupati Cab & Balaji Darshan Taxi Package',
    engineTitle: 'Book Chennai to Tirupati',
    subtitle: 'Dedicated Cab Service Only • We do not provide Darshan tickets',
    destination: {
      name: 'Tirupati Balaji & Tirumala Hills',
      roundTripKm: 320,
      editable: false
    },
    minRealisticHours: 12,
    recommendedHours: 15,
    advisoryText: 'Chennai ⇄ Tirupati is ~320 km round trip (approx. 8–9 hrs highway & ghat road driving + temple darshan). Recommended same-day return window is 14–16 hours (minimum 12 hours required).',
    inclusions: {
      standard: 'Covers FASTag Tolls + AP Permit + Hill Climb + Driver Bata + Parking',
      multiDay: 'Covers Cab, Hill Climb & Driver Bata • Tolls & AP Permit Extra'
    },
    itemizedInclusions: [
      { label: 'Tirumala Ghat Road Ascent & Hill Climb:', value: '₹0', multiDayValue: '₹0' },
      { label: 'NH FASTag Tolls & AP State Border Permit:', value: '₹0', multiDayValue: 'Extra' },
      { label: 'Tirupati & TTD Hilltop Parking:', value: '₹0', multiDayValue: 'Extra' }
    ],
    eventPrefix: 'tirupati_engine',
    vehicles: [
      {
        id: 'dzire',
        name: 'Swift Dzire / Toyota Etios',
        shortName: 'AC Sedan',
        capacity: 4,
        luggage: '2 Bags',
        tag: 'Best Value',
        rates: { 1: 6000, 2: 9500, 3: 13200 },
        vehicleHire: { 1: 5000, 2: 7700, 3: 10400 },
        driverBata: { 1: 1000, 2: 1800, 3: 2800 },
        extraHourRate: 200
      },
      {
        id: 'ertiga',
        name: 'Maruti Ertiga / XL6',
        shortName: 'Comfort SUV',
        capacity: 6,
        luggage: '3 Bags',
        tag: 'Family Favorite',
        rates: { 1: 7500, 2: 11500, 3: 15800 },
        vehicleHire: { 1: 6300, 2: 9300, 3: 12500 },
        driverBata: { 1: 1200, 2: 2200, 3: 3300 },
        extraHourRate: 250
      },
      {
        id: 'innova',
        name: 'Toyota Innova',
        shortName: 'Spacious MUV',
        capacity: 7,
        luggage: '4 Bags',
        tag: 'Elders Choice',
        rates: { 1: 8500, 2: 12500, 3: 17500 },
        vehicleHire: { 1: 7100, 2: 10100, 3: 13900 },
        driverBata: { 1: 1400, 2: 2400, 3: 3600 },
        extraHourRate: 250
      },
      {
        id: 'crysta',
        name: 'Toyota Innova Crysta',
        shortName: 'Luxury MUV',
        capacity: 7,
        luggage: '4 Bags',
        tag: 'VIP Luxury',
        rates: { 1: 10000, 2: 16000, 3: 22500 },
        vehicleHire: { 1: 8400, 2: 13000, 3: 18000 },
        driverBata: { 1: 1600, 2: 3000, 3: 4500 },
        extraHourRate: 350
      },
      {
        id: 'tempo12',
        name: '12-Seater Tempo Traveller',
        shortName: 'Mini Coach',
        capacity: 12,
        luggage: '8 Bags',
        tag: 'Group Darshan',
        rates: { 1: 12500, 2: 19500, 3: 27000 },
        vehicleHire: { 1: 10500, 2: 15700, 3: 21500 },
        driverBata: { 1: 2000, 2: 3800, 3: 5500 },
        extraHourRate: 400
      },
      {
        id: 'tempo17',
        name: '17-Seater Tempo Traveller',
        shortName: 'Large Coach',
        capacity: 17,
        luggage: '12 Bags',
        tag: 'Large Group',
        rates: { 1: 16500, 2: 24500, 3: 33500 },
        vehicleHire: { 1: 14000, 2: 20000, 3: 27000 },
        driverBata: { 1: 2500, 2: 4500, 3: 6500 },
        extraHourRate: 500
      }
    ]
  },

  'chidambaram-temple-trip': {
    slug: 'chidambaram-temple-trip',
    serviceTitle: 'Chennai to Chidambaram Natarajar Temple & Pichavaram Tour',
    engineTitle: 'Book Chennai to Chidambaram',
    subtitle: 'Round trip private AC cab package • Fixed tariff with ₹500 advance to confirm booking',
    destination: {
      name: 'Chidambaram & Pichavaram',
      roundTripKm: 450,
      editable: false
    },
    minRealisticHours: 14,
    recommendedHours: 16,
    advisoryText: 'Chennai to Chidambaram round trip covers ~450 km (~8-9 hrs driving + temple darshan & Pichavaram). Minimum realistic round trip duration is 14 hours. Please verify return schedule if planning same-day return.',
    inclusions: {
      standard: 'Covers ECR & NH 32 Tolls + Pichavaram Stop + Driver Bata',
      multiDay: 'Covers Cab, Pichavaram Stop & Driver Halting Bata • Tolls Extra'
    },
    itemizedInclusions: [
      { label: 'ECR & NH 32 Highway Tolls:', value: '₹0', multiDayValue: 'Extra' },
      { label: 'Pichavaram Mangrove Boating Coordination:', value: '₹0', multiDayValue: '₹0' }
    ],
    eventPrefix: 'chidambaram_engine',
    vehicles: [
      {
        id: 'dzire',
        name: 'Swift Dzire / Toyota Etios',
        shortName: 'AC Sedan',
        capacity: 4,
        luggage: '2 Bags',
        tag: 'Best Value',
        rates: { 1: 7400, 2: 9800, 3: 12200 },
        vehicleHire: { 1: 6200, 2: 8200, 3: 10200 },
        driverBata: { 1: 1200, 2: 1600, 3: 2000 },
        extraHourRate: 150
      },
      {
        id: 'ertiga',
        name: 'Maruti Ertiga / XL6',
        shortName: 'Comfort SUV',
        capacity: 6,
        luggage: '3 Bags',
        tag: 'Family Favorite',
        rates: { 1: 9200, 2: 12000, 3: 14800 },
        vehicleHire: { 1: 7800, 2: 10200, 3: 12600 },
        driverBata: { 1: 1400, 2: 1800, 3: 2200 },
        extraHourRate: 200
      },
      {
        id: 'innova',
        name: 'Toyota Innova',
        shortName: 'Spacious MUV',
        capacity: 7,
        luggage: '4 Bags',
        tag: 'Elders Choice',
        rates: { 1: 11000, 2: 14500, 3: 18000 },
        vehicleHire: { 1: 9400, 2: 12500, 3: 15600 },
        driverBata: { 1: 1600, 2: 2000, 3: 2400 },
        extraHourRate: 200
      },
      {
        id: 'crysta',
        name: 'Toyota Innova Crysta',
        shortName: 'Luxury MUV',
        capacity: 7,
        luggage: '4 Bags',
        tag: 'VIP Luxury',
        rates: { 1: 13000, 2: 17500, 3: 22000 },
        vehicleHire: { 1: 11200, 2: 15200, 3: 19200 },
        driverBata: { 1: 1800, 2: 2300, 3: 2800 },
        extraHourRate: 250
      },
      {
        id: 'tempo12',
        name: '12-Seater Tempo Traveller',
        shortName: 'Mini Coach',
        capacity: 12,
        luggage: '8 Bags',
        tag: 'Group Darshan',
        rates: { 1: 15800, 2: 21500, 3: 27200 },
        vehicleHire: { 1: 13600, 2: 18500, 3: 23400 },
        driverBata: { 1: 2200, 2: 3000, 3: 3800 },
        extraHourRate: 350
      }
    ]
  },

  'thiruvannamalai-girivalam-trip': {
    slug: 'thiruvannamalai-girivalam-trip',
    serviceTitle: 'Chennai to Thiruvannamalai Girivalam & Arunachaleswarar Tour',
    engineTitle: 'Book Chennai to Thiruvannamalai',
    subtitle: 'Round trip private AC cab package • Fixed tariff with ₹500 advance to confirm booking',
    destination: {
      name: 'Arunachaleswarar & Girivalam',
      roundTripKm: 390,
      editable: false
    },
    minRealisticHours: 14,
    recommendedHours: 16,
    advisoryText: 'Chennai to Thiruvannamalai round trip covers ~390 km (~7-8 hrs driving + temple darshan & 14 km Girivalam). Recommended round trip window is 14–16 hours.',
    inclusions: {
      standard: 'Covers GST & NH Tolls + 14 km Girivalam Standby + Driver Bata',
      multiDay: 'Covers Cab & 14 km Girivalam Standby + Halting Bata • Tolls Extra'
    },
    itemizedInclusions: [
      { label: 'NH 48 / NH 77 Highway Tolls:', value: '₹0', multiDayValue: 'Extra' },
      { label: '14 km Girivalam Outer Ring Standby:', value: '₹0', multiDayValue: '₹0' }
    ],
    eventPrefix: 'thiruvannamalai_engine',
    vehicles: [
      {
        id: 'dzire',
        name: 'Swift Dzire / Toyota Etios',
        shortName: 'AC Sedan',
        capacity: 4,
        luggage: '2 Bags',
        tag: 'Best Value',
        rates: { 1: 6500, 2: 8900, 3: 11500 },
        vehicleHire: { 1: 5400, 2: 7400, 3: 9600 },
        driverBata: { 1: 1100, 2: 1500, 3: 1900 },
        extraHourRate: 150
      },
      {
        id: 'ertiga',
        name: 'Maruti Ertiga / XL6',
        shortName: 'Comfort SUV',
        capacity: 6,
        luggage: '3 Bags',
        tag: 'Family Favorite',
        rates: { 1: 7900, 2: 10900, 3: 13900 },
        vehicleHire: { 1: 6600, 2: 9200, 3: 11800 },
        driverBata: { 1: 1300, 2: 1700, 3: 2100 },
        extraHourRate: 200
      },
      {
        id: 'innova',
        name: 'Toyota Innova',
        shortName: 'Spacious MUV',
        capacity: 7,
        luggage: '4 Bags',
        tag: 'Elders Choice',
        rates: { 1: 9300, 2: 12900, 3: 16500 },
        vehicleHire: { 1: 7800, 2: 10900, 3: 14100 },
        driverBata: { 1: 1500, 2: 2000, 3: 2400 },
        extraHourRate: 200
      },
      {
        id: 'crysta',
        name: 'Toyota Innova Crysta',
        shortName: 'Luxury MUV',
        capacity: 7,
        luggage: '4 Bags',
        tag: 'VIP Luxury',
        rates: { 1: 11100, 2: 15500, 3: 19900 },
        vehicleHire: { 1: 9400, 2: 13300, 3: 17200 },
        driverBata: { 1: 1700, 2: 2200, 3: 2700 },
        extraHourRate: 250
      },
      {
        id: 'tempo12',
        name: '12-Seater Tempo Traveller',
        shortName: 'Mini Coach',
        capacity: 12,
        luggage: '8 Bags',
        tag: 'Group Darshan',
        rates: { 1: 13500, 2: 18900, 3: 24300 },
        vehicleHire: { 1: 11500, 2: 16100, 3: 20700 },
        driverBata: { 1: 2000, 2: 2800, 3: 3600 },
        extraHourRate: 350
      }
    ]
  },

  'kanchipuram-temple-trip': {
    slug: 'kanchipuram-temple-trip',
    serviceTitle: 'Chennai to Kanchipuram Temple & Silk Weavers Day Trip',
    engineTitle: 'Book Chennai to Kanchipuram',
    subtitle: 'Round trip private AC cab package • Fixed tariff with ₹500 advance to confirm booking',
    destination: {
      name: 'Kanchipuram & Silk Weavers',
      roundTripKm: 150,
      editable: false
    },
    minRealisticHours: 8,
    recommendedHours: 10,
    advisoryText: 'Chennai to Kanchipuram round trip covers ~150 km (~3 hrs driving + Kamakshi Amman, Ekambareswarar, Varadharaja Perumal & Silk saree weaver visits). Recommended window is 8–10 hours.',
    inclusions: {
      standard: 'Covers NH 48 Tolls + Weaver Waiting + Driver Bata',
      multiDay: 'Covers Cab, Weaver Waiting & Halting Bata • Tolls Extra'
    },
    itemizedInclusions: [
      { label: 'NH 48 Sriperumbudur Highway Tolls:', value: '₹0', multiDayValue: 'Extra' },
      { label: 'Temple Parking & Weaver Co-op Standby:', value: '₹0', multiDayValue: '₹0' }
    ],
    eventPrefix: 'kanchipuram_engine',
    vehicles: [
      {
        id: 'dzire',
        name: 'Swift Dzire / Toyota Etios',
        shortName: 'AC Sedan',
        capacity: 4,
        luggage: '2 Bags',
        tag: 'Best Value',
        rates: { 1: 3500, 2: 5200, 3: 7000 },
        vehicleHire: { 1: 2800, 2: 4200, 3: 5700 },
        driverBata: { 1: 700, 2: 1000, 3: 1300 },
        extraHourRate: 150
      },
      {
        id: 'ertiga',
        name: 'Maruti Ertiga / XL6',
        shortName: 'Comfort SUV',
        capacity: 6,
        luggage: '3 Bags',
        tag: 'Family Favorite',
        rates: { 1: 4500, 2: 6600, 3: 8800 },
        vehicleHire: { 1: 3700, 2: 5400, 3: 7300 },
        driverBata: { 1: 800, 2: 1200, 3: 1500 },
        extraHourRate: 200
      },
      {
        id: 'innova',
        name: 'Toyota Innova',
        shortName: 'Spacious MUV',
        capacity: 7,
        luggage: '4 Bags',
        tag: 'Elders Choice',
        rates: { 1: 5500, 2: 8000, 3: 10600 },
        vehicleHire: { 1: 4600, 2: 6700, 3: 9000 },
        driverBata: { 1: 900, 2: 1300, 3: 1600 },
        extraHourRate: 200
      },
      {
        id: 'crysta',
        name: 'Toyota Innova Crysta',
        shortName: 'Luxury MUV',
        capacity: 7,
        luggage: '4 Bags',
        tag: 'VIP Luxury',
        rates: { 1: 6800, 2: 9800, 3: 12900 },
        vehicleHire: { 1: 5700, 2: 8300, 3: 11000 },
        driverBata: { 1: 1100, 2: 1500, 3: 1900 },
        extraHourRate: 250
      },
      {
        id: 'tempo12',
        name: '12-Seater Tempo Traveller',
        shortName: 'Mini Coach',
        capacity: 12,
        luggage: '8 Bags',
        tag: 'Group Darshan',
        rates: { 1: 8500, 2: 12200, 3: 16000 },
        vehicleHire: { 1: 7100, 2: 10300, 3: 13600 },
        driverBata: { 1: 1400, 2: 1900, 3: 2400 },
        extraHourRate: 300
      }
    ]
  },

  'navagraha-tour': {
    slug: 'navagraha-tour',
    serviceTitle: 'Chennai to Kumbakonam 9 Navagraha Temples Pilgrimage Tour',
    engineTitle: 'Book Kumbakonam Navagraha Tour',
    subtitle: 'Round trip private AC cab package • Fixed tariff with ₹500 advance to confirm booking',
    destination: {
      name: '9 Navagraha Temples Circuit',
      roundTripKm: 680,
      editable: false,
      isCircuit: true
    },
    minRealisticHours: 36,
    recommendedHours: 48,
    advisoryText: 'Chennai to Kumbakonam Navagraha circuit covers ~680–750 km visiting all 9 planetary temples without backtracking. Minimum 2 Days (36 hrs) is mandatory to complete all shrines peacefully.',
    inclusions: {
      standard: 'Covers 9 Temples Circuit & Fuel • Highway Tolls & Driver Bata at Actuals',
      multiDay: 'Covers Cab & 9 Temples Circuit • Highway Tolls & Driver Bata at Actuals'
    },
    itemizedInclusions: [
      { label: 'All 9 Planetary Temples Sequential Route:', value: '₹0', multiDayValue: '₹0' },
      { label: 'NH 32 / NH 36 Highway FASTag Tolls:', value: 'Extra', multiDayValue: 'Extra' },
      { label: 'Chauffeur Outstation Duty & Halting Bata:', value: 'Extra', multiDayValue: 'Extra' }
    ],
    eventPrefix: 'navagraha_engine',
    vehicles: [
      {
        id: 'dzire',
        name: 'Swift Dzire / Toyota Etios',
        shortName: 'AC Sedan',
        capacity: 4,
        luggage: '2 Bags',
        tag: 'Best Value',
        rates: { 1: 12000, 2: 12000, 3: 16500 },
        vehicleHire: { 1: 10000, 2: 10000, 3: 13800 },
        driverBata: { 1: 2000, 2: 2000, 3: 2700 },
        extraHourRate: 200
      },
      {
        id: 'ertiga',
        name: 'Maruti Ertiga / XL6',
        shortName: 'Comfort SUV',
        capacity: 6,
        luggage: '3 Bags',
        tag: 'Family Favorite',
        rates: { 1: 14800, 2: 14800, 3: 19800 },
        vehicleHire: { 1: 12400, 2: 12400, 3: 16600 },
        driverBata: { 1: 2400, 2: 2400, 3: 3200 },
        extraHourRate: 250
      },
      {
        id: 'innova',
        name: 'Toyota Innova',
        shortName: 'Spacious MUV',
        capacity: 7,
        luggage: '4 Bags',
        tag: 'Elders Choice',
        rates: { 1: 16500, 2: 16500, 3: 22500 },
        vehicleHire: { 1: 13900, 2: 13900, 3: 19000 },
        driverBata: { 1: 2600, 2: 2600, 3: 3500 },
        extraHourRate: 250
      },
      {
        id: 'crysta',
        name: 'Toyota Innova Crysta',
        shortName: 'Luxury MUV',
        capacity: 7,
        luggage: '4 Bags',
        tag: 'VIP Luxury',
        rates: { 1: 19800, 2: 19800, 3: 26500 },
        vehicleHire: { 1: 16800, 2: 16800, 3: 22600 },
        driverBata: { 1: 3000, 2: 3000, 3: 3900 },
        extraHourRate: 350
      },
      {
        id: 'tempo12',
        name: '12-Seater Tempo Traveller',
        shortName: 'Mini Coach',
        capacity: 12,
        luggage: '8 Bags',
        tag: 'Group Darshan',
        rates: { 1: 24500, 2: 24500, 3: 33000 },
        vehicleHire: { 1: 20900, 2: 20900, 3: 28200 },
        driverBata: { 1: 3600, 2: 3600, 3: 4800 },
        extraHourRate: 400
      }
    ]
  },

  'rameswaram-2-days': {
    slug: 'rameswaram-2-days',
    serviceTitle: 'Chennai to Rameswaram & Dhanushkodi 2-Day Yatra Package',
    engineTitle: 'Book Chennai to Rameswaram',
    subtitle: 'Round trip private AC cab package • Fixed tariff with ₹500 advance to confirm booking',
    destination: {
      name: 'Ramanathaswamy & Dhanushkodi',
      roundTripKm: 1150,
      editable: false,
      isCircuit: true
    },
    minRealisticHours: 48,
    recommendedHours: 72,
    advisoryText: 'Chennai to Rameswaram round trip is ~1,150–1,200 km (~10 hrs driving each way + 22 theertham holy baths, Pamban bridge & Dhanushkodi). Minimum 2 Days (48 hrs) is strictly required.',
    inclusions: {
      standard: 'Covers 1,200 km Run & Fuel • NH Tolls & Driver Bata Extra',
      multiDay: 'Covers Cab & 1,200 km Run • NH Tolls & Driver Bata Extra'
    },
    itemizedInclusions: [
      { label: 'Dhanushkodi / Arichal Munai Waiting:', value: '₹0', multiDayValue: '₹0' },
      { label: 'NH 45 / NH 87 Highway FASTag Tolls:', value: 'Extra', multiDayValue: 'Extra' },
      { label: 'Chauffeur Outstation Duty & Halting Bata:', value: 'Extra', multiDayValue: 'Extra' }
    ],
    eventPrefix: 'rameswaram_engine',
    vehicles: [
      {
        id: 'dzire',
        name: 'Swift Dzire / Toyota Etios',
        shortName: 'AC Sedan',
        capacity: 4,
        luggage: '2 Bags',
        tag: 'Best Value',
        rates: { 1: 18500, 2: 18500, 3: 24500 },
        vehicleHire: { 1: 15700, 2: 15700, 3: 20900 },
        driverBata: { 1: 2800, 2: 2800, 3: 3600 },
        extraHourRate: 200
      },
      {
        id: 'ertiga',
        name: 'Maruti Ertiga / XL6',
        shortName: 'Comfort SUV',
        capacity: 6,
        luggage: '3 Bags',
        tag: 'Family Favorite',
        rates: { 1: 22500, 2: 22500, 3: 29500 },
        vehicleHire: { 1: 19100, 2: 19100, 3: 25100 },
        driverBata: { 1: 3400, 2: 3400, 3: 4400 },
        extraHourRate: 250
      },
      {
        id: 'innova',
        name: 'Toyota Innova',
        shortName: 'Spacious MUV',
        capacity: 7,
        luggage: '4 Bags',
        tag: 'Elders Choice',
        rates: { 1: 25000, 2: 25000, 3: 33000 },
        vehicleHire: { 1: 21200, 2: 21200, 3: 28100 },
        driverBata: { 1: 3800, 2: 3800, 3: 4900 },
        extraHourRate: 250
      },
      {
        id: 'crysta',
        name: 'Toyota Innova Crysta',
        shortName: 'Luxury MUV',
        capacity: 7,
        luggage: '4 Bags',
        tag: 'VIP Luxury',
        rates: { 1: 30000, 2: 30000, 3: 39500 },
        vehicleHire: { 1: 25600, 2: 25600, 3: 33800 },
        driverBata: { 1: 4400, 2: 4400, 3: 5700 },
        extraHourRate: 350
      },
      {
        id: 'tempo12',
        name: '12-Seater Tempo Traveller',
        shortName: 'Mini Coach',
        capacity: 12,
        luggage: '8 Bags',
        tag: 'Group Darshan',
        rates: { 1: 35000, 2: 35000, 3: 46000 },
        vehicleHire: { 1: 29800, 2: 29800, 3: 39300 },
        driverBata: { 1: 5200, 2: 5200, 3: 6700 },
        extraHourRate: 400
      }
    ]
  },

  'sabarimala-trip': {
    slug: 'sabarimala-trip',
    serviceTitle: 'Chennai to Sabarimala Pilgrimage Cab Package',
    engineTitle: 'Book Chennai to Sabarimala',
    subtitle: 'Round trip private AC cab package • Fixed tariff with ₹500 advance to confirm booking',
    destination: {
      name: 'Nilakkal & Pamba Base Camp',
      roundTripKm: 1350,
      editable: false,
      isCircuit: true
    },
    minRealisticHours: 48,
    recommendedHours: 72,
    advisoryText: 'Chennai to Sabarimala (Pamba / Nilakkal) round trip is ~1,350 km through Western Ghats routes. Minimum 3 Days (48–72 hrs) is required for safe driving and darshan.',
    inclusions: {
      standard: 'Covers 1,350 km Run & Fuel • Kerala Interstate Permit, Tolls & Bata Extra',
      multiDay: 'Covers Cab & 1,350 km Run • Kerala Permit, Tolls & Bata Extra'
    },
    itemizedInclusions: [
      { label: 'Kerala Motor Vehicles Interstate Permit:', value: '₹800', multiDayValue: '₹800' },
      { label: 'NH Tolls & Pamba Hill Ghat Standby:', value: 'Extra', multiDayValue: 'Extra' },
      { label: 'Chauffeur Outstation Duty & Halting Bata:', value: 'Extra', multiDayValue: 'Extra' }
    ],
    eventPrefix: 'sabarimala_engine',
    vehicles: [
      {
        id: 'dzire',
        name: 'Swift Dzire / Toyota Etios',
        shortName: 'AC Sedan',
        capacity: 4,
        luggage: '2 Bags',
        tag: 'Best Value',
        rates: { 1: 22500, 2: 22500, 3: 22500 },
        vehicleHire: { 1: 19000, 2: 19000, 3: 19000 },
        driverBata: { 1: 3500, 2: 3500, 3: 3500 },
        extraHourRate: 200
      },
      {
        id: 'ertiga',
        name: 'Maruti Ertiga / XL6',
        shortName: 'Comfort SUV',
        capacity: 6,
        luggage: '3 Bags',
        tag: 'Family Favorite',
        rates: { 1: 26500, 2: 26500, 3: 26500 },
        vehicleHire: { 1: 22500, 2: 22500, 3: 22500 },
        driverBata: { 1: 4000, 2: 4000, 3: 4000 },
        extraHourRate: 250
      },
      {
        id: 'innova',
        name: 'Toyota Innova',
        shortName: 'Spacious MUV',
        capacity: 7,
        luggage: '4 Bags',
        tag: 'Elders Choice',
        rates: { 1: 29500, 2: 29500, 3: 29500 },
        vehicleHire: { 1: 25000, 2: 25000, 3: 25000 },
        driverBata: { 1: 4500, 2: 4500, 3: 4500 },
        extraHourRate: 250
      },
      {
        id: 'crysta',
        name: 'Toyota Innova Crysta',
        shortName: 'Luxury MUV',
        capacity: 7,
        luggage: '4 Bags',
        tag: 'VIP Luxury',
        rates: { 1: 34500, 2: 34500, 3: 34500 },
        vehicleHire: { 1: 29500, 2: 29500, 3: 29500 },
        driverBata: { 1: 5000, 2: 5000, 3: 5000 },
        extraHourRate: 350
      },
      {
        id: 'tempo12',
        name: '12-Seater Tempo Traveller',
        shortName: 'Mini Coach',
        capacity: 12,
        luggage: '8 Bags',
        tag: 'Group Darshan',
        rates: { 1: 42000, 2: 42000, 3: 42000 },
        vehicleHire: { 1: 36000, 2: 36000, 3: 36000 },
        driverBata: { 1: 6000, 2: 6000, 3: 6000 },
        extraHourRate: 400
      }
    ]
  },

  'vellore-golden-temple': {
    slug: 'vellore-golden-temple',
    serviceTitle: 'Chennai to Vellore Sripuram Golden Temple Cab Package',
    engineTitle: 'Book Chennai to Vellore',
    subtitle: 'Round trip private AC cab package • Fixed tariff with ₹500 advance to confirm booking',
    destination: {
      name: 'Sripuram Golden Temple & Fort',
      roundTripKm: 280,
      editable: false
    },
    minRealisticHours: 10,
    recommendedHours: 12,
    advisoryText: 'Chennai to Vellore round trip covers ~280 km (~5 hrs driving + Sripuram Golden Temple spiritual darshan & Vellore Fort visit). Recommended window is 10–12 hours.',
    inclusions: {
      standard: 'Covers NH 48 Tolls + Golden Temple Waiting + Driver Bata',
      multiDay: 'Covers Cab, Golden Temple Waiting & Halting Bata • Tolls Extra'
    },
    itemizedInclusions: [
      { label: 'NH 48 Sriperumbudur & Walajah Tolls:', value: '₹0', multiDayValue: 'Extra' },
      { label: 'Golden Temple & Jalakandeswarar Waiting:', value: '₹0', multiDayValue: '₹0' }
    ],
    eventPrefix: 'vellore_engine',
    vehicles: [
      {
        id: 'dzire',
        name: 'Swift Dzire / Toyota Etios',
        shortName: 'AC Sedan',
        capacity: 4,
        luggage: '2 Bags',
        tag: 'Best Value',
        rates: { 1: 4800, 2: 7000, 3: 9400 },
        vehicleHire: { 1: 3900, 2: 5700, 3: 7700 },
        driverBata: { 1: 900, 2: 1300, 3: 1700 },
        extraHourRate: 150
      },
      {
        id: 'ertiga',
        name: 'Maruti Ertiga / XL6',
        shortName: 'Comfort SUV',
        capacity: 6,
        luggage: '3 Bags',
        tag: 'Family Favorite',
        rates: { 1: 6200, 2: 8900, 3: 11800 },
        vehicleHire: { 1: 5100, 2: 7400, 3: 9900 },
        driverBata: { 1: 1100, 2: 1500, 3: 1900 },
        extraHourRate: 200
      },
      {
        id: 'innova',
        name: 'Toyota Innova',
        shortName: 'Spacious MUV',
        capacity: 7,
        luggage: '4 Bags',
        tag: 'Elders Choice',
        rates: { 1: 7400, 2: 10600, 3: 14000 },
        vehicleHire: { 1: 6100, 2: 8800, 3: 11800 },
        driverBata: { 1: 1300, 2: 1800, 3: 2200 },
        extraHourRate: 200
      },
      {
        id: 'crysta',
        name: 'Toyota Innova Crysta',
        shortName: 'Luxury MUV',
        capacity: 7,
        luggage: '4 Bags',
        tag: 'VIP Luxury',
        rates: { 1: 9200, 2: 13000, 3: 17000 },
        vehicleHire: { 1: 7700, 2: 11000, 3: 14500 },
        driverBata: { 1: 1500, 2: 2000, 3: 2500 },
        extraHourRate: 250
      },
      {
        id: 'tempo12',
        name: '12-Seater Tempo Traveller',
        shortName: 'Mini Coach',
        capacity: 12,
        luggage: '8 Bags',
        tag: 'Group Darshan',
        rates: { 1: 11500, 2: 16200, 3: 21200 },
        vehicleHire: { 1: 9700, 2: 13700, 3: 18100 },
        driverBata: { 1: 1800, 2: 2500, 3: 3100 },
        extraHourRate: 300
      }
    ]
  },

  'pondicherry-one-day-trip': {
    slug: 'pondicherry-one-day-trip',
    serviceTitle: 'Chennai to Pondicherry Taxi & Sightseeing Tour',
    engineTitle: 'Book Chennai to Pondicherry',
    subtitle: 'ECR Scenic Highway • Auroville • French White Town • ₹500 Advance to Confirm',
    destination: {
      name: 'Pondicherry & French Town',
      roundTripKm: 310,
      editable: true,
      defaultDrop: 'French White Town / Promenade Beach, Pondicherry',
      dropPlaceholder: 'e.g. French White Town, Auroville, or Hotel'
    },
    minRealisticHours: 11,
    recommendedHours: 13,
    advisoryText: 'Chennai to Pondicherry round trip covers ~310 km via East Coast Road (~6-7 hrs driving + beach, Auroville & French Quarter exploration). Recommended window is 12–14 hours.',
    inclusions: {
      standard: 'Covers ECR Tolls + Beach Promenade + Driver Bata',
      multiDay: 'Covers Cab, Beach Promenade & Halting Bata • Tolls Extra'
    },
    itemizedInclusions: [
      { label: 'East Coast Road (ECR) Highway Tolls:', value: '₹0', multiDayValue: 'Extra' },
      { label: 'Auroville & French Quarter Standby:', value: '₹0', multiDayValue: '₹0' }
    ],
    eventPrefix: 'pondy_engine',
    vehicles: [
      {
        id: 'dzire',
        name: 'Swift Dzire / Toyota Etios',
        shortName: 'AC Sedan',
        capacity: 4,
        luggage: '2 Bags',
        tag: 'Best Value',
        rates: { 1: 4500, 2: 6800, 3: 9200 },
        vehicleHire: { 1: 3700, 2: 5600, 3: 7600 },
        driverBata: { 1: 800, 2: 1200, 3: 1600 },
        extraHourRate: 150
      },
      {
        id: 'ertiga',
        name: 'Maruti Ertiga / XL6',
        shortName: 'Comfort SUV',
        capacity: 6,
        luggage: '3 Bags',
        tag: 'Family Favorite',
        rates: { 1: 5800, 2: 8500, 3: 11200 },
        vehicleHire: { 1: 4800, 2: 7100, 3: 9400 },
        driverBata: { 1: 1000, 2: 1400, 3: 1800 },
        extraHourRate: 200
      },
      {
        id: 'innova',
        name: 'Toyota Innova',
        shortName: 'Spacious MUV',
        capacity: 7,
        luggage: '4 Bags',
        tag: 'Elders Choice',
        rates: { 1: 7000, 2: 10200, 3: 13500 },
        vehicleHire: { 1: 5800, 2: 8500, 3: 11400 },
        driverBata: { 1: 1200, 2: 1700, 3: 2100 },
        extraHourRate: 200
      },
      {
        id: 'crysta',
        name: 'Toyota Innova Crysta',
        shortName: 'Luxury MUV',
        capacity: 7,
        luggage: '4 Bags',
        tag: 'VIP Luxury',
        rates: { 1: 8800, 2: 12500, 3: 16500 },
        vehicleHire: { 1: 7400, 2: 10600, 3: 14200 },
        driverBata: { 1: 1400, 2: 1900, 3: 2300 },
        extraHourRate: 250
      },
      {
        id: 'tempo12',
        name: '12-Seater Tempo Traveller',
        shortName: 'Mini Coach',
        capacity: 12,
        luggage: '8 Bags',
        tag: 'Group Darshan',
        rates: { 1: 11000, 2: 15500, 3: 20500 },
        vehicleHire: { 1: 9300, 2: 13200, 3: 17600 },
        driverBata: { 1: 1700, 2: 2300, 3: 2900 },
        extraHourRate: 300
      }
    ]
  }
};
