'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var Icons = require('@strapi/icons');
var reactIntl = require('react-intl');
var getTrad = require('../utils/getTrad.js');

const FormModalEndActions = ({ deleteComponent, deleteContentType, isAttributeModal, isCustomFieldModal, isComponentAttribute, isComponentToDzModal, isContentTypeModal, isCreatingComponent, isCreatingComponentAttribute, isCreatingComponentInDz, isCreatingComponentWhileAddingAField, isCreatingContentType, isCreatingDz, isComponentModal, isDzAttribute, isEditingAttribute, isInFirstComponentStep, onSubmitAddComponentAttribute, onSubmitAddComponentToDz, onSubmitCreateContentType, onSubmitCreateComponent, onSubmitCreateDz, onSubmitEditAttribute, onSubmitEditComponent, onSubmitEditContentType, onSubmitEditCustomFieldAttribute, onSubmitEditDz, onClickFinish })=>{
    const { formatMessage } = reactIntl.useIntl();
    if (isComponentToDzModal) {
        if (isCreatingComponentInDz) {
            return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                variant: "secondary",
                type: "submit",
                onClick: (e)=>{
                    e.preventDefault();
                    onSubmitAddComponentToDz(e, true);
                },
                startIcon: /*#__PURE__*/ jsxRuntime.jsx(Icons.Plus, {}),
                children: formatMessage({
                    id: getTrad.getTrad('form.button.add-first-field-to-created-component'),
                    defaultMessage: 'Add first field to the component'
                })
            });
        }
        return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
            variant: "default",
            type: "submit",
            onClick: (e)=>{
                e.preventDefault();
                onSubmitAddComponentToDz(e, false);
            },
            children: formatMessage({
                id: 'global.finish',
                defaultMessage: 'Finish'
            })
        });
    }
    if (isAttributeModal && isDzAttribute && !isCreatingDz) {
        return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
            variant: "default",
            type: "submit",
            onClick: (e)=>{
                e.preventDefault();
                onClickFinish();
                onSubmitEditDz(e, false);
            },
            children: formatMessage({
                id: 'global.finish',
                defaultMessage: 'Finish'
            })
        });
    }
    if (isAttributeModal && isDzAttribute && isCreatingDz) {
        return /*#__PURE__*/ jsxRuntime.jsx(jsxRuntime.Fragment, {
            children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                variant: "secondary",
                type: "submit",
                onClick: (e)=>{
                    e.preventDefault();
                    onSubmitCreateDz(e, true);
                },
                startIcon: /*#__PURE__*/ jsxRuntime.jsx(Icons.Plus, {}),
                children: formatMessage({
                    id: getTrad.getTrad('form.button.add-components-to-dynamiczone'),
                    defaultMessage: 'Add components to the zone'
                })
            })
        });
    }
    if (isAttributeModal && isComponentAttribute) {
        if (isInFirstComponentStep) {
            return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                variant: "secondary",
                type: "submit",
                onClick: (e)=>{
                    e.preventDefault();
                    onSubmitAddComponentAttribute(e, true);
                },
                children: isCreatingComponentAttribute ? formatMessage({
                    id: getTrad.getTrad('form.button.configure-component'),
                    defaultMessage: 'Configure the component'
                }) : formatMessage({
                    id: getTrad.getTrad('form.button.select-component'),
                    defaultMessage: 'Configure the component'
                })
            });
        }
        return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
            gap: 2,
            children: [
                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                    variant: "secondary",
                    type: "submit",
                    onClick: (e)=>{
                        e.preventDefault();
                        onSubmitAddComponentAttribute(e, true);
                    },
                    startIcon: /*#__PURE__*/ jsxRuntime.jsx(Icons.Plus, {}),
                    children: isCreatingComponentWhileAddingAField ? formatMessage({
                        id: getTrad.getTrad('form.button.add-first-field-to-created-component'),
                        defaultMessage: 'Add first field to the component'
                    }) : formatMessage({
                        id: getTrad.getTrad('form.button.add-field'),
                        defaultMessage: 'Add another field'
                    })
                }),
                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                    variant: "default",
                    type: "button",
                    onClick: (e)=>{
                        e.preventDefault();
                        onClickFinish();
                        onSubmitAddComponentAttribute(e, false);
                    },
                    children: formatMessage({
                        id: 'global.finish',
                        defaultMessage: 'Finish'
                    })
                })
            ]
        });
    }
    if (isAttributeModal && !isComponentAttribute && !isDzAttribute) {
        return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
            gap: 2,
            children: [
                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                    type: isEditingAttribute ? 'button' : 'submit',
                    variant: "secondary",
                    onClick: (e)=>{
                        e.preventDefault();
                        onSubmitEditAttribute(e, true);
                    },
                    startIcon: /*#__PURE__*/ jsxRuntime.jsx(Icons.Plus, {}),
                    children: formatMessage({
                        id: getTrad.getTrad('form.button.add-field'),
                        defaultMessage: 'Add another field'
                    })
                }),
                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                    type: isEditingAttribute ? 'submit' : 'button',
                    variant: "default",
                    onClick: (e)=>{
                        e.preventDefault();
                        onClickFinish();
                        onSubmitEditAttribute(e, false);
                    },
                    children: formatMessage({
                        id: 'global.finish',
                        defaultMessage: 'Finish'
                    })
                })
            ]
        });
    }
    if (isContentTypeModal) {
        return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
            gap: 2,
            children: [
                !isCreatingContentType && /*#__PURE__*/ jsxRuntime.jsxs(jsxRuntime.Fragment, {
                    children: [
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                            type: "button",
                            variant: "danger",
                            onClick: (e)=>{
                                e.preventDefault();
                                deleteContentType();
                            },
                            children: formatMessage({
                                id: 'global.delete',
                                defaultMessage: 'Delete'
                            })
                        }),
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                            type: "submit",
                            variant: "default",
                            onClick: (e)=>{
                                e.preventDefault();
                                onSubmitEditContentType(e, false);
                            },
                            children: formatMessage({
                                id: 'global.finish',
                                defaultMessage: 'Finish'
                            })
                        })
                    ]
                }),
                isCreatingContentType && /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                    type: "submit",
                    variant: "secondary",
                    onClick: (e)=>{
                        e.preventDefault();
                        onSubmitCreateContentType(e, true);
                    },
                    children: formatMessage({
                        id: 'global.continue',
                        defaultMessage: 'Continue'
                    })
                })
            ]
        });
    }
    if (isComponentModal) {
        return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
            gap: 2,
            children: [
                !isCreatingComponent && /*#__PURE__*/ jsxRuntime.jsxs(jsxRuntime.Fragment, {
                    children: [
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                            type: "button",
                            variant: "danger",
                            onClick: (e)=>{
                                e.preventDefault();
                                deleteComponent();
                            },
                            children: formatMessage({
                                id: 'global.delete',
                                defaultMessage: 'Delete'
                            })
                        }),
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                            type: "submit",
                            variant: "default",
                            onClick: (e)=>{
                                e.preventDefault();
                                onSubmitEditComponent(e, false);
                            },
                            children: formatMessage({
                                id: 'global.finish',
                                defaultMessage: 'Finish'
                            })
                        })
                    ]
                }),
                isCreatingComponent && /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                    type: "submit",
                    variant: "secondary",
                    onClick: (e)=>{
                        e.preventDefault();
                        onSubmitCreateComponent(e, true);
                    },
                    children: formatMessage({
                        id: 'global.continue',
                        defaultMessage: 'Continue'
                    })
                })
            ]
        });
    }
    if (isCustomFieldModal) {
        return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
            gap: 2,
            children: [
                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                    type: isEditingAttribute ? 'button' : 'submit',
                    variant: "secondary",
                    onClick: (e)=>{
                        e.preventDefault();
                        onSubmitEditCustomFieldAttribute(e, true);
                    },
                    startIcon: /*#__PURE__*/ jsxRuntime.jsx(Icons.Plus, {}),
                    children: formatMessage({
                        id: getTrad.getTrad('form.button.add-field'),
                        defaultMessage: 'Add another field'
                    })
                }),
                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                    type: isEditingAttribute ? 'submit' : 'button',
                    variant: "default",
                    onClick: (e)=>{
                        e.preventDefault();
                        onClickFinish();
                        onSubmitEditCustomFieldAttribute(e, false);
                    },
                    children: formatMessage({
                        id: 'global.finish',
                        defaultMessage: 'Finish'
                    })
                })
            ]
        });
    }
    return null;
};

exports.FormModalEndActions = FormModalEndActions;
//# sourceMappingURL=FormModalEndActions.js.map
