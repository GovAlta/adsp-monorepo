import { jsx } from 'react/jsx-runtime';
import { Button, Tooltip } from '@strapi/design-system';
import { useIntl } from 'react-intl';

const ApplyConditionButton = ({ disabled, tooltipMessage, onClick, marginTop = 4 })=>{
    const { formatMessage } = useIntl();
    const button = /*#__PURE__*/ jsx(Button, {
        marginTop: marginTop,
        fullWidth: true,
        variant: "secondary",
        disabled: disabled,
        onClick: onClick,
        startIcon: /*#__PURE__*/ jsx("span", {
            "aria-hidden": true,
            children: "＋"
        }),
        children: formatMessage({
            id: 'form.attribute.condition.apply',
            defaultMessage: 'Apply condition'
        })
    });
    if (tooltipMessage) {
        return /*#__PURE__*/ jsx(Tooltip, {
            description: tooltipMessage,
            children: button
        });
    }
    return button;
};

export { ApplyConditionButton };
//# sourceMappingURL=ApplyConditionButton.mjs.map
