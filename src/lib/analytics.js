import { onCLS, onLCP, onFCP, onTTFB, onINP } from 'web-vitals';

const GA_MEASUREMENT_ID = import.meta.env.PUBLIC_GA_ID || 'G-61YQMR8J7H';

export const initAnalytics = () => {
    if (typeof window === 'undefined') return;

    // Initialize GA4
    const script = document.createElement('script');
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    script.async = true;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    window.gtag = gtag;

    gtag('js', new Date());
    gtag('config', GA_MEASUREMENT_ID, {
        transport_type: 'beacon',
        debug_mode: import.meta.env.DEV,
    });

    // Track Web Vitals
    function sendToAnalytics(metric) {
        const { name, delta, id, value } = metric;
        // Log for debugging
        if (import.meta.env.DEV) {
            console.log(`[Web Vitals] ${name}:`, value);
        }

        gtag('event', name, {
            event_category: 'Web Vitals',
            event_label: id,
            value: Math.round(name === 'CLS' ? delta * 1000 : delta), // CLS need to be integer for GA sometimes, but delta * 1000 is standard
            non_interaction: true,
            metric_value: value,
            metric_delta: delta,
        });
    }

    onCLS(sendToAnalytics);
    onLCP(sendToAnalytics);
    onFCP(sendToAnalytics);
    onTTFB(sendToAnalytics);
    onINP(sendToAnalytics); // Adding INP as it replaces FID in Core Web Vitals
};

export const trackEvent = (eventName, params = {}) => {
    if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', eventName, params);
    } else {
        console.log('[Analytics] Event:', eventName, params);
    }
};
