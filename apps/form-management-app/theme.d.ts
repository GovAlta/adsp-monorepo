import 'styled-components';


declare module 'styled-components' {
  export interface DefaultTheme {

    // https://standards.alberta.ca/design-system/foundation/colour.aspx
    colors: {
      white: string;
      lightGray: string;
      black: string;
      blue: string;
      gray: string;
      green: string;
      yellow: string;
      red: string;
    };
  }
}
