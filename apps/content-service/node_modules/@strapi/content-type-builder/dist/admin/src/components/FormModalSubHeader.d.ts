import { StrapiAppContextValue } from '@strapi/admin/strapi-admin';
import type { Struct } from '@strapi/types';
type ModalTitleProps = {
    forTarget?: Struct.ModelType;
    step?: string;
    kind?: string;
    modalType?: string;
    actionType?: string;
};
export declare const getModalTitleSubHeader: ({ modalType, forTarget, kind, actionType, step, }: ModalTitleProps) => string;
type FormModalSubHeaderProps = {
    actionType: string;
    modalType: string;
    forTarget: Struct.ModelType;
    kind?: string;
    step?: string;
    attributeType: string;
    attributeName: string;
    customField?: ReturnType<StrapiAppContextValue['customFields']['get']>;
};
export declare const FormModalSubHeader: ({ actionType, modalType, forTarget, kind, step, attributeType, attributeName, customField, }: FormModalSubHeaderProps) => import("react/jsx-runtime").JSX.Element;
export {};
