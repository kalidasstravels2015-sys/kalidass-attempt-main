import React from 'react';

const partners = [
    {
        name: "Airport Authority of India",
        logo: "/images/partners/airport-chennai.webp",
        alt: "Airport Authority of India - Official taxi partner for Chennai Airport pickup and drop",
    },
    {
        name: "L&T",
        logo: "/images/partners/landt.webp",
        alt: "Larsen & Toubro (L&T) Construction Chennai - Corporate employee transport partner"
    },
    {
        name: "Reliance Jio",
        logo: "/images/partners/jio.webp",
        alt: "Reliance Jio Infocomm - Monthly cab services for corporate staff in Chennai"
    },
    {
        name: "Savaari",
        logo: "/images/partners/savaari.webp",
        alt: "Savaari Car Rentals - Trusted local taxi operator partner"
    },
    {
        name: "Saravn Enterprises",
        logo: "/images/partners/saravn.webp",
        alt: "Saravn Enterprises - Dedicated logistics and staff transport provider"
    },
    {
        name: "Cognizant",
        logo: "/images/partners/cognizant.webp",
        alt: "Cognizant Technology Solutions - IT employee daily commute partner"
    },
    {
        name: "TN Police",
        logo: "/images/partners/tn-police.webp",
        alt: "Tamil Nadu Police - Trusted vehicle provider for official duties"
    },
    {
        name: "Mahindra Logistics",
        logo: "/images/partners/mahindra_logistics_logo.webp",
        alt: "Mahindra Logistics - Official transport partner"
    },
    {
        name: "Kaleesuwari",
        logo: "/images/partners/kaleesuwari.webp",
        alt: "Kaleesuwari Refinery Private Limited - Trusted corporate partner"
    },
];

const PartnersCarousel = ({ currentLang }) => {
    // Always double the array for seamless infinite scroll on all devices
    const scrollingPartners = [...partners, ...partners];

    return (
        <section id="partners" className="py-10 md:py-12 bg-m3-surface overflow-hidden border-t border-m3-outline-variant/60">
            {/* Section Header */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6 text-center">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-m3-on-surface tracking-tight leading-tight mb-2.5 font-heading">
                    Trusted by <span className="text-m3-primary">Leading Organizations</span>
                </h2>
                <p className="text-xs sm:text-sm md:text-base text-m3-on-surface-variant max-w-2xl mx-auto font-normal leading-relaxed mb-6 font-sans">
                    Preferred transportation partner for leading enterprises, government bodies, and IT corridors.
                </p>
            </div>

            <div className="relative w-full max-w-7xl mx-auto">
                {/* Gradient Masks */}
                <div className="absolute left-0 top-0 bottom-0 w-24 sm:w-36 bg-gradient-to-r from-m3-surface to-transparent z-10 pointer-events-none"></div>
                <div className="absolute right-0 top-0 bottom-0 w-24 sm:w-36 bg-gradient-to-l from-m3-surface to-transparent z-10 pointer-events-none"></div>

                {/* Auto-scrolling Track */}
                <div
                    className="flex w-max animate-scroll items-center gap-6 pb-4"
                    role="region"
                    aria-label="Partner Logos"
                >
                    {scrollingPartners.map((partner, index) => (
                        <div
                            key={index}
                            className="flex-shrink-0 mx-2 sm:mx-4"
                            aria-hidden={index >= partners.length ? "true" : "false"}
                        >
                            <div className="w-40 h-20 sm:w-52 sm:h-28 flex items-center justify-center bg-m3-surface rounded-m3-xl shadow-m3-1 border border-m3-outline-variant p-4 hover:shadow-m3-2 transition-all">
                                {partner.logo ? (
                                    <img
                                        src={partner.logo}
                                        alt={index >= partners.length ? "" : (partner.alt || partner.name)}
                                        width="160"
                                        height="80"
                                        decoding="async"
                                        className="object-contain w-full h-full transition-all duration-300 relative z-10"
                                        loading="lazy"
                                    />
                                ) : (
                                    <span className="font-bold text-m3-on-surface text-sm sm:text-base relative z-10">
                                        {partner.name}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <style>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(calc(-50%));
          }
        }
        .animate-scroll {
          animation: scroll 30s linear infinite;
        }
        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
        </section>
    );
};

export default PartnersCarousel;
