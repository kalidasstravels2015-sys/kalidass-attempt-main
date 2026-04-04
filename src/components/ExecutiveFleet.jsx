import React, { useState } from 'react';
import {
    Crown,
    Star,
    Shield,
    UserCheck,
    Coffee,
    Wifi,
    Mail,
    ArrowRight,
    CheckCircle,
    ChevronDown,
    ChevronUp,
    Gem,
    Download,
    MessageCircle
} from 'lucide-react';

// --- Sub-Components ---

const RateRow = ({ vehicle, package8hr, extraKm, features }) => (
    <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
        <td className="p-5 align-top">
            <div className="font-bold text-slate-900 text-lg">{vehicle}</div>
            <div className="md:hidden mt-1 text-slate-500 text-sm">8hr/80km: {package8hr}</div>
        </td>
        <td className="p-5 align-top hidden md:table-cell">
            <div className="font-bold text-slate-900 text-xl">{package8hr}</div>
            <div className="text-xs text-slate-500">+ GST (18%)</div>
        </td>
        <td className="p-5 align-top">
            <div className="text-sm text-slate-700 font-medium">Extra Km: {extraKm}</div>
            <div className="text-xs text-slate-500 mt-1">Extra Hr: ₹1000/hr (Approx)</div>
        </td>
        <td className="p-5 align-top hidden sm:table-cell">
            <ul className="text-sm text-slate-600 space-y-1">
                {features.map((feat, idx) => (
                    <li key={idx} className="flex items-center">
                        <Star className="w-3 h-3 text-yellow-500 mr-2 flex-shrink-0" />
                        {feat}
                    </li>
                ))}
            </ul>
        </td>
    </tr>
);

