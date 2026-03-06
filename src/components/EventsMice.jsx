import React, { useState } from 'react';
import {
    Users,
    MapPin,
    Calendar,
    ClipboardCheck,
    Phone,
    Mail,
    ArrowRight,
    CheckCircle,
    ChevronDown,
    ChevronUp,
    Megaphone,
    UserCheck,
    Download,
    MessageCircle
} from 'lucide-react';
import jsPDF from 'jspdf';

// --- Sub-Components ---

const FleetRow = ({ vehicle, seats, package12hr, extras, features }) => (
    <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
        <td className="p-5 align-top">
            <div className="font-bold text-slate-900 text-lg">{vehicle}</div>
            <div className="inline-flex items-center mt-1 text-slate-500 text-sm bg-slate-100 px-2 py-0.5 rounded">
                <Users className="w-3 h-3 mr-1" /> {seats} Seater
            </div>
            {/* Mobile View for Price */}
            <div className="md:hidden mt-3">
                <div className="font-bold text-slate-900 text-xl">{package12hr}</div>
                <div className="text-xs text-slate-500">Full Day (12 Hrs)</div>
            </div>
        </td>
        <td className="p-5 align-top hidden md:table-cell">
            <div className="font-bold text-slate-900 text-xl">{package12hr}</div>
            <div className="text-xs text-slate-500">Full Day (12 Hrs)</div>
        </td>
        <td className="p-5 align-top">
            <div className="text-sm text-slate-700 font-medium">{extras}</div>
            <div className="text-xs text-slate-500 mt-1">Day Bata Included</div>
            <div className="text-xs text-slate-500 mt-0.5">+ Tolls & Parking</div>
        </td>
        <td className="p-5 align-top hidden sm:table-cell">
            <ul className="text-sm text-slate-600 space-y-1">
                {features.map((feat, idx) => (
                    <li key={idx} className="flex items-center">
                        <CheckCircle className="w-3 h-3 text-green-500 mr-2 flex-shrink-0" />
                        {feat}
                    </li>
                ))}
            </ul>
        </td>
    </tr>
);

const FeatureBox = ({ icon: Icon, title, desc }) => (
    <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-lg transition-all text-left group">
        <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <Icon className="w-6 h-6" />
        </div>
        <h3 className="font-bold text-slate-900 mb-2 text-lg">{title}</h3>
        <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
    </div>
);

const AccordionItem = ({ question, answer, isOpen, onClick }) => (
    <div className="border-b border-slate-200 last:border-0">
        <button
            className="w-full py-4 px-2 flex justify-between items-center text-left focus:outline-none hover:bg-slate-50 transition-colors"
            onClick={onClick}
        >
            <span className="font-semibold text-slate-900 text-sm md:text-base pr-4">{question}</span>
            {isOpen ? <ChevronUp className="w-5 h-5 text-blue-600 flex-shrink-0" /> : <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />}
        </button>
        {isOpen && (
            <div className="px-2 pb-6 text-slate-600 text-sm leading-relaxed">
                {answer}
            </div>
        )}
    </div>
);

