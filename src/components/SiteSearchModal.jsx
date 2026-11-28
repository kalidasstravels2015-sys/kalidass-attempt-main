import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  X,
  ArrowRight,
  MapPin,
  Car,
  UserCheck,
  Calculator,
  Sparkles,
  Loader2,
} from 'lucide-react';

const POPULAR_CHIPS = [
  { label: 'Tirupati 1-Day', query: 'Tirupati' },
  { label: 'Chennai Airport', query: 'Airport' },
  { label: 'Tempo Traveller', query: 'Tempo Traveller' },
  { label: 'Pondicherry', query: 'Pondicherry' },
  { label: 'Acting Driver', query: 'Acting Driver' },
  { label: 'Fare Calculator', query: 'Calculator' },
  { label: 'Yelagiri Hills', query: 'Yelagiri' },
  { label: 'Navagraha', query: 'Navagraha' },
];

const TYPE_TABS = [
  { id: 'all', label: 'All' },
  { id: 'package', label: 'Tours & Cabs' },
  { id: 'fleet', label: 'Fleet' },
  { id: 'driver', label: 'Drivers' },
  { id: 'tool', label: 'Tools & Rates' },
];

const SYNONYMS = {
  tirupathi: 'tirupati',
  balaji: 'tirupati',
  tt: 'tempo traveller',
  tempo: 'tempo traveller',
  pondy: 'pondicherry',
  puducherry: 'pondicherry',
  mahabs: 'mahabalipuram',
  mamallapuram: 'mahabalipuram',
  maa: 'airport',
  flight: 'airport',
  crysta: 'innova crysta',
  sabarimalai: 'sabarimala',
  ayyappa: 'sabarimala',
  'tv malai': 'thiruvannamalai',
  girivalam: 'thiruvannamalai',
  velankanni: 'velankanni',
  price: 'tariff',
  rate: 'tariff',
  cost: 'calculator',
  estimate: 'calculator',
  valet: 'acting driver',
  'call driver': 'acting driver',
};

function expandQuery(raw) {
  let q = raw.trim().toLowerCase();
  if (!q) return '';
  for (const [alias, canonical] of Object.entries(SYNONYMS)) {
    if (q === alias || q.includes(alias)) {
      q = `${q} ${canonical}`;
    }
  }
  return q;
}

function scoreItem(item, tokens) {
  const title = item.title.toLowerCase();
  const category = item.category.toLowerCase();
  const subtitle = item.subtitle.toLowerCase();
  const keywords = item.keywords.toLowerCase();

  let score = 0;
  for (const token of tokens) {
    if (title.includes(token)) {
      score += title.startsWith(token) ? 12 : 8;
    } else if (category.includes(token)) {
      score += 5;
    } else if (subtitle.includes(token)) {
      score += 4;
    } else if (keywords.includes(token)) {
      score += 2;
    } else {
      return 0; // Require all tokens to match somewhere
    }
  }
  // Slight boost for primary packages and tools
  if (item.type === 'tool') score += 1.5;
  if (item.type === 'package') score += 1;
  return score;
}

function trackSearch(term) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function' && term.trim().length >= 2) {
    window.gtag('event', 'search', { search_term: term.trim() });
  }
}

