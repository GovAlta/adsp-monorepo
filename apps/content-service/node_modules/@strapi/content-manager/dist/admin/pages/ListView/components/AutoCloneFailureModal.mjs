import { jsxs, Fragment, jsx } from 'react/jsx-runtime';
import { Typography, Box, Flex } from '@strapi/design-system';
import { ChevronRight } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { getTranslation } from '../../../utils/translations.mjs';

const AutoCloneFailureModalBody = ({ prohibitedFields })=>{
    const { formatMessage } = useIntl();
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
    return /*#__PURE__*/ jsxs(Fragment, {
        children: [
            /*#__PURE__*/ jsx(Typography, {
                variant: "beta",
                children: formatMessage({
                    id: getTranslation('containers.list.autoCloneModal.title'),
                    defaultMessage: "This entry can't be duplicated directly."
                })
            }),
            /*#__PURE__*/ jsx(Box, {
                marginTop: 2,
                children: /*#__PURE__*/ jsx(Typography, {
                    textColor: "neutral600",
                    children: formatMessage({
                        id: getTranslation('containers.list.autoCloneModal.description'),
                        defaultMessage: "A new entry will be created with the same content, but you'll have to change the following fields to save it."
                    })
                })
            }),
            /*#__PURE__*/ jsx(Flex, {
                marginTop: 6,
                gap: 2,
                direction: "column",
                alignItems: "stretch",
                children: prohibitedFields.map(([fieldPath, reason])=>/*#__PURE__*/ jsxs(Flex, {
                        direction: "column",
                        gap: 2,
                        alignItems: "flex-start",
                        borderColor: "neutral200",
                        hasRadius: true,
                        padding: 6,
                        children: [
                            /*#__PURE__*/ jsx(Flex, {
                                direction: "row",
                                tag: "ol",
                                children: fieldPath.map((pathSegment, index)=>/*#__PURE__*/ jsxs(Typography, {
                                        fontWeight: "semiBold",
                                        tag: "li",
                                        children: [
                                            pathSegment,
                                            index !== fieldPath.length - 1 && /*#__PURE__*/ jsx(ChevronRight, {
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
                            /*#__PURE__*/ jsx(Typography, {
                                tag: "p",
                                textColor: "neutral600",
                                children: formatMessage({
                                    id: getTranslation(`containers.list.autoCloneModal.error.${reason}`),
                                    defaultMessage: getDefaultErrorMessage(reason)
                                })
                            })
                        ]
                    }, fieldPath.join()))
            })
        ]
    });
};

export { AutoCloneFailureModalBody };
//# sourceMappingURL=AutoCloneFailureModal.mjs.map
