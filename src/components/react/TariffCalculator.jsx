import React, { useState, useEffect } from 'react';
import trips from '../../data/trips.json';
import { trackEvent } from '../../lib/analytics';
import WhatsAppButton from './WhatsAppButton.jsx';

const TariffCalculator = ({ currentLang }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTrip, setActiveTrip] = useState(null);
    const [costs, setCosts] = useState({ etios: 0, innova: 0, bata: 0, totalKm: 0 });

    const modalRef = React.useRef(null);

    useEffect(() => {
        const handleOpen = (event) => {
            const tripData = event.detail;
            const tripId = parseInt(tripData.id);
            const foundTrip = trips.find(t => t.id === tripId);

            if (foundTrip) {
                const totalKm = foundTrip.kmOneWay * 2;
                const durationDays = parseInt(foundTrip.duration) || 1;
                const minKm = durationDays * 250;
                const chargeableKm = Math.max(minKm, totalKm);
                const etiosBata = 300 * durationDays;
                const innovaBata = 500 * durationDays;
                const etiosCost = (chargeableKm * 14) + etiosBata;
                const innovaCost = (chargeableKm * 18) + innovaBata;

                setActiveTrip(foundTrip);
                setCosts({
                    etios: etiosCost,
                    innova: innovaCost,
                    bata: etiosBata,
                    totalKm,
                    chargeableKm
                });
                setIsOpen(true);
                document.body.style.overflow = 'hidden';

                trackEvent('tariff_calculator_opened', {
                    destination: foundTrip.title,
                    duration: foundTrip.duration
                });
            }
        };

        document.addEventListener('open-calculator', handleOpen);
        return () => {
            document.removeEventListener('open-calculator', handleOpen);
        };
    }, []);

    // Focus Trap and Escape Key
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => modalRef.current?.focus(), 50);

            const handleKeyDown = (e) => {
                if (e.key === 'Escape') closeModal();
            };
            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen]);

    const closeModal = () => {
        setIsOpen(false);
        document.body.style.overflow = '';
        setActiveTrip(null);
    };

    const handleWhatsApp = () => {
        if (!activeTrip) return;

        trackEvent('tariff_calculator_whatsapp', {
            destination: activeTrip.title,
            costs
        });

        const message = encodeURIComponent(
            `Hi! I'm interested in the ${activeTrip.title} package.\n\n` +
            `Estimated Costs:\n` +
            `Etios: ₹${costs.etios.toLocaleString('en-IN')}\n` +
            `Innova: ₹${costs.innova.toLocaleString('en-IN')}\n\n` +
            `Please confirm the final pricing and availability.`
        );
        window.open(`https://wa.me/916381939769?text=${message}`, '_blank');
    };

    if (!isOpen || !activeTrip) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs"
                onClick={closeModal}
                aria-hidden="true"
            />

            {/* Modal */}
            <div
                ref={modalRef}
                className="relative bg-m3-surface rounded-m3-xl shadow-m3-4 border border-m3-outline-variant max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-fade-in-up outline-none font-sans"
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
                tabIndex={-1}
            >
                {/* Header */}
                <div className="bg-m3-surface-container-low text-m3-on-surface p-6 rounded-t-m3-xl border-b border-m3-outline-variant">
                    <div className="flex justify-between items-center">
                        <h3 id="modal-title" className="text-xl font-bold font-heading">Trip Fare Estimate</h3>
                        <button
                            onClick={closeModal}
                            className="text-m3-on-surface-variant hover:text-m3-on-surface transition focus:outline-none focus:ring-2 focus:ring-m3-primary rounded-m3-full p-1 cursor-pointer"
                            aria-label="Close Calculator"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <p className="text-m3-on-surface-variant mt-1.5 font-normal text-sm">Estimated pricing for {activeTrip.title}</p>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Trip Details */}
                    <div className="bg-m3-surface-container-low rounded-m3-lg p-5 border border-m3-outline-variant/60">
                        <h4 className="font-bold text-m3-on-surface mb-3 font-heading text-sm uppercase tracking-wider">Trip Details</h4>
                        <div className="grid grid-cols-2 gap-4 text-xs sm:text-sm">
                            <div>
                                <span className="text-m3-on-surface-variant block text-xs">One Way Distance</span>
                                <p className="font-bold text-m3-on-surface">{activeTrip.kmOneWay} km</p>
                            </div>
                            <div>
                                <span className="text-m3-on-surface-variant block text-xs">Total Distance</span>
                                <p className="font-bold text-m3-on-surface">{costs.totalKm} km</p>
                            </div>
                            <div>
                                <span className="text-m3-on-surface-variant block text-xs">Duration</span>
                                <p className="font-bold text-m3-on-surface">{activeTrip.duration}</p>
                            </div>
                            <div>
                                <span className="text-m3-on-surface-variant block text-xs">Driver Bata (Included)</span>
                                <p className="font-bold text-m3-on-surface">₹{costs.bata}</p>
                            </div>
                        </div>
                    </div>

                    {/* Pricing Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Etios Card */}
                        <div className="border border-m3-outline-variant bg-m3-surface rounded-m3-lg p-5 shadow-m3-1 flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-bold text-base text-m3-on-surface font-heading">Toyota Etios</h4>
                                    <svg className="w-5 h-5 text-m3-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="space-y-1.5 text-xs text-m3-on-surface-variant mb-4 font-sans">
                                    <p>• Comfortable Sedan</p>
                                    <p>• 4 Passengers + Driver</p>
                                    <p>• Rate: ₹14/km</p>
                                </div>
                            </div>
                            <div className="bg-m3-surface-container-low rounded-m3-md p-3 border border-m3-outline-variant/60">
                                <p className="text-m3-on-surface-variant text-badge font-semibold mb-0.5">Estimated Cost</p>
                                <p className="text-2xl font-black text-m3-on-surface font-heading">₹{costs.etios.toLocaleString('en-IN')}</p>
                            </div>
                        </div>

                        {/* Innova Card */}
                        <div className="border border-m3-outline-variant bg-m3-surface rounded-m3-lg p-5 shadow-m3-1 flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-bold text-base text-m3-on-surface font-heading">Toyota Innova</h4>
                                    <svg className="w-5 h-5 text-m3-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="space-y-1.5 text-xs text-m3-on-surface-variant mb-4 font-sans">
                                    <p>• Premium SUV</p>
                                    <p>• 6-7 Passengers + Driver</p>
                                    <p>• Rate: ₹18/km</p>
                                </div>
                            </div>
                            <div className="bg-m3-surface-container-low rounded-m3-md p-3 border border-m3-outline-variant/60">
                                <p className="text-m3-on-surface-variant text-badge font-semibold mb-0.5">Estimated Cost</p>
                                <p className="text-2xl font-black text-m3-on-surface font-heading">₹{costs.innova.toLocaleString('en-IN')}</p>
                            </div>
                        </div>
                    </div>

                    {/* Important Notes */}
                    <div className="bg-m3-surface-container-low border border-m3-outline-variant rounded-m3-lg p-4 font-sans">
                        <h4 className="font-bold text-m3-on-surface mb-2 flex items-center text-xs uppercase tracking-wider font-heading">
                            <svg className="w-4 h-4 mr-1.5 text-m3-primary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Important Notes
                        </h4>
                        <ul className="text-xs text-m3-on-surface-variant space-y-1 font-normal">
                            <li>• Prices are indicative and calculated based on round-trip kilometers</li>
                            <li>• Driver allowance (Bata) is included</li>
                            <li>• Fastag toll charges and parking fees are additional as per actuals</li>
                            <li>• Final booking confirmation handled directly via WhatsApp</li>
                        </ul>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <WhatsAppButton
                            onClick={handleWhatsApp}
                            variant="filled"
                            size="md"
                            className="flex-1"
                            text="Confirm via WhatsApp"
                        />
                        <button
                            onClick={closeModal}
                            className="flex-1 bg-m3-surface-container hover:bg-m3-surface-container-high text-m3-on-surface font-semibold py-3.5 rounded-m3-full transition cursor-pointer text-sm"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TariffCalculator;
