import React, { useState } from 'react';

import {
  GoabContainer,
  GoabDetails,
  GoabRadioGroup,
  GoabRadioItem,
  GoabTable,
  GoabText,
} from '@abgov/react-components';
import { AdspThemes, toCssVariables, type AdspTheme } from '@abgov/adsp-components-core';
import { ServiceContainer } from '../../styled-components';
import { highContrastDemoTheme } from './highContrastDemoTheme';

const SELECTABLE_THEMES: Record<string, { label: string; theme: AdspTheme }> = {
  [AdspThemes.standard.name]: { label: 'Standard', theme: AdspThemes.standard },
  [highContrastDemoTheme.name]: { label: 'High contrast (sandbox demo)', theme: highContrastDemoTheme },
};

const SECTION_EVENT_BACKGROUND = 'var(--adsp-color-status-success)';
const COMPONENT_EVENT_BACKGROUND = '#6a1b9a';

const APPLICATION_SETUP = `import '@abgov/design-tokens/dist/tokens.css';
import '@abgov/adsp-components-core/adsp-components.css';
import { AdspThemes } from '@abgov/adsp-components-core';
import { AdspThemeProvider } from '@abgov/adsp-components-react';

<AdspThemeProvider theme={AdspThemes.standard}>
  <App />
</AdspThemeProvider>`;

const THEME_LEVEL = `const brandTheme = createAdspTheme(AdspThemes.standard, {
  components: { calendar: { eventBackground: '#6a1b9a' } },
});
<AdspThemeProvider theme={brandTheme}>...</AdspThemeProvider>`;

const SECTION_LEVEL = `<AdspThemeProvider
  overrides={{ components: { calendar: { eventBackground: 'var(--adsp-color-status-success)' } } }}
>
  ...
</AdspThemeProvider>`;

const COMPONENT_LEVEL = `<AdspGoACalendar
  client={client}
  calendar="my-calendar"
  themeOverrides={{ eventBackground: '#6a1b9a' }}
/>`;

const formatCssVariables = (theme: AdspTheme) =>
  Object.entries(toCssVariables(theme))
    .map(([name, value]) => `${name}: ${value};`)
    .join('\n');

const precedenceRows = (theme: AdspTheme) => [
  {
    level: 'Theme',
    setBy: 'The selected theme',
    value: theme.components.calendar.eventBackground,
    reason: 'Nothing closer sets it',
  },
  {
    level: 'Section',
    setBy: 'Section provider overrides',
    value: SECTION_EVENT_BACKGROUND,
    reason: 'Section beats theme',
  },
  {
    level: 'Component',
    setBy: 'Its own themeOverrides',
    value: COMPONENT_EVENT_BACKGROUND,
    reason: 'Component beats section',
  },
];

const ThemeLevelSection = ({ themeName, onChange }: { themeName: string; onChange: (name: string) => void }) => (
  <>
    <GoabText size="heading-s">1. Theme level</GoabText>
    <GoabText size="body-m">Select a whole theme. Every ADSP component inside the provider follows it.</GoabText>
    <GoabRadioGroup
      name="adsp-theme"
      value={themeName}
      orientation="horizontal"
      testId="adsp-theme-selector"
      onChange={({ value }) => onChange(value)}
    >
      {Object.entries(SELECTABLE_THEMES).map(([name, { label }]) => (
        <GoabRadioItem key={name} value={name} label={label} />
      ))}
    </GoabRadioGroup>
    <GoabDetails heading="Theme level example" mt="m">
      <pre>{THEME_LEVEL}</pre>
    </GoabDetails>
  </>
);

const SectionLevelSection = () => (
  <>
    <GoabText size="heading-s">2. Section level</GoabText>
    <GoabText size="body-m">
      A nested provider with overrides changes part of the theme for its subtree only, on top of the selected theme.
    </GoabText>
    <GoabDetails heading="Section level example" mt="m">
      <pre>{SECTION_LEVEL}</pre>
    </GoabDetails>
  </>
);

const ComponentLevelSection = () => (
  <>
    <GoabText size="heading-s">3. Component level</GoabText>
    <GoabText size="body-m">A component can pass themeOverrides to change one instance only.</GoabText>
    <GoabDetails heading="Component level example" mt="m">
      <pre>{COMPONENT_LEVEL}</pre>
    </GoabDetails>
  </>
);

const PrecedenceSection = ({ theme }: { theme: AdspTheme }) => (
  <>
    <GoabText size="heading-s">4. Precedence: the closest level wins</GoabText>
    <GoabText size="body-m">
      The table shows the calendar event background resolved when it is set at each level. Per token, component beats
      section and section beats theme. Tokens a level does not set pass through from the level above. Switch the theme
      above: only the Theme row follows it.
    </GoabText>
    <GoabTable width="100%" mt="m" testId="precedence-table">
      <thead>
        <tr>
          <th>Level</th>
          <th>Event background set by</th>
          <th>Value used</th>
          <th>Why</th>
        </tr>
      </thead>
      <tbody>
        {precedenceRows(theme).map(({ level, setBy, value, reason }) => (
          <tr key={level}>
            <td>{level}</td>
            <td>{setBy}</td>
            <td>
              <code>{value}</code>
            </td>
            <td>{reason}</td>
          </tr>
        ))}
      </tbody>
    </GoabTable>
  </>
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
          ADSP components read the selected theme through --adsp-* CSS custom properties set on their own root elements,
          so GoA components are unaffected.
        </GoabText>

        <ThemeLevelSection themeName={themeName} onChange={setThemeName} />
        <SectionLevelSection />
        <ComponentLevelSection />
        <PrecedenceSection theme={selectedTheme} />

        <GoabText size="heading-s">No provider</GoabText>
        <GoabText size="body-m">Components rendered outside an AdspThemeProvider receive AdspThemes.standard.</GoabText>

        <GoabDetails heading="Application setup" mt="l">
          <pre>{APPLICATION_SETUP}</pre>
        </GoabDetails>
        <GoabDetails heading="CSS custom properties of the selected theme">
          <pre data-testid="selected-theme-css-variables">{formatCssVariables(selectedTheme)}</pre>
        </GoabDetails>
      </GoabContainer>
    </ServiceContainer>
  );
};
