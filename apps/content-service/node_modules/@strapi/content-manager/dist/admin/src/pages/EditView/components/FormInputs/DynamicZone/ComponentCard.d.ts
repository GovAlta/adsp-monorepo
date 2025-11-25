import * as React from 'react';
import { ComponentIconProps } from '../../../../../components/ComponentIcon';
interface ComponentCardProps extends Pick<ComponentIconProps, 'icon'> {
    children: React.ReactNode;
    onClick?: React.MouseEventHandler<HTMLButtonElement> & React.MouseEventHandler<HTMLDivElement>;
}
declare const ComponentCard: ({ children, onClick, icon }: ComponentCardProps) => import("react/jsx-runtime").JSX.Element;
export { ComponentCard };
export type { ComponentCardProps };
