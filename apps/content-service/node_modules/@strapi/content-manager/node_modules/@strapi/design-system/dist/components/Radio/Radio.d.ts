import * as React from 'react';
import * as RadioGroup from '@radix-ui/react-radio-group';
type GroupElement = HTMLDivElement;
interface GroupProps extends RadioGroup.RadioGroupProps {
}
declare const Group: React.ForwardRefExoticComponent<GroupProps & React.RefAttributes<HTMLDivElement>>;
type ItemElement = HTMLButtonElement;
interface ItemProps extends RadioGroup.RadioGroupItemProps {
}
declare const Item: React.ForwardRefExoticComponent<ItemProps & React.RefAttributes<HTMLButtonElement>>;
export { Group, Item };
export type { GroupElement, GroupProps, ItemElement, ItemProps };
//# sourceMappingURL=Radio.d.ts.map