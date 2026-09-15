import React, { useState } from 'react';
import WhatsAppButton from './react/WhatsAppButton.jsx';
import { 
  Sparkles, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  Phone, 
  MessageCircle, 
  CheckCircle2, 
  HelpCircle, 
  ChevronRight, 
  ChevronDown,
  ArrowRight,
  Sun,
  Flame,
  Waves,
  Landmark,
  Compass
} from 'lucide-react';

export default function TempleTours() {
  const [activeDuration, setActiveDuration] = useState('all');
  const [showAllCards, setShowAllCards] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  const tourMatrix = [
    {
      id: 'tirupati',
      type: '1day',
      name: 'Tirupati Balaji Darshan',
      duration: '1 Day (320 km)',
      sedan: '₹6,000',
      ertiga: '₹7,500',
      innova: '₹8,500',
      crysta: '₹10,000',
      tempo: '₹12,500',
      highlights: 'Doorstep 4 AM pickup • AP Permit, Tolls, Alipiri check & Bata included',
      slug: 'tirupati-package',
      badge: 'Most Popular',
      whatsapp: 'https://wa.me/919092303060?text=Hi%20Kalidass%20Travels,%20I%20want%20to%20book%20the%20Chennai%20to%20Tirupati%20Balaji%20Car%20Package.'
    },
    {
      id: 'navagraha',
      type: 'multiday',
      name: 'Kumbakonam 9 Navagraha Tour',
      duration: '2 Days / 1 Night (750 km)',
      sedan: '₹8,600',
      ertiga: '₹10,600',
      innova: '₹13,100',
      crysta: '₹15,500',
      tempo: '₹18,500',
      highlights: 'All 9 planetary temples sequenced without backtracking • 2 Days Bata & Tolls',
      slug: 'navagraha-tour',
      badge: 'Complete 9 Temples',
      whatsapp: 'https://wa.me/919092303060?text=Hi%20Kalidass%20Travels,%20I%20want%20to%20book%20the%20Kumbakonam%20Navagraha%202-Day%20Tour.'
    },
    {
      id: 'thiruvannamalai',
      type: '1day',
      name: 'Thiruvannamalai Girivalam',
      duration: '1 Day / Pournami Night (400 km)',
      sedan: '₹6,500',
      ertiga: '₹7,900',
      innova: '₹9,300',
      crysta: '₹11,100',
      tempo: '₹13,500',
      highlights: 'Arunachaleswarar Darshan + 14 km Pournami Girivalam AC car standby',
      slug: 'thiruvannamalai-girivalam-trip',
      badge: 'Pournami Special',
      whatsapp: 'https://wa.me/919092303060?text=Hi%20Kalidass%20Travels,%20I%20want%20to%20book%20the%20Thiruvannamalai%20Girivalam%20Tour.'
    },
    {
      id: 'sabarimala',
      type: 'multiday',
      name: 'Sabarimala Yatra (Pamba / Nilakkal)',
      duration: '3 Days / 2 Nights (1,350 km)',
      sedan: '₹15,900',
      ertiga: '₹18,900',
      innova: '₹23,300',
      crysta: '₹27,600',
      tempo: '₹34,800',
      highlights: 'Satvik teetotaler driver • Kerala State Permit • 3 Days Bata included',
      slug: 'sabarimala-trip',
      badge: 'Mandala / Makaravilakku',
      whatsapp: 'https://wa.me/919092303060?text=Hi%20Kalidass%20Travels,%20I%20want%20to%20book%20the%20Sabarimala%20Yatra%203-Day%20Package.'
    },
    {
      id: 'rameswaram',
      type: 'multiday',
      name: 'Rameswaram & Dhanushkodi',
      duration: '2 Days / 1 Night (1,200 km)',
      sedan: '₹15,500',
      ertiga: '₹18,400',
      innova: '₹22,600',
      crysta: '₹26,700',
      tempo: '₹32,200',
      highlights: '22 Theertham baths, Pamban bridge, Ram Setu / Arichal Munai & APJ Memorial',
      slug: 'rameswaram-2-days',
      badge: 'Char Dham Sthalam',
      whatsapp: 'https://wa.me/919092303060?text=Hi%20Kalidass%20Travels,%20I%20want%20to%20book%20the%20Rameswaram%202-Day%20Pilgrimage%20Package.'
    },
    {
      id: 'kanchipuram',
      type: '1day',
      name: 'Kanchipuram Temple & Silk City',
      duration: '1 Day (150 km)',
      sedan: '₹3,200',
      ertiga: '₹4,500',
      innova: '₹5,500',
      crysta: '₹6,500',
      tempo: '₹8,000',
      highlights: 'Kamakshi Amman, Ekambareswarar, Varadharaja Perumal & Silk Saree weavers',
      slug: 'kanchipuram-temple-trip',
      badge: 'Divya Desam & Heritage',
      whatsapp: 'https://wa.me/919092303060?text=Hi%20Kalidass%20Travels,%20I%20want%20to%20book%20the%20Kanchipuram%20Temple%20Day%20Trip.'
    },
    {
      id: 'chidambaram',
      type: '1day',
      name: 'Chidambaram Natarajar & Pichavaram',
      duration: '1 Day (450 km)',
      sedan: '₹7,400',
      ertiga: '₹9,000',
      innova: '₹10,500',
      crysta: '₹12,500',
      tempo: '₹15,000',
      highlights: 'Akasha Lingam Spatika puja + Mangrove Forest boat ride + Tolls',
      slug: 'chidambaram-temple-trip',
      badge: 'Pancha Bhoota Sthalam',
      whatsapp: 'https://wa.me/919092303060?text=Hi%20Kalidass%20Travels,%20I%20want%20to%20book%20the%20Chidambaram%20&%20Pichavaram%20Tour.'
    },
    {
      id: 'vellore',
      type: '1day',
      name: 'Vellore Sripuram Golden Temple',
      duration: '1 Day (300 km)',
      sedan: '₹4,200',
      ertiga: '₹5,200',
      innova: '₹6,200',
      crysta: '₹7,200',
      tempo: '₹9,000',
      highlights: '1,500 kg Gold temple, Jalakandeswarar Fort temple + Tolls included',
      slug: 'vellore-golden-temple',
      badge: 'Golden Temple',
      whatsapp: 'https://wa.me/919092303060?text=Hi%20Kalidass%20Travels,%20I%20want%20to%20book%20the%20Vellore%20Golden%20Temple%20Trip.'
    }
  ];

  const filteredTours = activeDuration === 'all'
    ? tourMatrix
    : tourMatrix.filter(item => item.type === activeDuration);

  const pilgrimageCards = [
    {
      title: 'Tirupati Balaji Darshan',
      duration: '1 Day / 2 Days',
      badge: 'Starts ₹6,000 (All-Inclusive)',
      slug: 'tirupati-package',
      icon: Sun,
      desc: 'Complete doorstep round trip with Andhra permit, Alipiri checkpost clearance, and visit to Padmavathi Ammavari Temple (Tiruchanur).',
      highlights: ['Doorstep 4 AM pickup across Chennai', 'AP Interstate Permit & Alipiri Toll included', 'Kalyana Katta tonsure guidance']
    },
    {
      title: 'Kumbakonam 9 Navagraha Tour',
      duration: '2 Days / 1 Night',
      badge: 'Starts ₹8,600 (750 km)',
      slug: 'navagraha-tour',
      icon: Compass,
      desc: 'Expertly sequenced 9-temple pilgrimage covering Suryanar, Thirunallar, Vaitheeswaran, and Alangudi without afternoon gate closures.',
      highlights: ['Astronomical 9-temple sequence', 'Satvik food halts in Kumbakonam', '2 Days driver bata included']
    },
    {
      title: 'Thiruvannamalai Girivalam',
      duration: '1 Day / Night Trip',
      badge: 'Starts ₹6,500 (400 km)',
      slug: 'thiruvannamalai-girivalam-trip',
      icon: Flame,
      desc: 'Agni Sthalam Arunachaleswarar darshan and 14 km Pournami Girivalam with AC vehicle standby for elderly family members.',
      highlights: ['Arunachaleswarar & Ramana Ashram', 'Experienced night highway pilots', 'AC car standby on 14 km route']
    },
    {
      title: 'Sabarimala Yatra (Pamba)',
      duration: '3 Days / 2 Nights',
      badge: 'Starts ₹15,900 (1,350 km)',
      slug: 'sabarimala-trip',
      icon: Landmark,
      desc: 'Devotional 3D/2N pilgrimage with teetotaler drivers, devotional audio, Kerala Interstate Road Tax Permit, and pure-veg food halts.',
      highlights: ['Satvik non-smoking driver', 'Kerala State Permit included', 'Kumily-Nilakkal hill driving specialist']
    },
    {
      title: 'Rameswaram & Dhanushkodi',
      duration: '2 Days / 1 Night',
      badge: 'Starts ₹15,500 (1,200 km)',
      slug: 'rameswaram-2-days',
      icon: Waves,
      desc: 'Char Dham holy island pilgrimage featuring 22 Theertham baths, Pamban bridge drive, Dhanushkodi ghost town, and APJ Memorial.',
      highlights: ['22 Theertham bath coordination', 'Dhanushkodi / Ram Setu drive', 'All national tolls & 2D bata included']
    },
    {
      title: 'Kanchipuram Temple & Silk Tour',
      duration: '1 Day (150 km)',
      badge: 'Starts ₹3,200',
      slug: 'kanchipuram-temple-trip',
      icon: Sparkles,
      desc: 'Kamakshi Amman Shakti Peetham, Ekambareswarar Earth Lingam, and Varadharaja Perumal combined with authentic silk saree shopping.',
      highlights: ['1-Day Divya Desam & Shiva circuit', 'Direct weaver cooperative visits', 'Senior citizen friendly pacing']
    },
    {
      title: 'Chidambaram & Pichavaram',
      duration: '1 Day (450 km)',
      badge: 'Starts ₹7,400',
      slug: 'chidambaram-temple-trip',
      icon: Landmark,
      desc: 'Thillai Natarajar Akasha Lingam Spatika puja combined with a peaceful boat ride through the Pichavaram Mangrove Forests.',
      highlights: ['Cosmic Dance Akasha Sthalam', 'Scenic ECR coastal drive', 'Pichavaram mangrove canals boat ride']
    },
    {
      title: 'Vellore Sripuram Golden Temple',
      duration: '1 Day (300 km)',
      badge: 'Starts ₹4,200',
      slug: 'vellore-golden-temple',
      icon: Sparkles,
      desc: 'Magnificent 1,500 kg pure gold temple darshan combined with the historic 16th-century granite Vellore Fort and Jalakandeswarar temple.',
      highlights: ['Star-shaped spiritual park', 'Historic Vellore Fort temple', 'Bangalore expressway FASTag tolls included']
    }
  ];

  const faqs = [
    {
      q: 'Do your temple tour prices include interstate permits and highway tolls?',
      a: 'Yes! Our quoted temple tour packages (like Tirupati and Sabarimala) are 100% all-inclusive — vehicle, fuel, driver bata, interstate state road permits (Andhra/Kerala), and national highway FASTag tolls are covered with zero hidden extras.'
    },
    {
      q: 'How do your drivers manage the afternoon temple closure hours?',
      a: 'In Tamil Nadu, most temples close between 12:30 PM and 04:00 PM. Our route-master drivers plan departure times and sequence stops astronomically (e.g. visiting 4 temples in the morning and 5 in the evening for Navagraha) so you never arrive at closed gates.'
    },
    {
      q: 'Can senior citizens travel comfortably in your Innova / Tempo Travellers?',
      a: 'Yes! All vehicles are air-conditioned, sanitized, and equipped with footstep aids. Our drivers drop elderly devotees right at the temple gopuram arch before parking and provide walking/wheelchair assistance.'
    },
    {
      q: 'What is the dress code for South Indian temple darshans?',
      a: 'Traditional attire is mandatory. Men must wear Dhoti with shirt/angavastram or Kurta Pyjama (jeans and t-shirts are not allowed). Women must wear Sarees, Half-sarees, or Chudidhar with Dupatta neatly pinned.'
    }
  ];

  return (
    <div className="font-sans text-m3-on-surface bg-m3-surface-container-low min-h-screen">
      
      {/* 1. HERO SECTION (Unified M3 Light Theme) */}
      <section className="bg-m3-surface pt-8 pb-10 md:pt-14 md:pb-14 border-b border-m3-outline-variant/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-m3-full bg-m3-surface border border-m3-outline-variant text-m3-on-surface text-xs font-semibold shadow-m3-1 mb-3.5 tracking-wide">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Sacred Pilgrimages • Satvik Etiquette • Senior-Friendly Comfort</span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-m3-on-surface tracking-tight mb-3 leading-tight font-heading">
            Temple Tour Packages <br className="hidden sm:inline" />
            <span className="text-m3-primary">Curated with Devotion &amp; Care</span>
          </h1>
          
          <p className="text-xs sm:text-sm md:text-base text-m3-on-surface-variant mb-6 max-w-2xl mx-auto leading-relaxed font-normal font-sans">
            From same-day Tirupati VIP darshans and complete 9 Navagraha circuits to sacred Sabarimala yatras — travel in pristine AC comfort with drivers who understand temple timings, pooja schedules, and satvik food corridors.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a 
              href="#tour-matrix"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-m3-full bg-m3-primary hover:bg-slate-900 text-m3-on-primary font-bold text-xs sm:text-sm shadow-m3-2 transition-all transform hover:-translate-y-0.5 border border-white/20 group"
            >
              <span>Explore Tour Circuits &amp; Rates</span>
              <ChevronDown className="w-4 h-4 text-emerald-400 transform group-hover:translate-y-0.5 transition-transform" />
            </a>
            <a 
              href="tel:+919092303060"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-m3-full bg-m3-surface hover:bg-m3-surface-container text-m3-on-surface border border-m3-outline-variant font-semibold text-xs sm:text-sm shadow-m3-1 transition-all"
            >
              <Phone className="w-4 h-4 text-emerald-500" />
              <span>Helpline: +91 90923 03060</span>
            </a>
          </div>

        </div>
      </section>

      {/* 2. ⚡ MASTER "ALL TEMPLE TOURS AT A GLANCE" COMPARISON MATRIX */}
      <section id="tour-matrix" className="py-8 md:py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-m3-surface rounded-m3-2xl shadow-m3-1 border border-m3-outline-variant overflow-hidden">
          
          <div className="p-5 md:p-6 bg-m3-surface-container text-m3-on-surface flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-m3-outline-variant/60">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-m3-full bg-m3-primary-container text-m3-on-primary-container text-xs font-bold uppercase tracking-wider mb-2 border border-m3-primary/20">
                <Sparkles className="w-3.5 h-3.5" /> All-Inclusive Flat Rates
              </div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight font-heading text-m3-on-surface">
                All Temple Tour Rates <span className="text-m3-primary">at a Glance</span>
              </h2>
              <p className="text-m3-on-surface-variant text-xs sm:text-sm md:text-base mt-1 font-sans leading-relaxed">
                Zero hidden surprises. Includes AC vehicle, fuel, driver bata, state road permits &amp; national highway tolls.
              </p>
            </div>

            {/* Duration Filter Tabs (Segmented Buttons) */}
            <div className="flex flex-wrap gap-1.5 bg-m3-surface-container-high p-1.5 rounded-m3-full border border-m3-outline-variant/60 self-start md:self-auto">
              {[
                { id: 'all', label: 'All Packages' },
                { id: '1day', label: '1-Day Trips' },
                { id: 'multiday', label: 'Multi-Day Circuits' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveDuration(tab.id)}
                  className={`px-3.5 py-1.5 rounded-m3-full text-xs font-bold transition-all ${
                    activeDuration === tab.id 
                      ? 'bg-m3-primary text-m3-on-primary shadow-m3-1 font-bold' 
                      : 'text-m3-on-surface-variant hover:text-m3-on-surface hover:bg-m3-surface/60'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Desktop Master Comparative Table (>= md screens) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm font-sans">
              <thead className="bg-m3-surface-container-low text-m3-on-surface-variant text-xs font-bold uppercase tracking-wider border-b border-m3-outline-variant/60">
                <tr>
                  <th className="px-5 py-4 sticky left-0 z-10 bg-m3-surface-container-low">Pilgrimage Circuit</th>
                  <th className="px-4 py-4">Duration</th>
                  <th className="px-4 py-4">Sedan</th>
                  <th className="px-4 py-4">Ertiga</th>
                  <th className="px-4 py-4">Innova</th>
                  <th className="px-4 py-4">Crysta</th>
                  <th className="px-4 py-4">Tempo</th>
                  <th className="px-5 py-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-m3-outline-variant/40">
                {filteredTours.map((row, idx) => (
                  <tr 
                    key={row.id} 
                    className={`hover:bg-m3-surface-container-low transition-colors ${idx % 2 === 0 ? 'bg-m3-surface' : 'bg-m3-surface-container-lowest/40'}`}
                  >
                    <td className="px-5 py-4 sticky left-0 z-10 bg-inherit">
                      <div className="font-bold text-m3-on-surface text-base">{row.name}</div>
                      <span className="inline-block mt-0.5 text-badge font-semibold text-m3-on-surface-variant bg-m3-surface-container px-2.5 py-0.5 rounded-m3-full border border-m3-outline-variant">
                        {row.badge}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-m3-on-surface-variant text-xs font-medium whitespace-nowrap">
                      {row.duration}
                    </td>
                    <td className="px-4 py-4 font-bold text-m3-on-surface">{row.sedan}</td>
                    <td className="px-4 py-4 font-bold text-m3-on-surface">{row.ertiga}</td>
                    <td className="px-4 py-4 font-bold text-m3-on-surface">{row.innova}</td>
                    <td className="px-4 py-4 font-bold text-m3-on-surface">{row.crysta}</td>
                    <td className="px-4 py-4 font-bold text-m3-on-surface">{row.tempo}</td>
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <a
                        href={`/services/${row.slug}/`}
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-m3-surface-container hover:bg-m3-primary hover:text-white text-m3-on-surface border border-m3-outline-variant rounded-m3-full text-xs font-bold transition-all group"
                      >
                        <span>Itinerary</span>
                        <ChevronRight className="w-3.5 h-3.5 text-m3-primary group-hover:text-white transform group-hover:translate-x-0.5 transition-transform" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile-Friendly Rate Cards (< md screens) */}
          <div className="block md:hidden divide-y divide-m3-outline-variant/40">
            {filteredTours.map((row) => (
              <div key={row.id} className="p-4 bg-m3-surface hover:bg-m3-surface-container-low transition-colors">
                <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-[150px]">
                    <div className="font-bold text-m3-on-surface text-sm">{row.name}</div>
                    <div className="text-badge text-m3-on-surface-variant font-medium">{row.duration}</div>
                  </div>
                  <span className="text-micro font-semibold text-m3-on-primary-container bg-m3-primary-container px-2 py-0.5 rounded-m3-full border border-m3-primary/20 self-start">
                    {row.badge}
                  </span>
                </div>
                
                {/* 2x3 Vehicle Pricing Grid */}
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
                    <span>View Detailed Itinerary &amp; Guide</span>
                    <ChevronRight className="w-3.5 h-3.5 text-m3-primary" />
                  </a>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-m3-surface-container border-t border-m3-outline-variant/60 text-xs text-m3-on-surface-variant flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span>* Quoted fares include car, fuel, driver bata, state permits & national tolls. Devotee darshan tickets & food are excluded.</span>
            <span className="text-m3-on-surface font-semibold">100% Satvik dining halts • Doorstep Chennai pickup</span>
          </div>

        </div>
      </section>

      {/* 3. THE 8 PILGRIMAGE CARDS */}
      <section className="py-10 md:py-14 bg-m3-surface-container-low border-t border-m3-outline-variant/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-m3-full bg-m3-surface border border-m3-outline-variant text-m3-on-surface text-xs font-semibold shadow-m3-1 mb-3.5 tracking-wide">
              <span className="w-2 h-2 rounded-full bg-m3-primary"></span>
              <span>Sacred Circuits</span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-m3-on-surface tracking-tight leading-tight mb-2.5 font-heading">
              Explore Holy <span className="text-m3-primary">Pilgrimage Packages</span>
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-m3-on-surface-variant max-w-2xl mx-auto leading-relaxed mb-6 font-normal font-sans">
              Click any package below for step-by-step route timelines, darshan timings, dress codes, and booking tips.
            </p>
          </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {(showAllCards ? pilgrimageCards : pilgrimageCards.slice(0, 4)).map((srv, i) => {
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
                    <div className="text-right">
                      <span className="block px-2.5 py-0.5 bg-m3-surface-container text-m3-on-surface border border-m3-outline-variant rounded-m3-full text-badge font-bold">
                        {srv.duration}
                      </span>
                      <span className="block text-xs font-bold text-m3-on-surface mt-0.5">
                        {srv.badge}
                      </span>
                    </div>
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
                  <span>View Detailed Itinerary & Guide</span>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </a>
            );
          })}
          </div>

          {!showAllCards && pilgrimageCards.length > 4 && (
            <div className="text-center mt-6">
              <button
                type="button"
                onClick={() => setShowAllCards(true)}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-m3-full bg-m3-surface border border-m3-outline text-m3-on-surface text-xs sm:text-sm font-bold shadow-m3-1 hover:bg-m3-surface-container transition-all cursor-pointer"
              >
                <span>View All {pilgrimageCards.length} Pilgrimage Packages</span>
                <ChevronRight className="w-4 h-4 text-m3-on-surface-variant" />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 4. THE 4 COMMITMENTS OF KALIDASS PILGRIMAGES (Clean M3 Light Surface) */}
      <section className="py-10 md:py-14 bg-m3-surface border-t border-m3-outline-variant/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-m3-full bg-m3-surface-container border border-m3-outline-variant text-m3-on-surface text-xs font-semibold shadow-m3-1 mb-3.5 tracking-wide">
              <span className="w-2 h-2 rounded-full bg-m3-secondary"></span>
              <span>Devotional Standards</span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-m3-on-surface tracking-tight leading-tight mb-2.5 font-heading">
              The Kalidass <span className="text-m3-primary">Pilgrimage Difference</span>
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-m3-on-surface-variant max-w-2xl mx-auto leading-relaxed mb-6 font-normal font-sans">
              Why thousands of families and devotees across Chennai trust us for their sacred tours.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            <div className="bg-m3-surface rounded-m3-xl p-4 sm:p-5 border border-m3-outline-variant shadow-m3-1 flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-m3-lg bg-m3-surface-container text-m3-primary flex items-center justify-center mb-3">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-m3-primary" />
                </div>
                <h3 className="text-xs sm:text-base font-bold text-m3-on-surface mb-1 font-heading">Temple Timing Mastery</h3>
                <p className="text-m3-on-surface-variant text-badge sm:text-xs leading-relaxed">
                  South Indian temples close between 12:30 PM and 4 PM. We sequence every stop so you never face locked gates.
                </p>
              </div>
            </div>

            <div className="bg-m3-surface rounded-m3-xl p-4 sm:p-5 border border-m3-outline-variant shadow-m3-1 flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-m3-lg bg-m3-surface-container text-m3-primary flex items-center justify-center mb-3">
                  <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-m3-primary" />
                </div>
                <h3 className="text-xs sm:text-base font-bold text-m3-on-surface mb-1 font-heading">Satvik Dining Halts</h3>
                <p className="text-m3-on-surface-variant text-badge sm:text-xs leading-relaxed">
                  Stops exclusively at verified pure-vegetarian restaurants with clean, accessible restrooms for families and elders.
                </p>
              </div>
            </div>

            <div className="bg-m3-surface rounded-m3-xl p-4 sm:p-5 border border-m3-outline-variant shadow-m3-1 flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-m3-lg bg-m3-surface-container text-m3-primary flex items-center justify-center mb-3">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-m3-primary" />
                </div>
                <h3 className="text-xs sm:text-base font-bold text-m3-on-surface mb-1 font-heading">Senior-Friendly Care</h3>
                <p className="text-m3-on-surface-variant text-badge sm:text-xs leading-relaxed">
                  Step-stools for easy car boarding, gopuram arch drop-offs before parking, and patient pacing for elderly parents.
                </p>
              </div>
            </div>

            <div className="bg-m3-surface rounded-m3-xl p-4 sm:p-5 border border-m3-outline-variant shadow-m3-1 flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-m3-lg bg-m3-surface-container text-m3-primary flex items-center justify-center mb-3">
                  <Landmark className="w-4 h-4 sm:w-5 sm:h-5 text-m3-primary" />
                </div>
                <h3 className="text-xs sm:text-base font-bold text-m3-on-surface mb-1 font-heading">Devotional Atmosphere</h3>
                <p className="text-m3-on-surface-variant text-badge sm:text-xs leading-relaxed">
                  Clean, sanitized cabins equipped with devotional chants, suprabhatams, and strictly non-smoking, teetotaler drivers.
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
              <span>Pilgrimage FAQ</span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-m3-on-surface tracking-tight leading-tight mb-2.5 font-heading">
              Temple Tour <span className="text-m3-primary">Frequently Asked Questions</span>
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-m3-on-surface-variant max-w-2xl mx-auto font-normal leading-relaxed mb-6 font-sans">
              Clear answers to help you plan your sacred pilgrimage.
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
            Ready to Plan Your <span className="text-white">Sacred Pilgrimage?</span>
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm md:text-base mb-6 max-w-xl mx-auto font-normal leading-relaxed font-sans">
            Book your vehicle in 60 seconds on WhatsApp. Share your preferred temple circuit, dates, and family passenger count for instant confirmation.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <WhatsAppButton
              href="https://wa.me/919092303060?text=Hi%20Kalidass%20Travels,%20I%20want%20to%20book%20a%20Temple%20Tour%20Package."
              size="lg"
              variant="filled"
              text="Chat on WhatsApp (+91 90923 03060)"
            />
            <a
              href="tel:+919092303060"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-m3-surface hover:bg-m3-surface-container text-m3-on-surface px-6 py-3.5 rounded-m3-full font-semibold text-xs sm:text-sm shadow-m3-1 transition-all"
            >
              <Phone className="w-4 h-4 text-emerald-500" />
              <span>Call Pilgrimage Desk</span>
            </a>
          </div>
        </div>
      </section>

    </div>
  );
}
