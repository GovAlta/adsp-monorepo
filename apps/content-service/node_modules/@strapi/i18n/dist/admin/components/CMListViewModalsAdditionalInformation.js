'use strict';

var jsxRuntime = require('react/jsx-runtime');
require('react');
var designSystem = require('@strapi/design-system');
var reactIntl = require('react-intl');
var useI18n = require('../hooks/useI18n.js');
var getTranslation = require('../utils/getTranslation.js');

const Emphasis = (chunks)=>{
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
        fontWeight: "semiBold",
        textColor: "danger500",
        children: chunks
    });
};
const DeleteModalAdditionalInfo = ()=>{
    const { hasI18n } = useI18n.useI18n();
    const { formatMessage } = reactIntl.useIntl();
    if (!hasI18n) {
        return null;
    }
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
        textColor: "danger500",
        children: formatMessage({
            id: getTranslation.getTranslation('Settings.list.actions.deleteAdditionalInfos'),
            defaultMessage: 'This will delete the active locale versions <em>(from Internationalization)</em>'
        }, {
            em: Emphasis
        })
    });
};
const PublishModalAdditionalInfo = ()=>{
    const { hasI18n } = useI18n.useI18n();
    const { formatMessage } = reactIntl.useIntl();
    if (!hasI18n) {
        return null;
    }
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
        textColor: "danger500",
        children: formatMessage({
            id: getTranslation.getTranslation('Settings.list.actions.publishAdditionalInfos'),
            defaultMessage: 'This will publish the active locale versions <em>(from Internationalization)</em>'
        }, {
            em: Emphasis
        })
    });
};
const UnpublishModalAdditionalInfo = ()=>{
    const { hasI18n } = useI18n.useI18n();
    const { formatMessage } = reactIntl.useIntl();
    if (!hasI18n) {
        return null;
    }
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
        textColor: "danger500",
        children: formatMessage({
            id: getTranslation.getTranslation('Settings.list.actions.unpublishAdditionalInfos'),
            defaultMessage: 'This will unpublish the active locale versions <em>(from Internationalization)</em>'
        }, {
            em: Emphasis
        })
    });
};

exports.DeleteModalAdditionalInfo = DeleteModalAdditionalInfo;
exports.PublishModalAdditionalInfo = PublishModalAdditionalInfo;
exports.UnpublishModalAdditionalInfo = UnpublishModalAdditionalInfo;
//# sourceMappingURL=CMListViewModalsAdditionalInformation.js.map
