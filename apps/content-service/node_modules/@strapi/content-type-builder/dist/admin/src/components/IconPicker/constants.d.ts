import * as Icons from '@strapi/icons';
import * as Symbols from '@strapi/icons/symbols';
export type Icon = (typeof Icons)[keyof typeof Icons] | (typeof Symbols)[keyof typeof Symbols];
declare const COMPONENT_ICONS: Record<string, Icon>;
export { COMPONENT_ICONS };
