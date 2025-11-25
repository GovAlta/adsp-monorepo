import { jsx, jsxs } from 'react/jsx-runtime';
import * as React from 'react';
import { useTracking, useNotification, useAPIErrorHandler, Page, Layouts, Form } from '@strapi/admin/strapi-admin';
import { Main, Flex, Divider } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { Navigate } from 'react-router-dom';
import { SINGLE_TYPES } from '../../constants/collections.mjs';
import { useDoc } from '../../hooks/useDocument.mjs';
import { useDocLayout } from '../../hooks/useDocumentLayout.mjs';
import { useTypedSelector } from '../../modules/hooks.mjs';
import { useUpdateContentTypeConfigurationMutation } from '../../services/contentTypes.mjs';
import { setIn } from '../../utils/objects.mjs';
import { Header } from './components/Header.mjs';
import { Settings } from './components/Settings.mjs';
import { SortDisplayedFields } from './components/SortDisplayedFields.mjs';

const ListConfiguration = ()=>{
    const { formatMessage } = useIntl();
    const { trackUsage } = useTracking();
    const { toggleNotification } = useNotification();
    const { _unstableFormatAPIError: formatAPIError } = useAPIErrorHandler();
    const { model, collectionType } = useDoc();
    const { isLoading: isLoadingLayout, list, edit } = useDocLayout();
    const [updateContentTypeConfiguration] = useUpdateContentTypeConfigurationMutation();
    const handleSubmit = async (data)=>{
        try {
            trackUsage('willSaveContentTypeLayout');
            const layoutData = data.layout ?? [];
            /**
       * We reconstruct the metadatas object by taking the existing edit metadatas
       * and re-merging that by attribute name with the current list metadatas, whilst overwriting
       * the data from the form we've built.
       */ const meta = Object.entries(edit.metadatas).reduce((acc, [name, editMeta])=>{
                const { mainField: _mainField, ...listMeta } = list.metadatas[name];
                const { label, sortable } = layoutData.find((field)=>field.name === name) ?? {};
                acc[name] = {
                    edit: editMeta,
                    list: {
                        ...listMeta,
                        label: label || listMeta.label,
                        sortable: sortable || listMeta.sortable
                    }
                };
                return acc;
            }, {});
            const res = await updateContentTypeConfiguration({
                layouts: {
                    edit: edit.layout.flatMap((panel)=>panel.map((row)=>row.map(({ name, size })=>({
                                    name,
                                    size
                                })))),
                    list: layoutData.map((field)=>field.name)
                },
                settings: setIn(data.settings, 'displayName', undefined),
                metadatas: meta,
                uid: model
            });
            if ('data' in res) {
                trackUsage('didEditListSettings');
                toggleNotification({
                    type: 'success',
                    message: formatMessage({
                        id: 'notification.success.saved',
                        defaultMessage: 'Saved'
                    })
                });
            } else {
                toggleNotification({
                    type: 'danger',
                    message: formatAPIError(res.error)
                });
            }
        } catch (err) {
            console.error(err);
            toggleNotification({
                type: 'danger',
                message: formatMessage({
                    id: 'notification.error',
                    defaultMessage: 'An error occurred'
                })
            });
        }
    };
    const initialValues = React.useMemo(()=>{
        return {
            layout: list.layout.map(({ label, sortable, name })=>({
                    label: typeof label === 'string' ? label : formatMessage(label),
                    sortable,
                    name
                })),
            settings: list.settings
        };
    }, [
        formatMessage,
        list.layout,
        list.settings
    ]);
    if (collectionType === SINGLE_TYPES) {
        return /*#__PURE__*/ jsx(Navigate, {
            to: `/single-types/${model}`
        });
    }
    if (isLoadingLayout) {
        return /*#__PURE__*/ jsx(Page.Loading, {});
    }
    return /*#__PURE__*/ jsxs(Layouts.Root, {
        children: [
            /*#__PURE__*/ jsx(Page.Title, {
                children: `Configure ${list.settings.displayName} List View`
            }),
            /*#__PURE__*/ jsx(Main, {
                children: /*#__PURE__*/ jsxs(Form, {
                    initialValues: initialValues,
                    onSubmit: handleSubmit,
                    method: "PUT",
                    children: [
                        /*#__PURE__*/ jsx(Header, {
                            collectionType: collectionType,
                            model: model,
                            name: list.settings.displayName ?? ''
                        }),
                        /*#__PURE__*/ jsx(Layouts.Content, {
                            children: /*#__PURE__*/ jsxs(Flex, {
                                alignItems: "stretch",
                                background: "neutral0",
                                direction: "column",
                                gap: 6,
                                hasRadius: true,
                                shadow: "tableShadow",
                                paddingTop: 6,
                                paddingBottom: 6,
                                paddingLeft: 7,
                                paddingRight: 7,
                                position: "relative",
                                children: [
                                    /*#__PURE__*/ jsx(Settings, {}),
                                    /*#__PURE__*/ jsx(Divider, {}),
                                    /*#__PURE__*/ jsx(SortDisplayedFields, {})
                                ]
                            })
                        })
                    ]
                })
            })
        ]
    });
};
const ProtectedListConfiguration = ()=>{
    const permissions = useTypedSelector((state)=>state.admin_app.permissions.contentManager?.collectionTypesConfigurations);
    return /*#__PURE__*/ jsx(Page.Protect, {
        permissions: permissions,
        children: /*#__PURE__*/ jsx(ListConfiguration, {})
    });
};

export { ListConfiguration, ProtectedListConfiguration };
//# sourceMappingURL=ListConfigurationPage.mjs.map
