import type React from 'react';

import type * as CSS from 'csstype';
declare global {
  interface Element {
    slot?: string;
  }
}

declare module 'csstype' {
  interface Properties {
    // Should add generic support for any CSS variables
    [index: `--${string}`]: any;
  }
}

type GenericProps = { [k: string]: any };
type GenericElement = HTMLElement;

type GenericForwardRef = React.ForwardRefExoticComponent<
  GenericProps & React.RefAttributes<GenericElement | undefined>
>;

declare const MediaTheme: GenericForwardRef;
export { MediaTheme };