export default function SiteSearchModal() {
  const dialogRef = useRef(null);
  const inputRef = useRef(null);
  const resultsRef = useRef(null);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [activeIndex, setActiveIndex] = useState(0);

  const loadIndex = async () => {
    if (items.length > 0 || loading) return;
    setLoading(true);
    setFetchError(false);
    try {
      let res = await fetch('/api/search-index.json/');
      if (!res.ok) {
        res = await fetch('/api/search-index.json');
      }
      if (!res.ok) throw new Error('Failed to load search index');
      const data = await res.json();
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch {
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (prefillQuery) => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (typeof prefillQuery === 'string') {
      setQuery(prefillQuery);
      setActiveIndex(0);
    }
    loadIndex();
    if (!dialog.open) {
      dialog.showModal();
    }
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  };

  const closeModal = () => {
    const dialog = dialogRef.current;
    if (dialog && dialog.open) {
      dialog.close();
    }
  };

  useEffect(() => {
    const handleOpenEvent = (e) => {
      const detailQuery = e?.detail && typeof e.detail.query === 'string' ? e.detail.query : undefined;
      openModal(detailQuery);
    };
    window.addEventListener('open-site-search', handleOpenEvent);

    // Support Schema.org SearchAction (?q={search_term_string}) on /services/ or any page
    const urlParams = new URLSearchParams(window.location.search);
    const urlQuery = urlParams.get('q');
    if (urlQuery && urlQuery.trim()) {
      openModal(urlQuery.trim());
    } else if (window.__pendingSiteSearchOpen) {
      // If user clicked the search button before React hydrated, open immediately now
      window.__pendingSiteSearchOpen = false;
      openModal();
    }

    const handleGlobalKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (dialogRef.current?.open) {
          closeModal();
        } else {
          openModal();
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);

    // Safari fallback for closedby="any" light dismiss
    const dialog = dialogRef.current;
    let cleanupBackdrop = null;
    if (dialog && !('closedBy' in HTMLDialogElement.prototype)) {
      let pressedOutside = false;
      const isOutside = (e) => {
        const r = dialog.getBoundingClientRect();
        return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
      };
      const onDown = (e) => {
        pressedOutside = isOutside(e);
      };
      const onUp = (e) => {
        if (pressedOutside && isOutside(e)) dialog.close();
      };
      dialog.addEventListener('pointerdown', onDown);
      dialog.addEventListener('pointerup', onUp);
      cleanupBackdrop = () => {
        dialog.removeEventListener('pointerdown', onDown);
        dialog.removeEventListener('pointerup', onUp);
      };
    }

    return () => {
      window.removeEventListener('open-site-search', handleOpenEvent);
      window.removeEventListener('keydown', handleGlobalKeyDown);
      if (cleanupBackdrop) cleanupBackdrop();
    };
  }, []);

  // Debounced GA4 search tracking
  useEffect(() => {
    if (query.trim().length < 3) return;
    const timer = setTimeout(() => trackSearch(query), 900);
    return () => clearTimeout(timer);
  }, [query]);

  const filteredResults = useMemo(() => {
    const pool = activeTab === 'all' ? items : items.filter((item) => item.type === activeTab);
    const expanded = expandQuery(query);
    if (!expanded) {
      // Show curated popular tools & top packages when search is empty
      return pool.slice(0, 10);
    }
    const tokens = expanded.split(/\s+/).filter(Boolean);
    return pool
      .map((item) => ({ item, score: scoreItem(item, tokens) }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 20)
      .map((entry) => entry.item);
  }, [items, query, activeTab]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, activeTab]);

  const handleInputKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (filteredResults.length ? (prev + 1) % filteredResults.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) =>
        filteredResults.length ? (prev - 1 + filteredResults.length) % filteredResults.length : 0
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (e.isComposing || e.keyCode === 229) return;
      const selected = filteredResults[activeIndex];
      if (selected) {
        trackSearch(query || selected.title);
        closeModal();
        window.location.href = selected.url;
      }
    }
  };

  const renderIcon = (type) => {
    switch (type) {
      case 'fleet':
        return <Car className="w-4 h-4 text-m3-primary shrink-0" aria-hidden="true" />;
      case 'driver':
        return <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />;
      case 'tool':
        return <Calculator className="w-4 h-4 text-m3-tertiary shrink-0" aria-hidden="true" />;
      default:
        return <MapPin className="w-4 h-4 text-m3-primary shrink-0" aria-hidden="true" />;
    }
  };

  return (
    <dialog
      ref={dialogRef}
      id="site-search-dialog"
      closedby="any"
      aria-labelledby="site-search-title"
      className="w-[calc(100%-1.5rem)] max-w-2xl rounded-m3-2xl bg-m3-surface-container-lowest text-m3-on-surface shadow-m3-4 border border-m3-outline-variant/60 p-0 m-auto backdrop:bg-m3-scrim/60 backdrop:backdrop-blur-sm overflow-hidden"
    >
      <h1 id="site-search-title" className="sr-only">
        Search Kalidass Travels packages, fleet, drivers, and fares
      </h1>

      {/* Search Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-m3-outline-variant/50 bg-m3-surface-container-low/60">
        <Search className="w-5 h-5 text-m3-primary shrink-0" aria-hidden="true" />
        <label htmlFor="site-search-input" className="sr-only">
          Search destinations, tour packages, cab models, or drivers
        </label>
        <input
          ref={inputRef}
          id="site-search-input"
          type="search"
          autofocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleInputKeyDown}
          placeholder="Search Tirupati, Tempo Traveller, Airport, Acting Driver..."
          autoComplete="off"
          className="w-full bg-transparent text-sm sm:text-base text-m3-on-surface placeholder:text-m3-on-surface-variant/75 focus:outline-none"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
            className="p-1.5 rounded-full text-m3-on-surface-variant hover:bg-m3-surface-container transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <button
          type="button"
          onClick={closeModal}
          aria-label="Close search"
          className="px-2.5 py-1 rounded-m3-lg text-xs font-semibold text-m3-on-surface-variant bg-m3-surface-container hover:bg-m3-surface-container-high transition-colors shrink-0"
        >
          Esc
        </button>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-m3-outline-variant/40 overflow-x-auto no-scrollbar">
        {TYPE_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                isActive
                  ? 'bg-m3-primary text-m3-on-primary shadow-xs'
                  : 'bg-m3-surface-container text-m3-on-surface-variant hover:bg-m3-surface-container-high'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
        <span className="w-2 shrink-0" aria-hidden="true" />
      </div>

      {/* Popular Quick Chips (shown when query is empty) */}
      {!query.trim() && (
        <div className="px-4 py-2.5 border-b border-m3-outline-variant/30 bg-m3-surface-container-lowest">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-m3-on-surface-variant mb-2">
            <Sparkles className="w-3.5 h-3.5 text-m3-primary" aria-hidden="true" />
            <span>Popular Searches</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {POPULAR_CHIPS.map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={() => {
                  setQuery(chip.query);
                  inputRef.current?.focus();
                }}
                className="px-2.5 py-1 rounded-full text-xs font-medium bg-m3-primary/10 text-m3-primary hover:bg-m3-primary/20 transition-colors"
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results List */}
      <div
        ref={resultsRef}
        className="max-h-[55vh] overflow-y-auto divide-y divide-m3-outline-variant/30 p-2"
      >
        {loading && (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-m3-on-surface-variant">
            <Loader2 className="w-4 h-4 animate-spin text-m3-primary" />
            <span>Loading routes &amp; packages...</span>
          </div>
        )}

        {fetchError && !loading && (
          <div className="py-8 text-center text-sm text-m3-on-surface-variant">
            Unable to load search index right now.{' '}
            <a href="/services/" className="text-m3-primary font-semibold underline">
              Browse all services
            </a>
          </div>
        )}

        {!loading && !fetchError && filteredResults.length === 0 && (
          <div className="py-10 px-4 text-center space-y-2">
            <p className="text-sm font-semibold text-m3-on-surface">
              No matches found for &ldquo;{query}&rdquo;
            </p>
            <p className="text-xs text-m3-on-surface-variant">
              Try searching for a city (Tirupati, Pondicherry, Vellore), vehicle (Innova, Tempo Traveller), or use our{' '}
              <a href="/calculator/" className="text-m3-primary font-semibold underline">
                Fare Calculator
              </a>
              .
            </p>
          </div>
        )}

        {!loading &&
          !fetchError &&
          filteredResults.map((item, idx) => {
            const isHighlighted = idx === activeIndex;
            return (
              <a
                key={item.id}
                href={item.url}
                onClick={() => {
                  trackSearch(query || item.title);
                  closeModal();
                }}
                className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-m3-xl transition-colors ${
                  isHighlighted
                    ? 'bg-m3-primary-container/50 text-m3-on-surface'
                    : 'hover:bg-m3-surface-container/70 text-m3-on-surface'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="mt-0.5 p-2 rounded-m3-lg bg-m3-surface-container shrink-0">
                    {renderIcon(item.type)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-m3-on-surface truncate">
                        {item.title}
                      </span>
                      {item.badge && (
                        <span className="px-2 py-0.5 rounded-full bg-m3-primary/10 text-m3-primary text-[10px] font-bold whitespace-nowrap">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-m3-on-surface-variant line-clamp-1 mt-0.5">
                      {item.subtitle}
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-m3-on-surface-variant shrink-0" aria-hidden="true" />
              </a>
            );
          })}
      </div>

      {/* Footer Hint */}
      <div className="hidden sm:flex items-center justify-between px-4 py-2 text-[11px] text-m3-on-surface-variant bg-m3-surface-container-low/60 border-t border-m3-outline-variant/40">
        <span>Use ↑ ↓ to navigate, Enter to open</span>
        <a href="/services/" className="font-semibold text-m3-primary hover:underline">
          Browse all 37+ packages →
        </a>
      </div>
    </dialog>
  );
}
