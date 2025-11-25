import * as React from 'react';
import { FlexProps } from '../../primitives/Flex';
type CardActionPosition = 'end' | 'start';
type CardActionProps = Omit<FlexProps<'div'>, 'direction' | 'gap' | 'position'> & {
    position: CardActionPosition;
};
declare const CardActionImpl: React.ForwardRefExoticComponent<Omit<CardActionProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export { CardActionImpl as CardAction };
export type { CardActionProps, CardActionPosition };
//# sourceMappingURL=CardAction.d.ts.map