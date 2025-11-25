import type { Store } from './core/store/configure';
import type { StrapiApp } from './StrapiApp';
interface AppProps {
    strapi: StrapiApp;
    store: Store;
}
declare const App: ({ strapi, store }: AppProps) => import("react/jsx-runtime").JSX.Element;
export { App };
export type { AppProps };
