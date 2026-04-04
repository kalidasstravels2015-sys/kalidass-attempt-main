import React, { useState } from 'react';
import {
    CheckCircle,
    ShieldCheck,
    Clock,
    FileText,
    MapPin,
    ChevronDown,
    ChevronUp,
    Car,
    Users,
    Briefcase,
    Star,
    ArrowRight,
    MessageCircle,
    Download,
    Mail
} from 'lucide-react';

// --- Sub-Components ---

const PricingCard = ({ title, models, price, breakdown, duty, fuel, popular }) => (
    <div className={`relative bg-white rounded-xl border ${popular ? 'border-blue-600 shadow-xl scale-100 md:scale-105 z-10' : 'border-slate-200 shadow-sm'} overflow-hidden flex flex-col h-full hover:shadow-lg transition-shadow duration-300`}>
        {popular && (
            <div className="bg-blue-600 text-white text-xs font-bold text-center py-2 uppercase tracking-wider">
                Most Popular
            </div>
        )}
        <div className="p-6 flex-grow">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-xl font-bold text-slate-900">{title}</h3>
                    <p className="text-sm text-slate-500 font-medium">{models}</p>
                </div>
                {popular ? <Star className="w-6 h-6 text-yellow-400 fill-current" /> : <Car className="w-6 h-6 text-slate-300" />}
            </div>

            <div className="mb-6 border-b border-slate-100 pb-6">
                <div className="flex items-baseline">
                    <span className="text-3xl font-extrabold text-slate-900">{price}</span>
                    <span className="ml-2 text-xs font-medium text-slate-500">+ GST</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">Monthly Fixed Cost</p>
            </div>

            {/* Transparent Breakdown */}
            <div className="space-y-3 mb-6 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="flex justify-between text-xs text-slate-600">
                    <span>Base Rent</span>
                    <span className="font-semibold text-slate-900">{breakdown.base}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                    <span>Driver Salary</span>
                    <span className="font-semibold text-slate-900">{breakdown.driver}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                    <span>Maintenance</span>
                    <span className="font-semibold text-slate-900">{breakdown.maint}</span>
                </div>
            </div>

            <div className="space-y-3 text-sm">
                <div className="flex items-start">
                    <Clock className="w-4 h-4 text-blue-500 mr-2 mt-0.5" />
                    <span className="text-slate-700"><strong>Duty:</strong> {duty}</span>
                </div>
                <div className="flex items-start">
                    <FileText className="w-4 h-4 text-blue-500 mr-2 mt-0.5" />
                    <span className="text-slate-700"><strong>Fuel:</strong> {fuel}</span>
                </div>
            </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100">
            <button className={`w-full py-2.5 rounded-lg font-bold transition-colors ${popular ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'}`}>
                Get Quote
            </button>
        </div>
    </div>
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

export default function EmployeeTransportation() {
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
        doc.text('Subject: Quotation for Employee Transportation Services', 20, yPos + 5);

        // Salutation
        doc.setFont('helvetica', 'normal');
        doc.text('Respected Sir/Madam,', 20, yPos + 15);

        // Introduction
        const intro = 'Thank you for your interest in our Employee Transportation Services. We are pleased to present our monthly rental rates for your consideration:';
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
        doc.text('MONTHLY RENTAL RATES (Chennai)', 105, yPos + 5.5, { align: 'center' });

        yPos += 8;

        // Table Column Headers
        doc.setFillColor(226, 232, 240); // slate-200
        doc.rect(20, yPos, 170, 10, 'F');
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');

        // Column headers
        doc.text('Vehicle Type', 25, yPos + 6.5);
        doc.text('Package Inclusions', 70, yPos + 6.5);
        doc.text('Duty Hours', 120, yPos + 6.5);
        doc.text('Fuel Policy', 155, yPos + 6.5);

        yPos += 10;

        // Helper function to draw vehicle row
        const drawVehicleRow = (vehicleType, models, monthlyRate, breakdown, isFirst = false) => {
            const rowHeight = 28;

            // Alternating background
            if (isFirst) {
                doc.setFillColor(240, 249, 255); // light blue
                doc.rect(20, yPos, 170, rowHeight, 'F');
            }

            // Column 1: Vehicle Type
            doc.setTextColor(0, 0, 0);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.text(vehicleType, 22, yPos + 7);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7);
            doc.setTextColor(80, 80, 80);
            doc.text(models, 22, yPos + 11);

            // Monthly rate
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.setTextColor(22, 163, 74); // green
            doc.text(monthlyRate, 22, yPos + 18);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7);
            doc.setTextColor(100, 100, 100);
            doc.text('(+ GST)', 42, yPos + 18);

            // Column 2: Package Inclusions (Replaced Breakdown)
            doc.setFontSize(7);
            doc.setTextColor(60, 60, 60);
            doc.setFont('helvetica', 'normal');
            doc.text('+ Vehicle Rent', 70, yPos + 7);
            doc.text('+ Professional Driver', 70, yPos + 12);
            doc.text('+ Maintenance & Insurance', 70, yPos + 17);
            doc.setFontSize(6);
            doc.setTextColor(100, 100, 100);
            doc.text('(Monthly Fixed)', 70, yPos + 22);

            // Column 3: Duty Hours
            doc.setFontSize(8);
            doc.setTextColor(60, 60, 60);
            doc.setFont('helvetica', 'normal');
            doc.text('10 Hrs/Day', 120, yPos + 9);
            doc.text('26 Days/Month', 120, yPos + 15);

            // Column 4: Fuel Policy
            doc.setFontSize(8);
            doc.setTextColor(60, 60, 60);
            doc.text('Client pays', 155, yPos + 9);
            doc.text('actuals', 155, yPos + 14);
            doc.setFontSize(6);
            doc.setTextColor(100, 100, 100);
            doc.text('(Logbook tracked)', 155, yPos + 19);

            // Row border
            doc.setDrawColor(220, 220, 220);
            doc.setLineWidth(0.3);
            doc.line(20, yPos + rowHeight, 190, yPos + rowHeight);

            yPos += rowHeight;
        };

        // Draw all three vehicles
        drawVehicleRow(
            'Sedan',
            'Dzire / Etios / Aura',
            '₹52,000',
            {},
            true
        );

        drawVehicleRow(
            'SUV',
            'Innova Crysta / Hycross',
            '₹75,000',
            {}
        );

        drawVehicleRow(
            'Tempo Traveller',
            'Force Urbania / Traveller (12+)',
            '₹90,000',
            {}
        );

        // Vertical column separators
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.3);
        const tableTop = yPos - 94; // Adjust based on row height
        doc.line(65, tableTop, 65, yPos); // After Vehicle Type
        doc.line(115, tableTop, 115, yPos); // After Price Breakdown
        doc.line(150, tableTop, 150, yPos); // After Duty Hours

        // Border around entire table
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.rect(20, tableTop, 170, yPos - tableTop);

        // Note about fuel
        yPos += 3;
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.setFont('helvetica', 'italic');
        doc.text('* Fuel, Tolls & Parking billed at actuals with supporting receipts attached to monthly invoice.', 25, yPos);

        // Closing (more compact)
        yPos += 10;
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        const closing = 'We would be delighted to serve your organization and ensure safe, reliable transportation for your team. Please feel free to contact us for any clarifications.';
        const closingLines = doc.splitTextToSize(closing, 170);
        closingLines.forEach(line => {
            doc.text(line, 20, yPos);
            yPos += 4;
        });

        // Thank you
        yPos += 6;
        doc.text('Thank you for considering Kalidass Travels.', 20, yPos);

        // Signature (more compact)
        yPos += 12;
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
        const fileName = `Kalidass_Travels_Quotation_${formData.companyName.replace(/\s+/g, '_') || 'ETS'}.pdf`;
        doc.save(fileName);

        // Reset form and close
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
            question: "Will you submit the PF/ESI ECR copies for our audit?",
            answer: "Yes. Since we strictly follow Central Government Minimum Wages, we are happy to submit the monthly ECR (Electronic Challan Return) copies and wage registers whenever your compliance team requests them."
        },
        {
            question: "Do you provide supporting documents for variable charges (Fuel/Tolls)?",
            answer: "Yes. We attach original fuel bills, toll receipts, and parking tickets along with the digital trip sheets to your monthly invoice. You pay exactly what the receipt says at actuals."
        },
        {
            question: "Can you provide Police Verification Certificates (PVC) for the drivers?",
            answer: "Yes. We do not deploy any driver without a background check. Valid PVC copies, along with driving license details and address proof, are submitted to your Security/Admin team before onboarding."
        },
        {
            question: "Is your invoice valid for claiming GST Input Tax Credit?",
            answer: "Yes. We issue a proper commercial GST tax invoice with the correct SAC code. Your finance team can claim full Input Tax Credit (ITC) without issues."
        },
        {
            question: "Do all vehicles have valid commercial permits?",
            answer: "Yes. Every vehicle on our roster holds a valid 'Yellow Board' registration, Fitness Certificate (FC), and Commercial Insurance. We ensure your company carries zero legal liability."
        },
        {
            question: "What is your SLA (Service Level Agreement) for breakdowns?",
            answer: "We adhere to a strict 60-minute replacement guarantee. In case of a mechanical failure or driver unavailability, a backup vehicle is dispatched immediately to ensure your operations continue."
        },
        {
            question: "Can we sign a single contract for multiple Tamil Nadu branches?",
            answer: "Yes. We support multi-city operations (Chennai, Coimbatore, Madurai, Hosur). You can sign one master agreement for all locations to standardize your billing and service quality."
        }
    ];

    return (
        <div className="font-sans text-slate-900 bg-white">

            {/* 1. HERO SECTION */}
            <section className="relative bg-slate-900 text-white py-20 lg:py-28 overflow-hidden">
                {/* Background Image Placeholder */}
                <div className="absolute inset-0 z-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-900/40 z-0"></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <span className="inline-block py-1 px-3 rounded-full bg-blue-900/50 border border-blue-500/30 text-blue-300 text-xs font-bold uppercase tracking-wider mb-6">
                                Corporate Plan
                            </span>
                            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6 leading-tight">
                                Monthly Car With Driver <br />
                                <span className="text-blue-500">No Surprises.</span>
                            </h1>
                            <p className="text-lg text-slate-300 mb-8 leading-relaxed border-l-4 border-blue-500 pl-6">
                                Your company deserves reliable travel. We share all charges upfront — no sudden add-ons, no confusion.
                            </p>
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

            {/* 2. TRANSPARENT PRICING - TABLE FORMAT */}
            <section className="py-20 bg-slate-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-2xl mx-auto mb-12">
                        <h2 className="text-3xl font-bold text-slate-900">Transparent Monthly Pricing</h2>
                        <p className="text-slate-500 mt-3">What you see is exactly what you pay. No hidden driver batas.</p>
                    </div>

                    {/* Pricing Table */}
                    <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-900 text-white">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Vehicle Type</th>
                                        <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Package Inclusions<br /><span className="text-xs font-normal text-slate-300">(Chennai)</span></th>
                                        <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Duty Hours</th>
                                        <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Fuel Policy</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {/* Sedan Row */}
                                    <tr className="hover:bg-blue-50 transition-colors bg-blue-50/30">
                                        <td className="px-6 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-shrink-0">
                                                    <Star className="w-6 h-6 text-yellow-500 fill-current" />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900 text-lg">Sedan</div>
                                                    <div className="text-sm text-slate-500">Dzire / Etios / Aura</div>
                                                    <span className="inline-block mt-1 px-2 py-0.5 bg-blue-600 text-white text-xs font-bold rounded-full">Most Popular</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="text-2xl font-bold text-green-600 mb-2">
                                                ₹52,000 <span className="text-sm text-slate-500 font-normal">(+ GST)</span>
                                            </div>
                                            <details className="group">
                                                <summary className="cursor-pointer text-blue-600 font-semibold text-sm flex items-center gap-2 hover:text-blue-700">
                                                    <ChevronDown className="w-4 h-4 group-open:rotate-180 transition-transform" />
                                                    <span>View Package Inclusions</span>
                                                </summary>
                                                <div className="mt-3 space-y-1 text-sm text-slate-600 ml-5 bg-slate-50 p-3 rounded-lg">
                                                    <div className="flex items-center gap-2">
                                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                                        <span>+ Vehicle Rent</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                                        <span>+ Professional Driver</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                                        <span>+ Maintenance & Insurance</span>
                                                    </div>
                                                </div>
                                            </details>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="text-slate-700 font-medium">10 Hrs / Day</div>
                                            <div className="text-sm text-slate-500">26 Days / Month</div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="text-slate-700 font-medium">Client pays actuals</div>
                                            <div className="text-xs text-slate-500">(Logbook tracked)</div>
                                        </td>
                                    </tr>

                                    {/* SUV Row */}
                                    <tr className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-shrink-0">
                                                    <Car className="w-6 h-6 text-slate-400" />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900 text-lg">SUV</div>
                                                    <div className="text-sm text-slate-500">Innova Crysta / Hycross</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="text-2xl font-bold text-green-600 mb-2">
                                                ₹75,000 <span className="text-sm text-slate-500 font-normal">(+ GST)</span>
                                            </div>
                                            <details className="group">
                                                <summary className="cursor-pointer text-blue-600 font-semibold text-sm flex items-center gap-2 hover:text-blue-700">
                                                    <ChevronDown className="w-4 h-4 group-open:rotate-180 transition-transform" />
                                                    <span>View Package Inclusions</span>
                                                </summary>
                                                <div className="mt-3 space-y-1 text-sm text-slate-600 ml-5 bg-slate-50 p-3 rounded-lg">
                                                    <div className="flex items-center gap-2">
                                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                                        <span>+ Vehicle Rent</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                                        <span>+ Professional Driver</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                                        <span>+ Maintenance & Insurance</span>
                                                    </div>
                                                </div>
                                            </details>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="text-slate-700 font-medium">10 Hrs / Day</div>
                                            <div className="text-sm text-slate-500">26 Days / Month</div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="text-slate-700 font-medium">Client pays actuals</div>
                                            <div className="text-xs text-slate-500">(Logbook tracked)</div>
                                        </td>
                                    </tr>

                                    {/* Tempo Traveller Row */}
                                    <tr className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-shrink-0">
                                                    <Users className="w-6 h-6 text-slate-400" />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900 text-lg">Tempo Traveller</div>
                                                    <div className="text-sm text-slate-500">Force Urbania / Traveller (12+)</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="text-2xl font-bold text-green-600 mb-2">
                                                ₹90,000 <span className="text-sm text-slate-500 font-normal">(+ GST)</span>
                                            </div>
                                            <details className="group">
                                                <summary className="cursor-pointer text-blue-600 font-semibold text-sm flex items-center gap-2 hover:text-blue-700">
                                                    <ChevronDown className="w-4 h-4 group-open:rotate-180 transition-transform" />
                                                    <span>View Package Inclusions</span>
                                                </summary>
                                                <div className="mt-3 space-y-1 text-sm text-slate-600 ml-5 bg-slate-50 p-3 rounded-lg">
                                                    <div className="flex items-center gap-2">
                                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                                        <span>+ Vehicle Rent</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                                        <span>+ Professional Driver</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                                        <span>+ Maintenance & Insurance</span>
                                                    </div>
                                                </div>
                                            </details>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="text-slate-700 font-medium">10 Hrs / Day</div>
                                            <div className="text-sm text-slate-500">26 Days / Month</div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="text-slate-700 font-medium">Client pays actuals</div>
                                            <div className="text-xs text-slate-500">(Logbook tracked)</div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <p className="text-center text-xs text-slate-500 mt-8">
                        * Fuel, Tolls & Parking billed at actuals (Logbook). Mileage logged daily in digital trip sheet.
                    </p>
                </div>
            </section>

            {/* 3. OPERATIONAL EXCELLENCE (3-Column Grid) */}
            <section className="py-20 bg-slate-50 border-t border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-slate-900">Operational Excellence</h2>
                        <p className="text-slate-500 mt-2">We manage the liability and logistics. You focus on business.</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <FeatureItem
                            icon={FileText}
                            title="Audit-Ready Billing"
                            desc="Consolidated GST invoice with attached Fuel, Toll & Parking bills (at actuals). Mileage logged daily."
                        />
                        <FeatureItem
                            icon={ShieldCheck}
                            title="100% Statutory Compliance"
                            desc="We follow Central Govt Minimum Wages. PF & ESI filed diligently. Zero legal liability for you."
                        />
                        <FeatureItem
                            icon={Briefcase}
                            title="Strict Driver Vetting"
                            desc="Mandatory Police Verification Certificate (PVC) obtained for every driver and renewed every 2 years."
                        />
                        <FeatureItem
                            icon={Clock}
                            title="60-Min Backup Promise"
                            desc="Vehicle breakdown? Driver sick? A backup vehicle reaches your office in < 60 minutes."
                        />
                        <FeatureItem
                            icon={MapPin}
                            title="Tamil Nadu Wide Support"
                            desc="Seamless fleet operations across Chennai, Coimbatore, Madurai, and Hosur under one contract."
                        />
                        <FeatureItem
                            icon={Users}
                            title="Dedicated Fleet Manager"
                            desc="No call centers. Direct mobile access to a dedicated supervisor who manages your roster daily."
                        />
                    </div>
                </div>
            </section>

            {/* 5. FAQ Section (Accordion) */}
            <section className="py-20 bg-white">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">Frequently Asked Questions (Audit & Compliance)</h2>
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
                                    href="mailto:bookings@kalidasstravels.in?subject=Custom%20Quotation%20Request%20-%20Employee%20Transportation&body=Dear%20Kalidass%20Travels%20Team%2C%0A%0AI%20would%20like%20to%20request%20a%20custom%20quotation%20for%20Employee%20Transportation%20Services.%0A%0ACompany%20Details%3A%0AName%3A%20%5BYour%20Company%20Name%5D%0AAddress%3A%20%5BYour%20Company%20Address%5D%0A%0ARequirements%3A%0A-%20Number%20of%20vehicles%20needed%3A%20%0A-%20Vehicle%20type%20preference%3A%20%0A-%20Duty%20hours%20required%3A%20%0A-%20Start%20date%3A%20%0A-%20Any%20special%20requirements%3A%20%0A%0APlease%20provide%20a%20detailed%20quotation%20at%20your%20earliest%20convenience.%0A%0AThank%20you%2C%0A%5BYour%20Name%5D"
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
                                    {/* Download PDF Button */}
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
                        Get instant answers about our services, pricing, or custom requirements. Our team is ready to help you find the perfect transport solution.
                    </p>
                    <a
                        href="https://wa.me/919092303060?text=Hi%2C%20I%27m%20interested%20in%20Employee%20Transportation%20Services.%20I%20have%20some%20questions."
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
