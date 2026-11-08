import { spaceToScrollToTop } from './scrollSpace';

describe('spaceToScrollToTop', () => {
  it('adds the space needed for a section near the end to reach the top of the view', () => {
    expect(spaceToScrollToTop({ viewHeight: 800, contentHeight: 2000, sectionTop: 1700 })).toBe(500);
  });

  it('adds nothing when enough content follows the section', () => {
    expect(spaceToScrollToTop({ viewHeight: 800, contentHeight: 3000, sectionTop: 1000 })).toBe(0);
  });

  it('adds nothing when the section is exactly one view from the end', () => {
    expect(spaceToScrollToTop({ viewHeight: 800, contentHeight: 1800, sectionTop: 1000 })).toBe(0);
  });
});
