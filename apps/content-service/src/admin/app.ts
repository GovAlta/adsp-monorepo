import favicon from './extensions/favicon.ico';
import logo from './extensions/goa-logo.png';

export default {
  config: {
    // replace favicon with a custom icon
    head: {
      favicon,
    },
    auth: {
      // Replace the Strapi logo in auth (login) views
      logo,
    },
    menu: {
      // Replace the Strapi logo in the main navigation
      logo: favicon,
    },
    theme: {
      light: {
        colors: {
          primary500: '#0070C4',
          primary600: '#004F84',
          primary700: '#004F84',
          buttonPrimary500: "#004F84",
          buttonPrimary600: "#0070C4",
          buttonPrimary700: "#0070C4",
        },
      },
    },
  },
};
