import { c as createComponent, a as renderTemplate, e as defineScriptVars, r as renderComponent, m as maybeRenderHead } from './astro/server_B-UY_wom.mjs';
import 'kleur/colors';
import { Info, ArrowRight, Check, Calendar, Navigation, MapPin, User } from 'lucide-react';
import { t as tnBusFares } from './tnBusFares_B5zzAJts.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(raw || cooked.slice()) }));
var _a;
const $$DriverFeeEstimator = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate(_a || (_a = __template(["", '<div class="w-full bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden max-w-md mx-auto font-sans"> <!-- Header --> <div class="p-6 pb-2"> <div class="flex flex-col items-center text-center gap-2 mb-1"> ', ' <div> <h2 class="text-xl font-bold text-slate-900"> <span class="lang-en">Acting Driver Cost</span> <span class="lang-ta">\u0B93\u0B9F\u0BCD\u0B9F\u0BC1\u0BA8\u0BB0\u0BCD \u0B95\u0B9F\u0BCD\u0B9F\u0BA3\u0BAE\u0BCD</span> </h2> <p class="text-xs text-slate-500"> <span class="lang-en">Calculate Bata & Stay</span> <span class="lang-ta">\u0BAA\u0BC7\u0B9F\u0BCD\u0B9F\u0BBE & \u0BA4\u0B99\u0BCD\u0B95\u0BC1\u0BAE\u0BBF\u0B9F\u0BAE\u0BCD \u0B95\u0BA3\u0B95\u0BCD\u0B95\u0BBF\u0B9F</span> </p> </div> </div> </div> <!-- Tabs --> <div class="px-6 mb-6"> <div class="bg-slate-100 p-1 rounded-xl flex"> <button id="tab-oneway" class="flex-1 py-2 text-sm font-semibold rounded-lg text-slate-600 hover:text-slate-900 transition-all"> <span class="lang-en">One Way Drop</span> <span class="lang-ta">\u0B92\u0BB0\u0BC1 \u0BB5\u0BB4\u0BBF \u0BAA\u0BAF\u0BA3\u0BAE\u0BCD</span> </button> <button id="tab-round" class="flex-1 py-2 text-sm font-semibold rounded-lg bg-white text-indigo-600 shadow-sm transition-all"> <span class="lang-en">Round Trip</span> <span class="lang-ta">\u0B87\u0BB0\u0BC1 \u0BB5\u0BB4\u0BBF \u0BAA\u0BAF\u0BA3\u0BAE\u0BCD</span> </button> </div> </div> <div class="px-6 pb-8 space-y-5"> <!-- Inputs --> <div class="space-y-4"> <!-- Pickup --> <div> <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1.5"> <span class="lang-en">Pickup Location</span> <span class="lang-ta">\u0BAA\u0BC1\u0BB1\u0BAA\u0BCD\u0BAA\u0B9F\u0BC1\u0BAE\u0BCD \u0B87\u0B9F\u0BAE\u0BCD</span> </label> <div class="relative group"> <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"> ', ' </div> <input type="text" id="simple-pickup" placeholder="e.g. Pallavaram" autocomplete="off" class="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-900 text-sm font-medium transition-all"> </div> </div> <!-- Drop --> <div> <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1.5"> <span class="lang-en">Drop Location</span> <span class="lang-ta">\u0B9A\u0BC7\u0BB0\u0BC1\u0BAE\u0BCD \u0B87\u0B9F\u0BAE\u0BCD</span> </label> <div class="relative group"> <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"> ', ' </div> <input type="text" id="simple-drop" placeholder="e.g. Madurai" autocomplete="off" class="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-900 text-sm font-medium transition-all"> </div> </div> <!-- Round Trip Specific Fields --> <div id="round-trip-fields" class="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300"> <!-- Duration --> <div> <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1.5"> <span class="lang-en">Total Duration (Days)</span> <span class="lang-ta">\u0BAE\u0BCA\u0BA4\u0BCD\u0BA4 \u0BA8\u0BBE\u0B9F\u0BCD\u0B95\u0BB3\u0BCD</span> </label> <div class="relative group"> <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"> ', ' </div> <input type="number" id="duration-days" value="2" min="1" class="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-900 text-sm font-medium transition-all"> </div> </div> <!-- Stay Checkbox --> <label class="flex items-start gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:border-indigo-300 transition-colors bg-slate-50/50"> <div class="relative flex items-center"> <input type="checkbox" id="stay-provided" class="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-slate-300 checked:border-indigo-600 checked:bg-indigo-600 transition-all"> ', ' </div> <div> <span class="block text-sm font-semibold text-slate-700"> <span class="lang-en">I will provide Driver Stay</span> <span class="lang-ta">\u0B93\u0B9F\u0BCD\u0B9F\u0BC1\u0BA8\u0BB0\u0BCD \u0BA4\u0B99\u0BCD\u0B95\u0BC1\u0BAE\u0BBF\u0B9F\u0BAE\u0BCD \u0BA8\u0BBE\u0BA9\u0BCD \u0BA4\u0BB0\u0BC1\u0B95\u0BBF\u0BB1\u0BC7\u0BA9\u0BCD</span> </span> <span class="block text-xs text-slate-500 mt-0.5"> <span class="lang-en">Select this if you give the driver a place to sleep.</span> <span class="lang-ta">\u0B93\u0B9F\u0BCD\u0B9F\u0BC1\u0BA8\u0BB0\u0BC1\u0B95\u0BCD\u0B95\u0BC1 \u0BA4\u0BC2\u0B99\u0BCD\u0B95\u0BC1\u0BAE\u0BCD \u0B87\u0B9F\u0BAE\u0BCD \u0B95\u0BCA\u0B9F\u0BC1\u0BA4\u0BCD\u0BA4\u0BBE\u0BB2\u0BCD \u0B87\u0BA4\u0BC8 \u0BA4\u0BC7\u0BB0\u0BCD\u0BB5\u0BC1 \u0B9A\u0BC6\u0BAF\u0BCD\u0BAF\u0BB5\u0BC1\u0BAE\u0BCD.</span> </span> </div> </label> </div> </div> <!-- Calculate Button --> <button id="calc-btn" class="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center shadow-lg hover:shadow-xl active:scale-[0.98]"> <span class="lang-en flex items-center">Calculate Cost ', '</span> <span class="lang-ta flex items-center">\u0BAE\u0BA4\u0BBF\u0BAA\u0BCD\u0BAA\u0BC0\u0B9F\u0BCD\u0B9F\u0BC8 \u0B95\u0BA3\u0B95\u0BCD\u0B95\u0BBF\u0B9F\u0BC1 ', '</span> </button> <!-- Results Section --> <div id="result-section" class="hidden pt-6 border-t border-slate-100"> <div class="flex justify-between items-end mb-6"> <div> <p class="text-[10px] font-bold text-slate-400 uppercase mb-1"> <span class="lang-en">Estimated Total</span> <span class="lang-ta">\u0BAE\u0BCA\u0BA4\u0BCD\u0BA4 \u0BAE\u0BA4\u0BBF\u0BAA\u0BCD\u0BAA\u0BC0\u0B9F\u0BC1</span> </p> <p class="text-4xl font-extrabold text-slate-900 tracking-tight" id="total-price">\u20B90</p> </div> <div class="text-right"> <p class="text-sm font-bold text-slate-600" id="distance-display">0 km</p> <p class="text-xs text-slate-400" id="duration-display"> <span class="lang-en">0 hrs Driving</span> <span class="lang-ta">0 \u0BAE\u0BA3\u0BBF \u0BA8\u0BC7\u0BB0\u0BAE\u0BCD</span> </p> </div> </div> <div class="space-y-3 text-sm" id="breakdown-list"> <!-- Dynamic Content --> </div> <div class="mt-6 p-3 bg-yellow-50 border border-yellow-100 rounded-lg flex gap-3"> ', ' <p class="text-xs text-yellow-800 leading-relaxed"> <span class="lang-en">Rate is per calendar day. Providing accommodation saves you <span class="font-bold">\u20B9500/night!</span></span> <span class="lang-ta">\u0B95\u0B9F\u0BCD\u0B9F\u0BA3\u0BAE\u0BCD \u0B92\u0BB0\u0BC1 \u0BA8\u0BBE\u0BB3\u0BC1\u0B95\u0BCD\u0B95\u0BC1. \u0BA4\u0B99\u0BCD\u0B95\u0BC1\u0BAE\u0BBF\u0B9F\u0BAE\u0BCD \u0B95\u0BCA\u0B9F\u0BC1\u0BA4\u0BCD\u0BA4\u0BBE\u0BB2\u0BCD <span class="font-bold">\u20B9500 \u0BAE\u0BBF\u0B9A\u0BCD\u0B9A\u0BAE\u0BCD!</span></span> </p> </div> </div> </div> </div> <script>(function(){', `
  (function() {
    // --- STATE ---
    let activeTab = 'round'; // 'oneway' | 'round'

    // --- DOM ELEMENTS ---
    const tabOneway = document.getElementById('tab-oneway');
    const tabRound = document.getElementById('tab-round');
    const roundTripFields = document.getElementById('round-trip-fields');
    const durationInput = document.getElementById('duration-days');
    const stayCheckbox = document.getElementById('stay-provided');
    const resultSection = document.getElementById('result-section');

    // --- TAB LOGIC ---
    function switchTab(tab) {
      activeTab = tab;
      if (tab === 'oneway') {
        // Style Active
        tabOneway.className = "flex-1 py-2 text-sm font-semibold rounded-lg bg-white text-indigo-600 shadow-sm transition-all";
        tabRound.className = "flex-1 py-2 text-sm font-semibold rounded-lg text-slate-600 hover:text-slate-900 transition-all";
        // Hide Fields
        roundTripFields.classList.add('hidden');
      } else {
        // Style Active
        tabRound.className = "flex-1 py-2 text-sm font-semibold rounded-lg bg-white text-indigo-600 shadow-sm transition-all";
        tabOneway.className = "flex-1 py-2 text-sm font-semibold rounded-lg text-slate-600 hover:text-slate-900 transition-all";
        // Show Fields
        roundTripFields.classList.remove('hidden');
      }
      // Hide results on tab switch to avoid confusion
      resultSection.classList.add('hidden');
    }

    tabOneway.addEventListener('click', () => switchTab('oneway'));
    tabRound.addEventListener('click', () => switchTab('round'));

    // --- GOOGLE MAPS INIT (Robust) ---
    let attempts = 0;
    const maxAttempts = 50; 

    function initializeAutocomplete() {
      const pickupInput = document.getElementById('simple-pickup');
      const dropInput = document.getElementById('simple-drop');

      if (!pickupInput || !dropInput) return;
      if (pickupInput.dataset.googleAttached === "true") return;

      try {
        const options = {
          componentRestrictions: { country: "in" },
          fields: ["geometry", "name"],
          strictBounds: false,
        };
        new google.maps.places.Autocomplete(pickupInput, options);
        new google.maps.places.Autocomplete(dropInput, options);
        pickupInput.dataset.googleAttached = "true";
        dropInput.dataset.googleAttached = "true";
        console.log("DriverFeeEstimator: Autocomplete initialized");
      } catch (e) {
        console.error("DriverFeeEstimator: Init failed", e);
      }
    }

    const intervalId = setInterval(() => {
      attempts++;
      if (window.google && window.google.maps && window.google.maps.places) {
        clearInterval(intervalId);
        initializeAutocomplete();
      } else if (attempts >= maxAttempts) {
        clearInterval(intervalId);
      }
    }, 100);

    // --- CALCULATION LOGIC ---
    const calcBtn = document.getElementById('calc-btn');
    
    if (calcBtn) {
      calcBtn.addEventListener('click', () => {
        const pickup = document.getElementById('simple-pickup').value;
        const drop = document.getElementById('simple-drop').value;
        
        if(!pickup || !drop) {
          alert("Please enter both locations");
          return;
        }

        // Change button state
        const originalBtnText = calcBtn.innerHTML;
        calcBtn.innerHTML = 'Calculating...';
        calcBtn.disabled = true;

        // 1. TRY LOCAL LOOKUP FIRST (No API)
        const p = pickup.toLowerCase();
        const d = drop.toLowerCase();
        
        // Find route in either direction
        const route = tnBusFares.find(r => 
          (p.includes(r.source) && d.includes(r.destination)) ||
          (p.includes(r.destination) && d.includes(r.source))
        );

        if (route) {
          console.log("Using Local Route Data:", route);
          
          // Simulate small delay for UX
          setTimeout(() => {
            calcBtn.innerHTML = originalBtnText;
            calcBtn.disabled = false;
            
            const realDist = route.distanceKm;
            const durationText = Math.round(realDist / 50) + " hrs (Est)"; // Approx 50km/h
            
            // Use stored SETC fare
            const setcFare = route.setcFare; 
            
            calculateAndShow(realDist, durationText, setcFare);
          }, 600);
          return;
        }

        // 2. FALLBACK TO API (If route not found)
        const service = new google.maps.DistanceMatrixService();
        service.getDistanceMatrix(
          {
            origins: [pickup],
            destinations: [drop],
            travelMode: google.maps.TravelMode.DRIVING,
            unitSystem: google.maps.UnitSystem.METRIC,
          },
          (response, status) => {
            // Reset button
            calcBtn.innerHTML = originalBtnText;
            calcBtn.disabled = false;

            if (status !== "OK") {
              alert("Error with distance service: " + status);
              return;
            }

            const result = response.rows[0].elements[0];
            if (result.status !== "OK") {
              alert("Could not calculate distance. Please check locations.");
              return;
            }

            // Real Data
            const distanceInMeters = result.distance.value;
            const realDist = Math.round(distanceInMeters / 1000); 
            const durationText = result.duration.text;
            
            // Fallback Fare Calculation (if not in JSON)
            // Approx 1.2 per km for SETC Ultra Deluxe
            const calculatedFare = Math.round(realDist * 1.2);

            calculateAndShow(realDist, durationText, calculatedFare);
          }
        );
      });

      function calculateAndShow(dist, duration, busFare) {
        // Rates
        const BATA_PER_DAY = 1200;
        const FOOD_PER_DAY = 300;
        const STAY_PER_NIGHT = 500;

        let total = 0;
        let breakdownHTML = '';

        if (activeTab === 'oneway') {
          // One Way Logic
          total = BATA_PER_DAY + FOOD_PER_DAY + busFare;

          breakdownHTML = \`
            <div class="flex justify-between py-2 border-b border-slate-50">
              <span class="text-slate-600">
                <span class="lang-en">Driver Bata (1 Day)</span>
                <span class="lang-ta">\u0B93\u0B9F\u0BCD\u0B9F\u0BC1\u0BA8\u0BB0\u0BCD \u0BAA\u0BC7\u0B9F\u0BCD\u0B9F\u0BBE (1 \u0BA8\u0BBE\u0BB3\u0BCD)</span>
              </span>
              <span class="font-bold text-slate-900">\u20B9\${BATA_PER_DAY}</span>
            </div>
            <div class="flex justify-between py-2 border-b border-slate-50">
              <span class="text-slate-600">
                <span class="lang-en">Food Allowance</span>
                <span class="lang-ta">\u0B89\u0BA3\u0BB5\u0BC1 \u0BAA\u0B9F\u0BBF</span>
              </span>
              <span class="font-bold text-slate-900">\u20B9\${FOOD_PER_DAY}</span>
            </div>
            <div class="flex justify-between py-2">
              <span class="text-slate-600">
                <span class="lang-en">Return Bus Ticket (SETC/Est)</span>
                <span class="lang-ta">\u0BA4\u0BBF\u0BB0\u0BC1\u0BAE\u0BCD\u0BAA\u0BC1\u0BAE\u0BCD \u0BAA\u0BC7\u0BB0\u0BC1\u0BA8\u0BCD\u0BA4\u0BC1 \u0B9F\u0BBF\u0B95\u0BCD\u0B95\u0BC6\u0B9F\u0BCD (\u0BAE\u0BA4\u0BBF\u0BAA\u0BCD\u0BAA\u0BC0\u0B9F\u0BC1)</span>
              </span>
              <span class="font-bold text-slate-900">\u20B9\${busFare}</span>
            </div>
          \`;

        } else {
          // Round Trip Logic
          let days = parseInt(durationInput.value) || 1;
          
          // Auto-correct days if distance > 250km
          const totalRoundTripDist = dist * 2;
          if (totalRoundTripDist > 250 && days < 2) {
            days = 2;
            durationInput.value = "2";
            alert("For round trips over 250km, minimum 2 days are required for driver safety.");
          }

          const nights = Math.max(0, days - 1); // Nights are usually Days - 1
          const provideStay = stayCheckbox.checked;

          const totalBata = BATA_PER_DAY * days;
          const totalFood = FOOD_PER_DAY * days;
          const totalStay = provideStay ? 0 : (STAY_PER_NIGHT * nights);
          
          total = totalBata + totalFood + totalStay;

          breakdownHTML = \`
            <div class="flex justify-between py-2 border-b border-slate-50">
              <span class="text-slate-600">
                <span class="lang-en">Driver Bata (\${days} Days)</span>
                <span class="lang-ta">\u0B93\u0B9F\u0BCD\u0B9F\u0BC1\u0BA8\u0BB0\u0BCD \u0BAA\u0BC7\u0B9F\u0BCD\u0B9F\u0BBE (\${days} \u0BA8\u0BBE\u0B9F\u0BCD\u0B95\u0BB3\u0BCD)</span>
              </span>
              <span class="font-bold text-slate-900">\u20B9\${totalBata}</span>
            </div>
            <div class="flex justify-between py-2 border-b border-slate-50">
              <span class="text-slate-600">
                <span class="lang-en">Food Allowance (\${days} Days)</span>
                <span class="lang-ta">\u0B89\u0BA3\u0BB5\u0BC1 \u0BAA\u0B9F\u0BBF (\${days} \u0BA8\u0BBE\u0B9F\u0BCD\u0B95\u0BB3\u0BCD)</span>
              </span>
              <span class="font-bold text-slate-900">\u20B9\${totalFood}</span>
            </div>
            \${nights > 0 ? \`
            <div class="flex justify-between py-2 \${provideStay ? 'text-slate-400 line-through' : ''}">
              <span class="text-slate-600">
                <span class="lang-en">Stay Allowance (\${nights} Nights)</span>
                <span class="lang-ta">\u0BA4\u0B99\u0BCD\u0B95\u0BC1\u0BAE\u0BCD \u0BAA\u0B9F\u0BBF (\${nights} \u0B87\u0BB0\u0BB5\u0BC1\u0B95\u0BB3\u0BCD)</span>
              </span>
              <span class="font-bold text-slate-900">\u20B9\${provideStay ? 0 : totalStay}</span>
            </div>
            \` : ''}
          \`;
        }

        // Update UI
        const displayDist = activeTab === 'round' ? dist * 2 : dist;
        document.getElementById('total-price').innerText = \`\u20B9\${total}\`;
        document.getElementById('distance-display').innerText = \`\${displayDist} km\`;
        document.getElementById('duration-display').innerText = duration;
        document.getElementById('breakdown-list').innerHTML = breakdownHTML;
        
        resultSection.classList.remove('hidden');
      }
    }
  })();
})();<\/script>`], ["", '<div class="w-full bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden max-w-md mx-auto font-sans"> <!-- Header --> <div class="p-6 pb-2"> <div class="flex flex-col items-center text-center gap-2 mb-1"> ', ' <div> <h2 class="text-xl font-bold text-slate-900"> <span class="lang-en">Acting Driver Cost</span> <span class="lang-ta">\u0B93\u0B9F\u0BCD\u0B9F\u0BC1\u0BA8\u0BB0\u0BCD \u0B95\u0B9F\u0BCD\u0B9F\u0BA3\u0BAE\u0BCD</span> </h2> <p class="text-xs text-slate-500"> <span class="lang-en">Calculate Bata & Stay</span> <span class="lang-ta">\u0BAA\u0BC7\u0B9F\u0BCD\u0B9F\u0BBE & \u0BA4\u0B99\u0BCD\u0B95\u0BC1\u0BAE\u0BBF\u0B9F\u0BAE\u0BCD \u0B95\u0BA3\u0B95\u0BCD\u0B95\u0BBF\u0B9F</span> </p> </div> </div> </div> <!-- Tabs --> <div class="px-6 mb-6"> <div class="bg-slate-100 p-1 rounded-xl flex"> <button id="tab-oneway" class="flex-1 py-2 text-sm font-semibold rounded-lg text-slate-600 hover:text-slate-900 transition-all"> <span class="lang-en">One Way Drop</span> <span class="lang-ta">\u0B92\u0BB0\u0BC1 \u0BB5\u0BB4\u0BBF \u0BAA\u0BAF\u0BA3\u0BAE\u0BCD</span> </button> <button id="tab-round" class="flex-1 py-2 text-sm font-semibold rounded-lg bg-white text-indigo-600 shadow-sm transition-all"> <span class="lang-en">Round Trip</span> <span class="lang-ta">\u0B87\u0BB0\u0BC1 \u0BB5\u0BB4\u0BBF \u0BAA\u0BAF\u0BA3\u0BAE\u0BCD</span> </button> </div> </div> <div class="px-6 pb-8 space-y-5"> <!-- Inputs --> <div class="space-y-4"> <!-- Pickup --> <div> <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1.5"> <span class="lang-en">Pickup Location</span> <span class="lang-ta">\u0BAA\u0BC1\u0BB1\u0BAA\u0BCD\u0BAA\u0B9F\u0BC1\u0BAE\u0BCD \u0B87\u0B9F\u0BAE\u0BCD</span> </label> <div class="relative group"> <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"> ', ' </div> <input type="text" id="simple-pickup" placeholder="e.g. Pallavaram" autocomplete="off" class="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-900 text-sm font-medium transition-all"> </div> </div> <!-- Drop --> <div> <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1.5"> <span class="lang-en">Drop Location</span> <span class="lang-ta">\u0B9A\u0BC7\u0BB0\u0BC1\u0BAE\u0BCD \u0B87\u0B9F\u0BAE\u0BCD</span> </label> <div class="relative group"> <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"> ', ' </div> <input type="text" id="simple-drop" placeholder="e.g. Madurai" autocomplete="off" class="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-900 text-sm font-medium transition-all"> </div> </div> <!-- Round Trip Specific Fields --> <div id="round-trip-fields" class="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300"> <!-- Duration --> <div> <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1.5"> <span class="lang-en">Total Duration (Days)</span> <span class="lang-ta">\u0BAE\u0BCA\u0BA4\u0BCD\u0BA4 \u0BA8\u0BBE\u0B9F\u0BCD\u0B95\u0BB3\u0BCD</span> </label> <div class="relative group"> <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"> ', ' </div> <input type="number" id="duration-days" value="2" min="1" class="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-900 text-sm font-medium transition-all"> </div> </div> <!-- Stay Checkbox --> <label class="flex items-start gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:border-indigo-300 transition-colors bg-slate-50/50"> <div class="relative flex items-center"> <input type="checkbox" id="stay-provided" class="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-slate-300 checked:border-indigo-600 checked:bg-indigo-600 transition-all"> ', ' </div> <div> <span class="block text-sm font-semibold text-slate-700"> <span class="lang-en">I will provide Driver Stay</span> <span class="lang-ta">\u0B93\u0B9F\u0BCD\u0B9F\u0BC1\u0BA8\u0BB0\u0BCD \u0BA4\u0B99\u0BCD\u0B95\u0BC1\u0BAE\u0BBF\u0B9F\u0BAE\u0BCD \u0BA8\u0BBE\u0BA9\u0BCD \u0BA4\u0BB0\u0BC1\u0B95\u0BBF\u0BB1\u0BC7\u0BA9\u0BCD</span> </span> <span class="block text-xs text-slate-500 mt-0.5"> <span class="lang-en">Select this if you give the driver a place to sleep.</span> <span class="lang-ta">\u0B93\u0B9F\u0BCD\u0B9F\u0BC1\u0BA8\u0BB0\u0BC1\u0B95\u0BCD\u0B95\u0BC1 \u0BA4\u0BC2\u0B99\u0BCD\u0B95\u0BC1\u0BAE\u0BCD \u0B87\u0B9F\u0BAE\u0BCD \u0B95\u0BCA\u0B9F\u0BC1\u0BA4\u0BCD\u0BA4\u0BBE\u0BB2\u0BCD \u0B87\u0BA4\u0BC8 \u0BA4\u0BC7\u0BB0\u0BCD\u0BB5\u0BC1 \u0B9A\u0BC6\u0BAF\u0BCD\u0BAF\u0BB5\u0BC1\u0BAE\u0BCD.</span> </span> </div> </label> </div> </div> <!-- Calculate Button --> <button id="calc-btn" class="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center shadow-lg hover:shadow-xl active:scale-[0.98]"> <span class="lang-en flex items-center">Calculate Cost ', '</span> <span class="lang-ta flex items-center">\u0BAE\u0BA4\u0BBF\u0BAA\u0BCD\u0BAA\u0BC0\u0B9F\u0BCD\u0B9F\u0BC8 \u0B95\u0BA3\u0B95\u0BCD\u0B95\u0BBF\u0B9F\u0BC1 ', '</span> </button> <!-- Results Section --> <div id="result-section" class="hidden pt-6 border-t border-slate-100"> <div class="flex justify-between items-end mb-6"> <div> <p class="text-[10px] font-bold text-slate-400 uppercase mb-1"> <span class="lang-en">Estimated Total</span> <span class="lang-ta">\u0BAE\u0BCA\u0BA4\u0BCD\u0BA4 \u0BAE\u0BA4\u0BBF\u0BAA\u0BCD\u0BAA\u0BC0\u0B9F\u0BC1</span> </p> <p class="text-4xl font-extrabold text-slate-900 tracking-tight" id="total-price">\u20B90</p> </div> <div class="text-right"> <p class="text-sm font-bold text-slate-600" id="distance-display">0 km</p> <p class="text-xs text-slate-400" id="duration-display"> <span class="lang-en">0 hrs Driving</span> <span class="lang-ta">0 \u0BAE\u0BA3\u0BBF \u0BA8\u0BC7\u0BB0\u0BAE\u0BCD</span> </p> </div> </div> <div class="space-y-3 text-sm" id="breakdown-list"> <!-- Dynamic Content --> </div> <div class="mt-6 p-3 bg-yellow-50 border border-yellow-100 rounded-lg flex gap-3"> ', ' <p class="text-xs text-yellow-800 leading-relaxed"> <span class="lang-en">Rate is per calendar day. Providing accommodation saves you <span class="font-bold">\u20B9500/night!</span></span> <span class="lang-ta">\u0B95\u0B9F\u0BCD\u0B9F\u0BA3\u0BAE\u0BCD \u0B92\u0BB0\u0BC1 \u0BA8\u0BBE\u0BB3\u0BC1\u0B95\u0BCD\u0B95\u0BC1. \u0BA4\u0B99\u0BCD\u0B95\u0BC1\u0BAE\u0BBF\u0B9F\u0BAE\u0BCD \u0B95\u0BCA\u0B9F\u0BC1\u0BA4\u0BCD\u0BA4\u0BBE\u0BB2\u0BCD <span class="font-bold">\u20B9500 \u0BAE\u0BBF\u0B9A\u0BCD\u0B9A\u0BAE\u0BCD!</span></span> </p> </div> </div> </div> </div> <script>(function(){', `
  (function() {
    // --- STATE ---
    let activeTab = 'round'; // 'oneway' | 'round'

    // --- DOM ELEMENTS ---
    const tabOneway = document.getElementById('tab-oneway');
    const tabRound = document.getElementById('tab-round');
    const roundTripFields = document.getElementById('round-trip-fields');
    const durationInput = document.getElementById('duration-days');
    const stayCheckbox = document.getElementById('stay-provided');
    const resultSection = document.getElementById('result-section');

    // --- TAB LOGIC ---
    function switchTab(tab) {
      activeTab = tab;
      if (tab === 'oneway') {
        // Style Active
        tabOneway.className = "flex-1 py-2 text-sm font-semibold rounded-lg bg-white text-indigo-600 shadow-sm transition-all";
        tabRound.className = "flex-1 py-2 text-sm font-semibold rounded-lg text-slate-600 hover:text-slate-900 transition-all";
        // Hide Fields
        roundTripFields.classList.add('hidden');
      } else {
        // Style Active
        tabRound.className = "flex-1 py-2 text-sm font-semibold rounded-lg bg-white text-indigo-600 shadow-sm transition-all";
        tabOneway.className = "flex-1 py-2 text-sm font-semibold rounded-lg text-slate-600 hover:text-slate-900 transition-all";
        // Show Fields
        roundTripFields.classList.remove('hidden');
      }
      // Hide results on tab switch to avoid confusion
      resultSection.classList.add('hidden');
    }

    tabOneway.addEventListener('click', () => switchTab('oneway'));
    tabRound.addEventListener('click', () => switchTab('round'));

    // --- GOOGLE MAPS INIT (Robust) ---
    let attempts = 0;
    const maxAttempts = 50; 

    function initializeAutocomplete() {
      const pickupInput = document.getElementById('simple-pickup');
      const dropInput = document.getElementById('simple-drop');

      if (!pickupInput || !dropInput) return;
      if (pickupInput.dataset.googleAttached === "true") return;

      try {
        const options = {
          componentRestrictions: { country: "in" },
          fields: ["geometry", "name"],
          strictBounds: false,
        };
        new google.maps.places.Autocomplete(pickupInput, options);
        new google.maps.places.Autocomplete(dropInput, options);
        pickupInput.dataset.googleAttached = "true";
        dropInput.dataset.googleAttached = "true";
        console.log("DriverFeeEstimator: Autocomplete initialized");
      } catch (e) {
        console.error("DriverFeeEstimator: Init failed", e);
      }
    }

    const intervalId = setInterval(() => {
      attempts++;
      if (window.google && window.google.maps && window.google.maps.places) {
        clearInterval(intervalId);
        initializeAutocomplete();
      } else if (attempts >= maxAttempts) {
        clearInterval(intervalId);
      }
    }, 100);

    // --- CALCULATION LOGIC ---
    const calcBtn = document.getElementById('calc-btn');
    
    if (calcBtn) {
      calcBtn.addEventListener('click', () => {
        const pickup = document.getElementById('simple-pickup').value;
        const drop = document.getElementById('simple-drop').value;
        
        if(!pickup || !drop) {
          alert("Please enter both locations");
          return;
        }

        // Change button state
        const originalBtnText = calcBtn.innerHTML;
        calcBtn.innerHTML = 'Calculating...';
        calcBtn.disabled = true;

        // 1. TRY LOCAL LOOKUP FIRST (No API)
        const p = pickup.toLowerCase();
        const d = drop.toLowerCase();
        
        // Find route in either direction
        const route = tnBusFares.find(r => 
          (p.includes(r.source) && d.includes(r.destination)) ||
          (p.includes(r.destination) && d.includes(r.source))
        );

        if (route) {
          console.log("Using Local Route Data:", route);
          
          // Simulate small delay for UX
          setTimeout(() => {
            calcBtn.innerHTML = originalBtnText;
            calcBtn.disabled = false;
            
            const realDist = route.distanceKm;
            const durationText = Math.round(realDist / 50) + " hrs (Est)"; // Approx 50km/h
            
            // Use stored SETC fare
            const setcFare = route.setcFare; 
            
            calculateAndShow(realDist, durationText, setcFare);
          }, 600);
          return;
        }

        // 2. FALLBACK TO API (If route not found)
        const service = new google.maps.DistanceMatrixService();
        service.getDistanceMatrix(
          {
            origins: [pickup],
            destinations: [drop],
            travelMode: google.maps.TravelMode.DRIVING,
            unitSystem: google.maps.UnitSystem.METRIC,
          },
          (response, status) => {
            // Reset button
            calcBtn.innerHTML = originalBtnText;
            calcBtn.disabled = false;

            if (status !== "OK") {
              alert("Error with distance service: " + status);
              return;
            }

            const result = response.rows[0].elements[0];
            if (result.status !== "OK") {
              alert("Could not calculate distance. Please check locations.");
              return;
            }

            // Real Data
            const distanceInMeters = result.distance.value;
            const realDist = Math.round(distanceInMeters / 1000); 
            const durationText = result.duration.text;
            
            // Fallback Fare Calculation (if not in JSON)
            // Approx 1.2 per km for SETC Ultra Deluxe
            const calculatedFare = Math.round(realDist * 1.2);

            calculateAndShow(realDist, durationText, calculatedFare);
          }
        );
      });

      function calculateAndShow(dist, duration, busFare) {
        // Rates
        const BATA_PER_DAY = 1200;
        const FOOD_PER_DAY = 300;
        const STAY_PER_NIGHT = 500;

        let total = 0;
        let breakdownHTML = '';

        if (activeTab === 'oneway') {
          // One Way Logic
          total = BATA_PER_DAY + FOOD_PER_DAY + busFare;

          breakdownHTML = \\\`
            <div class="flex justify-between py-2 border-b border-slate-50">
              <span class="text-slate-600">
                <span class="lang-en">Driver Bata (1 Day)</span>
                <span class="lang-ta">\u0B93\u0B9F\u0BCD\u0B9F\u0BC1\u0BA8\u0BB0\u0BCD \u0BAA\u0BC7\u0B9F\u0BCD\u0B9F\u0BBE (1 \u0BA8\u0BBE\u0BB3\u0BCD)</span>
              </span>
              <span class="font-bold text-slate-900">\u20B9\\\${BATA_PER_DAY}</span>
            </div>
            <div class="flex justify-between py-2 border-b border-slate-50">
              <span class="text-slate-600">
                <span class="lang-en">Food Allowance</span>
                <span class="lang-ta">\u0B89\u0BA3\u0BB5\u0BC1 \u0BAA\u0B9F\u0BBF</span>
              </span>
              <span class="font-bold text-slate-900">\u20B9\\\${FOOD_PER_DAY}</span>
            </div>
            <div class="flex justify-between py-2">
              <span class="text-slate-600">
                <span class="lang-en">Return Bus Ticket (SETC/Est)</span>
                <span class="lang-ta">\u0BA4\u0BBF\u0BB0\u0BC1\u0BAE\u0BCD\u0BAA\u0BC1\u0BAE\u0BCD \u0BAA\u0BC7\u0BB0\u0BC1\u0BA8\u0BCD\u0BA4\u0BC1 \u0B9F\u0BBF\u0B95\u0BCD\u0B95\u0BC6\u0B9F\u0BCD (\u0BAE\u0BA4\u0BBF\u0BAA\u0BCD\u0BAA\u0BC0\u0B9F\u0BC1)</span>
              </span>
              <span class="font-bold text-slate-900">\u20B9\\\${busFare}</span>
            </div>
          \\\`;

        } else {
          // Round Trip Logic
          let days = parseInt(durationInput.value) || 1;
          
          // Auto-correct days if distance > 250km
          const totalRoundTripDist = dist * 2;
          if (totalRoundTripDist > 250 && days < 2) {
            days = 2;
            durationInput.value = "2";
            alert("For round trips over 250km, minimum 2 days are required for driver safety.");
          }

          const nights = Math.max(0, days - 1); // Nights are usually Days - 1
          const provideStay = stayCheckbox.checked;

          const totalBata = BATA_PER_DAY * days;
          const totalFood = FOOD_PER_DAY * days;
          const totalStay = provideStay ? 0 : (STAY_PER_NIGHT * nights);
          
          total = totalBata + totalFood + totalStay;

          breakdownHTML = \\\`
            <div class="flex justify-between py-2 border-b border-slate-50">
              <span class="text-slate-600">
                <span class="lang-en">Driver Bata (\\\${days} Days)</span>
                <span class="lang-ta">\u0B93\u0B9F\u0BCD\u0B9F\u0BC1\u0BA8\u0BB0\u0BCD \u0BAA\u0BC7\u0B9F\u0BCD\u0B9F\u0BBE (\\\${days} \u0BA8\u0BBE\u0B9F\u0BCD\u0B95\u0BB3\u0BCD)</span>
              </span>
              <span class="font-bold text-slate-900">\u20B9\\\${totalBata}</span>
            </div>
            <div class="flex justify-between py-2 border-b border-slate-50">
              <span class="text-slate-600">
                <span class="lang-en">Food Allowance (\\\${days} Days)</span>
                <span class="lang-ta">\u0B89\u0BA3\u0BB5\u0BC1 \u0BAA\u0B9F\u0BBF (\\\${days} \u0BA8\u0BBE\u0B9F\u0BCD\u0B95\u0BB3\u0BCD)</span>
              </span>
              <span class="font-bold text-slate-900">\u20B9\\\${totalFood}</span>
            </div>
            \\\${nights > 0 ? \\\`
            <div class="flex justify-between py-2 \\\${provideStay ? 'text-slate-400 line-through' : ''}">
              <span class="text-slate-600">
                <span class="lang-en">Stay Allowance (\\\${nights} Nights)</span>
                <span class="lang-ta">\u0BA4\u0B99\u0BCD\u0B95\u0BC1\u0BAE\u0BCD \u0BAA\u0B9F\u0BBF (\\\${nights} \u0B87\u0BB0\u0BB5\u0BC1\u0B95\u0BB3\u0BCD)</span>
              </span>
              <span class="font-bold text-slate-900">\u20B9\\\${provideStay ? 0 : totalStay}</span>
            </div>
            \\\` : ''}
          \\\`;
        }

        // Update UI
        const displayDist = activeTab === 'round' ? dist * 2 : dist;
        document.getElementById('total-price').innerText = \\\`\u20B9\\\${total}\\\`;
        document.getElementById('distance-display').innerText = \\\`\\\${displayDist} km\\\`;
        document.getElementById('duration-display').innerText = duration;
        document.getElementById('breakdown-list').innerHTML = breakdownHTML;
        
        resultSection.classList.remove('hidden');
      }
    }
  })();
})();<\/script>`])), maybeRenderHead(), renderComponent($$result, "User", User, { "className": "w-10 h-10 text-indigo-600" }), renderComponent($$result, "MapPin", MapPin, { "className": "w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" }), renderComponent($$result, "Navigation", Navigation, { "className": "w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" }), renderComponent($$result, "Calendar", Calendar, { "className": "w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" }), renderComponent($$result, "Check", Check, { "className": "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" }), renderComponent($$result, "ArrowRight", ArrowRight, { "className": "w-4 h-4 ml-2" }), renderComponent($$result, "ArrowRight", ArrowRight, { "className": "w-4 h-4 ml-2" }), renderComponent($$result, "Info", Info, { "className": "w-4 h-4 text-yellow-600 shrink-0 mt-0.5" }), defineScriptVars({ tnBusFares }));
}, "D:/websites/kalidass-attempt-main/src/components/DriverFeeEstimator.astro", void 0);

export { $$DriverFeeEstimator as $ };
