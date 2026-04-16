import React, { useRef, useState, useEffect } from 'react';
import siteContent from '../../data/siteContent.json';
import { ShieldCheck, Users, Briefcase, Zap, Info } from 'lucide-react';

const FleetCard = ({ vehicle, isVisible, priority }) => {
    const isTempo = vehicle.name.includes('Tempo');
    const isSUV = vehicle.name.toLowerCase().includes('innova') || vehicle.name.toLowerCase().includes('bolero') || vehicle.name.toLowerCase().includes('sumo');

    return (
        <div className="flex-shrink-0 w-80 snap-center md:w-auto md:snap-align-none transition-opacity duration-500 opacity-100 h-full">
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 h-full flex flex-col">
                {/* Image */}
                <div className="relative h-56 overflow-hidden bg-slate-200 skeleton-shimmer">
                    {isVisible && (
                        <>
                            <img
                                src={vehicle.image}
                                alt={vehicle.name}
                                className="w-full h-full object-cover transition-all duration-700 hover:scale-110 relative z-10"
                                loading={priority ? "eager" : "lazy"}
                                fetchPriority={priority ? "high" : "auto"}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-20"></div>

                            {/* Badges */}
                            <div className="absolute top-4 left-4 flex flex-col gap-2 z-30">
                                {vehicle.details.some(d => d.toLowerCase().includes('sanitized')) && (
                                    <span className="bg-emerald-700 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm flex items-center gap-1 w-fit">
                                        <ShieldCheck className="w-3 h-3" />
                                        Sanitized Every Trip
                                    </span>
                                )}
                                {(vehicle.details.some(d => d.toLowerCase().includes('mountain')) || vehicle.details.some(d => d.toLowerCase().includes('hill'))) && (
                                    <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm flex items-center gap-1 w-fit">
                                        <Zap className="w-3 h-3" />
                                        Hill Specialist
                                    </span>
                                )}
                                {vehicle.details.some(d => d.toLowerCase().includes('city ride')) && (
                                    <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm flex items-center gap-1 w-fit">
                                        <Zap className="w-3 h-3" />
                                        Quick City Ride
                                    </span>
                                )}
                                {vehicle.details.some(d => d.toLowerCase().includes('group trip')) && (
                                    <span className="bg-purple-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm flex items-center gap-1 w-fit">
                                        <Users className="w-3 h-3" />
                                        Group Specialist
                                    </span>
                                )}
                            </div>

                            <div className="absolute bottom-4 left-4 z-30">
                                <h3 className="text-2xl font-bold text-white tracking-tight">
                                    {vehicle.name}
                                </h3>
                            </div>
                        </>
                    )}
                </div>

                {/* Content */}
                <div className="p-6 flex-1 flex flex-col">
                    {/* Key Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Starting From</p>
                            <p className="text-xl font-black text-indigo-600 leading-none">{vehicle.rate}</p>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Capacity</p>
                            <div className="flex items-center gap-1.5">
                                <Users className="w-4 h-4 text-slate-600" />
                                <p className="text-sm font-bold text-slate-700">{vehicle.caps}</p>
                            </div>
                        </div>
                    </div>

                    {/* Features List */}
                    <div className="space-y-3 flex-1">
                        {vehicle.details.filter(f => !f.toLowerCase().includes('sanitized')).map((feature, idx) => (
                            <div key={idx} className="flex items-start gap-3">
                                <div className="mt-1 bg-indigo-50 p-1 rounded">
                                    <ShieldCheck className="w-3 h-3 text-indigo-600" />
                                </div>
                                <span className="text-sm text-slate-600 font-medium leading-tight">{feature}</span>
                            </div>
                        ))}
                    </div>

                    {/* Action Hint removed per user request */}
                </div>
            </div>
        </div>
    );
};

const FleetRoll = ({ currentLang }) => {
    const fleet = siteContent.fleet;
    const [activeIndex, setActiveIndex] = useState(0);
    const containerRef = useRef(null);

    const labels = siteContent.ui_labels;
    const heading = labels.our_premium_fleet;

    useEffect(() => {
        const handleScroll = () => {
            if (containerRef.current) {
                const { scrollLeft, offsetWidth } = containerRef.current;
                // On mobile, cards are roughly 320px + 24px gap.
                // We use offsetWidth to determine the 'page' size.
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
        <section id="fleet" className="py-20 bg-white" ref={containerRef} aria-labelledby="fleet-heading">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <h2 id="fleet-heading" className="text-2xl md:text-4xl font-extrabold text-gray-900 inline-block relative mb-4">
                        {heading}
                        <div className="absolute bottom-[-10px] left-1/2 transform -translate-x-1/2 w-20 h-1.5 bg-red-600 rounded-full"></div>
                    </h2>
                    <p className="text-base text-gray-600 max-w-2xl mx-auto mt-4">
                        Choose from our well-maintained fleet of vehicles for your journey
                    </p>
                </div>

                {/* Fleet Grid/Scroll Container */}
                <div className="relative">
                    <div
                        ref={containerRef}
                        className="flex overflow-x-auto snap-x snap-mandatory pb-8 space-x-6 px-4 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-8 md:space-x-0 md:overflow-visible md:pb-0 scrollbar-hide focus:outline-none rounded-xl"
                        tabIndex={0}
                        role="region"
                        aria-label="Fleet Gallery"
                    >
                        {fleet.map((vehicle, index) => (
                            <FleetCard key={index} vehicle={vehicle} isVisible={true} priority={index < 2} />
                        ))}
                    </div>

                    {/* Scroll Indicators (Mobile Only) */}
                    <div className="flex justify-center mt-6 space-x-2 md:hidden" aria-hidden="true">
                        {fleet.map((_, index) => (
                            <div
                                key={index}
                                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${activeIndex === index ? 'bg-red-600 w-6' : 'bg-slate-300'}`}
                            ></div>
                        ))}
                    </div>
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

export default FleetRoll;
