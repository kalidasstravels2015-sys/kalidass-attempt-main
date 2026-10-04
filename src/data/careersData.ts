export interface JobPosition {
  id: string;
  title: string;
  category: 'driver' | 'fleet' | 'operations' | 'business';
  categoryLabel: string;
  department: string;
  employmentType: 'Full-Time' | 'Part-Time' | 'Rotational Shift' | 'Flexible Duty';
  location: string;
  salaryRange: string;
  bataOrPerks: string;
  experienceRequired: string;
  requiresResume: boolean;
  featuredBadge?: string;
  shortDescription: string;
  vehicleTypes?: string[];
  licenseTypes?: string[];
  responsibilities: string[];
  requirements: string[];
  perks: string[];
}

export interface Benefit {
  icon: string;
  title: string;
  description: string;
}

export interface FAQItem {
  question: string;
  answer: string;
  forDrivers?: boolean;
}

export const JOB_CATEGORIES = [
  { id: 'all', label: 'All Openings', count: 10 },
  { id: 'driver', label: 'Chauffeurs & Drivers', count: 4 },
  { id: 'fleet', label: 'Fleet & Garage', count: 1 },
  { id: 'operations', label: 'Dispatch & Support', count: 2 },
  { id: 'business', label: 'Tours, Sales & Accounts', count: 3 },
] as const;

