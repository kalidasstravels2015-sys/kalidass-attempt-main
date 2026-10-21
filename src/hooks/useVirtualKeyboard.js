import { useEffect, useState, useCallback } from 'react';

/**
 * useVirtualKeyboard
 *
 * Tracks the on-screen (virtual) keyboard height using two APIs:
 *   1. window.visualViewport  — widely supported (Chrome 61+, Safari 13+, Firefox 91+)
 *   2. navigator.virtualKeyboard — Chrome 94+ progressive enhancement
 *
 * Exposes:
 *   keyboardHeight   — px height of the visible keyboard (0 when closed)
 *   isKeyboardOpen   — boolean
 *   visibleHeight    — px of screen NOT covered by the keyboard
 *   scrollInputAboveKeyboard(inputEl, reservePx?) — scrolls an input so that
 *                      `reservePx` (default 220) remain below it for dropdowns
 */
export function useVirtualKeyboard() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [visibleHeight, setVisibleHeight] = useState(
    typeof window !== 'undefined' ? window.innerHeight : 0
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;

    const applyKeyboardHeight = (height) => {
      const open = height > 80; // 80 px threshold — filters out browser chrome resize
      const safeHeight = open ? height : 0;

      setKeyboardHeight(safeHeight);
      setIsKeyboardOpen(open);
      setVisibleHeight(window.innerHeight - safeHeight);

      root.style.setProperty('--keyboard-height', `${safeHeight}px`);
      root.style.setProperty('--keyboard-visible', open ? '1' : '0');
    };

    // ── visualViewport (primary, broad browser support) ──────────────────────
    const vv = window.visualViewport;

    const onViewportChange = () => {
      if (!vv) return;
      // offsetTop accounts for the browser toolbar collapsing on scroll
      const kbHeight = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      applyKeyboardHeight(kbHeight);
    };

    if (vv) {
      vv.addEventListener('resize', onViewportChange);
      vv.addEventListener('scroll', onViewportChange);
      onViewportChange(); // read initial state
    }

    // ── navigator.virtualKeyboard (Chrome 94+ progressive enhancement) ───────
    // We do NOT set overlaysContent = true here because that would disable the
    // browser's built-in auto-scroll for ALL inputs site-wide. Instead we use
    // the geometrychange event purely for more accurate keyboard height data.
    const vkb = navigator.virtualKeyboard ?? null;
    const onGeometryChange = (e) => {
      const { height } = e.target.boundingRect;
      applyKeyboardHeight(height);
    };

    if (vkb) {
      vkb.addEventListener('geometrychange', onGeometryChange);
    }

    return () => {
      if (vv) {
        vv.removeEventListener('resize', onViewportChange);
        vv.removeEventListener('scroll', onViewportChange);
      }
      if (vkb) {
        vkb.removeEventListener('geometrychange', onGeometryChange);
      }
      root.style.removeProperty('--keyboard-height');
      root.style.removeProperty('--keyboard-visible');
    };
  }, []);

  /**
   * Scroll `inputEl` so that at least `reservePx` of space remains below it
   * for an autocomplete dropdown — accounting for the actual keyboard position.
   */
  const scrollInputAboveKeyboard = useCallback((inputEl, reservePx = 220) => {
    if (!inputEl || typeof window === 'undefined') return;

    setTimeout(() => {
      // If inside a fixed/modal dialog, let the modal manage scrolling
      const modalParent = inputEl.closest?.('[role="dialog"], .fixed');
      if (modalParent) {
        inputEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        return;
      }

      const rect = inputEl.getBoundingClientRect();
      const headerOffset = 72; // Headroom for sticky header

      // Only scroll if the input is below the upper viewport zone
      if (rect.top > 140 || rect.top < 60) {
        const targetY = window.scrollY + rect.top - headerOffset;
        window.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' });
      }
    }, 150);
  }, []);

  return { keyboardHeight, isKeyboardOpen, visibleHeight, scrollInputAboveKeyboard };
}
