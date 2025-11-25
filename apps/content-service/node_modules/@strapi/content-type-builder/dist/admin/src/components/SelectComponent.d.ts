import type { Internal } from '@strapi/types';
interface SelectComponentProps {
    componentToCreate?: Record<string, any> | null;
    error?: string | null;
    intlLabel: {
        id: string;
        defaultMessage: string;
        values?: Record<string, any>;
    };
    isAddingAComponentToAnotherComponent: boolean;
    isCreating: boolean;
    isCreatingComponentWhileAddingAField: boolean;
    name: string;
    onChange: (value: any) => void;
    targetUid: Internal.UID.Schema;
    value: string;
    forTarget: string;
}
export declare const SelectComponent: ({ error, intlLabel, isAddingAComponentToAnotherComponent, isCreating, isCreatingComponentWhileAddingAField, componentToCreate, name, onChange, targetUid, forTarget, value, }: SelectComponentProps) => import("react/jsx-runtime").JSX.Element;
export {};