export const JOB_POSITIONS: JobPosition[] = [
  // CATEGORY: DRIVERS & CHAUFFEURS
  {
    id: 'outstation-chauffeur',
    title: 'Outstation & Temple Tour Chauffeur',
    category: 'driver',
    categoryLabel: 'Chauffeur Crew',
    department: 'Outstation & Tourism Fleet',
    employmentType: 'Full-Time',
    location: 'Chennai (Outstation across TN, AP, Karnataka, Kerala)',
    salaryRange: '₹25,000 – ₹38,000 / month',
    bataOrPerks: 'Daily Bata ₹400–₹500 + Highway Incentives + Night Stay Allowance',
    experienceRequired: '4+ Years Highway Driving Experience',
    requiresResume: true,
    featuredBadge: 'Most Popular',
    shortDescription:
      'Chauffeur family outstation tours, temple circuits (Tirupati, Kumbakonam, Rameshwaram), and corporate trips in clean AC Sedans & Innova Crystas.',
    vehicleTypes: ['Swift Dzire', 'Toyota Etios', 'Maruti Ertiga', 'Toyota Innova Crysta'],
    licenseTypes: ['LMV Commercial Badge', 'Transport Endorsement'],
    responsibilities: [
      'Safely navigate South Indian highways with families, elders, and pilgrims.',
      'Conduct daily pre-trip vehicle checks (tyres, engine coolant, clean cabin, AC).',
      'Maintain courteous passenger service and disciplined highway speeds (80-90 km/h).',
    ],
    requirements: [
      'Valid Indian Driving License with Commercial / Transport Badge (Yellow board).',
      'Minimum 4 years highway driving experience across South India.',
      'Police Verification Certificate (PVC) or readiness to obtain one.',
    ],
    perks: [
      'Daily trip bata settled immediately upon trip completion.',
      'Monthly base earnings credited reliably on the 1st of every month.',
      'Company-serviced showroom-condition vehicles.',
    ],
  },
  {
    id: 'airport-taxi-chauffeur',
    title: 'Chennai Airport (MAA) 24/7 Transfer Chauffeur',
    category: 'driver',
    categoryLabel: 'Chauffeur Crew',
    department: 'Airport Mobility Desk',
    employmentType: 'Rotational Shift',
    location: 'Chennai Airport (MAA) / Medavakkam Hub',
    salaryRange: '₹22,000 – ₹32,000 / month',
    bataOrPerks: 'Per-Trip Payout + Airport Waiting Allowance + Night Shift Bonus',
    experienceRequired: '3+ Years City & Airport Driving',
    requiresResume: true,
    featuredBadge: 'Immediate Joining',
    shortDescription:
      'Provide on-time doorstep airport pickups and terminal transfers for domestic and international travelers at Chennai Airport.',
    vehicleTypes: ['Swift Dzire', 'Toyota Etios', 'Toyota Innova Crysta'],
    licenseTypes: ['LMV Commercial Badge'],
    responsibilities: [
      'Perform scheduled pickups and Airport Terminal 1, 2 & 4 transfers.',
      'Assist travelers with luggage handling and terminal navigation.',
      'Coordinate with central dispatch desk during flight delays.',
    ],
    requirements: [
      'Valid LMV Commercial License with clean accident-free history.',
      'Minimum 3 years driving in Chennai city and airport corridors.',
      'Punctual and ready for rotating day/night shifts.',
    ],
    perks: [
      'Dedicated airport stand parking and steady booking dispatch.',
      'Night shift food allowances and weekly incentive payouts.',
    ],
  },
  {
    id: 'acting-call-driver',
    title: 'Executive Acting Driver / Private Car Chauffeur',
    category: 'driver',
    categoryLabel: 'Chauffeur Crew',
    department: 'Personal Chauffeur Services',
    employmentType: 'Flexible Duty',
    location: 'Chennai (OMR, ECR, Anna Nagar, T. Nagar, Medavakkam, Guindy)',
    salaryRange: '₹900 – ₹1,600 / day (₹24,000 – ₹36,000 / month)',
    bataOrPerks: 'Daily Duty Rate + Overtime Hourly Pay + Night Duty Bata',
    experienceRequired: '5+ Years Driving Automatic & Manual Cars',
    requiresResume: true,
    featuredBadge: 'High Daily Earning',
    shortDescription:
      'Chauffeur car owners in their own personal luxury sedans, automatic SUVs, and electric vehicles across Chennai city and highways.',
    vehicleTypes: ['Customer Luxury Cars', 'BMW / Mercedes / Audi', 'Toyota Fortuner', 'Innova Hycross', 'EVs'],
    licenseTypes: ['LMV (Non-Transport or Transport)'],
    responsibilities: [
      'Safely chauffeur car owners in their personal manual, automatic, and hybrid vehicles.',
      'Navigate city traffic, corporate complexes, and valet parking smoothly.',
      'Maintain strict passenger privacy, punctuality, and professional attire.',
    ],
    requirements: [
      'Valid LMV Driving License with at least 5 years continuous driving record.',
      'Hands-on expertise with automatic transmissions, luxury brands, and EV regen braking.',
      'Valid Police Verification Certificate (PVC).',
    ],
    perks: [
      'Immediate cash or UPI settlement post-duty with 0% advance required.',
      'Flexible duty shifts: 4-hour city, 8-hour day, or outstation drops.',
    ],
  },
  {
    id: 'heavy-passenger-chauffeur',
    title: 'Heavy Passenger Vehicle (HPV) Chauffeur — Tempo Traveller & Mini Bus',
    category: 'driver',
    categoryLabel: 'Group Mobility',
    department: 'Group & Corporate Tours',
    employmentType: 'Full-Time',
    location: 'Chennai & South India',
    salaryRange: '₹28,000 – ₹42,000 / month',
    bataOrPerks: 'Tour Daily Bata + Long Distance Allowance + Ghat Road Incentives',
    experienceRequired: '5+ Years Heavy Passenger Vehicle Experience',
    requiresResume: true,
    featuredBadge: 'Experienced Chauffeur',
    shortDescription:
      'Pilot 12, 14, 17-seater Force Tempo Travellers, Force Urbania, and 21-seater minibuses for group tours, weddings, and hill yatras.',
    vehicleTypes: ['Force Tempo Traveller 12/14/17s', 'Force Urbania', '21-Seater Mini Bus'],
    licenseTypes: ['HPV / Commercial Transport Badge'],
    responsibilities: [
      'Pilot 12 to 26 passenger vehicles across South Indian highways and Ghat roads.',
      'Perform mandatory air-brake checks, tyre checks, and passenger luggage supervision.',
      'Coordinate with group tour coordinators and wedding parties.',
    ],
    requirements: [
      'Valid Heavy Passenger Vehicle (HPV) License with Transport Badge.',
      'Minimum 5 years driving commercial tempo travellers or passenger buses.',
      'Demonstrated experience handling hill station Ghat roads (Ooty, Kodai, Yercaud).',
    ],
    perks: [
      'Highest daily tour allowances and trip completion bonuses.',
      'Company covered highway food and lodging allowance.',
    ],
  },

  // CATEGORY: FLEET CARE & GARAGE
  {
    id: 'fleet-maintenance-supervisor',
    title: 'Fleet Operations & Maintenance Supervisor',
    category: 'fleet',
    categoryLabel: 'Fleet Operations',
    department: 'Fleet Engineering & Maintenance',
    employmentType: 'Full-Time',
    location: 'Medavakkam Garage Hub, Chennai',
    salaryRange: '₹24,000 – ₹35,000 / month',
    bataOrPerks: 'Annual Performance Bonus + Mobile Allowance + Fuel Allowance',
    experienceRequired: '3+ Years Commercial Fleet / Garage Management',
    requiresResume: true,
    shortDescription:
      'Oversee vehicle health, scheduled servicing, FC renewals, GPS tracking, and breakdown emergency response for our 50+ taxi fleet.',
    responsibilities: [
      'Supervise periodic maintenance (oil, brakes, tyres, AC) at authorized centers.',
      'Track RTO vehicle fitness certificates (FC), speed governors, and road permits.',
      'Coordinate rapid breakdown recovery and replacement vehicle dispatch.',
    ],
    requirements: [
      'Diploma/ITI in Automobile Engineering or 3+ years managing commercial taxi fleets.',
      'Practical mechanical knowledge of Dzire, Innova Crysta, and Tempo Traveller.',
      'Valid LMV driving license.',
    ],
    perks: [
      'Stable day shift role with paid annual leaves and festive bonuses.',
      'Company phone and local travel reimbursements.',
    ],
  },

  // CATEGORY: CUSTOMER SUPPORT & DISPATCH
  {
    id: 'dispatch-trip-coordinator',
    title: '24/7 Operations & Dispatch Coordinator',
    category: 'operations',
    categoryLabel: 'Operations Desk',
    department: 'Central Operations Control Hub',
    employmentType: 'Rotational Shift',
    location: 'Medavakkam Office, Chennai',
    salaryRange: '₹20,000 – ₹30,000 / month',
    bataOrPerks: 'Night Shift Allowance + Performance Incentives',
    experienceRequired: '1–3 Years Dispatch / Travel Coordination Experience',
    requiresResume: true,
    shortDescription:
      'Real-time trip dispatch, flight arrival tracking, driver allocation, and ensuring zero-delay pick-ups for corporate and family clients.',
    responsibilities: [
      'Assign verified drivers and cabs to incoming web, phone, and WhatsApp bookings.',
      'Monitor live flight tracker dashboards for arrivals at MAA Airport.',
      'Coordinate driver pickups 30 minutes before schedule with customer updates.',
    ],
    requirements: [
      'Sound geographical knowledge of Chennai roads, IT corridors (OMR/GST), and highways.',
      'Proficiency in Google Maps, WhatsApp Business, and basic computer entry.',
      'Calm, solution-oriented communication during peak travel rush hours.',
    ],
    perks: [
      'Modern air-conditioned office environment in Medavakkam.',
      'Night shift food allowances and overtime pay.',
    ],
  },
  {
    id: 'customer-booking-executive',
    title: 'Customer Booking & Helpdesk Executive',
    category: 'operations',
    categoryLabel: 'Customer Relations',
    department: 'Reservation & Helpdesk',
    employmentType: 'Full-Time',
    location: 'Medavakkam Office, Chennai',
    salaryRange: '₹22,000 – ₹32,000 / month',
    bataOrPerks: 'Booking Conversion Incentives + Festive Bonuses',
    experienceRequired: '1–3 Years Tele-Sales / Customer Support Experience',
    requiresResume: true,
    shortDescription:
      'Handle inbound traveler phone calls, calculate transparent package quotes using our fare estimator, and confirm bookings.',
    responsibilities: [
      'Answer customer calls and WhatsApp inquiries with polite, clear guidance.',
      'Provide transparent tariff estimates for local, outstation, and temple trips.',
      'Generate booking vouchers and coordinate confirmation details.',
    ],
    requirements: [
      'Fluent spoken Tamil and English (conversational Telugu or Hindi is a bonus).',
      'Pleasant telephonic etiquette and active listening skills.',
      'Basic proficiency with MS Excel and fast typing.',
    ],
    perks: [
      'Attractive monthly conversion bonuses on confirmed bookings.',
      'Clear career progression into Tour Operations Management.',
    ],
  },

  // CATEGORY: TOURS, SALES & ACCOUNTS
  {
    id: 'tour-itinerary-planner',
    title: 'South India Tour Itinerary Planner & Travel Consultant',
    category: 'business',
    categoryLabel: 'Tours & Leisure',
    department: 'Tourism & Custom Yatras',
    employmentType: 'Full-Time',
    location: 'Chennai Office / Hybrid',
    salaryRange: '₹25,000 – ₹40,000 / month',
    bataOrPerks: 'Package Booking Commission + Annual Tour Incentives',
    experienceRequired: '2+ Years South India Tour Planning',
    requiresResume: true,
    shortDescription:
      'Design tailored South India road trip packages, temple darshan itineraries (Tirupati, Navagraha), and hill station getaways.',
    responsibilities: [
      'Create custom travel itineraries with driving durations, tolls, and darshan timings.',
      'Coordinate with partner homestays, verified hotels, and local temple guides.',
      'Prepare quotation proposals for NRI families, wedding parties, and group yatras.',
    ],
    requirements: [
      'Proven experience designing South India tour packages (TN, Kerala, Karnataka, AP).',
      'Deep knowledge of temple darshan pooja timings and road connectivity.',
      'Strong communication skills in English and Tamil.',
    ],
    perks: [
      'High commission on high-value family and group tour packages.',
      'Familiarization travel trips to new tourist destinations.',
    ],
  },
  {
    id: 'corporate-mobility-sales',
    title: 'Corporate Mobility & B2B Sales Executive',
    category: 'business',
    categoryLabel: 'Corporate Sales',
    department: 'B2B Enterprise Mobility',
    employmentType: 'Full-Time',
    location: 'Chennai (OMR, Guindy, Siruseri, Ambattur coverage)',
    salaryRange: '₹28,000 – ₹45,000 / month',
    bataOrPerks: 'Monthly Sales Commission + Travel & Fuel Reimbursement',
    experienceRequired: '2+ Years B2B Corporate Mobility / Fleet Sales',
    requiresResume: true,
    shortDescription:
      'Acquire IT corporate client contracts, employee transport services (ETS), executive monthly car rentals, and event partnerships.',
    responsibilities: [
      'Connect with corporate admin, HR, and facility managers across Chennai tech parks.',
      'Pitch executive car rental contracts, monthly cab billing, and GST invoices.',
      'Prepare service level agreements (SLAs) and customized tariff proposals.',
    ],
    requirements: [
      'Minimum 2 years B2B sales experience in travel, transport, or fleet services.',
      'Strong negotiation, presentation, and relationship-building skills.',
      'Vehicle for local corporate meetings across Chennai.',
    ],
    perks: [
      'Uncapped commission structure on monthly corporate billing revenue.',
      'Direct pathway to Head of B2B Mobility.',
    ],
  },
  {
    id: 'accounts-billing-executive',
    title: 'Billing, Accounts & Driver Settlement Executive',
    category: 'business',
    categoryLabel: 'Finance & Accounts',
    department: 'Finance & Administration',
    employmentType: 'Full-Time',
    location: 'Medavakkam Office, Chennai',
    salaryRange: '₹22,000 – ₹32,000 / month',
    bataOrPerks: 'Provident Fund (PF) + Annual Bonus + Timely Pay Cycle',
    experienceRequired: '2+ Years Tally / Accounting Experience',
    requiresResume: true,
    shortDescription:
      'Manage daily driver trip settlements, fuel auditing, GST corporate tax invoices, bank reconciliations, and vendor payments.',
    responsibilities: [
      'Reconcile daily driver trip collections and process fast-track bata settlements.',
      'Audit diesel bills, FASTag deductions, and vehicle maintenance expense logs.',
      'Prepare and dispatch GST-compliant invoices to corporate clients.',
    ],
    requirements: [
      'B.Com or M.Com degree with 2+ years practical accounting experience.',
      'High proficiency in Tally, Microsoft Excel, and Google Sheets.',
      'Understanding of GST rates for passenger transport services.',
    ],
    perks: [
      'Strictly on-time salary credit on the 1st of every month.',
      'PF, gratuity eligibility, and yearly performance incentives.',
    ],
  },
];