const FleetShowcase = ({ title, img, desc }) => (
    <div className="group relative rounded-xl overflow-hidden aspect-[16/9] shadow-md">
        <img src={img} alt={title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-6">
            <h3 className="text-white font-bold text-xl mb-1">{title}</h3>
            <p className="text-slate-300 text-sm">{desc}</p>
        </div>
    </div>
);

const FeatureBox = ({ icon: Icon, title, desc }) => (
    <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-lg transition-all text-center">
        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-900">
            <Icon className="w-6 h-6" />
        </div>
        <h3 className="font-bold text-slate-900 mb-2">{title}</h3>
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
            {isOpen ? <ChevronUp className="w-5 h-5 text-slate-900 flex-shrink-0" /> : <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />}
        </button>
        {isOpen && (
            <div className="px-2 pb-6 text-slate-600 text-sm leading-relaxed">
                {answer}
            </div>
        )}
    </div>
);

export default function ExecutiveFleet() {
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

    const generatePDF = async () => {
        const { default: jsPDF } = await import('jspdf');
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
        doc.text('Subject: Quotation for Executive & VIP Fleet Services', 20, yPos + 5);

        // Salutation
        doc.setFont('helvetica', 'normal');
        doc.text('Respected Sir/Madam,', 20, yPos + 15);

        // Introduction
        const intro = 'Thank you for your interest in our Executive Fleet Services. We are pleased to present our premium vehicle tariff for your consideration:';
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
        doc.text('EXECUTIVE FLEET TARIFF (Chennai)', 105, yPos + 5.5, { align: 'center' });

        yPos += 8;

        // Table Column Headers
        doc.setFillColor(226, 232, 240); // slate-200
        doc.rect(20, yPos, 170, 10, 'F');
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');

        // Column headers
        doc.text('Vehicle Class', 25, yPos + 6.5);
        doc.text('8Hr / 80Km Package', 70, yPos + 6.5);
        doc.text('Overtime Rates', 120, yPos + 6.5);
        doc.text('Key Features', 160, yPos + 6.5);

        yPos += 10;

        // Helper function to draw row
        const drawRow = (vehicle, packageRate, overtime, features, isFirst = false) => {
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
            doc.text('(+ 18% GST)', 70, yPos + 12);

            // Column 3: Overtime
            doc.setFontSize(8);
            doc.setTextColor(60, 60, 60);
            const otLines = doc.splitTextToSize(overtime, 35);
            doc.text(otLines, 120, yPos + 8);

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
        drawRow('Toyota Camry (Hybrid)', '₹7,500', 'Extra Km: ₹75/km\nExtra Hr: ₹1000/hr', 'Eco-Friendly, Rear Seat Control', true);
        drawRow('Mercedes E-Class', '₹12,000', 'Extra Km: ₹120/km\nExtra Hr: ₹1200/hr', 'Long Wheelbase, Reclining Seats');
        drawRow('BMW 5 Series', '₹12,000', 'Extra Km: ₹120/km\nExtra Hr: ₹1200/hr', 'Sporty Comfort, Gesture Control');
        drawRow('Toyota Vellfire (Van)', '₹18,000', 'Extra Km: ₹180/km\nExtra Hr: ₹1800/hr', 'Business Class Seats, Lounge Mode');

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
        doc.text('* Luxury Tax (GST 18%) applicable. Tolls & Parking at actuals.', 25, yPos);

        // Closing
        yPos += 15;
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        const closing = 'We ensure the highest standards of luxury, discretion, and professionalism for your executive travel requirements.';
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
        const fileName = `Kalidass_Travels_Executive_Fleet_Quote_${formData.companyName.replace(/\s+/g, '_') || 'VIP'}.pdf`;
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
            question: "Are the chauffeurs English speaking?",
            answer: "Yes. For our Executive Fleet, we deploy only our 'Elite Category' chauffeurs. They are fluent in English, uniformed (Suit/Safari), and trained in corporate etiquette and discretion."
        },
        {
            question: "What amenities are included in the vehicle?",
            answer: "Every premium booking comes with complimentary mineral water bottles, tissues, hand sanitizer, and a daily newspaper. Wi-Fi dongles can be arranged upon prior request."
        },
        {
            question: "Is there a cancellation fee for premium cars?",
            answer: "Due to high demand for luxury vehicles, we require cancellation notice at least 4 hours prior to the booking time to avoid retention charges."
        },
        {
            question: "Do you support foreign delegations?",
            answer: "Absolutely. We have extensive experience handling convoys for international delegates, including coordination with security teams and airport meet-and-greet services."
        }
    ];

    return (
        <div className="font-sans text-slate-900 bg-white">

            {/* 1. HERO SECTION (Premium Dark Theme) */}
            <section className="relative bg-slate-950 text-white py-24 lg:py-32 overflow-hidden">
                {/* Background Overlay */}
                <div className="absolute inset-0 z-0 opacity-40 bg-[url('https://images.unsplash.com/photo-1563720223185-11003d516935?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent z-0"></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <div className="inline-flex items-center gap-2 py-1 px-3 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-200 text-xs font-bold uppercase tracking-wider mb-6">
                                <Crown className="w-3 h-3" /> VIP & Executive Fleet
                            </div>
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-medium tracking-tight mb-6 leading-tight">
                                Mobility for <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-500">
                                    Leadership.
                                </span>
                            </h1>
                            <p className="text-lg text-slate-300 mb-8 leading-relaxed border-l-2 border-yellow-500 pl-6">
                                When you move the C-Suite, every detail counts. Immaculate vehicles, elite chauffeurs, and absolute discretion.
                            </p>
                            <div className="flex gap-4">
                                <button className="bg-white text-slate-900 hover:bg-slate-100 px-8 py-3.5 rounded shadow-[0_0_20px_rgba(255,255,255,0.3)] font-bold transition-all flex items-center">
                                    Request Priority Booking <ArrowRight className="w-5 h-5 ml-2" />
                                </button>
                            </div>
                        </div>

                        {/* "Who is this for" Box (Gold Accent) */}
                        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-8 shadow-2xl">
                            <h3 className="text-lg font-bold text-white mb-6 font-serif">The Executive Standard</h3>
                            <ul className="space-y-4">
                                {[
                                    "Board Meetings & AGMs",
                                    "International Delegate Visits",
                                    "Airport VIP Meet & Greet",
                                    "High-Profile Event Transport"
                                ].map((item, idx) => (
                                    <li key={idx} className="flex items-center text-slate-200 text-sm">
                                        <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center mr-3 border border-yellow-500/30">
                                            <Gem className="w-4 h-4 text-yellow-400" />
                                        </div>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* 2. TRANSPARENT LUXURY RATES */}
            <section className="py-20 bg-slate-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-2xl mx-auto mb-12">
                        <h2 className="text-3xl font-bold text-slate-900 font-serif">Executive Rate Sheet</h2>
                        <p className="text-slate-500 mt-3">Premium packages for Chennai City usage (8 Hrs / 80 Kms).</p>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden max-w-5xl mx-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-900 text-white text-xs md:text-sm uppercase tracking-wider">
                                <tr>
                                    <th className="p-5 font-medium">Vehicle Class</th>
                                    <th className="p-5 font-medium hidden md:table-cell">8Hr Package</th>
                                    <th className="p-5 font-medium">Overtime Rates</th>
                                    <th className="p-5 font-medium hidden sm:table-cell">Inclusions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                <RateRow
                                    vehicle="Toyota Camry (Hybrid)"
                                    package8hr="₹7,500"
                                    extraKm="₹75 / km"
                                    features={["Eco-Friendly", "Rear Seat Control", "Silent Cabin"]}
                                />
                                <RateRow
                                    vehicle="Mercedes E-Class"
                                    package8hr="₹12,000"
                                    extraKm="₹120 / km"
                                    features={["Long Wheelbase", "Reclining Seats", "Luxury Interiors"]}
                                />
                                <RateRow
                                    vehicle="BMW 5 Series"
                                    package8hr="₹12,000"
                                    extraKm="₹120 / km"
                                    features={["Sporty Comfort", "Gesture Control", "Premium Sound"]}
                                />
                                <RateRow
                                    vehicle="Toyota Vellfire (Van)"
                                    package8hr="₹18,000"
                                    extraKm="₹180 / km"
                                    features={["Business Class Seats", "Privacy Glass", "Lounge Mode"]}
                                />
                            </tbody>
                        </table>
                        <div className="bg-slate-100 p-4 text-center text-xs text-slate-500 border-t border-slate-200">
                            <span className="font-bold text-slate-800">Note:</span> Luxury taxes (GST 18%) applicable. Parking & Tolls at actuals.
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. THE "WHITE GLOVE" STANDARD */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-slate-900 font-serif">The "White Glove" Experience</h2>
                        <p className="text-slate-500 mt-2">It's not just a car. It's a service standard.</p>
                    </div>

                    <div className="grid md:grid-cols-4 gap-8">
                        <FeatureBox
                            icon={UserCheck}
                            title="Elite Chauffeurs"
                            desc="Uniformed, English-speaking, and trained in defensive driving & confidentiality protocols."
                        />
                        <FeatureBox
                            icon={Shield}
                            title="Privacy Guaranteed"
                            desc="Discretion is our currency. Our chauffeurs sign NDAs and respect your privacy at all times."
                        />
                        <FeatureBox
                            icon={Coffee}
                            title="Onboard Amenities"
                            desc="Complimentary mineral water, daily newspaper, tissues, and hand sanitizer in every vehicle."
                        />
                        <FeatureBox
                            icon={Wifi}
                            title="Connected Travel"
                            desc="4G/5G Wi-Fi dongles available on request to ensure your mobile office never disconnects."
                        />
                    </div>
                </div>
            </section>



            {/* 5. FAQ SECTION */}
            <section className="py-20 bg-white">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center font-serif">Questions from Executive Assistants</h2>
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
            <section className="py-20 bg-gradient-to-br from-slate-50 to-white">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-slate-900 mb-4 font-serif">
                            Download Executive Rate Card
                        </h2>
                        <p className="text-slate-600">
                            Get our premium fleet tariff in a professional PDF format
                        </p>
                    </div>

                    {!showQuoteForm ? (
                        <div className="flex flex-col md:flex-row justify-center gap-6">
                            <div className="text-center">
                                <button
                                    onClick={() => setShowQuoteForm(true)}
                                    className="inline-flex items-center gap-3 bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg shadow-slate-900/20 hover:shadow-xl hover:-translate-y-0.5 w-full md:w-auto justify-center"
                                >
                                    <Download className="w-6 h-6" />
                                    Generate Rate Card PDF
                                </button>
                                <p className="text-sm text-slate-500 mt-3">
                                    Instant PDF download with executive rates
                                </p>
                            </div>

                            <div className="text-center">
                                <a
                                    href="mailto:bookings@kalidasstravels.in?subject=Custom%20Quotation%20Request%20-%20Executive%20Fleet&body=Dear%20Kalidass%20Travels%20Team%2C%0A%0AI%20would%20like%20to%20request%20a%20custom%20quotation%20for%20Executive%20Fleet%20Services.%0A%0ACompany%20Details%3A%0AName%3A%20%5BYour%20Company%20Name%5D%0AAddress%3A%20%5BYour%20Company%20Address%5D%0A%0ARequirements%3A%0A-%20Vehicle%20preference%20(Camry/Benz/BMW/Vellfire)%3A%20%0A-%20Date%20of%20requirement%3A%20%0A-%20Duration%20(Hrs/Days)%3A%20%0A%0APlease%20provide%20availability%20and%20quote.%0A%0AThank%20you%2C%0A%5BYour%20Name%5D"
                                    className="inline-flex items-center gap-3 bg-white hover:bg-slate-50 border-2 border-slate-900 text-slate-900 px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 w-full md:w-auto justify-center"
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
                                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none transition-all"
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
                                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none transition-all resize-none"
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
                                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none transition-all"
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
                                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none transition-all"
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
                                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="pt-4 space-y-3">
                                    <button
                                        onClick={generatePDF}
                                        disabled={!formData.companyName || !formData.address}
                                        className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-8 py-4 rounded-lg font-bold text-lg transition-all shadow-lg flex items-center justify-center gap-3"
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
            <section className="bg-slate-950 text-white py-16 border-t border-slate-900">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <div className="mb-6">
                        <MessageCircle className="w-16 h-16 mx-auto mb-4 animate-pulse text-green-500" />
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold mb-4 font-serif">Priority Assistance</h2>
                    <p className="text-slate-400 text-lg mb-8 max-w-2xl mx-auto">
                        Connect directly with our Executive Desk for immediate booking assistance.
                    </p>
                    <a
                        href="https://wa.me/919092303060?text=Hi%2C%20I%27m%20interested%20in%20Executive%20Fleet%20Services.%20I%20have%20some%20questions."
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-3 bg-green-600 hover:bg-green-700 text-white px-10 py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
                    >
                        <MessageCircle className="w-6 h-6" />
                        Chat on WhatsApp
                    </a>
                    <p className="text-slate-500 text-sm mt-6">
                        💬 Typical response time: Under 5 minutes
                    </p>
                </div>
            </section>

        </div>
    );
}
