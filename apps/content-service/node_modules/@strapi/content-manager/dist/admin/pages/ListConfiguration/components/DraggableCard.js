'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var designSystem = require('@strapi/design-system');
var Icons = require('@strapi/icons');
var reactDndHtml5Backend = require('react-dnd-html5-backend');
var reactIntl = require('react-intl');
var styledComponents = require('styled-components');
var CardDragPreview = require('../../../components/DragPreviews/CardDragPreview.js');
var dragAndDrop = require('../../../constants/dragAndDrop.js');
var useDragAndDrop = require('../../../hooks/useDragAndDrop.js');
var translations = require('../../../utils/translations.js');
var EditFieldForm = require('./EditFieldForm.js');

function _interopNamespaceDefault(e) {
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n.default = e;
  return Object.freeze(n);
}

var React__namespace = /*#__PURE__*/_interopNamespaceDefault(React);

const DraggableCard = ({ attribute, index, isDraggingSibling, label, name, onMoveField, onRemoveField, setIsDraggingSibling })=>{
    const [isModalOpen, setIsModalOpen] = React__namespace.useState(false);
    const { formatMessage } = reactIntl.useIntl();
    const [, forceRerenderAfterDnd] = React__namespace.useState(false);
    const [{ isDragging }, objectRef, dropRef, dragRef, dragPreviewRef] = useDragAndDrop.useDragAndDrop(true, {
        type: dragAndDrop.ItemTypes.FIELD,
        item: {
            index,
            label,
            name
        },
        index,
        onMoveItem: onMoveField,
        onEnd: ()=>setIsDraggingSibling(false)
    });
    React__namespace.useEffect(()=>{
        dragPreviewRef(reactDndHtml5Backend.getEmptyImage(), {
            captureDraggingState: false
        });
    }, [
        dragPreviewRef
    ]);
    React__namespace.useEffect(()=>{
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
    React__namespace.useEffect(()=>{
        if (!isDraggingSibling) {
            forceRerenderAfterDnd((prev)=>!prev);
        }
    }, [
        isDraggingSibling
    ]);
    const composedRefs = designSystem.useComposedRefs(dropRef, objectRef);
    return /*#__PURE__*/ jsxRuntime.jsxs(FieldWrapper, {
        ref: composedRefs,
        children: [
            isDragging && /*#__PURE__*/ jsxRuntime.jsx(CardDragPreview.CardDragPreview, {
                label: label
            }),
            !isDragging && isDraggingSibling && /*#__PURE__*/ jsxRuntime.jsx(CardDragPreview.CardDragPreview, {
                isSibling: true,
                label: label
            }),
            !isDragging && !isDraggingSibling && /*#__PURE__*/ jsxRuntime.jsxs(FieldContainer, {
                borderColor: "neutral150",
                background: "neutral100",
                hasRadius: true,
                justifyContent: "space-between",
                onClick: ()=>setIsModalOpen(true),
                children: [
                    /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                        gap: 3,
                        children: [
                            /*#__PURE__*/ jsxRuntime.jsx(DragButton, {
                                ref: dragRef,
                                "aria-label": formatMessage({
                                    id: translations.getTranslation('components.DraggableCard.move.field'),
                                    defaultMessage: 'Move {item}'
                                }, {
                                    item: label
                                }),
                                onClick: (e)=>e.stopPropagation(),
                                children: /*#__PURE__*/ jsxRuntime.jsx(Icons.Drag, {})
                            }),
                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                fontWeight: "bold",
                                children: label
                            })
                        ]
                    }),
                    /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                        paddingLeft: 3,
                        onClick: (e)=>e.stopPropagation(),
                        children: [
                            /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Modal.Root, {
                                open: isModalOpen,
                                onOpenChange: setIsModalOpen,
                                children: [
                                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Modal.Trigger, {
                                        children: /*#__PURE__*/ jsxRuntime.jsx(ActionButton, {
                                            onClick: (e)=>{
                                                e.stopPropagation();
                                            },
                                            "aria-label": formatMessage({
                                                id: translations.getTranslation('components.DraggableCard.edit.field'),
                                                defaultMessage: 'Edit {item}'
                                            }, {
                                                item: label
                                            }),
                                            type: "button",
                                            children: /*#__PURE__*/ jsxRuntime.jsx(Icons.Pencil, {
                                                width: "1.2rem",
                                                height: "1.2rem"
                                            })
                                        })
                                    }),
                                    /*#__PURE__*/ jsxRuntime.jsx(EditFieldForm.EditFieldForm, {
                                        attribute: attribute,
                                        name: `layout.${index}`,
                                        onClose: ()=>{
                                            setIsModalOpen(false);
                                        }
                                    })
                                ]
                            }),
                            /*#__PURE__*/ jsxRuntime.jsx(ActionButton, {
                                onClick: onRemoveField,
                                "data-testid": `delete-${name}`,
                                "aria-label": formatMessage({
                                    id: translations.getTranslation('components.DraggableCard.delete.field'),
                                    defaultMessage: 'Delete {item}'
                                }, {
                                    item: label
                                }),
                                type: "button",
                                children: /*#__PURE__*/ jsxRuntime.jsx(Icons.Cross, {
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
const ActionButton = styledComponents.styled.button`
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
const DragButton = styledComponents.styled(ActionButton)`
  padding: 0 ${({ theme })=>theme.spaces[3]};
  border-right: 1px solid ${({ theme })=>theme.colors.neutral150};
  cursor: all-scroll;
`;
const FieldContainer = styledComponents.styled(designSystem.Flex)`
  max-height: 3.2rem;
  cursor: pointer;
`;
const FieldWrapper = styledComponents.styled(designSystem.Box)`
  &:last-child {
    padding-right: ${({ theme })=>theme.spaces[3]};
  }
`;

exports.DraggableCard = DraggableCard;
//# sourceMappingURL=DraggableCard.js.map
