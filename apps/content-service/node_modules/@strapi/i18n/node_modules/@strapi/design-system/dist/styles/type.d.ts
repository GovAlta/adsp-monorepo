import { DefaultTheme } from 'styled-components';
declare const TEXT_VARIANTS: readonly ["alpha", "beta", "delta", "epsilon", "omega", "pi", "sigma"];
declare const ellipsis: import("styled-components").RuleSet<object>;
interface VariantProps {
    $variant?: (typeof TEXT_VARIANTS)[number];
    theme: DefaultTheme;
}
declare const variant: ({ $variant, theme }: VariantProps) => string;
export { TEXT_VARIANTS, ellipsis, variant };
export type { VariantProps };
//# sourceMappingURL=type.d.ts.map