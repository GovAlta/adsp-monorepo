import React, { useState } from 'react';
import styled from 'styled-components';
import {
  GoabContainer,
  GoabDetails,
  GoabRadioGroup,
  GoabRadioItem,
  GoabTable,
  GoabText,
} from '@abgov/react-components';
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

const SECTION_PRIMARY_BACKGROUND = 'var(--adsp-color-status-success)';
const COMPONENT_PRIMARY_BACKGROUND = '#6a1b9a';

const SUCCESS_PRIMARY_BUTTONS: AdspThemeOverrides = {
  components: {
    button: {
      primary: {
        background: SECTION_PRIMARY_BACKGROUND,
        borderColor: SECTION_PRIMARY_BACKGROUND,
        hoverBackground: '#004f35',
        hoverBorderColor: '#004f35',
      },
    },
  },
};

const PURPLE_PRIMARY_BUTTON: AdspComponentThemeOverrides<'button'> = {
  primary: {
    background: COMPONENT_PRIMARY_BACKGROUND,
    borderColor: COMPONENT_PRIMARY_BACKGROUND,
    hoverBackground: '#4a148c',
    hoverBorderColor: '#4a148c',
  },
};

const HIGHLIGHTED_CARD: AdspComponentThemeOverrides<'card'> = {
  background: 'var(--adsp-color-surface-default)',
  borderColor: 'var(--adsp-color-status-info)',
};

const PILL_BUTTON: AdspComponentThemeOverrides<'button'> = {
  borderRadius: 'var(--adsp-border-radius-round)',
};

const SQUARE_BADGE: AdspComponentThemeOverrides<'badge'> = {
  borderRadius: '0',
};

interface ShowcaseOverrides {
  card?: AdspComponentThemeOverrides<'card'>;
  approvedBadge?: AdspComponentThemeOverrides<'badge'>;
  approveButton?: AdspComponentThemeOverrides<'button'>;
  requestChangesButton?: AdspComponentThemeOverrides<'button'>;
}

const COMPONENT_LEVEL_OVERRIDES: ShowcaseOverrides = {
  card: HIGHLIGHTED_CARD,
  approvedBadge: SQUARE_BADGE,
  approveButton: PURPLE_PRIMARY_BUTTON,
  requestChangesButton: PILL_BUTTON,
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
<AdspButton themeOverrides={{ borderRadius: 'var(--adsp-border-radius-round)' }}>Save</AdspButton>

// Precedence, per token: component > section > theme. Tokens a level doesn't set pass through.`;

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

const precedenceRows = (theme: AdspTheme) => [
  {
    button: 'Theme',
    setBy: 'The selected theme',
    value: theme.components.button.primary.background,
    reason: 'Nothing closer sets it',
  },
  {
    button: 'Section',
    setBy: 'Section provider overrides',
    value: SECTION_PRIMARY_BACKGROUND,
    reason: 'Section beats theme',
  },
  {
    button: 'Component',
    setBy: 'Its own themeOverrides',
    value: COMPONENT_PRIMARY_BACKGROUND,
    reason: 'Component beats section',
  },
  {
    button: 'Component, shape only',
    setBy: 'Section provider overrides (its themeOverrides sets only borderRadius)',
    value: SECTION_PRIMARY_BACKGROUND,
    reason: 'Tokens a level does not set pass through from the level above',
  },
];

interface ComponentShowcaseProps {
  testId: string;
  description?: string;
  overrides?: ShowcaseOverrides;
}

const ComponentShowcase = ({
  testId,
  description = 'Dummy ADSP components, styled only by the selected theme.',
  overrides = {},
}: ComponentShowcaseProps) => (
  <AdspCard heading="Application review" testId={testId} themeOverrides={overrides.card}>
    {description}
    <ShowcaseRow>
      <AdspBadge type="success" themeOverrides={overrides.approvedBadge}>
        Approved
      </AdspBadge>
      <AdspBadge type="info">In review</AdspBadge>
      <AdspBadge type="important">Action required</AdspBadge>
      <AdspBadge type="emergency">Rejected</AdspBadge>
    </ShowcaseRow>
    <ShowcaseRow>
      <AdspButton themeOverrides={overrides.approveButton}>Approve</AdspButton>
      <AdspButton variant="secondary" themeOverrides={overrides.requestChangesButton}>
        Request changes
      </AdspButton>
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
          <GoabText size="body-m">
            The same components as section 1, but four of them pass themeOverrides: the card (highlighted), the Approved
            badge (square), Approve (purple) and Request changes (pill). Every other component is unchanged.
          </GoabText>
          <ComponentShowcase
            testId="instance-override-card"
            description="Only the components given themeOverrides look different from section 1."
            overrides={COMPONENT_LEVEL_OVERRIDES}
          />

          <GoabText size="heading-s">4. Precedence: the closest level wins</GoabText>
          <GoabText size="body-m">
            Each button sets the primary background at a different level. For each token, component beats section and
            section beats theme. Switch the theme above: only the Theme button follows it.
          </GoabText>
          <AdspCard heading="Which level wins?" testId="precedence-card">
            <ShowcaseRow>
              <AdspButton testId="precedence-theme-button">Theme</AdspButton>
              <AdspThemeProvider overrides={SUCCESS_PRIMARY_BUTTONS}>
                <AdspButton testId="precedence-section-button">Section</AdspButton>
                <AdspButton themeOverrides={PURPLE_PRIMARY_BUTTON} testId="precedence-component-button">
                  Component
                </AdspButton>
                <AdspButton themeOverrides={PILL_BUTTON} testId="precedence-shape-button">
                  Component, shape only
                </AdspButton>
              </AdspThemeProvider>
            </ShowcaseRow>
          </AdspCard>
          <GoabTable width="100%" mt="m" testId="precedence-table">
            <thead>
              <tr>
                <th>Button</th>
                <th>Primary background set by</th>
                <th>Value used</th>
                <th>Why</th>
              </tr>
            </thead>
            <tbody>
              {precedenceRows(selectedTheme).map(({ button, setBy, value, reason }) => (
                <tr key={button}>
                  <td>{button}</td>
                  <td>{setBy}</td>
                  <td>
                    <code>{value}</code>
                  </td>
                  <td>{reason}</td>
                </tr>
              ))}
            </tbody>
          </GoabTable>
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
