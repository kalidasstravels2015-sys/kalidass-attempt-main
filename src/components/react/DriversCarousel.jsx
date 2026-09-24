import React, { useState } from 'react';
import siteContent from '../../data/siteContent.json';
import { Star, Clock, Languages, ArrowRight, Share2, CheckCircle2 } from "lucide-react";
import WhatsAppIcon from './WhatsAppIcon.jsx';

function toSlug(name) {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

// Compact Driver Card Component
const DriverCard = ({ driver }) => {
    const slug = toSlug(driver.name);
    const name = driver.name;

    const waShareText = encodeURIComponent(
        `*${name}* - ${driver.specialty}\n` +
        `⭐ ${driver.rating} Rating | ${driver.trips} Trips\n` +
        `✅ Police Verification Certified\n\n` +
        `Book via *Kalidass Travels* – kalidasstravels.in`
    );

    return (
        <div className="flex-none w-[300px] sm:w-auto snap-center bg-m3-surface rounded-m3-xl shadow-m3-1 hover:shadow-m3-2 border border-m3-outline-variant p-3 sm:p-3.5 transition-all duration-200 group flex gap-3 sm:gap-3.5 items-stretch">
            {/* Leading Media: 1:1 Square Thumbnail */}
            <div className="relative shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-m3-lg overflow-hidden bg-m3-surface-container-high self-start">
                <img
                    src={driver.image}
                    width="112"
                    height="112"
                    decoding="async"
                    className="w-full h-full object-cover object-center"
                    alt={`${name} - Verified Chauffeur at Kalidass Travels`}
                    loading="lazy"
                />
                <span className="absolute bottom-1 left-1 bg-slate-950/85 backdrop-blur-md text-white text-[9px] font-bold px-1.5 py-0.5 rounded-m3-full leading-none shadow-sm">
                    {driver.tag}
                </span>
            </div>

            {/* Content & Details */}
            <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                <div>
                    {/* Name & Rating Row */}
                    <div className="flex items-center justify-between gap-1.5 mb-1">
                        <h3 className="font-bold text-sm sm:text-base text-m3-on-surface truncate font-heading">
                            {name}
                        </h3>
                        <div className="inline-flex items-center gap-0.5 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-m3-full shrink-0">
                            <span className="material-symbols-outlined text-[13px] text-amber-500">star</span>
                            <span className="text-[11px] font-bold text-m3-on-surface leading-none">{driver.rating}</span>
                        </div>
                    </div>

                    {/* M3 Chips */}
                    <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-m3-xs text-[10px] font-bold text-emerald-800">
                            <span className="material-symbols-outlined text-[12px] text-emerald-600">verified</span>
                            PVC Verified
                        </span>
                        {driver.trips && (
                            <span className="inline-flex items-center px-1.5 py-0.5 bg-m3-surface-container-high rounded-m3-xs text-[10px] font-semibold text-m3-on-surface-variant">
                                {driver.trips} Trips
                            </span>
                        )}
                    </div>

                    {/* Driver Specs */}
                    <div className="text-[11px] text-m3-on-surface-variant space-y-0.5 mb-2">
                        <div className="flex items-center gap-1 truncate">
                            <span className="material-symbols-outlined text-[13px] text-m3-on-surface-variant/70 shrink-0">schedule</span>
                            <span className="truncate">{driver.experience}</span>
                        </div>
                        <div className="flex items-center gap-1 truncate">
                            <span className="material-symbols-outlined text-[13px] text-m3-on-surface-variant/70 shrink-0">translate</span>
                            <span className="truncate">{driver.languages}</span>
                        </div>
                    </div>
                </div>

                {/* Actions Row */}
                <div className="flex items-center justify-end pt-1 border-t border-m3-outline-variant/60">
                    <a
                        href={`https://wa.me/?text=${waShareText}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Share on WhatsApp"
                        className="flex items-center justify-center w-7 h-7 bg-[#25D366]/10 hover:bg-[#25D366] text-[#25D366] hover:text-white rounded-m3-full transition-all duration-200 shrink-0 shadow-sm hover:shadow-m3-1 focus-visible:ring-2 focus-visible:ring-[#25D366]"
                        aria-label={`Share ${name} on WhatsApp`}
                    >
                        <WhatsAppIcon variant="brand" className="w-3.5 h-3.5" />
                    </a>
                </div>
            </div>
        </div>
    );
};

const DriversCarousel = ({ currentLang }) => {
    const drivers = siteContent.drivers;
    const [visibleCount, setVisibleCount] = useState(3);

    const labels = siteContent.ui_labels;
    const heading = labels.our_professional_drivers || "Our Professional Drivers";

    const visibleDrivers = drivers.slice(0, visibleCount);
    const hasMore = visibleCount < drivers.length;

    const loadMore = () => {
        setVisibleCount(prev => Math.min(prev + 6, drivers.length));
    };

    return (
        <section id="drivers" className="py-10 md:py-14 bg-m3-surface-container-low border-t border-m3-outline-variant/60" aria-labelledby="drivers-heading">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="text-center max-w-3xl mx-auto mb-8">
                    <h2 id="drivers-heading" className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-m3-on-surface tracking-tight leading-tight mb-2.5 font-heading">
                        {heading}
                    </h2>
                    <p className="text-xs sm:text-sm md:text-base text-m3-on-surface-variant font-normal max-w-2xl mx-auto leading-relaxed mb-6 font-sans">
                        Police background-verified, experienced, and courteous drivers dedicated to your safety.
                    </p>
                </div>

                {/* Compact Grid */}
                <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 sm:gap-6 pb-4 scrollbar-hide sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:overflow-visible">
                    {visibleDrivers.map((driver, index) => (
                        <DriverCard key={index} driver={driver} />
                    ))}
                </div>

                {/* Load More Button */}
                {hasMore && (
                    <div className="text-center mt-8">
                        <button
                            onClick={loadMore}
                            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-m3-full bg-m3-surface border border-m3-outline text-m3-on-surface font-bold text-xs sm:text-sm hover:bg-m3-surface-container-high shadow-m3-1 transition-all cursor-pointer"
                        >
                            <span>Load More Drivers</span>
                            <ArrowRight className="w-4 h-4 text-m3-on-surface-variant" />
                        </button>
                    </div>
                )}
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

export default DriversCarousel;
