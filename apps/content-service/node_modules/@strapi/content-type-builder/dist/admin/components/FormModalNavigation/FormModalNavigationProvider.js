'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var FormModalNavigationContext = require('./FormModalNavigationContext.js');

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
    const [state, setFormModalNavigationState] = React.useState(INITIAL_STATE_DATA);
    const { trackUsage } = strapiAdmin.useTracking();
    const onClickSelectCustomField = React.useCallback(({ attributeType, customFieldUid })=>{
        setFormModalNavigationState((prevState)=>({
                ...prevState,
                actionType: 'create',
                modalType: 'customField',
                attributeType,
                customFieldUid,
                activeTab: 'basic'
            }));
    }, []);
    const onClickSelectField = React.useCallback(({ attributeType, step })=>{
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
    const onOpenModalAddComponentsToDZ = React.useCallback(({ dynamicZoneTarget, targetUid })=>{
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
    const onOpenModalAddField = React.useCallback(({ forTarget, targetUid })=>{
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
    const onOpenModalCreateSchema = React.useCallback((nextState)=>{
        setFormModalNavigationState((prevState)=>({
                ...prevState,
                ...nextState,
                isOpen: true,
                activeTab: 'basic'
            }));
    }, []);
    const onOpenModalEditCustomField = React.useCallback(({ forTarget, targetUid, attributeName, attributeType, customFieldUid })=>{
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
    const onOpenModalEditField = React.useCallback(({ forTarget, targetUid, attributeName, attributeType, step })=>{
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
    const onOpenModalEditSchema = React.useCallback(({ modalType, forTarget, targetUid, kind })=>{
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
    const onCloseModal = React.useCallback(()=>{
        setFormModalNavigationState(INITIAL_STATE_DATA);
    }, []);
    const onNavigateToChooseAttributeModal = React.useCallback(({ forTarget, targetUid })=>{
        setFormModalNavigationState((prev)=>({
                ...prev,
                forTarget,
                targetUid,
                modalType: 'chooseAttribute',
                activeTab: 'basic'
            }));
    }, []);
    const onNavigateToCreateComponentStep2 = React.useCallback(()=>{
        setFormModalNavigationState((prev)=>({
                ...prev,
                attributeType: 'component',
                modalType: 'attribute',
                step: '2',
                activeTab: 'basic'
            }));
    }, []);
    const onNavigateToAddCompoToDZModal = React.useCallback(({ dynamicZoneTarget })=>{
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
    const setActiveTab = React.useCallback((value)=>{
        setFormModalNavigationState((prev)=>({
                ...prev,
                activeTab: value
            }));
    }, []);
    const contextValue = React.useMemo(()=>({
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
    return /*#__PURE__*/ jsxRuntime.jsx(FormModalNavigationContext.FormModalNavigationContext.Provider, {
        value: contextValue,
        children: children
    });
};

exports.FormModalNavigationProvider = FormModalNavigationProvider;
exports.INITIAL_STATE_DATA = INITIAL_STATE_DATA;
//# sourceMappingURL=FormModalNavigationProvider.js.map
