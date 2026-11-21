# Kalidass Travels — Viator Supplier & Tripadvisor Business Onboarding Kit

> **Quick Diagnosis:** The two accounts you created earlier (`tripadvisor.com/Profile/Kalidasstravels` and `viator.com/account/myProfile`) are **consumer/traveler accounts**. You cannot list tours, receive verified business reviews, or accept bookings from them. Use this kit to set up your official **Operator / Business** accounts properly.

---

## 1. Master Business Profile (Copy-Paste Reference)

Use these **exact consistent NAP (Name, Address, Phone)** details across Viator, Tripadvisor, and Google Business Profile for maximum SEO trust:

| Field | Value |
| :--- | :--- |
| **Business Name** | `Kalidass Travels` |
| **Legal / GST Registration** | `33COVPM0531D1Z4` |
| **Founded** | `2019` |
| **Primary Email** | `kalidasstravels2015@gmail.com` |
| **Primary Phone (24/7 Ops / WhatsApp)** | `+91 89395 39211` |
| **Backup Phones** | `+91 63819 39769`, `+91 90923 03060` |
| **Website** | `https://kalidasstravels.in` |
| **Registered Address** | `United Colony, BHEL Nagar, Medavakkam, Chennai, Tamil Nadu 600100, India` |
| **Google Maps Listing** | `https://maps.app.goo.gl/i2LdJhWMi2ZgAiCa8` |
| **Operating Hours** | `Open 24 Hours (Monday – Sunday)` |
| **Languages Spoken** | `English, Tamil` |

