import React, { useState } from 'react';
import siteContent from '../../data/siteContent.json';
import { Star, Clock, Languages, ShieldCheck, ArrowRight, MapPin, Share2 } from "lucide-react";

function toSlug(name) {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

// Helper image component
const DriverCard = ({ driver }) => {
    const slug = toSlug(driver.name);
    const profileUrl = `https://kalidasstravels.in/drivers/${slug}`;
    const name = driver.name;

    const waShareText = encodeURIComponent(
        `*${name}* - ${driver.specialty}\n` +
        `⭐ ${driver.rating} Rating | ${driver.trips} Trips\n` +
        `✅ PVC Verified Driver\n\n` +
        `Book via *Kalidass Travels*\n` +
        `👉 ${profileUrl}`
    );

    return (
        <div className="flex-none w-72 snap-center bg-white rounded-2xl shadow-sm border border-slate-200 p-4 hover:shadow-md transition-all duration-300 group flex flex-col">
            <a href={`/drivers/${slug}`} className="block relative mb-4 overflow-hidden rounded-xl bg-slate-200 skeleton-shimmer">
                <img
                    src={driver.image}
                    className="w-full h-64 object-cover object-top transform group-hover:scale-105 transition-all duration-500 relative z-10"
                    alt={name}
                    loading="lazy"
                />
                <div className="absolute top-2 left-2 flex flex-col gap-1.5 z-20">
                    <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm w-fit">
                        {driver.tag}
                    </span>
                </div>
            </a>

            <div className="flex justify-between items-center mb-1">
                <a href={`/drivers/${slug}`} className="font-bold text-lg text-slate-900 hover:text-indigo-700 transition-colors">
                    {name}
                </a>
                <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-current" />
                    <span className="text-xs font-bold text-slate-700">{driver.rating}</span>
                </div>
            </div>

            <div className="inline-flex items-center gap-1.5 mt-1 mb-2 px-2 py-0.5 bg-green-50 border border-green-100 rounded-md text-[10px] font-bold text-green-700">
                <ShieldCheck className="w-3 h-3" />
                PVC Verified
            </div>

            <div className="text-sm text-slate-600 mt-1 space-y-2 flex-grow">
                <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-500" aria-hidden="true" />
                    <span>{driver.experience}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Languages className="w-4 h-4 text-slate-500" aria-hidden="true" />
                    <span>{driver.languages}</span>
                </div>
            </div>

            {/* Action row */}
            <div className="mt-3 pt-3 border-t border-slate-100 flex gap-2">
                <a
                    href={`/drivers/${slug}`}
                    className="flex-1 text-center text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 py-2 rounded-lg transition-colors"
                >
                    View Profile
                </a>
                <a
                    href={`https://wa.me/?text=${waShareText}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Share on WhatsApp"
                    className="flex items-center justify-center w-9 h-8 text-[#25D366] bg-green-50 hover:bg-green-100 rounded-lg transition-colors shrink-0"
                    aria-label={`Share ${name} on WhatsApp`}
                >
                    <Share2 className="w-3.5 h-3.5" />
                </a>
            </div>
        </div>
    );
};

const DriversCarousel = ({ currentLang }) => {
    const drivers = siteContent.drivers;
    const [visibleCount, setVisibleCount] = useState(6);

    const labels = siteContent.ui_labels;
    const heading = labels.our_professional_drivers;

    const visibleDrivers = drivers.slice(0, visibleCount);
    const hasMore = visibleCount < drivers.length;

    const loadMore = () => {
        setVisibleCount(prev => Math.min(prev + 6, drivers.length));
    };

    // Load remaining items when component mounts to prevent layout shifts on Desktop,
    // while improving initial LCP/FCP.
    React.useEffect(() => {
        // Delay loading the rest until after initial render
        const timer = setTimeout(() => {
            setVisibleCount(drivers.length);
        }, 500);
        return () => clearTimeout(timer);
    }, [drivers.length]);

    return (
        <section className="py-20 bg-slate-50" aria-labelledby="drivers-heading">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 id="drivers-heading" className="text-2xl md:text-4xl font-extrabold text-gray-900 inline-block relative mb-4">
                        {heading}
                        <div className="absolute bottom-[-10px] left-1/2 transform -translate-x-1/2 w-20 h-1.5 bg-red-600 rounded-full"></div>
                    </h2>
                    <p className="text-base text-gray-600 max-w-2xl mx-auto mt-4">
                        Experienced, verified, and multilingual drivers at your service.
                    </p>
                </div>

                <div
                    className="flex overflow-x-auto gap-6 pb-8 snap-x scrollbar-hide focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-xl"
                    tabIndex={0}
                    role="region"
                    aria-label="Drivers List"
                >
                    {visibleDrivers.map((driver, index) => (
                        <DriverCard key={index} driver={driver} />
                    ))}
                </div>


                <div className="text-center mt-6">
                    <a
                        href="/drivers"
                        className="inline-flex items-center gap-2 text-indigo-600 font-semibold hover:text-indigo-700 transition-colors duration-200 group focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-lg px-2"
                    >
                        View All Drivers
                        <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-200" aria-hidden="true" />
                    </a>
                </div>
            </div>
            <style jsx>{`
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
