import { render } from '@testing-library/react';
import { FlexForm, FlexTabs, FlexTabsWithMargin, RowFlex, UpdateListContainer } from './styled-components';

const NARROW_MEDIA = '@media(max-width:639px){';

const renderedCss = () =>
  Array.from(document.querySelectorAll('style'))
    .map((style) => style.textContent)
    .join('')
    .replace(/\s/g, '');

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Splits the generated CSS for one element's class into its desktop rule and its narrow-screen rule.
const rulesFor = (element: Element) => {
  const className = escapeRegExp(Array.from(element.classList).pop() ?? '');
  const css = renderedCss();
  const media = escapeRegExp(NARROW_MEDIA);
  const desktop = css.match(new RegExp(`(?:^|})\\.${className}\\{([^}]*)\\}`))?.[1] ?? '';
  const narrow = css.match(new RegExp(`${media}\\.${className}\\{([^}]*)\\}`))?.[1] ?? '';
  return { desktop, narrow };
};

describe('list-with-details layout', () => {
  it('stacks the panes and releases their desktop sizing on narrow screens', () => {
    render(
      <RowFlex>
        <FlexTabsWithMargin />
        <FlexForm />
      </RowFlex>,
    );

    const css = renderedCss();

    expect(css).toContain(NARROW_MEDIA);
    expect(css).toContain('flex-direction:column');
    expect(css).toContain('height:auto!important');
    expect(css).toContain('min-width:0');
  });

  it('keeps the side by side desktop layout outside the narrow-screen media query', () => {
    const { getByTestId } = render(
      <RowFlex data-testid="row">
        <FlexTabsWithMargin data-testid="tabs" />
        <FlexForm data-testid="form" />
      </RowFlex>,
    );

    const row = rulesFor(getByTestId('row'));
    expect(row.desktop).toContain('display:flex');
    expect(row.desktop).toContain('align-items:flex-start');
    expect(row.desktop).not.toContain('flex-direction:column');
    expect(row.narrow).toContain('flex-direction:column');

    const tabs = rulesFor(getByTestId('tabs'));
    expect(tabs.desktop).toContain('flex:1');
    expect(tabs.desktop).toContain('margin-right:1.5rem');
    expect(tabs.desktop).not.toContain('height:auto');
    expect(tabs.narrow).toContain('flex:none');

    const form = rulesFor(getByTestId('form'));
    expect(form.desktop).toContain('flex:3');
    expect(form.desktop).toContain('flex-shrink:0');
    expect(form.desktop).not.toContain('flex:none');
    expect(form.narrow).toContain('flex:none');
  });

  it('keeps the desktop list and edit page sizing outside the narrow-screen media query', () => {
    const { getByTestId } = render(
      <RowFlex>
        <FlexTabs data-testid="list" />
        <UpdateListContainer data-testid="edit" />
      </RowFlex>,
    );

    const list = rulesFor(getByTestId('list'));
    expect(list.desktop).toContain('flex:1');
    expect(list.narrow).toContain('flex:none');

    const edit = rulesFor(getByTestId('edit'));
    expect(edit.desktop).toContain('width:100%');
    expect(edit.desktop).toContain('padding:var(--goa-space-xl)');
    expect(edit.narrow).toContain('padding:var(--goa-space-m)');
  });
});
