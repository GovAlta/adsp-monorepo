import type { ComponentWithChildren } from '../components/DataManager/utils/retrieveComponentsThatHaveComponents';
import type { NestedComponent } from '../components/DataManager/utils/retrieveNestedComponents';
import type { Internal } from '@strapi/types';
/**
 * Recursively calculates the maximum depth of nested child components
 * for a given component UID.
 *
 * @param componentUid - The UID of the component to start from.
 * @param components - The array of all components with their child components.
 * @param currentDepth - The current depth of the recursion. Defaults to 0.
 * @returns The maximum depth of the nested child components.
 */
export declare const getChildrenMaxDepth: (componentUid: Internal.UID.Component, components: Array<ComponentWithChildren>, currentDepth?: number) => number;
/**
 * Calculates the depth of a component within a nested component tree.
 * Depth is defined as the level at which the component is nested.
 * For example, a component at Depth 3 is the third nested component.
 *
 * @param component - The UID of the component to find the depth for.
 * @param components - The array of all nested components.
 * @returns The depth level of the component within the nested tree.
 */
export declare const getComponentDepth: (component: Internal.UID.Schema, components: Array<NestedComponent>) => number;
