import * as React from 'react';
import { BoxProps } from '@strapi/design-system';
import { LinkProps } from 'react-router-dom';
export interface FolderCardProps extends Omit<BoxProps, 'id'> {
    ariaLabel: string;
    children: React.ReactNode;
    id?: string;
    startAction?: React.ReactNode;
    cardActions?: React.ReactNode;
    onClick?: () => void;
    to?: LinkProps['to'];
}
export declare const FolderCard: React.ForwardRefExoticComponent<Omit<FolderCardProps, "ref"> & React.RefAttributes<unknown>>;
