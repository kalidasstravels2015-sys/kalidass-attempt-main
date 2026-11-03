import fs from 'fs';
import path from 'path';

const filePath = path.resolve('src/data/serviceDetails.json');
const services = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

const newServices = [
  {
    slug: "local-hourly-cabs",
    category: "Popular Destinations",
    title: "Local Hourly Car Rental in Chennai – 4h, 8h & 12h Packages",
    duration: "Flexible (4 Hrs, 5 Hrs, 8 Hrs, 10 Hrs, 12 Hrs)",
    overview: "Book local hourly car rentals in Chennai with private chauffeurs. Ideal for business meetings, shopping in T. Nagar, family functions, hospital visits, and flexible city travel. Transparent packages from 4 Hrs / 40 KM to 12 Hrs / 120 KM. Zero surge pricing, spotless AC vehicles, and punctual doorstep pickup.",
    routePlan: [
      {
        stop: "Doorstep Chennai Pickup",
        time: "Customer Choice",
        desc: "Chauffeur arrives at your home, office, hotel, or transit hub anywhere in Chennai."
      },
      {
        stop: "Flexible City Transit & Waiting",
        time: "Duration of Package",
        desc: "Travel across multiple stops, client meetings, or shopping hubs with zero waiting penalties during package hours."
      },
      {
        stop: "Final Doorstep Drop",
        time: "Package Completion",
        desc: "Return to your origin or drop at any Chennai location. Transparent billing based strictly on package odometer and clock."
      }
    ],
    tariff: {
      headers: [
        "Vehicle Model",
        "Seats",
        "4 Hrs / 40 KM",
        "8 Hrs / 80 KM",
        "12 Hrs / 120 KM",
        "Extra KM",
        "Extra Hour"
      ],
      rows: [
        [
          "Swift Dzire / Toyota Etios",
          "4+1",
          "₹1,600",
          "₹2,600",
          "₹3,700",
          "₹15/km",
          "₹150/hr"
        ],
        [
          "Maruti Ertiga",
          "6+1",
          "₹2,000",
          "₹3,400",
          "₹4,700",
          "₹17/km",
          "₹200/hr"
        ],
        [
          "Toyota Innova",
          "7+1",
          "₹2,300",
          "₹3,800",
          "₹5,000",
          "₹19/km",
          "₹250/hr"
        ],
        [
          "Toyota Innova Crysta",
          "7+1",
          "₹3,400",
          "₹5,400",
          "₹7,200",
          "₹22/km",
          "₹350/hr"
        ],
        [
          "Tempo Traveller (12 Seater)",
          "12+1",
          "₹4,200",
          "₹6,600",
          "₹8,800",
          "₹24/km",
          "₹400/hr"
        ]
      ],
      note: "Packages include clean AC cab, fuel, and chauffeur. Parking and city toll charges at actuals. Nominal ₹500 advance to confirm; balance payable upon trip completion."
    },
    includes: [
      "Dedicated clean AC vehicle with polite professional chauffeur",
      "Doorstep pickup & drop anywhere across Chennai city limits",
      "Package hours and kilometer allowance included upfront",
      "Fuel costs included in package tariff",
      "Multiple stops and waiting within booked hours included",
      "24/7 customer support and live dispatch coordination"
    ],
    excludes: [
      "Parking charges and mall fees (payable at actuals per receipt)",
      "City toll booth charges if applicable (at actuals)",
      "Extra kilometers beyond package allowance",
      "Extra hours beyond package duration",
      "Driver night allowance if rental extends past 10:00 PM (₹300)"
    ],
    travelGuide: {
      significance: "Chennai is a bustling metropolis. Navigating between IT corridors, central business districts, and traditional retail hubs can be tiring. Having a dedicated car with an experienced chauffeur eliminates parking hassles and surge pricing uncertainty.",
      timings: "Available 24 hours a day, 7 days a week. Advance booking recommended for early morning or peak business hours.",
      dressCode: "Casual or formal as per your schedule. Vehicles are fully air-conditioned.",
      tips: [
        "Choose the 8 Hr / 80 KM package for full-day office visits or family shopping.",
        "Choose the 4 Hr / 40 KM package for quick airport meets or single hospital visits.",
        "Innova Crysta is highly recommended for VIP clients, executive delegates, and senior citizens.",
        "Keep parking slips handy for transparency during trip settlement."
      ]
    },
    faq: [
      {
        question: "How much is an Innova Crysta rental for 4 hours in Chennai?",
        answer: "Kalidass Travels charges ₹3,400 flat for an Innova Crysta for 4 Hours / 40 KM. Extra distance is billed at ₹22/km and extra time at ₹350/hour."
      },
      {
        question: "What is included in the Chennai local hourly cab package?",
        answer: "The package includes a private AC vehicle, fuel, and professional driver for the booked duration and kilometers. Parking and toll receipts are payable at actuals."
      },
      {
        question: "What happens if my trip exceeds 4 hours or 40 kilometers?",
        answer: "Additional usage is calculated transparently. For a sedan, extra km is ₹15/km and extra time is ₹150/hr. For Ertiga, extra km is ₹17/km and extra time is ₹200/hr. For Crysta, extra km is ₹22/km and extra time is ₹350/hr."
      },
      {
        question: "Is advance payment required to book a local hourly rental?",
        answer: "A nominal ₹500 advance is collected to confirm and lock the vehicle assignment. Crucially, this ₹500 is 100% deducted from your final bill."
      },
      {
        question: "Can I use the local package cab for multiple stops across Chennai?",
        answer: "Yes. You have complete freedom to travel to multiple locations, stop for shopping or meals, and keep the driver waiting within your booked hours."
      },
      {
        question: "Are your drivers familiar with Chennai routes and traffic?",
        answer: "Yes, all Kalidass Travels chauffeurs have 7+ years of driving experience across Chennai, OMR, ECR, and central business corridors."
      }
    ],
    whatsappMsg: "Hi Kalidass Travels, I want to book a Local Hourly Cab in Chennai (%PACKAGE%, %VEHICLE%). Please confirm availability.",
    metaTitle: "Local Hourly Car Rental in Chennai – 4h, 8h & 12h Packages | Kalidass Travels",
    metaDescription: "Hire local cabs in Chennai by the hour. 4 Hrs (₹1,600), 8 Hrs (₹2,600) & 12 Hrs packages across Dzire, Ertiga, Crysta & Tempo. Zero surge, transparent per-km billing.",
    keywords: "local car rental chennai, hourly cab booking chennai, 4 hours cab rental chennai, 8 hours car rental chennai, innova crysta hourly rental chennai, city taxi packages chennai",
    serviceType: "Hourly Car Rental",
    origin: "Chennai",
    destination: "Chennai Local"
  },
  {
    slug: "chennai-to-ooty-taxi",
    category: "Outstation Cabs",
    title: "Chennai to Ooty Taxi & Cab Booking (3-Day Holiday Package)",
    duration: "3 Days / 2 Nights (1,110 KM Round Trip)",
    overview: "Private highway cab service from Chennai to Ooty (Udhagamandalam) and Coonoor. Travel in comfort through scenic ghat roads with experienced hill-station drivers. Enjoy botanical gardens, Doddabetta Peak, Ooty Lake, and tea estates. Zero surge pricing with transparent per-km rates.",
    routePlan: [
      {
        stop: "Chennai Departure",
        time: "5:00 AM (Day 1)",
        desc: "Early morning doorstep pickup in Chennai. Drive via NH 48 & NH 544 via Salem, Erode, and Mettupalayam."
      },
      {
        stop: "Mettupalayam & Nilgiri Ghats",
        time: "2:00 PM (Day 1)",
        desc: "Ascend the Nilgiri hills via Burliyar and Coonoor with stops for fresh hill tea and viewpoints."
      },
      {
        stop: "Ooty Sightseeing & Tea Estates",
        time: "Full Day (Day 2)",
        desc: "Explore Ooty Lake, Government Botanical Garden, Rose Garden, Doddabetta Peak, and Pykara Falls."
      },
      {
        stop: "Coonoor & Return to Chennai",
        time: "Day 3",
        desc: "Visit Sim's Park and Dolphin's Nose in Coonoor before descending to plains and returning to Chennai by night."
      }
    ],
    tariff: {
      headers: [
        "Vehicle Model",
        "Seating",
        "Rate/km",
        "Driver Bata (3 Days)",
        "Estimated Total Cost"
      ],
      rows: [
        [
          "Swift Dzire / Toyota Etios",
          "4 Passengers",
          "₹14/km",
          "₹1,500 (₹500/day)",
          "₹17,040"
        ],
        [
          "Maruti Ertiga",
          "6 Passengers",
          "₹17/km",
          "₹1,500 (₹500/day)",
          "₹20,370"
        ],
        [
          "Toyota Innova",
          "7 Passengers",
          "₹20/km",
          "₹1,800 (₹600/day)",
          "₹24,000"
        ],
        [
          "Toyota Innova Crysta",
          "7 Passengers",
          "₹22/km",
          "₹2,100 (₹700/day)",
          "₹26,520"
        ],
        [
          "Tempo Traveller (12 Seater)",
          "12 Passengers",
          "₹24/km",
          "₹2,400 (₹800/day)",
          "₹29,040"
        ]
      ],
      note: "Total cost estimated for ~1,110 km round trip. Includes AC vehicle, fuel, and driver allowance. Tolls, state permit, and parking payable at actuals."
    },
    includes: [
      "Doorstep pickup & drop anywhere in Chennai",
      "Dedicated AC vehicle for all 3 days",
      "Skilled hill-driving chauffeur with ghat road expertise",
      "100% fuel charges included",
      "Driver bata (daily food & lodging allowance) included",
      "Local sightseeing in Ooty and Coonoor included"
    ],
    excludes: [
      "Highway FASTag tolls and hill checkpost permit fees (at actuals)",
      "Sightseeing entry tickets and boat ride fees",
      "Hotel accommodation and passenger food",
      "Parking fees at tourist viewpoints"
    ],
    travelGuide: {
      significance: "Ooty is the Queen of Hill Stations in the Nilgiris, perched at 2,240 meters. It offers cool mountain climate, heritage architecture, and lush tea plantations.",
      timings: "Best visited from September to May. Early morning start from Chennai is strongly recommended to avoid city traffic.",
      dressCode: "Warm woolens and jackets are essential year-round, especially in evenings and mornings.",
      tips: [
        "Ensure your cab driver is well-experienced with the 36 hairpin bends on Kallatti Ghat or Kotagiri route.",
        "Book boat tickets online at Pykara and Ooty Lake during summer season.",
        "Stop at Mettupalayam for authentic South Indian breakfast."
      ]
    },
    faq: [
      {
        question: "What is the taxi fare from Chennai to Ooty for 3 days?",
        answer: "A 3-day round trip (approx 1,110 km) starts at ₹17,040 for a Sedan (Dzire/Etios) and ₹20,370 for an Ertiga SUV, inclusive of vehicle, fuel, and driver bata."
      },
      {
        question: "How long does it take to reach Ooty from Chennai by road?",
        answer: "The distance is about 555 km one way and takes roughly 10 to 11 hours via NH 48 and NH 544."
      },
      {
        question: "Can your drivers safely handle Nilgiri ghat road hairpin bends?",
        answer: "Yes, all our outstation drivers assigned to hill routes possess over 8 years of ghat road experience and maintain vehicle hill-assist standards."
      }
    ],
    whatsappMsg: "Hi Kalidass Travels, I need a 3-Day Chennai to Ooty cab package (%VEHICLE%). Please send quotation.",
    metaTitle: "Chennai to Ooty Taxi & Cab Booking (3 Days) | Kalidass Travels",
    metaDescription: "Book Chennai to Ooty round-trip taxi with hill-expert chauffeurs. Sedan from ₹14/km, Ertiga from ₹17/km, Crysta from ₹22/km. Clean AC cabs, zero hidden fees.",
    keywords: "chennai to ooty taxi, chennai to ooty cab package, ooty 3 days car rental from chennai, ooty tour cab chennai, ooty outstation taxi",
    serviceType: "Outstation Cabs",
    origin: "Chennai",
    destination: "Ooty"
  },
  {
    slug: "chennai-to-kodaikanal-taxi",
    category: "Outstation Cabs",
    title: "Chennai to Kodaikanal Taxi & Cab Booking (3-Day Holiday Package)",
    duration: "3 Days / 2 Nights (1,060 KM Round Trip)",
    overview: "Scenic outstation taxi package from Chennai to Kodaikanal (Princess of Hill Stations). Travel comfortably through the Western Ghats with visits to Kodai Lake, Coaker's Walk, Pillar Rocks, and Silver Cascade Falls. Verified hill chauffeurs and spotless AC cabs.",
    routePlan: [
      {
        stop: "Chennai Departure",
        time: "5:00 AM (Day 1)",
        desc: "Doorstep pickup in Chennai. Drive south on NH 45 (GST Road) via Villupuram, Trichy, and Dindigul."
      },
      {
        stop: "Ghat Ascent & Silver Cascade",
        time: "2:30 PM (Day 1)",
        desc: "Ascend the scenic Kodai hills from Batlagundu. Quick stop at Silver Cascade Waterfalls before hotel check-in."
      },
      {
        stop: "Kodaikanal Sightseeing",
        time: "Full Day (Day 2)",
        desc: "Visit Kodai Lake, Bryant Park, Coaker's Walk, Pillar Rocks, Guna Caves, and Pine Forest."
      },
      {
        stop: "Return to Chennai",
        time: "Day 3",
        desc: "Morning boating at Kodai Lake, homemade chocolate shopping, and comfortable return journey to Chennai."
      }
    ],
    tariff: {
      headers: [
        "Vehicle Model",
        "Seating",
        "Rate/km",
        "Driver Bata (3 Days)",
        "Estimated Total Cost"
      ],
      rows: [
        [
          "Swift Dzire / Toyota Etios",
          "4 Passengers",
          "₹14/km",
          "₹1,500 (₹500/day)",
          "₹16,340"
        ],
        [
          "Maruti Ertiga",
          "6 Passengers",
          "₹17/km",
          "₹1,500 (₹500/day)",
          "₹19,520"
        ],
        [
          "Toyota Innova",
          "7 Passengers",
          "₹20/km",
          "₹1,800 (₹600/day)",
          "₹23,000"
        ],
        [
          "Toyota Innova Crysta",
          "7 Passengers",
          "₹22/km",
          "₹2,100 (₹700/day)",
          "₹25,420"
        ],
        [
          "Tempo Traveller (12 Seater)",
          "12 Passengers",
          "₹24/km",
          "₹2,400 (₹800/day)",
          "₹27,840"
        ]
      ],
      note: "Total cost estimated for ~1,060 km round trip. Includes AC vehicle, fuel, and driver allowance. Tolls and parking at actuals."
    },
    includes: [
      "Doorstep pickup & drop anywhere in Chennai",
      "Dedicated AC vehicle for 3 complete days",
      "Experienced hill-driving chauffeur",
      "100% fuel charges included",
      "Driver daily allowance (bata) included",
      "Local sightseeing in Kodaikanal"
    ],
    excludes: [
      "Highway FASTag tolls and Kodai municipality entry fees",
      "Boating, cycling, and park entry tickets",
      "Passenger hotel stay and food"
    ],
    travelGuide: {
      significance: "Kodaikanal is located at an altitude of 2,133 meters in the Palani Hills. Famous for its star-shaped lake, mist-covered valleys, and pine forests.",
      timings: "Pleasant throughout the year. April to June is peak summer season; September to February is cold and misty.",
      dressCode: "Warm clothing, sweaters, and comfortable walking shoes.",
      tips: [
        "Start early to beat the Trichy highway congestion.",
        "Try cycling around the 5 km Kodai Lake perimeter.",
        "Buy authentic Eucalyptus oil and homemade spices in town."
      ]
    },
    faq: [
      {
        question: "What is the cab fare from Chennai to Kodaikanal for 3 days?",
        answer: "A 3-day round trip (approx 1,060 km) starts at ₹16,340 for a Sedan, ₹19,520 for an Ertiga SUV, and ₹25,420 for an Innova Crysta, including fuel and driver bata."
      },
      {
        question: "What is the driving distance from Chennai to Kodaikanal?",
        answer: "The one-way driving distance is approximately 530 km, taking about 9.5 to 10.5 hours via NH 45 through Villupuram, Trichy, and Dindigul."
      }
    ],
    whatsappMsg: "Hi Kalidass Travels, I want to book a 3-Day Chennai to Kodaikanal cab (%VEHICLE%). Please send details.",
    metaTitle: "Chennai to Kodaikanal Taxi & Cab Booking (3 Days) | Kalidass Travels",
    metaDescription: "Chennai to Kodaikanal outstation taxi package. Reliable AC cabs, expert hill drivers, 24/7 support. Sedan ₹14/km, Ertiga ₹17/km, Crysta ₹22/km.",
    keywords: "chennai to kodaikanal taxi, chennai to kodaikanal cab package, kodaikanal outstation taxi chennai, kodai tour cab",
    serviceType: "Outstation Cabs",
    origin: "Chennai",
    destination: "Kodaikanal"
  },
  {
    slug: "chennai-to-mysore-taxi",
    category: "Outstation Cabs",
    title: "Chennai to Mysore Taxi & Cab Booking (3-Day Holiday Tour)",
    duration: "3 Days / 2 Nights (960 KM Round Trip)",
    overview: "Comfortable private cab travel from Chennai to Mysore (Mysuru). Visit the grand Mysore Palace, Chamundi Hills, Brindavan Gardens musical fountains, and Srirangapatna heritage sites. Zero surge pricing, spotless AC vehicles, and knowledgeable highway chauffeurs.",
    routePlan: [
      {
        stop: "Chennai Departure",
        time: "6:00 AM (Day 1)",
        desc: "Pickup from your Chennai residence. Travel via NH 48 through Vellore and Bangalore NICE Road to Mysore expressway."
      },
      {
        stop: "Srirangapatna & Mysore Check-in",
        time: "3:00 PM (Day 1)",
        desc: "Visit Tipu Sultan's Summer Palace and Ranganathaswamy Temple before evening arrival in Mysore."
      },
      {
        stop: "Mysore Palace & Chamundi Hills",
        time: "Full Day (Day 2)",
        desc: "Morning darshan at Chamundeshwari Temple atop Chamundi Hills. Afternoon tour of Mysore Palace. Evening illumination at Brindavan Gardens."
      },
      {
        stop: "Mysore Zoo & Return Journey",
        time: "Day 3",
        desc: "Visit Sri Chamarajendra Zoological Gardens and local silk emporiums before smooth return to Chennai."
      }
    ],
    tariff: {
      headers: [
        "Vehicle Model",
        "Seating",
        "Rate/km",
        "Driver Bata (3 Days)",
        "Estimated Total Cost"
      ],
      rows: [
        [
          "Swift Dzire / Toyota Etios",
          "4 Passengers",
          "₹14/km",
          "₹1,500 (₹500/day)",
          "₹14,940"
        ],
        [
          "Maruti Ertiga",
          "6 Passengers",
          "₹17/km",
          "₹1,500 (₹500/day)",
          "₹17,820"
        ],
        [
          "Toyota Innova",
          "7 Passengers",
          "₹20/km",
          "₹1,800 (₹600/day)",
          "₹21,000"
        ],
        [
          "Toyota Innova Crysta",
          "7 Passengers",
          "₹22/km",
          "₹2,100 (₹700/day)",
          "₹23,220"
        ],
        [
          "Tempo Traveller (12 Seater)",
          "12 Passengers",
          "₹24/km",
          "₹2,400 (₹800/day)",
          "₹25,440"
        ]
      ],
      note: "Total cost based on ~960 km round trip. Includes AC vehicle, fuel, and driver bata. Karnataka state entry permit and highway FASTag tolls at actuals."
    },
    includes: [
      "Doorstep pickup & drop anywhere in Chennai",
      "Dedicated AC vehicle for all 3 days",
      "Experienced interstate highway chauffeur",
      "100% fuel charges included",
      "Driver daily allowance (bata) included",
      "Sightseeing across Mysore, Srirangapatna, and Brindavan Gardens"
    ],
    excludes: [
      "Highway FASTag tolls and Karnataka statutory state entry permit",
      "Palace entry tickets, zoo tickets, and garden illumination fees",
      "Passenger hotel stay and food"
    ],
    travelGuide: {
      significance: "Mysore is the cultural capital of Karnataka, celebrated for its royal heritage, intricate sandalwood carvings, world-famous Mysore silk, and grand Dasara festivities.",
      timings: "Mysore Palace illumination occurs on Sundays and public holidays from 7:00 PM to 7:45 PM. Brindavan Gardens musical fountain runs every evening.",
      dressCode: "Modest attire recommended for Chamundi Hills temple. Normal casual wear for sightseeing.",
      tips: [
        "Use Bangalore NICE Road to bypass city congestion effortlessly.",
        "Buy authentic Mysore Pak from Guru Sweets (heritage creators).",
        "Visit Chamundi Hills early in the morning for crisp views over the city."
      ]
    },
    faq: [
      {
        question: "How much is the taxi fare from Chennai to Mysore?",
        answer: "A 3-day round trip (approx 960 km) starts at ₹14,940 for a Sedan (Dzire/Etios), ₹17,820 for an Ertiga SUV, and ₹23,220 for an Innova Crysta, inclusive of vehicle, fuel, and driver bata."
      },
      {
        question: "How long does the road journey take between Chennai and Mysore?",
        answer: "The 480 km one-way drive takes approximately 8.5 to 9 hours via NH 48, Bangalore NICE Road, and the Bengaluru-Mysuru Expressway."
      }
    ],
    whatsappMsg: "Hi Kalidass Travels, I need a 3-Day Chennai to Mysore cab package (%VEHICLE%). Please send quotation.",
    metaTitle: "Chennai to Mysore Taxi & Cab Booking (3 Days) | Kalidass Travels",
    metaDescription: "Chennai to Mysore 3-day holiday tour cab. Visit Mysore Palace, Chamundi Hills, Brindavan Gardens. Clean AC cabs, transparent pricing. Sedan ₹14/km, Ertiga ₹17/km.",
    keywords: "chennai to mysore taxi, chennai to mysore cab package, mysore tour cab chennai, chennai to mysore outstation car rental",
    serviceType: "Outstation Cabs",
    origin: "Chennai",
    destination: "Mysore"
  },
  {
    slug: "chennai-to-trichy-taxi",
    category: "Outstation Cabs",
    title: "Chennai to Trichy Taxi & Cab Booking (One-Way & Round Trip)",
    duration: "1 to 2 Days (664 KM Round Trip / 332 KM One-Way)",
    overview: "Reliable highway cab booking between Chennai and Trichy (Tiruchirappalli). Fast doorstep travel via NH 45 (GST Road) for Srirangam Ranganathaswamy Temple darshan, Rockfort Ucchi Pillayar Temple, and business trips. Transparent per-km billing, zero surge, and polite chauffeurs.",
    routePlan: [
      {
        stop: "Chennai Departure",
        time: "6:00 AM",
        desc: "Doorstep pickup in Chennai. Drive south on smooth 6-lane NH 45 through Chengalpattu, Tindivanam, and Villupuram."
      },
      {
        stop: "Midway Breakfast Stop",
        time: "8:30 AM",
        desc: "Relaxing breakfast stop at clean highway highway restaurants near Ulundurpet."
      },
      {
        stop: "Srirangam Temple Darshan",
        time: "12:30 PM",
        desc: "Arrive at Srirangam. Chauffeur assists with drop near the temple Rajagopuram for peaceful darshan."
      },
      {
        stop: "Rockfort Temple & Return",
        time: "4:00 PM",
        desc: "Visit the historic Rockfort Ucchi Pillayar Temple before evening return or overnight hotel drop."
      }
    ],
    tariff: {
      headers: [
        "Vehicle Model",
        "Seating",
        "Rate/km",
        "Driver Bata",
        "Round-Trip Cost (2 Days)"
      ],
      rows: [
        [
          "Swift Dzire / Toyota Etios",
          "4 Passengers",
          "₹14/km",
          "₹500/day",
          "₹10,296"
        ],
        [
          "Maruti Ertiga",
          "6 Passengers",
          "₹17/km",
          "₹500/day",
          "₹12,288"
        ],
        [
          "Toyota Innova",
          "7 Passengers",
          "₹20/km",
          "₹600/day",
          "₹14,480"
        ],
        [
          "Toyota Innova Crysta",
          "7 Passengers",
          "₹22/km",
          "₹700/day",
          "₹16,008"
        ],
        [
          "Tempo Traveller (12 Seater)",
          "12 Passengers",
          "₹24/km",
          "₹800/day",
          "₹17,536"
        ]
      ],
      note: "Round-trip cost based on ~664 km (2 days). One-way drop also available with transparent dead-mileage billing. FASTag tolls and parking at actuals."
    },
    includes: [
      "Doorstep pickup & drop anywhere in Chennai",
      "Dedicated clean AC vehicle with highway chauffeur",
      "100% fuel charges included",
      "Driver bata included",
      "Temple drops at Srirangam, Rockfort, and Samayapuram included"
    ],
    excludes: [
      "Highway FASTag tolls and parking fees (payable at actuals per receipt)",
      "Temple special darshan tickets",
      "Passenger hotel accommodation and food"
    ],
    travelGuide: {
      significance: "Trichy is home to Sri Ranganathaswamy Temple in Srirangam (the largest functioning Hindu temple in the world) and the iconic 7th-century Rockfort Temple.",
      timings: "Srirangam darshan timings: 6:00 AM – 1:00 PM and 3:30 PM – 9:00 PM. Rockfort is best visited in late afternoon.",
      dressCode: "Traditional South Indian temple attire (Dhoti/Kurta for men, Saree/Salwar for women).",
      tips: [
        "NH 45 is a high-speed expressway, allowing smooth travel in under 6 hours.",
        "Consider an early morning start by 5:30 AM to complete Srirangam darshan before midday sanctum closure."
      ]
    },
    faq: [
      {
        question: "What is the cab fare from Chennai to Trichy?",
        answer: "A 2-day round trip (approx 664 km) starts at ₹10,296 for a Sedan, ₹12,288 for an Ertiga, and ₹16,008 for an Innova Crysta. One-way drops are also available."
      },
      {
        question: "How long does it take from Chennai to Trichy by cab?",
        answer: "The 332 km drive takes roughly 5.5 to 6.5 hours via NH 45 (GST Road) depending on traffic."
      }
    ],
    whatsappMsg: "Hi Kalidass Travels, I need a Chennai to Trichy cab (%VEHICLE%). Please send fare details.",
    metaTitle: "Chennai to Trichy Taxi & Cab Booking | Kalidass Travels",
    metaDescription: "Book Chennai to Trichy cabs with verified highway chauffeurs. Srirangam temple tours, one-way drops & round trips. Sedan ₹14/km, Ertiga ₹17/km. 24/7 service.",
    keywords: "chennai to trichy taxi, chennai to srirangam cab, chennai to trichy one way cab, trichy outstation taxi chennai",
    serviceType: "Outstation Cabs",
    origin: "Chennai",
    destination: "Trichy"
  }
];

// Append new services if not already present
let addedCount = 0;
for (const newSvc of newServices) {
  const existingIdx = services.findIndex(s => s.slug === newSvc.slug);
  if (existingIdx === -1) {
    services.push(newSvc);
    addedCount++;
    console.log(`Added service: ${newSvc.slug}`);
  } else {
    // Update existing
    services[existingIdx] = newSvc;
    console.log(`Updated service: ${newSvc.slug}`);
  }
}

fs.writeFileSync(filePath, JSON.stringify(services, null, 2), 'utf-8');
console.log(`Successfully updated ${filePath}. Total services now: ${services.length} (Added: ${addedCount})`);

