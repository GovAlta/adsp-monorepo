'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var upperFirst = require('lodash/upperFirst');
var reactIntl = require('react-intl');
var getTrad = require('../utils/getTrad.js');

const getModalTitleSubHeader = ({ modalType, forTarget, kind, actionType, step })=>{
    switch(modalType){
        case 'chooseAttribute':
            return getTrad.getTrad(`modalForm.sub-header.chooseAttribute.${forTarget?.includes('component') ? 'component' : kind || 'collectionType'}`);
        case 'attribute':
            {
                return getTrad.getTrad(`modalForm.sub-header.attribute.${actionType}${step !== 'null' && step !== null && actionType !== 'edit' ? '.step' : ''}`);
            }
        case 'customField':
            {
                return getTrad.getTrad(`modalForm.sub-header.attribute.${actionType}`);
            }
        case 'addComponentToDynamicZone':
            return getTrad.getTrad('modalForm.sub-header.addComponentToDynamicZone');
        default:
            return getTrad.getTrad('configurations');
    }
};
const FormModalSubHeader = ({ actionType, modalType, forTarget, kind, step, attributeType, attributeName, customField })=>{
    const { formatMessage } = reactIntl.useIntl();
    const intlLabel = modalType === 'customField' ? customField?.intlLabel : {
        id: getTrad.getTrad(`attribute.${attributeType}`)
    };
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
        direction: "column",
        alignItems: "flex-start",
        paddingBottom: 1,
        gap: 1,
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                tag: "h2",
                variant: "beta",
                children: formatMessage({
                    id: getModalTitleSubHeader({
                        actionType,
                        forTarget,
                        kind,
                        step,
                        modalType
                    }),
                    defaultMessage: 'Add new field'
                }, {
                    type: intlLabel ? upperFirst(formatMessage(intlLabel)) : '',
                    name: upperFirst(attributeName),
                    step
                })
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                variant: "pi",
                textColor: "neutral600",
                children: formatMessage({
                    id: getTrad.getTrad(`attribute.${attributeType}.description`),
                    defaultMessage: 'A type for modeling data'
                })
            })
        ]
    });
};

exports.FormModalSubHeader = FormModalSubHeader;
exports.getModalTitleSubHeader = getModalTitleSubHeader;
//# sourceMappingURL=FormModalSubHeader.js.map
