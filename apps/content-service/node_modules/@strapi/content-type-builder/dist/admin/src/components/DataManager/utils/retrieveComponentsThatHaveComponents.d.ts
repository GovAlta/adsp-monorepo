import type { Component, Components } from '../../../types';
import type { UID } from '@strapi/types';
type ChildComponent = {
    component: UID.Component;
};
export type ComponentWithChildren = {
    component: UID.Component;
    childComponents: ChildComponent[];
};
declare const retrieveComponentsThatHaveComponents: (allComponents: Components) => ComponentWithChildren[];
declare const getComponentWithChildComponents: (component: Component) => ComponentWithChildren;
export { getComponentWithChildComponents, retrieveComponentsThatHaveComponents };
