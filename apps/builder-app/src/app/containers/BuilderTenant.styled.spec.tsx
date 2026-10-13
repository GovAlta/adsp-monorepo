import React from 'react';
import { renderToString } from 'react-dom/server';
import { ServerStyleSheet } from 'styled-components';
import { Page } from './BuilderTenant.styled';

const getCss = (collapsed: boolean) => {
  const sheet = new ServerStyleSheet();
  renderToString(sheet.collectStyles(<Page $previewFullWidth={collapsed} />));
  return sheet.getStyleTags();
};

describe('BuilderTenant styles', () => {
  it('can keep the preview gutter at the media query values when the edit pane is open', () => {
    const css = getCss(false);

    expect(css).toContain('@media (max-width: 1200px)');
    expect(css).not.toMatch(/(\.[\w-]+)\1\{[^}]*--builder-preview-right-gutter:0/);
  });

  // The nested media queries are emitted after the base declarations, so the collapsed override needs a doubled
  // selector (higher specificity) to hold below the 1200px breakpoint.
  it('can remove the preview gutter at every width when the edit pane is collapsed', () => {
    const css = getCss(true);

    expect(css).toMatch(/(\.[\w-]+)\1\{[^}]*--builder-preview-right-gutter:0/);
  });
});
