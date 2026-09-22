import React, { useState } from 'react';
import WhatsAppButton from './react/WhatsAppButton.jsx';
import { 
  ShieldCheck, 
  Clock, 
  MapPin, 
  Moon, 
  Heart, 
  Briefcase, 
  Car, 
  ArrowRight, 
  Phone, 
  MessageCircle, 
  CheckCircle2, 
  ChevronRight, 
  ChevronDown, 
  Tag
} from 'lucide-react';

export default function ActingDrivers() {
  const [activeTab, setActiveTab] = useState('city');
  const [openFaq, setOpenFaq] = useState(null);

  const categories = [
    { id: 'city', label: 'Within Chennai', count: '2 Plans' },
    { id: 'outstation', label: 'Outstation & Highway', count: '3 Plans' },
    { id: 'specialized', label: 'Specialized & Monthly', count: '3 Plans' }
  ];

  const packages = {
    city: [
      {
        id: 'city-4hr',
        name: 'City Short Duty',
        duration: '4 Hours',
        rate: '₹600',
        extraRate: '₹150 / extra hr',
        badge: 'Most Popular for Errands',
        icon: Clock,
        highlight: 'Unlimited stops in Chennai Metro. Ideal for T. Nagar shopping, airport drops, and doctor visits.',
        inclusions: ['Doorstep reporting in 15–30 mins', 'Zero KM limits within Metro limits', 'Manual, Auto & EV certified pilot'],
        slug: 'acting-driver-within-chennai',
        whatsapp: 'https://wa.me/919092303060?text=Hi%20Kalidass%20Travels,%20I%20need%20a%204-Hour%20City%20Acting%20Driver%20in%20Chennai.'
      },
      {
        id: 'city-8hr',
        name: 'City Full Day Duty',
        duration: '8 Hours',
        rate: '₹900',
        extraRate: '₹150 / extra hr',
        badge: 'Best Value for City',
        icon: Clock,
        highlight: 'Full-day multi-location duty for weddings, family functions, client meetings, or shopping.',
        inclusions: ['Up to 8 hours continuous duty', 'Assistance with baggage & parking', 'Zero surge pricing on weekends'],
        slug: 'acting-driver-within-chennai',
        whatsapp: 'https://wa.me/919092303060?text=Hi%20Kalidass%20Travels,%20I%20need%20an%208-Hour%20Full%20Day%20City%20Acting%20Driver.'
      }
    ],
    outstation: [
      {
        id: 'outstation-round',
        name: 'Outstation Round Trip',
        duration: 'Per Day (Up to 14 hrs)',
        rate: '₹600 – ₹800',
        extraRate: 'Sedan: ₹600 • SUV: ₹700 • Innova: ₹800',
        badge: 'Family Holidays & Pilgrimages',
        icon: MapPin,
        highlight: 'Highway specialist accompanies your personal car for temple tours (Tirupati, Kumbakonam) or hill stations.',
        inclusions: ['Disciplined 80–90 km/h cruising', 'Ghat road & mountain certified', 'Stays with your car for the entire tour'],
        slug: 'acting-driver-outstation-round-trip',
        whatsapp: 'https://wa.me/919092303060?text=Hi%20Kalidass%20Travels,%20I%20need%20an%20Outstation%20Round-Trip%20Acting%20Driver.'
      },
      {
        id: 'highway-copilot',
        name: 'Highway Co-Pilot & Relief Driver',
        duration: 'Interstate Long-Haul (12-14 hrs)',
        rate: '₹1,200 – ₹1,500',
        extraRate: '+ Actual return bus ticket',
        badge: 'Night Interstate Drives',
        icon: Moon,
        highlight: 'You drive daytime, our highway pilot takes over at night. Share the wheel to Bangalore, Madurai, or Kerala.',
        inclusions: ['Overnight express highway specialist', 'Active engine & tyre pressure checks', 'Zero highway driving fatigue'],
        slug: 'highway-copilot',
        whatsapp: 'https://wa.me/919092303060?text=Hi%20Kalidass%20Travels,%20I%20need%20a%20Highway%20Co-Pilot%20Relief%20Driver.'
      },
      {
        id: 'one-way-drop',
        name: 'Outstation One-Way Car Relocation',
        duration: 'Distance-Based (Min 150 km)',
        rate: '₹1,800 + ₹10/km',
        extraRate: '+ Actual return bus ticket',
        badge: 'Vehicle Relocation',
        icon: Car,
        highlight: 'Safely move your car from Chennai to Bangalore, Coimbatore, or Madurai with digital pre-trip inspection.',
        inclusions: ['Pre-trip odometer & scratch video log', 'Live WhatsApp GPS sharing', 'Doorstep handover to recipient'],
        slug: 'acting-driver-outstation-one-way',
        whatsapp: 'https://wa.me/919092303060?text=Hi%20Kalidass%20Travels,%20I%20need%20an%20Outstation%20One-Way%20Car%20Relocation%20Driver.'
      }
    ],
    specialized: [
      {
        id: 'senior-care',
        name: 'Senior Citizen & Medical Standby',
        duration: '4 Hrs / 8 Hrs',
        rate: '₹700 / ₹1,000',
        extraRate: '₹150 / extra hr',
        badge: 'Gentle Chauffeur Care',
        icon: Heart,
        highlight: 'Gentle chauffeur care for elderly parents visiting Apollo, MIOT, or Kauvery. Smooth braking & wheelchair help.',
        inclusions: ['Zero-rush consultation waiting', 'Hospital porch drop before parking', 'Slow, progressive gentle braking'],
        slug: 'driver-for-senior-citizens',
        whatsapp: 'https://wa.me/919092303060?text=Hi%20Kalidass%20Travels,%20I%20need%20a%20Senior%20Citizen%20Hospital%20Acting%20Driver.'
      },
      {
        id: 'night-duty',
        name: 'Night Duty & Safe Party Return',
        duration: 'Up to 3 Hours (10 PM - 5 AM)',
        rate: '₹800',
        extraRate: '₹200 / extra hr',
        badge: 'Zero Fatigue Risk',
        icon: ShieldCheck,
        highlight: 'Verified sober chauffeurs for late-night weddings, parties, dinners, or 2:00 AM airport drops in your car.',
        inclusions: ['Alert, rested night shift pilot', 'Zero-alcohol strict verification', 'Safe garage parking into your slot'],
        slug: 'night-driving-driver',
        whatsapp: 'https://wa.me/919092303060?text=Hi%20Kalidass%20Travels,%20I%20need%20a%20Night%20Duty%20Safe%20Return%20Acting%20Driver.'
      },
      {
        id: 'monthly-commute',
        name: 'Monthly Office Commute Retainer',
        duration: '26 Working Days',
        rate: '₹12,000 – ₹15,000',
        extraRate: '1 Shift: ₹12k • 2 Shift: ₹15k / mo',
        badge: 'Corporate Professionals',
        icon: Briefcase,
        highlight: 'Daily stress-free home-to-office commute along OMR, Guindy, and Ambattur with guaranteed leave replacement.',
        inclusions: ['Punctual doorstep morning pickup', 'Instant 60-min replacement SLA', 'Monthly GST invoices for reimbursement'],
        slug: 'office-commute-driver-monthly',
        whatsapp: 'https://wa.me/919092303060?text=Hi%20Kalidass%20Travels,%20I%20need%20a%20Monthly%20Office%20Commute%20Acting%20Driver.'
      }
    ]
  };

  const currentPackages = packages[activeTab] || packages.city;

  const steps = [
    {
      step: '01',
      title: 'Share Car & Route',
      desc: 'Car model, pickup address & time'
    },
    {
      step: '02',
      title: 'Verified Pilot Assigned',
      desc: 'Police background verified driver'
    },
    {
      step: '03',
      title: '2-Min Joint Check',
      desc: 'Quick fuel & odometer verification'
    },
    {
      step: '04',
      title: 'Relax & Pay Exact Fare',
      desc: 'Zero surge time-based tariff'
    }
  ];

  const faqs = [
    {
      q: 'How quickly can an acting driver report to my location in Chennai?',
      a: 'We recommend booking 1 to 2 hours in advance. For emergency requirements, our dispatch team connects you with the nearest verified pilot within 30 to 45 minutes across all Chennai zones (Adyar, Anna Nagar, T. Nagar, Velachery, OMR, Tambaram, Porur).'
    },
    {
      q: 'Are your drivers certified to drive automatic, luxury, and EV vehicles?',
      a: 'Yes. Every driver assigned to automatic or electric cars is specifically vetted on Torque Converter, CVT, Dual-Clutch (DCT/DSG), AMT, and EV drivetrains across models from Swift and Innova Crysta to Mercedes-Benz, BMW, and Audi.'
    },
    {
      q: 'Who pays for fuel, highway tolls, and parking charges?',
      a: 'Since the driver operates your personal vehicle, fuel, FASTag toll plaza charges, and mall or hospital parking tickets are paid directly by the vehicle owner.'
    },
    {
      q: 'What are the food and lodging rules for outstation trips?',
      a: 'For outstation duties, you can either invite the driver to eat with your family at highway halts or provide a modest ₹150 meal allowance per meal. For overnight stays, if your hotel provides a driver dormitory, no fee is charged; otherwise, a standard ₹300/night lodging allowance applies.'
    }
  ];

  return (
    <div className="font-sans text-m3-on-surface bg-m3-surface-container-low min-h-screen">
      
      {/* 1. HERO SECTION */}
      <section className="bg-m3-surface pt-7 pb-8 md:pt-12 md:pb-12 border-b border-m3-outline-variant/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-m3-full bg-m3-surface-container border border-m3-outline-variant text-m3-on-surface text-xs font-semibold shadow-m3-1 mb-3.5 tracking-wide">
            <span className="w-2 h-2 rounded-full bg-logo-red animate-pulse"></span>
            <span>Acting Chauffeurs • 100% Police Verified • Hourly &amp; Outstation</span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-m3-on-surface tracking-tight mb-3 leading-tight font-heading">
            Your Personal Car. <span className="text-m3-primary">Our Verified Chauffeur.</span>
          </h1>
          
          <p className="text-xs sm:text-sm md:text-base text-m3-on-surface-variant mb-6 max-w-2xl mx-auto leading-relaxed font-normal font-sans">
            Enjoy your own car without Chennai traffic stress, parking hunts, or highway fatigue. Hourly city duty, outstation pilgrimages &amp; night returns with transparent tariffs.
          </p>

          {/* Quick Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
            <a 
              href="#driver-plans"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-m3-full bg-m3-primary hover:bg-m3-primary/90 text-m3-on-primary font-bold text-xs sm:text-sm shadow-m3-2 transition-all transform hover:-translate-y-0.5"
            >
              <span>View Plans &amp; Tariffs</span>
              <ChevronDown className="w-4 h-4 text-white" />
            </a>
            <a 
              href="tel:+919092303060"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-m3-full bg-m3-surface hover:bg-m3-surface-container text-m3-on-surface border border-m3-outline-variant font-semibold text-xs sm:text-sm shadow-m3-1 transition-all"
            >
              <Phone className="w-4 h-4 text-m3-primary" />
              <span>Dispatch Desk: +91 63819 39769</span>
            </a>
          </div>

          {/* Simple Trust Badges (Checkmark Pills directly under CTA) */}
          <div className="flex flex-wrap items-center justify-center gap-2 max-w-3xl mx-auto pt-4 border-t border-m3-outline-variant/60">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-m3-full bg-m3-surface border border-m3-outline-variant text-m3-on-surface text-badge sm:text-xs font-semibold shadow-m3-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-m3-secondary shrink-0" />
              <span>100% Police Verified (PVC)</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-m3-full bg-m3-surface border border-m3-outline-variant text-m3-on-surface text-badge sm:text-xs font-semibold shadow-m3-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-m3-secondary shrink-0" />
              <span>Manual, Auto & EV Tested</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-m3-full bg-m3-surface border border-m3-outline-variant text-m3-on-surface text-badge sm:text-xs font-semibold shadow-m3-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-m3-secondary shrink-0" />
              <span>Ghat & Mountain Certified</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-m3-full bg-m3-surface border border-m3-outline-variant text-m3-on-surface text-badge sm:text-xs font-semibold shadow-m3-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-m3-secondary shrink-0" />
              <span>Zero-Surge Transparent Billing</span>
            </span>
          </div>

        </div>
      </section>

      {/* 2. MASTER INTERACTIVE SERVICE & TARIFF SELECTOR */}
      <section id="driver-plans" className="py-6 md:py-10 max-w-5xl mx-auto px-4 sm:px-6">
        
        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-m3-full bg-m3-primary-container text-m3-on-primary-container text-xs font-semibold tracking-wide mb-2.5 border border-m3-primary/20">
            <span className="w-2 h-2 rounded-full bg-m3-primary"></span>
            <span>Select Your Chauffeur Plan</span>
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight font-heading text-m3-on-surface">
            Transparent Chauffeur <span className="text-m3-primary">Tariffs</span>
          </h2>
        </div>

        {/* Segmented Category Tabs */}
        <div className="flex justify-center mb-5">
          <div className="inline-flex p-1.5 rounded-m3-full bg-m3-surface-container-high border border-m3-outline-variant/60 w-full sm:w-auto overflow-x-auto gap-1">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id)}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-m3-full text-xs sm:text-sm font-semibold whitespace-nowrap text-center transition-all ${
                  activeTab === cat.id 
                    ? 'bg-m3-primary text-m3-on-primary shadow-m3-1 font-bold' 
                    : 'text-m3-on-surface-variant hover:text-m3-on-surface hover:bg-m3-surface/60'
                }`}
              >
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Package Cards Grid (Under Active Tab) */}
        <div className={`grid gap-3.5 ${currentPackages.length === 2 ? 'sm:grid-cols-2 max-w-3xl mx-auto' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
          {currentPackages.map((pkg) => {
            return (
              <div 
                key={pkg.id}
                className="bg-m3-surface rounded-m3-xl p-4 sm:p-5 border border-m3-outline-variant shadow-m3-1 flex flex-col justify-between hover:border-m3-primary/50 hover:shadow-m3-3 transition-all"
              >
                <div>
                  {/* Card Header: Name + Badge on Left, Rate on Right */}
                  <div className="flex items-start justify-between gap-3 mb-2.5 border-b border-m3-outline-variant/50 pb-2.5">
                    <div>
                      <h3 className="font-bold text-sm sm:text-base text-m3-on-surface leading-tight font-heading">
                        {pkg.name}
                      </h3>
                      <span className="inline-block mt-1 text-micro sm:text-badge font-semibold text-m3-on-primary-container bg-m3-primary-container px-2.5 py-0.5 rounded-m3-full border border-m3-primary/20">
                        {pkg.badge}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-lg sm:text-xl font-black text-m3-primary font-heading">
                        {pkg.rate}
                      </div>
                      <div className="text-xs font-semibold text-m3-on-surface mt-0.5">
                        {pkg.duration}
                      </div>
                      <div className="text-badge sm:text-xs text-m3-on-surface-variant font-medium">
                        {pkg.extraRate}
                      </div>
                    </div>
                  </div>

                  {/* Summary */}
                  <p className="text-xs text-m3-on-surface-variant leading-relaxed mb-3">
                    {pkg.highlight}
                  </p>

                  {/* Inclusions */}
                  <ul className="space-y-1 mb-3.5 text-xs text-m3-on-surface-variant">
                    {pkg.inclusions.map((inc, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-m3-secondary shrink-0" />
                        <span>{inc}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Card Actions */}
                <div className="pt-2.5 border-t border-m3-outline-variant/50">
                  <a
                    href={`/services/${pkg.slug}/`}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-3 bg-m3-surface-container hover:bg-m3-surface-container-high text-m3-on-surface rounded-m3-full text-xs font-semibold transition-all border border-m3-outline-variant/60 group"
                  >
                    <span>View Plan Details &amp; Guidelines</span>
                    <ChevronRight className="w-3.5 h-3.5 text-m3-primary transform group-hover:translate-x-0.5 transition-transform" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Note */}
        <div className="mt-3.5 p-3 bg-m3-surface-container rounded-m3-lg border border-m3-outline-variant text-badge sm:text-xs text-m3-on-surface-variant flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-center sm:text-left">
          <span>• Fuel, FASTag toll taxes, and mall/hospital parking are borne by vehicle owner.</span>
          <span className="text-m3-on-surface font-semibold">Zero KM limits in Chennai • Time-based billing</span>
        </div>

      </section>

      {/* 3. HOW IT WORKS (Horizontal Mind-Map / Arrow Flowchart Diagram) */}
      <section className="py-10 md:py-14 bg-m3-surface-container-low border-y border-m3-outline-variant/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-m3-full bg-m3-surface border border-m3-outline-variant text-m3-on-surface text-xs font-semibold shadow-m3-1 mb-3.5 tracking-wide">
              <span className="w-2 h-2 rounded-full bg-m3-primary"></span>
              <span>Booking Process</span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight leading-tight text-m3-on-surface font-heading">
              How Booking Works <span className="text-m3-primary">(4 Simple Steps)</span>
            </h2>
          </div>

          {/* Desktop & Tablet: Connected horizontal flow */}
          <div className="hidden sm:grid sm:grid-cols-4 gap-3 relative">
            {steps.map((st, i) => (
              <div 
                key={i} 
                className="relative flex flex-col items-center text-center p-4 rounded-m3-xl bg-m3-surface border border-m3-outline-variant shadow-m3-1"
              >
                <div className="w-8 h-8 rounded-m3-full bg-m3-primary text-m3-on-primary font-black text-xs flex items-center justify-center mb-2 shadow-m3-1">
                  {st.step}
                </div>
                <h3 className="text-xs font-bold text-m3-on-surface font-heading leading-tight mb-1">
                  {st.title}
                </h3>
                <p className="text-badge text-m3-on-surface-variant leading-snug">
                  {st.desc}
                </p>

                {/* Arrow connector between steps */}
                {i < steps.length - 1 && (
                  <div className="hidden sm:flex absolute -right-3.5 top-6 z-10 w-6 h-6 rounded-m3-full bg-m3-surface-container border border-m3-outline-variant items-center justify-center text-m3-primary shadow-m3-1">
                    <ArrowRight className="w-3 h-3" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Mobile: 2x2 Connected Flowchart with Directional Flow Indicators */}
          <div className="grid grid-cols-2 sm:hidden gap-2.5 relative">
            {steps.map((st, i) => (
              <div 
                key={i} 
                className="relative p-3.5 rounded-m3-xl bg-m3-surface border border-m3-outline-variant shadow-m3-1 flex flex-col items-start"
              >
                <div className="flex items-center justify-between w-full mb-1.5">
                  <span className="w-6 h-6 rounded-m3-full bg-m3-primary text-m3-on-primary font-black text-micro flex items-center justify-center">
                    {st.step}
                  </span>
                  {i === 0 && <span className="text-micro text-m3-primary font-bold flex items-center gap-0.5">Step 1 <ArrowRight className="w-2.5 h-2.5" /></span>}
                  {i === 1 && <span className="text-micro text-m3-primary font-bold flex items-center gap-0.5">Step 2 <ArrowRight className="w-2.5 h-2.5 rotate-90" /></span>}
                  {i === 2 && <span className="text-micro text-m3-primary font-bold flex items-center gap-0.5">Step 3 <ArrowRight className="w-2.5 h-2.5" /></span>}
                  {i === 3 && <span className="text-micro text-m3-primary font-bold flex items-center gap-0.5">Done ✓</span>}
                </div>
                <h3 className="text-xs font-bold text-m3-on-surface font-heading leading-tight mb-0.5">
                  {st.title}
                </h3>
                <p className="text-micro text-m3-on-surface-variant leading-snug">
                  {st.desc}
                </p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 4. TOP FAQS (Clean M3 Accordion) */}
      <section className="py-10 md:py-14 bg-m3-surface-container-low border-t border-m3-outline-variant/60">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-m3-full bg-m3-surface-container-high border border-m3-outline-variant text-m3-on-surface text-xs font-semibold shadow-m3-1 mb-3.5 tracking-wide">
              <span className="w-2 h-2 rounded-full bg-m3-primary"></span>
              <span>Driver Help Desk</span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-m3-on-surface tracking-tight leading-tight mb-2.5 font-heading">
              Frequently Asked <span className="text-m3-primary">Questions</span>
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-m3-on-surface-variant max-w-2xl mx-auto font-normal leading-relaxed mb-6 font-sans">
              Instant answers to common booking &amp; driver queries.
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

      {/* 5. BOTTOM CONVERSION CTA BANNER */}
      <section className="bg-m3-inverse-surface text-m3-inverse-on-surface py-10 md:py-12 border-t border-m3-outline-variant/20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight leading-tight mb-2.5 font-heading text-white">
            Need an Acting Driver <span className="text-white">Today?</span>
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm md:text-base mb-6 max-w-lg mx-auto font-normal leading-relaxed font-sans">
            Book in 60 seconds on WhatsApp. Share your car model and pickup location to receive your verified chauffeur profile promptly.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <WhatsAppButton
              href="https://wa.me/919092303060?text=Hi%20Kalidass%20Travels,%20I%20would%20like%20to%20book%20an%20Acting%20Driver."
              size="lg"
              variant="filled"
              text="Chat on WhatsApp (+91 63819 39769)"
            />
            <a
              href="tel:+919092303060"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-m3-surface hover:bg-m3-surface-container text-m3-on-surface px-6 py-3.5 rounded-m3-full font-semibold text-xs sm:text-sm shadow-m3-1 transition-all"
            >
              <Phone className="w-4 h-4 text-m3-primary" />
              <span>Call Direct Dispatch</span>
            </a>
          </div>
        </div>
      </section>



    </div>
  );
}
