import { APP_SCROLL_CONTAINER_ID, scrollAppToTop } from './scrollAppToTop';

// jsdom has no layout, so a real element's scrollTop always reads back as 0.
// Back it with a stored value so the reset is actually observable.
const addScrollContainer = (startingScrollTop: number) => {
  const container = document.createElement('div');
  container.id = APP_SCROLL_CONTAINER_ID;
  let scrollTop = startingScrollTop;
  Object.defineProperty(container, 'scrollTop', {
    get: () => scrollTop,
    set: (value) => {
      scrollTop = value;
    },
    configurable: true,
  });
  document.body.appendChild(container);
  return container;
};

describe('scrollAppToTop', () => {
  afterEach(() => {
    document.getElementById(APP_SCROLL_CONTAINER_ID)?.remove();
  });

  it('resets the app scroll container to the top', () => {
    const container = addScrollContainer(1200);

    scrollAppToTop();

    expect(container.scrollTop).toBe(0);
  });

  it('leaves an already-topped container alone', () => {
    const container = addScrollContainer(0);

    scrollAppToTop();

    expect(container.scrollTop).toBe(0);
  });

  it('does nothing when the container is not mounted', () => {
    expect(() => scrollAppToTop()).not.toThrow();
  });

  it('ignores elements that are not the app scroll container', () => {
    const other = document.createElement('div');
    other.id = 'some-other-container';
    let scrollTop = 500;
    Object.defineProperty(other, 'scrollTop', {
      get: () => scrollTop,
      set: (value) => {
        scrollTop = value;
      },
      configurable: true,
    });
    document.body.appendChild(other);

    scrollAppToTop();

    expect(other.scrollTop).toBe(500);
    other.remove();
  });
});
