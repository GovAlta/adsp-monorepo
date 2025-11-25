import * as React from 'react';
import { StrapiAppContextValue } from '@strapi/admin/strapi-admin';
import { IconByType } from '../AttributeIcon';
export type CustomFieldOption = {
    name: string;
    type: IconByType;
    icon: React.ComponentType;
    intlLabel: {
        id: string;
        defaultMessage: string;
    };
    intlDescription: {
        id: string;
        defaultMessage: string;
    };
};
type CustomFieldOptionProps = {
    customFieldUid: string;
    customField: NonNullable<ReturnType<StrapiAppContextValue['customFields']['get']>>;
};
export declare const CustomFieldOption: ({ customFieldUid, customField }: CustomFieldOptionProps) => import("react/jsx-runtime").JSX.Element;
export {};
