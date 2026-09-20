import { focusWhenReady, scrollIntoView } from './focusControl';

describe('scrollIntoView', () => {
  it('scrolls the element with the options it was given', () => {
    const element = { scrollIntoView: jest.fn() } as unknown as Element;

    scrollIntoView(element, { behavior: 'auto', block: 'center' });

    expect(element.scrollIntoView).toHaveBeenCalledWith({ behavior: 'auto', block: 'center' });
  });

  it('does nothing when there is no element', () => {
    expect(() => scrollIntoView(null, { behavior: 'auto' })).not.toThrow();
  });

  it('does nothing when the element cannot scroll', () => {
    // jsdom does not implement scrollIntoView, so an unguarded call is a thrown TypeError.
    expect(() => scrollIntoView({} as Element, { behavior: 'auto' })).not.toThrow();
  });
});

describe('focusWhenReady', () => {
  let rafCallbacks: FrameRequestCallback[] = [];

  beforeEach(() => {
    rafCallbacks = [];
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation((cb: FrameRequestCallback) => {
      rafCallbacks.push(cb);
      return rafCallbacks.length;
    });
    jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const flushFrames = (count: number) => {
    for (let i = 0; i < count; i++) {
      const pending = rafCallbacks;
      rafCallbacks = [];
      pending.forEach((cb) => cb(0));
    }
  };

  const buildGoaElement = (shadowInput: HTMLElement | null) =>
    ({
      tagName: 'GOA-INPUT',
      focus: jest.fn(),
      shadowRoot: { querySelector: () => shadowInput },
    } as unknown as Element);

  it('focuses a plain input immediately without waiting a frame', () => {
    const input = document.createElement('input');
    jest.spyOn(input, 'focus');

    focusWhenReady(input);

    expect(input.focus).toHaveBeenCalled();
    expect(window.requestAnimationFrame).not.toHaveBeenCalled();
  });

  it('focuses the input inside a GoA component shadow root', () => {
    const shadowInput = document.createElement('input');
    jest.spyOn(shadowInput, 'focus');
    const element = buildGoaElement(shadowInput);

    focusWhenReady(element);

    expect(shadowInput.focus).toHaveBeenCalled();
    expect((element as unknown as { focused: boolean }).focused).toBe(true);
  });

  it('retries on the next frame while the shadow content is still rendering', () => {
    // GoA components are Svelte custom elements that populate their shadow root asynchronously,
    // so the real input does not exist on the first attempt.
    const shadowInput = document.createElement('input');
    jest.spyOn(shadowInput, 'focus');
    let rendered: HTMLElement | null = null;
    const element = {
      tagName: 'GOA-INPUT',
      focus: jest.fn(),
      shadowRoot: { querySelector: () => rendered },
    } as unknown as Element;

    focusWhenReady(element);
    expect(shadowInput.focus).not.toHaveBeenCalled();

    rendered = shadowInput;
    flushFrames(1);

    expect(shadowInput.focus).toHaveBeenCalled();
  });

  it('stops retrying once the element is focused', () => {
    const shadowInput = document.createElement('input');
    jest.spyOn(shadowInput, 'focus');
    let rendered: HTMLElement | null = null;
    const element = {
      tagName: 'GOA-INPUT',
      focus: jest.fn(),
      shadowRoot: { querySelector: () => rendered },
    } as unknown as Element;

    focusWhenReady(element);
    rendered = shadowInput;
    flushFrames(5);

    expect(shadowInput.focus).toHaveBeenCalledTimes(1);
  });

  it('gives up rather than retrying forever when the component never renders', () => {
    const element = buildGoaElement(null);

    focusWhenReady(element);
    flushFrames(30);

    expect(rafCallbacks).toHaveLength(0);
  });

  it('cancels a pending retry when cleaned up', () => {
    const shadowInput = document.createElement('input');
    jest.spyOn(shadowInput, 'focus');
    let rendered: HTMLElement | null = null;
    const element = {
      tagName: 'GOA-INPUT',
      focus: jest.fn(),
      shadowRoot: { querySelector: () => rendered },
    } as unknown as Element;

    const cleanup = focusWhenReady(element);
    cleanup();

    rendered = shadowInput;
    flushFrames(5);

    expect(shadowInput.focus).not.toHaveBeenCalled();
    expect(window.cancelAnimationFrame).toHaveBeenCalled();
  });
});
