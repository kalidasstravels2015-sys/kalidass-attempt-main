import { chromium } from '@playwright/test';
import * as docx from 'docx';
import fs from 'fs';
import path from 'path';

const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  ShadingType
} = docx;

// -------------------------------------------------------------
// 1. Generate Executive PDF
// -------------------------------------------------------------
async function generatePDF() {
  console.log('Generating Executive PDF...');

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@600;700&display=swap');

  @page {
    size: A4;
    margin: 18mm 16mm 18mm 16mm;
    @bottom-right {
      content: counter(page);
    }
  }

  * {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  body {
    font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #1e293b;
    line-height: 1.55;
    font-size: 10pt;
    margin: 0;
    padding: 0;
    background: #ffffff;
  }

  .cover-header {
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0369a1 100%);
    color: #ffffff;
    padding: 32px 28px;
    border-radius: 12px;
    margin-bottom: 24px;
    box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.15);
  }

  .brand-badge {
    display: inline-block;
    background: #f59e0b;
    color: #0f172a;
    font-weight: 800;
    font-size: 9pt;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    padding: 4px 12px;
    border-radius: 6px;
    margin-bottom: 12px;
  }

  .cover-title {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 23pt;
    font-weight: 700;
    line-height: 1.2;
    margin: 0 0 8px 0;
    letter-spacing: -0.5px;
  }

  .cover-subtitle {
    font-size: 11pt;
    color: #94a3b8;
    margin: 0;
    font-weight: 400;
  }

  .meta-strip {
    display: flex;
    justify-content: space-between;
    margin-top: 18px;
    padding-top: 14px;
    border-top: 1px solid rgba(255, 255, 255, 0.15);
    font-size: 8.5pt;
    color: #cbd5e1;
  }

  h2 {
    font-family: 'Space Grotesk', sans-serif;
    color: #0f172a;
    font-size: 14pt;
    font-weight: 700;
    margin-top: 24px;
    margin-bottom: 12px;
    padding-bottom: 6px;
    border-bottom: 2px solid #e2e8f0;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  h3 {
    color: #0369a1;
    font-size: 11.5pt;
    font-weight: 700;
    margin-top: 16px;
    margin-bottom: 8px;
  }

  p {
    margin: 0 0 10px 0;
  }

  .dept-card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-left: 4px solid #0284c7;
    border-radius: 8px;
    padding: 14px 16px;
    margin-bottom: 16px;
    page-break-inside: avoid;
  }

  .dept-card.marketing { border-left-color: #f59e0b; }
  .dept-card.ops { border-left-color: #10b981; }
  .dept-card.sales { border-left-color: #8b5cf6; }
  .dept-card.finance { border-left-color: #64748b; }

  .dept-title {
    font-size: 11.5pt;
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 4px;
  }

  .dept-mission {
    font-size: 8.8pt;
    font-style: italic;
    color: #64748b;
    margin-bottom: 10px;
  }

  .role-box {
    background: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    padding: 10px 12px;
    margin-top: 8px;
  }

  .role-name {
    font-weight: 700;
    color: #0f172a;
    font-size: 9.8pt;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .kpi-pill {
    background: #e0f2fe;
    color: #0369a1;
    font-size: 7.5pt;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 9999px;
  }

  ul {
    margin: 6px 0 6px 18px;
    padding: 0;
  }

  li {
    margin-bottom: 4px;
    font-size: 9pt;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 14px 0;
    font-size: 8.5pt;
    page-break-inside: avoid;
  }

  th {
    background: #0f172a;
    color: #ffffff;
    text-align: left;
    padding: 8px 10px;
    font-weight: 600;
    letter-spacing: 0.3px;
  }

  td {
    padding: 7px 10px;
    border-bottom: 1px solid #e2e8f0;
  }

  tr:nth-child(even) td {
    background: #f8fafc;
  }

  .tag-r { background: #fee2e2; color: #991b1b; font-weight: 700; padding: 2px 6px; border-radius: 4px; display: inline-block; font-size: 8pt; }
  .tag-a { background: #fef3c7; color: #92400e; font-weight: 700; padding: 2px 6px; border-radius: 4px; display: inline-block; font-size: 8pt; }
  .tag-c { background: #e0e7ff; color: #3730a3; font-weight: 600; padding: 2px 6px; border-radius: 4px; display: inline-block; font-size: 8pt; }
  .tag-i { background: #f1f5f9; color: #475569; font-weight: 500; padding: 2px 6px; border-radius: 4px; display: inline-block; font-size: 8pt; }

  .callout {
    background: #fffbeb;
    border: 1px solid #fde68a;
    border-left: 4px solid #f59e0b;
    padding: 10px 14px;
    border-radius: 6px;
    margin: 14px 0;
    font-size: 9pt;
    color: #92400e;
  }

  .phase-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    margin: 14px 0;
    page-break-inside: avoid;
  }

  .phase-card {
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 12px;
    background: #ffffff;
  }

  .phase-header {
    font-weight: 700;
    font-size: 9.5pt;
    color: #0f172a;
    margin-bottom: 4px;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 4px;
  }

  .page-break {
    page-break-after: always;
  }

  .footer-note {
    text-align: center;
    font-size: 8pt;
    color: #94a3b8;
    margin-top: 24px;
    padding-top: 10px;
    border-top: 1px solid #e2e8f0;
  }
</style>
</head>
<body>

  <!-- COVER / HEADER -->
  <div class="cover-header">
    <span class="brand-badge">Kalidass Travels &bull; Operations & Organization Architecture</span>
    <h1 class="cover-title">Department & Team Structure Blueprint</h1>
    <p class="cover-subtitle">Strategic Framework to Build, Develop, and Maintain the Website cum Fleet Business</p>
    <div class="meta-strip">
      <span><strong>Enterprise:</strong> Kalidass Travels (Chennai, TN)</span>
      <span><strong>Domain:</strong> Taxi, Airport Transfers, Outstation & Tours</span>
      <span><strong>Architecture Version:</strong> 1.0 (Comprehensive)</span>
    </div>
  </div>

  <div class="callout">
    <strong>Executive Objective:</strong> Transform Kalidass Travels from an offline operator into a modern, 
    digitally driven travel brand where the high-performance Astro website directly powers inquiry capture, 
    automated quoting, dynamic fleet dispatch, and 5-star customer retention.
  </div>

  <!-- SECTION 1 -->
  <h2>1. Organizational Structure & Core Departments</h2>
  <p>To operate profitably and smoothly, the business is structured into five interdependent departments linking digital client acquisition to on-ground transport execution.</p>

  <!-- DEPT 1 -->
  <div class="dept-card">
    <div class="dept-title">Department 1: Technology & Digital Product (Website Engine)</div>
    <div class="dept-mission">Mission: Maintain a high-speed, mobile-first web application that converts visitors into phone calls and WhatsApp bookings.</div>
    
    <div class="role-box">
      <div class="role-name">
        <span>1.1 Web Developer / Technical Lead</span>
        <span class="kpi-pill">KPI: 99.9% Uptime &bull; &lt;1.5s Load Time</span>
      </div>
      <ul>
        <li>Maintain Astro static & server-rendered pages, Tailwind CSS styling, and React interactive calculators.</li>
        <li>Optimize Core Web Vitals (LCP, CLS, INP) for Google ranking advantage.</li>
        <li>Maintain conversion widgets: Click-to-WhatsApp, Instant Fare Calculator, and PDF quote generator.</li>
        <li>Oversee hosting, Cloudflare DNS, SSL security, and GitHub CI/CD deployments.</li>
      </ul>
    </div>

    <div class="role-box">
      <div class="role-name">
        <span>1.2 UI/UX Designer & Content Specialist (Freelance / Part-Time)</span>
        <span class="kpi-pill">KPI: High CTR on &ldquo;Book Now&rdquo; &bull; &lt;35% Bounce Rate</span>
      </div>
      <ul>
        <li>Design eye-catching tour package cards (Temple tours, Ooty/Kodaikanal getaways, Airport drops).</li>
        <li>Create driver ID cards and fleet showcase photos for transparency and trust.</li>
        <li>Ensure mobile thumb-zone ergonomic placement of call and chat buttons.</li>
      </ul>
    </div>
  </div>

  <!-- DEPT 2 -->
  <div class="dept-card marketing">
    <div class="dept-title">Department 2: Digital Marketing, SEO & Local Growth</div>
    <div class="dept-mission">Mission: Dominate search engine results in Chennai/Tamil Nadu for high-intent cab and tour keywords.</div>

    <div class="role-box">
      <div class="role-name">
        <span>2.1 Local SEO & Google Business Profile (GBP) Manager</span>
        <span class="kpi-pill">KPI: Google Local 3-Pack Rank &bull; Organic Call Growth</span>
      </div>
      <ul>
        <li>Manage Google Business Profile: daily photo uploads, customer review responses, local citations.</li>
        <li>Implement structured Schema Markup (TaxiService, TouristTrip, LocalBusiness, FAQ).</li>
        <li>Expand programmatic route pages (e.g., Chennai Airport to OMR, Chennai to Tirupati Cabs).</li>
        <li>Maintain listings on Justdial, Sulekha, Indiamart, and local business directories.</li>
      </ul>
    </div>

    <div class="role-box">
      <div class="role-name">
        <span>2.2 Performance Marketer (Google Search Ads & Meta Ads)</span>
        <span class="kpi-pill">KPI: ROAS &gt; 4.0x &bull; Low Cost per Qualified Lead</span>
      </div>
      <ul>
        <li>Run high-intent Google Search Ads (e.g., &ldquo;urgent airport cab chennai&rdquo;, &ldquo;innova outstation rental&rdquo;).</li>
        <li>Run targeted Facebook/Instagram campaigns for weekend temple circuits and festive vacation packages.</li>
        <li>Track conversion cost and route leads straight to the WhatsApp booking desk.</li>
      </ul>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- DEPT 3 -->
  <div class="dept-card ops">
    <div class="dept-title">Department 3: Operations & Fleet Dispatch (Execution & Delivery)</div>
    <div class="dept-mission">Mission: Guarantee verified, clean, punctual vehicles with polite professional chauffeurs for every confirmed trip.</div>

    <div class="role-box">
      <div class="role-name">
        <span>3.1 Fleet Operations Manager & Dispatch Controller</span>
        <span class="kpi-pill">KPI: 100% On-Time Pickup &bull; Zero Missed Rides</span>
      </div>
      <ul>
        <li>Allocate vehicles (Sedan, Ertiga, Innova Crysta, Tempo Traveller) according to passenger requirements.</li>
        <li>Coordinate flight arrivals at Chennai Airport, monitoring delays and gate terminal shifts.</li>
        <li>Maintain an emergency contingency protocol with standby vehicles for breakdowns or driver delays.</li>
      </ul>
    </div>

    <div class="role-box">
      <div class="role-name">
        <span>3.2 Driver Relationship & Quality Executive</span>
        <span class="kpi-pill">KPI: Driver Rating &gt; 4.7/5 &bull; 100% Document Compliance</span>
      </div>
      <ul>
        <li>Onboard and verify drivers (commercial badge, police verification, FC, commercial insurance).</li>
        <li>Maintain driver profile data displayed on the website&rsquo;s verified driver directory.</li>
        <li>Enforce vehicle hygiene standards (AC working, clean upholstery, sanitizer, non-smoking policy).</li>
      </ul>
    </div>

    <div class="role-box">
      <div class="role-name">
        <span>3.3 Professional Chauffeurs & Acting Drivers (Field Staff)</span>
        <span class="kpi-pill">KPI: Polite Etiquette &bull; Safe Highway Driving</span>
      </div>
      <ul>
        <li>Punctual reporting in proper attire (uniform/formal).</li>
        <li>Safe, defensive driving on highways and temple tour circuits; assist passengers with luggage.</li>
      </ul>
    </div>
  </div>

  <!-- DEPT 4 -->
  <div class="dept-card sales">
    <div class="dept-title">Department 4: Sales, Customer Experience & Booking Desk</div>
    <div class="dept-mission">Mission: Convert website clicks into paid bookings within 2 minutes and deliver a seamless travel experience.</div>

    <div class="role-box">
      <div class="role-name">
        <span>4.1 Booking & Reservations Executive (WhatsApp & Tele-Desk)</span>
        <span class="kpi-pill">KPI: Response Time &lt; 2 Mins &bull; &gt;35% Conversion</span>
      </div>
      <ul>
        <li>Instant response to incoming website calls, WhatsApp pings, and quote calculator submissions.</li>
        <li>Provide transparent quotes using official tariff policies (driver beta, toll/parking, night charges).</li>
        <li>Issue official PDF booking confirmation receipts and collect advance token payments.</li>
      </ul>
    </div>

    <div class="role-box">
      <div class="role-name">
        <span>4.2 Customer Experience & Reputation Executive</span>
        <span class="kpi-pill">KPI: Google Review Rate &gt; 25% of Completed Trips</span>
      </div>
      <ul>
        <li>Send driver name, contact, and vehicle details to passengers 2 hours prior to scheduled departure.</li>
        <li>Perform mid-trip check-ins for multi-day temple or outstation packages.</li>
        <li>Send instant post-trip review links requesting 5-star Google ratings; resolve complaints within 24 hours.</li>
      </ul>
    </div>
  </div>

  <!-- DEPT 5 -->
  <div class="dept-card finance">
    <div class="dept-title">Department 5: Finance, Administration & Legal Compliance</div>
    <div class="dept-mission">Mission: Maintain accurate cash flow, on-time driver settlements, GST compliance, and regulatory adherence.</div>

    <div class="role-box">
      <div class="role-name">
        <span>5.1 Accounts & Billing Specialist</span>
        <span class="kpi-pill">KPI: Zero Billing Disputes &bull; On-Time Weekly Settlements</span>
      </div>
      <ul>
        <li>Issue GST-compliant invoices for corporate car rental clients and B2B contracts.</li>
        <li>Reconcile daily trip revenues, driver fuel/beta allowances, and commission shares.</li>
        <li>Manage digital infrastructure subscriptions (hosting, domain, CRM, telephony).</li>
      </ul>
    </div>

    <div class="role-box">
      <div class="role-name">
        <span>5.2 Transport Legal & Compliance Advisor (Consultant)</span>
        <span class="kpi-pill">KPI: 100% Legal & RTO Compliance</span>
      </div>
      <ul>
        <li>Ensure All India Tourist Permits (AITP) and inter-state tax documentation are up-to-date.</li>
        <li>Review website Terms of Service and Privacy Policy for regulatory alignment.</li>
      </ul>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- SECTION 2: RACI MATRIX -->
  <h2>2. RACI Responsibility Assignment Matrix</h2>
  <p>Defines exactly who is Responsible (R), Accountable (A), Consulted (C), and Informed (I) across core business workflows.</p>

  <table>
    <thead>
      <tr>
        <th style="width: 32%;">Core Workflow / Activity</th>
        <th style="width: 11%;">Web Dev</th>
        <th style="width: 11%;">SEO/Ads</th>
        <th style="width: 13%;">Sales/Desk</th>
        <th style="width: 13%;">Operations</th>
        <th style="width: 10%;">Driver</th>
        <th style="width: 10%;">Finance</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>New Tour / Route Landing Page Launch</strong></td>
        <td><span class="tag-r">R</span></td>
        <td><span class="tag-a">A</span></td>
        <td><span class="tag-c">C</span></td>
        <td><span class="tag-i">I</span></td>
        <td>-</td>
        <td>-</td>
      </tr>
      <tr>
        <td><strong>Updating Tariffs & Fares on Website</strong></td>
        <td><span class="tag-r">R</span></td>
        <td><span class="tag-i">I</span></td>
        <td><span class="tag-c">C</span></td>
        <td><span class="tag-a">A</span></td>
        <td>-</td>
        <td><span class="tag-c">C</span></td>
      </tr>
      <tr>
        <td><strong>Instant WhatsApp / Phone Inquiry Handling</strong></td>
        <td>-</td>
        <td>-</td>
        <td><span class="tag-a">A / R</span></td>
        <td><span class="tag-c">C</span></td>
        <td>-</td>
        <td>-</td>
      </tr>
      <tr>
        <td><strong>Vehicle Allocation & Trip Dispatch</strong></td>
        <td>-</td>
        <td>-</td>
        <td><span class="tag-i">I</span></td>
        <td><span class="tag-a">A / R</span></td>
        <td><span class="tag-r">R</span></td>
        <td>-</td>
      </tr>
      <tr>
        <td><strong>Emergency Breakdown / Cab Replacement</strong></td>
        <td>-</td>
        <td>-</td>
        <td><span class="tag-i">I</span></td>
        <td><span class="tag-a">A / R</span></td>
        <td><span class="tag-r">R</span></td>
        <td>-</td>
      </tr>
      <tr>
        <td><strong>Google Review Collection & Follow-up</strong></td>
        <td>-</td>
        <td><span class="tag-a">A</span></td>
        <td><span class="tag-r">R</span></td>
        <td><span class="tag-c">C</span></td>
        <td><span class="tag-i">I</span></td>
        <td>-</td>
      </tr>
      <tr>
        <td><strong>Corporate Invoicing & B2B GST Billing</strong></td>
        <td>-</td>
        <td>-</td>
        <td><span class="tag-c">C</span></td>
        <td><span class="tag-i">I</span></td>
        <td>-</td>
        <td><span class="tag-a">A / R</span></td>
      </tr>
      <tr>
        <td><strong>Paid Ads Budget & ROAS Monitoring</strong></td>
        <td><span class="tag-i">I</span></td>
        <td><span class="tag-a">A / R</span></td>
        <td><span class="tag-c">C</span></td>
        <td>-</td>
        <td>-</td>
        <td><span class="tag-c">C</span></td>
      </tr>
    </tbody>
  </table>

  <!-- SECTION 3: STANDARD OPERATING PROCEDURES (SOPs) -->
  <h2>3. Standard Operating Procedures (SOPs)</h2>
  
  <div style="margin-bottom: 12px;">
    <h3 style="margin-top: 6px;">SOP 1: Inbound Lead to Advance Booking (2-Minute Rule)</h3>
    <p>1. Customer clicks WhatsApp button or calls from the website.<br>
       2. Desk Executive acknowledges within 120 seconds using pre-saved quick reply templates.<br>
       3. Request details: Pickup location, Destination, Date/Time, Passenger count, Vehicle preference.<br>
       4. Generate official quotation using the website tariff calculator logic.<br>
       5. Customer confirms &rarr; send UPI QR code &rarr; receive token &rarr; issue PDF confirmation.</p>
  </div>

  <div style="margin-bottom: 12px;">
    <h3 style="margin-top: 6px;">SOP 2: Trip Dispatch & Departure Protocol</h3>
    <p>1. 6 Hours Prior: Dispatcher verifies assigned driver and vehicle availability.<br>
       2. 2 Hours Prior: Customer receives automated SMS/WhatsApp with driver name, phone number, vehicle number, and model.<br>
       3. 15 Minutes Prior: Driver arrives at pickup point and marks arrival.<br>
       4. Trip Start: Odometer reading recorded and shared on group/system.</p>
  </div>

  <div style="margin-bottom: 12px;">
    <h3 style="margin-top: 6px;">SOP 3: Reputation & Google 5-Star Review Engine</h3>
    <p>1. Within 60 minutes of trip completion, CX Desk sends a warm thank-you message.<br>
       2. Include a direct one-click link to Google Business Profile review form.<br>
       3. If customer rates 5 stars, thank them publicly within 24 hours.<br>
       4. In case of grievance, Operations Manager calls customer immediately to resolve and provide compensation if appropriate.</p>
  </div>

  <!-- SECTION 4: PHASED HIRING ROADMAP -->
  <h2>4. Phased Growth & Hiring Roadmap</h2>
  <div class="phase-grid">
    <div class="phase-card">
      <div class="phase-header">Phase 1: Lean / Bootstrapped<br><small style="color:#0284c7;font-weight:600;">(1 &ndash; 3 Core Team Members)</small></div>
      <p style="font-size: 8pt; color: #64748b; margin-top: 4px;">Target: 5&ndash;15 trips/day</p>
      <ul>
        <li><strong>Owner / Founder:</strong> Overall strategy, corporate sales, and finance.</li>
        <li><strong>1 Booking Desk Exec:</strong> Manages calls, WhatsApp, and vehicle dispatch.</li>
        <li><strong>Freelance Web Dev & SEO:</strong> 15-20 hrs/month for Astro website updates and local SEO.</li>
        <li><strong>Fleet:</strong> 100% attached vehicles/drivers.</li>
      </ul>
    </div>

    <div class="phase-card">
      <div class="phase-header">Phase 2: Growth Stage<br><small style="color:#0284c7;font-weight:600;">(5 &ndash; 8 Full-Time Members)</small></div>
      <p style="font-size: 8pt; color: #64748b; margin-top: 4px;">Target: 20&ndash;50 trips/day</p>
      <ul>
        <li><strong>1 Fleet Dispatch Manager:</strong> Dedicated shift coordinator.</li>
        <li><strong>2 Booking Executives:</strong> 2 shifts covering 6:00 AM &ndash; 11:00 PM.</li>
        <li><strong>1 In-house Digital Marketer:</strong> SEO, Google Ads & social campaigns.</li>
        <li><strong>1 Accountant:</strong> Daily trip settlement and driver payout.</li>
        <li><strong>Retainer Web Dev:</strong> For feature additions & automation.</li>
      </ul>
    </div>

    <div class="phase-card">
      <div class="phase-header">Phase 3: Scale Enterprise<br><small style="color:#0284c7;font-weight:600;">(12+ Team Members)</small></div>
      <p style="font-size: 8pt; color: #64748b; margin-top: 4px;">Target: 75+ trips/day & B2B</p>
      <ul>
        <li><strong>Full-Time Tech Lead & Designer:</strong> In-house web and mobile apps.</li>
        <li><strong>24/7 Operations Desk:</strong> 3 rotating dispatch shifts.</li>
        <li><strong>Corporate B2B Sales Lead:</strong> Contracts with IT parks, hotels, airlines.</li>
        <li><strong>Quality Auditor:</strong> Weekly vehicle inspections and driver training.</li>
      </ul>
    </div>
  </div>

  <!-- SECTION 5: RECOMMENDED SOFTWARE STACK -->
  <h2>5. Recommended Software & Technology Stack</h2>
  <table>
    <thead>
      <tr>
        <th style="width: 25%;">Domain</th>
        <th style="width: 30%;">Recommended Tool</th>
        <th style="width: 45%;">Strategic Purpose</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Website & Infrastructure</strong></td>
        <td>Astro, React, Tailwind, Cloudflare</td>
        <td>Sub-second load times, global CDN caching, zero server downtime.</td>
      </tr>
      <tr>
        <td><strong>Customer Chat & Leads</strong></td>
        <td>WhatsApp Business API (Wati / Interakt)</td>
        <td>Shared team inbox, automated quick quotes, booking confirmation dispatch.</td>
      </tr>
      <tr>
        <td><strong>Telephony & Call Routing</strong></td>
        <td>Exotel / MyOperator</td>
        <td>Single business hotline number, call recording, missed call tracking.</td>
      </tr>
      <tr>
        <td><strong>Lead Management (CRM)</strong></td>
        <td>Zoho CRM or Google Sheets + AppSheet</td>
        <td>Pipeline tracking (New Lead &rarr; Quoted &rarr; Booked &rarr; Completed).</td>
      </tr>
      <tr>
        <td><strong>Fleet Telematics</strong></td>
        <td>Fleetx / Trackon GPS</td>
        <td>Real-time vehicle location, speed monitoring, and arrival alerts.</td>
      </tr>
      <tr>
        <td><strong>Accounting & Invoicing</strong></td>
        <td>Zoho Books / Tally Prime</td>
        <td>GST e-invoicing, corporate B2B credit cycles, driver commission ledger.</td>
      </tr>
    </tbody>
  </table>

  <div class="footer-note">
    Kalidass Travels &bull; Confidential & Proprietary Operational Document &bull; Generated for Executive Deployment
  </div>

</body>
</html>`;

  const browser = await chromium.launch({ channel: 'msedge' });
  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: 'networkidle' });

  const pdfPath = path.resolve('Kalidass_Travels_Org_Structure_and_Roles.pdf');
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '15mm', bottom: '15mm', left: '15mm', right: '15mm' }
  });

  await browser.close();
  console.log(`PDF successfully written to: ${pdfPath}`);
}

// -------------------------------------------------------------
// 2. Generate Microsoft Word (.docx)
// -------------------------------------------------------------
async function generateDocx() {
  console.log('Generating Microsoft Word (.docx) document...');

  const borderNone = {
    top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  };

  const tableBorder = {
    top: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
    left: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
    right: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
    insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: 'E2E8F0' },
    insideVertical: { style: BorderStyle.SINGLE, size: 2, color: 'E2E8F0' },
  };

  const createHeading1 = (text) => new Paragraph({
    text: text,
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 140 }
  });

  const createHeading2 = (text) => new Paragraph({
    text: text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 100 }
  });

  const createBullet = (boldPrefix, text) => new Paragraph({
    children: [
      new TextRun({ text: boldPrefix + ' ', bold: true }),
      new TextRun(text)
    ],
    bullet: { level: 0 },
    spacing: { after: 60 }
  });

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: { top: 1200, bottom: 1200, left: 1200, right: 1200 }
        }
      },
      children: [
        // Title block
        new Paragraph({
          children: [
            new TextRun({ text: "KALIDASS TRAVELS", bold: true, size: 20, color: "D97706" })
          ],
          spacing: { after: 80 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Organizational Structure, Department & People Roles", bold: true, size: 36, color: "0F172A" })
          ],
          spacing: { after: 100 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Operational Blueprint to Build, Develop, and Maintain the Website cum Fleet Business", italics: true, size: 22, color: "475569" })
          ],
          spacing: { after: 260 }
        }),

        // Executive Summary
        createHeading1("1. Executive Summary & Operational Concept"),
        new Paragraph({
          children: [
            new TextRun({
              text: "To scale Kalidass Travels into a premier travel brand across Chennai and South India, the business operates on a dual-engine architecture: the Digital Product Engine (Astro-based high-speed website, SEO, Google Business Profile, and PPC ads) feeds qualified traveler leads directly to the Operational Engine (Booking Desk, Fleet Dispatch, Driver Onboarding, and Quality Delivery).",
              size: 21
            })
          ],
          spacing: { after: 200 }
        }),

        // Department 1
        createHeading1("2. Core Departments & Role Specifications"),

        createHeading2("Department 1: Technology & Digital Product (Website Engine)"),
        new Paragraph({
          children: [
            new TextRun({ text: "Mission: ", bold: true }),
            new TextRun({ text: "Develop and maintain a lightning-fast, conversion-optimized Astro web application that drives maximum phone calls and WhatsApp booking inquiries.", italics: true })
          ],
          spacing: { after: 120 }
        }),
        createBullet("1.1 Web Developer / Technical Lead:", "Manages the Astro codebase, React components, Tailwind CSS styling, fare calculator logic, PDF quote generator, Cloudflare CDN, and deployment integrity."),
        createBullet("Core KPI:", "99.9% website uptime, <1.5s mobile page load speed, zero broken booking forms or broken click-to-chat links."),
        createBullet("1.2 UI/UX Designer & Digital Asset Specialist:", "Designs eye-catching tour packages, driver credentials, vehicle showcases, and mobile-ergonomic booking layouts."),
        createBullet("Core KPI:", "Sub-35% bounce rate, high click-through rate on 'Book Now' and 'Call Now' buttons."),

        // Department 2
        createHeading2("Department 2: Digital Marketing & Local SEO (Lead Generation)"),
        new Paragraph({
          children: [
            new TextRun({ text: "Mission: ", bold: true }),
            new TextRun({ text: "Dominate organic search results, Google Local 3-Pack rankings, and run high-intent paid search campaigns across Chennai and Tamil Nadu.", italics: true })
          ],
          spacing: { after: 120 }
        }),
        createBullet("2.1 Local SEO & Google Business Profile (GBP) Manager:", "Maintains daily GBP activity, customer review replies, local directory citations, and localized schema markup (TaxiService, TouristTrip)."),
        createBullet("Core KPI:", "Top 3 Google Maps local ranking for target keywords; continuous organic phone inquiry growth."),
        createBullet("2.2 Performance Marketer (Google Search & Meta Ads):", "Runs paid search campaigns for airport runs, outstation round-trips, and holiday temple packages."),
        createBullet("Core KPI:", "ROAS > 4.0x, cost-per-qualified-lead within benchmark targets."),

        // Department 3
        createHeading2("Department 3: Operations & Fleet Dispatch (Execution & Delivery)"),
        new Paragraph({
          children: [
            new TextRun({ text: "Mission: ", bold: true }),
            new TextRun({ text: "Ensure that every confirmed booking receives a clean, verified vehicle with a courteous, punctual driver.", italics: true })
          ],
          spacing: { after: 120 }
        }),
        createBullet("3.1 Fleet Dispatcher & Operations Controller:", "Assigns appropriate vehicles (Sedan, Ertiga, Innova, Tempo Traveller), coordinates flight arrivals, and resolves vehicle breakdowns with backup cabs."),
        createBullet("Core KPI:", "100% on-time pickup rate; zero unfulfilled confirmed bookings."),
        createBullet("3.2 Driver Relationship & Quality Executive:", "Conducts driver background verification, commercial license audit, vehicle fitness checks, and customer etiquette training."),
        createBullet("Core KPI:", "Driver document compliance rate of 100%; driver average rating > 4.7/5 stars."),
        createBullet("3.3 Professional Chauffeurs & Acting Drivers:", "Executes safe highway driving, punctuality, vehicle cleanliness, and passenger assistance."),

        // Department 4
        createHeading2("Department 4: Sales, Customer Experience & Booking Desk"),
        new Paragraph({
          children: [
            new TextRun({ text: "Mission: ", bold: true }),
            new TextRun({ text: "Respond to customer inquiries within 2 minutes, generate instant quotations, collect advance tokens, and capture 5-star Google reviews.", italics: true })
          ],
          spacing: { after: 120 }
        }),
        createBullet("4.1 Booking & Reservations Executive (WhatsApp / Phone):", "Handles incoming web traffic inquiries, provides transparent tariff quotes, issues PDF confirmations, and collects token advances."),
        createBullet("Core KPI:", "First response time < 2 minutes; inquiry-to-booking conversion rate > 35%."),
        createBullet("4.2 Customer Experience & Reputation Executive:", "Sends automated pre-trip driver details 2 hours prior, monitors multi-day temple trips, and follows up for post-trip Google reviews."),
        createBullet("Core KPI:", ">25% of completed trips result in genuine 5-star Google reviews."),

        // Department 5
        createHeading2("Department 5: Finance, Administration & Compliance"),
        new Paragraph({
          children: [
            new TextRun({ text: "Mission: ", bold: true }),
            new TextRun({ text: "Ensure transparent driver settlements, timely corporate B2B invoicing, GST compliance, and regulatory adherence.", italics: true })
          ],
          spacing: { after: 120 }
        }),
        createBullet("5.1 Accounts & Billing Specialist:", "Generates GST-compliant invoices, reconciles daily cash/UPI driver collections, toll/parking bills, and handles operating expenses."),
        createBullet("Core KPI:", "Zero invoice disputes, on-time weekly driver settlements."),
        createBullet("5.2 Transport Compliance Advisor (Legal Consultant):", "Monitors All India Tourist Permit (AITP) norms, interstate RTO border taxes, and consumer protection terms."),

        // RACI Matrix Table
        createHeading1("3. RACI Responsibility Assignment Matrix"),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: tableBorder,
          rows: [
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Business Workflow", bold: true, color: "FFFFFF" })] })], shading: { fill: "0F172A", type: ShadingType.CLEAR } }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Web Dev", bold: true, color: "FFFFFF" })] })], shading: { fill: "0F172A", type: ShadingType.CLEAR } }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Marketing", bold: true, color: "FFFFFF" })] })], shading: { fill: "0F172A", type: ShadingType.CLEAR } }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Booking", bold: true, color: "FFFFFF" })] })], shading: { fill: "0F172A", type: ShadingType.CLEAR } }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Operations", bold: true, color: "FFFFFF" })] })], shading: { fill: "0F172A", type: ShadingType.CLEAR } }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Finance", bold: true, color: "FFFFFF" })] })], shading: { fill: "0F172A", type: ShadingType.CLEAR } })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph("New Tour / Route Landing Page")] }),
                new TableCell({ children: [new Paragraph("Responsible")] }),
                new TableCell({ children: [new Paragraph("Accountable")] }),
                new TableCell({ children: [new Paragraph("Consulted")] }),
                new TableCell({ children: [new Paragraph("Informed")] }),
                new TableCell({ children: [new Paragraph("-")] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph("Website Fare & Tariff Updates")] }),
                new TableCell({ children: [new Paragraph("Responsible")] }),
                new TableCell({ children: [new Paragraph("Informed")] }),
                new TableCell({ children: [new Paragraph("Consulted")] }),
                new TableCell({ children: [new Paragraph("Accountable")] }),
                new TableCell({ children: [new Paragraph("Consulted")] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph("Instant WhatsApp Lead Response")] }),
                new TableCell({ children: [new Paragraph("-")] }),
                new TableCell({ children: [new Paragraph("-")] }),
                new TableCell({ children: [new Paragraph("Accountable & Responsible")] }),
                new TableCell({ children: [new Paragraph("Consulted")] }),
                new TableCell({ children: [new Paragraph("-")] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph("Vehicle Allocation & Dispatch")] }),
                new TableCell({ children: [new Paragraph("-")] }),
                new TableCell({ children: [new Paragraph("-")] }),
                new TableCell({ children: [new Paragraph("Informed")] }),
                new TableCell({ children: [new Paragraph("Accountable & Responsible")] }),
                new TableCell({ children: [new Paragraph("-")] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph("Breakdown Standby Replacement")] }),
                new TableCell({ children: [new Paragraph("-")] }),
                new TableCell({ children: [new Paragraph("-")] }),
                new TableCell({ children: [new Paragraph("Informed")] }),
                new TableCell({ children: [new Paragraph("Accountable & Responsible")] }),
                new TableCell({ children: [new Paragraph("-")] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph("5-Star Google Review Collection")] }),
                new TableCell({ children: [new Paragraph("-")] }),
                new TableCell({ children: [new Paragraph("Accountable")] }),
                new TableCell({ children: [new Paragraph("Responsible")] }),
                new TableCell({ children: [new Paragraph("Consulted")] }),
                new TableCell({ children: [new Paragraph("-")] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph("Corporate Invoicing & GST Filing")] }),
                new TableCell({ children: [new Paragraph("-")] }),
                new TableCell({ children: [new Paragraph("-")] }),
                new TableCell({ children: [new Paragraph("Consulted")] }),
                new TableCell({ children: [new Paragraph("Informed")] }),
                new TableCell({ children: [new Paragraph("Accountable & Responsible")] })
              ]
            })
          ]
        }),

        // Growth Roadmap
        createHeading1("4. Phased Growth & Hiring Roadmap"),
        createHeading2("Phase 1: Lean / Bootstrapped (1-3 People, 5-15 Trips/Day)"),
        createBullet("Founder / Owner:", "Oversees daily operations, vendor contracts, corporate clients, and finance."),
        createBullet("Booking & Dispatch Executive:", "Handles phone calls, WhatsApp inquiries, driver coordination, and sends quotations."),
        createBullet("Freelance Web Dev & SEO (Retainer):", "Maintains the Astro website, updates packages, and runs local SEO citations."),

        createHeading2("Phase 2: Growth Stage (5-8 People, 20-50 Trips/Day)"),
        createBullet("1 Fleet Dispatch Manager:", "Dedicated monitoring of driver allocations and flight updates."),
        createBullet("2 Booking Executives:", "Two daily shifts covering 6:00 AM to 11:00 PM for instantaneous lead handling."),
        createBullet("1 In-house Digital Marketer:", "Focuses on Google Local 3-Pack, Ads, social media promos, and reviews."),
        createBullet("1 In-house Accountant:", "Daily driver settlement reconciliation and corporate GST invoicing."),

        createHeading2("Phase 3: Scaled Enterprise (12+ People, Multi-City Fleet)"),
        createBullet("Full Tech Team:", "In-house full-stack web developer and UI designer."),
        createBullet("24/7 Operations Desk:", "3 rotating shifts ensuring round-the-clock support."),
        createBullet("Corporate B2B Sales Executive:", "Direct tie-ups with IT parks, hotels, and travel agencies."),

        // Software Stack
        createHeading1("5. Recommended Operational Software Stack"),
        createBullet("Website & Hosting:", "Astro, React, Tailwind CSS, Cloudflare CDN (Fastest, zero maintenance serverless architecture)."),
        createBullet("Customer Chat & Automation:", "WhatsApp Business API (Wati or Interakt) for multi-agent support and instant auto-reply."),
        createBullet("Call Management:", "Exotel or MyOperator for single business hotline routing and call recording."),
        createBullet("CRM & Pipeline:", "Zoho CRM or Google Sheets + AppSheet for tracking inquiries to completion."),
        createBullet("Fleet GPS Tracking:", "Fleetx or Trackon GPS for real-time driver tracking and airport arrival alerts."),
        createBullet("Accounting:", "Zoho Books or Tally Prime for automated GST filing and driver payment ledgers.")
      ]
    }]
  });

  const docxPath = path.resolve('Kalidass_Travels_Org_Structure_and_Roles.docx');
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(docxPath, buffer);
  console.log(`Word Document (.docx) successfully written to: ${docxPath}`);
}

async function main() {
  try {
    await generatePDF();
    await generateDocx();
    console.log('Both documents generated successfully!');
  } catch (err) {
    console.error('Error during generation:', err);
    process.exit(1);
  }
}

main();
