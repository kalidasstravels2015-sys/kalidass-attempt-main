import React, { useRef, useState, useEffect } from 'react';
import siteContent from '../../data/siteContent.json';

const FleetCard = ({ vehicle, isVisible, priority }) => {
    return (
        <div className="flex-shrink-0 w-72 snap-center md:w-auto md:snap-align-none transition-opacity duration-500 opacity-100 h-full">
            <div className="bg-m3-surface rounded-m3-xl overflow-hidden shadow-m3-1 hover:shadow-m3-3 border border-m3-outline-variant transition-all duration-300 transform hover:-translate-y-1 h-full flex flex-col justify-between">
                <div>
                    {/* Vehicle Image Container */}
                    <div className="relative h-36 sm:h-40 overflow-hidden bg-m3-surface-container-high skeleton-shimmer">
                        {isVisible && (
                            <>
                                <img
                                    src={vehicle.image}
                                    alt={`${vehicle.name} taxi rental in Chennai - Kalidass Travels`}
                                    width="384"
                                    height="160"
                                    decoding="async"
                                    className="w-full h-full object-cover transition-all duration-700 hover:scale-105 relative z-10"
                                    loading={priority ? "eager" : "lazy"}
                                    fetchPriority={priority ? "high" : "auto"}
                                />
                                {/* Scrim Gradient Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-transparent z-20"></div>

                                {/* Tonal Badges */}
                                {vehicle.details.some(d => d.toLowerCase().includes('sanitized')) && (
                                    <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-30">
                                        <span className="bg-slate-950/80 backdrop-blur-md border border-white/20 text-white/90 text-micro font-bold px-2.5 py-0.5 rounded-m3-full shadow-sm flex items-center gap-1 w-fit">
                                            <span className="material-symbols-outlined text-[14px] text-emerald-400">verified</span>
                                            Sanitized AC
                                        </span>
                                    </div>
                                )}

                                <div className="absolute bottom-3 left-3.5 z-30">
                                    <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight font-heading">
                                        {vehicle.name}
                                    </h3>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Content */}
                    <div className="p-4 sm:p-5 space-y-4">
                        {/* Key Stats */}
                        <div className="grid grid-cols-2 gap-2">
                            <div className="bg-m3-surface-container-low p-2.5 rounded-m3-md border border-m3-outline-variant text-center">
                                <p className="text-micro font-semibold text-m3-on-surface-variant uppercase tracking-wider mb-0.5">Starting From</p>
                                <p className="text-base sm:text-lg font-black text-m3-on-surface leading-none">{vehicle.rate}</p>
                            </div>
                            <div className="bg-m3-surface-container-low p-2.5 rounded-m3-md border border-m3-outline-variant text-center">
                                <p className="text-micro font-semibold text-m3-on-surface-variant uppercase tracking-wider mb-0.5">Capacity</p>
                                <div className="flex items-center justify-center gap-1">
                                    <span className="material-symbols-outlined text-[16px] text-m3-on-surface-variant">group</span>
                                    <p className="text-xs sm:text-sm font-bold text-m3-on-surface">{vehicle.caps}</p>
                                </div>
                            </div>
                        </div>

                        {/* Features List */}
                        <div className="space-y-2">
                            {vehicle.details.filter(f => !f.toLowerCase().includes('sanitized')).map((feature, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[16px] text-emerald-600 shrink-0">check_circle</span>
                                    <span className="text-xs text-m3-on-surface-variant font-normal leading-tight">{feature}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Action Button */}
                <div className="p-4 sm:p-5 pt-0">
                    <a
                        href="/tariff/"
                        className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-m3-full bg-m3-primary hover:bg-slate-900 text-white text-m3-label-m font-semibold shadow-m3-1 hover:shadow-m3-2 transition-all border border-white/10 group"
                    >
                        <span>View Rates &amp; Tariff</span>
                        <span className="material-symbols-outlined text-[16px] text-emerald-400 transform group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </a>
                </div>
            </div>
        </div>
    );
};

/**
 * @param {{ currentLang?: string, hideHeader?: boolean, limit?: number }} props
 */
const FleetRoll = ({ currentLang = 'en', hideHeader = false, limit }) => {
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
        <section id="fleet" className={`${hideHeader ? 'py-4' : 'py-10 md:py-14 bg-m3-surface border-t border-m3-outline-variant/60'}`} ref={containerRef} aria-labelledby={hideHeader ? undefined : "fleet-heading"}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                {!hideHeader && (
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
                                <span>Explore All 8+ Vehicles &amp; Full Tariff</span>
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
