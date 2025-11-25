import { jsx } from 'react/jsx-runtime';
import { useNotification } from '@strapi/admin/strapi-admin';
import { useIntl } from 'react-intl';
import { getTrad } from '../utils/getTrad.mjs';
import { CustomRadioGroup } from './CustomRadioGroup/CustomRadioGroup.mjs';

const ContentTypeRadioGroup = ({ onChange, ...rest })=>{
    const { formatMessage } = useIntl();
    const { toggleNotification } = useNotification();
    const handleChange = (e)=>{
        toggleNotification({
            type: 'info',
            message: formatMessage({
                id: getTrad('contentType.kind.change.warning'),
                defaultMessage: 'You just changed the kind of a content type: API will be reset (routes, controllers, and services will be overwritten).'
            })
        });
        onChange(e);
    };
    return /*#__PURE__*/ jsx(CustomRadioGroup, {
        ...rest,
        onChange: handleChange
    });
};

export { ContentTypeRadioGroup };
//# sourceMappingURL=ContentTypeRadioGroup.mjs.map
