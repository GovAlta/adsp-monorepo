import { type PayloadAction } from '@reduxjs/toolkit';
import type { Schema, UID } from '@strapi/types';
export type State = {
    formErrors: Record<string, any>;
    modifiedData: Record<string, any>;
    initialData: Record<string, any>;
    componentToCreate: Record<string, any>;
    isCreatingComponentWhileAddingAField: boolean;
};
declare const initialState: State;
type OnChangePayload = {
    keys: string[];
    value: any;
};
type OnChangeRelationTargetPayload = {
    target: {
        oneThatIsCreatingARelationWithAnother: string;
        selectedContentTypeFriendlyName: string;
        targetContentTypeAllowedRelations: Schema.Attribute.RelationKind.Any[] | null;
        value: string;
    };
};
type OnChangeRelationTypePayload = {
    target: {
        oneThatIsCreatingARelationWithAnother: string;
        value: Schema.Attribute.RelationKind.Any;
    };
};
type ResetPropsAndSetFormForAddingAnExistingCompoPayload = {
    uid: UID.Schema;
    options?: Record<string, any>;
};
type ResetPropsAndSaveCurrentDataPayload = {
    uid: UID.Schema;
    options?: Record<string, any>;
};
type SetDataToEditPayload = {
    data: Record<string, any>;
};
type SetAttributeDataSchemaPayload = {
    isEditing: true;
    modifiedDataToSetForEditing: Record<string, any>;
    uid: UID.Schema;
} | {
    isEditing: false;
    modifiedDataToSetForEditing: Record<string, any>;
    attributeType: string;
    nameToSetForRelation: string;
    targetUid: string;
    step: string | null;
    options?: Record<string, any>;
    uid: UID.Schema;
};
type SetCustomFieldDataSchemaPayload = {
    isEditing: true;
    modifiedDataToSetForEditing: Record<string, any>;
    uid: UID.Schema;
} | {
    isEditing: false;
    modifiedDataToSetForEditing: Record<string, any>;
    customField: Record<string, any>;
    options?: Record<string, any>;
    uid: UID.Schema;
};
type SetDynamicZoneDataSchemaPayload = {
    attributeToEdit: Record<string, any>;
};
type SetErrorsPayload = {
    errors: Record<string, any>;
};
export { initialState };
export declare const actions: import("@reduxjs/toolkit").CaseReducerActions<{
    onChange: (state: import("immer/dist/internal.js").WritableDraft<State>, action: PayloadAction<OnChangePayload>) => void;
    onChangeRelationTarget: (state: import("immer/dist/internal.js").WritableDraft<State>, action: PayloadAction<OnChangeRelationTargetPayload>) => void;
    onChangeRelationType: (state: import("immer/dist/internal.js").WritableDraft<State>, action: PayloadAction<OnChangeRelationTypePayload>) => void;
    resetProps: () => State;
    resetPropsAndSetFormForAddingAnExistingCompo: (state: import("immer/dist/internal.js").WritableDraft<State>, action: PayloadAction<ResetPropsAndSetFormForAddingAnExistingCompoPayload>) => {
        modifiedData: {
            type: string;
            repeatable: boolean;
        };
        formErrors: Record<string, any>;
        initialData: Record<string, any>;
        componentToCreate: Record<string, any>;
        isCreatingComponentWhileAddingAField: boolean;
    };
    resetPropsAndSaveCurrentData: (state: import("immer/dist/internal.js").WritableDraft<State>, action: PayloadAction<ResetPropsAndSaveCurrentDataPayload>) => {
        componentToCreate: any;
        modifiedData: {
            component: `${string}.${string}`;
            displayName: any;
            type: string;
            repeatable: boolean;
        };
        isCreatingComponentWhileAddingAField: any;
        formErrors: Record<string, any>;
        initialData: Record<string, any>;
    };
    resetPropsAndSetTheFormForAddingACompoToADz: (state: import("immer/dist/internal.js").WritableDraft<State>) => {
        modifiedData: {
            createComponent: boolean;
            componentToCreate: {
                type: string;
            };
        };
        formErrors: Record<string, any>;
        initialData: Record<string, any>;
        componentToCreate: Record<string, any>;
        isCreatingComponentWhileAddingAField: boolean;
    };
    setDataToEdit: (state: import("immer/dist/internal.js").WritableDraft<State>, action: PayloadAction<SetDataToEditPayload>) => void;
    setAttributeDataSchema: (state: import("immer/dist/internal.js").WritableDraft<State>, action: PayloadAction<SetAttributeDataSchemaPayload>) => void;
    setCustomFieldDataSchema: (state: import("immer/dist/internal.js").WritableDraft<State>, action: PayloadAction<SetCustomFieldDataSchemaPayload>) => void;
    setDynamicZoneDataSchema: (state: import("immer/dist/internal.js").WritableDraft<State>, action: PayloadAction<SetDynamicZoneDataSchemaPayload>) => void;
    setErrors: (state: import("immer/dist/internal.js").WritableDraft<State>, action: PayloadAction<SetErrorsPayload>) => void;
}, "formModal">, reducer: import("redux").Reducer<State>;
