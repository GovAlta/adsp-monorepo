import React from 'react';
import { GoabContainer, GoabText } from '@abgov/react-components';
import { AdspTheme, AdspThemes } from '@core-services/adsp-components-core';
import { AdspThemeProvider, useAdspTheme } from '@core-services/adsp-components-react';
import { ServiceContainer } from '../../styled-components';

/**
 * A locally defined AdspTheme, not an ADSP theme: additional ADSP themes are out of scope for the
 * theme infrastructure. It exists only so this page can show that an application can select
 * something other than the standard theme, and it uses literal values well away from the GoA
 * palette so the difference is obvious at a glance.
 */
const demoTheme: AdspTheme = {
  name: 'sandbox demo',
  color: {
    text: {
      default: '#f4f1ea',
      secondary: '#bdb6a6',
      light: '#ffffff',
      disabled: '#6f695d',
    },
    surface: {
      page: '#1b1916',
      card: '#2a2620',
      input: '#38332b',
      default: '#221f1a',
    },
    interactive: {
      default: '#e3b23c',
      hover: '#f2c75b',
      focus: '#ffd978',
      disabled: '#5a5348',
    },
    status: {
      success: '#7fb069',
      info: '#6fa8dc',
      important: '#e3b23c',
      emergency: '#e0685a',
    },
  },
  typography: {
    fontFamily: 'Georgia, "Times New Roman", serif',
    heading: {
      xs: { fontSize: '1.125rem', lineHeight: '1.5rem' },
      s: { fontSize: '1.375rem', lineHeight: '1.875rem' },
      m: { fontSize: '1.75rem', lineHeight: '2.25rem' },
      l: { fontSize: '2.25rem', lineHeight: '2.75rem' },
      xl: { fontSize: '2.75rem', lineHeight: '3.25rem' },
    },
    body: {
      xs: { fontSize: '0.8125rem', lineHeight: '1.25rem' },
      s: { fontSize: '0.9375rem', lineHeight: '1.5rem' },
      m: { fontSize: '1.0625rem', lineHeight: '1.75rem' },
      l: { fontSize: '1.25rem', lineHeight: '2rem' },
    },
  },
  spacing: {
    '3xs': '2px',
    '2xs': '4px',
    xs: '8px',
    s: '12px',
    m: '20px',
    l: '32px',
    xl: '44px',
    '2xl': '60px',
    '3xl': '80px',
  },
  borderRadius: {
    none: '0',
    s: '6px',
    m: '12px',
    l: '20px',
    round: '50%',
  },
  components: {},
};

const STATUSES: { label: string; key: keyof AdspTheme['color']['status'] }[] = [
  { label: 'Success', key: 'success' },
  { label: 'Info', key: 'info' },
  { label: 'Important', key: 'important' },
  { label: 'Emergency', key: 'emergency' },
];

/**
 * Nested one level below ThemedCard and given no props. It reaches the theme on its own, which is
 * what "components obtain the current theme without it being passed to each component" has to mean
 * in practice.
 */
const ThemedStatusRow = () => {
  const theme = useAdspTheme();

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: theme.spacing.xs }}>
      {STATUSES.map(({ label, key }) => (
        <span
          key={key}
          style={{
            background: theme.color.status[key],
            color: theme.color.text.light,
            fontSize: theme.typography.body.xs.fontSize,
            lineHeight: theme.typography.body.xs.lineHeight,
            borderRadius: theme.borderRadius.s,
            padding: `${theme.spacing['2xs']} ${theme.spacing.xs}`,
          }}
        >
          {label}
        </span>
      ))}
    </div>
  );
};

/**
 * Stands in for a real ADSP application component until the component tickets land. Every value it
 * renders with comes from useAdspTheme() and none of it is passed in, so identical markup rendering
 * differently in each column below is the whole demonstration.
 */
const ThemedCard = ({ testId }: { testId: string }) => {
  const theme = useAdspTheme();

  return (
    <div
      data-testid={testId}
      style={{
        fontFamily: theme.typography.fontFamily,
        background: theme.color.surface.card,
        color: theme.color.text.default,
        border: `2px solid ${theme.color.interactive.default}`,
        borderRadius: theme.borderRadius.l,
        padding: theme.spacing.l,
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing.s,
      }}
    >
      <span
        style={{
          fontSize: theme.typography.heading.m.fontSize,
          lineHeight: theme.typography.heading.m.lineHeight,
        }}
      >
        Themed component
      </span>
      <span
        style={{
          fontSize: theme.typography.body.m.fontSize,
          lineHeight: theme.typography.body.m.lineHeight,
        }}
      >
        Surface, text colour, type, spacing and border radius on this card all come from the theme in context.
      </span>
      <span
        style={{
          color: theme.color.text.secondary,
          fontSize: theme.typography.body.s.fontSize,
          lineHeight: theme.typography.body.s.lineHeight,
        }}
      >
        Active theme: {theme.name}
      </span>
      <ThemedStatusRow />
    </div>
  );
};

const Panel = ({ caption, children }: { caption: string; children: React.ReactNode }) => (
  <div>
    <GoabText size="body-s" mt="none" mb="s">
      {caption}
    </GoabText>
    {children}
  </div>
);

export const AdspThemeExampleOne = () => {
  return (
    <ServiceContainer>
      <GoabContainer
        accent="thick"
        type="non-interactive"
        width={'full'}
        testId={'adspThemeExampleOneContainer'}
        heading={'ADSP theme provider'}
        mb="none"
      >
        <GoabText size="body-m" mt="none">
          The same component is rendered three times below. The first has no AdspThemeProvider above it and so falls
          back to AdspThemes.standard; the second selects AdspThemes.standard explicitly and should be indistinguishable
          from the first; the third selects a different theme.
        </GoabText>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 'var(--goa-space-l)',
            marginTop: 'var(--goa-space-l)',
          }}
        >
          <Panel caption="No provider (defaults to AdspThemes.standard)">
            <ThemedCard testId="adspThemeCardDefault" />
          </Panel>
          <Panel caption="AdspThemeProvider theme={AdspThemes.standard}">
            <AdspThemeProvider theme={AdspThemes.standard}>
              <ThemedCard testId="adspThemeCardStandard" />
            </AdspThemeProvider>
          </Panel>
          <Panel caption="AdspThemeProvider theme={demoTheme}">
            <AdspThemeProvider theme={demoTheme}>
              <ThemedCard testId="adspThemeCardDemo" />
            </AdspThemeProvider>
          </Panel>
        </div>
      </GoabContainer>
    </ServiceContainer>
  );
};
