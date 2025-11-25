import { StrapiApp, StrapiAppConstructorArgs } from './StrapiApp';
import type { Modules } from '@strapi/types';
interface RenderAdminArgs {
    customisations: {
        register?: (app: StrapiApp) => Promise<void> | void;
        bootstrap?: (app: StrapiApp) => Promise<void> | void;
        config?: StrapiAppConstructorArgs['config'];
    };
    plugins: StrapiAppConstructorArgs['appPlugins'];
    features?: Modules.Features.FeaturesService['config'];
}
declare const renderAdmin: (mountNode: HTMLElement | null, { plugins, customisations, features }: RenderAdminArgs) => Promise<void>;
export { renderAdmin };
export type { RenderAdminArgs };
