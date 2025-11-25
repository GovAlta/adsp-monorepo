import { DefaultTheme } from 'styled-components';
import { type ButtonVariant } from './constants';
export declare const getVariantColorName: (variant: ButtonVariant) => 'success' | 'danger' | 'neutral' | 'primary';
export declare const getDisabledStyle: ({ theme }: {
    theme: DefaultTheme;
}) => import("styled-components").RuleSet<object>;
export declare const getHoverStyle: ({ theme, $variant }: {
    theme: DefaultTheme;
    $variant: ButtonVariant;
}) => import("styled-components").RuleSet<object>;
export declare const getActiveStyle: ({ theme, $variant }: {
    theme: DefaultTheme;
    $variant: ButtonVariant;
}) => import("styled-components").RuleSet<object>;
export declare const getVariantStyle: ({ theme, $variant }: {
    theme: DefaultTheme;
    $variant: ButtonVariant;
}) => import("styled-components").RuleSet<object>;
//# sourceMappingURL=utils.d.ts.map