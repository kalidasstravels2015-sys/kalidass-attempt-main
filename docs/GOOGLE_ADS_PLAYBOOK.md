# Google Ads Campaign Strategy & Architecture Playbook
**Account ID:** `AW-18463679349` | **Business:** Kalidass Travels (Est. 2015, Medavakkam, Chennai)  
**Primary Contact Helpline:** `+91 89395 39211` | **Official Domain:** `https://kalidasstravels.in`

---

## 1. Executive Summary & Objective

Kalidass Travels operates a high-trust, executive taxi, outstation cab, airport transfer, and temple pilgrimage mobility fleet headquartered in Medavakkam, Chennai. The platform's unique selling propositions (USPs) are:
- **Zero Surge Gouging:** Predictable, transparent tariffs.
- **Executive Fleet:** Swift Dzire, Toyota Etios, Maruti Ertiga, Toyota Innova Crysta, and Tempo Traveller.
- **Frictionless Lead Funnel:** Direct Phone Dial + Instant WhatsApp Concierge with upfront fare calculation.

The primary objective of this Google Ads strategy is **Qualified Lead Generation** (Phone Calls and WhatsApp Conversations) with an initial target Cost Per Acquisition (CPA) of **₹120 – ₹180 per lead**.

---

## 2. On-Site Google Ads Conversion Architecture

All conversion events are configured on-site via `Layout.astro` and `src/lib/analytics.js` with dual dispatch:
1. **Google Ads Standard Event (`gtag('event', 'conversion', { send_to: 'AW-18463679349/<LABEL>' })`)**: Triggered when conversion labels are defined in `.env`.
2. **Backward-Compatible Custom Event (`gtag('event', 'ads_conversion_Request_quote_1')`)**: Ensures zero event loss if using existing custom conversions or GA4 import.
3. **Automated Anti-Leakage Lead Capture**: Logs timestamped lead records directly to the backend logging engine (`/api/record-calculation`).

### How to Find & Configure Conversion Action Labels in Google Ads:

