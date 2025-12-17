/**
 * Accessibility Utilities for Quantera Platform
 *
 * WCAG 2.1 AA Compliance Utilities:
 * - Focus management
 * - Screen reader announcements
 * - Keyboard navigation helpers
 * - Color contrast utilities
 * - ARIA helpers
 */

/**
 * Focus trap for modals and dialogs
 * Keeps focus within a container element
 */
export function createFocusTrap(container: HTMLElement): {
  activate: () => void;
  deactivate: () => void;
} {
  const focusableSelectors = [
    'button:not([disabled])',
    'a[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');

  let previouslyFocused: HTMLElement | null = null;

  function getFocusableElements(): HTMLElement[] {
    return Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors));
  }

  function handleKeyDown(event: KeyboardEvent): void {
    if (event.key !== 'Tab') return;

    const focusable = getFocusableElements();
    if (focusable.length === 0) return;

    const firstFocusable = focusable[0];
    const lastFocusable = focusable[focusable.length - 1];

    if (event.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstFocusable) {
        event.preventDefault();
        lastFocusable.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastFocusable) {
        event.preventDefault();
        firstFocusable.focus();
      }
    }
  }

  return {
    activate() {
      previouslyFocused = document.activeElement as HTMLElement;
      container.addEventListener('keydown', handleKeyDown);

      // Focus first focusable element
      const focusable = getFocusableElements();
      if (focusable.length > 0) {
        focusable[0].focus();
      }
    },
    deactivate() {
      container.removeEventListener('keydown', handleKeyDown);

      // Return focus to previously focused element
      if (previouslyFocused && previouslyFocused.focus) {
        previouslyFocused.focus();
      }
    },
  };
}

/**
 * Screen reader live region announcer
 * Creates announcements for screen readers
 */
class LiveAnnouncer {
  private politeRegion: HTMLElement | null = null;
  private assertiveRegion: HTMLElement | null = null;

  constructor() {
    if (typeof document !== 'undefined') {
      this.createRegions();
    }
  }

  private createRegions(): void {
    // Check if regions already exist
    this.politeRegion = document.getElementById('sr-polite');
    this.assertiveRegion = document.getElementById('sr-assertive');

    if (!this.politeRegion) {
      this.politeRegion = this.createRegion('polite', 'sr-polite');
    }

    if (!this.assertiveRegion) {
      this.assertiveRegion = this.createRegion('assertive', 'sr-assertive');
    }
  }

  private createRegion(politeness: 'polite' | 'assertive', id: string): HTMLElement {
    const region = document.createElement('div');
    region.id = id;
    region.setAttribute('role', 'status');
    region.setAttribute('aria-live', politeness);
    region.setAttribute('aria-atomic', 'true');
    region.className = 'sr-only';
    // Visually hidden but accessible to screen readers
    region.style.cssText = `
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    `;
    document.body.appendChild(region);
    return region;
  }

  /**
   * Announce a message to screen readers
   * @param message - The message to announce
   * @param priority - 'polite' waits for current speech, 'assertive' interrupts
   */
  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    const region = priority === 'assertive' ? this.assertiveRegion : this.politeRegion;
    if (!region) return;

    // Clear and set message (triggers announcement)
    region.textContent = '';
    // Use setTimeout to ensure the clear is processed first
    setTimeout(() => {
      region.textContent = message;
    }, 100);
  }

  /**
   * Clear all announcements
   */
  clear(): void {
    if (this.politeRegion) this.politeRegion.textContent = '';
    if (this.assertiveRegion) this.assertiveRegion.textContent = '';
  }
}

// Singleton instance
export const announcer = new LiveAnnouncer();

/**
 * Announce a message to screen readers
 */
export function announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  announcer.announce(message, priority);
}

/**
 * Check if an element is visible and not hidden
 */
export function isElementVisible(element: HTMLElement): boolean {
  if (!element) return false;

  const style = window.getComputedStyle(element);
  return (
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    style.opacity !== '0' &&
    element.offsetWidth > 0 &&
    element.offsetHeight > 0
  );
}

/**
 * Get all focusable elements within a container
 */
export function getFocusableElements(container: HTMLElement = document.body): HTMLElement[] {
  const focusableSelectors = [
    'button:not([disabled]):not([aria-hidden="true"])',
    'a[href]:not([aria-hidden="true"])',
    'input:not([disabled]):not([type="hidden"]):not([aria-hidden="true"])',
    'select:not([disabled]):not([aria-hidden="true"])',
    'textarea:not([disabled]):not([aria-hidden="true"])',
    '[tabindex]:not([tabindex="-1"]):not([aria-hidden="true"])',
  ].join(', ');

  return Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors)).filter(isElementVisible);
}

/**
 * Move focus to an element with optional scroll behavior
 */
