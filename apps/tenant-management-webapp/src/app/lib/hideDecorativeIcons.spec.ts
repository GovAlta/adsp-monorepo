import { hideDecorativeIcons } from './hideDecorativeIcons';

const buildHost = (testId: string): { host: HTMLElement; shadowRoot: ShadowRoot } => {
  const host = document.createElement('div');
  host.setAttribute('testid', testId);
  const shadowRoot = host.attachShadow({ mode: 'open' });
  document.body.appendChild(host);
  return { host, shadowRoot };
};

afterEach(() => {
  document.body.innerHTML = '';
});

it('hides goa-icon descendants already present in the matched host', () => {
  const { shadowRoot } = buildHost('add-subscriber');
  const icon = document.createElement('goa-icon');
  shadowRoot.appendChild(icon);

  hideDecorativeIcons('[testid="add-subscriber"]');

  expect(icon.getAttribute('aria-hidden')).toBe('true');
});

it('hides goa-icon descendants in every host matched by the selector', () => {
  const { shadowRoot: previous } = buildHost('recipient-page-previous');
  const { shadowRoot: next } = buildHost('recipient-page-next');
  const previousIcon = document.createElement('goa-icon');
  previous.appendChild(previousIcon);
  const nextIcon = document.createElement('goa-icon');
  next.appendChild(nextIcon);

  hideDecorativeIcons('[testid="recipient-page-previous"], [testid="recipient-page-next"]');

  expect(previousIcon.getAttribute('aria-hidden')).toBe('true');
  expect(nextIcon.getAttribute('aria-hidden')).toBe('true');
});

it('hides goa-icon descendants added after the initial call', async () => {
  const { shadowRoot } = buildHost('recipient-search-input');

  hideDecorativeIcons('[testid="recipient-search-input"]');

  const icon = document.createElement('goa-icon');
  shadowRoot.appendChild(icon);

  await new Promise((resolve) => setTimeout(resolve, 0));

  expect(icon.getAttribute('aria-hidden')).toBe('true');
});

it('stops watching once the returned cleanup runs', async () => {
  const { shadowRoot } = buildHost('recipient-page-next');

  const cleanup = hideDecorativeIcons('[testid="recipient-page-next"]');
  cleanup();

  const icon = document.createElement('goa-icon');
  shadowRoot.appendChild(icon);

  await new Promise((resolve) => setTimeout(resolve, 0));

  expect(icon.getAttribute('aria-hidden')).toBeNull();
});

it('is a no-op when no matching host exists', () => {
  expect(() => hideDecorativeIcons('[testid="missing-host"]')).not.toThrow();
});

it('is a no-op when a matched host has no shadow root', () => {
  const host = document.createElement('div');
  host.setAttribute('testid', 'plain-host');
  document.body.appendChild(host);

  expect(() => hideDecorativeIcons('[testid="plain-host"]')).not.toThrow();
});
