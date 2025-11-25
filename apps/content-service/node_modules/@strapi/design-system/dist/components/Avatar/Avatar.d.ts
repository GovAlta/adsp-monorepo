import * as React from 'react';
import * as Avatar from '@radix-ui/react-avatar';
import { FlexProps } from '../../primitives/Flex';
type ItemElement = HTMLSpanElement;
interface ItemProps extends Avatar.AvatarProps, Pick<Avatar.AvatarImageProps, 'onLoadingStatusChange' | 'src' | 'alt'> {
    /**
     * @default 600
     * @description Useful for delaying rendering so it only
     * appears for those with slower connections.
     */
    delayMs?: Avatar.AvatarFallbackProps['delayMs'];
    fallback: React.ReactNode;
    /**
     * @default false
     * @description Useful for showing a preview of the image
     * on hover in a tooltip.
     */
    preview?: boolean;
}
declare const Item: React.ForwardRefExoticComponent<ItemProps & React.RefAttributes<HTMLSpanElement>>;
type GroupElement = HTMLDivElement;
interface GroupProps extends Omit<FlexProps, 'tag'> {
}
declare const Group: React.ForwardRefExoticComponent<Omit<GroupProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export { Item, Group };
export type { ItemElement, ItemProps, GroupElement, GroupProps };
//# sourceMappingURL=Avatar.d.ts.map