export function moveFocus(
  element: HTMLElement | null,
  options: { preventScroll?: boolean; select?: boolean } = {}
): void {
  if (!element) return;

  const { preventScroll = false, select = false } = options;

  element.focus({ preventScroll });

  if (select && (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)) {
    element.select();
  }
}

/**
 * Skip to main content functionality
 */
export function skipToMain(): void {
  const main = document.querySelector<HTMLElement>('main, [role="main"], #main-content');
  if (main) {
    main.setAttribute('tabindex', '-1');
    main.focus();
    main.removeAttribute('tabindex');
  }
}

/**
 * Color contrast ratio calculation (WCAG 2.1)
 * Returns the contrast ratio between two colors
 */
export function getContrastRatio(color1: string, color2: string): number {
  const luminance1 = getRelativeLuminance(color1);
  const luminance2 = getRelativeLuminance(color2);

  const lighter = Math.max(luminance1, luminance2);
  const darker = Math.min(luminance1, luminance2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Calculate relative luminance of a color
 */
function getRelativeLuminance(color: string): number {
  const rgb = hexToRgb(color);
  if (!rgb) return 0;

  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((channel) => {
    const sRGB = channel / 255;
    return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Check if contrast meets WCAG 2.1 AA requirements
 */
export function meetsContrastRequirement(
  foreground: string,
  background: string,
  isLargeText: boolean = false
): boolean {
  const ratio = getContrastRatio(foreground, background);
  // WCAG 2.1 AA: 4.5:1 for normal text, 3:1 for large text
  const requirement = isLargeText ? 3 : 4.5;
  return ratio >= requirement;
}

/**
 * Generate unique IDs for ARIA relationships
 */
let idCounter = 0;
export function generateAriaId(prefix: string = 'aria'): string {
  idCounter += 1;
  return `${prefix}-${idCounter}-${Date.now().toString(36)}`;
}

/**
 * Keyboard navigation helper
 * Handles arrow key navigation within a group of elements
 */
export function handleArrowNavigation(
  event: KeyboardEvent,
  elements: HTMLElement[],
  options: {
    orientation?: 'horizontal' | 'vertical' | 'both';
    loop?: boolean;
  } = {}
): void {
  const { orientation = 'both', loop = true } = options;

  const currentIndex = elements.findIndex((el) => el === document.activeElement);
  if (currentIndex === -1) return;

  let nextIndex: number | null = null;

  switch (event.key) {
    case 'ArrowUp':
      if (orientation === 'vertical' || orientation === 'both') {
        event.preventDefault();
        nextIndex = currentIndex - 1;
      }
      break;
    case 'ArrowDown':
      if (orientation === 'vertical' || orientation === 'both') {
        event.preventDefault();
        nextIndex = currentIndex + 1;
      }
      break;
    case 'ArrowLeft':
      if (orientation === 'horizontal' || orientation === 'both') {
        event.preventDefault();
        nextIndex = currentIndex - 1;
      }
      break;
    case 'ArrowRight':
      if (orientation === 'horizontal' || orientation === 'both') {
        event.preventDefault();
        nextIndex = currentIndex + 1;
      }
      break;
    case 'Home':
      event.preventDefault();
      nextIndex = 0;
      break;
    case 'End':
      event.preventDefault();
      nextIndex = elements.length - 1;
      break;
  }

  if (nextIndex !== null) {
    if (loop) {
      nextIndex = (nextIndex + elements.length) % elements.length;
    } else {
      nextIndex = Math.max(0, Math.min(nextIndex, elements.length - 1));
    }
    elements[nextIndex].focus();
  }
}

/**
 * Escape key handler for closing modals/dropdowns
 */
export function handleEscapeKey(event: KeyboardEvent, onEscape: () => void): void {
  if (event.key === 'Escape') {
    event.preventDefault();
    onEscape();
  }
}

/**
 * Format numbers for screen readers
 * Makes large numbers more understandable
 */
export function formatNumberForScreenReader(value: number): string {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)} billion`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)} million`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)} thousand`;
  }
  return value.toString();
}

/**
 * Format currency for screen readers
 */
export function formatCurrencyForScreenReader(value: number, currency: string = 'USD'): string {
  const formatted = formatNumberForScreenReader(value);
  const currencyNames: Record<string, string> = {
    USD: 'US dollars',
    EUR: 'euros',
    GBP: 'British pounds',
    USDC: 'USDC',
    ETH: 'Ether',
  };
  return `${formatted} ${currencyNames[currency] || currency}`;
}

/**
 * Format percentage for screen readers
 */
export function formatPercentageForScreenReader(value: number): string {
  const sign = value >= 0 ? 'positive' : 'negative';
  return `${sign} ${Math.abs(value).toFixed(2)} percent`;
}
