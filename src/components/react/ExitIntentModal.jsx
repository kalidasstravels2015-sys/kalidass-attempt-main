import React, { useState, useEffect } from "react";
import WhatsAppButton from "./WhatsAppButton.jsx";
import { buildWhatsAppUrl } from "../../utils/whatsapp";

export default function ExitIntentModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState("1-4");
  const [tripType, setTripType] = useState("outstation");
  const [pickup, setPickup] = useState("");
  const [drop, setDrop] = useState("");
  
  // Date calculation: default to tomorrow
  const getTomorrowDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  };
  const getTodayDate = () => new Date().toISOString().split("T")[0];

  const [travelDate, setTravelDate] = useState(getTomorrowDate());
  const [pickupTime, setPickupTime] = useState("06:00 AM");

  useEffect(() => {
    // Only run on client
    if (typeof window === "undefined") return;

    const handleOpenEvent = () => setIsOpen(true);
    window.addEventListener("open-fleet-modal", handleOpenEvent);

    // Support URL trigger (?fleet_modal=true or #quick-fleet) for testing/direct access
    if (
      window.location.hash === "#quick-fleet" ||
      new URLSearchParams(window.location.search).get("fleet_modal") === "true"
    ) {
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

    // 2. Mobile/Tablet: Idle timer after 50 seconds
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
      name: "Sedan",
      vehicle: "Swift Dzire / Toyota Etios",
      rate: "Starting ₹14/km",
      note: "Perfect for couples, airport transfers & small family trips.",
    },
    "4-7": {
      name: "SUV / MPV",
      vehicle: "Toyota Innova Crysta / Ertiga",
      rate: "Starting ₹22/km",
      note: "Top recommendation for Tirupati Darshan, family & luggage.",
    },
    "8-14": {
      name: "Tempo Traveller",
      vehicle: "Force Urbania / 12-14s Tempo",
      rate: "Starting ₹24/km",
      note: "Spacious luxury recliners, individual AC vents & ample luggage capacity.",
    },
    "15+": {
      name: "Group Coach",
      vehicle: "18-26s Tempo / Executive Coach",
      rate: "Starting ₹28/km",
      note: "Ideal for wedding guest logistics, corporate outings & large yatras.",
    },
  };

  const currentRec = vehicleRecommendations[selectedGroup] || vehicleRecommendations["1-4"];

  const tripTypes = [
    { id: "outstation", label: "Outstation", icon: "🛣️" },
    { id: "airport", label: "Airport MAA", icon: "🛫" },
    { id: "local", label: "Local City", icon: "🏙️" },
    { id: "temple", label: "Temple Tour", icon: "🛕" },
  ];

  // Contextual destination suggestion chips based on trip type
  const getDestinationSuggestions = () => {
    switch (tripType) {
      case "airport":
        return ["Chennai Airport (MAA) Drop", "Chennai Airport (MAA) Pickup"];
      case "local":
        return ["8 Hr / 80 Km Package", "4 Hr / 40 Km Package", "Chennai City Sightseeing"];
      case "temple":
        return ["Tirupati Balaji Package", "Kumbakonam 9 Navagraha", "Thiruvannamalai", "Kanchipuram"];
      case "outstation":
      default:
        return ["Pondicherry", "Tirupati", "Bangalore", "Mahabalipuram", "Vellore"];
    }
  };

  const pickupSuggestions = ["Airport (MAA)", "Anna Nagar", "Velachery", "T. Nagar", "OMR", "Tambaram"];
  const timeSuggestions = ["05:00 AM", "06:00 AM", "07:00 AM", "09:00 AM", "Immediate"];

  const buildFinalWhatsAppMessage = () => {
    const tripTypeLabels = {
      outstation: "Outstation Highway Trip",
      airport: "Chennai Airport Transfer",
      local: "Local Chennai City Package",
      temple: "Temple / Pilgrimage Tour",
    };

    const lines = [
      `*Kalidass Travels - Cab Booking / Fare Quote*`,
      `• Service: ${tripTypeLabels[tripType] || "Cab Booking"}`,
      `• Vehicle: ${currentRec.vehicle} (${selectedGroup} Passengers)`,
      pickup ? `• Pickup Location: ${pickup.trim()}` : `• Pickup Location: Chennai`,
      drop ? `• Destination / Drop: ${drop.trim()}` : null,
      travelDate ? `• Travel Date: ${travelDate}` : null,
      pickupTime ? `• Pickup Time: ${pickupTime}` : null,
      `• Indicative Rate: ${currentRec.rate}`,
      `• Advance Required: ₹0 (Pay post-trip)`,
      `• Source: Website Quick Fleet Match`,
      ``,
      `Please confirm cab availability and total all-inclusive fare.`,
    ].filter(Boolean);

    return lines.join("\n");
  };

  const buildQuickMessage = () => {
    return `Hi Kalidass Travels, I need a quick quote for a ${currentRec.vehicle} (${selectedGroup} passengers). Please share pricing and availability.`;
  };

  return (
    <div
      data-hide-contact-dock
      role="dialog"
      aria-modal="true"
      aria-labelledby="exit-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="relative w-full max-w-lg max-h-[92dvh] sm:max-h-[88vh] flex flex-col bg-m3-surface-container-lowest rounded-m3-2xl shadow-m3-4 border border-m3-outline-variant overflow-hidden transform transition-all">
        {/* Modal Header */}
        <div className="relative px-5 pt-5 pb-3 border-b border-m3-outline-variant/60 bg-m3-surface-container-low shrink-0">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-m3-surface-container-high hover:bg-m3-surface-container-highest text-m3-on-surface-variant hover:text-m3-on-surface flex items-center justify-center transition-colors text-lg"
            aria-label="Close dialog"
          >
            &times;
          </button>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-m3-primary-container text-m3-on-primary-container text-[11px] font-semibold mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-m3-primary animate-pulse"></span>
            10-Second Quick Quote · 0% Advance
          </div>
          <h3
            id="exit-modal-title"
            className="text-lg sm:text-xl font-extrabold text-m3-on-surface tracking-tight"
          >
            Quick Cab Booking & Fare Estimate
          </h3>
          <p className="text-xs text-m3-on-surface-variant mt-0.5">
            Provide journey details below to receive a complete confirmed quote with zero back-and-forth chat.
          </p>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          {/* Step 1: Passenger Count & Vehicle Fleet */}
          <div>
            <label className="block text-xs font-bold text-m3-on-surface mb-1.5">
              1. Passenger Count & Fleet Choice <span className="text-m3-primary">*</span>
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { id: "1-4", label: "1 - 4", sub: "Sedan" },
                { id: "4-7", label: "4 - 7", sub: "Innova/SUV" },
                { id: "8-14", label: "8 - 14", sub: "Tempo" },
                { id: "15+", label: "15+", sub: "Coach" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedGroup(opt.id)}
                  className={`py-2 px-1.5 rounded-m3-md text-center transition-all border ${
                    selectedGroup === opt.id
                      ? "bg-m3-primary text-m3-on-primary border-m3-primary shadow-m3-1"
                      : "bg-m3-surface-container text-m3-on-surface border-m3-outline-variant hover:bg-m3-surface-container-high"
                  }`}
                >
                  <div className="font-extrabold text-xs">{opt.label}</div>
                  <div className={`text-[10px] leading-tight ${selectedGroup === opt.id ? "text-m3-on-primary/90" : "text-m3-on-surface-variant"}`}>
                    {opt.sub}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Trip Type */}
          <div>
            <label className="block text-xs font-bold text-m3-on-surface mb-1.5">
              2. Trip Type / Service <span className="text-m3-primary">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {tripTypes.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setTripType(t.id);
                    if (t.id === "airport" && !drop) setDrop("Chennai Airport (MAA)");
                  }}
                  className={`py-2 px-2 rounded-m3-md text-xs font-bold flex items-center justify-center gap-1.5 transition-all border ${
                    tripType === t.id
                      ? "bg-emerald-700 text-white border-emerald-800 shadow-m3-1"
                      : "bg-m3-surface-container text-m3-on-surface border-m3-outline-variant hover:bg-m3-surface-container-high"
                  }`}
                >
                  <span>{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Step 3: Route Details (Pickup Area & Destination) */}
          <div className="space-y-3 p-3 rounded-m3-xl bg-m3-surface-container-low border border-m3-outline-variant">
            {/* Pickup Location */}
            <div>
              <label htmlFor="modal-pickup-location" className="font-bold text-m3-on-surface mb-1 flex items-center justify-between">
                <span>Pickup Area in Chennai <span class="text-m3-primary">*</span></span>
                <span className="text-[10px] font-normal text-m3-on-surface-variant">Where cab should report</span>
              </label>
              <input
                id="modal-pickup-location"
                type="text"
                value={pickup}
                onChange={(e) => setPickup(e.target.value)}
                placeholder="e.g. Anna Nagar West, Velachery, T. Nagar, Airport"
                className="w-full bg-m3-surface border border-m3-outline-variant rounded-m3-md px-3 py-2 text-xs text-m3-on-surface focus:outline-none focus:ring-2 focus:ring-m3-primary focus:border-m3-primary"
              />
              <div className="flex flex-wrap gap-1 mt-1.5">
                <span className="text-[10px] text-m3-on-surface-variant self-center mr-0.5">Quick:</span>
                {pickupSuggestions.map((area) => (
                  <button
                    key={area}
                    type="button"
                    onClick={() => setPickup(area)}
                    className="px-2 py-0.5 rounded-full bg-m3-surface border border-m3-outline-variant hover:border-m3-primary text-[10px] font-medium text-m3-on-surface transition-colors"
                  >
                    {area}
                  </button>
                ))}
              </div>
            </div>

            {/* Destination / Drop */}
            <div>
              <label htmlFor="modal-drop-location" className="font-bold text-m3-on-surface mb-1 flex items-center justify-between">
                <span>Destination / Route <span class="text-m3-primary">*</span></span>
                <span className="text-[10px] font-normal text-m3-on-surface-variant">Drop location or package</span>
              </label>
              <input
                id="modal-drop-location"
                type="text"
                value={drop}
                onChange={(e) => setDrop(e.target.value)}
                placeholder="e.g. Pondicherry, Tirupati, MAA Airport, City Tour"
                className="w-full bg-m3-surface border border-m3-outline-variant rounded-m3-md px-3 py-2 text-xs text-m3-on-surface focus:outline-none focus:ring-2 focus:ring-m3-primary focus:border-m3-primary"
              />
              <div className="flex flex-wrap gap-1 mt-1.5">
                <span className="text-[10px] text-m3-on-surface-variant self-center mr-0.5">Top:</span>
                {getDestinationSuggestions().map((dest) => (
                  <button
                    key={dest}
                    type="button"
                    onClick={() => setDrop(dest)}
                    className="px-2 py-0.5 rounded-full bg-m3-surface border border-m3-outline-variant hover:border-emerald-600 text-[10px] font-medium text-m3-on-surface transition-colors"
                  >
                    {dest}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Step 4: Travel Date & Pickup Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label htmlFor="modal-travel-date" className="font-bold text-m3-on-surface mb-1 block">
                Travel Date <span className="text-m3-primary">*</span>
              </label>
              <input
                id="modal-travel-date"
                type="date"
                min={getTodayDate()}
                value={travelDate}
                onChange={(e) => setTravelDate(e.target.value)}
                className="w-full bg-m3-surface border border-m3-outline-variant rounded-m3-md px-3 py-2 text-xs text-m3-on-surface focus:outline-none focus:ring-2 focus:ring-m3-primary"
              />
            </div>
            <div>
              <label htmlFor="modal-pickup-time" className="font-bold text-m3-on-surface mb-1 block">
                Pickup Time <span className="text-m3-primary">*</span>
              </label>
              <input
                id="modal-pickup-time"
                type="text"
                value={pickupTime}
                onChange={(e) => setPickupTime(e.target.value)}
                placeholder="06:00 AM"
                className="w-full bg-m3-surface border border-m3-outline-variant rounded-m3-md px-3 py-2 text-xs text-m3-on-surface focus:outline-none focus:ring-2 focus:ring-m3-primary"
              />
              <div className="flex flex-wrap gap-1 mt-1">
                {timeSuggestions.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setPickupTime(t)}
                    className={`px-1.5 py-0.5 rounded text-[10px] border transition-colors ${
                      pickupTime === t
                        ? "bg-m3-primary text-m3-on-primary border-m3-primary font-bold"
                        : "bg-m3-surface-container border-m3-outline-variant text-m3-on-surface"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Recommended Fleet Summary Strip */}
          <div className="bg-emerald-500/10 rounded-m3-xl p-3 border border-emerald-500/30 flex items-center justify-between gap-2">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 block">
                Recommended Fleet Match
              </span>
              <span className="text-xs font-bold text-m3-on-surface block">
                {currentRec.vehicle}
              </span>
              <span className="text-[11px] text-m3-on-surface-variant block">
                {currentRec.note}
              </span>
            </div>
            <div className="text-right shrink-0">
              <span className="text-xs sm:text-sm font-extrabold text-emerald-700 dark:text-emerald-400 font-heading block">
                {currentRec.rate}
              </span>
              <span className="text-[10px] text-m3-on-surface-variant">0% Advance · Pay Post-Trip</span>
            </div>
          </div>
        </div>

        {/* Modal Footer / CTAs */}
        <div className="p-4 bg-m3-surface-container-low border-t border-m3-outline-variant/60 shrink-0 space-y-2.5">
          <WhatsAppButton
            href={buildWhatsAppUrl(buildFinalWhatsAppMessage())}
            className="w-full py-3 text-sm font-bold shadow-m3-2 justify-center"
            size="md"
            variant="filled"
          >
            <span>Confirm & Send to WhatsApp Desk</span>
            <span className="text-base">➔</span>
          </WhatsAppButton>

          <div className="flex items-center justify-between text-[11px] text-m3-on-surface-variant pt-1 px-1">
            <a
              href="tel:+918939539211"
              className="inline-flex items-center gap-1 font-bold text-m3-on-surface hover:text-m3-primary transition-colors"
            >
              <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
              <span>Call: +91 89395 39211</span>
            </a>

            <a
              href={buildWhatsAppUrl(buildQuickMessage())}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="text-m3-primary hover:underline font-semibold"
            >
              Skip details & chat directly ➔
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
