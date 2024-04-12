import { mapToVisibleStep } from './stepNavigation';

describe('category stepper', () => {
  it('will not change the step if all categories are visible ', () => {
    const catLabels = ['cat1', 'cat2', 'cat3', 'cat4'];
    const visibleLabels = ['cat1', 'cat2', 'cat3', 'cat4'];
    expect(mapToVisibleStep(3, catLabels, visibleLabels)).toBe(3);
  });

  it('will skip over hidden middle step', () => {
    const catLabels = ['cat1', 'cat2', 'cat3', 'cat4'];
    const visibleLabels = ['cat1', 'cat3', 'cat4'];
    expect(mapToVisibleStep(1, catLabels, visibleLabels)).toBe(1);
    expect(mapToVisibleStep(3, catLabels, visibleLabels)).toBe(2);
    expect(mapToVisibleStep(4, catLabels, visibleLabels)).toBe(3);
  });

  it('will skip over hidden first step', () => {
    const catLabels = ['cat1', 'cat2', 'cat3', 'cat4'];
    const visibleLabels = ['cat2', 'cat3', 'cat4'];
    expect(mapToVisibleStep(2, catLabels, visibleLabels)).toBe(1);
    expect(mapToVisibleStep(3, catLabels, visibleLabels)).toBe(2);
    expect(mapToVisibleStep(4, catLabels, visibleLabels)).toBe(3);
  });

  it('will ignore hidden last step', () => {
    const catLabels = ['cat1', 'cat2', 'cat3', 'cat4'];
    const visibleLabels = ['cat1', 'cat2', 'cat3'];
    expect(mapToVisibleStep(1, catLabels, visibleLabels)).toBe(1);
    expect(mapToVisibleStep(2, catLabels, visibleLabels)).toBe(2);
    expect(mapToVisibleStep(3, catLabels, visibleLabels)).toBe(3);
  });

  it('will handle multiple hidden steps', () => {
    const catLabels = ['cat1', 'cat2', 'cat3', 'cat4'];
    const visibleLabels = ['cat1', 'cat4'];
    expect(mapToVisibleStep(1, catLabels, visibleLabels)).toBe(1);
    expect(mapToVisibleStep(4, catLabels, visibleLabels)).toBe(2);
  });

  it('will map steps too large to the last visible one', () => {
    const catLabels = ['cat1', 'cat2', 'cat3', 'cat4'];
    const visibleLabels = ['cat1', 'cat4'];
    expect(mapToVisibleStep(5, catLabels, visibleLabels)).toBe(2);
  });

  it('will map steps too small to the 1st visible one', () => {
    const catLabels = ['cat1', 'cat2', 'cat3', 'cat4'];
    const visibleLabels = ['cat1', 'cat4'];
    expect(mapToVisibleStep(-1, catLabels, visibleLabels)).toBe(1);
  });

  it('will map hidden steps to the 1st step', () => {
    const catLabels = ['cat1', 'cat2', 'cat3', 'cat4'];
    const visibleLabels = ['cat1', 'cat4'];
    expect(mapToVisibleStep(2, catLabels, visibleLabels)).toBe(1);
  });

  it('handle no visible steps', () => {
    const catLabels = ['cat1', 'cat2', 'cat3', 'cat4'];
    const visibleLabels: Array<string> = [];
    expect(mapToVisibleStep(2, catLabels, visibleLabels)).toBe(0);
  });
});
