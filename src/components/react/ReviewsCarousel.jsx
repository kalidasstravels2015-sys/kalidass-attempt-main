import React from 'react';
import siteContent from '../../data/siteContent.json';
import { Star, ExternalLink, MapPin } from 'lucide-react';

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
                    <a
                        href="https://maps.app.goo.gl/i2LdJhWMi2ZgAiCa8"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/95 dark:bg-slate-900/90 hover:bg-white dark:hover:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200/90 dark:border-slate-800/90 shadow-2xs hover:shadow-sm hover:border-slate-300 dark:hover:border-slate-700 text-xs transition-all duration-200 group cursor-pointer mb-3.5 hover:scale-[1.02] active:scale-[0.98] select-none"
                        title="View 5.0 Star Verified Google Reviews for Kalidass Travels"
                    >
                        <span className="inline-flex items-center justify-center w-4 h-4 shrink-0" aria-label="Google">
                            <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                            </svg>
                        </span>
                        <span className="font-extrabold tracking-tight text-[13px] leading-none">5.0</span>
                        <span className="inline-flex items-center gap-0.5 text-[#FBBC05] leading-none shrink-0" aria-label="5 out of 5 stars">
                            {[...Array(5)].map((_, i) => (
                                <svg key={i} className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20" aria-hidden="true"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                            ))}
                        </span>
                        <span className="h-3 w-px bg-slate-300 dark:bg-slate-700"></span>
                        <span className="font-semibold text-[11px] sm:text-xs text-slate-700 dark:text-slate-200 tracking-tight group-hover:underline">
                            <span className="hidden min-[420px]:inline">100% 5-Star • </span>12 Reviews
                        </span>
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200/80 dark:border-emerald-800/60 px-1.5 py-0.5 rounded-full leading-none shrink-0">
                            <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Verified
                        </span>
                        <ExternalLink className="w-3 h-3 text-slate-400 dark:text-slate-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200 shrink-0" />
                    </a>
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
                                    <div className="flex text-m3-tertiary text-xs space-x-0.5" aria-label="Rated 5 out of 5 stars" role="img">
                                        {[...Array(review.rating || 5)].map((_, i) => (
                                            <Star key={i} className="w-4 h-4 fill-m3-tertiary text-m3-tertiary" />
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
                        rel="noopener noreferrer nofollow"
                        className="inline-flex items-center gap-2.5 px-8 py-3.5 !bg-[#0B57D0] hover:!bg-[#0842A0] !text-white font-bold text-sm rounded-m3-full shadow-m3-2 hover:shadow-m3-3 transition-all border border-white/20 group"
                        aria-label="See More Reviews on Google (opens in a new tab)"
                    >
                        <MapPin className="w-4 h-4 text-white shrink-0" />
                        <span>Read 12 Verified Reviews on Google Maps (5.0 ★)</span>
                        <ExternalLink className="w-4 h-4 text-white transform group-hover:translate-x-0.5 transition-transform shrink-0" />
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
