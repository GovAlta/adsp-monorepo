import * as React from 'react';
import * as Progress from '@radix-ui/react-progress';
type Size = 'S' | 'M';
interface ProgressBarProps extends Omit<Progress.ProgressProps, 'children'> {
    size?: Size;
}
declare const ProgressBar: React.ForwardRefExoticComponent<ProgressBarProps & React.RefAttributes<HTMLDivElement>>;
export { ProgressBar };
export type { ProgressBarProps, Size as ProgressBarSize };
//# sourceMappingURL=ProgressBar.d.ts.map