import { jsx } from 'react/jsx-runtime';
import { useState, useCallback, useMemo } from 'react';
import { useTracking } from '@strapi/admin/strapi-admin';
import { FormModalNavigationContext } from './FormModalNavigationContext.mjs';

const INITIAL_STATE_DATA = {
    actionType: null,
    attributeName: null,
    attributeType: null,
    dynamicZoneTarget: null,
    forTarget: null,
    modalType: null,
    isOpen: true,
    showBackLink: false,
    kind: null,
    step: null,
    targetUid: null,
    customFieldUid: null,
    activeTab: 'basic'
};
const FormModalNavigationProvider = ({ children })=>{
    const [state, setFormModalNavigationState] = useState(INITIAL_STATE_DATA);
    const { trackUsage } = useTracking();
    const onClickSelectCustomField = useCallback(({ attributeType, customFieldUid })=>{
        setFormModalNavigationState((prevState)=>({
                ...prevState,
                actionType: 'create',
                modalType: 'customField',
                attributeType,
                customFieldUid,
                activeTab: 'basic'
            }));
    }, []);
    const onClickSelectField = useCallback(({ attributeType, step })=>{
        if (state.forTarget === 'contentType') {
            trackUsage('didSelectContentTypeFieldType', {
                type: attributeType
            });
        }
        setFormModalNavigationState((prevState)=>({
                ...prevState,
                actionType: 'create',
                modalType: 'attribute',
                step,
                attributeType,
                showBackLink: true,
                activeTab: 'basic'
            }));
    }, [
        state.forTarget,
        trackUsage
    ]);
    const onOpenModalAddComponentsToDZ = useCallback(({ dynamicZoneTarget, targetUid })=>{
        setFormModalNavigationState((prevState)=>({
                ...prevState,
                dynamicZoneTarget,
                targetUid,
                modalType: 'addComponentToDynamicZone',
                forTarget: 'contentType',
                step: '1',
                actionType: 'edit',
                isOpen: true
            }));
    }, []);
    const onOpenModalAddField = useCallback(({ forTarget, targetUid })=>{
        setFormModalNavigationState((prevState)=>({
                ...prevState,
                actionType: 'create',
                forTarget,
                targetUid,
                modalType: 'chooseAttribute',
                isOpen: true,
                showBackLink: false,
                activeTab: 'basic'
            }));
    }, []);
    const onOpenModalCreateSchema = useCallback((nextState)=>{
        setFormModalNavigationState((prevState)=>({
                ...prevState,
                ...nextState,
                isOpen: true,
                activeTab: 'basic'
            }));
    }, []);
    const onOpenModalEditCustomField = useCallback(({ forTarget, targetUid, attributeName, attributeType, customFieldUid })=>{
        setFormModalNavigationState((prevState)=>({
                ...prevState,
                modalType: 'customField',
                customFieldUid,
                actionType: 'edit',
                forTarget,
                targetUid,
                attributeName,
                attributeType,
                isOpen: true,
                activeTab: 'basic'
            }));
    }, []);
    const onOpenModalEditField = useCallback(({ forTarget, targetUid, attributeName, attributeType, step })=>{
        setFormModalNavigationState((prevState)=>({
                ...prevState,
                modalType: 'attribute',
                actionType: 'edit',
                forTarget,
                targetUid,
                attributeName,
                attributeType,
                step,
                isOpen: true
            }));
    }, []);
    const onOpenModalEditSchema = useCallback(({ modalType, forTarget, targetUid, kind })=>{
        setFormModalNavigationState((prevState)=>({
                ...prevState,
                modalType,
                actionType: 'edit',
                forTarget,
                targetUid,
                kind,
                isOpen: true,
                activeTab: 'basic'
            }));
    }, []);
    const onCloseModal = useCallback(()=>{
        setFormModalNavigationState(INITIAL_STATE_DATA);
    }, []);
    const onNavigateToChooseAttributeModal = useCallback(({ forTarget, targetUid })=>{
        setFormModalNavigationState((prev)=>({
                ...prev,
                forTarget,
                targetUid,
                modalType: 'chooseAttribute',
                activeTab: 'basic'
            }));
    }, []);
    const onNavigateToCreateComponentStep2 = useCallback(()=>{
        setFormModalNavigationState((prev)=>({
                ...prev,
                attributeType: 'component',
                modalType: 'attribute',
                step: '2',
                activeTab: 'basic'
            }));
    }, []);
    const onNavigateToAddCompoToDZModal = useCallback(({ dynamicZoneTarget })=>{
        setFormModalNavigationState((prev)=>({
                ...prev,
                dynamicZoneTarget,
                modalType: 'addComponentToDynamicZone',
                actionType: 'create',
                step: '1',
                attributeType: null,
                attributeName: null,
                activeTab: 'basic'
            }));
    }, []);
    const setActiveTab = useCallback((value)=>{
        setFormModalNavigationState((prev)=>({
                ...prev,
                activeTab: value
            }));
    }, []);
    const contextValue = useMemo(()=>({
            ...state,
            onClickSelectField,
            onClickSelectCustomField,
            onCloseModal,
            onNavigateToChooseAttributeModal,
            onNavigateToAddCompoToDZModal,
            onOpenModalAddComponentsToDZ,
            onNavigateToCreateComponentStep2,
            onOpenModalAddField,
            onOpenModalCreateSchema,
            onOpenModalEditField,
            onOpenModalEditCustomField,
            onOpenModalEditSchema,
            setFormModalNavigationState,
            setActiveTab
        }), [
        state,
        onClickSelectField,
        onClickSelectCustomField,
        onCloseModal,
        onNavigateToChooseAttributeModal,
        onNavigateToAddCompoToDZModal,
        onOpenModalAddComponentsToDZ,
        onNavigateToCreateComponentStep2,
        onOpenModalAddField,
        onOpenModalCreateSchema,
        onOpenModalEditField,
        onOpenModalEditCustomField,
        onOpenModalEditSchema,
        setActiveTab
    ]);
    return /*#__PURE__*/ jsx(FormModalNavigationContext.Provider, {
        value: contextValue,
        children: children
    });
};

export { FormModalNavigationProvider, INITIAL_STATE_DATA };
//# sourceMappingURL=FormModalNavigationProvider.mjs.map