**Short Bio (158 chars — fits Tripadvisor's 160-character limit without cutting off):**
> `Chennai's trusted travel partner since 2019. 24/7 airport transfers, private AC cabs & curated South India temple & heritage day tours. Verified chauffeurs.`

**Full Business Description (for Viator Supplier Profile & Tripadvisor Management Center):**
> `Kalidass Travels is a GST-registered, Chennai-based private transport and tour operator serving travelers across South India since 2019. We specialize in 24/7 Chennai International Airport (MAA) transfers, private AC day tours to Pondicherry, Kanchipuram, Mahabalipuram, and Tirupati, and multi-day temple pilgrimages. Every trip includes well-maintained commercial-plate AC vehicles (Sedan, SUV, Innova Crysta, Tempo Traveller), police-verified English/Tamil-speaking chauffeurs, and all-inclusive transparent pricing with zero hidden charges.`

---

## 2. Step-by-Step Registration Checklist

### Step A: Register on Viator Supplier Portal (Do This First)
Because **Viator is owned by Tripadvisor**, creating bookable products on Viator automatically distributes them onto Tripadvisor's "Things to Do" marketplace.

1. Go to **[supplier.viator.com](https://supplier.viator.com/)** (NOT `viator.com`).
2. Click **Sign Up / Get Started** and register using `kalidasstravels2015@gmail.com` (choose a strong password; keep it separate from your customer login if needed).
3. Enter **Company Details** using the Master Business Profile table above.
4. Complete **Account Verification**:
   - Upload business verification (GST certificate `33COVPM0531D1Z4` / Udyam registration) and owner ID when prompted.
   - Add your **Payout Bank Account** (Indian Current Account with IFSC/SWIFT code, or Payoneer if settling in USD). Select **INR** payout currency if available to avoid double FX conversion.
5. Set **Account-Wide Policies**:
   - **Cancellation Policy:** `Standard (Free cancellation up to 24 hours before start time)` — strongly recommended; Viator ranks 24-hour free-cancellation listings significantly higher.
   - **Confirmation Type:** `Instant Confirmation` with a **Booking Cutoff** of `4–6 hours` before pickup (gives your Chennai dispatch desk enough time to assign a driver cleanly).
   - **Pickup & Communication:** Enable WhatsApp / Phone contact in voucher instructions (`+91 89395 39211`).
6. Create the **4 Starter Products** below (note: Viator charges a one-time product review fee of ~USD \$29 per new listing and ~20–25% commission on completed bookings).

### Step B: Create / Claim Your Tripadvisor Business Listing (Free)
1. Go to **[tripadvisor.com/GetListedNew](https://www.tripadvisor.com/GetListedNew)** (do NOT use `tripadvisor.com/Profile/...`).
2. Search for `Kalidass Travels` in `Chennai` first to make sure a listing doesn't already exist.
3. If none exists, click **Add your business** → Category: **Things to Do** → Subcategory: **Transportation / Taxis & Shuttles / Private Tours**.
4. Paste the **Master Business Profile** details and upload your logo (`public/images/logo.png`) + 6–10 crisp vehicle & tour photos.
5. Once Tripadvisor approves the listing (typically 3–7 business days), claim it in **Tripadvisor Management Center** (`tripadvisor.com/Owners`) so you can:
   - Reply to customer reviews.
   - Share your direct **"Write a Review"** link with happy Chennai / Tirupati / Pondicherry guests.
   - Link your Viator bookable products directly to your Tripadvisor page.

### Step C: Activate Links on `kalidasstravels.in` (1-File Edit)
Once both pages are live and approved:
1. Open `src/data/externalProfiles.json`.
2. Paste your live `tripadvisor.businessUrl`, `tripadvisor.reviewUrl`, and `viator.supplierUrl`.
3. Rebuild and deploy (`npm run build`). Your website's **JSON-LD `sameAs` schema**, **Reviews section**, and **Footer** will automatically activate — while keeping all website bookings at **0% commission**.

---

## 3. All-Inclusive Viator Pricing Matrix (+30% Margin Protection)

All prices below are **per private vehicle (group price)**, **100% all-inclusive** (AC vehicle, fuel, chauffeur allowance/bata, highway FASTag tolls, state permits, and parking). International & Viator travelers strongly penalize listings with surprise cash toll/bata extras.

| Starter Product | Vehicle Tier | Direct Website Rate (1-Day) | **Viator List Price (+30% rounded)** | Est. Net Payout (~75–80%) |
| :--- | :--- | :---: | :---: | :---: |
| **1. Chennai Airport (MAA) Transfer** *(City Zone)* | AC Sedan (1–3 pax) | ₹1,400 | **₹1,850** | ₹1,388 – ₹1,480 |
| | AC Innova / SUV (1–6 pax) | ₹2,400 | **₹3,150** | ₹2,363 – ₹2,520 |
| | AC Innova Crysta (1–6 pax) | ₹2,950 | **₹3,850** | ₹2,888 – ₹3,080 |
| **2. Kanchipuram Heritage Day Tour** | AC Sedan (1–4 pax) | ₹3,500 | **₹4,600** | ₹3,450 – ₹3,680 |
| | AC Ertiga SUV (1–6 pax) | ₹4,500 | **₹5,900** | ₹4,425 – ₹4,720 |
| | AC Innova (1–6 pax) | ₹5,500 | **₹7,200** | ₹5,400 – ₹5,760 |
| **3. Pondicherry & Auroville Day Tour** | AC Sedan (1–4 pax) | ₹4,500 | **₹5,900** | ₹4,425 – ₹4,720 |
| | AC Ertiga SUV (1–6 pax) | ₹5,800 | **₹7,600** | ₹5,700 – ₹6,080 |
| | AC Innova (1–6 pax) | ₹7,000 | **₹9,100** | ₹6,825 – ₹7,280 |
| **4. Tirupati Balaji Cab Tour** *(Cab Only)* | AC Sedan (1–4 pax) | ₹6,000 | **₹7,800** | ₹5,850 – ₹6,240 |
| | AC Ertiga SUV (1–6 pax) | ₹7,500 | **₹9,800** | ₹7,350 – ₹7,840 |
| | AC Innova (1–6 pax) | ₹8,500 | **₹11,100** | ₹8,325 – ₹8,880 |

> **Tip:** On Viator, create **Options** inside each product for `AC Sedan (Up to 3/4 Guests)` and `AC SUV / Innova (Up to 6 Guests)` instead of creating separate paid products — this saves you multiple \$29 review fees!

---

## 4. Ready-to-Copy Product Sheets (4 Starter Listings)

### Product 1: Private Chennai Airport (MAA) Transfer
- **Viator Product Title:** `Private Chennai Airport (MAA) Arrival or Departure Transfer by AC Car`
- **Category:** `Transfers & Ground Transport → Airport & Hotel Transfers`
- **Duration:** `45 minutes to 1 hour 30 minutes`
- **Pricing Type:** `Per Group / Vehicle` (Options: AC Sedan up to 3 pax + 2 bags; AC Innova up to 6 pax + 4 bags)
- **Short Summary:**
  > Skip taxi queues at Chennai International Airport (MAA) with a reliable 24/7 private AC transfer. Enjoy live flight tracking, courteous police-verified chauffeurs, and direct door-to-door drop-off anywhere in Chennai city with zero surge pricing.
- **What's Included:**
  - Private air-conditioned vehicle (Sedan or Innova/SUV)
  - Professional English/Tamil-speaking, police-verified chauffeur
  - Real-time flight arrival tracking (up to 60 minutes complimentary waiting time for arrivals)
  - Airport parking fees and city toll charges
  - Bottled drinking water
- **What's Excluded:**
  - Gratuities (optional)
  - Extra stops outside Chennai city limits (OMR/ECR beyond Sholinganallur or Mahabalipuram available as an add-on)
- **Voucher / Pickup Instructions:**
  > Please share your flight number, arrival/departure time, hotel address, and WhatsApp number upon booking. Your chauffeur's name, photo, and vehicle number will be sent via WhatsApp/SMS 2 hours before pickup. 24/7 Dispatch Desk: +91 89395 39211.

---

### Product 2: Private Pondicherry & Auroville Day Tour from Chennai
- **Viator Product Title:** `Private Pondicherry & Auroville Full-Day Tour from Chennai by AC Car`
- **Category:** `Day Trips & Excursions → Full-Day Tours`
- **Duration:** `12 to 14 hours` (Recommended pickup: `6:30 AM` or `7:00 AM`)
- **Pricing Type:** `Per Group / Vehicle` (Options: AC Sedan 1–4 pax, AC Ertiga 1–6 pax, AC Innova 1–6 pax)
- **Short Summary:**
  > Explore the French colonial charm of Pondicherry and the spiritual township of Auroville on a comfortable, all-inclusive private day trip from Chennai along the scenic East Coast Road (ECR).
- **Sample Itinerary:**
  1. **Chennai Hotel / Airport Pickup (6:30 AM – 7:00 AM):** Scenic drive south along East Coast Road (ECR).
  2. **Auroville & Matrimandir Viewing Point (2 hours):** Visit the Visitor Centre and take the shaded walk to the Matrimandir viewing point.
  3. **White Town / French Quarter (2 hours):** Stroll past mustard-yellow colonial villas, cafes, and Sri Aurobindo Ashram.
  4. **Promenade Beach & Basilica of the Sacred Heart (1.5 hours):** Walk along Rock Beach and visit the Gothic church.
  5. **Return Drive to Chennai:** Drop-off at your Chennai hotel or residence by evening.
- **What's Included:**
  - Private AC vehicle with dedicated chauffeur for the full day
  - All East Coast Road (ECR) / NH highway FASTag tolls
  - Puducherry interstate entry permit
  - Parking charges & driver allowance (bata)
  - Hotel / Airport pickup and drop-off in Chennai
- **What's Excluded:**
  - Food, drinks, and personal expenses
  - Monument/museum entry fees or boating tickets
  - Guided walking tour inside monuments (driver assists with timings and route)

---

### Product 3: Private Kanchipuram Temple & Silk Heritage Day Tour from Chennai
- **Viator Product Title:** `Private Kanchipuram Ancient Temples & Silk Weavers Day Tour from Chennai`
- **Category:** `Cultural & Theme Tours → Historical & Heritage Tours`
- **Duration:** `8 to 10 hours` (Recommended pickup: `7:30 AM` or `8:00 AM`)
- **Pricing Type:** `Per Group / Vehicle` (Options: AC Sedan 1–4 pax, AC Ertiga 1–6 pax, AC Innova 1–6 pax)
- **Short Summary:**
  > Discover the "City of Thousand Temples" on a private AC day trip from Chennai to Kanchipuram. Marvel at Pallava and Chola stone architecture and witness traditional handloom Kanjeevaram silk weaving up close.
- **Sample Itinerary:**
  1. **Chennai Pickup (8:00 AM):** Comfortable drive west to Kanchipuram (~75 km).
  2. **Kailasanathar Temple (1 hour):** 8th-century sandstone masterpiece of Pallava architecture.
  3. **Ekambareswarar Temple (1.5 hours):** One of the Pancha Bhoota Stalas with its sacred 3,500-year-old mango tree.
  4. **Kamakshi Amman Temple & Varadaraja Perumal Temple (2 hours):** Iconic spiritual landmarks of Kanchipuram.
  5. **Traditional Kanjeevaram Silk Weaving Visit (1 hour):** Optional stop to see authentic handloom silk weavers at work (zero shopping pressure).
  6. **Return Drive to Chennai:** Drop-off at your Chennai hotel or residence.
- **What's Included:**
  - Private AC vehicle with verified English/Tamil-speaking chauffeur
  - All highway tolls, temple parking fees, and driver allowance
  - Hotel pickup and drop-off anywhere in Chennai
- **What's Excluded:**
  - Meals and beverages
  - Temple special entry / camera fees (paid directly on site if desired)
  - Licensed monument tour guide (optional add-on on request)

---

### Product 4: Private Tirupati Balaji Temple Cab Tour from Chennai
- **Viator Product Title:** `Private Chennai to Tirupati & Tirumala Balaji Temple Round-Trip Cab Tour`
- **Category:** `Day Trips & Excursions → Private & Custom Tours`
- **Duration:** `14 to 16 hours` (Recommended pickup: `4:00 AM` – `5:00 AM`)
- **Pricing Type:** `Per Group / Vehicle` (Options: AC Sedan 1–4 pax, AC Ertiga 1–6 pax, AC Innova 1–6 pax)
- **Short Summary:**
  > Travel comfortably from Chennai to the sacred hills of Tirumala in a dedicated private AC cab. Includes Andhra Pradesh interstate permit, Tirumala ghat road hill climb, tolls, and hilltop parking — ideal for travelers who already hold TTD Darshan tickets.
- **Important Disclaimer (Place at Top of Description):**
  > **Please Note:** This booking is for **private AC transportation and chauffeur service only**. TTD Special Entry Darshan (SED) tickets are **not included** and must be booked directly by travelers on the official Tirumala Tirupati Devasthanams (TTD) portal.
- **Sample Itinerary:**
  1. **Early Morning Chennai Pickup (4:00 AM – 5:00 AM):** Smooth highway drive to Tirupati (~135 km each way).
  2. **Tirumala Ghat Road Ascent:** Scenic drive up the Seven Hills to Tirumala hilltop parking.
  3. **Sri Venkateswara Temple Darshan (4–6 hours):** Chauffeur drops you near the temple access zone and waits at hilltop parking until you complete darshan.
  4. **Padmavathi Ammavari Temple, Tiruchanur (Optional, 1 hour):** Visit the Goddess Padmavathi shrine in lower Tirupati.
  5. **Return Drive to Chennai:** Drop-off at your Chennai hotel or residence.
- **What's Included:**
  - Private AC vehicle with experienced hill-driving chauffeur
  - Andhra Pradesh interstate entry permit
  - NH FASTag tolls & Tirumala ghat road ascent
  - Tirupati & TTD hilltop parking fees + driver allowance (bata)
- **What's Excluded:**
  - **TTD Darshan tickets** (travelers must arrange directly via official TTD website)
  - Food, prasadam, and personal expenses

---

## 5. Photo Checklist (Viator Quality Requirements)

Viator requires **at least 6 high-resolution landscape photos** per product (minimum `1280 × 720 px`, JPG/PNG, **no text overlays, no watermarks, no phone numbers**).
- You already have clean base visuals in `public/images/fleet/`, `public/images/services/`, and `public/images/temple/` — export JPG/PNG versions without any promotional text or borders before uploading.
- Also take 3–4 real daytime smartphone photos (landscape mode) of your cleanest Swift Dzire / Innova Crysta with a uniformed driver standing politely beside the car — Viator reviewers love authentic fleet photos!
