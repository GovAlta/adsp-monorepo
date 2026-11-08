// Matches the scroll container in app.tsx; the global styles stop the document itself scrolling.
const SCROLL_CONTAINER_ID = 'app-scroll-container';

interface ScrollLayout {
  viewHeight: number;
  contentHeight: number;
  sectionTop: number;
}

// Space to add after the content so the section can scroll up to the top of the view.
export const spaceToScrollToTop = ({ viewHeight, contentHeight, sectionTop }: ScrollLayout): number =>
  Math.max(0, viewHeight - (contentHeight - sectionTop));

export const measureScrollLayout = (section: Element, currentSpace: number): ScrollLayout => {
  const container = document.getElementById(SCROLL_CONTAINER_ID);
  if (container) {
    return {
      viewHeight: container.clientHeight,
      contentHeight: container.scrollHeight - currentSpace,
      sectionTop: section.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop,
    };
  }
  return {
    viewHeight: window.innerHeight,
    contentHeight: document.documentElement.scrollHeight - currentSpace,
    sectionTop: section.getBoundingClientRect().top + window.scrollY,
  };
};
