import type { Internal } from '@strapi/types';
type SelectComponentsProps = {
    dynamicZoneTarget: string;
    intlLabel: {
        id: string;
        defaultMessage: string;
        values?: object;
    };
    name: string;
    onChange: (value: {
        target: {
            name: string;
            value: string[];
            type?: string;
        };
    }) => void;
    value: string[];
    targetUid: Internal.UID.ContentType;
};
export declare const SelectComponents: ({ dynamicZoneTarget, intlLabel, name, onChange, value, targetUid, }: SelectComponentsProps) => import("react/jsx-runtime").JSX.Element | null;
export {};
