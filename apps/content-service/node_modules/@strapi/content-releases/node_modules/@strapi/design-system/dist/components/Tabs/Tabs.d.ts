import * as React from 'react';
import * as Tabs from '@radix-ui/react-tabs';
type Variant = 'regular' | 'simple';
interface ContextValue {
    /**
     * @default false
     * @description This will disable all tabs, you can pass
     * this attribute to individual triggers to disable them.
     * If you provide a string, it should be the value of a trigger.
     */
    disabled: boolean | string;
    /**
     * @description This will show an error state on the tab
     * that matches the value provided.
     */
    hasError?: string;
    /**
     * @default 'regular'
     */
    variant: Variant;
}
type Element = HTMLDivElement;
interface Props extends Tabs.TabsProps, Partial<ContextValue> {
}
declare const Root: React.ForwardRefExoticComponent<Props & React.RefAttributes<HTMLDivElement>>;
type ListElement = HTMLDivElement;
interface ListProps extends Tabs.TabsListProps {
}
declare const List: React.ForwardRefExoticComponent<ListProps & React.RefAttributes<HTMLDivElement>>;
type TriggerElement = HTMLButtonElement;
interface TriggerProps extends Tabs.TabsTriggerProps {
}
declare const Trigger: React.ForwardRefExoticComponent<TriggerProps & React.RefAttributes<HTMLButtonElement>>;
type ContentElement = HTMLDivElement;
interface ContentProps extends Tabs.TabsContentProps {
}
declare const Content: React.ForwardRefExoticComponent<ContentProps & React.RefAttributes<HTMLDivElement>>;
export { Root, List, Trigger, Content };
export type { Props, Element, ListProps, ListElement, TriggerProps, TriggerElement, ContentProps, ContentElement };
//# sourceMappingURL=Tabs.d.ts.map