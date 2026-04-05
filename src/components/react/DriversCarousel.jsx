import React, { useState } from 'react';
import siteContent from '../../data/siteContent.json';
import { useLanguage } from '../../hooks/useLanguage';
import { Star, Clock, Languages, ShieldCheck, ArrowRight, MapPin } from "lucide-react";

// Helper image component
const DriverCard = ({ driver, lang }) => {
    const isTa = lang === 'ta';

    return (
        <div className="flex-none w-72 snap-center bg-white rounded-2xl shadow-sm border border-slate-200 p-4 hover:shadow-md transition-all duration-300 group">
            <div className="relative mb-4 overflow-hidden rounded-xl bg-slate-200 skeleton-shimmer">
                <img
                    src={driver.image}
                    className="w-full h-64 object-cover transform group-hover:scale-105 transition-all duration-500 relative z-10"
                    alt={isTa ? (driver.name_ta || driver.name) : driver.name}
                    loading="lazy"
                />
                <div className="absolute top-2 left-2 flex flex-col gap-1.5 z-20">
                    <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm w-fit">
                        {isTa ? (driver.tag_ta || driver.tag) : driver.tag}
                    </span>
                </div>
            </div>

            <div className="flex justify-between items-center mb-1">
                <h3 className="font-bold text-lg text-slate-900">{isTa ? (driver.name_ta || driver.name) : driver.name}</h3>
                <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-current" />
                    <span className="text-xs font-bold text-slate-700">{driver.rating}</span>
                </div>
            </div>

            <div className="inline-flex items-center gap-1.5 mt-1 mb-2 px-2 py-0.5 bg-green-50 border border-green-100 rounded-md text-[10px] font-bold text-green-700">
                <ShieldCheck className="w-3 h-3" />
                PVC Verified
            </div>

            <div className="text-sm text-slate-600 mt-1 space-y-2">
                <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-500" aria-hidden="true" />
                    <span>{isTa ? (driver.experience_ta || driver.experience) : driver.experience}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Languages className="w-4 h-4 text-slate-500" aria-hidden="true" />
                    <span>{isTa ? (driver.languages_ta || driver.languages) : driver.languages}</span>
                </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100">
                <p className="text-xs text-slate-500 italic">
                    {isTa
                        ? `${driver.name_ta || driver.name} ${driver.experience_ta || driver.experience} அனுபவம் கொண்டவர், ${driver.languages_ta || driver.languages} மொழிகளை சரளமாக பேசக்கூடியவர்.`
                        : `${driver.name} has ${driver.experience} and is fluent in ${driver.languages}.`
                    }
                </p>
            </div>
        </div>
    );
};

const DriversCarousel = ({ currentLang }) => {
    const drivers = siteContent.drivers;
    const isSSR = !!currentLang;
    const contextLang = useLanguage();
    const lang = isSSR ? currentLang : contextLang;
    const [visibleCount, setVisibleCount] = useState(6);

    const labels = siteContent.ui_labels;
    const heading = lang === 'ta' ? labels.our_professional_drivers_ta : labels.our_professional_drivers;

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
                        {lang === 'ta'
                            ? 'அனுபவம் வாய்ந்த, சரிபார்க்கப்பட்ட மற்றும் பன்மொழி பேசும் ஓட்டுநர்கள் உங்கள் சேவையில்.'
                            : 'Experienced, verified, and multilingual drivers at your service.'}
                    </p>
                </div>

                <div
                    className="flex overflow-x-auto gap-6 pb-8 snap-x scrollbar-hide focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-xl"
                    tabIndex={0}
                    role="region"
                    aria-label="Drivers List"
                >
                    {visibleDrivers.map((driver, index) => (
                        <DriverCard key={index} driver={driver} lang={lang} />
                    ))}
                </div>


                <div className="text-center mt-6">
                    <a
                        href="/drivers"
                        className="inline-flex items-center gap-2 text-indigo-600 font-semibold hover:text-indigo-700 transition-colors duration-200 group focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-lg px-2"
                    >
                        {lang === 'ta' ? 'அனைத்து ஓட்டுநர்களையும் காண்க' : 'View All Drivers'}
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
