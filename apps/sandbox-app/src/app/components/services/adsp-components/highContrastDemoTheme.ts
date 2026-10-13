import { AdspThemes, createAdspTheme } from '@abgov/adsp-components-core';

// Theme-level customization: high-contrast colours, square corners and yellow primary buttons.
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
    button: {
      primary: {
        background: '#ffd600',
        borderColor: '#ffd600',
        textColor: '#000000',
        hoverBackground: '#ffea61',
        hoverBorderColor: '#ffea61',
        hoverTextColor: '#000000',
      },
    },
  },
});
