import { jsxs, jsx } from 'react/jsx-runtime';
import * as React from 'react';
import { Modal, Breadcrumbs, Crumb, Typography, Button, Flex, Box, MultiSelectNested } from '@strapi/design-system';
import { produce } from 'immer';
import get from 'lodash/get';
import groupBy from 'lodash/groupBy';
import upperFirst from 'lodash/upperFirst';
import { useIntl } from 'react-intl';
import { capitalise } from '../../../../../utils/strings.mjs';
import { usePermissionsDataManager } from '../hooks/usePermissionsDataManager.mjs';

const ConditionsModal = ({ actions = [], headerBreadCrumbs = [], isFormDisabled, onClose })=>{
    const { formatMessage } = useIntl();
    const { availableConditions, modifiedData, onChangeConditions } = usePermissionsDataManager();
    const arrayOfOptionsGroupedByCategory = React.useMemo(()=>{
        return Object.entries(groupBy(availableConditions, 'category'));
    }, [
        availableConditions
    ]);
    const actionsToDisplay = actions.filter(// @ts-expect-error – TODO: fix this type issue
    ({ isDisplayed, hasSomeActionsSelected, hasAllActionsSelected })=>isDisplayed && Boolean(hasSomeActionsSelected || hasAllActionsSelected));
    const [state, setState] = React.useState(createDefaultConditionsForm(actionsToDisplay, modifiedData, arrayOfOptionsGroupedByCategory));
    const handleChange = (name, values)=>{
        setState(produce((draft)=>{
            if (!draft[name]) {
                draft[name] = {};
            }
            if (!draft[name].default) {
                draft[name].default = {};
            }
            draft[name].default = values;
        }));
    };
    const handleSubmit = ()=>{
        const conditionsWithoutCategory = Object.entries(state).reduce((acc, current)=>{
            const [key, value] = current;
            const merged = Object.values(value).reduce((acc1, current1)=>{
                return {
                    ...acc1,
                    ...current1
                };
            }, {});
            acc[key] = merged;
            return acc;
        }, {});
        onChangeConditions(conditionsWithoutCategory);
        onClose && onClose();
    };
    const onCloseModal = ()=>{
        setState(createDefaultConditionsForm(actionsToDisplay, modifiedData, arrayOfOptionsGroupedByCategory));
        onClose && onClose();
    };
    return /*#__PURE__*/ jsxs(Modal.Content, {
        children: [
            /*#__PURE__*/ jsx(Modal.Header, {
                children: /*#__PURE__*/ jsx(Breadcrumbs, {
                    id: "condition-modal-breadcrumbs",
                    label: headerBreadCrumbs.join(', '),
                    children: headerBreadCrumbs.map((label, index, arr)=>/*#__PURE__*/ jsx(Crumb, {
                            isCurrent: index === arr.length - 1,
                            children: upperFirst(formatMessage({
                                id: label,
                                defaultMessage: label
                            }))
                        }, label))
                })
            }),
            /*#__PURE__*/ jsxs(Modal.Body, {
                children: [
                    actionsToDisplay.length === 0 && /*#__PURE__*/ jsx(Typography, {
                        children: formatMessage({
                            id: 'Settings.permissions.conditions.no-actions',
                            defaultMessage: 'You first need to select actions (create, read, update, ...) before defining conditions on them.'
                        })
                    }),
                    /*#__PURE__*/ jsx("ul", {
                        children: actionsToDisplay.map(({ actionId, label, pathToConditionsObject }, index)=>{
                            const name = pathToConditionsObject.join('..');
                            return /*#__PURE__*/ jsx(ActionRow, {
                                arrayOfOptionsGroupedByCategory: arrayOfOptionsGroupedByCategory,
                                label: label,
                                isFormDisabled: isFormDisabled,
                                isGrey: index % 2 === 0,
                                name: name,
                                onChange: handleChange,
                                value: get(state, name, {})
                            }, actionId);
                        })
                    })
                ]
            }),
            /*#__PURE__*/ jsxs(Modal.Footer, {
                children: [
                    /*#__PURE__*/ jsx(Button, {
                        variant: "tertiary",
                        onClick: ()=>onCloseModal(),
                        children: formatMessage({
                            id: 'app.components.Button.cancel',
                            defaultMessage: 'Cancel'
                        })
                    }),
                    /*#__PURE__*/ jsx(Button, {
                        onClick: handleSubmit,
                        children: formatMessage({
                            id: 'Settings.permissions.conditions.apply',
                            defaultMessage: 'Apply'
                        })
                    })
                ]
            })
        ]
    });
};
const createDefaultConditionsForm = (actionsToDisplay, modifiedData, arrayOfOptionsGroupedByCategory)=>{
    return actionsToDisplay.reduce((acc, current)=>{
        const valueFromModifiedData = get(modifiedData, [
            ...current.pathToConditionsObject,
            'conditions'
        ], {});
        const categoryDefaultForm = arrayOfOptionsGroupedByCategory.reduce((acc, current)=>{
            const [categoryName, relatedConditions] = current;
            const conditionsForm = relatedConditions.reduce((acc, current)=>{
                acc[current.id] = get(valueFromModifiedData, current.id, false);
                return acc;
            }, {});
            acc[categoryName] = conditionsForm;
            return acc;
        }, {});
        acc[current.pathToConditionsObject.join('..')] = categoryDefaultForm;
        return acc;
    }, {});
};
const ActionRow = ({ arrayOfOptionsGroupedByCategory, isFormDisabled = false, isGrey = false, label, name, onChange, value })=>{
    const { formatMessage } = useIntl();
    const handleChange = (val)=>{
        if (onChange) {
            onChange(name, getNewStateFromChangedValues(arrayOfOptionsGroupedByCategory, val));
        }
    };
    return /*#__PURE__*/ jsxs(Flex, {
        tag: "li",
        background: isGrey ? 'neutral100' : 'neutral0',
        paddingBottom: 3,
        paddingTop: 3,
        justifyContent: 'space-evenly',
        children: [
            /*#__PURE__*/ jsxs(Flex, {
                style: {
                    width: 180
                },
                children: [
                    /*#__PURE__*/ jsxs(Typography, {
                        variant: "sigma",
                        textColor: "neutral600",
                        children: [
                            formatMessage({
                                id: 'Settings.permissions.conditions.can',
                                defaultMessage: 'Can'
                            }),
                            " "
                        ]
                    }),
                    /*#__PURE__*/ jsx(Typography, {
                        variant: "sigma",
                        title: label,
                        textColor: "primary600",
                        ellipsis: true,
                        children: formatMessage({
                            id: `Settings.roles.form.permissions.${label.toLowerCase()}`,
                            defaultMessage: label
                        })
                    }),
                    /*#__PURE__*/ jsxs(Typography, {
                        variant: "sigma",
                        textColor: "neutral600",
                        children: [
                            " ",
                            formatMessage({
                                id: 'Settings.permissions.conditions.when',
                                defaultMessage: 'When'
                            })
                        ]
                    })
                ]
            }),
            /*#__PURE__*/ jsx(Box, {
                style: {
                    maxWidth: 430,
                    width: '100%'
                },
                children: /*#__PURE__*/ jsx(MultiSelectNested, {
                    id: name,
                    customizeContent: (values = [])=>`${values.length} currently selected`,
                    onChange: handleChange,
                    value: getSelectedValues(value),
                    options: getNestedOptions(arrayOfOptionsGroupedByCategory),
                    disabled: isFormDisabled
                })
            })
        ]
    });
};
const getSelectedValues = (rawValue)=>Object.values(rawValue).map((x)=>Object.entries(x).filter(([, value])=>value).map(([key])=>key)).flat();
const getNestedOptions = (options)=>options.reduce((acc, [label, children])=>{
        acc.push({
            label: capitalise(label),
            children: children.map((child)=>({
                    label: child.displayName,
                    value: child.id
                }))
        });
        return acc;
    }, []);
const getNewStateFromChangedValues = (options, changedValues)=>options.map(([, values])=>values).flat().reduce((acc, curr)=>({
            [curr.id]: changedValues.includes(curr.id),
            ...acc
        }), {});

export { ConditionsModal };
//# sourceMappingURL=ConditionsModal.mjs.map
