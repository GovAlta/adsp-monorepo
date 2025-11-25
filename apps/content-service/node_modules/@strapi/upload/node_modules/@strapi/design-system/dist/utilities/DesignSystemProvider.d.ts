/// <reference types="react" />
import { TooltipProviderProps } from '@radix-ui/react-tooltip';
import { DefaultTheme } from 'styled-components';
interface DesignSystemContextValue {
    locale: string;
}
declare const useDesignSystem: (consumerName: string) => DesignSystemContextValue;
interface DesignSystemProviderProps extends Partial<DesignSystemContextValue> {
    children?: React.ReactNode;
    theme?: DefaultTheme;
    tooltipConfig?: Omit<TooltipProviderProps, 'children'>;
}
declare const DesignSystemProvider: ({ children, locale, theme, tooltipConfig, }: DesignSystemProviderProps) => import("react/jsx-runtime").JSX.Element;
export { useDesignSystem, DesignSystemProvider };
export type { DesignSystemProviderProps, DesignSystemContextValue };
//# sourceMappingURL=DesignSystemProvider.d.ts.map