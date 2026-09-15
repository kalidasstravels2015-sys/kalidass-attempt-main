import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  Layers, 
  Car, 
  Compass, 
  Building2, 
  ShieldCheck, 
  HelpCircle, 
  UserCheck, 
  Star,
  ChevronUp 
} from 'lucide-react';

const SECTIONS = [
  { id: 'booking-panel', label: 'Fare Calculator', icon: Calculator, num: '01' },
  { id: 'services', label: 'Core Services', icon: Layers, num: '02' },
  { id: 'fleet', label: 'Fleet & Rates', icon: Car, num: '03' },
  { id: 'tours', label: 'Temple Trips', icon: Compass, num: '04' },
  { id: 'partners', label: 'Corporate Clients', icon: Building2, num: '05' },
  { id: 'drivers', label: 'Verified Drivers', icon: UserCheck, num: '06' },
  { id: 'reviews', label: 'Client Reviews', icon: Star, num: '07' },
  { id: 'safety', label: 'Travel Safety', icon: ShieldCheck, num: '08' },
  { id: 'faq', label: 'FAQ', icon: HelpCircle, num: '09' },
];

export default function SectionNavigator() {
  const [activeSection, setActiveSection] = useState('booking-panel');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Synchronize scroll progress bar and active section header indicator
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = totalHeight > 0 ? (window.scrollY / totalHeight) * 100 : 0;
      
      // Update hairline progress bar in sticky header
      const progressLine = document.getElementById('scroll-progress-line');
      if (progressLine) {
        progressLine.style.width = `${progress}%`;
      }

      // Show desktop rail after 120px
      setIsVisible(window.scrollY > 120);

      // Calculate active section
      const scrollPosition = window.scrollY + window.innerHeight * 0.35;
      let currentSec = SECTIONS[0];
      
      for (let i = SECTIONS.length - 1; i >= 0; i--) {
        const element = document.getElementById(SECTIONS[i].id);
        if (element) {
          const top = element.offsetTop;
          if (scrollPosition >= top) {
            currentSec = SECTIONS[i];
            break;
          }
        }
      }

      setActiveSection(currentSec.id);

      // Update mobile header section chip if present
      const mobileSectionText = document.getElementById('mobile-section-text');
      if (mobileSectionText) {
        mobileSectionText.textContent = `${currentSec.num}/08 • ${currentSec.label}`;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activeIndex = SECTIONS.findIndex(s => s.id === activeSection);

  if (!isVisible) return null;

  return (
    /* ----------------- DESKTOP FLOATING SECTION RAIL (Large Screens Only) ----------------- */
    <aside 
      aria-label="Page Section Progress Navigation"
      className="fixed right-3.5 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col items-center bg-m3-surface/90 backdrop-blur-md px-2 py-3.5 rounded-m3-full border border-m3-outline-variant shadow-m3-2 transition-all duration-500 group/rail"
    >
      {/* Scroll To Top Button */}
      <button
        onClick={scrollToTop}
        title="Back to Top"
        aria-label="Scroll to top of page"
        className="w-6 h-6 rounded-m3-full flex items-center justify-center text-m3-on-surface-variant hover:text-m3-primary hover:bg-m3-primary-container/40 transition-colors mb-2 cursor-pointer"
      >
        <ChevronUp className="w-3.5 h-3.5" />
      </button>

      {/* Dots with Connected Progress Line Container */}
      <div className="relative flex flex-col items-center gap-3 py-1">
        {/* Background Track Line */}
        <div className="absolute top-1 bottom-1 w-0.5 bg-m3-outline-variant rounded-m3-full"></div>
        
        {/* Active Fill Line */}
        <div 
          className="absolute top-1 w-0.5 bg-m3-primary rounded-m3-full transition-all duration-150"
          style={{ 
            height: `${Math.min(100, (activeIndex / (SECTIONS.length - 1)) * 100)}%` 
          }}
        ></div>

        {/* Dots */}
        {SECTIONS.map((sec, index) => {
          const isActive = sec.id === activeSection;
          const isPassed = index <= activeIndex;
          const Icon = sec.icon;

          return (
            <div key={sec.id} className="relative group/dot flex items-center justify-center">
              <button
                onClick={() => scrollToSection(sec.id)}
                aria-label={`Jump to Section ${sec.num}: ${sec.label}`}
                className={`relative z-10 transition-all duration-300 rounded-m3-full flex items-center justify-center cursor-pointer ${
                  isActive 
                    ? 'w-4 h-4 bg-m3-primary ring-4 ring-m3-primary-container shadow-m3-1 scale-110' 
                    : isPassed
                      ? 'w-2.5 h-2.5 bg-m3-primary hover:scale-150'
                      : 'w-2.5 h-2.5 bg-m3-outline-variant hover:scale-150 hover:bg-m3-outline'
                }`}
              >
                <span className="sr-only">{sec.label}</span>
              </button>

              {/* Left Floating Tooltip */}
              <div className="absolute right-7 pointer-events-none opacity-0 group-hover/dot:opacity-100 -translate-x-2 group-hover/dot:translate-x-0 transition-all duration-200 flex items-center gap-2 px-3 py-1.5 rounded-m3-md bg-m3-inverse-surface/95 backdrop-blur-md text-m3-inverse-on-surface text-xs font-semibold whitespace-nowrap shadow-m3-3 border border-white/10">
                <span className="font-mono text-micro text-white font-bold">{sec.num}</span>
                <Icon className="w-3.5 h-3.5 text-slate-300" />
                <span>{sec.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Section Counter Badge */}
      <div className="mt-2 pt-2 border-t border-m3-outline-variant/60 flex flex-col items-center">
        <span className="text-micro font-mono font-bold text-m3-on-surface-variant">
          {activeIndex + 1}/{SECTIONS.length}
        </span>
      </div>
    </aside>
  );
}
