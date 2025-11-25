'use strict';

var jsxRuntime = require('react/jsx-runtime');
require('react');
var designSystem = require('@strapi/design-system');
var reactIntl = require('react-intl');
var styled = require('styled-components');
var Form = require('../../../../../components/Form.js');

const EventsRoot = ({ children })=>{
    const { formatMessage } = reactIntl.useIntl();
    const label = formatMessage({
        id: 'Settings.webhooks.form.events',
        defaultMessage: 'Events'
    });
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
        direction: "column",
        alignItems: "stretch",
        gap: 1,
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Label, {
                "aria-hidden": true,
                children: label
            }),
            /*#__PURE__*/ jsxRuntime.jsx(StyledTable, {
                "aria-label": label,
                children: children
            })
        ]
    });
};
// TODO check whether we want to move alternating background colour tables to the design system
const StyledTable = styled.styled(designSystem.RawTable)`
  tbody tr:nth-child(odd) {
    background: ${({ theme })=>theme.colors.neutral100};
  }

  thead th span {
    color: ${({ theme })=>theme.colors.neutral500};
  }

  td,
  th {
    padding-block-start: ${({ theme })=>theme.spaces[3]};
    padding-block-end: ${({ theme })=>theme.spaces[3]};
    width: 6%;
    vertical-align: middle;
  }

  tbody tr td:first-child {
    /**
     * Add padding to the start of the first column to avoid the checkbox appearing
     * too close to the edge of the table
     */
    padding-inline-start: ${({ theme })=>theme.spaces[2]};
  }
`;
const getCEHeaders = ()=>{
    const headers = [
        {
            id: 'Settings.webhooks.events.create',
            defaultMessage: 'Create'
        },
        {
            id: 'Settings.webhooks.events.update',
            defaultMessage: 'Update'
        },
        {
            id: 'app.utils.delete',
            defaultMessage: 'Delete'
        },
        {
            id: 'app.utils.publish',
            defaultMessage: 'Publish'
        },
        {
            id: 'app.utils.unpublish',
            defaultMessage: 'Unpublish'
        }
    ];
    return headers;
};
const EventsHeaders = ({ getHeaders = getCEHeaders })=>{
    const { formatMessage } = reactIntl.useIntl();
    const headers = getHeaders();
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.RawThead, {
        children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.RawTr, {
            children: [
                /*#__PURE__*/ jsxRuntime.jsx(designSystem.RawTh, {
                    children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.VisuallyHidden, {
                        children: formatMessage({
                            id: 'Settings.webhooks.event.select',
                            defaultMessage: 'Select event'
                        })
                    })
                }),
                headers.map((header)=>{
                    if ([
                        'app.utils.publish',
                        'app.utils.unpublish'
                    ].includes(header?.id ?? '')) {
                        return /*#__PURE__*/ jsxRuntime.jsx(designSystem.RawTh, {
                            title: formatMessage({
                                id: 'Settings.webhooks.event.publish-tooltip',
                                defaultMessage: 'This event only exists for content with draft & publish enabled'
                            }),
                            children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                variant: "sigma",
                                textColor: "neutral600",
                                children: formatMessage(header)
                            })
                        }, header.id);
                    }
                    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.RawTh, {
                        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                            variant: "sigma",
                            textColor: "neutral600",
                            children: formatMessage(header)
                        })
                    }, header.id);
                })
            ]
        })
    });
};
const EventsBody = ({ providedEvents })=>{
    const events = providedEvents || getCEEvents();
    const { value = [], onChange } = Form.useField('events');
    const inputName = 'events';
    const inputValue = value;
    const disabledEvents = [];
    const formattedValue = inputValue.reduce((acc, curr)=>{
        const key = curr.split('.')[0];
        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(curr);
        return acc;
    }, {});
    const handleSelect = (name, value)=>{
        const set = new Set(inputValue);
        if (value) {
            set.add(name);
        } else {
            set.delete(name);
        }
        onChange(inputName, Array.from(set));
    };
    const handleSelectAll = (name, value)=>{
        const set = new Set(inputValue);
        if (value) {
            events[name].forEach((event)=>{
                if (!disabledEvents.includes(event)) {
                    set.add(event);
                }
            });
        } else {
            events[name].forEach((event)=>set.delete(event));
        }
        onChange(inputName, Array.from(set));
    };
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.RawTbody, {
        children: Object.entries(events).map(([event, value])=>{
            return /*#__PURE__*/ jsxRuntime.jsx(EventsRow, {
                disabledEvents: disabledEvents,
                name: event,
                events: value,
                inputValue: formattedValue[event],
                handleSelect: handleSelect,
                handleSelectAll: handleSelectAll
            }, event);
        })
    });
};
const getCEEvents = ()=>{
    const entryEvents = [
        'entry.create',
        'entry.update',
        'entry.delete',
        'entry.publish',
        'entry.unpublish'
    ];
    return {
        entry: entryEvents,
        media: [
            'media.create',
            'media.update',
            'media.delete'
        ]
    };
};
const EventsRow = ({ disabledEvents = [], name, events = [], inputValue = [], handleSelect, handleSelectAll })=>{
    const { formatMessage } = reactIntl.useIntl();
    const enabledCheckboxes = events.filter((event)=>!disabledEvents.includes(event));
    const hasSomeCheckboxSelected = inputValue.length > 0;
    const areAllCheckboxesSelected = inputValue.length === enabledCheckboxes.length;
    const onChangeAll = ()=>{
        const valueToSet = !areAllCheckboxesSelected;
        handleSelectAll(name, valueToSet);
    };
    const targetColumns = 5;
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.RawTr, {
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.RawTd, {
                children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Checkbox, {
                    "aria-label": formatMessage({
                        id: 'global.select-all-entries',
                        defaultMessage: 'Select all entries'
                    }),
                    name: name,
                    checked: hasSomeCheckboxSelected && !areAllCheckboxesSelected ? 'indeterminate' : areAllCheckboxesSelected,
                    onCheckedChange: onChangeAll,
                    children: removeHyphensAndTitleCase(name)
                })
            }),
            events.map((event)=>{
                return /*#__PURE__*/ jsxRuntime.jsx(designSystem.RawTd, {
                    textAlign: "center",
                    children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
                        width: "100%",
                        justifyContent: "center",
                        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Checkbox, {
                            disabled: disabledEvents.includes(event),
                            "aria-label": event,
                            name: event,
                            checked: inputValue.includes(event),
                            onCheckedChange: (value)=>handleSelect(event, !!value)
                        })
                    })
                }, event);
            }),
            events.length < targetColumns && /*#__PURE__*/ jsxRuntime.jsx(designSystem.RawTd, {
                colSpan: targetColumns - events.length
            })
        ]
    });
};
/**
 * Converts a string to title case and removes hyphens.
 */ const removeHyphensAndTitleCase = (str)=>str.replace(/-/g, ' ').split(' ').map((word)=>word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
const Events = {
    Root: EventsRoot,
    Headers: EventsHeaders,
    Body: EventsBody,
    Row: EventsRow
};

exports.Events = Events;
//# sourceMappingURL=Events.js.map
