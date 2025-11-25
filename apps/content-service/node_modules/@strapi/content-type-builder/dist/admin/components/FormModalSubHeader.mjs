import { jsxs, jsx } from 'react/jsx-runtime';
import { Flex, Typography } from '@strapi/design-system';
import upperFirst from 'lodash/upperFirst';
import { useIntl } from 'react-intl';
import { getTrad } from '../utils/getTrad.mjs';

const getModalTitleSubHeader = ({ modalType, forTarget, kind, actionType, step })=>{
    switch(modalType){
        case 'chooseAttribute':
            return getTrad(`modalForm.sub-header.chooseAttribute.${forTarget?.includes('component') ? 'component' : kind || 'collectionType'}`);
        case 'attribute':
            {
                return getTrad(`modalForm.sub-header.attribute.${actionType}${step !== 'null' && step !== null && actionType !== 'edit' ? '.step' : ''}`);
            }
        case 'customField':
            {
                return getTrad(`modalForm.sub-header.attribute.${actionType}`);
            }
        case 'addComponentToDynamicZone':
            return getTrad('modalForm.sub-header.addComponentToDynamicZone');
        default:
            return getTrad('configurations');
    }
};
const FormModalSubHeader = ({ actionType, modalType, forTarget, kind, step, attributeType, attributeName, customField })=>{
    const { formatMessage } = useIntl();
    const intlLabel = modalType === 'customField' ? customField?.intlLabel : {
        id: getTrad(`attribute.${attributeType}`)
    };
    return /*#__PURE__*/ jsxs(Flex, {
        direction: "column",
        alignItems: "flex-start",
        paddingBottom: 1,
        gap: 1,
        children: [
            /*#__PURE__*/ jsx(Typography, {
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
            /*#__PURE__*/ jsx(Typography, {
                variant: "pi",
                textColor: "neutral600",
                children: formatMessage({
                    id: getTrad(`attribute.${attributeType}.description`),
                    defaultMessage: 'A type for modeling data'
                })
            })
        ]
    });
};

export { FormModalSubHeader, getModalTitleSubHeader };
//# sourceMappingURL=FormModalSubHeader.mjs.map