export default function EventsMice() {
    const [openFaq, setOpenFaq] = useState(0);
    const [showQuoteForm, setShowQuoteForm] = useState(false);
    const [formData, setFormData] = useState({
        companyName: '',
        address: '',
        gst: '',
        phone: '',
        email: ''
    });

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const generatePDF = () => {
        const doc = new jsPDF();
        const currentDate = new Date().toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });

        // Header - Kalidass Travels
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('KALIDASS TRAVELS', 105, 20, { align: 'center' });

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('No. 4/220, E88, Ponniamman Kovil Street, Annamalai Nagar,', 105, 27, { align: 'center' });
        doc.text('Medavakkam, Chennai - 600 100.', 105, 32, { align: 'center' });
        doc.text('GSTIN: 33COVPM0531D1Z4', 105, 37, { align: 'center' });
        doc.text('Phone: +91 90923 03060 | Email: bookings@kalidasstravels.in', 105, 42, { align: 'center' });

        // Line separator
        doc.setLineWidth(0.5);
        doc.line(20, 47, 190, 47);

        // Date
        doc.setFontSize(10);
        doc.text(`Date: ${currentDate}`, 20, 55);

        // To Address
        doc.setFont('helvetica', 'bold');
        doc.text('To,', 20, 65);
        doc.setFont('helvetica', 'normal');
        doc.text(formData.companyName || '[Company Name]', 20, 72);

        const addressLines = doc.splitTextToSize(formData.address || '[Company Address]', 170);
        let yPos = 77;
        addressLines.forEach(line => {
            doc.text(line, 20, yPos);
            yPos += 5;
        });

        if (formData.gst) {
            doc.text(`GST: ${formData.gst}`, 20, yPos + 2);
            yPos += 7;
        } else {
            yPos += 2;
        }

        // Subject
        doc.setFont('helvetica', 'bold');
        doc.text('Subject: Quotation for Events & MICE Transport Services', 20, yPos + 5);

        // Salutation
        doc.setFont('helvetica', 'normal');
        doc.text('Respected Sir/Madam,', 20, yPos + 15);

        // Introduction
        const intro = 'Thank you for your interest in our Event Logistics Services. We are pleased to present our fleet tariff for your upcoming event:';
        const introLines = doc.splitTextToSize(intro, 170);
        yPos += 22;
        introLines.forEach(line => {
            doc.text(line, 20, yPos);
            yPos += 5;
        });

        // Rate Sheet Table Header
        yPos += 8;
        doc.setFont('helvetica', 'bold');
        doc.setFillColor(15, 23, 42); // slate-900
        doc.rect(20, yPos, 170, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(11);
        doc.text('EVENT TRANSPORT TARIFF (Chennai)', 105, yPos + 5.5, { align: 'center' });

        yPos += 8;

        // Table Column Headers
        doc.setFillColor(226, 232, 240); // slate-200
        doc.rect(20, yPos, 170, 10, 'F');
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');

        // Column headers
        doc.text('Vehicle Type', 25, yPos + 6.5);
        doc.text('12 Hr Package', 70, yPos + 6.5);
        doc.text('Extras', 120, yPos + 6.5);
        doc.text('Features', 160, yPos + 6.5);

        yPos += 10;

        // Helper function to draw row
        const drawRow = (vehicle, packageRate, extras, features, isFirst = false) => {
            const rowHeight = 25;

            // Alternating background
            if (isFirst) {
                doc.setFillColor(240, 249, 255); // light blue
                doc.rect(20, yPos, 170, rowHeight, 'F');
            }

            // Column 1: Vehicle
            doc.setTextColor(0, 0, 0);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.text(vehicle, 22, yPos + 8);

            // Column 2: Package Rate
            doc.setFontSize(12);
            doc.setTextColor(22, 163, 74); // green
            doc.text(packageRate, 70, yPos + 8);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7);
            doc.setTextColor(100, 100, 100);
            doc.text('(+ 5% GST)', 70, yPos + 12);

            // Column 3: Extras
            doc.setFontSize(8);
            doc.setTextColor(60, 60, 60);
            const extraLines = doc.splitTextToSize(extras, 35);
            doc.text(extraLines, 120, yPos + 8);

            // Column 4: Features
            doc.setFontSize(7);
            doc.setTextColor(80, 80, 80);
            const featLines = doc.splitTextToSize(features, 35);
            doc.text(featLines, 160, yPos + 8);

            // Row border
            doc.setDrawColor(220, 220, 220);
            doc.setLineWidth(0.3);
            doc.line(20, yPos + rowHeight, 190, yPos + rowHeight);

            yPos += rowHeight;
        };

        // Draw Rows
        drawRow('Tempo Traveller / Urbania (12)', '₹7,500', 'Fuel Only\nDay Bata Included\n+ Tolls & Parking', 'Pushback Seats, AC Vents', true);
        drawRow('Urbania (21) / Mini Bus', '₹10,000', 'Fuel Only\nDay Bata Included\n+ Tolls & Parking', '2+2 Seating, PA System');
        drawRow('Volvo / Benz Coach (45)', '₹18,000', 'Fuel Only\nDay Bata Included\n+ Tolls & Parking', 'Air Suspension, Onboard Toilet');
        drawRow('Innova Crysta (7)', '₹7,500', 'Fuel Only\nDay Bata Included\n+ Tolls & Parking', 'VIP Guest Movement, Captain Seats');

        // Vertical column separators
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.3);
        const tableTop = yPos - 100; // Adjust based on rows
        doc.line(65, tableTop, 65, yPos);
        doc.line(115, tableTop, 115, yPos);
        doc.line(155, tableTop, 155, yPos);

        // Border around entire table
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.rect(20, tableTop, 170, yPos - tableTop);

        // Note
        yPos += 5;
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.setFont('helvetica', 'italic');
        doc.text('* GST 5% applicable. Tolls & Parking at actuals.', 25, yPos);

        // Closing
        yPos += 15;
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        const closing = 'We specialize in handling large-scale logistics with precision and reliability. We look forward to supporting your event.';
        doc.text(closing, 20, yPos);

        // Thank you
        yPos += 10;
        doc.text('Thank you for considering Kalidass Travels.', 20, yPos);

        // Signature
        yPos += 15;
        doc.setFont('helvetica', 'bold');
        doc.text('Yours Sincerely,', 20, yPos);
        yPos += 10;
        doc.text('Perumal Manikumar', 20, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text('Proprietor', 20, yPos + 5);
        doc.text('Kalidass Travels', 20, yPos + 10);

        // Footer
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text('This is a computer-generated quotation and does not require a signature.', 105, 285, { align: 'center' });

        // Save PDF
        const fileName = `Kalidass_Travels_Event_Quote_${formData.companyName.replace(/\s+/g, '_') || 'Event'}.pdf`;
        doc.save(fileName);

        // Reset form
        setShowQuoteForm(false);
        setFormData({
            companyName: '',
            address: '',
            gst: '',
            phone: '',
            email: ''
        });
    };

    const faqs = [
        {
            question: "Do you provide an on-ground coordinator?",
            answer: "Yes. For events with more than 5 vehicles, we assign a dedicated Transport Manager on-ground to handle parking, driver coordination, and guest boarding, ensuring you can focus on the event."
        },
        {
            question: "Can we brand the buses with our company logo?",
            answer: "Absolutely. We allow magnetic stickers or banners on the bus exterior and headrest covers inside. All branding material must be provided or approved 48 hours prior."
        },
        {
            question: "What happens if the event extends beyond booked hours?",
            answer: "We understand events run late. We offer a flexible buffer. Additional hours are billed at a pre-agreed hourly rate (approx ₹500-₹1000/hr depending on vehicle type)."
        },
        {
            question: "Do you handle outstation offsites (e.g., Pondicherry/Yelagiri)?",
            answer: "Yes. We specialize in outstation corporate retreats. Our packages include driver accommodation, state permits, and toll management for a seamless experience."
        }
    ];

    return (
        <div className="font-sans text-slate-900 bg-white">

            {/* 1. HERO SECTION */}
            <section className="relative bg-blue-900 text-white py-24 lg:py-32 overflow-visible pb-32 lg:pb-40">
                {/* Background Overlay */}
                <div className="absolute inset-0 z-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=2069&auto=format&fit=crop')] bg-cover bg-center"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-950 via-blue-900/90 to-transparent z-0"></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="max-w-4xl mx-auto text-center">
                        <span className="inline-block py-1 px-3 rounded-full bg-blue-800 border border-blue-500/30 text-blue-200 text-xs font-bold uppercase tracking-wider mb-6">
                            Events & MICE Logistics
                        </span>
                        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
                            Transport for <br />
                            <span className="text-blue-400">Large Crowds.</span>
                        </h1>
                        <p className="text-lg text-slate-300 mb-8 leading-relaxed max-w-2xl mx-auto">
                            From Annual General Meetings (AGM) to Team Offsites. We move 50 to 5000 people with military precision.
                        </p>
                        <div className="flex gap-4 justify-center">
                            <button className="bg-white text-blue-900 hover:bg-blue-50 px-8 py-3.5 rounded-lg font-bold transition-all flex items-center shadow-lg">
                                Plan Event Transport <ArrowRight className="w-5 h-5 ml-2" />
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* FLOATING 3D "WE HANDLE LOGISTICS FOR" CARD */}
            <div className="relative -mt-24 lg:-mt-32 mb-12 z-20">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-gradient-to-br from-white to-blue-50 rounded-3xl shadow-2xl border border-blue-100 p-8 md:p-10 transform hover:scale-[1.02] transition-all duration-300 hover:shadow-blue-200/50" style={{ boxShadow: '0 25px 50px -12px rgba(59, 130, 246, 0.25), 0 0 0 1px rgba(59, 130, 246, 0.1)' }}>
                        <div className="flex items-center justify-center mb-6">
                            <div className="bg-blue-600 text-white rounded-full p-3 mr-4">
                                <Calendar className="w-6 h-6" />
                            </div>
                            <h3 className="text-2xl md:text-3xl font-bold text-slate-900">We Handle Logistics For:</h3>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                            {[
                                "Corporate Annual Days",
                                "Team Offsites & Retreats",
                                "Factory/Site Visits",
                                "Weddings & Large Delegations"
                            ].map((item, idx) => (
                                <div key={idx} className="flex items-start bg-white rounded-xl p-4 shadow-sm border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all">
                                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                                    <span className="text-slate-700 font-medium text-sm">{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. FLEET RATE SHEET (High Capacity Focus) */}
            <section className="py-20 bg-slate-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-2xl mx-auto mb-12">
                        <h2 className="text-3xl font-bold text-slate-900">Event Fleet Packages</h2>
                        <p className="text-slate-500 mt-3">Standard 12-Hour disposal rates for Chennai City events.</p>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden max-w-5xl mx-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-100 text-slate-700 text-xs md:text-sm uppercase tracking-wider">
                                <tr>
                                    <th className="p-5 font-bold">Vehicle Type</th>
                                    <th className="p-5 font-bold hidden md:table-cell">12 Hr Package</th>
                                    <th className="p-5 font-bold">Extras</th>
                                    <th className="p-5 font-bold hidden sm:table-cell">Features</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                <FleetRow
                                    vehicle="Tempo Traveller / Urbania"
                                    seats="12"
                                    package12hr="₹7,500"
                                    extras="Fuel Only"
                                    features={["Pushback Seats", "AC Vents per seat", "Ample Luggage"]}
                                />
                                <FleetRow
                                    vehicle="Urbania / Mini Bus"
                                    seats="21"
                                    package12hr="₹10,000"
                                    extras="Fuel Only"
                                    features={["2+2 Seating", "PA System / Mic", "Aisle Space"]}
                                />
                                <FleetRow
                                    vehicle="Volvo / Benz Coach"
                                    seats="45"
                                    package12hr="₹18,000"
                                    extras="Fuel Only"
                                    features={["Air Suspension", "Reclining Seats", "Onboard Toilet"]}
                                />
                                <FleetRow
                                    vehicle="Innova Crysta"
                                    seats="7"
                                    package12hr="₹7,500"
                                    extras="Fuel Only"
                                    features={["VIP Guest Movement", "Captain Seats", "Fast Transit"]}
                                />
                            </tbody>
                        </table>
                        <div className="bg-blue-50 p-4 text-center text-xs text-blue-800 border-t border-blue-100">
                            <span className="font-bold">Note:</span> Rates exclusive of 5% GST. Tolls & Parking at actuals.
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. LOGISTICS FEATURES (The "Coordinator" USP) */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-slate-900">Why Event Managers Trust Us</h2>
                        <p className="text-slate-500 mt-2">We don't just supply buses; we manage the movement.</p>
                    </div>

                    <div className="grid md:grid-cols-4 gap-6">
                        <FeatureBox
                            icon={UserCheck}
                            title="On-Ground SPOC"
                            desc="A dedicated Transport Manager stationed at your venue to coordinate drivers and parking."
                        />
                        <FeatureBox
                            icon={MapPin}
                            title="Route Planning"
                            desc="We optimize pickup routes for large groups to ensure everyone reaches the venue on time."
                        />
                        <FeatureBox
                            icon={Megaphone}
                            title="Branding Ready"
                            desc="Buses available for magnetic stickers and banners. Make your corporate presence felt."
                        />
                        <FeatureBox
                            icon={ClipboardCheck}
                            title="Backup Fleet"
                            desc="We always keep 1 standby vehicle for every 10 vehicles booked. Zero panic moments."
                        />
                    </div>
                </div>
            </section>



            {/* 5. FAQ SECTION */}
            <section className="py-20 bg-white">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">Frequently Asked Questions</h2>
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        {faqs.map((faq, index) => (
                            <AccordionItem
                                key={index}
                                question={faq.question}
                                answer={faq.answer}
                                isOpen={openFaq === index}
                                onClick={() => setOpenFaq(openFaq === index ? -1 : index)}
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* QUOTATION DOWNLOAD SECTION */}
            <section className="py-20 bg-gradient-to-br from-blue-50 to-white">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">
                            Download Event Rate Card
                        </h2>
                        <p className="text-slate-600">
                            Get our event fleet tariff in a professional PDF format
                        </p>
                    </div>

                    {!showQuoteForm ? (
                        <div className="flex flex-col md:flex-row justify-center gap-6">
                            <div className="text-center">
                                <button
                                    onClick={() => setShowQuoteForm(true)}
                                    className="inline-flex items-center gap-3 bg-blue-900 hover:bg-blue-800 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg shadow-blue-900/20 hover:shadow-xl hover:-translate-y-0.5 w-full md:w-auto justify-center"
                                >
                                    <Download className="w-6 h-6" />
                                    Generate Rate Card PDF
                                </button>
                                <p className="text-sm text-slate-500 mt-3">
                                    Instant PDF download with event rates
                                </p>
                            </div>

                            <div className="text-center">
                                <a
                                    href="mailto:bookings@kalidasstravels.in?subject=Custom%20Quotation%20Request%20-%20Events%20MICE&body=Dear%20Kalidass%20Travels%20Team%2C%0A%0AI%20would%20like%20to%20request%20a%20custom%20quotation%20for%20Event%20Transport%20Services.%0A%0ACompany%20Details%3A%0AName%3A%20%5BYour%20Company%20Name%5D%0AAddress%3A%20%5BYour%20Company%20Address%5D%0A%0AEvent%20Details%3A%0A-%20Event%20Type%3A%20%0A-%20Date%20%26%20Time%3A%20%0A-%20Venue%3A%20%0A-%20Expected%20Guest%20Count%3A%20%0A-%20Vehicle%20Requirements%20(Bus/Traveller/Car)%3A%20%0A%0APlease%20provide%20a%20detailed%20plan%20and%20quote.%0A%0AThank%20you%2C%0A%5BYour%20Name%5D"
                                    className="inline-flex items-center gap-3 bg-white hover:bg-blue-50 border-2 border-blue-900 text-blue-900 px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 w-full md:w-auto justify-center"
                                >
                                    <Mail className="w-6 h-6" />
                                    Send Custom Request
                                </a>
                                <p className="text-sm text-slate-500 mt-3">
                                    For specific requirements via Email
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-slate-900">Enter Company Details</h3>
                                <button
                                    onClick={() => setShowQuoteForm(false)}
                                    className="text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    <ChevronUp className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="space-y-5">
                                {/* Company Name */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Company Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="companyName"
                                        value={formData.companyName}
                                        onChange={handleInputChange}
                                        placeholder="e.g., ABC Technologies Pvt Ltd"
                                        required
                                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    />
                                </div>

                                {/* Address */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Company Address <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        name="address"
                                        value={formData.address}
                                        onChange={handleInputChange}
                                        placeholder="e.g., 123 OMR, Thoraipakkam, Chennai - 600097"
                                        required
                                        rows="3"
                                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                                    />
                                </div>

                                {/* GST Number */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        GST Number <span className="text-slate-400 text-xs">(Optional)</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="gst"
                                        value={formData.gst}
                                        onChange={handleInputChange}
                                        placeholder="e.g., 33XXXXX1234X1ZX"
                                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    />
                                </div>

                                {/* Phone and Email in Grid */}
                                <div className="grid md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            Phone <span className="text-slate-400 text-xs">(Optional)</span>
                                        </label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            placeholder="e.g., +91 98765 43210"
                                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            Email <span className="text-slate-400 text-xs">(Optional)</span>
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            placeholder="e.g., hr@company.com"
                                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="pt-4 space-y-3">
                                    <button
                                        onClick={generatePDF}
                                        disabled={!formData.companyName || !formData.address}
                                        className="w-full bg-blue-900 hover:bg-blue-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-8 py-4 rounded-lg font-bold text-lg transition-all shadow-lg flex items-center justify-center gap-3"
                                    >
                                        <Download className="w-5 h-5" />
                                        Download Quotation PDF
                                    </button>

                                    <p className="text-xs text-slate-500 text-center mt-3">
                                        A professional quotation letter will be generated with our rate sheet
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* 6. FOOTER CTA - WhatsApp */}
            <section className="bg-gradient-to-br from-blue-900 to-blue-950 text-white py-16 border-t border-blue-800">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <div className="mb-6">
                        <MessageCircle className="w-16 h-16 mx-auto mb-4 animate-pulse text-blue-400" />
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">Plan Your Event Transport</h2>
                    <p className="text-blue-200 text-lg mb-8 max-w-2xl mx-auto">
                        Connect with our Event Logistics Team for a custom plan and bulk rates.
                    </p>
                    <a
                        href="https://wa.me/919092303060?text=Hi%2C%20I%27m%20planning%20an%20event%20and%20need%20transport%20services.%20Can%20we%20chat%3F"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-3 bg-white text-blue-900 hover:bg-blue-50 px-10 py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
                    >
                        <MessageCircle className="w-6 h-6" />
                        Chat on WhatsApp
                    </a>
                    <p className="text-blue-300 text-sm mt-6">
                        💬 Typical response time: Under 5 minutes
                    </p>
                </div>
            </section>

        </div>
    );
}
