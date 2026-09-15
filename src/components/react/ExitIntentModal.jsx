import React, { useState, useEffect } from "react";
import WhatsAppButton from "./WhatsAppButton.jsx";

export default function ExitIntentModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState("4-7");

  useEffect(() => {
    // Only run on client
    if (typeof window === "undefined") return;

    const handleOpenEvent = () => setIsOpen(true);
    window.addEventListener("open-fleet-modal", handleOpenEvent);

    // Support URL trigger (?fleet_modal=true or #quick-fleet) for testing/direct access
    if (window.location.hash === "#quick-fleet" || new URLSearchParams(window.location.search).get("fleet_modal") === "true") {
      setIsOpen(true);
    }

    // Check if dismissed in this session for automated exit-intent
    if (sessionStorage.getItem("kalidass_exit_modal_shown")) {
      return () => {
        window.removeEventListener("open-fleet-modal", handleOpenEvent);
      };
    }

    // 1. Desktop: Mouse leaves top of document
    const handleMouseLeave = (e) => {
      if (e.clientY <= 5 && !sessionStorage.getItem("kalidass_exit_modal_shown")) {
        setIsOpen(true);
        sessionStorage.setItem("kalidass_exit_modal_shown", "true");
      }
    };

    // 2. Mobile: Idle timer after 50 seconds
    const timer = setTimeout(() => {
      if (!sessionStorage.getItem("kalidass_exit_modal_shown")) {
        setIsOpen(true);
        sessionStorage.setItem("kalidass_exit_modal_shown", "true");
      }
    }, 50000);

    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("open-fleet-modal", handleOpenEvent);
      document.removeEventListener("mouseleave", handleMouseLeave);
      clearTimeout(timer);
    };
  }, []);

  const handleClose = () => {
    setIsOpen(false);
  };

  if (!isOpen) return null;

  const vehicleRecommendations = {
    "1-4": {
      vehicle: "Swift Dzire / Toyota Etios",
      rate: "Starting ₹14/km",
      note: "Perfect for couples, airport runs & small family day trips.",
      whatsappText: "Hi Kalidass Travels, I need a quote for a 1-4 passenger Sedan (Dzire/Etios).",
    },
    "4-7": {
      vehicle: "Toyota Innova Crysta",
      rate: "Starting ₹22/km",
      note: "Top recommendation for Tirupati Darshan & hill stations with luggage.",
      whatsappText: "Hi Kalidass Travels, I need a quote for a 4-7 passenger Innova Crysta.",
    },
    "8-14": {
      vehicle: "Force Urbania / 12-14s Tempo Traveller",
      rate: "Starting ₹24/km",
      note: "Spacious luxury recliners, individual AC vents & high luggage capacity.",
      whatsappText: "Hi Kalidass Travels, I need a quote for an 8-14 passenger Urbania/Tempo Traveller.",
    },
    "15+": {
      vehicle: "18-26s Tempo Traveller / Executive Coach",
      rate: "Starting ₹28/km",
      note: "Ideal for wedding guest logistics and large temple group yatras.",
      whatsappText: "Hi Kalidass Travels, I need a quote for a 15+ passenger group coach/Tempo.",
    },
  };

  const currentRec = vehicleRecommendations[selectedGroup];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="exit-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="relative w-full max-w-lg bg-m3-surface-container-lowest rounded-m3-2xl shadow-m3-4 border border-m3-outline-variant overflow-hidden transform transition-all p-6 sm:p-7">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-m3-surface-container-high hover:bg-m3-surface-container-highest text-m3-on-surface-variant hover:text-m3-on-surface flex items-center justify-center transition-colors text-lg"
          aria-label="Close dialog"
        >
          &times;
        </button>

        {/* Header */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-m3-primary-container text-m3-on-primary-container text-xs font-semibold mb-2">
            <span className="w-2 h-2 rounded-full bg-m3-primary animate-pulse"></span>
            Before You Go · Quick Fleet Match
          </div>
          <h3
            id="exit-modal-title"
            className="text-xl sm:text-2xl font-extrabold text-m3-on-surface tracking-tight"
          >
            Need Help Choosing the Right Vehicle?
          </h3>
          <p className="text-xs sm:text-sm text-m3-on-surface-variant mt-1">
            Tell us your passenger count and get an instant transparent fare estimate.
          </p>
        </div>

        {/* Passenger Count Selector */}
        <div className="mb-5">
          <label className="block text-xs font-semibold text-m3-on-surface-variant mb-2">
            How many passengers are traveling?
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { id: "1-4", label: "1 - 4" },
              { id: "4-7", label: "4 - 7" },
              { id: "8-14", label: "8 - 14" },
              { id: "15+", label: "15+" },
            ].map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setSelectedGroup(option.id)}
                className={`py-2 px-3 rounded-m3-md text-xs font-bold transition-all border ${
                  selectedGroup === option.id
                    ? "bg-m3-primary text-m3-on-primary border-m3-primary shadow-m3-1"
                    : "bg-m3-surface-container text-m3-on-surface border-m3-outline-variant hover:bg-m3-surface-container-high"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Vehicle Recommendation Card */}
        <div className="bg-m3-surface-container-low rounded-m3-xl p-4 border border-m3-outline-variant mb-6">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-m3-primary uppercase tracking-wider">
              Recommended Fleet
            </span>
            <span className="text-xs font-extrabold bg-m3-tertiary-container text-m3-on-tertiary-container px-2 py-0.5 rounded-m3-xs">
              {currentRec.rate}
            </span>
          </div>
          <h4 className="text-base font-extrabold text-m3-on-surface mb-1">
            {currentRec.vehicle}
          </h4>
          <p className="text-xs text-m3-on-surface-variant leading-relaxed">
            {currentRec.note}
          </p>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <WhatsAppButton
            href={`https://wa.me/919092303060?text=${encodeURIComponent(
              currentRec.whatsappText
            )}`}
            className="flex-1"
            size="md"
            variant="filled"
          >
            Get WhatsApp Quote
          </WhatsAppButton>
          <a
            href="tel:+919092303060"
            className="inline-flex items-center justify-center gap-1.5 py-3 px-4 rounded-m3-full bg-m3-surface-container-high hover:bg-m3-surface-container-highest text-m3-on-surface text-xs sm:text-sm font-bold transition-colors text-center border border-m3-outline-variant"
          >
            <span>Call +91 90923 03060</span>
          </a>
        </div>

        <div className="mt-3 text-center">
          <button
            type="button"
            onClick={handleClose}
            className="text-[11px] text-m3-on-surface-variant/70 hover:text-m3-on-surface underline"
          >
            I'll look around myself
          </button>
        </div>
      </div>
    </div>
  );
}
