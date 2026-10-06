/**
 * Sticky Quick-Navigation Scroll Spy Controller
 * 
 * Automatically tracks scroll progress on pages with a sticky quick-navigation bar,
 * highlights the active section pill (executive M3 Charcoal primary vs tonal surface),
 * and smoothly scrolls the horizontal pill container on mobile devices so the active
 * pill is always visible and centered.
 */

interface QuickNavItem {
  link: HTMLAnchorElement;
  target: HTMLElement;
  id: string;
}

const ALL_STATE_CLASSES = [
  'bg-m3-primary',
  'bg-m3-primary-container',
  'bg-m3-surface-container',
  'bg-m3-surface-container-high',
  'bg-m3-surface-container-low',
  'text-white',
  'text-m3-on-primary',
  'text-m3-on-primary-container',
  'text-m3-on-surface',
  'text-m3-on-surface-variant',
  'font-bold',
  'font-medium',
  'shadow-xs',
  'shadow-m3-1',
  'scale-[1.02]'
];

const ACTIVE_CLASSES = ['bg-m3-primary', 'text-white', 'font-bold', 'shadow-xs'];
const INACTIVE_CLASSES = ['bg-m3-surface-container', 'text-m3-on-surface', 'font-medium'];

function setLinkState(link: HTMLAnchorElement, isActive: boolean) {
  link.classList.remove(...ALL_STATE_CLASSES);
  if (isActive) {
    link.classList.add(...ACTIVE_CLASSES);
    link.setAttribute('data-active', 'true');
    link.setAttribute('aria-current', 'true');
  } else {
    link.classList.add(...INACTIVE_CLASSES);
    link.removeAttribute('data-active');
    link.removeAttribute('aria-current');
  }
}

function scrollActivePillIntoView(link: HTMLElement) {
  const container = link.closest<HTMLElement>('.overflow-x-auto, [data-quick-nav-container]');
  if (!container) return;

  requestAnimationFrame(() => {
    const containerRect = container.getBoundingClientRect();
    const linkRect = link.getBoundingClientRect();

    // Calculate target scroll position to center the active pill
    const currentScroll = container.scrollLeft;
    const linkCenterRelative = (linkRect.left - containerRect.left) + (linkRect.width / 2);
    const targetScroll = currentScroll + linkCenterRelative - (containerRect.width / 2);
    const maxScroll = container.scrollWidth - container.clientWidth;
    const clampedTarget = Math.max(0, Math.min(maxScroll, Math.round(targetScroll)));

    // Smooth scroll container horizontally if difference is noticeable
    if (Math.abs(clampedTarget - currentScroll) > 4) {
      container.scrollTo({
        left: clampedTarget,
        behavior: 'smooth'
      });
    }
  });
}

export function initStickyQuickNav(): () => void {
  const navElements = document.querySelectorAll<HTMLElement>(
    'nav[data-quick-nav], nav[aria-label*="Quick Navigation"]'
  );
  if (!navElements.length) return () => {};

  const cleanups: Array<() => void> = [];

  navElements.forEach((nav) => {
    const rawLinks = Array.from(nav.querySelectorAll<HTMLAnchorElement>('a[href^="#"]'));
    if (!rawLinks.length) return;

    // Collect valid link-to-section pairs
    const items: QuickNavItem[] = [];
    for (const link of rawLinks) {
      const hash = link.getAttribute('href');
      if (hash && hash.startsWith('#') && hash.length > 1) {
        const id = hash.slice(1);
        const target = document.getElementById(id);
        if (target) {
          items.push({ link, target, id });
        }
      }
    }

    if (!items.length) return;

    // Sort items by document flow so scroll spy evaluates sections from top to bottom
    const sortedItems = [...items].sort((a, b) => {
      const pos = a.target.compareDocumentPosition(b.target);
      return pos & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
    });

    let currentActiveLink: HTMLAnchorElement | null = null;
    let isClickScrolling = false;
    let clickScrollTimer: ReturnType<typeof setTimeout> | null = null;
    let navHeight = nav.offsetHeight || 52;

    function getActiveItem(): QuickNavItem {
      const scrollY = window.scrollY;
      const viewportHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;
      const isBottom = (scrollY + viewportHeight) >= (docHeight - 60);

      // If scrolled to bottom of document, activate the last section
      if (isBottom) {
        return sortedItems[sortedItems.length - 1];
      }

      // Sticky header (64px) + sticky nav height + breathing margin (~35px)
      const currentNavHeight = nav.offsetHeight || navHeight || 52;
      const SCROLL_OFFSET = 64 + currentNavHeight + 35;

      let activeItem: QuickNavItem | null = null;

      for (let i = 0; i < sortedItems.length; i++) {
        const item = sortedItems[i];
        const rect = item.target.getBoundingClientRect();
        if (rect.top <= SCROLL_OFFSET) {
          activeItem = item;
        } else {
          break;
        }
      }

      // If before first section, activate the first section in document order
      return activeItem || sortedItems[0];
    }

    function updateActive(forceScrollPill = false) {
      if (isClickScrolling) return;

      const active = getActiveItem();
      if (!active) return;

      if (active.link !== currentActiveLink) {
        items.forEach((item) => {
          setLinkState(item.link, item.link === active.link);
        });
        currentActiveLink = active.link;
        scrollActivePillIntoView(currentActiveLink);
      } else if (forceScrollPill && currentActiveLink) {
        scrollActivePillIntoView(currentActiveLink);
      }
    }

    // Pill click interaction
    items.forEach((item) => {
      const handleClick = (e: MouseEvent) => {
        e.preventDefault();
        isClickScrolling = true;
        if (clickScrollTimer) clearTimeout(clickScrollTimer);

        items.forEach((it) => {
          setLinkState(it.link, it.link === item.link);
        });
        currentActiveLink = item.link;
        scrollActivePillIntoView(currentActiveLink);

        // Native smooth scroll to section with scroll-mt offset
        item.target.scrollIntoView({ behavior: 'smooth' });
        history.replaceState(null, '', `#${item.id}`);

        // Re-enable scroll listener when smooth scrolling settles
        let finished = false;
        const done = () => {
          if (finished) return;
          finished = true;
          isClickScrolling = false;
          if (clickScrollTimer) clearTimeout(clickScrollTimer);
          window.removeEventListener('scrollend', done);
          updateActive();
        };

        if ('onscrollend' in window) {
          window.addEventListener('scrollend', done, { once: true });
        }
        clickScrollTimer = setTimeout(done, 1500);
      };

      item.link.addEventListener('click', handleClick);
      cleanups.push(() => item.link.removeEventListener('click', handleClick));
    });

    // Throttled scroll listener
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          updateActive();
          ticking = false;
        });
        ticking = true;
      }
    };

    const onResize = () => {
      navHeight = nav.offsetHeight || 52;
      onScroll();
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });

    cleanups.push(() => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      if (clickScrollTimer) clearTimeout(clickScrollTimer);
    });

    // Initial activation: default to first item at scroll 0 without triggering forced reflow
    if (window.scrollY === 0) {
      const initialActive = sortedItems[0];
      items.forEach((item) => {
        setLinkState(item.link, item.link === initialActive.link);
      });
      currentActiveLink = initialActive.link;
    } else {
      requestAnimationFrame(() => {
        const initialActive = getActiveItem();
        items.forEach((item) => {
          setLinkState(item.link, item.link === initialActive.link);
        });
        currentActiveLink = initialActive.link;
        scrollActivePillIntoView(currentActiveLink);
      });
    }
  });

  return () => {
    cleanups.forEach((fn) => fn());
  };
}
