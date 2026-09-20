/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * jsdom implements neither of these, and scrollIntoView is missing on real elements often enough
 * (detached nodes, test doubles) that calling it unguarded turns a scroll into a thrown error.
 */
export const scrollIntoView = (element: Element | null | undefined, options: ScrollIntoViewOptions): void => {
  if (element && typeof element.scrollIntoView === 'function') {
    element.scrollIntoView(options);
  }
};

const isGoaElement = (element: Element): boolean => element.tagName?.toLowerCase().startsWith('goa-') === true;

/**
 * Move focus into a control, reaching through the shadow root when the control is a GoA web
 * component. Returns false when the component has not rendered its shadow content yet.
 */
const tryFocus = (element: Element): boolean => {
  if (!isGoaElement(element)) {
    if (element instanceof HTMLElement) {
      element.focus();
      return true;
    }
    return false;
  }

  (element as any).focused = true;
  if (typeof (element as any).focus === 'function') {
    (element as any).focus();
  }

  const actualInput = (element as any).shadowRoot?.querySelector('input, textarea, select');
  if (actualInput instanceof HTMLElement) {
    actualInput.focus();
    return true;
  }

  return false;
};

// GoA components are Svelte custom elements that populate their shadow root asynchronously, so the
// real input may not exist on the first attempt. A few frames covers the gap; beyond that the
// component is not going to render and retrying only keeps a callback alive.
const MAX_FOCUS_FRAMES = 10;

/**
 * Focus a control as soon as it is focusable, retrying across frames while its shadow content is
 * still being rendered. Returns a cleanup function that cancels any pending retry.
 *
 * This replaces a fixed 300ms timeout. The timeout existed to wait out a smooth scroll animation,
 * and it made the Change button on the review summary feel broken for a third of a second even
 * when the field was ready immediately.
 */
export const focusWhenReady = (element: Element): (() => void) => {
  let frame: number | undefined;
  let cancelled = false;

  const schedule = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : undefined;

  const attempt = (remaining: number): void => {
    if (cancelled || tryFocus(element) || remaining <= 0 || !schedule) {
      return;
    }
    frame = schedule(() => attempt(remaining - 1));
  };

  attempt(MAX_FOCUS_FRAMES);

  return () => {
    cancelled = true;
    if (frame !== undefined && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(frame);
    }
  };
};
