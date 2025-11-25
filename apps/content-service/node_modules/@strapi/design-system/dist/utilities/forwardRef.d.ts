import * as React from 'react';
/**
 * A utility function to create a forwardRef component.
 * This is a workaround to allow generics to be passed
 * to forwardRef components.
 */
declare const forwardRef: <T, P = object>(render: (props: P, ref: React.ForwardedRef<T>) => ReturnType<React.FunctionComponent>) => (props: React.PropsWithoutRef<P> & React.RefAttributes<T>) => ReturnType<React.FunctionComponent>;
export { forwardRef };
//# sourceMappingURL=forwardRef.d.ts.map