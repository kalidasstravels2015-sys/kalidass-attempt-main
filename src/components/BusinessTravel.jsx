import React, { useState } from 'react';
import {
    Plane,
    Clock,
    FileText,
    ShieldCheck,
    CheckCircle,
    Phone,
    Mail,
    ArrowRight,
    Star,
    XCircle,
    Briefcase,
    ChevronDown,
    ChevronUp,
    CreditCard,
    Download,
    MessageCircle
} from 'lucide-react';
import jsPDF from 'jspdf';

// --- Sub-Components ---

// Replaced Card with a Row-based Table Item for "Sheets" look
const RateRow = ({ service, vehicle, rate, details }) => (
    <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
        <td className="p-4 align-top">
            <div className="font-bold text-slate-900">{service}</div>
            <div className="text-xs text-slate-500 mt-1 md:hidden">{vehicle}</div>
        </td>
        <td className="p-4 align-top hidden md:table-cell">
            <div className="text-slate-700 font-medium">{vehicle}</div>
        </td>
        <td className="p-4 align-top">
            <div className="font-bold text-slate-900 text-lg">{rate}</div>
            <div className="text-xs text-slate-500">+ GST</div>
        </td>
        <td className="p-4 align-top">
            <div className="text-sm text-slate-600 space-y-1">
                {details.map((detail, idx) => (
                    <div key={idx} className="flex items-center">
                        <CheckCircle className="w-3 h-3 text-blue-500 mr-2 flex-shrink-0" />
                        {detail}
                    </div>
                ))}
            </div>
        </td>
    </tr>
);

const FeatureItem = ({ icon: Icon, title, desc }) => (
    <div className="flex items-start p-4 rounded-lg bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex-shrink-0 mt-1">
            <Icon className="w-6 h-6 text-blue-600" />
        </div>
        <div className="ml-4">
            <h3 className="text-base font-bold text-slate-900">{title}</h3>
            <p className="mt-1 text-sm text-slate-600 leading-relaxed">{desc}</p>
        </div>
    </div>
);

