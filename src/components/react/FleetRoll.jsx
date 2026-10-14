import React, { useRef, useState, useEffect } from 'react';
import siteContent from '../../data/siteContent.json';
import { Users, Luggage, ChevronRight } from 'lucide-react';

const getBadge = (name) => {
    const v = (name || '').toLowerCase();
    if (v.includes('tempo') || v.includes('traveller')) return 'Group Coach';
    if (v.includes('crysta')) return 'Luxury MPV';
    if (v.includes('innova')) return 'Comfort MUV';
    if (v.includes('ertiga') || v.includes('xl6')) return 'Family Favorite';
    if (v.includes('etios')) return 'Comfort Sedan';
    if (v.includes('dzire')) return 'Best Value Sedan';
    if (v.includes('bolero')) return 'Rugged Hill SUV';
    if (v.includes('sumo')) return 'Spacious MUV';
    return 'Verified Fleet';
};

const formatSeats = (caps) => {
    if (!caps) return '4 Passengers';
    const match = caps.match(/\d+/);
    return match ? `${match[0]} Passengers` : '4 Passengers';
};

const FleetCard = ({ vehicle, isVisible, priority }) => {
    const badge = getBadge(vehicle.name);
    const seats = formatSeats(vehicle.caps);
    const baggage = vehicle.bags || '2 Bags';

    return (
        <div className="shrink-0 w-[240px] sm:w-[260px] md:w-auto snap-start bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between overflow-hidden group select-none">
            <div>
                {/* Vehicle Photo Showcase Container */}
                <div className="relative h-28 sm:h-32 bg-slate-50 flex items-center justify-center p-3 border-b border-slate-100">
                    {badge && (
                        <span className="absolute top-2.5 left-2.5 z-10 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/95 text-slate-700 border border-slate-200 shadow-2xs">
                            {badge}
                        </span>
                    )}
                    <img
                        src={vehicle.image}
                        alt={`${vehicle.name} taxi rental in Chennai - Kalidass Travels`}
                        width="160"
                        height="80"
                        loading="lazy"
                        decoding="async"
                        className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-300 drop-shadow-xs"
                    />
                </div>

                {/* Card Content */}
                <div className="p-3.5 sm:p-4">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 font-heading leading-tight truncate" title={vehicle.name}>
                        {vehicle.name}
                    </h3>

                    {/* Single-Line Specs */}
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1.5 font-medium whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 shrink-0">
                            <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{seats}</span>
                        </span>
                        <span className="text-slate-300 shrink-0">•</span>
                        <span className="inline-flex items-center gap-1 shrink-0">
                            <Luggage className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{baggage}</span>
                        </span>
                    </div>

                    {/* Rate Display */}
                    {vehicle.rate && (
                        <div className="mt-3 pt-3 border-t border-slate-100 flex items-baseline justify-between">
                            <div>
                                <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-400">
                                    Starting From
                                </span>
                                <span className="text-[11px] text-emerald-700 font-medium">Fixed Per-KM Rates</span>
                            </div>
                            <span className="text-base sm:text-lg font-extrabold text-slate-900 font-heading">
                                {vehicle.rate}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Action Button */}
            <div className="p-3.5 sm:p-4 pt-0">
                <a
                    href="/tariff/"
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-full bg-slate-900 hover:bg-m3-primary active:bg-black text-white text-xs font-bold transition-all cursor-pointer shadow-2xs group/btn"
                >
                    <span>View Rates & Tariff</span>
                    <ChevronRight className="w-3.5 h-3.5 transform group-hover/btn:translate-x-0.5 transition-transform" />
                </a>
            </div>
        </div>
    );
};

/**
 * @param {{ currentLang?: string, hideHeader?: boolean, limit?: number, sectionHeading?: string }} props
 */
const FleetRoll = ({ currentLang = 'en', hideHeader = false, limit, sectionHeading }) => {
    const rawFleet = siteContent.fleet;
    const fleet = limit ? rawFleet.slice(0, limit) : rawFleet;
    const [activeIndex, setActiveIndex] = useState(0);
    const containerRef = useRef(null);

    const labels = siteContent.ui_labels;
    const heading = labels.our_premium_fleet || "Our Premium Fleet";

    useEffect(() => {
        const handleScroll = () => {
            if (containerRef.current) {
                const { scrollLeft, offsetWidth } = containerRef.current;
                const index = Math.round(scrollLeft / (offsetWidth * 0.85));
                setActiveIndex(Math.min(index, fleet.length - 1));
            }
        };

        const container = containerRef.current;
        if (container) {
            container.addEventListener('scroll', handleScroll, { passive: true });
        }

        return () => {
            if (container) {
                container.removeEventListener('scroll', handleScroll);
            }
        };
    }, [fleet.length]);

    return (
        <section id="fleet" className={`${hideHeader ? 'py-4' : 'offscreen-defer py-10 md:py-14 bg-m3-surface border-t border-m3-outline-variant/60'} scroll-mt-24 sm:scroll-mt-28`} aria-labelledby="fleet-heading">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                {hideHeader ? (
                    <h2 id="fleet-heading" className="sr-only">
                        {sectionHeading || "Available Cabs and Commercial Vehicles"}
                    </h2>
                ) : (
                    <div className="text-center max-w-3xl mx-auto mb-8">
                        <h2 id="fleet-heading" className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-m3-on-surface tracking-tight leading-tight mb-2.5 font-heading">
                            {heading}
                        </h2>
                        <p className="text-xs sm:text-sm md:text-base text-m3-on-surface-variant font-normal max-w-2xl mx-auto leading-relaxed mb-6 font-sans">
                            Pristine, sanitized, and commercial-plated vehicles driven by background-verified chauffeurs. Fixed per-km rates.
                        </p>
                    </div>
                )}

                {/* Fleet Grid/Scroll Container */}
                <div className="relative">
                    <div
                        ref={containerRef}
                        className="flex overflow-x-auto snap-x snap-mandatory pb-4 space-x-4 px-2 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6 md:space-x-0 md:overflow-visible md:pb-0 scrollbar-hide focus:outline-none"
                        tabIndex={0}
                        role="region"
                        aria-label="Fleet Gallery"
                    >
                        {fleet.map((vehicle, index) => (
                            <FleetCard key={index} vehicle={vehicle} isVisible={true} priority={false} />
                        ))}
                    </div>

                    {/* Scroll Indicator Dots (Mobile Only) */}
                    <div className="flex justify-center mt-4 space-x-2 md:hidden" aria-hidden="true">
                        {fleet.map((_, index) => (
                            <div
                                key={index}
                                className={`h-1.5 rounded-m3-full transition-all duration-300 ${activeIndex === index ? 'bg-m3-primary w-5' : 'bg-m3-surface-container-highest w-1.5'}`}
                            ></div>
                        ))}
                    </div>

                    {/* View All Fleet Link Button (M3 Outlined Button) */}
                    {limit && (
                        <div className="text-center mt-8">
                            <a
                                href="/fleet/"
                                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-m3-full bg-m3-surface border border-m3-outline text-m3-on-surface text-m3-label-l font-bold hover:bg-m3-surface-container-high shadow-m3-1 transition-all"
                            >
                                <span>Explore All 8+ Vehicles & Full Tariff</span>
                                <span className="material-symbols-outlined text-[18px] text-m3-primary">arrow_forward</span>
                            </a>
                        </div>
                    )}
                </div>
            </div>
            <style>{`
        .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
      `}</style>
        </section>
    );
};

export default FleetRoll;
