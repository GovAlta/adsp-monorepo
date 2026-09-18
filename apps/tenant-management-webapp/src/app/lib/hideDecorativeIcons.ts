// A GoA button/input/icon-button/table-sort-header renders its icon as a nested <goa-icon> custom
// element, which in turn renders a role="img" div with an empty aria-label in its own shadow root.
// That inner div is still what axe evaluates, even when the outer control already has its own
// accessible name (its text content, or an aria-label prop on the host), so axe flags the icon as
// an image with no alternative text. Marking the <goa-icon> element itself aria-hidden removes that
// whole nested shadow tree from the accessibility tree without needing to reach inside it. The icon
// is painted asynchronously into the host's shadow DOM once the custom element upgrades, and can be
// re-painted later (e.g. an input's trailing icon toggling on and off), so this keeps watching
// rather than hiding it once.
//
// hostSelector matches the host custom element(s) directly, e.g. `[testid="add-subscriber"]` (GoA
// custom elements render the testId prop as a bare `testid` attribute, not `data-testid`) or
// `goa-table-sort-header` to cover every column header at once.
export const hideDecorativeIcons = (hostSelector: string): (() => void) => {
  const hosts = Array.from(document.querySelectorAll(hostSelector));

  const cleanups = hosts.map((host) => {
    const shadowRoot = (host as HTMLElement).shadowRoot;
    if (!shadowRoot) {
      return () => {};
    }

    const hide = () => {
      shadowRoot.querySelectorAll('goa-icon').forEach((icon) => icon.setAttribute('aria-hidden', 'true'));
    };

    hide();
    const observer = new MutationObserver(hide);
    observer.observe(shadowRoot, { childList: true, subtree: true });

    return () => observer.disconnect();
  });

  return () => cleanups.forEach((cleanup) => cleanup());
};
