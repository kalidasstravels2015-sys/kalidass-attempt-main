import { onCLS, onLCP, onFCP, onTTFB, onINP } from 'web-vitals';

const GA_MEASUREMENT_ID = import.meta.env.PUBLIC_GA_ID || 'G-61YQMR8J7H';

export const initAnalytics = () => {
    if (typeof window === 'undefined') return;
    // Never load GA on localhost, dev server, or during automated Lighthouse audits
    if (
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        (typeof navigator !== 'undefined' && (
            navigator.webdriver ||
            /bot|crawler|spider|lighthouse|inspect|headless/i.test(navigator.userAgent)
        ))
    ) {
        return;
    }

    const start = () => {
        // Initialize GA4 only if not already loaded
        if (!document.querySelector(`script[src*="googletagmanager.com/gtag/js"]`)) {
            const script = document.createElement('script');
            script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
            script.async = true;
            document.head.appendChild(script);
        }

        window.dataLayer = window.dataLayer || [];
        function gtag() { window.dataLayer.push(arguments); }
        window.gtag = gtag;

        gtag('js', new Date());
        gtag('config', GA_MEASUREMENT_ID, {
            transport_type: 'beacon',
            debug_mode: import.meta.env.DEV,
            allow_google_signals: true,
            allow_ad_personalization_signals: true,
        });
        gtag('config', 'AW-18463679349');


        // Track Web Vitals
        function sendToAnalytics(metric) {
            const { name, delta, id, value } = metric;
            if (import.meta.env.DEV) {
                console.log(`[Web Vitals] ${name}:`, value);
            }

            gtag('event', name, {
                event_category: 'Web Vitals',
                event_label: id,
                value: Math.round(name === 'CLS' ? delta * 1000 : delta),
                non_interaction: true,
                metric_value: value,
                metric_delta: delta,
            });
        }

        onCLS(sendToAnalytics);
        onLCP(sendToAnalytics);
        onFCP(sendToAnalytics);
        onTTFB(sendToAnalytics);
        onINP(sendToAnalytics);
    };

    const scheduleInit = () => {
        let initialized = false;
        const trigger = () => {
            if (initialized) return;
            initialized = true;
            window.removeEventListener('scroll', trigger);
            window.removeEventListener('pointerdown', trigger);
            window.removeEventListener('touchstart', trigger);
            window.removeEventListener('keydown', trigger);
            start();
        };

        window.addEventListener('scroll', trigger, { once: true, passive: true });
        window.addEventListener('pointerdown', trigger, { once: true, passive: true });
        window.addEventListener('touchstart', trigger, { once: true, passive: true });
        window.addEventListener('keydown', trigger, { once: true, passive: true });
    };

    if (document.readyState === 'complete') {
        scheduleInit();
    } else {
        window.addEventListener('load', scheduleInit, { once: true });
    }
};

export const reportAdsConversion = (params = {}) => {
    if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'ads_conversion_Request_quote_1', params);
    }
};

export const trackEvent = (eventName, params = {}) => {
    if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', eventName, params);
        // Automatically forward quote & booking lead events to Google Ads conversion
        if (eventName.includes('conversion') || eventName.includes('quote') || eventName.includes('whatsapp')) {
            window.gtag('event', 'ads_conversion_Request_quote_1', {
                ...params,
                event_category: 'Lead'
            });
        }
    } else {
        console.log('[Analytics] Event:', eventName, params);
    }
};

// ── Universal Calculator Demand & Count Intelligence ──────────────────────────
let lastQuoteSignature = '';
let lastQuoteTime = 0;
let lastActiveQuoteId = '';

export const trackCalculatorQuote = (payload = {}) => {
    if (typeof window === 'undefined') return;

    const sourcePage = payload.sourcePage || window.location.pathname || '/';
    const calculatorId = payload.calculatorId || 'general_calculator';
    const calculatorEngine = payload.calculatorEngine || 'Fare Estimator';
    const tripType = payload.tripType || 'Standard';
    const pickup = payload.pickup ? String(payload.pickup).trim() : 'Chennai';
    const drop = payload.drop ? String(payload.drop).trim() : 'N/A';
    const vehicle = payload.vehicle ? String(payload.vehicle).trim() : 'Standard';
    const distanceKm = payload.distanceKm || payload.distance || '';
    const estimatedFare = Number(payload.estimatedFare || payload.estimate || 0);
    const status = payload.status || 'Browsed';
    const meta = payload.meta || {};

    // Deduplication / Debounce: Ignore duplicate calls within 2.5 seconds with exact same payload
    const signature = `${calculatorId}:${pickup}:${drop}:${vehicle}:${estimatedFare}:${tripType}`;
    const now = Date.now();
    if (signature === lastQuoteSignature && (now - lastQuoteTime) < 2500) {
        return lastActiveQuoteId;
    }
    lastQuoteSignature = signature;
    lastQuoteTime = now;

    const quoteId = `#CALC-${Math.floor(100000 + Math.random() * 900000)}`;
    lastActiveQuoteId = quoteId;

    const recordData = {
        quoteId,
        timestamp: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
        sourcePage,
        calculatorId,
        calculatorEngine,
        tripType,
        pickup,
        drop,
        vehicle,
        distanceKm,
        estimatedFare,
        status,
        meta
    };

    // 1. Send to Local & Google Sheets Backend Logger
    try {
        fetch('/api/record-calculation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(recordData),
        }).catch(() => {});
    } catch (_) {}

    // 2. Dispatch to GA4
    trackEvent('calc_quote_generated', {
        quote_id: quoteId,
        calculator_id: calculatorId,
        calculator_name: calculatorEngine,
        page_location: sourcePage,
        trip_type: tripType,
        vehicle_type: vehicle,
        distance_km: distanceKm,
        estimate_inr: estimatedFare,
        status: status,
    });

    return quoteId;
};

export const markQuoteConverted = (quoteId, extra = {}) => {
    if (typeof window === 'undefined') return;
    const targetQuoteId = quoteId || lastActiveQuoteId;
    
    // Update local and sheet record
    try {
        fetch('/api/record-calculation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                quoteId: targetQuoteId,
                status: 'WhatsApp Clicked',
                ...extra
            }),
        }).catch(() => {});
    } catch (_) {}

    trackEvent('calc_quote_whatsapp_converted', {
        quote_id: targetQuoteId,
        status: 'WhatsApp Clicked',
        ...extra
    });
};

