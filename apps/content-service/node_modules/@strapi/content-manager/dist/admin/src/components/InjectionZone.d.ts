/// <reference types="react" />
import { InjectionZoneComponent } from '@strapi/admin/strapi-admin';
declare const INJECTION_ZONES: {
    editView: {
        informations: never[];
        'right-links': never[];
    };
    listView: {
        actions: never[];
        deleteModalAdditionalInfos: never[];
        publishModalAdditionalInfos: never[];
        unpublishModalAdditionalInfos: never[];
    };
    preview: {
        actions: never[];
    };
};
interface InjectionZones {
    editView: {
        informations: InjectionZoneComponent[];
        'right-links': InjectionZoneComponent[];
    };
    listView: {
        actions: InjectionZoneComponent[];
        deleteModalAdditionalInfos: InjectionZoneComponent[];
        publishModalAdditionalInfos: InjectionZoneComponent[];
        unpublishModalAdditionalInfos: InjectionZoneComponent[];
    };
    preview: {
        actions: InjectionZoneComponent[];
    };
}
type InjectionZoneArea = 'editView.informations' | 'editView.right-links' | 'listView.actions' | 'listView.unpublishModalAdditionalInfos' | 'listView.deleteModalAdditionalInfos' | 'listView.publishModalAdditionalInfos' | 'listView.deleteModalAdditionalInfos' | 'preview.actions';
type InjectionZoneModule = InjectionZoneArea extends `${infer Word}.${string}` ? Word : never;
type InjectionZoneContainer = InjectionZoneArea extends `${string}.${infer Word}.${string}` ? Word : never;
type InjectionZoneBlock = InjectionZoneArea extends `${string}.${string}.${infer Word}` ? Word : never;
/**
 * You can't know what this component props will be because it's generic and used everywhere
 * e.g. content-manager edit view, we just send the slug but we might not in the listView,
 * therefore, people should type it themselves on the components they render.
 */
declare const InjectionZone: ({ area, ...props }: {
    area: InjectionZoneArea;
    [key: string]: unknown;
}) => import("react/jsx-runtime").JSX.Element;
export declare const useInjectionZone: (area: InjectionZoneArea) => {
    name: string;
    Component: import("react").ComponentType<{}>;
}[];
export { InjectionZone, INJECTION_ZONES };
export type { InjectionZoneArea, InjectionZoneComponent, InjectionZones, InjectionZoneModule, InjectionZoneContainer, InjectionZoneBlock, };
