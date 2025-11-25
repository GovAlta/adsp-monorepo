import type { Components } from '../../../types';
import type { UID } from '@strapi/types';
export type NestedComponent = {
    component: UID.Component;
    uidsOfAllParents?: UID.Component[];
    parentCompoUid?: UID.Component;
};
export declare const retrieveNestedComponents: (appComponents: Components) => NestedComponent[];
