/// <reference types="react" />
import type { Internal, Struct } from '@strapi/types';
type FormModalNavigationProviderProps = {
    children: React.ReactNode;
};
export type Tab = 'basic' | 'advanced';
export type ModalType = 'chooseAttribute' | 'edit' | 'attribute' | 'customField' | 'addComponentToDynamicZone' | 'contentType' | 'component';
export type State = Record<string, any>;
export declare const INITIAL_STATE_DATA: State;
export type SelectCustomFieldPayload = {
    attributeType: string;
    customFieldUid: string;
};
export type SelectFieldPayload = {
    attributeType: string;
    step: string | null;
};
export type OpenModalAddComponentsToDZPayload = {
    dynamicZoneTarget?: string;
    targetUid: Internal.UID.Schema;
};
export type OpenModalAddFieldPayload = {
    forTarget: Struct.ModelType;
    targetUid?: Internal.UID.Schema;
};
export type OpenModalEditCustomFieldPayload = {
    forTarget: Struct.ModelType;
    targetUid: Internal.UID.Schema;
    attributeName: string;
    attributeType: string;
    customFieldUid: string;
};
export type OpenModalEditFieldPayload = {
    forTarget: Struct.ModelType;
    targetUid: Internal.UID.Schema;
    attributeName: string;
    attributeType: string;
    step: string | null;
};
export type OpenModalEditSchemaPayload = {
    modalType: ModalType;
    forTarget: Struct.ModelType;
    targetUid: Internal.UID.Schema;
    kind?: string;
};
export type NavigateToChooseAttributeModalPayload = {
    forTarget: Struct.ModelType;
    targetUid: Internal.UID.Schema;
};
export type NavigateToAddCompoToDZModalPayload = {
    dynamicZoneTarget: string;
};
export declare const FormModalNavigationProvider: ({ children }: FormModalNavigationProviderProps) => import("react/jsx-runtime").JSX.Element;
export {};
