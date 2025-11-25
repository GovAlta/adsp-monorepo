/**
 * This component will render DescriptionComponents that return objects e.g. `cm.apis.addEditViewPanel`
 * these descriptions are still treated like components because users can use react hooks in them.
 *
 * Rendering them normally by mapping etc. causes mutliple render issues.
 */
import * as React from 'react';
interface DescriptionComponent<Props, Description> {
    (props: Props): Description | null;
}
interface DescriptionComponentRendererProps<Props = any, Description = any> {
    children: (descriptions: Array<Description & {
        id: string;
    }>) => React.ReactNode;
    descriptions: DescriptionComponent<Props, Description>[];
    props: Props;
}
/**
 * @internal
 *
 * @description This component takes an array of DescriptionComponents, which are react components that return objects as opposed to JSX.
 * We render these in their own isolated memoized component and use an update function to push the data back out to the parent.
 * Saving it in a ref, and then "forcing" an update of the parent component to render the children of this component with the new data.
 *
 * The DescriptionCompoonents can take props and use react hooks hence why we render them as if they were a component. The update
 * function is throttled and managed to avoid erroneous updates where we could wait a single tick to update the entire UI, which
 * creates less "popping" from functions being called in rapid succession.
 */
declare const DescriptionComponentRenderer: <Props, Description>({ children, props, descriptions, }: DescriptionComponentRendererProps<Props, Description>) => import("react/jsx-runtime").JSX.Element;
export { DescriptionComponentRenderer };
export type { DescriptionComponentRendererProps, DescriptionComponent };
