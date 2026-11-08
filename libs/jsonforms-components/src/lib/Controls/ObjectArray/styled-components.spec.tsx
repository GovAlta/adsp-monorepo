import { render } from '@testing-library/react';
import { FlexForm, FlexTabsWithMargin, RowFlex } from './styled-components';

const renderedCss = () =>
  Array.from(document.querySelectorAll('style'))
    .map((style) => style.textContent)
    .join('');

describe('list-with-details layout', () => {
  it('stacks the panes and releases their desktop sizing on narrow screens', () => {
    render(
      <RowFlex>
        <FlexTabsWithMargin />
        <FlexForm />
      </RowFlex>,
    );

    const css = renderedCss().replace(/\s/g, '');

    expect(css).toContain('@media(max-width:639px){');
    expect(css).toContain('flex-direction:column');
    expect(css).toContain('height:auto!important');
    expect(css).toContain('min-width:0');
  });
});
