import { DefaultTheme } from 'styled-components';
import type { AlertVariant } from './Alert';
interface StyledProps {
    theme: DefaultTheme;
    $variant: AlertVariant;
}
export declare const handleBackgroundColor: (variant: AlertVariant) => keyof DefaultTheme['colors'];
export declare const handleBorderColor: (variant: AlertVariant) => keyof DefaultTheme['colors'];
export declare const handleIconColor: ({ theme, $variant }: StyledProps) => string;
export {};
//# sourceMappingURL=utils.d.ts.map