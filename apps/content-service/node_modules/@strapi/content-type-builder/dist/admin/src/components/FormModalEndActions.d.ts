/**
 *
 * FormModalEndActions
 *
 */
import { SyntheticEvent } from 'react';
type FormModalEndActionsProps = {
    deleteComponent: () => void;
    deleteContentType: () => void;
    isAttributeModal: boolean;
    isCustomFieldModal: boolean;
    isComponentAttribute: boolean;
    isComponentModal: boolean;
    isComponentToDzModal: boolean;
    isContentTypeModal: boolean;
    isCreatingComponent: boolean;
    isCreatingComponentAttribute: boolean;
    isCreatingComponentInDz: boolean;
    isCreatingComponentWhileAddingAField: boolean;
    isCreatingContentType: boolean;
    isCreatingDz: boolean;
    isDzAttribute: boolean;
    isEditingAttribute: boolean;
    isInFirstComponentStep: boolean;
    onSubmitAddComponentAttribute: (e: SyntheticEvent, shouldContinue: boolean) => void;
    onSubmitAddComponentToDz: (e: SyntheticEvent, shouldContinue: boolean) => void;
    onSubmitCreateContentType: (e: SyntheticEvent, shouldContinue: boolean) => void;
    onSubmitCreateComponent: (e: SyntheticEvent, shouldContinue: boolean) => void;
    onSubmitCreateDz: (e: SyntheticEvent, shouldContinue: boolean) => void;
    onSubmitEditAttribute: (e: SyntheticEvent, shouldContinue: boolean) => void;
    onSubmitEditComponent: (e: SyntheticEvent, shouldContinue: boolean) => void;
    onSubmitEditContentType: (e: SyntheticEvent, shouldContinue: boolean) => void;
    onSubmitEditCustomFieldAttribute: (e: SyntheticEvent, shouldContinue: boolean) => void;
    onSubmitEditDz: (e: SyntheticEvent, shouldContinue: boolean) => void;
    onClickFinish: () => void;
};
export declare const FormModalEndActions: ({ deleteComponent, deleteContentType, isAttributeModal, isCustomFieldModal, isComponentAttribute, isComponentToDzModal, isContentTypeModal, isCreatingComponent, isCreatingComponentAttribute, isCreatingComponentInDz, isCreatingComponentWhileAddingAField, isCreatingContentType, isCreatingDz, isComponentModal, isDzAttribute, isEditingAttribute, isInFirstComponentStep, onSubmitAddComponentAttribute, onSubmitAddComponentToDz, onSubmitCreateContentType, onSubmitCreateComponent, onSubmitCreateDz, onSubmitEditAttribute, onSubmitEditComponent, onSubmitEditContentType, onSubmitEditCustomFieldAttribute, onSubmitEditDz, onClickFinish, }: FormModalEndActionsProps) => import("react/jsx-runtime").JSX.Element | null;
export {};
