/**
 * Accessibility Hooks for Quantera Platform
 *
 * React hooks for WCAG 2.1 AA compliance:
 * - useFocusTrap: Modal focus trapping
 * - useAnnounce: Screen reader announcements
 * - useArrowNavigation: Keyboard navigation
 * - useReducedMotion: Respects user preferences
 * - useFocusVisible: Focus visibility management
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import {
  createFocusTrap,
  announce,
  handleArrowNavigation,
  getFocusableElements,
} from '../utils/accessibility';

/**
 * Hook for trapping focus within a container (for modals, dialogs)
 */
export function useFocusTrap(isActive: boolean = true): React.RefObject<HTMLDivElement> {
  const containerRef = useRef<HTMLDivElement>(null);
  const trapRef = useRef<ReturnType<typeof createFocusTrap> | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    if (isActive) {
      trapRef.current = createFocusTrap(containerRef.current);
      trapRef.current.activate();
    }

    return () => {
      if (trapRef.current) {
        trapRef.current.deactivate();
        trapRef.current = null;
      }
    };
  }, [isActive]);

  return containerRef;
}

/**
 * Hook for announcing messages to screen readers
 */
export function useAnnounce(): {
  announcePolite: (message: string) => void;
  announceAssertive: (message: string) => void;
} {
  const announcePolite = useCallback((message: string) => {
    announce(message, 'polite');
  }, []);

  const announceAssertive = useCallback((message: string) => {
    announce(message, 'assertive');
  }, []);

  return { announcePolite, announceAssertive };
}

/**
 * Hook for arrow key navigation within a group of elements
 */
export function useArrowNavigation(
  containerRef: React.RefObject<HTMLElement>,
  options: {
    selector?: string;
    orientation?: 'horizontal' | 'vertical' | 'both';
    loop?: boolean;
  } = {}
): void {
  const { selector, orientation = 'both', loop = true } = options;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const elements = selector
        ? Array.from(container.querySelectorAll<HTMLElement>(selector))
        : getFocusableElements(container);

      handleArrowNavigation(event, elements, { orientation, loop });
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [containerRef, selector, orientation, loop]);
}

/**
 * Hook for detecting user's reduced motion preference
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}

/**
 * Hook for managing focus visibility (keyboard vs mouse)
 * Shows focus ring only for keyboard navigation
 */
export function useFocusVisible(): {
  isFocusVisible: boolean;
  onFocus: () => void;
  onBlur: () => void;
  onMouseDown: () => void;
} {
  const [isFocusVisible, setIsFocusVisible] = useState(false);
  const hadKeyboardEventRef = useRef(false);

  useEffect(() => {
    const handleKeyDown = () => {
      hadKeyboardEventRef.current = true;
    };

    const handlePointerDown = () => {
      hadKeyboardEventRef.current = false;
    };

    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('mousedown', handlePointerDown, true);
    document.addEventListener('pointerdown', handlePointerDown, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('mousedown', handlePointerDown, true);
      document.removeEventListener('pointerdown', handlePointerDown, true);
    };
  }, []);

  const onFocus = useCallback(() => {
    setIsFocusVisible(hadKeyboardEventRef.current);
  }, []);

  const onBlur = useCallback(() => {
    setIsFocusVisible(false);
  }, []);

  const onMouseDown = useCallback(() => {
    hadKeyboardEventRef.current = false;
  }, []);

  return { isFocusVisible, onFocus, onBlur, onMouseDown };
}

/**
 * Hook for managing focus on mount
 * Automatically focuses an element when a component mounts
 */
export function useFocusOnMount<T extends HTMLElement>(
  shouldFocus: boolean = true
): React.RefObject<T> {
  const elementRef = useRef<T>(null);

  useEffect(() => {
    if (shouldFocus && elementRef.current) {
      // Small delay to ensure element is rendered
      const timeoutId = setTimeout(() => {
        elementRef.current?.focus();
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [shouldFocus]);

  return elementRef;
}

/**
 * Hook for managing roving tabindex
 * Only one element in a group is tabbable at a time
 */
export function useRovingTabIndex(
  items: string[],
  initialIndex: number = 0
): {
  activeIndex: number;
  setActiveIndex: (index: number) => void;
  getTabIndex: (index: number) => 0 | -1;
  handleKeyDown: (event: React.KeyboardEvent, index: number) => void;
} {
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  const getTabIndex = useCallback(
    (index: number): 0 | -1 => {
      return index === activeIndex ? 0 : -1;
    },
    [activeIndex]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent, index: number) => {
      let newIndex = index;

      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          event.preventDefault();
          newIndex = (index + 1) % items.length;
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          event.preventDefault();
          newIndex = (index - 1 + items.length) % items.length;
          break;
        case 'Home':
          event.preventDefault();
          newIndex = 0;
          break;
        case 'End':
          event.preventDefault();
          newIndex = items.length - 1;
          break;
        default:
          return;
      }

      setActiveIndex(newIndex);
    },
    [items.length]
  );

  return { activeIndex, setActiveIndex, getTabIndex, handleKeyDown };
}

/**
 * Hook for escape key handling
 */
export function useEscapeKey(onEscape: () => void, isActive: boolean = true): void {
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onEscape();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onEscape, isActive]);
}

/**
 * Hook for click outside detection
 * Useful for dropdowns and modals
 */
export function useClickOutside<T extends HTMLElement>(
  onClickOutside: () => void,
  isActive: boolean = true
): React.RefObject<T> {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!isActive) return;

    const handleClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClickOutside();
      }
    };

    // Use mousedown for better UX (responds immediately)
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClickOutside, isActive]);

  return ref;
}

/**
 * Hook for managing aria-expanded state
 */
export function useAriaExpanded(initialExpanded: boolean = false): {
  isExpanded: boolean;
  toggle: () => void;
  expand: () => void;
  collapse: () => void;
  ariaProps: {
    'aria-expanded': boolean;
  };
} {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);

  const toggle = useCallback(() => setIsExpanded((prev) => !prev), []);
  const expand = useCallback(() => setIsExpanded(true), []);
  const collapse = useCallback(() => setIsExpanded(false), []);

  return {
    isExpanded,
    toggle,
    expand,
    collapse,
    ariaProps: {
      'aria-expanded': isExpanded,
    },
  };
}

/**
 * Hook for generating unique IDs for ARIA relationships
 */
export function useAriaIds(prefix: string = 'aria'): {
  labelId: string;
  describedById: string;
  controlsId: string;
  errorId: string;
} {
  const idRef = useRef<string | null>(null);

  if (!idRef.current) {
    idRef.current = `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  }

  return {
    labelId: `${idRef.current}-label`,
    describedById: `${idRef.current}-description`,
    controlsId: `${idRef.current}-controls`,
    errorId: `${idRef.current}-error`,
  };
}
