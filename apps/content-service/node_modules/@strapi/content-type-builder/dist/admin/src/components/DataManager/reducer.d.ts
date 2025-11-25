import type { Components, ContentTypes, ContentType, Component } from '../../types';
import type { Internal, Struct } from '@strapi/types';
export interface DataManagerStateType {
    components: Components;
    initialComponents: Components;
    contentTypes: ContentTypes;
    initialContentTypes: ContentTypes;
    reservedNames: {
        models: string[];
        attributes: string[];
    };
    isLoading: boolean;
    [key: string]: any;
}
declare const initialState: DataManagerStateType;
type InitPayload = {
    components: Record<string, Component>;
    contentTypes: Record<string, ContentType>;
    reservedNames: DataManagerStateType['reservedNames'];
};
type AddAttributePayload = {
    attributeToSet: Record<string, any>;
    forTarget: Struct.ModelType;
    targetUid: string;
};
type AddCreateComponentToDynamicZonePayload = {
    forTarget: Struct.ModelType;
    targetUid: string;
    dynamicZoneTarget: string;
    componentsToAdd: Internal.UID.Component[];
};
type AddCustomFieldAttributePayload = {
    attributeToSet: Record<string, any>;
    forTarget: Struct.ModelType;
    targetUid: string;
};
type ChangeDynamicZoneComponentsPayload = {
    dynamicZoneTarget: string;
    newComponents: Internal.UID.Component[];
    forTarget: Struct.ModelType;
    targetUid: string;
};
type CreateComponentSchemaPayload = {
    uid: string;
    data: {
        icon: string;
        displayName: string;
    };
    componentCategory: string;
};
type CreateSchemaPayload = {
    uid: string;
    data: {
        displayName: string;
        singularName: string;
        pluralName: string;
        kind: Struct.ContentTypeKind;
        draftAndPublish: boolean;
        pluginOptions: Record<string, any>;
    };
};
type EditAttributePayload = {
    attributeToSet: Record<string, any>;
    forTarget: Struct.ModelType;
    targetUid: string;
    name: string;
};
type EditCustomFieldAttributePayload = {
    attributeToSet: Record<string, any>;
    forTarget: Struct.ModelType;
    targetUid: string;
    name: string;
};
type RemoveComponentFromDynamicZonePayload = {
    forTarget: Struct.ModelType;
    targetUid: string;
    dzName: string;
    componentToRemoveIndex: number;
};
type RemoveFieldPayload = {
    forTarget: Struct.ModelType;
    targetUid: string;
    attributeToRemoveName: string;
};
type UpdateComponentSchemaPayload = {
    data: {
        icon: string;
        displayName: string;
    };
    uid: Internal.UID.Component;
};
type UpdateComponentUIDPayload = {
    uid: Internal.UID.Component;
    newComponentUID: Internal.UID.Component;
};
type UpdateSchemaPayload = {
    data: {
        displayName: string;
        kind: Struct.ContentTypeKind;
        draftAndPublish: boolean;
        pluginOptions: Record<string, any>;
    };
    uid: string;
};
type MoveAttributePayload = {
    forTarget: Struct.ModelType;
    targetUid: string;
    from: number;
    to: number;
};
declare const slice: import("@reduxjs/toolkit").Slice<import("./undoRedo").UndoRedoState<DataManagerStateType>, {
    init: import("@reduxjs/toolkit").CaseReducer<import("./undoRedo").UndoRedoState<DataManagerStateType>, {
        payload: InitPayload;
        type: string;
    }>;
    createComponentSchema: import("@reduxjs/toolkit").CaseReducer<import("./undoRedo").UndoRedoState<DataManagerStateType>, {
        payload: CreateComponentSchemaPayload;
        type: string;
    }>;
    createSchema: import("@reduxjs/toolkit").CaseReducer<import("./undoRedo").UndoRedoState<DataManagerStateType>, {
        payload: CreateSchemaPayload;
        type: string;
    }>;
    addAttribute: import("@reduxjs/toolkit").CaseReducer<import("./undoRedo").UndoRedoState<DataManagerStateType>, {
        payload: AddAttributePayload;
        type: string;
    }>;
    moveAttribute: import("@reduxjs/toolkit").CaseReducer<import("./undoRedo").UndoRedoState<DataManagerStateType>, {
        payload: MoveAttributePayload;
        type: string;
    }>;
    addCustomFieldAttribute: import("@reduxjs/toolkit").CaseReducer<import("./undoRedo").UndoRedoState<DataManagerStateType>, {
        payload: AddCustomFieldAttributePayload;
        type: string;
    }>;
    addCreatedComponentToDynamicZone: import("@reduxjs/toolkit").CaseReducer<import("./undoRedo").UndoRedoState<DataManagerStateType>, {
        payload: AddCreateComponentToDynamicZonePayload;
        type: string;
    }>;
    changeDynamicZoneComponents: import("@reduxjs/toolkit").CaseReducer<import("./undoRedo").UndoRedoState<DataManagerStateType>, {
        payload: ChangeDynamicZoneComponentsPayload;
        type: string;
    }>;
    editAttribute: import("@reduxjs/toolkit").CaseReducer<import("./undoRedo").UndoRedoState<DataManagerStateType>, {
        payload: EditAttributePayload;
        type: string;
    }>;
    editCustomFieldAttribute: import("@reduxjs/toolkit").CaseReducer<import("./undoRedo").UndoRedoState<DataManagerStateType>, {
        payload: EditCustomFieldAttributePayload;
        type: string;
    }>;
    reloadPlugin: import("@reduxjs/toolkit").CaseReducer<import("./undoRedo").UndoRedoState<DataManagerStateType>, import("redux").Action<any>>;
    removeComponentFromDynamicZone: import("@reduxjs/toolkit").CaseReducer<import("./undoRedo").UndoRedoState<DataManagerStateType>, {
        payload: RemoveComponentFromDynamicZonePayload;
        type: string;
    }>;
    removeField: import("@reduxjs/toolkit").CaseReducer<import("./undoRedo").UndoRedoState<DataManagerStateType>, {
        payload: RemoveFieldPayload;
        type: string;
    }>;
    updateComponentSchema: import("@reduxjs/toolkit").CaseReducer<import("./undoRedo").UndoRedoState<DataManagerStateType>, {
        payload: UpdateComponentSchemaPayload;
        type: string;
    }>;
    updateComponentUid: import("@reduxjs/toolkit").CaseReducer<import("./undoRedo").UndoRedoState<DataManagerStateType>, {
        payload: UpdateComponentUIDPayload;
        type: string;
    }>;
    updateSchema: import("@reduxjs/toolkit").CaseReducer<import("./undoRedo").UndoRedoState<DataManagerStateType>, {
        payload: UpdateSchemaPayload;
        type: string;
    }>;
    deleteComponent: import("@reduxjs/toolkit").CaseReducer<import("./undoRedo").UndoRedoState<DataManagerStateType>, {
        payload: `${string}.${string}`;
        type: string;
    }>;
    deleteContentType: import("@reduxjs/toolkit").CaseReducer<import("./undoRedo").UndoRedoState<DataManagerStateType>, {
        payload: `admin::${string}` | `strapi::${string}` | `api::${string}.${string}` | `plugin::${string}.${string}`;
        type: string;
    }>;
    applyChange: import("@reduxjs/toolkit").CaseReducer<import("./undoRedo").UndoRedoState<DataManagerStateType>, {
        payload: {
            action: 'add' | 'update' | 'delete';
            schema: ContentType | Component;
        };
        type: string;
    }>;
} & {
    undo: import("@reduxjs/toolkit").CaseReducer<import("./undoRedo").UndoRedoState<DataManagerStateType>>;
    redo: import("@reduxjs/toolkit").CaseReducer<import("./undoRedo").UndoRedoState<DataManagerStateType>>;
    discardAll: import("@reduxjs/toolkit").CaseReducer<import("./undoRedo").UndoRedoState<DataManagerStateType>>;
    clearHistory: import("@reduxjs/toolkit").CaseReducer<import("./undoRedo").UndoRedoState<DataManagerStateType>>;
}, string>;
export type State = ReturnType<typeof slice.reducer>;
export declare const reducer: import("redux").Reducer<import("./undoRedo").UndoRedoState<DataManagerStateType>>, actions: import("@reduxjs/toolkit").CaseReducerActions<{
    init: import("@reduxjs/toolkit").CaseReducer<import("./undoRedo").UndoRedoState<DataManagerStateType>, {
        payload: InitPayload;
        type: string;
    }>;
    createComponentSchema: import("@reduxjs/toolkit").CaseReducer<import("./undoRedo").UndoRedoState<DataManagerStateType>, {
        payload: CreateComponentSchemaPayload;
        type: string;
    }>;
    createSchema: import("@reduxjs/toolkit").CaseReducer<import("./undoRedo").UndoRedoState<DataManagerStateType>, {
        payload: CreateSchemaPayload;
        type: string;
    }>;
    addAttribute: import("@reduxjs/toolkit").CaseReducer<import("./undoRedo").UndoRedoState<DataManagerStateType>, {
        payload: AddAttributePayload;
        type: string;
    }>;
    moveAttribute: import("@reduxjs/toolkit").CaseReducer<import("./undoRedo").UndoRedoState<DataManagerStateType>, {
        payload: MoveAttributePayload;
        type: string;
    }>;
    addCustomFieldAttribute: import("@reduxjs/toolkit").CaseReducer<import("./undoRedo").UndoRedoState<DataManagerStateType>, {
        payload: AddCustomFieldAttributePayload;
        type: string;
    }>;
    addCreatedComponentToDynamicZone: import("@reduxjs/toolkit").CaseReducer<import("./undoRedo").UndoRedoState<DataManagerStateType>, {
        payload: AddCreateComponentToDynamicZonePayload;
        type: string;
    }>;
    changeDynamicZoneComponents: import("@reduxjs/toolkit").CaseReducer<import("./undoRedo").UndoRedoState<DataManagerStateType>, {
        payload: ChangeDynamicZoneComponentsPayload;
        type: string;
    }>;
    editAttribute: import("@reduxjs/toolkit").CaseReducer<import("./undoRedo").UndoRedoState<DataManagerStateType>, {
        payload: EditAttributePayload;
        type: string;
    }>;
    editCustomFieldAttribute: import("@reduxjs/toolkit").CaseReducer<import("./undoRedo").UndoRedoState<DataManagerStateType>, {
        payload: EditCustomFieldAttributePayload;
        type: string;
    }>;
    reloadPlugin: import("@reduxjs/toolkit").CaseReducer<import("./undoRedo").UndoRedoState<DataManagerStateType>, import("redux").Action<any>>;
    removeComponentFromDynamicZone: import("@reduxjs/toolkit").CaseReducer<import("./undoRedo").UndoRedoState<DataManagerStateType>, {
        payload: RemoveComponentFromDynamicZonePayload;
        type: string;
    }>;
    removeField: import("@reduxjs/toolkit").CaseReducer<import("./undoRedo").UndoRedoState<DataManagerStateType>, {
        payload: RemoveFieldPayload;
        type: string;
    }>;
    updateComponentSchema: import("@reduxjs/toolkit").CaseReducer<import("./undoRedo").UndoRedoState<DataManagerStateType>, {
        payload: UpdateComponentSchemaPayload;
        type: string;
    }>;
    updateComponentUid: import("@reduxjs/toolkit").CaseReducer<import("./undoRedo").UndoRedoState<DataManagerStateType>, {
        payload: UpdateComponentUIDPayload;
        type: string;
    }>;
    updateSchema: import("@reduxjs/toolkit").CaseReducer<import("./undoRedo").UndoRedoState<DataManagerStateType>, {
        payload: UpdateSchemaPayload;
        type: string;
    }>;
    deleteComponent: import("@reduxjs/toolkit").CaseReducer<import("./undoRedo").UndoRedoState<DataManagerStateType>, {
        payload: `${string}.${string}`;
        type: string;
    }>;
    deleteContentType: import("@reduxjs/toolkit").CaseReducer<import("./undoRedo").UndoRedoState<DataManagerStateType>, {
        payload: `admin::${string}` | `strapi::${string}` | `api::${string}.${string}` | `plugin::${string}.${string}`;
        type: string;
    }>;
    applyChange: import("@reduxjs/toolkit").CaseReducer<import("./undoRedo").UndoRedoState<DataManagerStateType>, {
        payload: {
            action: 'add' | 'update' | 'delete';
            schema: ContentType | Component;
        };
        type: string;
    }>;
} & {
    undo: import("@reduxjs/toolkit").CaseReducer<import("./undoRedo").UndoRedoState<DataManagerStateType>>;
    redo: import("@reduxjs/toolkit").CaseReducer<import("./undoRedo").UndoRedoState<DataManagerStateType>>;
    discardAll: import("@reduxjs/toolkit").CaseReducer<import("./undoRedo").UndoRedoState<DataManagerStateType>>;
    clearHistory: import("@reduxjs/toolkit").CaseReducer<import("./undoRedo").UndoRedoState<DataManagerStateType>>;
}, string>;
export { initialState };
