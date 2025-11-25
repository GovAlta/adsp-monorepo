import { jsxs, jsx } from 'react/jsx-runtime';
import 'react';
import { RawTable, Flex, Field, RawThead, RawTr, RawTh, VisuallyHidden, Typography, RawTbody, RawTd, Checkbox } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { styled } from 'styled-components';
import { useField } from '../../../../../components/Form.mjs';

const EventsRoot = ({ children })=>{
    const { formatMessage } = useIntl();
    const label = formatMessage({
        id: 'Settings.webhooks.form.events',
        defaultMessage: 'Events'
    });
    return /*#__PURE__*/ jsxs(Flex, {
        direction: "column",
        alignItems: "stretch",
        gap: 1,
        children: [
            /*#__PURE__*/ jsx(Field.Label, {
                "aria-hidden": true,
                children: label
            }),
            /*#__PURE__*/ jsx(StyledTable, {
                "aria-label": label,
                children: children
            })
        ]
    });
};
// TODO check whether we want to move alternating background colour tables to the design system
const StyledTable = styled(RawTable)`
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
    const { formatMessage } = useIntl();
    const headers = getHeaders();
    return /*#__PURE__*/ jsx(RawThead, {
        children: /*#__PURE__*/ jsxs(RawTr, {
            children: [
                /*#__PURE__*/ jsx(RawTh, {
                    children: /*#__PURE__*/ jsx(VisuallyHidden, {
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
                        return /*#__PURE__*/ jsx(RawTh, {
                            title: formatMessage({
                                id: 'Settings.webhooks.event.publish-tooltip',
                                defaultMessage: 'This event only exists for content with draft & publish enabled'
                            }),
                            children: /*#__PURE__*/ jsx(Typography, {
                                variant: "sigma",
                                textColor: "neutral600",
                                children: formatMessage(header)
                            })
                        }, header.id);
                    }
                    return /*#__PURE__*/ jsx(RawTh, {
                        children: /*#__PURE__*/ jsx(Typography, {
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
    const { value = [], onChange } = useField('events');
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
    return /*#__PURE__*/ jsx(RawTbody, {
        children: Object.entries(events).map(([event, value])=>{
            return /*#__PURE__*/ jsx(EventsRow, {
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
    const { formatMessage } = useIntl();
    const enabledCheckboxes = events.filter((event)=>!disabledEvents.includes(event));
    const hasSomeCheckboxSelected = inputValue.length > 0;
    const areAllCheckboxesSelected = inputValue.length === enabledCheckboxes.length;
    const onChangeAll = ()=>{
        const valueToSet = !areAllCheckboxesSelected;
        handleSelectAll(name, valueToSet);
    };
    const targetColumns = 5;
    return /*#__PURE__*/ jsxs(RawTr, {
        children: [
            /*#__PURE__*/ jsx(RawTd, {
                children: /*#__PURE__*/ jsx(Checkbox, {
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
                return /*#__PURE__*/ jsx(RawTd, {
                    textAlign: "center",
                    children: /*#__PURE__*/ jsx(Flex, {
                        width: "100%",
                        justifyContent: "center",
                        children: /*#__PURE__*/ jsx(Checkbox, {
                            disabled: disabledEvents.includes(event),
                            "aria-label": event,
                            name: event,
                            checked: inputValue.includes(event),
                            onCheckedChange: (value)=>handleSelect(event, !!value)
                        })
                    })
                }, event);
            }),
            events.length < targetColumns && /*#__PURE__*/ jsx(RawTd, {
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

export { Events };
//# sourceMappingURL=Events.mjs.map
