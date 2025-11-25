import { jsx } from 'react/jsx-runtime';
import 'react';
import { Typography } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { useI18n } from '../hooks/useI18n.mjs';
import { getTranslation } from '../utils/getTranslation.mjs';

const Emphasis = (chunks)=>{
    return /*#__PURE__*/ jsx(Typography, {
        fontWeight: "semiBold",
        textColor: "danger500",
        children: chunks
    });
};
const DeleteModalAdditionalInfo = ()=>{
    const { hasI18n } = useI18n();
    const { formatMessage } = useIntl();
    if (!hasI18n) {
        return null;
    }
    return /*#__PURE__*/ jsx(Typography, {
        textColor: "danger500",
        children: formatMessage({
            id: getTranslation('Settings.list.actions.deleteAdditionalInfos'),
            defaultMessage: 'This will delete the active locale versions <em>(from Internationalization)</em>'
        }, {
            em: Emphasis
        })
    });
};
const PublishModalAdditionalInfo = ()=>{
    const { hasI18n } = useI18n();
    const { formatMessage } = useIntl();
    if (!hasI18n) {
        return null;
    }
    return /*#__PURE__*/ jsx(Typography, {
        textColor: "danger500",
        children: formatMessage({
            id: getTranslation('Settings.list.actions.publishAdditionalInfos'),
            defaultMessage: 'This will publish the active locale versions <em>(from Internationalization)</em>'
        }, {
            em: Emphasis
        })
    });
};
const UnpublishModalAdditionalInfo = ()=>{
    const { hasI18n } = useI18n();
    const { formatMessage } = useIntl();
    if (!hasI18n) {
        return null;
    }
    return /*#__PURE__*/ jsx(Typography, {
        textColor: "danger500",
        children: formatMessage({
            id: getTranslation('Settings.list.actions.unpublishAdditionalInfos'),
            defaultMessage: 'This will unpublish the active locale versions <em>(from Internationalization)</em>'
        }, {
            em: Emphasis
        })
    });
};

export { DeleteModalAdditionalInfo, PublishModalAdditionalInfo, UnpublishModalAdditionalInfo };
//# sourceMappingURL=CMListViewModalsAdditionalInformation.mjs.map
