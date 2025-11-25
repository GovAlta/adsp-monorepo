'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var designSystem = require('@strapi/design-system');
var Icons = require('@strapi/icons');
var reactIntl = require('react-intl');
var reactRouterDom = require('react-router-dom');
var styledComponents = require('styled-components');

const cmPermissions = {
    collectionTypesConfigurations: [
        {
            action: 'plugin::content-manager.collection-types.configure-view',
            subject: null
        }
    ],
    componentsConfigurations: [
        {
            action: 'plugin::content-manager.components.configure-layout',
            subject: null
        }
    ],
    singleTypesConfigurations: [
        {
            action: 'plugin::content-manager.single-types.configure-view',
            subject: null
        }
    ]
};
const getPermission = (type)=>{
    if (type.modelType === 'contentType') {
        if (type.kind === 'singleType') {
            return cmPermissions.singleTypesConfigurations;
        }
        return cmPermissions.collectionTypesConfigurations;
    }
    return cmPermissions.componentsConfigurations;
};
const getLink = (type)=>{
    switch(type.modelType){
        case 'contentType':
            switch(type.kind){
                case 'singleType':
                    return `/content-manager/single-types/${type.uid}/configurations/edit`;
                case 'collectionType':
                    return `/content-manager/collection-types/${type.uid}/configurations/edit`;
            }
        case 'component':
            return `/content-manager/components/${type.uid}/configurations/edit`;
    }
};
const StyledButton = styledComponents.styled(designSystem.Button)`
  white-space: nowrap;
`;
const LinkToCMSettingsView = /*#__PURE__*/ React.memo(({ disabled, type })=>{
    const { formatMessage } = reactIntl.useIntl();
    const navigate = reactRouterDom.useNavigate();
    const permissionsToApply = getPermission(type);
    const label = formatMessage({
        id: 'content-type-builder.form.button.configure-view',
        defaultMessage: 'Configure the view'
    });
    const handleClick = ()=>{
        if (disabled) {
            return false;
        }
        const link = getLink(type);
        navigate(link);
        return false;
    };
    const { isLoading, allowedActions } = strapiAdmin.useRBAC(permissionsToApply);
    if (isLoading) {
        return null;
    }
    if (!allowedActions.canConfigureView && !allowedActions.canConfigureLayout) {
        return null;
    }
    return /*#__PURE__*/ jsxRuntime.jsx(StyledButton, {
        startIcon: /*#__PURE__*/ jsxRuntime.jsx(Icons.ListPlus, {}),
        variant: "tertiary",
        onClick: handleClick,
        disabled: disabled,
        children: label
    });
});

exports.LinkToCMSettingsView = LinkToCMSettingsView;
//# sourceMappingURL=LinkToCMSettingsView.js.map