const ComparisonRow = ({ feature, appCab, corporateFleet }) => (
    <div className="grid grid-cols-3 gap-4 py-3 border-b border-slate-100 last:border-0 text-sm">
        <div className="font-semibold text-slate-700">{feature}</div>
        <div className="text-red-500 flex items-center">
            <XCircle className="w-4 h-4 mr-1 md:mr-2 flex-shrink-0" /> <span className="hidden md:inline">{appCab}</span>
        </div>
        <div className="text-green-600 font-bold flex items-center">
            <CheckCircle className="w-4 h-4 mr-1 md:mr-2 flex-shrink-0" /> <span className="hidden md:inline">{corporateFleet}</span>
        </div>
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

export default function BusinessTravel() {
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
        doc.text('Subject: Quotation for Corporate Business Travel Services', 20, yPos + 5);

        // Salutation
        doc.setFont('helvetica', 'normal');
        doc.text('Respected Sir/Madam,', 20, yPos + 15);

        // Introduction
        const intro = 'Thank you for your interest in our Business Travel Services. We are pleased to present our standard corporate tariff for your consideration:';
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
        doc.text('CORPORATE TARIFF (Chennai)', 105, yPos + 5.5, { align: 'center' });

        yPos += 8;

        // Table Column Headers
        doc.setFillColor(226, 232, 240); // slate-200
        doc.rect(20, yPos, 170, 10, 'F');
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');

        // Column headers
        doc.text('Service Package', 25, yPos + 6.5);
        doc.text('Vehicle Type', 70, yPos + 6.5);
        doc.text('Rate', 120, yPos + 6.5);
        doc.text('Inclusions / Notes', 150, yPos + 6.5);

        yPos += 10;

        // Helper function to draw row
        const drawRow = (service, vehicle, rate, notes, isFirst = false) => {
            const rowHeight = 20;

            // Alternating background
            if (isFirst) {
                doc.setFillColor(240, 249, 255); // light blue
                doc.rect(20, yPos, 170, rowHeight, 'F');
            }

            // Column 1: Service
            doc.setTextColor(0, 0, 0);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            doc.text(service, 22, yPos + 8);

            // Column 2: Vehicle
            doc.setFont('helvetica', 'normal');
            doc.text(vehicle, 70, yPos + 8);

            // Column 3: Rate
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(22, 163, 74); // green
            doc.text(rate, 120, yPos + 8);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7);
            doc.setTextColor(100, 100, 100);
            doc.text('(+ GST)', 120, yPos + 12);

            // Column 4: Notes
            doc.setFontSize(7);
            doc.setTextColor(60, 60, 60);
            const noteLines = doc.splitTextToSize(notes, 35);
            doc.text(noteLines, 150, yPos + 8);

            // Row border
            doc.setDrawColor(220, 220, 220);
            doc.setLineWidth(0.3);
            doc.line(20, yPos + rowHeight, 190, yPos + rowHeight);

            yPos += rowHeight;
        };

        // Draw Rows
        drawRow('Airport Drop', 'Sedan (Etios/Dzire)', '₹950', 'Zone A (Guindy/OMR). Parking at Actuals.', true);
        drawRow('8 Hrs / 80 Kms', 'Sedan (Etios/Dzire)', '₹2,200', 'Extra Km: ₹14/km\nExtra Hr: ₹150/hr');
        drawRow('8 Hrs / 80 Kms', 'SUV (Innova)', '₹3,000', 'Extra Km: ₹18/km\nExtra Hr: ₹250/hr');
        drawRow('Outstation Trip', 'Innova Crysta', '₹22 / km', 'Min 250 km/day.\nDriver Bata: ₹500/day');

        // Vertical column separators
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.3);
        const tableTop = yPos - 80; // Adjust based on rows
        doc.line(65, tableTop, 65, yPos);
        doc.line(115, tableTop, 115, yPos);
        doc.line(145, tableTop, 145, yPos);

        // Border around entire table
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.rect(20, tableTop, 170, yPos - tableTop);

        // Note
        yPos += 5;
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.setFont('helvetica', 'italic');
        doc.text('* Night Bata applicable 10 PM - 6 AM. Tolls & Parking at actuals.', 25, yPos);

        // Closing
        yPos += 15;
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        const closing = 'We look forward to serving your business travel needs with our premium fleet and professional chauffeurs.';
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
        const fileName = `Kalidass_Travels_Business_Travel_Quote_${formData.companyName.replace(/\s+/g, '_') || 'Corp'}.pdf`;
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
            question: "How does the 'Bill-to-Company' process work?",
            answer: "We open a corporate account for your entity. Authorized employees can book rides via email/WhatsApp without paying cash. At the end of the month, we send a single consolidated GST invoice for all trips, payable within the agreed credit period."
        },
        {
            question: "Are there cancellation charges?",
            answer: "We have a flexible policy for corporates. No charge if cancelled 2 hours before the pickup time. This helps you manage last-minute meeting changes without penalties."
        },
        {
            question: "Do you provide GST invoices for Input Tax Credit?",
            answer: "Yes. Unlike B2C app cabs, every invoice we generate is a B2B Tax Invoice with your GSTIN and the correct SAC code, ensuring you can claim 100% Input Tax Credit."
        },
        {
            question: "Is there a night charge?",
            answer: "Yes, a standard Driver Bata (Night Allowance) is applicable for trips happening between 10:00 PM and 6:00 AM. This goes directly to the chauffeur."
        }
    ];

    return (
        <div className="font-sans text-slate-900 bg-white">

            {/* 1. HERO SECTION */}
            <section className="relative bg-slate-900 text-white py-20 lg:py-28 overflow-hidden">
                <div className="absolute inset-0 z-0 opacity-30 bg-[url('https://images.unsplash.com/photo-1554224155-1696413565d3?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-900/40 z-0"></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <span className="inline-block py-1 px-3 rounded-full bg-blue-900/50 border border-blue-500/30 text-blue-300 text-xs font-bold uppercase tracking-wider mb-6">
                                On-Demand Business Travel
                            </span>
                            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
                                Premium Corporate Cabs. <br />
                                <span className="text-blue-500">No Surge. No Cancellations.</span>
                            </h1>
                            <p className="text-lg text-slate-300 mb-8 leading-relaxed border-l-4 border-blue-500 pl-6">
                                Professional chauffeur services for your client meetings, airport transfers, and site visits. Book 24/7, we bill your company at month-end.
                            </p>
                            <div className="flex gap-4">
                                <button className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3.5 rounded-lg font-bold transition-all flex items-center shadow-lg shadow-blue-900/50">
                                    Book a Ride <ArrowRight className="w-5 h-5 ml-2" />
                                </button>
                            </div>
                        </div>

                        <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-8">
                            <h3 className="text-lg font-bold text-white mb-4">Who is this for?</h3>
                            <ul className="space-y-3">
                                {[
                                    "Daily official visits & Sales rounds",
                                    "Client meetings & Airport pickups",
                                    "Transporting staff safely (Late shifts)",
                                    "Management-level mobility"
                                ].map((item, idx) => (
                                    <li key={idx} className="flex items-center text-slate-200 text-sm">
                                        <CheckCircle className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </section>



            {/* 2. TRANSPARENT RATE SHEET (The Table) */}
            <section className="py-20 bg-slate-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-2xl mx-auto mb-12">
                        <h2 className="text-3xl font-bold text-slate-900">Transparent Standard Rates</h2>
                        <p className="text-slate-500 mt-3">Fixed corporate tariffs for Chennai. No surge pricing ever.</p>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden max-w-5xl mx-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-100 text-slate-700 text-xs md:text-sm uppercase tracking-wider">
                                <tr>
                                    <th className="p-4 border-b border-slate-200 font-bold">Service Package</th>
                                    <th className="p-4 border-b border-slate-200 font-bold hidden md:table-cell">Vehicle Type</th>
                                    <th className="p-4 border-b border-slate-200 font-bold">Base Rate</th>
                                    <th className="p-4 border-b border-slate-200 font-bold">Inclusions / Notes</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                <RateRow
                                    service="Airport Drop"
                                    vehicle="Sedan (Etios/Dzire)"
                                    rate="₹950"
                                    details={["Zone A (Guindy/OMR)", "Meet & Greet included", "Parking at Actuals"]}
                                />
                                <RateRow
                                    service="8 Hrs / 80 Kms"
                                    vehicle="Sedan (Etios/Dzire)"
                                    rate="₹2,200"
                                    details={["Extra Km: ₹14/km", "Extra Hr: ₹150/hr", "Ideal for Local Sales"]}
                                />
                                <RateRow
                                    service="8 Hrs / 80 Kms"
                                    vehicle="SUV (Innova)"
                                    rate="₹3,000"
                                    details={["Extra Km: ₹18/km", "Extra Hr: ₹250/hr", "Executive Comfort"]}
                                />
                                <RateRow
                                    service="Outstation Trip"
                                    vehicle="Innova Crysta"
                                    rate="₹22 / km"
                                    details={["Min 250 km / day", "Driver Bata: ₹500/day", "Tolls at Actuals"]}
                                />
                            </tbody>
                        </table>
                        <div className="bg-blue-50 p-4 text-center text-xs text-blue-800 border-t border-blue-100">
                            <span className="font-bold">Note:</span> Night Bata applicable between 10 PM - 6 AM. All rates exclusive of 5% GST.
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. BTC ADVANTAGE & COMPARISON */}
            <section className="py-20 bg-white border-t border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-slate-900">The "Bill-to-Company" Advantage</h2>
                        <p className="text-slate-500 mt-2">Why Corporates switch from App Cabs to our Fleet.</p>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        {/* Left: Features Grid */}
                        <div className="grid sm:grid-cols-2 gap-6">
                            <FeatureItem
                                icon={FileText}
                                title="One Monthly Invoice"
                                desc="Stop collecting 50 reimbursement bills. Get one consolidated GST invoice."
                            />
                            <FeatureItem
                                icon={CreditCard}
                                title="Cashless Travel"
                                desc="Employees book and ride. Company pays at month-end. No petty cash needed."
                            />
                            <FeatureItem
                                icon={ShieldCheck}
                                title="Zero Cancellations"
                                desc="Our drivers don't ask 'Drop location?'. Guaranteed pickup for scheduled rides."
                            />
                            <FeatureItem
                                icon={Briefcase}
                                title="GST Input Credit"
                                desc="100% compliant B2B invoices ensure you don't lose money on taxes."
                            />
                        </div>

                        {/* Right: Comparison Table */}
                        <div className="bg-slate-50 rounded-xl p-8 border border-slate-200">
                            <h3 className="font-bold text-slate-900 mb-6">App Cabs vs. Corporate Fleet</h3>
                            <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
                                <div className="grid grid-cols-3 bg-slate-100 p-3 font-bold text-xs text-slate-500 uppercase tracking-wide">
                                    <div>Feature</div>
                                    <div>App Cabs</div>
                                    <div>Our Fleet</div>
                                </div>
                                <div className="p-2">
                                    <ComparisonRow feature="Pricing" appCab="Surge Pricing" corporateFleet="Fixed Rates" />
                                    <ComparisonRow feature="Reliability" appCab="May Cancel" corporateFleet="Guaranteed" />
                                    <ComparisonRow feature="Invoicing" appCab="B2C Receipt" corporateFleet="B2B Tax Invoice" />
                                    <ComparisonRow feature="Peak Hrs" appCab="Unavailable" corporateFleet="Pre-booked" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 4. FAQ SECTION */}
            <section className="py-20 bg-slate-50">
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
            <section className="py-20 bg-gradient-to-br from-blue-50 to-slate-50">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">
                            Download Personalized Quotation
                        </h2>
                        <p className="text-slate-600">
                            Get a professional quotation letter with our rate sheet in PDF format
                        </p>
                    </div>

                    {!showQuoteForm ? (
                        <div className="flex flex-col md:flex-row justify-center gap-6">
                            <div className="text-center">
                                <button
                                    onClick={() => setShowQuoteForm(true)}
                                    className="inline-flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg shadow-blue-900/20 hover:shadow-xl hover:-translate-y-0.5 w-full md:w-auto justify-center"
                                >
                                    <Download className="w-6 h-6" />
                                    Generate Quotation PDF
                                </button>
                                <p className="text-sm text-slate-500 mt-3">
                                    Instant PDF download with standard rates
                                </p>
                            </div>

                            <div className="text-center">
                                <a
                                    href="mailto:bookings@kalidasstravels.in?subject=Custom%20Quotation%20Request%20-%20Business%20Travel&body=Dear%20Kalidass%20Travels%20Team%2C%0A%0AI%20would%20like%20to%20request%20a%20custom%20quotation%20for%20Business%20Travel%20Services.%0A%0ACompany%20Details%3A%0AName%3A%20%5BYour%20Company%20Name%5D%0AAddress%3A%20%5BYour%20Company%20Address%5D%0A%0ARequirements%3A%0A-%20Type%20of%20service%20(Airport/Hourly/Outstation)%3A%20%0A-%20Vehicle%20preference%3A%20%0A-%20Expected%20monthly%20volume%3A%20%0A%0APlease%20provide%20a%20detailed%20quotation.%0A%0AThank%20you%2C%0A%5BYour%20Name%5D"
                                    className="inline-flex items-center gap-3 bg-white hover:bg-slate-50 border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 w-full md:w-auto justify-center"
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
                                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-8 py-4 rounded-lg font-bold text-lg transition-all shadow-lg flex items-center justify-center gap-3"
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
            <section className="bg-gradient-to-br from-green-600 to-green-700 text-white py-16">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <div className="mb-6">
                        <MessageCircle className="w-16 h-16 mx-auto mb-4 animate-pulse" />
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">Have Questions? Let's Chat!</h2>
                    <p className="text-green-50 text-lg mb-8 max-w-2xl mx-auto">
                        Get instant answers about our business travel packages, billing, or custom requirements.
                    </p>
                    <a
                        href="https://wa.me/919092303060?text=Hi%2C%20I%27m%20interested%20in%20Business%20Travel%20Services.%20I%20have%20some%20questions."
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-3 bg-white text-green-600 hover:bg-green-50 px-10 py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
                    >
                        <MessageCircle className="w-6 h-6" />
                        Chat on WhatsApp
                    </a>
                    <p className="text-green-100 text-sm mt-6">
                        💬 Typical response time: Under 5 minutes during business hours
                    </p>
                </div>
            </section>

        </div>
    );
}
