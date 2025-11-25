import { DefaultTheme, IStyledComponent } from 'styled-components';
export declare const getThemeSize: <TType extends keyof import("./sizes").Sizes>(type: TType) => ({ theme, size }: {
    theme: DefaultTheme;
    size: keyof DefaultTheme['sizes'][TType];
}) => import("./sizes").Sizes[TType][keyof import("./sizes").Sizes[TType]];
export declare const inputFocusStyle: (rootElement?: IStyledComponent<'web'> | string) => ({ theme, $hasError }: {
    theme: DefaultTheme;
    $hasError?: boolean;
}) => import("styled-components").RuleSet<object>;
//# sourceMappingURL=utils.d.ts.map