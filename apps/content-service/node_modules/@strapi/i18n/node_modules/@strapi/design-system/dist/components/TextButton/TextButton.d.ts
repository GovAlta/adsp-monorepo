import * as React from 'react';
import { FlexProps } from '../../primitives/Flex';
import { PolymorphicComponentPropsWithRef } from '../../types';
type TextButtonProps<C extends React.ElementType = 'button'> = FlexProps<C> & {
    disabled?: boolean;
    endIcon?: React.ReactNode;
    loading?: boolean;
    startIcon?: React.ReactNode;
};
declare const TextButton: TextButtonComponent<"button">;
type TextButtonComponent<C extends React.ElementType = 'button'> = <T extends React.ElementType = C>(props: PolymorphicComponentPropsWithRef<T, TextButtonProps<T>>) => JSX.Element;
export { TextButton };
export type { TextButtonProps };
//# sourceMappingURL=TextButton.d.ts.map