'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var Icons = require('@strapi/icons');
var reactIntl = require('react-intl');
var translations = require('../../../utils/translations.js');

const AutoCloneFailureModalBody = ({ prohibitedFields })=>{
    const { formatMessage } = reactIntl.useIntl();
    const getDefaultErrorMessage = (reason)=>{
        switch(reason){
            case 'relation':
                return 'Duplicating the relation could remove it from the original entry.';
            case 'unique':
                return 'Identical values in a unique field are not allowed';
            default:
                return reason;
        }
    };
    return /*#__PURE__*/ jsxRuntime.jsxs(jsxRuntime.Fragment, {
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                variant: "beta",
                children: formatMessage({
                    id: translations.getTranslation('containers.list.autoCloneModal.title'),
                    defaultMessage: "This entry can't be duplicated directly."
                })
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                marginTop: 2,
                children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                    textColor: "neutral600",
                    children: formatMessage({
                        id: translations.getTranslation('containers.list.autoCloneModal.description'),
                        defaultMessage: "A new entry will be created with the same content, but you'll have to change the following fields to save it."
                    })
                })
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
                marginTop: 6,
                gap: 2,
                direction: "column",
                alignItems: "stretch",
                children: prohibitedFields.map(([fieldPath, reason])=>/*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                        direction: "column",
                        gap: 2,
                        alignItems: "flex-start",
                        borderColor: "neutral200",
                        hasRadius: true,
                        padding: 6,
                        children: [
                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
                                direction: "row",
                                tag: "ol",
                                children: fieldPath.map((pathSegment, index)=>/*#__PURE__*/ jsxRuntime.jsxs(designSystem.Typography, {
                                        fontWeight: "semiBold",
                                        tag: "li",
                                        children: [
                                            pathSegment,
                                            index !== fieldPath.length - 1 && /*#__PURE__*/ jsxRuntime.jsx(Icons.ChevronRight, {
                                                fill: "neutral500",
                                                height: "0.8rem",
                                                width: "0.8rem",
                                                style: {
                                                    margin: '0 0.8rem'
                                                }
                                            })
                                        ]
                                    }, index))
                            }),
                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                tag: "p",
                                textColor: "neutral600",
                                children: formatMessage({
                                    id: translations.getTranslation(`containers.list.autoCloneModal.error.${reason}`),
                                    defaultMessage: getDefaultErrorMessage(reason)
                                })
                            })
                        ]
                    }, fieldPath.join()))
            })
        ]
    });
};

exports.AutoCloneFailureModalBody = AutoCloneFailureModalBody;
//# sourceMappingURL=AutoCloneFailureModal.js.map
