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
    const profileUrl = `https://kalidasstravels.in/drivers/${slug}/`;
    const name = driver.name;

    const waShareText = encodeURIComponent(
        `*${name}* - ${driver.specialty}\n` +
        `⭐ ${driver.rating} Rating | ${driver.trips} Trips\n` +
        `✅ Police Verification Certified\n\n` +
        `Book via *Kalidass Travels*\n` +
        `👉 ${profileUrl}`
    );

    return (
        <div className="flex-none w-64 sm:w-auto snap-center bg-m3-surface rounded-m3-xl shadow-m3-1 hover:shadow-m3-3 border border-m3-outline-variant p-4 transition-all duration-300 transform hover:-translate-y-1 group flex flex-col justify-between">
            <div>
                {/* Compact Driver Photo */}
                <a href={`/drivers/${slug}/`} className="block relative mb-3 overflow-hidden rounded-m3-lg bg-m3-surface-container-high skeleton-shimmer">
                    <img
                        src={driver.image}
                        width="256"
                        height="160"
                        decoding="async"
                        className="w-full h-36 sm:h-40 object-cover object-top transform group-hover:scale-105 transition-all duration-500 relative z-10"
                        alt={`${name} - Verified Chauffeur at Kalidass Travels`}
                        loading="lazy"
                    />
                    <div className="absolute top-2.5 left-2.5 z-20">
                        <span className="bg-slate-950/85 backdrop-blur-md border border-white/20 text-white text-micro font-bold px-2.5 py-0.5 rounded-m3-full shadow-sm">
                            {driver.tag}
                        </span>
                    </div>
                </a>

                {/* Name & Rating */}
                <div className="flex justify-between items-center mb-1.5">
                    <h3 className="font-bold text-base text-m3-on-surface font-heading leading-snug truncate">
                        <a href={`/drivers/${slug}/`} className="hover:text-m3-primary transition-colors">
                            {name}
                        </a>
                    </h3>
                    <div className="flex items-center gap-1 bg-m3-surface-container-high px-2 py-0.5 rounded-m3-full border border-m3-outline-variant shrink-0">
                        <span className="material-symbols-outlined text-[14px] text-amber-400">star</span>
                        <span className="text-xs font-bold text-m3-on-surface">{driver.rating}</span>
                    </div>
                </div>

                {/* Verified Badge */}
                <div className="inline-flex items-center gap-1 mb-2.5 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-m3-xs text-badge font-bold text-emerald-800">
                    <span className="material-symbols-outlined text-[14px] text-emerald-600 shrink-0">verified_user</span>
                    <span>Police Verification Certified</span>
                </div>

                {/* Driver Details */}
                <div className="text-xs text-m3-on-surface-variant space-y-1 mb-3">
                    <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-m3-on-surface-variant/70 shrink-0">schedule</span>
                        <span className="truncate">{driver.experience}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-m3-on-surface-variant/70 shrink-0">translate</span>
                        <span className="truncate">{driver.languages}</span>
                    </div>
                </div>
            </div>

            {/* Compact Action Row */}
            <div className="pt-2.5 border-t border-m3-outline-variant/40 flex items-center gap-2">
                <a
                    href={`/drivers/${slug}/`}
                    className="flex-1 text-center text-micro sm:text-xs font-semibold text-m3-on-surface bg-m3-surface-container-high hover:bg-m3-surface-container-highest py-1.5 sm:py-2 rounded-m3-full transition-all whitespace-nowrap"
                >
                    View Profile
                </a>
                <a
                    href={`https://wa.me/?text=${waShareText}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Share on WhatsApp"
                    className="flex items-center justify-center w-8 h-8 bg-[#25D366]/10 hover:bg-[#25D366] text-[#25D366] hover:text-white rounded-m3-full transition-all duration-200 shrink-0 shadow-sm hover:shadow-m3-1 focus-visible:ring-2 focus-visible:ring-[#25D366]"
                    aria-label={`Share ${name} on WhatsApp`}
                >
                    <WhatsAppIcon variant="brand" className="w-4 h-4" />
                </a>
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
