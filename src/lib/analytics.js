import { onCLS, onLCP, onFCP, onTTFB, onINP } from 'web-vitals';

const GA_MEASUREMENT_ID = import.meta.env.PUBLIC_GA_ID || 'G-61YQMR8J7H';

export const initAnalytics = () => {
    if (typeof window === 'undefined') return;

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
        });

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
        if ('requestIdleCallback' in window) {
            window.requestIdleCallback(start, { timeout: 4500 });
        } else {
            setTimeout(start, 2500);
        }
    };

    if (document.readyState === 'complete') {
        scheduleInit();
    } else {
        window.addEventListener('load', scheduleInit, { once: true });
    }
};

export const trackEvent = (eventName, params = {}) => {
    if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', eventName, params);
    } else {
        console.log('[Analytics] Event:', eventName, params);
    }
};
