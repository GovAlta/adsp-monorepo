import { jsx } from 'react/jsx-runtime';
import { memo } from 'react';
import { useRBAC } from '@strapi/admin/strapi-admin';
import { Button } from '@strapi/design-system';
import { ListPlus } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { useNavigate } from 'react-router-dom';
import { styled } from 'styled-components';

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
const StyledButton = styled(Button)`
  white-space: nowrap;
`;
const LinkToCMSettingsView = /*#__PURE__*/ memo(({ disabled, type })=>{
    const { formatMessage } = useIntl();
    const navigate = useNavigate();
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
    const { isLoading, allowedActions } = useRBAC(permissionsToApply);
    if (isLoading) {
        return null;
    }
    if (!allowedActions.canConfigureView && !allowedActions.canConfigureLayout) {
        return null;
    }
    return /*#__PURE__*/ jsx(StyledButton, {
        startIcon: /*#__PURE__*/ jsx(ListPlus, {}),
        variant: "tertiary",
        onClick: handleClick,
        disabled: disabled,
        children: label
    });
});

export { LinkToCMSettingsView };
//# sourceMappingURL=LinkToCMSettingsView.mjs.map
