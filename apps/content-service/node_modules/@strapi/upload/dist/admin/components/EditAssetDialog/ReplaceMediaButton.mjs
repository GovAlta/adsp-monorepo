import { jsxs, Fragment, jsx } from 'react/jsx-runtime';
import * as React from 'react';
import { useTracking } from '@strapi/admin/strapi-admin';
import { Button, VisuallyHidden } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import 'byte-size';
import 'date-fns';
import { getTrad } from '../../utils/getTrad.mjs';
import 'qs';
import '../../constants.mjs';
import '../../utils/urlYupSchema.mjs';

const ReplaceMediaButton = ({ onSelectMedia, acceptedMime, trackedLocation, ...props })=>{
    const { formatMessage } = useIntl();
    const inputRef = React.useRef(null);
    const { trackUsage } = useTracking();
    const handleClick = (e)=>{
        e.preventDefault();
        if (trackedLocation) {
            trackUsage('didReplaceMedia', {
                location: trackedLocation
            });
        }
        inputRef.current?.click();
    };
    const handleChange = ()=>{
        const file = inputRef.current?.files?.[0];
        onSelectMedia(file);
    };
    return /*#__PURE__*/ jsxs(Fragment, {
        children: [
            /*#__PURE__*/ jsx(Button, {
                variant: "secondary",
                onClick: handleClick,
                ...props,
                children: formatMessage({
                    id: getTrad('control-card.replace-media'),
                    defaultMessage: 'Replace media'
                })
            }),
            /*#__PURE__*/ jsx(VisuallyHidden, {
                children: /*#__PURE__*/ jsx("input", {
                    accept: acceptedMime,
                    type: "file",
                    name: "file",
                    "data-testid": "file-input",
                    tabIndex: -1,
                    ref: inputRef,
                    onChange: handleChange,
                    "aria-hidden": true
                })
            })
        ]
    });
};

export { ReplaceMediaButton };
//# sourceMappingURL=ReplaceMediaButton.mjs.map
