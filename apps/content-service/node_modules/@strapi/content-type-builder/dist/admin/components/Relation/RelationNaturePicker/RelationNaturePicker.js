'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var Icons = require('@strapi/icons');
var get = require('lodash/get');
var truncate = require('lodash/truncate');
var pluralize = require('pluralize');
var reactIntl = require('react-intl');
var reactRedux = require('react-redux');
var getTrad = require('../../../utils/getTrad.js');
var useDataManager = require('../../DataManager/useDataManager.js');
var reducer = require('../../FormModal/reducer.js');
var Components = require('./Components.js');

const relations = {
    oneWay: Icons.OneWay,
    oneToOne: Icons.OneToOne,
    oneToMany: Icons.OneToMany,
    manyToOne: Icons.ManyToOne,
    manyToMany: Icons.ManyToMany,
    manyWay: Icons.ManyWays
};
const ctRelations = [
    'oneWay',
    'oneToOne',
    'oneToMany',
    'manyToOne',
    'manyToMany',
    'manyWay'
];
const componentRelations = [
    'oneWay',
    'manyWay'
];
const RelationNaturePicker = ({ naturePickerType, oneThatIsCreatingARelationWithAnother, relationType, target, targetUid })=>{
    const dispatch = reactRedux.useDispatch();
    const { formatMessage } = reactIntl.useIntl();
    const { contentTypes } = useDataManager.useDataManager();
    const dataType = naturePickerType === 'component' ? 'component' : get(contentTypes, [
        targetUid,
        'kind'
    ], '');
    const relationsType = dataType === 'collectionType' ? ctRelations : componentRelations;
    const areDisplayedNamesInverted = relationType === 'manyToOne';
    const targetLabel = get(contentTypes, [
        target,
        'info',
        'displayName'
    ], 'unknown');
    const leftTarget = areDisplayedNamesInverted ? targetLabel : oneThatIsCreatingARelationWithAnother;
    const rightTarget = areDisplayedNamesInverted ? oneThatIsCreatingARelationWithAnother : targetLabel;
    const leftDisplayedValue = pluralize(leftTarget, relationType === 'manyToMany' ? 2 : 1);
    const restrictedRelations = get(contentTypes, [
        target,
        'restrictRelationsTo'
    ], null);
    const rightDisplayedValue = pluralize(rightTarget, [
        'manyToMany',
        'oneToMany',
        'manyToOne',
        'manyWay'
    ].includes(relationType) ? 2 : 1);
    if (!relationType) {
        return null;
    }
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
        style: {
            flex: 1
        },
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(Components.Wrapper, {
                children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
                    paddingLeft: 9,
                    paddingRight: 9,
                    paddingTop: 1,
                    justifyContent: "center",
                    children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.KeyboardNavigable, {
                        tagName: "button",
                        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
                            gap: 3,
                            children: relationsType.map((relation)=>{
                                const Asset = relations[relation];
                                const isEnabled = restrictedRelations === null || restrictedRelations.includes(relation);
                                return /*#__PURE__*/ jsxRuntime.jsx(Components.IconWrapper, {
                                    tag: "button",
                                    $isSelected: relationType === relation,
                                    disabled: !isEnabled,
                                    onClick: ()=>{
                                        if (isEnabled) {
                                            dispatch(reducer.actions.onChangeRelationType({
                                                target: {
                                                    oneThatIsCreatingARelationWithAnother,
                                                    value: relation
                                                }
                                            }));
                                        }
                                    },
                                    padding: 2,
                                    type: "button",
                                    "aria-label": formatMessage({
                                        id: getTrad.getTrad(`relation.${relation}`)
                                    }),
                                    "aria-pressed": relationType === relation,
                                    "data-relation-type": relation,
                                    children: /*#__PURE__*/ jsxRuntime.jsx(Asset, {
                                        "aria-hidden": "true"
                                    }, relation)
                                }, relation);
                            })
                        })
                    })
                })
            }),
            /*#__PURE__*/ jsxRuntime.jsxs(Components.InfosWrapper, {
                justifyContent: "center",
                children: [
                    /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Typography, {
                        children: [
                            truncate(leftDisplayedValue, {
                                length: 24
                            }),
                            " "
                        ]
                    }),
                    /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Typography, {
                        textColor: "primary600",
                        children: [
                            formatMessage({
                                id: getTrad.getTrad(`relation.${relationType}`)
                            }),
                            " "
                        ]
                    }),
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                        children: truncate(rightDisplayedValue, {
                            length: 24
                        })
                    })
                ]
            })
        ]
    });
};

exports.RelationNaturePicker = RelationNaturePicker;
//# sourceMappingURL=RelationNaturePicker.js.map
