import React from 'react';
import siteContent from '../../data/siteContent.json';

const ReviewsCarousel = ({ currentLang }) => {
    const reviews = siteContent.reviews.slice(0, 5);

    return (
        <section id="reviews" className="py-10 md:py-16 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4">
                {/* Section Header */}
                <div className="text-center mb-8">
                    <h2 className="text-2xl md:text-4xl font-extrabold text-gray-900 inline-block relative mb-3">
                        Client Reviews
                        <div className="absolute bottom-[-8px] left-1/2 transform -translate-x-1/2 w-16 h-1 bg-red-600 rounded-full"></div>
                    </h2>
                    <p className="text-base text-gray-600 max-w-2xl mx-auto mt-2">
                        Hear from our happy customers about their journey with us.
                    </p>
                </div>

                {/* Reviews Scroll */}
                <div
                    className="flex overflow-x-auto gap-4 pb-6 scrollbar-hide snap-x focus:outline-none focus:ring-2 focus:ring-red-500 rounded-xl"
                    tabIndex={0}
                    role="region"
                    aria-label="Client Reviews"
                >
                    {reviews.map((review, index) => (
                        <div key={index} className="flex-none w-64 sm:w-80 bg-white p-6 rounded-xl shadow-sm border border-gray-100 snap-center flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm" aria-hidden="true">
                                            {review.name.charAt(0)}
                                        </div>
                                        <div>
                                            <span className="block text-sm font-bold text-gray-900 leading-none">{review.name}</span>
                                            <div className="flex text-yellow-400 text-[10px] mt-1 space-x-0.5" aria-label="Rated 5 out of 5 stars" role="img">
                                                {[...Array(5)].map((_, i) => (
                                                    <i key={i} className="fas fa-star" aria-hidden="true"></i>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-blue-500 opacity-20">
                                        <i className="fab fa-google text-xl" aria-hidden="true"></i>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-600 italic leading-relaxed">"{review.quote}"</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="text-center mt-6">
                    <a
                        href="https://maps.app.goo.gl/i2LdJhWMi2ZgAiCa8"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-blue-600 font-bold text-sm hover:text-blue-700 transition"
                        aria-label="See More Reviews on Google (opens in a new tab)"
                    >
                        See More Reviews on Google <i className="fas fa-arrow-right ml-2" aria-hidden="true"></i>
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
