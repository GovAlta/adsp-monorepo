import React, { useState } from 'react';
import styled from 'styled-components';
import { GoabContainer, GoabDetails, GoabRadioGroup, GoabRadioItem, GoabText } from '@abgov/react-components';
import {
  AdspThemes,
  toCssVariables,
  type AdspComponentThemeOverrides,
  type AdspTheme,
  type AdspThemeOverrides,
} from '@abgov/adsp-components-core';
import { AdspBadge, AdspButton, AdspCard, AdspThemeProvider } from '@abgov/adsp-components-react';
import { ServiceContainer } from '../../styled-components';
import { highContrastDemoTheme } from './highContrastDemoTheme';

const SELECTABLE_THEMES: Record<string, { label: string; theme: AdspTheme }> = {
  [AdspThemes.standard.name]: { label: 'Standard', theme: AdspThemes.standard },
  [highContrastDemoTheme.name]: { label: 'High contrast (sandbox demo)', theme: highContrastDemoTheme },
};

const SUCCESS_PRIMARY_BUTTONS: AdspThemeOverrides = {
  components: {
    button: {
      primary: {
        background: 'var(--adsp-color-status-success)',
        borderColor: 'var(--adsp-color-status-success)',
        hoverBackground: '#004f35',
        hoverBorderColor: '#004f35',
      },
    },
  },
};

const HIGHLIGHTED_CARD: AdspComponentThemeOverrides<'card'> = {
  background: 'var(--adsp-color-surface-default)',
  borderColor: 'var(--adsp-color-status-info)',
};

const PILL_BUTTON: AdspComponentThemeOverrides<'button'> = {
  borderRadius: 'var(--adsp-border-radius-round)',
};

const APPLICATION_SETUP = `import '@abgov/design-tokens/dist/tokens.css';
import '@abgov/adsp-components-core/adsp-components.css';
import { AdspThemes } from '@abgov/adsp-components-core';
import { AdspThemeProvider } from '@abgov/adsp-components-react';

<AdspThemeProvider theme={AdspThemes.standard}>
  <App />
</AdspThemeProvider>`;

const CUSTOMIZATION_LEVELS = `// Theme level: derive a theme once and select it
const brandTheme = createAdspTheme(AdspThemes.standard, {
  components: { button: { borderRadius: '0' } },
});
<AdspThemeProvider theme={brandTheme}>...</AdspThemeProvider>

// Section level: override part of the theme in scope, for this subtree only
<AdspThemeProvider overrides={{ components: { card: { padding: 'var(--adsp-spacing-m)' } } }}>
  ...
</AdspThemeProvider>

// Component level: one instance only
<AdspButton themeOverrides={{ borderRadius: 'var(--adsp-border-radius-round)' }}>Save</AdspButton>`;

const ShowcaseRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--goa-space-s);
  margin-top: var(--goa-space-m);
`;

const formatCssVariables = (theme: AdspTheme) =>
  Object.entries(toCssVariables(theme))
    .map(([name, value]) => `${name}: ${value};`)
    .join('\n');

const ComponentShowcase = ({ testId }: { testId: string }) => (
  <AdspCard heading="Application review" testId={testId}>
    Dummy ADSP components, styled only by the selected theme.
    <ShowcaseRow>
      <AdspBadge type="success">Approved</AdspBadge>
      <AdspBadge type="info">In review</AdspBadge>
      <AdspBadge type="important">Action required</AdspBadge>
      <AdspBadge type="emergency">Rejected</AdspBadge>
    </ShowcaseRow>
    <ShowcaseRow>
      <AdspButton>Approve</AdspButton>
      <AdspButton variant="secondary">Request changes</AdspButton>
      <AdspButton disabled>Withdraw</AdspButton>
    </ShowcaseRow>
  </AdspCard>
);

export const AdspThemingExample = () => {
  const [themeName, setThemeName] = useState(AdspThemes.standard.name);
  const { theme: selectedTheme } = SELECTABLE_THEMES[themeName];

  return (
    <ServiceContainer>
      <GoabContainer
        accent="thick"
        type="non-interactive"
        width="full"
        testId="adsp-theming-container"
        heading="ADSP theming"
        mb="none"
      >
        <GoabText size="body-m" mt="none">
          These components come from @abgov/adsp-components-react. They read the selected theme through --adsp-* CSS
          custom properties set on their own root elements, so the GoA components on this page are unaffected.
        </GoabText>

        <GoabText size="heading-s">1. Theme level</GoabText>
        <GoabText size="body-m">Select a whole theme. Every ADSP component below follows it.</GoabText>
        <GoabRadioGroup
          name="adsp-theme"
          value={themeName}
          orientation="horizontal"
          testId="adsp-theme-selector"
          onChange={({ value }) => setThemeName(value)}
        >
          {Object.entries(SELECTABLE_THEMES).map(([name, { label }]) => (
            <GoabRadioItem key={name} value={name} label={label} />
          ))}
        </GoabRadioGroup>
        <AdspThemeProvider theme={selectedTheme}>
          <ComponentShowcase testId="selected-theme-card" />

          <GoabText size="heading-s">2. Section level</GoabText>
          <GoabText size="body-m">
            A nested provider with overrides turns primary buttons green in this section only, on top of the selected
            theme.
          </GoabText>
          <AdspThemeProvider overrides={SUCCESS_PRIMARY_BUTTONS}>
            <ComponentShowcase testId="section-override-card" />
          </AdspThemeProvider>

          <GoabText size="heading-s">3. Component level</GoabText>
          <GoabText size="body-m">themeOverrides on a single component changes that instance only.</GoabText>
          <AdspCard heading="Highlighted card" themeOverrides={HIGHLIGHTED_CARD} testId="instance-override-card">
            Only this card and the pill button have instance overrides.
            <ShowcaseRow>
              <AdspButton themeOverrides={PILL_BUTTON} testId="pill-button">
                Pill button
              </AdspButton>
              <AdspButton testId="regular-button">Regular button</AdspButton>
            </ShowcaseRow>
          </AdspCard>
        </AdspThemeProvider>

        <GoabText size="heading-s">No provider</GoabText>
        <GoabText size="body-m">Components rendered outside an AdspThemeProvider receive AdspThemes.standard.</GoabText>
        <ComponentShowcase testId="default-theme-card" />

        <GoabDetails heading="Application setup" mt="l">
          <pre>{APPLICATION_SETUP}</pre>
        </GoabDetails>
        <GoabDetails heading="Customization levels">
          <pre>{CUSTOMIZATION_LEVELS}</pre>
        </GoabDetails>
        <GoabDetails heading="CSS custom properties of the selected theme">
          <pre data-testid="selected-theme-css-variables">{formatCssVariables(selectedTheme)}</pre>
        </GoabDetails>
      </GoabContainer>
    </ServiceContainer>
  );
};
