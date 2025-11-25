import * as React from 'react';
import { type DefaultTheme } from 'styled-components';
interface ThemeProps {
    children: React.ReactNode;
    themes: {
        dark: DefaultTheme;
        light: DefaultTheme;
    };
}
declare const Theme: ({ children, themes }: ThemeProps) => import("react/jsx-runtime").JSX.Element;
export { Theme };
export type { ThemeProps };