// Cut-and-dried company facts (Replacing the 6 AI welfare cards)
export const COMPANY_HIGHLIGHTS: Benefit[] = [
  {
    icon: 'payments',
    title: 'Prompt Bata & Salary Settlements',
    description:
      'Outstation trip batas settled immediately post-trip. Monthly salaries credited reliably on the 1st of every month without deduction surprises.',
  },
  {
    icon: 'directions_car',
    title: 'Dealer-Serviced 50+ Vehicle Fleet',
    description:
      'Drive clean, 100% showroom-serviced AC Sedans, Innova Crystas, and Tempo Travellers. Zero dealing with worn-out vehicles or breakdown stress.',
  },
  {
    icon: 'storefront',
    title: 'Central Medavakkam Operations Hub',
    description:
      '24/7 central dispatch, dedicated vehicle maintenance bay, and driver support operations located conveniently at Medavakkam, Chennai.',
  },
];

// Export alias for backward compatibility
export const DRIVER_WELFARE_BENEFITS = COMPANY_HIGHLIGHTS;

export const CAREER_FAQS: FAQItem[] = [
  {
    question: 'How do I apply for a driver, chauffeur, or staff position?',
    answer:
      'All candidates must submit their resume or bio-data. Fill out the simple 1-minute form on this page with your contact details and attach your CV / bio-data (PDF, Word, or photo of your bio-data). You can also send your resume directly to our HR team on WhatsApp at +91 89395 39211.',
    forDrivers: true,
  },
  {
    question: 'Do drivers need to own their own car to work with Kalidass Travels?',
    answer:
      'No. Kalidass Travels provides our own company-maintained commercial fleet (Swift Dzire, Toyota Etios, Ertiga, Innova Crysta, and Tempo Travellers). For Executive Acting Drivers, you will chauffeur customer-owned personal vehicles.',
    forDrivers: true,
  },
  {
    question: 'How and when are driver trip batas and salaries paid?',
    answer:
      'For outstation duties, driver batas are disbursed daily or immediately post-trip. Monthly base salaries, overtime, and mileage incentives are credited strictly on the 1st of every month via direct bank transfer or UPI.',
    forDrivers: true,
  },
  {
    question: 'Can I visit the Medavakkam office directly for a walk-in interview?',
    answer:
      'No direct walk-in interviews are conducted. All candidates must apply online through this portal or via WhatsApp (+91 89395 39211). Our HR team reviews all applications and contacts shortlisted candidates for a scheduled in-person interview and vehicle trial.',
    forDrivers: true,
  },
];
