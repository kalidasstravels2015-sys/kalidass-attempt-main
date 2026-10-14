import { onCLS, onLCP, onFCP, onTTFB, onINP } from 'web-vitals';

const GA_MEASUREMENT_ID = import.meta.env.PUBLIC_GA_ID || 'G-61YQMR8J7H';
const GOOGLE_ADS_ID = import.meta.env.PUBLIC_GOOGLE_ADS_ID || 'AW-18463679349';

export const GOOGLE_ADS_CONFIG = {
    adsId: GOOGLE_ADS_ID,
    conversionLabels: {
        call: import.meta.env.PUBLIC_ADS_CONVERSION_LABEL_CALL || '',
        whatsapp: import.meta.env.PUBLIC_ADS_CONVERSION_LABEL_WHATSAPP || '',
        quote: import.meta.env.PUBLIC_ADS_CONVERSION_LABEL_QUOTE || '',
        booking: import.meta.env.PUBLIC_ADS_CONVERSION_LABEL_BOOKING || '',
        qualified_booking: import.meta.env.PUBLIC_ADS_CONVERSION_LABEL_BOOKING || import.meta.env.PUBLIC_ADS_CONVERSION_LABEL_WHATSAPP || ''
    }
};

export const initAnalytics = () => {
    if (typeof window === 'undefined') return;

    const search = window.location.search || '';
    const isGoogleAuditOrAd = search.includes('gclid') || search.includes('gtm_debug') || search.includes('_gl') || (typeof document !== 'undefined' && document.referrer && document.referrer.includes('tagassistant.google.com'));

    // Never load GA on localhost, dev server, or during automated Lighthouse audits (unless Google Ads Tag Assistant)
    if (
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ||
        (!isGoogleAuditOrAd && typeof navigator !== 'undefined' && (
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
        gtag('config', GOOGLE_ADS_ID);


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

    // Immediate initialization for Google Ads traffic or Tag Assistant verification
    if (isGoogleAuditOrAd) {
        start();
        return;
    }

    if (document.readyState === 'complete') {
        scheduleInit();
    } else {
        window.addEventListener('load', scheduleInit, { once: true });
    }
};

export const reportAdsConversion = (params = {}, type = 'quote') => {
    if (typeof window === 'undefined') return;

    if (typeof window.reportGoogleAdsConversion === 'function') {
        window.reportGoogleAdsConversion(type, params);
        return;
    }

    if (window.gtag) {
        const adsId = GOOGLE_ADS_CONFIG.adsId;
        const labels = GOOGLE_ADS_CONFIG.conversionLabels || {};
        const label = labels[type] || (type === 'qualified_booking' ? (labels.booking || labels.whatsapp || '') : '');
        const numericValue = Number(params.value || params.fare || 1.0);

        if (label) {
            window.gtag('event', 'conversion', {
                send_to: `${adsId}/${label}`,
                value: numericValue,
                currency: 'INR',
                transaction_id: params.quoteId || params.transaction_id || undefined
            });
        }
        window.gtag('event', 'ads_conversion_Request_quote_1', {
            event_category: type === 'qualified_booking' ? 'Qualified Lead' : 'Lead',
            event_label: params.event_label || (type === 'call' ? 'Phone Call' : type === 'whatsapp' ? 'WhatsApp Lead' : 'Quote Request'),
            lead_type: type,
            value: numericValue,
            currency: 'INR',
            is_qualified: type === 'qualified_booking',
            ...params
        });
        window.gtag('event', `lead_${type}`, params);
    }
};

export const trackEvent = (eventName, params = {}) => {
    if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', eventName, params);
        // Automatically forward quote, call & booking lead events to Google Ads conversion
        if (
            eventName.includes('conversion') ||
            eventName.includes('quote') ||
            eventName.includes('whatsapp') ||
            eventName.includes('booked') ||
            eventName.includes('call_clicked')
        ) {
            const isQualified = eventName.includes('booked') || Boolean(params.is_qualified_estimate);
            const type = eventName.includes('call')
                ? 'call'
                : isQualified
                    ? 'qualified_booking'
                    : 'whatsapp';

            reportAdsConversion({
                ...params,
                value: params.fare || params.value || 1.0,
                currency: 'INR',
                event_category: isQualified ? 'Qualified Lead' : 'Lead',
                trigger_event: eventName
            }, type);
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

    reportAdsConversion({
        quote_id: targetQuoteId,
        event_category: 'Lead',
        event_label: 'Calculator WhatsApp Converted',
        ...extra
    }, 'whatsapp');
};

