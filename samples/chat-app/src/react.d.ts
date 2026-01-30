export * from '@types/react';

// This is a kludge for React 18 upgrade;
// FunctionComponent no longer has children implicit property and this needs to be updated in the UI Component library.
declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/ban-types
  interface FunctionComponent<P = {}> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (props: PropsWithChildren<P>, context?: any): ReactElement<any, any> | null;
  }
}
