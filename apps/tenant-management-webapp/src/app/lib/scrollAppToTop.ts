// The admin content scrolls inside AppDiv (app.tsx), which is absolutely positioned with
// `overflow: auto`, rather than the document. window.scrollTo therefore does nothing here.
export const APP_SCROLL_CONTAINER_ID = 'app-scroll-container';

export const scrollAppToTop = (): void => {
  const container = document.getElementById(APP_SCROLL_CONTAINER_ID);
  if (container) {
    container.scrollTop = 0;
  }
};
