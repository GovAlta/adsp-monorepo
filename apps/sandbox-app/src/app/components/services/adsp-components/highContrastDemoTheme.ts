import { AdspThemes, createAdspTheme } from '@abgov/adsp-components-core';

// Theme-level customization: high-contrast colours, square corners and yellow calendar events.
export const highContrastDemoTheme = createAdspTheme(AdspThemes.standard, {
  name: 'high-contrast-demo',
  color: {
    text: { default: '#ffffff', secondary: '#e0e0e0' },
    surface: { card: '#000000', default: '#262626' },
    border: { default: '#ffffff' },
    status: { success: '#3ddc84', info: '#4fc3f7', important: '#ffd600', emergency: '#ff5252' },
  },
  borderRadius: { s: '0', m: '0' },
  components: {
    calendar: {
      eventBackground: '#ffd600',
      eventTextColor: '#000000',
    },
  },
});
