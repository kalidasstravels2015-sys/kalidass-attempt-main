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