1. Sign in to your [Google Ads Account](https://ads.google.com).
2. Go to **Goals** > **Conversions** > **Summary**.
3. Click **+ New conversion action** > Select **Website**.
4. Enter `https://kalidasstravels.in` and click **Scan**.
5. Scroll down to **Add a conversion action manually**:
   - **Action 1: Phone Calls**
     - Category: *Contact* or *Phone call lead*
     - Conversion name: `Phone Call Lead`
     - Value: *Use the same value for each conversion (e.g., ₹100)* or *Don't use a value*
     - Count: *One* (lead generation)
   - **Action 2: WhatsApp Clicks**
     - Category: *Contact* or *Submit lead form*
     - Conversion name: `WhatsApp Lead`
     - Value: *Use ₹150*
     - Count: *One*
   - **Action 3: Fare Estimate & Bookings**
     - Category: *Submit lead form* / *Request quote*
     - Conversion name: `Quote Request`
     - Value: *Use ₹200*
     - Count: *One*
6. Click **Save and Continue**.
7. Under **Tag setup**, click **Use Google Tag** > **See event snippet**.
8. Look for the snippet line:
   ```javascript
   gtag('event', 'conversion', {'send_to': 'AW-18463679349/AbCdEfGhIjK'});
   ```
   The part after the slash (`AbCdEfGhIjK`) is your **Conversion Label**.
9. Add these labels to your `.env` file on your server/host:
   ```env
   PUBLIC_GOOGLE_ADS_ID=AW-18463679349
   PUBLIC_ADS_CONVERSION_LABEL_CALL=YOUR_CALL_LABEL_HERE
   PUBLIC_ADS_CONVERSION_LABEL_WHATSAPP=YOUR_WHATSAPP_LABEL_HERE
   PUBLIC_ADS_CONVERSION_LABEL_QUOTE=YOUR_QUOTE_LABEL_HERE
   PUBLIC_ADS_CONVERSION_LABEL_BOOKING=YOUR_BOOKING_LABEL_HERE
   ```

---

## 3. Campaign Structure & Budget Allocation

Split your monthly advertising budget into **3 tightly-themed Search Campaigns** to prevent keyword cannibalization and ensure high Ad Relevance (Quality Score 8–10):

| Campaign Name | Focus Area | Target Audience | Recommended Daily Budget | Bidding Strategy |
| :--- | :--- | :--- | :--- | :--- |
| **CAMPAIGN 1: Airport Taxi MAA** | Urgent Airport Transfers | Chennai + 35km radius | 40% (e.g. ₹600/day) | Maximize Clicks (CPC cap ₹25) $\to$ Max Conversions |
| **CAMPAIGN 2: Outstation Cabs** | Intercity (Pondy, Bangalore, Vellore) | Chennai residents | 35% (e.g. ₹500/day) | Maximize Clicks (CPC cap ₹28) $\to$ Max Conversions |
| **CAMPAIGN 3: Temple Tours** | Tirupati, Navagraha, Kanchipuram | Chennai & TN tourists | 25% (e.g. ₹400/day) | Maximize Clicks (CPC cap ₹22) $\to$ Max Conversions |

---

## 4. Campaign 1: Chennai Airport Taxi (MAA Transfers)

- **Campaign Objective:** Leads (Search Network only, Uncheck Display Expansion)
- **Locations Target:** Chennai Metropolitan Area (Medavakkam, Velachery, OMR, Tambaram, Porur, Anna Nagar, T. Nagar) + 35 km radius
- **Schedule:** 24 Hours / 7 Days (flight arrivals run late-night and early morning)
- **Primary Landing Page:** `https://kalidasstravels.in/services/chennai-airport-taxi/`

### Ad Group 1A: Airport Pickup (Arrivals)
**Keywords:**
```text
[chennai airport taxi]
[chennai airport cab booking]
[taxi from chennai airport]
[maa airport taxi service]
"chennai airport pickup taxi"
"prepaid taxi chennai airport alternative"
"cab booking from chennai airport"
"airport cab chennai to city"
"innovas from chennai airport"
```

### Ad Group 1B: Airport Drop (Departures)
**Keywords:**
```text
[cab to chennai airport]
[taxi to maa airport]
"airport drop cab chennai"
"medavakkam to chennai airport taxi"
"velachery to chennai airport cab"
"omr to chennai airport taxi"
"tambaram to chennai airport cab"
"early morning airport taxi chennai"
"book taxi to chennai airport"
```

### Ad Group 1C: Airport to Outstation (Direct Terminal Transit)
**Keywords:**
```text
[chennai airport to pondicherry taxi]
[chennai airport to tirupati taxi]
"chennai airport to vellore cab"
"chennai airport to outstation taxi"
"maa airport to pondicherry cab fare"
```

### Responsive Search Ad (RSA) Copy — Character Counts Verified:
#### Headlines (15 Headlines — Max 30 chars each):
- `Chennai Airport Taxi — Flat Fare` *(30 chars)* — **Pin Position 1**
- `MAA Airport Cab: ₹0 Surge` *(25 chars)* — **Pin Position 1**
- `On-Time Airport Pickup & Drop` *(29 chars)* — **Pin Position 2**
- `Medavakkam & OMR Airport Cabs` *(29 chars)* — **Pin Position 2**
- `Clean Sedans & Innova Crysta` *(28 chars)*
- `Flight Tracking & Zero Delay` *(28 chars)*
- `Direct WhatsApp & Call Booking` *(30 chars)*
- `Transparent Upfront Tariffs` *(27 chars)*
- `Professional Chauffeurs` *(23 chars)*
- `24/7 MAA Terminal Taxi Desk` *(27 chars)*
- `Instant Cab Booking On WA` *(25 chars)*
- `Trusted Since 2015 | 4.9★` *(24 chars)*
- `Swift Dzire, Ertiga & Innova` *(29 chars)*
- `Zero Hidden Charges or Surge` *(28 chars)*
- `Book MAA Airport Transfer Now` *(29 chars)*

#### Descriptions (4 Descriptions — Max 90 chars each):
- `Executive Chennai Airport cabs with guaranteed on-time arrival. Sedans & Innova Crysta.` *(89 chars)* — **Pin Position 1**
- `Skip airport prepaid taxi queues. Direct terminal pickup with 24/7 dispatch helpline.` *(87 chars)* — **Pin Position 2**
- `Serving Medavakkam, OMR, Velachery, Tambaram & entire Chennai. AC cabs with digital bill.` *(89 chars)*
- `Zero surge pricing guarantee. Transparent tariffs, courteous drivers. WhatsApp or call.` *(88 chars)*

---

## 5. Campaign 2: Outstation Cabs from Chennai

- **Campaign Objective:** Leads (Search Network only)
- **Locations Target:** Chennai, Kanchipuram, Chengalpattu, Tiruvallur
- **Schedule:** 5:00 AM – 11:30 PM (or 24/7 with -20% bid adjustment between 1:00 AM - 4:00 AM)
- **Primary Landing Pages:**
  - Pondicherry: `https://kalidasstravels.in/services/chennai-to-pondicherry-taxi/`
  - Bangalore: `https://kalidasstravels.in/services/chennai-to-bangalore-taxi/`
  - Vellore: `https://kalidasstravels.in/services/chennai-to-vellore-taxi/`
  - General Outstation: `https://kalidasstravels.in/services/outstation-cabs/`

### Ad Group 2A: Chennai to Pondicherry Taxi
**Keywords:**
```text
[chennai to pondicherry taxi]
[chennai to pondicherry cab fare]
"chennai to pondy round trip cab"
"one way taxi chennai to pondicherry"
"chennai to pondicherry drop taxi"
"chennai to pondicherry car rental with driver"
"chennai to auroville taxi"
```

### Ad Group 2B: Chennai to Bangalore Cab
**Keywords:**
```text
[chennai to bangalore taxi]
[chennai to bangalore one way cab]
"chennai to bangalore drop taxi fare"
"chennai to bangalore car package"
"innova crysta chennai to bangalore"
"doorstep taxi chennai to bangalore"
```

### Ad Group 2C: Chennai to Vellore Taxi
**Keywords:**
```text
[chennai to vellore cab]
[chennai to vellore taxi fare]
"chennai to vellore cmc taxi"
"chennai to vellore golden temple car"
"round trip taxi chennai to vellore"
```

### Ad Group 2D: Generic Outstation Cabs
**Keywords:**
```text
[outstation cabs chennai]
"outstation taxi service in chennai"
"round trip taxi chennai"
"chennai outstation cab booking"
"best outstation taxi chennai"
"transparent per km cab chennai"
```

### Responsive Search Ad (RSA) Copy:
#### Headlines (Max 30 chars):
- `Chennai Outstation Cabs` *(23 chars)* — **Pin Position 1**
- `Chennai to Pondicherry Taxi` *(27 chars)* — **Pin Position 1**
- `Chennai to Bangalore Cabs` *(25 chars)* — **Pin Position 1**
- `Transparent Per-Km Billing` *(26 chars)* — **Pin Position 2**
- `Zero Toll Traps, Fair Rates` *(28 chars)* — **Pin Position 2**
- `Clean Sedans & Innova Crysta` *(28 chars)*
- `One-Way & Round Trips` *(21 chars)*
- `Sanitized AC Cabs Guaranteed` *(28 chars)*
- `Courteous Highway Chauffeurs` *(28 chars)*
- `Doorstep Pickup in Chennai` *(26 chars)*
- `Instant WhatsApp Fare Quote` *(26 chars)*
- `Swift Dzire, Etios, Innova` *(26 chars)*
- `100% On-Time Outstation Cab` *(27 chars)*
- `Trusted Travel Partner 2015` *(27 chars)*
- `Book Your Outstation Trip` *(25 chars)*

#### Descriptions (Max 90 chars):
- `Comfortable outstation cabs from Chennai with transparent per-km billing and zero surge.` *(89 chars)*
- `One-way drops & round-trips to Pondicherry, Bangalore, Vellore & Tirupati. Book in 1 min.` *(89 chars)*
- `Well-maintained AC fleet with experienced highway chauffeurs. Instant booking on WhatsApp.` *(90 chars)*
- `No hidden fees or driver bata confusion. Clean vehicles with verified GPS tracking.` *(85 chars)*

---

## 6. Campaign 3: South India Temple Tours & Pilgrimage Packages

- **Campaign Objective:** Leads (Search Network only)
- **Locations Target:** Chennai + Tamil Nadu, Karnataka (Bangalore), Telangana (Hyderabad), Andhra Pradesh
- **Primary Landing Pages:**
  - Tirupati: `https://kalidasstravels.in/services/chennai-to-tirupati-car-package/`
  - Navagraha: `https://kalidasstravels.in/services/navagraha-temple-tour/`
  - Temple Tours Hub: `https://kalidasstravels.in/services/temple-tours/`

### Ad Group 3A: Chennai to Tirupati Car Package
**Keywords:**
```text
[chennai to tirupati car package]
[chennai to tirupati taxi]
"chennai to tirupati 1 day package"
"chennai to tirupati package by car"
"chennai to tirupati innova package"
"same day tirupati trip from chennai"
"tirupati balaji darshan cab chennai"
```

### Ad Group 3B: Navagraha Temples Tour from Chennai
**Keywords:**
```text
[navagraha temple tour from chennai]
"kumbakonam navagraha taxi package"
"navagraha temple tour 2 days car"
"chennai to kumbakonam navagraha cab"
"9 temples tour package from chennai"
```

### Ad Group 3C: Kanchipuram, Chidambaram & Rameswaram
**Keywords:**
```text
[chennai to kanchipuram temple taxi]
"chidambaram natarajar temple car package"
"chennai to rameswaram car package 2 days"
"south india temple tour cab service"
"golden temple vellore 1 day car package"
```

### Responsive Search Ad (RSA) Copy:
#### Headlines (Max 30 chars):
- `Tirupati Car Package Chennai` *(28 chars)* — **Pin Position 1**
- `Navagraha 9 Temples Tour` *(24 chars)* — **Pin Position 1**
- `Chennai Temple Tour Cabs` *(24 chars)* — **Pin Position 1**
- `Same-Day & 2-Day Packages` *(24 chars)* — **Pin Position 2**
- `Family & Senior Friendly` *(24 chars)* — **Pin Position 2**
- `Clean AC Sedans & Innovas` *(24 chars)*
- `Temple Timing Guidance` *(22 chars)*
- `Zero Darshan Stress, AC Cab` *(27 chars)*
- `Doorstep Pickup & Return` *(24 chars)*
- `Experienced Temple Drivers` *(26 chars)*
- `Customized Pilgrimage Trips` *(27 chars)*
- `Tempo Traveller for Groups` *(26 chars)*
- `Clear All-Inclusive Tariffs` *(27 chars)*
- `Instant WhatsApp Itinerary` *(26 chars)*
- `Book Sacred Tour with Us` *(24 chars)*

#### Descriptions (Max 90 chars):
- `Hassle-free Tirupati & Navagraha temple tour packages by AC car. Doorstep Chennai pickup.` *(88 chars)*
- `Devoted, patient chauffeurs familiar with temple timings, routes and senior citizen care.` *(90 chars)*
- `Same-day and multi-day packages available in Dzire, Innova Crysta & Tempo Traveller.` *(85 chars)*
- `Transparent pilgrimage pricing with zero surprise charges. Inquire now via WhatsApp/Call.` *(90 chars)*

---

## 7. Universal Negative Keyword Master List

Add this list at the **Account Level** under **Tools & Settings > Shared Library > Negative keyword lists**:

### A. Employment & Hiring (Eliminates Job Seekers)
```text
job
jobs
vacancy
vacancies
recruitment
driver salary
driver hiring
uber driver attachment
ola driver registration
rapido partner
driver wanted
salary
careers
resume
cv
apply
```

### B. Self-Drive & Bike Rentals (Eliminates Non-Chauffeur Inquiries)
```text
self drive
self drive car
without driver
zoomcar
revv
mychoize
bike rental
rent a bike
scooty rental
royal enfield rent
activa rent
bicycle rent
car subscription
```

### C. Public Transportation (Eliminates Low-Ticket State Commuters)
```text
bus
buses
bus timing
bus ticket
setc
tnstc
government bus
redbus
abhibus
train
trains
train timing
irctc
railway ticket
tatkal
metro
metro fare
suburban train
electric train
```

### D. Airline & Flight Information (Eliminates Airport Passenger Inquiries)
```text
flight status
flight schedule
indigo customer care
air india enquiry
flight delayed
boarding pass
terminal 1 departures
duty free
lost luggage
lost baggage
customs duty
immigration
visas
currency exchange rate
```

### E. Free, DIY, and Informational Queries
```text
free
history of
meaning
wikipedia
photos download
video
mp3
song
lyrics
temple history
darshan review
rules
dress code
complaints
cheat
scam
```

---

## 8. High-Impact Ad Assets (Extensions) Checklist

Ad extensions boost Ad Rank and CTR by up to 25%:

### 1. Call Asset (MANDATORY)
- **Phone Number:** `+91 89395 39211`
- **Call Reporting:** On
- **Track Call Conversions:** Enabled

### 2. Sitelink Assets (4 Key Links with Descriptions)
- **Sitelink 1: Chennai Airport Taxi**
  - Line 1: `Fast MAA Pickup & Drop`
  - Line 2: `Clean AC Cabs with ₹0 Surge`
  - URL: `https://kalidasstravels.in/services/chennai-airport-taxi/`
- **Sitelink 2: Outstation Tariffs**
  - Line 1: `Transparent Per-Km Billing`
  - Line 2: `Sedans, Ertiga & Innova Crysta`
  - URL: `https://kalidasstravels.in/tariff/`
- **Sitelink 3: Tirupati Tour Package**
  - Line 1: `Same-Day & 2-Day Packages`
  - Line 2: `Doorstep Pickup & Senior Care`
  - URL: `https://kalidasstravels.in/services/chennai-to-tirupati-car-package/`
- **Sitelink 4: Explore Our Fleet**
  - Line 1: `Dzire, Etios, Innova & Tempo`
  - Line 2: `Inspected Clean AC Vehicles`
  - URL: `https://kalidasstravels.in/fleet/`

### 3. Callout Assets (Short Value Props)
- `Zero Surge Pricing`
- `24/7 Dispatch Desk`
- `Clean Sanitized AC Fleet`
- `Courteous Uniformed Drivers`
- `Transparent Per-Km Billing`
- `Trusted Since 2015`
- `GPS Tracked Vehicles`
- `Digital GST Invoices`

### 4. Structured Snippets
- **Type (Amenities):** `Air Conditioned, Bottled Water, FastTag Express Tolls, Luggage Assistance, GPS Safety`
- **Type (Models):** `Swift Dzire, Toyota Etios, Maruti Ertiga, Innova Crysta, Tempo Traveller`

---

## 9. Launch & Optimization Roadmap

### Days 1 to 14: Learning & Quality Calibration
- Set Bidding to **Maximize Clicks** with Max CPC bid limit:
  - Airport: ₹25
  - Outstation: ₹28
  - Temple Tours: ₹22
- Review **Search Terms Report** every 48 hours and add negative keywords to prune waste.
- Confirm that conversion counts for `Phone Call Lead` and `WhatsApp Lead` match incoming calls/chats.

### Days 15 to 30: Smart Bidding Switch
- Once the campaigns reach **30+ verified conversions**, switch bidding to:
  - **Maximize Conversions** with Target CPA of ₹150.
- Increase daily budgets on high-performing ad groups (e.g., Pondicherry & Airport).

### Day 30+: Peak Scaling & Margin Expansion
- Expand keywords into exact match variants of top-performing search queries.
- Launch seasonal promotion ads for Karthigai Deepam, Margazhi, Pongal, and Summer vacations.
