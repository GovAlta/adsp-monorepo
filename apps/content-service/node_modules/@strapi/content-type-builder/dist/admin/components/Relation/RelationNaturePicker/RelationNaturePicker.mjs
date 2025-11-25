import { jsxs, jsx } from 'react/jsx-runtime';
import { Flex, KeyboardNavigable, Typography } from '@strapi/design-system';
import { OneWay, OneToOne, OneToMany, ManyToOne, ManyToMany, ManyWays } from '@strapi/icons';
import get from 'lodash/get';
import truncate from 'lodash/truncate';
import pluralize from 'pluralize';
import { useIntl } from 'react-intl';
import { useDispatch } from 'react-redux';
import { getTrad } from '../../../utils/getTrad.mjs';
import { useDataManager } from '../../DataManager/useDataManager.mjs';
import { actions } from '../../FormModal/reducer.mjs';
import { Wrapper, IconWrapper, InfosWrapper } from './Components.mjs';

const relations = {
    oneWay: OneWay,
    oneToOne: OneToOne,
    oneToMany: OneToMany,
    manyToOne: ManyToOne,
    manyToMany: ManyToMany,
    manyWay: ManyWays
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
    const dispatch = useDispatch();
    const { formatMessage } = useIntl();
    const { contentTypes } = useDataManager();
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
    return /*#__PURE__*/ jsxs(Flex, {
        style: {
            flex: 1
        },
        children: [
            /*#__PURE__*/ jsx(Wrapper, {
                children: /*#__PURE__*/ jsx(Flex, {
                    paddingLeft: 9,
                    paddingRight: 9,
                    paddingTop: 1,
                    justifyContent: "center",
                    children: /*#__PURE__*/ jsx(KeyboardNavigable, {
                        tagName: "button",
                        children: /*#__PURE__*/ jsx(Flex, {
                            gap: 3,
                            children: relationsType.map((relation)=>{
                                const Asset = relations[relation];
                                const isEnabled = restrictedRelations === null || restrictedRelations.includes(relation);
                                return /*#__PURE__*/ jsx(IconWrapper, {
                                    tag: "button",
                                    $isSelected: relationType === relation,
                                    disabled: !isEnabled,
                                    onClick: ()=>{
                                        if (isEnabled) {
                                            dispatch(actions.onChangeRelationType({
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
                                        id: getTrad(`relation.${relation}`)
                                    }),
                                    "aria-pressed": relationType === relation,
                                    "data-relation-type": relation,
                                    children: /*#__PURE__*/ jsx(Asset, {
                                        "aria-hidden": "true"
                                    }, relation)
                                }, relation);
                            })
                        })
                    })
                })
            }),
            /*#__PURE__*/ jsxs(InfosWrapper, {
                justifyContent: "center",
                children: [
                    /*#__PURE__*/ jsxs(Typography, {
                        children: [
                            truncate(leftDisplayedValue, {
                                length: 24
                            }),
                            " "
                        ]
                    }),
                    /*#__PURE__*/ jsxs(Typography, {
                        textColor: "primary600",
                        children: [
                            formatMessage({
                                id: getTrad(`relation.${relationType}`)
                            }),
                            " "
                        ]
                    }),
                    /*#__PURE__*/ jsx(Typography, {
                        children: truncate(rightDisplayedValue, {
                            length: 24
                        })
                    })
                ]
            })
        ]
    });
};

export { RelationNaturePicker };
//# sourceMappingURL=RelationNaturePicker.mjs.map
