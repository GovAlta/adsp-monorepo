import { IconByType } from './AttributeIcon';
import type { Internal } from '@strapi/types';
type BaseProps = {
    actionType?: string | null;
    attributeName: string;
    attributeType: IconByType;
    contentTypeKind: IconByType;
    dynamicZoneTarget: string;
    modalType: string | null;
    customFieldUid?: string | null;
    showBackLink?: boolean;
};
type FormModalHeaderProps = BaseProps & ({
    forTarget: 'component';
    targetUid: Internal.UID.Component;
} | {
    forTarget: 'contentType';
    targetUid: Internal.UID.ContentType;
});
export declare const FormModalHeader: ({ actionType, attributeName, attributeType, contentTypeKind, dynamicZoneTarget, forTarget, modalType, targetUid, customFieldUid, showBackLink, }: FormModalHeaderProps) => import("react/jsx-runtime").JSX.Element;
export {};
