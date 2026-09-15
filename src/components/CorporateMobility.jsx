import React, { useState } from 'react';
import WhatsAppButton from './react/WhatsAppButton.jsx';
import { 
  Building2, 
  Users, 
  Briefcase, 
  ShieldCheck, 
  Phone, 
  MessageCircle, 
  CheckCircle2, 
  HelpCircle, 
  ChevronRight, 
  ChevronDown,
  ArrowRight,
  Plane,
  CalendarCheck,
  Crown,
  FileText,
  Clock,
  Car
} from 'lucide-react';

export default function CorporateMobility() {
  const [activePlan, setActivePlan] = useState('all');
  const [openFaq, setOpenFaq] = useState(null);

  const corporateTariff = [
    {
      id: 'ets-trip',
      type: 'ets',
      name: 'Employee Shift Pickup & Drop (Per Route)',
      duration: 'Per Shift Route Trip',
      rate: '₹350 – ₹550',
      extraRate: 'Route & headcount based',
      highlight: 'Rostered pickup/drop, GPS tracking, women safety protocols',
      slug: 'employee-pickup-drop',
      badge: '24/7 IT/BPO Shift Mobility',
      whatsapp: 'https://wa.me/919092303060?text=Hi%20Kalidass%20Travels,%20I%20need%20a%20quote%20for%20Corporate%20Employee%20Transportation.'
    },
    {
      id: 'retainer-sedan',
      type: 'retainer',
      name: 'Executive Sedan Monthly Retainer (Dzire / Etios)',
      duration: '26 Days / 10 Hours Daily',
      rate: '₹42,000 / mo',
      extraRate: 'OT: ₹120/hr • Fuel actuals',
      highlight: 'Dedicated uniformed chauffeur, replacement within 60 mins',
      slug: 'monthly-car-with-driver-corporate',
      badge: 'Managerial Travel',
      whatsapp: 'https://wa.me/919092303060?text=Hi%20Kalidass%20Travels,%20I%20want%20to%20enquire%20about%20Executive%20Sedan%20Monthly%20Retainer.'
    },
    {
      id: 'retainer-suv',
      type: 'retainer',
      name: 'Mid SUV Monthly Retainer (Maruti Ertiga / XL6)',
      duration: '26 Days / 10 Hours Daily',
      rate: '₹52,000 / mo',
      extraRate: 'OT: ₹140/hr • Fuel actuals',
      highlight: '6-seater spacious vehicle for project teams & client visits',
      slug: 'monthly-car-with-driver-corporate',
      badge: 'Team Mobility',
      whatsapp: 'https://wa.me/919092303060?text=Hi%20Kalidass%20Travels,%20I%20want%20to%20enquire%20about%20Ertiga%20SUV%20Monthly%20Retainer.'
    },
    {
      id: 'retainer-crysta',
      type: 'retainer',
      name: 'Toyota Innova Crysta Monthly Retainer',
      duration: '26 Days / 10 Hours Daily',
      rate: '₹65,000 / mo',
      extraRate: 'OT: ₹175/hr • Fuel actuals',
      highlight: 'Premium VIP chauffeur, leather captain seats for leadership/expats',
      slug: 'monthly-car-with-driver-corporate',
      badge: 'CXO & Director Mobility',
      whatsapp: 'https://wa.me/919092303060?text=Hi%20Kalidass%20Travels,%20I%20want%20to%20enquire%20about%20Innova%20Crysta%20Monthly%20Retainer.'
    },
    {
      id: 'airport-central',
      type: 'spot',
      name: 'Corporate Airport Transfer (Central / Guindy)',
      duration: 'One-Way Transfer',
      rate: '₹1,200 (Sedan)',
      extraRate: 'Innova: ₹1,800 • Crysta: ₹2,400',
      highlight: 'Flight delay tracking, placard meet-and-greet, zero surge',
      slug: 'corporate-airport-transfer',
      badge: 'Airport Protocol',
      whatsapp: 'https://wa.me/919092303060?text=Hi%20Kalidass%20Travels,%20I%20need%20a%20Corporate%20Airport%20Transfer.'
    },
    {
      id: 'airport-omr',
      type: 'spot',
      name: 'Corporate Airport Transfer (OMR / Siruseri / ECR)',
      duration: 'One-Way Transfer',
      rate: '₹1,500 (Sedan)',
      extraRate: 'Innova: ₹2,200 • Crysta: ₹2,800',
      highlight: 'Flight delay tracking, placard meet-and-greet, zero surge',
      slug: 'corporate-airport-transfer',
      badge: 'OMR Tech Corridor',
      whatsapp: 'https://wa.me/919092303060?text=Hi%20Kalidass%20Travels,%20I%20need%20a%20Corporate%20Airport%20Transfer%20to%20OMR.'
    },
    {
      id: 'business-spot',
      type: 'spot',
      name: 'Business Day Rental (8 Hrs / 80 Km)',
      duration: '8 Hours / 80 Km',
      rate: '₹2,500 (Sedan)',
      extraRate: 'Innova: ₹3,500 • Crysta: ₹4,500',
      highlight: 'Multi-meeting city mobility, client visits, GST invoice',
      slug: 'business-trip-car-rental',
      badge: 'Spot Day Rental',
      whatsapp: 'https://wa.me/919092303060?text=Hi%20Kalidass%20Travels,%20I%20need%20an%208-Hour%20Business%20Day%20Rental.'
    },
    {
      id: 'mice-events',
      type: 'spot',
      name: 'MICE & Corporate Event Fleet Management',
      duration: 'Custom Event Deployment',
      rate: 'Custom Quote',
      extraRate: 'Sedans, Innovas & Tempo Travellers',
      highlight: 'Trade expos at Chennai Trade Centre, AGMs, on-ground marshals',
      slug: 'driver-car-for-weddings',
      badge: 'Conferences & Offsites',
      whatsapp: 'https://wa.me/919092303060?text=Hi%20Kalidass%20Travels,%20I%20need%20Fleet%20Management%20for%20a%20Corporate%20Event.'
    }
  ];

  const filteredCorporate = activePlan === 'all'
    ? corporateTariff
    : corporateTariff.filter(item => item.type === activePlan);

  const corporateCards = [
    {
      title: 'Employee Transportation Services',
      badge: '24/7 Shift Mobility',
      slug: 'employee-pickup-drop',
      icon: Users,
      desc: 'Safe, punctual daily commute solutions for your workforce across OMR, Ambattur, Guindy, and Sriperumbudur. Features automated rostering and women safety protocols.',
      highlights: ['Female safety first-in/last-out algorithm', 'GPS tracking & SOS emergency button', 'Automated digital trip sheets']
    },
    {
      title: 'Monthly Car With Dedicated Driver',
      badge: 'Starts ₹42,000 / mo',
      slug: 'monthly-car-with-driver-corporate',
      icon: Crown,
      desc: 'Dedicated corporate vehicle with a uniformed executive chauffeur for CXOs, directors, and client meetings. Eliminates fleet ownership liabilities and driver payroll.',
      highlights: ['Guaranteed replacement within 60 mins', '100% GST tax deduction invoices', 'Uniformed, multi-lingual executive pilot']
    },
    {
      title: 'On-Demand Business Travel',
      badge: '8 Hrs / 80 Km Packages',
      slug: 'business-trip-car-rental',
      icon: Briefcase,
      desc: 'Spot rentals for client visits, factory audits, and intercity travel. Clean executive sedans and Innovas ready on short notice with bill-to-company facilities.',
      highlights: ['Flexible hourly & daily packages', 'Punctual doorstep & hotel reporting', 'Transparent per-km overtime billing']
    },
    {
      title: 'Corporate Airport VIP Protocol',
      badge: 'Flat Zone Rates',
      slug: 'corporate-airport-transfer',
      icon: Plane,
      desc: 'First impressions matter. Professional placard meet-and-greet at Chennai International Airport (MAA) with automated flight delay monitoring.',
      highlights: ['Complimentary flight delay buffer', 'Placard reception at arrival terminal', 'Bottled water & mobile chargers inside']
    }
  ];

  const faqs = [
    {
      q: 'How do you ensure female employee safety during night shifts?',
      a: 'We strictly follow industry-leading safety protocols: automated routing ensures female employees are never the first pickup or last drop in late-night shifts (8 PM to 6 AM). Security escort guards can be provided on request, and all cabs are GPS-monitored in real-time.'
    },
    {
      q: 'What happens if a dedicated monthly retainer driver falls sick?',
      a: 'We guarantee a replacement driver and vehicle SLA within 60 minutes anywhere in Chennai, ensuring zero disruption to executive schedules.'
    },
    {
      q: 'Do you provide GST-compliant invoices for corporate tax credits?',
      a: 'Yes. All B2B bookings come with itemized GST invoices mentioning your company GSTIN, allowing you to claim full input tax credit.'
    },
    {
      q: 'Can we set up a monthly credit / bill-to-company account?',
      a: 'Yes! We offer 15-day and 30-day corporate billing credit cycles for registered enterprises following standard vendor onboarding.'
    }
  ];

  return (
    <div className="font-sans text-m3-on-surface bg-m3-surface-container-low min-h-screen">
      
      {/* 1. HERO SECTION (Unified M3 Light Theme) */}
      <section className="bg-m3-surface pt-8 pb-10 md:pt-14 md:pb-14 border-b border-m3-outline-variant/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-m3-full bg-m3-surface-container border border-m3-outline-variant text-m3-on-surface text-xs font-semibold shadow-m3-1 mb-3.5 tracking-wide">
            <span className="w-2 h-2 rounded-full bg-m3-primary"></span>
            <span>Enterprise Mobility • 100% GST Compliant • 60-Min SLA</span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-m3-on-surface tracking-tight mb-3 leading-tight font-heading">
            The Complete <br className="hidden sm:inline" />
            <span className="text-m3-primary">Corporate Mobility Suite</span>
          </h1>
          
          <p className="text-xs sm:text-sm md:text-base text-m3-on-surface-variant mb-6 max-w-2xl mx-auto leading-relaxed font-normal font-sans">
            Strategic transportation partner for Chennai enterprises. From 24/7 routed employee shift commutes to monthly executive Innova Crysta retainers and MICE event fleets.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a 
              href="#corporate-matrix"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-m3-full bg-m3-primary hover:bg-m3-primary/90 text-m3-on-primary font-bold text-xs sm:text-sm shadow-m3-2 transition-all transform hover:-translate-y-0.5"
            >
              <span>Explore Corporate Plans</span>
              <ChevronDown className="w-4 h-4 text-white" />
            </a>
            <a 
              href="tel:+919092303060"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-m3-full bg-m3-surface hover:bg-m3-surface-container text-m3-on-surface border border-m3-outline-variant font-semibold text-xs sm:text-sm shadow-m3-1 transition-all"
            >
              <Phone className="w-4 h-4 text-m3-primary" />
              <span>B2B Desk: +91 90923 03060</span>
            </a>
          </div>

        </div>
      </section>

      {/* 2. ⚡ MASTER "ALL CORPORATE RATES AT A GLANCE" COMPARISON MATRIX */}
      <section id="corporate-matrix" className="py-8 md:py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-m3-surface rounded-m3-2xl shadow-m3-1 border border-m3-outline-variant overflow-hidden">
          
          <div className="p-5 md:p-6 bg-m3-surface-container text-m3-on-surface flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-m3-outline-variant/60">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-m3-full bg-m3-primary-container text-m3-on-primary-container text-xs font-bold uppercase tracking-wider mb-2 border border-m3-primary/20">
                <FileText className="w-3.5 h-3.5" /> Upfront B2B Pricing
              </div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight font-heading text-m3-on-surface">
                Enterprise Mobility &amp; <span className="text-m3-primary">Chauffeur Contracts</span>
              </h2>
              <p className="text-m3-on-surface-variant text-xs sm:text-sm md:text-base mt-1 font-sans leading-relaxed">
                Fixed monthly retainers and rostered employee commute solutions with zero surge billing.
              </p>
            </div>

            {/* Plan Filter Tabs (Segmented Buttons) */}
            <div className="flex flex-wrap gap-1.5 bg-m3-surface-container-high p-1.5 rounded-m3-full border border-m3-outline-variant/60 self-start md:self-auto">
              {[
                { id: 'all', label: 'All Services' },
                { id: 'retainer', label: 'Monthly Retainers' },
                { id: 'ets', label: 'Employee Shifts (ETS)' },
                { id: 'spot', label: 'Airport & Spot' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActivePlan(tab.id)}
                  className={`px-3.5 py-1.5 rounded-m3-full text-xs font-bold transition-all ${
                    activePlan === tab.id 
                      ? 'bg-m3-primary text-m3-on-primary shadow-m3-1 font-bold' 
                      : 'text-m3-on-surface-variant hover:text-m3-on-surface hover:bg-m3-surface/60'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Desktop Table (>= md screens) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm font-sans">
              <thead className="bg-m3-surface-container-low text-m3-on-surface-variant text-xs font-bold uppercase tracking-wider border-b border-m3-outline-variant/60">
                <tr>
                  <th className="px-5 py-4">Solution / Plan</th>
                  <th className="px-5 py-4">Operational Scope</th>
                  <th className="px-5 py-4">Rate Structure</th>
                  <th className="px-5 py-4 hidden md:table-cell">Key Business SLA</th>
                  <th className="px-5 py-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-m3-outline-variant/40">
                {filteredCorporate.map((row, idx) => (
                  <tr 
                    key={row.id} 
                    className={`hover:bg-m3-surface-container-low transition-colors ${idx % 2 === 0 ? 'bg-m3-surface' : 'bg-m3-surface-container-lowest/40'}`}
                  >
                    <td className="px-5 py-4">
                      <div className="font-bold text-m3-on-surface text-base">{row.name}</div>
                      <span className="inline-block mt-0.5 text-badge font-semibold text-m3-on-primary-container bg-m3-primary-container px-2.5 py-0.5 rounded-m3-full border border-m3-primary/20">
                        {row.badge}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-m3-on-surface font-medium">
                      {row.duration}
                      <div className="text-xs text-m3-on-surface-variant">{row.extraRate}</div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-lg font-black text-m3-primary font-heading">{row.rate}</span>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell text-m3-on-surface-variant text-xs leading-relaxed max-w-xs">
                      {row.highlight}
                    </td>
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <a
                        href={`/services/${row.slug}/`}
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-m3-surface-container hover:bg-m3-primary hover:text-white text-m3-on-surface rounded-m3-full text-xs font-bold border border-m3-outline-variant transition-all group"
                      >
                        <span>Details</span>
                        <ChevronRight className="w-3.5 h-3.5 text-m3-primary group-hover:text-white transform group-hover:translate-x-0.5 transition-transform" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Rate Cards (< md screens) */}
          <div className="block md:hidden divide-y divide-m3-outline-variant/40">
            {filteredCorporate.map((row) => (
              <div key={row.id} className="p-4 bg-m3-surface hover:bg-m3-surface-container-low transition-colors">
                <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-[160px]">
                    <div className="font-bold text-m3-on-surface text-sm">{row.name}</div>
                    <div className="text-badge text-m3-on-surface-variant font-medium mt-0.5">{row.duration}</div>
                  </div>
                  <span className="text-micro font-semibold text-m3-on-primary-container bg-m3-primary-container px-2 py-0.5 rounded-m3-full border border-m3-primary/20 self-start">
                    {row.badge}
                  </span>
                </div>

                <div className="bg-m3-surface-container-low p-3 rounded-m3-xl border border-m3-outline-variant/60 my-3">
                  <div className="text-badge text-m3-on-surface-variant font-medium">Contract Tariff</div>
                  <div className="text-base font-black text-m3-primary font-heading mt-0.5">{row.rate}</div>
                  {row.extraRate && (
                    <div className="text-badge text-m3-on-surface-variant mt-0.5">{row.extraRate}</div>
                  )}
                  <div className="text-xs text-m3-on-surface-variant mt-2 pt-2 border-t border-m3-outline-variant/60 leading-relaxed">
                    {row.highlight}
                  </div>
                </div>

                <div className="pt-1">
                  <a
                    href={`/services/${row.slug}/`}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-m3-surface-container hover:bg-m3-surface-container-high text-m3-on-surface border border-m3-outline-variant rounded-m3-full text-xs font-semibold transition-all"
                  >
                    <span>View Solution Details &amp; SLA</span>
                    <ChevronRight className="w-3.5 h-3.5 text-m3-primary" />
                  </a>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-m3-surface-container border-t border-m3-outline-variant/60 text-xs text-m3-on-surface-variant flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span>* Consolidated monthly GST tax invoices provided for full corporate tax deductibility.</span>
            <span className="text-m3-on-surface font-semibold">60-minute emergency driver replacement SLA</span>
          </div>

        </div>
      </section>

      {/* 3. THE 4 B2B SERVICE CARDS */}
      <section className="py-10 md:py-14 bg-m3-surface-container-low border-t border-m3-outline-variant/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-m3-full bg-m3-surface border border-m3-outline-variant text-m3-on-surface text-xs font-semibold shadow-m3-1 mb-3.5 tracking-wide">
              <span className="w-2 h-2 rounded-full bg-m3-primary"></span>
              <span>B2B Mobility Pillars</span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-m3-on-surface tracking-tight leading-tight mb-2.5 font-heading">
              Comprehensive Corporate <span className="text-m3-primary">Fleet Solutions</span>
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-m3-on-surface-variant max-w-2xl mx-auto leading-relaxed mb-6 font-normal font-sans">
              Click any solution below for customized SLA terms, pricing slabs, vehicle specifications, and dedicated account onboarding.
            </p>
          </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          {corporateCards.map((srv, i) => {
            const Icon = srv.icon;
            return (
              <a
                key={i}
                href={`/services/${srv.slug}/`}
                className="group bg-m3-surface rounded-m3-xl p-5 sm:p-6 shadow-m3-1 hover:shadow-m3-3 border border-m3-outline-variant hover:border-m3-primary/30 transition-all duration-300 flex flex-col justify-between transform hover:-translate-y-1 block no-underline"
              >
                <div>
                  <div className="flex justify-between items-start mb-3.5">
                    <div className="w-12 h-12 rounded-m3-lg bg-m3-surface-container text-m3-primary flex items-center justify-center transition-colors duration-300 shadow-m3-1">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="px-2.5 py-0.5 bg-m3-primary-container text-m3-on-primary-container border border-m3-primary/20 rounded-m3-full text-xs font-bold">
                      {srv.badge}
                    </span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-bold text-m3-on-surface group-hover:text-m3-primary transition-colors font-heading mb-1.5">
                    {srv.title}
                  </h3>

                  <p className="text-m3-on-surface-variant text-xs sm:text-sm leading-relaxed mb-4 font-normal">
                    {srv.desc}
                  </p>

                  <ul className="space-y-2 mb-4 text-xs text-m3-on-surface-variant">
                    {srv.highlights.map((hl, j) => (
                      <li key={j} className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-m3-secondary shrink-0" />
                        <span>{hl}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-3.5 border-t border-m3-outline-variant/60 flex items-center justify-between text-m3-on-surface font-bold text-xs sm:text-sm group-hover:text-m3-primary">
                  <span>Explore B2B Solution</span>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </a>
            );
          })}
          </div>
        </div>
      </section>

      {/* 4. THE 4 B2B COMMITMENTS (Clean M3 Light Surface) */}
      <section className="py-10 md:py-14 bg-m3-surface border-t border-m3-outline-variant/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-m3-full bg-m3-surface-container border border-m3-outline-variant text-m3-on-surface text-xs font-semibold shadow-m3-1 mb-3.5 tracking-wide">
              <span className="w-2 h-2 rounded-full bg-m3-secondary"></span>
              <span>Compliance &amp; SLAs</span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-m3-on-surface tracking-tight leading-tight mb-2.5 font-heading">
              Built for <span className="text-m3-primary">Enterprise Reliability</span>
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-m3-on-surface-variant max-w-2xl mx-auto leading-relaxed mb-6 font-normal font-sans">
              How Kalidass Travels protects your employees, leadership, and operational uptime.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            <div className="bg-m3-surface rounded-m3-xl p-4 sm:p-5 border border-m3-outline-variant shadow-m3-1 flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-m3-lg bg-m3-surface-container text-m3-primary flex items-center justify-center mb-3">
                  <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-m3-primary" />
                </div>
                <h3 className="text-xs sm:text-base font-bold text-m3-on-surface mb-1 font-heading">Women Employee Safety</h3>
                <p className="text-m3-on-surface-variant text-badge sm:text-xs leading-relaxed">
                  First-in/last-out algorithm, door-to-gate confirmations, GPS live route monitoring, and escort security guards.
                </p>
              </div>
            </div>

            <div className="bg-m3-surface rounded-m3-xl p-4 sm:p-5 border border-m3-outline-variant shadow-m3-1 flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-m3-lg bg-m3-surface-container text-m3-primary flex items-center justify-center mb-3">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-m3-primary" />
                </div>
                <h3 className="text-xs sm:text-base font-bold text-m3-on-surface mb-1 font-heading">60-Min Replacement SLA</h3>
                <p className="text-m3-on-surface-variant text-badge sm:text-xs leading-relaxed">
                  Automated driver dispatch immediately replaces vehicles or drivers during maintenance or illness within 60 minutes.
                </p>
              </div>
            </div>

            <div className="bg-m3-surface rounded-m3-xl p-4 sm:p-5 border border-m3-outline-variant shadow-m3-1 flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-m3-lg bg-m3-surface-container text-m3-primary flex items-center justify-center mb-3">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-m3-primary" />
                </div>
                <h3 className="text-xs sm:text-base font-bold text-m3-on-surface mb-1 font-heading">100% GST Tax Invoices</h3>
                <p className="text-m3-on-surface-variant text-badge sm:text-xs leading-relaxed">
                  Itemized electronic trip sheets, roster logs, and unified monthly GST invoices for seamless corporate input tax credits.
                </p>
              </div>
            </div>

            <div className="bg-m3-surface rounded-m3-xl p-4 sm:p-5 border border-m3-outline-variant shadow-m3-1 flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-m3-lg bg-m3-surface-container text-m3-primary flex items-center justify-center mb-3">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-m3-primary" />
                </div>
                <h3 className="text-xs sm:text-base font-bold text-m3-on-surface mb-1 font-heading">100% Police Verified (PVC)</h3>
                <p className="text-m3-on-surface-variant text-badge sm:text-xs leading-relaxed">
                  Every commercial chauffeur holds background verification, commercial badge clearance, and corporate etiquette training.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FAQS (Interactive Dropdown Accordion) */}
      <section className="py-10 md:py-14 bg-m3-surface-container-low border-t border-m3-outline-variant/60">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-m3-full bg-m3-surface-container-high border border-m3-outline-variant text-m3-on-surface text-xs font-semibold shadow-m3-1 mb-3.5 tracking-wide">
              <span className="w-2 h-2 rounded-full bg-m3-primary"></span>
              <span>Corporate FAQ</span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-m3-on-surface tracking-tight leading-tight mb-2.5 font-heading">
              Corporate Mobility <span className="text-m3-primary">FAQs</span>
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-m3-on-surface-variant max-w-2xl mx-auto font-normal leading-relaxed mb-6 font-sans">
              Frequently asked questions by HR managers and procurement heads.
            </p>
          </div>

          <div className="space-y-3 font-sans">
            {faqs.map((f, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div 
                  key={idx} 
                  className="bg-m3-surface rounded-m3-lg border border-m3-outline-variant shadow-m3-1 hover:border-m3-outline/70 transition-all overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full px-3.5 py-3 sm:px-4 sm:py-3.5 text-left flex items-center justify-between gap-3 cursor-pointer select-none hover:bg-m3-surface-container-low transition-colors"
                  >
                    <span className={`font-heading font-semibold text-xs sm:text-sm leading-snug transition-colors ${isOpen ? 'text-m3-primary' : 'text-m3-on-surface'}`}>
                      {f.q}
                    </span>
                    <ChevronDown className={`w-4 h-4 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-m3-primary' : 'text-m3-on-surface-variant'}`} />
                  </button>
                  {isOpen && (
                    <div className="px-3.5 sm:px-4 pb-3.5 pt-2.5 text-xs text-m3-on-surface-variant font-normal leading-relaxed border-t border-m3-outline-variant/40 bg-m3-surface">
                      <p>{f.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. BOTTOM CONVERSION STRIP */}
      <section className="bg-m3-inverse-surface text-m3-inverse-on-surface py-10 md:py-12 border-t border-m3-outline-variant/20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight leading-tight mb-2.5 font-heading text-white">
            Partner With Chennai's Trusted <span className="text-white">Corporate Mobility Fleet</span>
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm md:text-base mb-6 max-w-xl mx-auto font-normal leading-relaxed font-sans">
            Schedule a 15-minute consultation or request custom route pricing for your company's employee shifts and executive fleet.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <WhatsAppButton
              href="https://wa.me/919092303060?text=Hi%20Kalidass%20Travels,%20I%20want%20to%20schedule%20a%20Corporate%20Mobility%20RFP%20meeting."
              size="lg"
              variant="filled"
              text="Discuss Corporate Account on WhatsApp"
            />
            <a
              href="tel:+919092303060"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-m3-surface hover:bg-m3-surface-container text-m3-on-surface px-6 py-3.5 rounded-m3-full font-semibold text-xs sm:text-sm shadow-m3-1 transition-all"
            >
              <Phone className="w-4 h-4 text-emerald-500" />
              <span>Call B2B Desk: +91 90923 03060</span>
            </a>
          </div>
        </div>
      </section>

    </div>
  );
}
