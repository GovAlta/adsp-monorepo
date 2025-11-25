import * as React from 'react';
interface LanguageProviderProps {
    children: React.ReactNode;
    messages: Record<string, Record<string, string>>;
}
declare const LanguageProvider: ({ children, messages }: LanguageProviderProps) => import("react/jsx-runtime").JSX.Element;
export { LanguageProvider };
export type { LanguageProviderProps };
