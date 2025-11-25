import * as React from 'react';
import type { Store } from '../core/store/configure';
import type { StrapiApp } from '../StrapiApp';
interface ProvidersProps {
    children: React.ReactNode;
    strapi: StrapiApp;
    store: Store;
}
declare const Providers: ({ children, strapi, store }: ProvidersProps) => import("react/jsx-runtime").JSX.Element;
export { Providers };
