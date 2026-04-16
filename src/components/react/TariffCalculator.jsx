import React, { useState, useEffect } from 'react';
import trips from '../../data/trips.json';
import { trackEvent } from '../../lib/analytics';

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
                const durationDays = parseInt(foundTrip.duration); // Assumes "2 Days" format
                const driverBata = 300 * durationDays;
                const etiosCost = (totalKm * 13) + driverBata;
                const innovaCost = (totalKm * 18) + driverBata;

                setActiveTrip(foundTrip);
                setCosts({
                    etios: etiosCost,
                    innova: innovaCost,
                    bata: driverBata,
                    totalKm,
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
            // Focus the modal container or first button
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
        window.open(`https://wa.me/919952749408?text=${message}`, '_blank');
    };

    if (!isOpen || !activeTrip) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={closeModal}
                aria-hidden="true"
            />

            {/* Modal */}
            <div
                ref={modalRef}
                className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-fade-in-up outline-none"
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
                tabIndex={-1}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-2xl">
                    <div className="flex justify-between items-center">
                        <h3 id="modal-title" className="text-2xl font-bold">Trip Calculator</h3>
                        <button
                            onClick={closeModal}
                            className="text-white hover:text-gray-200 transition focus:outline-none focus:ring-2 focus:ring-white rounded p-1"
                            aria-label="Close Calculator"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <p className="text-blue-100 mt-2">Estimated pricing for {activeTrip.title}</p>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Trip Details */}
                    <div className="bg-gray-50 rounded-xl p-5">
                        <h4 className="font-semibold text-gray-900 mb-3">Trip Details</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-gray-600 block">One Way Distance</span>
                                <p className="font-semibold text-gray-900">{activeTrip.kmOneWay} km</p>
                            </div>
                            <div>
                                <span className="text-gray-600 block">Total Distance</span>
                                <p className="font-semibold text-gray-900">{costs.totalKm} km</p>
                            </div>
                            <div>
                                <span className="text-gray-600 block">Duration</span>
                                <p className="font-semibold text-gray-900">{activeTrip.duration}</p>
                            </div>
                            <div>
                                <span className="text-gray-600 block">Driver Bata (Included)</span>
                                <p className="font-semibold text-gray-900">₹{costs.bata}</p>
                            </div>
                        </div>
                    </div>

                    {/* Pricing Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Etios Card */}
                        <div className="border-2 border-blue-200 rounded-xl p-5 hover:border-blue-400 transition">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="font-bold text-lg text-gray-900">Toyota Etios</h4>
                                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="space-y-2 text-sm text-gray-600 mb-4">
                                <p>• Comfortable Sedan</p>
                                <p>• 4 Passengers + Driver</p>
                                <p>• Rate: ₹13/km</p>
                            </div>
                            <div className="bg-blue-50 rounded-lg p-3">
                                <p className="text-gray-600 text-sm mb-1">Estimated Cost</p>
                                <p className="text-2xl font-bold text-blue-600">₹{costs.etios.toLocaleString('en-IN')}</p>
                            </div>
                        </div>

                        {/* Innova Card */}
                        <div className="border-2 border-green-200 rounded-xl p-5 hover:border-green-400 transition">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="font-bold text-lg text-gray-900">Toyota Innova</h4>
                                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <div className="space-y-2 text-sm text-gray-600 mb-4">
                                <p>• Premium SUV</p>
                                <p>• 6-7 Passengers + Driver</p>
                                <p>• Rate: ₹18/km</p>
                            </div>
                            <div className="bg-green-50 rounded-lg p-3">
                                <p className="text-gray-600 text-sm mb-1">Estimated Cost</p>
                                <p className="text-2xl font-bold text-green-600">₹{costs.innova.toLocaleString('en-IN')}</p>
                            </div>
                        </div>
                    </div>

                    {/* Important Notes */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2 flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Important Notes
                        </h4>
                        <ul className="text-sm text-yellow-800 space-y-1">
                            <li>• Prices are indicative and may vary based on season</li>
                            <li>• Driver allowance (Bata) is included</li>
                            <li>• Toll charges and parking fees are additional</li>
                            <li>• Final pricing will be confirmed via WhatsApp</li>
                        </ul>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={handleWhatsApp}
                            className="flex-1 bg-green-600 text-white font-semibold py-3 rounded-xl hover:bg-green-700 transition flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                        >
                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                            </svg>
                            Confirm via WhatsApp
                        </button>
                        <button
                            onClick={closeModal}
                            className="flex-1 bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-300 transition focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
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
