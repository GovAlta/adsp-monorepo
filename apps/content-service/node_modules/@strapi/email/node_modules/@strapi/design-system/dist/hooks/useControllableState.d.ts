import * as React from 'react';
type UseControllableStateParams<T> = {
    prop?: T | undefined;
    defaultProp?: T | undefined;
    onChange?: (state: T) => void;
};
declare function useControllableState<T>({ prop, defaultProp, onChange }: UseControllableStateParams<T>): readonly [T | undefined, React.Dispatch<React.SetStateAction<T | undefined>>];
declare function useUncontrolledState<T>({ defaultProp, onChange }: Omit<UseControllableStateParams<T>, 'prop'>): [T | undefined, React.Dispatch<React.SetStateAction<T | undefined>>];
export { useControllableState, useUncontrolledState as _internaluseUncontrolledState };
//# sourceMappingURL=useControllableState.d.ts.map