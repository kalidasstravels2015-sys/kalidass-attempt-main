import React, { useState } from 'react';
import WhatsAppButton from './react/WhatsAppButton.jsx';
import { 
  Palmtree, 
  MapPin, 
  Car, 
  ShieldCheck, 
  Phone, 
  MessageCircle, 
  CheckCircle2, 
  HelpCircle, 
  ChevronRight, 
  ChevronDown,
  ArrowRight,
  Sparkles,
  Compass,
  Calendar,
  Waves,
  Sun
} from 'lucide-react';

export default function PopularDestinations() {
  const [activeType, setActiveType] = useState('package');
  const [openFaq, setOpenFaq] = useState(null);

  const packageTariff = [
    {
      id: 'pondicherry',
      name: 'Chennai to Pondicherry Weekend Getaway',
      duration: '1 Day Trip (320 km Round Trip)',
      sedan: '₹4,500',
      ertiga: '₹5,500',
      innova: '₹6,500',
      crysta: '₹7,500',
      tempo: '₹9,500',
      highlight: 'Auroville, French Colony, Promenade Beach & ECR Tolls included',
      slug: 'pondicherry-one-day-trip',
      badge: 'Top Weekend Trip',
      whatsapp: 'https://wa.me/916381939769?text=Hi%20Kalidass%20Travels,%20I%20want%20to%20book%20the%20Chennai%20to%20Pondicherry%20Day%20Trip.'
    },
    {
      id: 'mahabalipuram',
      name: 'Mahabalipuram UNESCO & ECR Coastal Tour',
      duration: 'Full Day (8 Hrs / 120 Km)',
      sedan: '₹3,500',
      ertiga: '₹4,500',
      innova: '₹5,500',
      crysta: '₹6,500',
      tempo: '₹8,000',
      highlight: 'Shore Temple, Five Rathas, Butter Ball, Seashell Museum + Tolls',
      slug: 'mahabalipuram-ecr-temple-route',
      badge: 'Heritage & Beach',
      whatsapp: 'https://wa.me/916381939769?text=Hi%20Kalidass%20Travels,%20I%20want%20to%20book%20the%20Mahabalipuram%20Day%20Tour.'
    },
    {
      id: 'chennai-city',
      name: 'Chennai City Local Sightseeing',
      duration: '8 Hours / 80 Km Package',
      sedan: '₹2,500',
      ertiga: '₹3,200',
      innova: '₹3,800',
      crysta: '₹4,500',
      tempo: '₹5,500',
      highlight: 'Kapaleeshwarar, Santhome, Marina Beach, Egmore Museum & Fort St. George',
      slug: 'one-day-chennai-city-tour',
      badge: 'City Tour',
      whatsapp: 'https://wa.me/916381939769?text=Hi%20Kalidass%20Travels,%20I%20want%20to%20book%20the%20Chennai%20City%20Sightseeing%20Tour.'
    }
  ];

  const perKmTariff = [
    {
      id: 'km-sedan',
      name: 'Swift Dzire / Toyota Etios',
      badge: 'Economical Sedan',
      capacity: '4 Pax + 2 Bags',
      roundTrip: '₹14 / km',
      oneWay: '₹16 / km',
      minKm: '250 km / day',
      driverBata: '₹400 / day',
      highlight: 'Best for small families & couples. Smooth AC comfort.',
      slug: 'outstation-car-rental-per-km',
      whatsapp: 'https://wa.me/916381939769?text=Hi%20Kalidass%20Travels,%20I%20need%20a%20Sedan%20for%20an%20outstation%20trip.'
    },
    {
      id: 'km-ertiga',
      name: 'Maruti Ertiga / XL6',
      badge: 'Family SUV',
      capacity: '6 Pax + 3 Bags',
      roundTrip: '₹17 / km',
      oneWay: '₹19 / km',
      minKm: '250 km / day',
      driverBata: '₹500 / day',
      highlight: '6-seater spacious layout with dual AC for small groups.',
      slug: 'outstation-car-rental-per-km',
      whatsapp: 'https://wa.me/916381939769?text=Hi%20Kalidass%20Travels,%20I%20need%20an%20Ertiga%20SUV%20for%20an%20outstation%20trip.'
    },
    {
      id: 'km-innova',
      name: 'Toyota Innova',
      badge: 'Highway King',
      capacity: '7 Pax + 4 Bags',
      roundTrip: '₹20 / km',
      oneWay: '₹22 / km',
      minKm: '250 km / day',
      driverBata: '₹600 / day',
      highlight: 'Gold standard for long-distance family highway comfort.',
      slug: 'outstation-car-rental-per-km',
      whatsapp: 'https://wa.me/916381939769?text=Hi%20Kalidass%20Travels,%20I%20need%20a%20Toyota%20Innova%20for%20an%20outstation%20trip.'
    },
    {
      id: 'km-crysta',
      name: 'Toyota Innova Crysta',
      badge: 'Luxury Comfort',
      capacity: '7 Pax + 5 Bags',
      roundTrip: '₹22 / km',
      oneWay: '₹25 / km',
      minKm: '250 km / day',
      driverBata: '₹700 / day',
      highlight: 'Luxury captain seats, superior suspension & VIP comfort.',
      slug: 'outstation-car-rental-per-km',
      whatsapp: 'https://wa.me/916381939769?text=Hi%20Kalidass%20Travels,%20I%20need%20an%20Innova%20Crysta%20for%20an%20outstation%20trip.'
    },
    {
      id: 'km-tempo',
      name: 'Tempo Traveller (12 / 17 Seater)',
      badge: 'Group Coach',
      capacity: '12–17 Pax + Bags',
      roundTrip: '₹26 / km',
      oneWay: '₹29 / km',
      minKm: '300 km / day',
      driverBata: '₹800 / day',
      highlight: 'Push-back seats, high roof & audio/video system for group tours.',
      slug: 'outstation-car-rental-per-km',
      whatsapp: 'https://wa.me/916381939769?text=Hi%20Kalidass%20Travels,%20I%20need%20a%20Tempo%20Traveller%20for%20a%20group%20trip.'
    }
  ];

  const showPackages = activeType === 'package';
  const showPerKm = activeType === 'perkm';

  const destinationCards = [
    {
      title: 'Chennai to Pondicherry Weekend Getaway',
      badge: 'Starts ₹4,500 All-Inclusive',
      slug: 'pondicherry-one-day-trip',
      icon: Palmtree,
      desc: 'Scenic drive along the East Coast Road (ECR). Visit Auroville, Matrimandir viewing, Sri Aurobindo Ashram, French White Town, and Promenade Beach.',
      highlights: ['Auroville & Promenade Beach tour', 'Flexible lunch/cafe stops on ECR', 'ECR FASTag tolls included']
    },
    {
      title: 'Mahabalipuram UNESCO Heritage & Beach Tour',
      badge: 'Starts ₹3,500 Full Day',
      slug: 'mahabalipuram-ecr-temple-route',
      icon: Waves,
      desc: 'Explore the 7th-century rock-cut monuments of Mamallapuram including the Shore Temple, Five Rathas, Arjuna’s Penance, and India’s largest Seashell Museum.',
      highlights: ['UNESCO World Heritage monument tour', 'Optional Crocodile Bank / DakshinaChitra stop', 'Full 8 hours flexible sightseeing']
    },
    {
      title: 'One-Day Chennai City Sightseeing Tour',
      badge: 'Starts ₹2,500 (8 Hrs / 80 Km)',
      slug: 'one-day-chennai-city-tour',
      icon: Compass,
      desc: 'Discover Chennai’s rich cultural landmarks: ancient Kapaleeshwarar Temple, Santhome Basilica, Marina Beach, Government Museum Egmore, and Fort St. George.',
      highlights: ['Doorstep pickup & drop in Chennai', 'Comfortable AC city navigation', 'Transparent per-km overtime rates']
    },
    {
      title: 'Outstation Master Per-KM Tariff',
      badge: 'Starts ₹14 / km',
      slug: 'outstation-car-rental-per-km',
      icon: Car,
      desc: 'Transparent per-kilometer rates for custom outstation trips across South India (Bangalore, Mysore, Ooty, Kodaikanal, Yercaud, Kerala). Zero surge pricing.',
      highlights: ['Flat ₹14/km (Sedan) & ₹18/km (Innova)', 'Zero night surge multipliers', 'Transparent daily driver bata']
    }
  ];

  const faqs = [
    {
      q: 'How is the per-km outstation billing calculated?',
      a: 'Outstation trips follow a standard minimum billing of 250 km per calendar day (300 km for Innova Crysta/Tempo Traveller). If you travel 220 km in a day, the minimum 250 km applies. If you travel 340 km, you are billed for the actual 340 km.'
    },
    {
      q: 'Are tolls and driver bata included in outstation package rates?',
      a: 'For fixed destination packages (like Pondicherry and Mahabalipuram), fuel, driver bata, and highway tolls are 100% all-inclusive. For open per-km outstation trips, fuel and vehicle are covered in the per-km rate, while tolls and parking are charged at actuals.'
    },
    {
      q: 'Can we stop for sightseeing on the way to Pondicherry along ECR?',
      a: 'Yes! Our drivers happily accommodate brief photo stops, breakfast halts at Kovalam or Mahabalipuram, and scenic ocean viewpoints along the East Coast Road.'
    }
  ];

  return (
    <div className="font-sans text-m3-on-surface bg-m3-surface-container-low min-h-screen">
      
      {/* 1. HERO SECTION (Unified M3 Light Theme) */}
      <section className="bg-m3-surface pt-8 pb-10 md:pt-14 md:pb-14 border-b border-m3-outline-variant/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-m3-full bg-m3-surface-container border border-m3-outline-variant text-m3-on-surface text-xs font-semibold shadow-m3-1 mb-3.5 tracking-wide">
            <span className="w-2 h-2 rounded-full bg-m3-primary"></span>
            <span>Outstation Cabs • Weekend Getaways • Transparent Per-KM Tariffs</span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-m3-on-surface tracking-tight mb-3 leading-tight font-heading">
            Outstation Cabs &amp; <br className="hidden sm:inline" />
            <span className="text-m3-primary">Popular Weekend Getaways</span>
          </h1>
          
          <p className="text-xs sm:text-sm md:text-base text-m3-on-surface-variant mb-6 max-w-2xl mx-auto leading-relaxed font-normal font-sans">
            Escape the city with flat per-kilometer rates and zero surge pricing. Enjoy scenic drives to Pondicherry, Mahabalipuram, Yercaud, and Bangalore with polite, vetted drivers.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a 
              href="#outstation-matrix"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-m3-full bg-m3-primary hover:bg-m3-primary/90 text-m3-on-primary font-bold text-xs sm:text-sm shadow-m3-2 transition-all transform hover:-translate-y-0.5"
            >
              <span>Explore Packages &amp; Rates</span>
              <ChevronDown className="w-4 h-4 text-white" />
            </a>
            <a 
              href="tel:+916381939769"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-m3-full bg-m3-surface hover:bg-m3-surface-container text-m3-on-surface border border-m3-outline-variant font-semibold text-xs sm:text-sm shadow-m3-1 transition-all"
            >
              <Phone className="w-4 h-4 text-m3-primary" />
              <span>Outstation Desk: +91 63819 39769</span>
            </a>
          </div>

        </div>
      </section>

      {/* 2. ⚡ MASTER "ALL OUTSTATION RATES AT A GLANCE" COMPARISON MATRIX */}
      <section id="outstation-matrix" className="py-8 md:py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-m3-surface rounded-m3-2xl shadow-m3-1 border border-m3-outline-variant overflow-hidden">
          
          <div className="p-5 md:p-6 bg-m3-surface-container text-m3-on-surface flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-m3-outline-variant/60">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-m3-full bg-m3-surface-container-high text-m3-on-surface text-xs font-semibold uppercase tracking-wider mb-2 border border-m3-outline-variant/60">
                <Sun className="w-3.5 h-3.5 text-m3-primary" /> Transparent Tariff Card
              </div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight font-heading text-m3-on-surface">
                Popular Outstation Trips &amp; <span className="text-m3-primary">Cab Tariffs</span>
              </h2>
              <p className="text-m3-on-surface-variant text-xs sm:text-sm md:text-base mt-1 font-sans leading-relaxed">
                Clear, transparent rates for all vehicles. No surge pricing, no hidden costs. Select your preferred tariff model below:
              </p>
            </div>

            {/* Type Filter Tabs (Separated Clear Categories) */}
            <div role="tablist" aria-label="Tariff rate category" className="flex flex-wrap gap-1.5 bg-m3-surface-container-high p-1.5 rounded-m3-full border border-m3-outline-variant/60 self-start md:self-auto">
              {[
                { id: 'package', label: 'Day Packages (All-Inclusive)' },
                { id: 'perkm', label: 'Outstation Per-KM Tariffs' }
              ].map(tab => (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={activeType === tab.id}
                  onClick={() => setActiveType(tab.id)}
                  className={`px-4 py-2 rounded-m3-full text-xs sm:text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-m3-primary ${
                    activeType === tab.id 
                      ? 'bg-m3-primary text-m3-on-primary shadow-m3-1' 
                      : 'text-m3-on-surface-variant hover:text-m3-on-surface hover:bg-m3-surface/60'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Section A: Day Getaway Packages (When Active) */}
          {showPackages && (
            <div className="border-b border-m3-outline-variant/60 last:border-b-0">
              <div className="px-5 py-3.5 bg-m3-surface-container-low border-b border-m3-outline-variant/60 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-m3-primary flex items-center gap-1.5">
                  <Palmtree className="w-3.5 h-3.5" />
                  <span>Fixed All-Inclusive Day Getaway Packages</span>
                </span>
                <span className="text-badge text-m3-on-surface-variant font-medium hidden sm:inline">
                  Tolls & Driver Bata Included
                </span>
              </div>

              {/* Desktop Packages Table (>= md) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-sm font-sans">
                  <thead className="bg-m3-surface-container-lowest text-m3-on-surface-variant text-xs font-bold uppercase tracking-wider border-b border-m3-outline-variant/60">
                    <tr>
                      <th className="px-5 py-3.5">Getaway Package</th>
                      <th className="px-4 py-3.5">Duration & Scope</th>
                      <th className="px-4 py-3.5">Sedan</th>
                      <th className="px-4 py-3.5">Ertiga</th>
                      <th className="px-4 py-3.5">Innova</th>
                      <th className="px-4 py-3.5">Innova Crysta</th>
                      <th className="px-4 py-3.5">Tempo</th>
                      <th className="px-5 py-3.5 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-m3-outline-variant/40">
                    {packageTariff.map((row, idx) => (
                      <tr 
                        key={row.id} 
                        className={`hover:bg-m3-surface-container-low transition-colors ${idx % 2 === 0 ? 'bg-m3-surface' : 'bg-m3-surface-container-lowest/40'}`}
                      >
                        <td className="px-5 py-4">
                          <div className="font-bold text-m3-on-surface text-base">{row.name}</div>
                          <span className="inline-block mt-0.5 text-badge font-semibold text-m3-on-surface-variant bg-m3-surface-container px-2.5 py-0.5 rounded-m3-full border border-m3-outline-variant">
                            {row.badge}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-m3-on-surface-variant text-xs font-medium whitespace-nowrap">
                          {row.duration}
                        </td>
                        <td className="px-4 py-4 text-center font-bold text-m3-on-surface">{row.sedan}</td>
                        <td className="px-4 py-4 text-center font-bold text-m3-on-surface">{row.ertiga}</td>
                        <td className="px-4 py-4 text-center font-bold text-m3-on-surface">{row.innova}</td>
                        <td className="px-4 py-4 text-center font-bold text-m3-on-surface">{row.crysta}</td>
                        <td className="px-4 py-4 text-center font-bold text-m3-on-surface">{row.tempo}</td>
                        <td className="px-5 py-4 text-right whitespace-nowrap">
                          <a
                            href={`/services/${row.slug}/`}
                            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-m3-surface-container hover:bg-m3-primary hover:text-white text-m3-on-surface border border-m3-outline-variant rounded-m3-full text-xs font-bold transition-all group"
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

              {/* Mobile Packages View (< md) */}
              <div className="block md:hidden divide-y divide-m3-outline-variant/40">
                {packageTariff.map((row) => (
                  <div key={row.id} className="p-4 bg-m3-surface hover:bg-m3-surface-container-low transition-colors">
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-[150px]">
                        <div className="font-bold text-m3-on-surface text-sm">{row.name}</div>
                        <div className="text-badge text-m3-on-surface-variant font-medium">{row.duration}</div>
                      </div>
                      <span className="text-micro font-semibold text-m3-on-surface-variant bg-m3-surface-container px-2 py-0.5 rounded-m3-full border border-m3-outline-variant/60 self-start">
                        {row.badge}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-1.5 my-3 text-center">
                      <div className="bg-m3-surface-container-low p-2 rounded-m3-lg border border-m3-outline-variant/60">
                        <div className="text-micro text-m3-on-surface-variant">Sedan</div>
                        <div className="text-xs font-bold text-m3-on-surface mt-0.5">{row.sedan}</div>
                      </div>
                      <div className="bg-m3-surface-container-low p-2 rounded-m3-lg border border-m3-outline-variant/60">
                        <div className="text-micro text-m3-on-surface-variant">Ertiga</div>
                        <div className="text-xs font-bold text-m3-on-surface mt-0.5">{row.ertiga}</div>
                      </div>
                      <div className="bg-m3-surface-container-low p-2 rounded-m3-lg border border-m3-outline-variant/60">
                        <div className="text-micro text-m3-on-surface-variant">Innova</div>
                        <div className="text-xs font-bold text-m3-on-surface mt-0.5">{row.innova}</div>
                      </div>
                      <div className="bg-m3-surface-container-low p-2 rounded-m3-lg border border-m3-outline-variant/60">
                        <div className="text-micro text-m3-on-surface-variant">Crysta</div>
                        <div className="text-xs font-bold text-m3-on-surface mt-0.5">{row.crysta}</div>
                      </div>
                      <div className="bg-m3-surface-container-low p-2 rounded-m3-lg border border-m3-outline-variant/60 col-span-2">
                        <div className="text-micro text-m3-on-surface-variant">Tempo</div>
                        <div className="text-xs font-bold text-m3-on-surface mt-0.5">{row.tempo}</div>
                      </div>
                    </div>

                    <div className="pt-1">
                      <a
                        href={`/services/${row.slug}/`}
                        className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-m3-surface-container hover:bg-m3-surface-container-high text-m3-on-surface border border-m3-outline-variant rounded-m3-full text-xs font-semibold transition-all"
                      >
                        <span>View Package Details &amp; Route</span>
                        <ChevronRight className="w-3.5 h-3.5 text-m3-primary" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section B: Per-KM Outstation Rates (When Active) */}
          {showPerKm && (
            <div>
              <div className="px-5 py-3.5 bg-m3-surface-container-low border-b border-m3-outline-variant/60 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-m3-primary flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5" />
                  <span>Outstation Per-KM Cab Tariffs (From Chennai)</span>
                </span>
                <span className="text-badge text-m3-on-surface-variant font-medium hidden sm:inline">
                  Min 250 km / Day Billing
                </span>
              </div>

              {/* Desktop Per-KM Table (>= md) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-sm font-sans">
                  <thead className="bg-m3-surface-container-lowest text-m3-on-surface-variant text-xs font-bold uppercase tracking-wider border-b border-m3-outline-variant/60">
                    <tr>
                      <th className="px-5 py-3.5">Vehicle Model</th>
                      <th className="px-4 py-3.5">Capacity</th>
                      <th className="px-4 py-3.5 text-center">Round Trip (₹/km)</th>
                      <th className="px-4 py-3.5 text-center">One Way (₹/km)</th>
                      <th className="px-4 py-3.5 text-center">Min KM / Day</th>
                      <th className="px-4 py-3.5 text-center">Driver Bata</th>
                      <th className="px-5 py-3.5 text-right">Estimate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-m3-outline-variant/40">
                    {perKmTariff.map((row, idx) => (
                      <tr 
                        key={row.id} 
                        className={`hover:bg-m3-surface-container-low transition-colors ${idx % 2 === 0 ? 'bg-m3-surface' : 'bg-m3-surface-container-lowest/40'}`}
                      >
                        <td className="px-5 py-4">
                          <div className="font-bold text-m3-on-surface text-base">{row.name}</div>
                          <span className="inline-block mt-0.5 text-badge font-semibold text-m3-on-surface-variant bg-m3-surface-container px-2.5 py-0.5 rounded-m3-full border border-m3-outline-variant/60">
                            {row.badge}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-m3-on-surface-variant text-xs font-medium whitespace-nowrap">
                          {row.capacity}
                        </td>
                        <td className="px-4 py-4 text-center font-bold text-m3-on-surface text-sm">
                          {row.roundTrip}
                        </td>
                        <td className="px-4 py-4 text-center font-bold text-m3-on-surface text-sm">
                          {row.oneWay}
                        </td>
                        <td className="px-4 py-4 text-center text-m3-on-surface-variant text-xs font-medium">
                          {row.minKm}
                        </td>
                        <td className="px-4 py-4 text-center font-semibold text-m3-on-surface text-xs">
                          {row.driverBata}
                        </td>
                        <td className="px-5 py-4 text-right whitespace-nowrap">
                          <a
                            href="/calculator/"
                            className="inline-flex items-center justify-center gap-1 px-3.5 py-1.5 bg-m3-surface-container hover:bg-m3-primary hover:text-white text-m3-on-surface border border-m3-outline-variant rounded-m3-full text-xs font-semibold transition-all"
                          >
                            <span>Calculate</span>
                            <ChevronRight className="w-3 h-3" />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Per-KM Cards (< md) */}
              <div className="block md:hidden divide-y divide-m3-outline-variant/40">
                {perKmTariff.map((row) => (
                  <div key={row.id} className="p-4 bg-m3-surface hover:bg-m3-surface-container-low transition-colors">
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-[150px]">
                        <div className="font-bold text-m3-on-surface text-sm">{row.name}</div>
                        <div className="text-badge text-m3-on-surface-variant font-medium">{row.capacity}</div>
                      </div>
                      <span className="text-micro font-semibold text-m3-on-surface-variant bg-m3-surface-container px-2 py-0.5 rounded-m3-full border border-m3-outline-variant/60 self-start">
                        {row.badge}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 my-2.5 text-center">
                      <div className="bg-m3-surface-container-low p-2 rounded-m3-lg border border-m3-outline-variant/60">
                        <div className="text-micro text-m3-on-surface-variant font-semibold uppercase">Round Trip</div>
                        <div className="text-sm font-bold text-m3-on-surface mt-0.5">{row.roundTrip}</div>
                      </div>
                      <div className="bg-m3-surface-container-low p-2 rounded-m3-lg border border-m3-outline-variant/60">
                        <div className="text-micro text-m3-on-surface-variant font-semibold uppercase">One Way</div>
                        <div className="text-sm font-bold text-m3-on-surface mt-0.5">{row.oneWay}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-badge text-m3-on-surface-variant py-1 px-0.5">
                      <span>Min: <strong className="text-m3-on-surface">{row.minKm}</strong></span>
                      <span>Driver Bata: <strong className="text-m3-on-surface">{row.driverBata}</strong></span>
                    </div>

                    <div className="mt-2.5">
                      <a
                        href="/calculator/"
                        className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-m3-surface-container hover:bg-m3-surface-container-high text-m3-on-surface border border-m3-outline-variant rounded-m3-full text-xs font-semibold transition-all"
                      >
                        <span>Calculate Instant Fare</span>
                        <ChevronRight className="w-3.5 h-3.5 text-m3-primary" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="p-4 bg-m3-surface-container border-t border-m3-outline-variant/60 text-xs text-m3-on-surface-variant flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span>* Standard outstation billing is 250 km/day (300 km for Tempo). Tolls & parking on actual FASTag receipts.</span>
            <span className="text-m3-on-surface font-semibold">Zero surge pricing • Clean sanitized dual-AC cars</span>
          </div>

        </div>
      </section>

      {/* 3. THE 4 GETAWAY CARDS */}
      <section className="py-10 md:py-14 bg-m3-surface-container-low border-t border-m3-outline-variant/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-m3-full bg-m3-surface border border-m3-outline-variant text-m3-on-surface text-xs font-semibold shadow-m3-1 mb-3.5 tracking-wide">
              <span className="w-2 h-2 rounded-full bg-m3-primary"></span>
              <span>Popular Routes</span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-m3-on-surface tracking-tight leading-tight mb-2.5 font-heading">
              Featured Outstation <span className="text-m3-primary">Getaways</span>
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-m3-on-surface-variant max-w-2xl mx-auto leading-relaxed mb-6 font-normal font-sans">
              Click below for detailed sightseeing itineraries, route maps, vehicle choices, and booking guidance.
            </p>
          </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          {destinationCards.map((srv, i) => {
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
                  <span>View Package Itinerary & Tariff</span>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </a>
            );
          })}
          </div>
        </div>
      </section>

      {/* 4. THE 4 COMMITMENTS (Clean M3 Light Surface) */}
      <section className="py-10 md:py-14 bg-m3-surface border-t border-m3-outline-variant/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-m3-full bg-m3-surface-container border border-m3-outline-variant text-m3-on-surface text-xs font-semibold shadow-m3-1 mb-3.5 tracking-wide">
              <span className="w-2 h-2 rounded-full bg-m3-secondary"></span>
              <span>Service Guarantees</span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-m3-on-surface tracking-tight leading-tight mb-2.5 font-heading">
              Why Travelers Choose <span className="text-m3-primary">Kalidass Outstation Cabs</span>
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-m3-on-surface-variant max-w-2xl mx-auto leading-relaxed mb-6 font-normal font-sans">
              Comfortable, reliable, and hassle-free outstation road trips across South India.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            <div className="bg-m3-surface rounded-m3-xl p-4 sm:p-5 border border-m3-outline-variant shadow-m3-1 flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-m3-lg bg-m3-surface-container text-m3-primary flex items-center justify-center mb-3">
                  <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-m3-primary" />
                </div>
                <h3 className="text-xs sm:text-base font-bold text-m3-on-surface mb-1 font-heading">Zero Surge Pricing</h3>
                <p className="text-m3-on-surface-variant text-badge sm:text-xs leading-relaxed">
                  Our rates remain fixed even during weekends, festival holidays, and peak monsoon seasons.
                </p>
              </div>
            </div>

            <div className="bg-m3-surface rounded-m3-xl p-4 sm:p-5 border border-m3-outline-variant shadow-m3-1 flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-m3-lg bg-m3-surface-container text-m3-primary flex items-center justify-center mb-3">
                  <Car className="w-4 h-4 sm:w-5 sm:h-5 text-m3-primary" />
                </div>
                <h3 className="text-xs sm:text-base font-bold text-m3-on-surface mb-1 font-heading">Spotless Dual-AC Cars</h3>
                <p className="text-m3-on-surface-variant text-badge sm:text-xs leading-relaxed">
                  Vehicles are deep-cleaned and sanitized before every trip with ample luggage boot capacity.
                </p>
              </div>
            </div>

            <div className="bg-m3-surface rounded-m3-xl p-4 sm:p-5 border border-m3-outline-variant shadow-m3-1 flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-m3-lg bg-m3-surface-container text-m3-primary flex items-center justify-center mb-3">
                  <Compass className="w-4 h-4 sm:w-5 sm:h-5 text-m3-primary" />
                </div>
                <h3 className="text-xs sm:text-base font-bold text-m3-on-surface mb-1 font-heading">Highway & Hill Experts</h3>
                <p className="text-m3-on-surface-variant text-badge sm:text-xs leading-relaxed">
                  Chauffeurs with minimum 8+ years expressway and ghat road experience for safe 80-90 km/h cruising.
                </p>
              </div>
            </div>

            <div className="bg-m3-surface rounded-m3-xl p-4 sm:p-5 border border-m3-outline-variant shadow-m3-1 flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-m3-lg bg-m3-surface-container text-m3-primary flex items-center justify-center mb-3">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-m3-primary" />
                </div>
                <h3 className="text-xs sm:text-base font-bold text-m3-on-surface mb-1 font-heading">Flexible Route Stops</h3>
                <p className="text-m3-on-surface-variant text-badge sm:text-xs leading-relaxed">
                  Stop for photos on the ECR coast, enjoy traditional highway messes, or take tea breaks at your own pace.
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
              <span>Outstation FAQ</span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-m3-on-surface tracking-tight leading-tight mb-2.5 font-heading">
              Outstation Frequently <span className="text-m3-primary">Asked Questions</span>
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-m3-on-surface-variant max-w-2xl mx-auto font-normal leading-relaxed mb-6 font-sans">
              Everything you need to know before booking your outstation getaway.
            </p>
          </div>

          <div className="space-y-3 font-sans">
            {faqs.map((f, idx) => {
              const isOpen = openFaq === idx;
              const questionId = `faq-popular-q-${idx}`;
              const answerId = `faq-popular-a-${idx}`;
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
            Planning a <span className="text-white">Weekend Road Trip?</span>
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm md:text-base mb-6 max-w-xl mx-auto font-normal leading-relaxed font-sans">
            Book your car in 60 seconds on WhatsApp. Share your destination and travel dates to receive an instant all-inclusive quote.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <WhatsAppButton
              href="https://wa.me/916381939769?text=Hi%20Kalidass%20Travels,%20I%20want%20to%20book%20an%20Outstation%20Cab."
              size="lg"
              variant="filled"
              text="Chat on WhatsApp (+91 63819 39769)"
            />
            <a
              href="tel:+916381939769"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-m3-surface hover:bg-m3-surface-container text-m3-on-surface px-6 py-3.5 rounded-m3-full font-semibold text-xs sm:text-sm shadow-m3-1 transition-all"
            >
              <Phone className="w-4 h-4 text-emerald-500" />
              <span>Call Outstation Desk</span>
            </a>
          </div>
        </div>
      </section>

    </div>
  );
}
