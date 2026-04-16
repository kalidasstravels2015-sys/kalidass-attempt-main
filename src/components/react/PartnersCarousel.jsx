import React, { useState, useEffect } from 'react';

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
        <section className="py-10 md:py-16 bg-gray-50 overflow-hidden border-t border-gray-200">
            <div className="max-w-7xl mx-auto px-4 mb-12 text-center">
                <h2 className="text-2xl md:text-4xl font-extrabold text-gray-900 inline-block relative mb-4">
                    Trusted By Industry Leaders
                    <div className="absolute bottom-[-10px] left-1/2 transform -translate-x-1/2 w-20 h-1.5 bg-red-600 rounded-full"></div>
                </h2>
                <p className="text-base text-gray-600 max-w-2xl mx-auto mt-4">
                    Proud to serve these esteemed organizations
                </p>
            </div>

            <div className="relative w-full max-w-6xl mx-auto">
                {/* Gradient Masks */}
                <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-gray-50 to-transparent z-10 pointer-events-none"></div>
                <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-gray-50 to-transparent z-10 pointer-events-none"></div>

                {/* Auto-scrolling Track */}
                <div
                    className="flex w-max animate-scroll items-center gap-6 pb-8"
                    role="region"
                    aria-label="Partner Logos"
                >
                    {scrollingPartners.map((partner, index) => (
                        <div
                            key={index}
                            className="flex-shrink-0 mx-4 md:mx-8"
                            aria-hidden={index >= partners.length ? "true" : "false"}
                        >
                            <div className="w-44 h-24 md:w-56 md:h-32 flex items-center justify-center bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                                {partner.logo ? (
                                    <img
                                        src={partner.logo}
                                        alt={index >= partners.length ? "" : (partner.alt || partner.name)}
                                        className="object-contain w-full h-full transition-all duration-500 transform hover:scale-110 relative z-10"
                                        loading="lazy"
                                    />
                                ) : (
                                    <span className="font-bold text-gray-400 text-lg relative z-10">
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
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); } 
          }
          .animate-scroll {
            animation: scroll 30s linear infinite;
          }
          @media (prefers-reduced-motion: reduce) {
            .animate-scroll {
              animation: scroll 60s linear infinite;
            }
          }
      `}</style>
        </section>
    );
};

export default PartnersCarousel;
