import { useState, useEffect } from 'react';

export const useLanguage = () => {
    const [lang, setLang] = useState(() => {
        if (typeof window === 'undefined') return 'en';
        const stored = localStorage.getItem('language');
        return stored && (stored === 'en' || stored === 'ta') ? stored : 'en';
    });

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const handleLanguageChange = (event) => {
            setLang(event.detail);
        };
        window.addEventListener('languageChange', handleLanguageChange);
        return () => window.removeEventListener('languageChange', handleLanguageChange);
    }, []);

    return lang;
};

export const setLanguage = (newLang) => {
    if (newLang === 'en' || newLang === 'ta') {
        if (typeof window !== 'undefined') {
            localStorage.setItem('language', newLang);
            window.dispatchEvent(new CustomEvent('languageChange', { detail: newLang }));
        }
    }
};