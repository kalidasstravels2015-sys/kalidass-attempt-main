import React from 'react';
import siteContent from '../../data/siteContent.json';
import { Star, ExternalLink } from 'lucide-react';

const ReviewsCarousel = ({ currentLang }) => {
    const reviews = siteContent.reviews && siteContent.reviews.length > 0 ? siteContent.reviews : [
        {
            name: "Venkatesh R.",
            role: "Family Pilgrimage",
            rating: 5,
            quote: "Booked an Innova Crysta for our Tirupati darshan from Medavakkam. Driver was very punctual, polite, and handled temple parking seamlessly."
        },
        {
            name: "Anand Kumar",
            role: "Corporate Outstation",
            rating: 5,
            quote: "Reliable airport transfers and transparent rates without any surprise charges. Cleanest cars in Chennai."
        },
        {
            name: "Meenakshi Sundaram",
            role: "Navagraha Temple Tour",
            rating: 5,
            quote: "Completed a 3-day Kumbakonam Navagraha trip with senior citizens. Driver drove safely and knew all temple opening timings."
        }
    ];

    return (
        <section id="reviews" className="py-10 md:py-16 bg-m3-surface-container-low border-t border-m3-outline-variant/60">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="text-center max-w-3xl mx-auto mb-8">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-m3-full bg-m3-surface border border-m3-outline-variant text-m3-on-surface text-xs font-semibold shadow-m3-1 mb-3.5 tracking-wide">
                        <span className="material-symbols-outlined text-[16px] text-[#4285F4]">location_on</span>
                        <span className="font-bold text-m3-on-surface">Google Verified Reviews</span>
                        <span className="text-m3-on-surface-variant">•</span>
                        <span className="text-amber-500 font-bold flex items-center gap-0.5">4.9/5 <Star className="w-3 h-3 fill-amber-400 text-amber-400 inline" /></span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-m3-on-surface tracking-tight leading-tight mb-2.5 font-heading">
                        Customer <span className="text-m3-primary">Experiences</span>
                    </h2>
                    <p className="text-xs sm:text-sm md:text-base text-m3-on-surface-variant font-normal max-w-2xl mx-auto leading-relaxed mb-6 font-sans">
                        Authentic feedback from families, pilgrims, and corporate travelers who choose Kalidass Travels.
                    </p>
                </div>

                {/* Reviews Carousel / Cards Grid */}
                <div
                    className="flex overflow-x-auto gap-6 pb-6 scrollbar-hide snap-x md:grid md:grid-cols-3 md:overflow-visible focus:outline-none"
                    tabIndex={0}
                    role="region"
                    aria-label="Client Reviews"
                >
                    {reviews.map((review, index) => (
                        <div
                            key={index}
                            className="flex-none w-80 md:w-auto bg-m3-surface p-6 sm:p-7 rounded-m3-xl shadow-m3-1 hover:shadow-m3-3 border border-m3-outline-variant snap-center flex flex-col justify-between transition-all duration-300 transform hover:-translate-y-1.5"
                        >
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-m3-primary-container text-m3-on-primary-container rounded-m3-full flex items-center justify-center text-sm font-bold shadow-m3-1" aria-hidden="true">
                                            {review.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="block text-base font-bold text-m3-on-surface leading-snug font-heading">{review.name}</h3>
                                            <span className="text-xs text-m3-on-surface-variant font-normal">{review.role || "Verified Traveler"}</span>
                                        </div>
                                    </div>
                                    <div className="flex text-amber-400 text-xs space-x-0.5" aria-label="Rated 5 out of 5 stars" role="img">
                                        {[...Array(review.rating || 5)].map((_, i) => (
                                            <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                                        ))}
                                    </div>
                                </div>
                                <p className="text-sm text-m3-on-surface-variant font-normal leading-relaxed italic font-sans">
                                    "{review.quote}"
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Google Maps Profile Link Button */}
                <div className="text-center mt-10">
                    <a
                        href="https://maps.app.goo.gl/i2LdJhWMi2ZgAiCa8"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-m3-primary hover:bg-slate-900 text-white font-bold text-sm rounded-m3-full shadow-m3-2 hover:shadow-m3-3 transition-all border border-white/20 group"
                        aria-label="See More Reviews on Google (opens in a new tab)"
                    >
                        <span className="material-symbols-outlined text-[18px] text-[#4285F4]">location_on</span>
                        <span>Read 1,500+ Verified Reviews on Google Maps</span>
                        <ExternalLink className="w-4 h-4 text-emerald-400 transform group-hover:translate-x-0.5 transition-transform" />
                    </a>
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

export default ReviewsCarousel;
