import { jsxs, jsx } from 'react/jsx-runtime';
import * as React from 'react';
import { Flex, Box, useComposedRefs, Typography, Modal } from '@strapi/design-system';
import { Drag, Pencil, Cross } from '@strapi/icons';
import { getEmptyImage } from 'react-dnd-html5-backend';
import { useIntl } from 'react-intl';
import { styled } from 'styled-components';
import { CardDragPreview } from '../../../components/DragPreviews/CardDragPreview.mjs';
import { ItemTypes } from '../../../constants/dragAndDrop.mjs';
import { useDragAndDrop } from '../../../hooks/useDragAndDrop.mjs';
import { getTranslation } from '../../../utils/translations.mjs';
import { EditFieldForm } from './EditFieldForm.mjs';

const DraggableCard = ({ attribute, index, isDraggingSibling, label, name, onMoveField, onRemoveField, setIsDraggingSibling })=>{
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const { formatMessage } = useIntl();
    const [, forceRerenderAfterDnd] = React.useState(false);
    const [{ isDragging }, objectRef, dropRef, dragRef, dragPreviewRef] = useDragAndDrop(true, {
        type: ItemTypes.FIELD,
        item: {
            index,
            label,
            name
        },
        index,
        onMoveItem: onMoveField,
        onEnd: ()=>setIsDraggingSibling(false)
    });
    React.useEffect(()=>{
        dragPreviewRef(getEmptyImage(), {
            captureDraggingState: false
        });
    }, [
        dragPreviewRef
    ]);
    React.useEffect(()=>{
        if (isDragging) {
            setIsDraggingSibling(true);
        }
    }, [
        isDragging,
        setIsDraggingSibling
    ]);
    // Effect in order to force a rerender after reordering the components
    // Since we are removing the Accordion when doing the DnD  we are losing the dragRef, therefore the replaced element cannot be dragged
    // anymore, this hack forces a rerender in order to apply the dragRef
    React.useEffect(()=>{
        if (!isDraggingSibling) {
            forceRerenderAfterDnd((prev)=>!prev);
        }
    }, [
        isDraggingSibling
    ]);
    const composedRefs = useComposedRefs(dropRef, objectRef);
    return /*#__PURE__*/ jsxs(FieldWrapper, {
        ref: composedRefs,
        children: [
            isDragging && /*#__PURE__*/ jsx(CardDragPreview, {
                label: label
            }),
            !isDragging && isDraggingSibling && /*#__PURE__*/ jsx(CardDragPreview, {
                isSibling: true,
                label: label
            }),
            !isDragging && !isDraggingSibling && /*#__PURE__*/ jsxs(FieldContainer, {
                borderColor: "neutral150",
                background: "neutral100",
                hasRadius: true,
                justifyContent: "space-between",
                onClick: ()=>setIsModalOpen(true),
                children: [
                    /*#__PURE__*/ jsxs(Flex, {
                        gap: 3,
                        children: [
                            /*#__PURE__*/ jsx(DragButton, {
                                ref: dragRef,
                                "aria-label": formatMessage({
                                    id: getTranslation('components.DraggableCard.move.field'),
                                    defaultMessage: 'Move {item}'
                                }, {
                                    item: label
                                }),
                                onClick: (e)=>e.stopPropagation(),
                                children: /*#__PURE__*/ jsx(Drag, {})
                            }),
                            /*#__PURE__*/ jsx(Typography, {
                                fontWeight: "bold",
                                children: label
                            })
                        ]
                    }),
                    /*#__PURE__*/ jsxs(Flex, {
                        paddingLeft: 3,
                        onClick: (e)=>e.stopPropagation(),
                        children: [
                            /*#__PURE__*/ jsxs(Modal.Root, {
                                open: isModalOpen,
                                onOpenChange: setIsModalOpen,
                                children: [
                                    /*#__PURE__*/ jsx(Modal.Trigger, {
                                        children: /*#__PURE__*/ jsx(ActionButton, {
                                            onClick: (e)=>{
                                                e.stopPropagation();
                                            },
                                            "aria-label": formatMessage({
                                                id: getTranslation('components.DraggableCard.edit.field'),
                                                defaultMessage: 'Edit {item}'
                                            }, {
                                                item: label
                                            }),
                                            type: "button",
                                            children: /*#__PURE__*/ jsx(Pencil, {
                                                width: "1.2rem",
                                                height: "1.2rem"
                                            })
                                        })
                                    }),
                                    /*#__PURE__*/ jsx(EditFieldForm, {
                                        attribute: attribute,
                                        name: `layout.${index}`,
                                        onClose: ()=>{
                                            setIsModalOpen(false);
                                        }
                                    })
                                ]
                            }),
                            /*#__PURE__*/ jsx(ActionButton, {
                                onClick: onRemoveField,
                                "data-testid": `delete-${name}`,
                                "aria-label": formatMessage({
                                    id: getTranslation('components.DraggableCard.delete.field'),
                                    defaultMessage: 'Delete {item}'
                                }, {
                                    item: label
                                }),
                                type: "button",
                                children: /*#__PURE__*/ jsx(Cross, {
                                    width: "1.2rem",
                                    height: "1.2rem"
                                })
                            })
                        ]
                    })
                ]
            })
        ]
    });
};
const ActionButton = styled.button`
  display: flex;
  align-items: center;
  height: ${({ theme })=>theme.spaces[7]};
  color: ${({ theme })=>theme.colors.neutral600};

  &:hover {
    color: ${({ theme })=>theme.colors.neutral700};
  }

  &:last-child {
    padding: 0 ${({ theme })=>theme.spaces[3]};
  }
`;
const DragButton = styled(ActionButton)`
  padding: 0 ${({ theme })=>theme.spaces[3]};
  border-right: 1px solid ${({ theme })=>theme.colors.neutral150};
  cursor: all-scroll;
`;
const FieldContainer = styled(Flex)`
  max-height: 3.2rem;
  cursor: pointer;
`;
const FieldWrapper = styled(Box)`
  &:last-child {
    padding-right: ${({ theme })=>theme.spaces[3]};
  }
`;

export { DraggableCard };
//# sourceMappingURL=DraggableCard.mjs.map
