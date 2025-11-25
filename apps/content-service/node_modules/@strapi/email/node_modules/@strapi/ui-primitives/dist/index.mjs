import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import * as React from "react";
import { useComposedRefs } from "@radix-ui/react-compose-refs";
import { createContextScope, createContext } from "@radix-ui/react-context";
import { Slot } from "@radix-ui/react-slot";
import { composeEventHandlers as composeEventHandlers$1 } from "@radix-ui/primitive";
import { DismissableLayer } from "@radix-ui/react-dismissable-layer";
import { useFocusGuards } from "@radix-ui/react-focus-guards";
import { FocusScope } from "@radix-ui/react-focus-scope";
import { useId } from "@radix-ui/react-id";
import * as PopperPrimitive from "@radix-ui/react-popper";
import { createPopperScope } from "@radix-ui/react-popper";
import { Portal as Portal$2 } from "@radix-ui/react-portal";
import { Primitive } from "@radix-ui/react-primitive";
import { useControllableState } from "@radix-ui/react-use-controllable-state";
import { useLayoutEffect } from "@radix-ui/react-use-layout-effect";
import { hideOthers } from "aria-hidden";
import * as ReactDOM from "react-dom";
import { RemoveScroll } from "react-remove-scroll";
import { clamp } from "@radix-ui/number";
import { createCollection as createCollection$1 } from "@radix-ui/react-collection";
import { useDirection } from "@radix-ui/react-direction";
import { usePrevious } from "@radix-ui/react-use-previous";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
function createCollection(name) {
  const PROVIDER_NAME = `${name}CollectionProvider`;
  const [createCollectionContext, createCollectionScope2] = createContextScope(PROVIDER_NAME);
  const [CollectionProviderImpl, useCollectionContext] = createCollectionContext(PROVIDER_NAME, {
    collectionRef: { current: null },
    itemMap: /* @__PURE__ */ new Map(),
    listeners: /* @__PURE__ */ new Set()
  });
  const CollectionProvider = (props) => {
    const { scope, children } = props;
    const ref = React.useRef(null);
    const itemMap = React.useRef(/* @__PURE__ */ new Map()).current;
    const listeners = React.useRef(/* @__PURE__ */ new Set()).current;
    return /* @__PURE__ */ jsx(CollectionProviderImpl, { scope, itemMap, collectionRef: ref, listeners, children });
  };
  CollectionProvider.displayName = PROVIDER_NAME;
  const COLLECTION_SLOT_NAME = `${name}CollectionSlot`;
  const CollectionSlot = React.forwardRef((props, forwardedRef) => {
    const { scope, children } = props;
    const context = useCollectionContext(COLLECTION_SLOT_NAME, scope);
    const composedRefs = useComposedRefs(forwardedRef, context.collectionRef);
    return /* @__PURE__ */ jsx(Slot, { ref: composedRefs, children });
  });
  CollectionSlot.displayName = COLLECTION_SLOT_NAME;
  const ITEM_SLOT_NAME = `${name}CollectionItemSlot`;
  const ITEM_DATA_ATTR = "data-radix-collection-item";
  const CollectionItemSlot = React.forwardRef((props, forwardedRef) => {
    const { scope, children, ...itemData } = props;
    const ref = React.useRef(null);
    const composedRefs = useComposedRefs(forwardedRef, ref);
    const context = useCollectionContext(ITEM_SLOT_NAME, scope);
    React.useEffect(() => {
      const previousMap = Array.from(context.itemMap.values());
      context.itemMap.set(ref, { ref, ...itemData });
      context.listeners.forEach((listener) => listener(Array.from(context.itemMap.values()), previousMap));
      return () => {
        const previousMap2 = Array.from(context.itemMap.values());
        context.itemMap.delete(ref);
        context.listeners.forEach((listener) => listener(Array.from(context.itemMap.values()), previousMap2));
      };
    });
    return /* @__PURE__ */ jsx(Slot, { ...{ [ITEM_DATA_ATTR]: "" }, ref: composedRefs, children });
  });
  CollectionItemSlot.displayName = ITEM_SLOT_NAME;
  function useCollection2(scope) {
    const context = useCollectionContext(`${name}CollectionConsumer`, scope);
    const getItems = React.useCallback(() => {
      const collectionNode = context.collectionRef.current;
      if (!collectionNode)
        return [];
      const orderedNodes = Array.from(collectionNode.querySelectorAll(`[${ITEM_DATA_ATTR}]`));
      const items = Array.from(context.itemMap.values());
      const orderedItems = items.sort(
        (a, b) => orderedNodes.indexOf(a.ref.current) - orderedNodes.indexOf(b.ref.current)
      );
      return orderedItems;
    }, [context.collectionRef, context.itemMap]);
    const subscribe = React.useCallback(
      (listener) => {
        context.listeners.add(listener);
        return () => context.listeners.delete(listener);
      },
      [context.listeners]
    );
    return { getItems, subscribe };
  }
  return [
    { Provider: CollectionProvider, Slot: CollectionSlot, ItemSlot: CollectionItemSlot },
    useCollection2,
    createCollectionScope2
  ];
}
const cache = /* @__PURE__ */ new Map();
function useCollator(locale, options) {
  const cacheKey = locale + (options ? Object.entries(options).sort((a, b) => a[0] < b[0] ? -1 : 1).join() : "");
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }
  const formatter = new Intl.Collator(locale, options);
  cache.set(cacheKey, formatter);
  return formatter;
}
function useFilter(locale, options) {
  const collator = useCollator(locale, {
    usage: "search",
    ...options
  });
  return {
    startsWith(string, substring) {
      if (substring.length === 0) {
        return true;
      }
      string = string.normalize("NFC");
      substring = substring.normalize("NFC");
      return collator.compare(string.slice(0, substring.length), substring) === 0;
    },
    endsWith(string, substring) {
      if (substring.length === 0) {
        return true;
      }
      string = string.normalize("NFC");
      substring = substring.normalize("NFC");
      return collator.compare(string.slice(-substring.length), substring) === 0;
    },
    contains(string, substring) {
      if (substring.length === 0) {
        return true;
      }
      string = string.normalize("NFC");
      substring = substring.normalize("NFC");
      let scan = 0;
      const sliceLen = substring.length;
      for (; scan + sliceLen <= string.length; scan++) {
        const slice = string.slice(scan, scan + sliceLen);
        if (collator.compare(substring, slice) === 0) {
          return true;
        }
      }
      return false;
    }
  };
}
const usePrev = (value) => {
  const ref = React.useRef();
  React.useEffect(() => {
    ref.current = value;
  });
  return ref.current;
};
const OPEN_KEYS$1 = [" ", "Enter", "ArrowUp", "ArrowDown"];
const SELECTION_KEYS$1 = ["Enter"];
const defaultIsPrintableCharacter = (str) => {
  return Boolean(str.length === 1 && str.match(/\S| /));
};
const COMBOBOX_NAME = "Combobox";
const [Collection$1, useCollection$1] = createCollection(COMBOBOX_NAME);
const [ComboboxProvider, useComboboxContext] = createContext(COMBOBOX_NAME);
const ComboboxProviders = ({ children }) => /* @__PURE__ */ jsx(PopperPrimitive.Root, { children: /* @__PURE__ */ jsx(Collection$1.Provider, { scope: void 0, children }) });
const formatAutocomplete = (autocomplete) => {
  if (typeof autocomplete === "string") {
    if (autocomplete === "none") {
      return {
        type: autocomplete,
        filter: void 0
      };
    }
    return {
      type: autocomplete,
      filter: "startsWith"
    };
  }
  return autocomplete;
};
const Combobox = (props) => {
  const {
    allowCustomValue = false,
    autocomplete = "none",
    children,
    open: openProp,
    defaultOpen,
    onOpenChange,
    value: valueProp,
    defaultValue,
    onValueChange,
    disabled,
    required = false,
    locale = "en-EN",
    onTextValueChange,
    textValue: textValueProp,
    defaultTextValue,
    filterValue: filterValueProp,
    defaultFilterValue,
    onFilterValueChange,
    isPrintableCharacter = defaultIsPrintableCharacter,
    visible = false
  } = props;
  const [trigger, setTrigger] = React.useState(null);
  const [viewport, setViewport] = React.useState(null);
  const [content, setContent] = React.useState(null);
  const [visuallyFocussedItem, setVisuallyFocussedItem] = React.useState(null);
  const [open = false, setOpen] = useControllableState({
    prop: openProp,
    defaultProp: defaultOpen,
    onChange: onOpenChange
  });
  const [value, setValue] = useControllableState({
    prop: valueProp,
    defaultProp: defaultValue,
    onChange: onValueChange
  });
  const [textValue, setTextValue] = useControllableState({
    prop: textValueProp,
    defaultProp: allowCustomValue && !defaultTextValue ? valueProp : defaultTextValue,
    onChange: onTextValueChange
  });
  const [filterValue, setFilterValue] = useControllableState({
    prop: filterValueProp,
    defaultProp: defaultFilterValue,
    onChange: onFilterValueChange
  });
  const id = useId();
  const focusFirst = React.useCallback(
    (candidates, items) => {
      const allItems = items.map((item) => item.ref.current);
      const [firstItem, ...restItems] = allItems;
      const [lastItem] = restItems.slice(-1);
      const PREVIOUSLY_FOCUSED_ELEMENT = visuallyFocussedItem ?? items.find((item) => item.value === value)?.ref.current;
      for (const candidate of candidates) {
        if (candidate === PREVIOUSLY_FOCUSED_ELEMENT)
          return;
        candidate?.scrollIntoView({ block: "nearest" });
        if (candidate === firstItem && viewport)
          viewport.scrollTop = 0;
        if (candidate === lastItem && viewport)
          viewport.scrollTop = viewport.scrollHeight;
        setVisuallyFocussedItem(candidate);
        if (autocomplete === "both") {
          const item = items.find((item2) => item2.ref.current === candidate);
          if (item) {
            setTextValue(item.textValue);
          }
        }
        if (candidate !== PREVIOUSLY_FOCUSED_ELEMENT)
          return;
      }
    },
    [autocomplete, setTextValue, viewport, visuallyFocussedItem, value]
  );
  const autocompleteObject = formatAutocomplete(autocomplete);
  React.useEffect(() => {
    if (autocomplete !== "both") {
      setVisuallyFocussedItem(null);
    }
  }, [textValue, autocomplete]);
  React.useEffect(() => {
    if (content && trigger)
      return hideOthers([content, trigger]);
  }, [content, trigger]);
  return /* @__PURE__ */ jsx(ComboboxProviders, { children: /* @__PURE__ */ jsx(
    ComboboxProvider,
    {
      allowCustomValue,
      autocomplete: autocompleteObject,
      required,
      trigger,
      onTriggerChange: setTrigger,
      contentId: id,
      value,
      onValueChange: setValue,
      open,
      onOpenChange: setOpen,
      disabled,
      locale,
      focusFirst,
      textValue,
      onTextValueChange: setTextValue,
      onViewportChange: setViewport,
      onContentChange: setContent,
      visuallyFocussedItem,
      filterValue,
      onFilterValueChange: setFilterValue,
      onVisuallyFocussedItemChange: setVisuallyFocussedItem,
      isPrintableCharacter,
      visible,
      children
    }
  ) });
};
const TRIGGER_NAME$1 = "ComboboxTrigger";
const ComboboxTrigger = React.forwardRef((props, forwardedRef) => {
  const { ...triggerProps } = props;
  const context = useComboboxContext(TRIGGER_NAME$1);
  const handleOpen = () => {
    if (!context.disabled) {
      context.onOpenChange(true);
    }
  };
  return /* @__PURE__ */ jsx(PopperPrimitive.Anchor, { asChild: true, children: /* @__PURE__ */ jsx(
    FocusScope,
    {
      asChild: true,
      trapped: context.open,
      onMountAutoFocus: (event) => {
        event.preventDefault();
      },
      onUnmountAutoFocus: (event) => {
        context.trigger?.focus({ preventScroll: true });
        document.getSelection()?.empty();
        event.preventDefault();
      },
      children: /* @__PURE__ */ jsx(
        "div",
        {
          ref: forwardedRef,
          "data-disabled": context.disabled ? "" : void 0,
          ...triggerProps,
          onClick: composeEventHandlers$1(triggerProps.onClick, (event) => {
            if (context.disabled) {
              event.preventDefault();
              return;
            }
            context.trigger?.focus();
          }),
          onPointerDown: composeEventHandlers$1(triggerProps.onPointerDown, (event) => {
            if (context.disabled) {
              event.preventDefault();
              return;
            }
            const target = event.target;
            if (target.hasPointerCapture(event.pointerId)) {
              target.releasePointerCapture(event.pointerId);
            }
            const buttonTarg = target.closest("button") ?? target.closest("div");
            if (buttonTarg !== event.currentTarget) {
              return;
            }
            if (event.button === 0 && event.ctrlKey === false) {
              handleOpen();
              context.trigger?.focus();
            }
          })
        }
      )
    }
  ) });
});
ComboboxTrigger.displayName = TRIGGER_NAME$1;
const INPUT_NAME = "ComboboxInput";
const ComboxboxTextInput = React.forwardRef((props, forwardedRef) => {
  const context = useComboboxContext(INPUT_NAME);
  const inputRef = React.useRef(null);
  const { getItems } = useCollection$1(void 0);
  const { startsWith } = useFilter(context.locale, { sensitivity: "base" });
  const isDisabled = context.disabled;
  const composedRefs = useComposedRefs(inputRef, forwardedRef, context.onTriggerChange);
  const handleOpen = () => {
    if (!isDisabled) {
      context.onOpenChange(true);
    }
  };
  const previousFilter = usePrev(context.filterValue);
  useLayoutEffect(() => {
    const timeout = setTimeout(() => {
      if (context.textValue === "" || context.textValue === void 0 || context.filterValue === "" || context.filterValue === void 0)
        return;
      const firstItem = getItems().find(
        (item) => item.type === "option" && startsWith(item.textValue, context.textValue)
      );
      const characterChangedAtIndex = findChangedIndex(previousFilter ?? "", context.filterValue);
      if (firstItem && !context.visuallyFocussedItem && characterChangedAtIndex === context.filterValue.length) {
        inputRef.current?.setSelectionRange(context.filterValue.length, context.textValue.length);
      }
    });
    return () => clearTimeout(timeout);
  }, [context.textValue, context.filterValue, startsWith, context.visuallyFocussedItem, getItems, previousFilter]);
  return /* @__PURE__ */ jsx(
    "input",
    {
      type: "text",
      role: "combobox",
      "aria-controls": context.contentId,
      "aria-expanded": context.open,
      "aria-required": context.required,
      "aria-autocomplete": context.autocomplete.type,
      "data-state": context.open ? "open" : "closed",
      "aria-disabled": isDisabled,
      "aria-activedescendant": context.visuallyFocussedItem?.id,
      disabled: isDisabled,
      "data-disabled": isDisabled ? "" : void 0,
      "data-placeholder": context.textValue === void 0 ? "" : void 0,
      value: context.textValue ?? "",
      ...props,
      ref: composedRefs,
      onKeyDown: composeEventHandlers$1(props.onKeyDown, (event) => {
        if (["ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) {
          if (!context.open) {
            handleOpen();
          }
          setTimeout(() => {
            const items = getItems().filter((item) => !item.disabled && item.isVisible);
            let candidateNodes = items.map((item) => item.ref.current);
            if (["ArrowUp", "End"].includes(event.key)) {
              candidateNodes = candidateNodes.slice().reverse();
            }
            if (["ArrowUp", "ArrowDown"].includes(event.key)) {
              const currentElement = context.visuallyFocussedItem ?? getItems().find((item) => item.value === context.value)?.ref.current;
              if (currentElement) {
                let currentIndex = candidateNodes.indexOf(currentElement);
                if (currentIndex === candidateNodes.length - 1) {
                  currentIndex = -1;
                }
                candidateNodes = candidateNodes.slice(currentIndex + 1);
              }
            }
            if (["ArrowDown"].includes(event.key) && context.autocomplete.type === "both" && candidateNodes.length > 1) {
              const [firstItem, ...restItems] = candidateNodes;
              const firstItemText = getItems().find((item) => item.ref.current === firstItem).textValue;
              if (context.textValue === firstItemText) {
                candidateNodes = restItems;
              }
            }
            context.focusFirst(candidateNodes, getItems());
          });
          event.preventDefault();
        } else if (["Tab"].includes(event.key) && context.open) {
          event.preventDefault();
        } else if (["Escape"].includes(event.key)) {
          if (context.open) {
            context.onOpenChange(false);
          } else {
            context.onValueChange(void 0);
            context.onTextValueChange("");
          }
          event.preventDefault();
        } else if (SELECTION_KEYS$1.includes(event.key)) {
          if (context.visuallyFocussedItem) {
            const focussedItem = getItems().find((item) => item.ref.current === context.visuallyFocussedItem);
            if (focussedItem) {
              context.onValueChange(focussedItem.value);
              context.onTextValueChange(focussedItem.textValue);
              if (context.autocomplete.type === "both") {
                context.onFilterValueChange(focussedItem.textValue);
              }
              focussedItem.ref.current?.click();
            }
          } else {
            const matchedItem = getItems().find(
              (item) => item.type === "option" && !item.disabled && item.textValue === context.textValue
            );
            if (matchedItem) {
              context.onValueChange(matchedItem.value);
              context.onTextValueChange(matchedItem.textValue);
              if (context.autocomplete.type === "both") {
                context.onFilterValueChange(matchedItem.textValue);
              }
              matchedItem.ref.current?.click();
            }
          }
          context.onOpenChange(false);
          event.preventDefault();
        } else {
          context.onVisuallyFocussedItemChange(null);
        }
      }),
      onChange: composeEventHandlers$1(props.onChange, (event) => {
        context.onTextValueChange(event.currentTarget.value);
        if (context.autocomplete.type === "both") {
          context.onFilterValueChange(event.currentTarget.value);
        }
      }),
      onKeyUp: composeEventHandlers$1(props.onKeyUp, (event) => {
        if (!context.open && (context.isPrintableCharacter(event.key) || ["Backspace"].includes(event.key))) {
          handleOpen();
        }
        setTimeout(() => {
          if (context.autocomplete.type === "both" && context.isPrintableCharacter(event.key) && context.filterValue !== void 0) {
            const value = context.filterValue;
            const firstItem = getItems().find((item) => startsWith(item.textValue, value));
            if (firstItem) {
              context.onTextValueChange(firstItem.textValue);
            }
          }
        });
        if (context.autocomplete.type === "none" && context.isPrintableCharacter(event.key)) {
          const value = context.textValue ?? "";
          const nextItem = getItems().find((item) => startsWith(item.textValue, value));
          if (nextItem) {
            context.onVisuallyFocussedItemChange(nextItem.ref.current);
            nextItem.ref.current?.scrollIntoView();
          }
        }
      }),
      onBlur: composeEventHandlers$1(props.onBlur, () => {
        if (context.open) {
          return;
        }
        context.onVisuallyFocussedItemChange(null);
        const [activeItem] = getItems().filter(
          (item) => item.textValue === context.textValue && item.type === "option"
        );
        if (activeItem) {
          context.onValueChange(activeItem.value);
          if (context.autocomplete.type === "both") {
            context.onFilterValueChange(activeItem.textValue);
          }
          return;
        }
        if (context.allowCustomValue) {
          context.onValueChange(context.textValue);
          if (context.autocomplete.type === "both") {
            context.onFilterValueChange(context.textValue);
          }
          return;
        }
        const [previousItem] = getItems().filter((item) => item.value === context.value && item.type === "option");
        if (previousItem && context.textValue !== "") {
          context.onTextValueChange(previousItem.textValue);
          if (context.autocomplete.type === "both") {
            context.onFilterValueChange(previousItem.textValue);
          }
        } else {
          context.onValueChange(void 0);
          context.onTextValueChange("");
        }
      })
    }
  );
});
ComboxboxTextInput.displayName = "ComboboxTextInput";
const ComboboxIcon = React.forwardRef((props, forwardedRef) => {
  const { children, ...iconProps } = props;
  const context = useComboboxContext(INPUT_NAME);
  const isDisabled = context.disabled;
  const handleOpen = () => {
    if (!isDisabled) {
      context.onOpenChange(true);
      context.trigger?.focus();
    }
  };
  return /* @__PURE__ */ jsx(
    Primitive.button,
    {
      "aria-hidden": true,
      type: "button",
      "aria-disabled": isDisabled,
      "aria-controls": context.contentId,
      "aria-expanded": context.open,
      disabled: isDisabled,
      "data-disabled": isDisabled ? "" : void 0,
      ...iconProps,
      tabIndex: -1,
      ref: forwardedRef,
      onClick: composeEventHandlers$1(iconProps.onClick, () => {
        context.trigger?.focus();
      }),
      onPointerDown: composeEventHandlers$1(iconProps.onPointerDown, (event) => {
        if (event.button === 0 && event.ctrlKey === false) {
          handleOpen();
          event.preventDefault();
        }
      }),
      onKeyDown: composeEventHandlers$1(iconProps.onKeyDown, (event) => {
        if (OPEN_KEYS$1.includes(event.key)) {
          handleOpen();
          event.preventDefault();
        }
      }),
      children: children || "▼"
    }
  );
});
ComboboxIcon.displayName = "ComboboxIcon";
const PORTAL_NAME$1 = "ComboboxPortal";
const ComboboxPortal = (props) => {
  return /* @__PURE__ */ jsx(Portal$2, { asChild: true, ...props });
};
ComboboxPortal.displayName = PORTAL_NAME$1;
const CONTENT_NAME$1 = "ComboboxContent";
const ComboboxContent = React.forwardRef((props, forwardedRef) => {
  const context = useComboboxContext(CONTENT_NAME$1);
  const { getItems } = useCollection$1(void 0);
  const [fragment, setFragment] = React.useState();
  useLayoutEffect(() => {
    setFragment(new DocumentFragment());
  }, []);
  useLayoutEffect(() => {
    if (context.open && context.autocomplete.type === "none") {
      setTimeout(() => {
        const activeItem = getItems().find((item) => item.value === context.value);
        activeItem?.ref.current?.scrollIntoView({ block: "nearest" });
      });
    }
  }, [getItems, context.autocomplete, context.value, context.open]);
  if (!context.open) {
    const frag = fragment;
    return frag ? ReactDOM.createPortal(
      /* @__PURE__ */ jsx(Collection$1.Slot, { scope: void 0, children: /* @__PURE__ */ jsx("div", { children: props.children }) }),
      frag
    ) : null;
  }
  return /* @__PURE__ */ jsx(ComboboxContentImpl, { ...props, ref: forwardedRef });
});
ComboboxContent.displayName = CONTENT_NAME$1;
const CONTENT_MARGIN$1 = 10;
const ComboboxContentImpl = React.forwardRef(
  (props, forwardedRef) => {
    const { onEscapeKeyDown, onPointerDownOutside, ...contentProps } = props;
    const context = useComboboxContext(CONTENT_NAME$1);
    const composedRefs = useComposedRefs(forwardedRef, (node) => context.onContentChange(node));
    const { onOpenChange } = context;
    useFocusGuards();
    React.useEffect(() => {
      const close = () => {
        onOpenChange(false);
      };
      window.addEventListener("blur", close);
      window.addEventListener("resize", close);
      return () => {
        window.removeEventListener("blur", close);
        window.removeEventListener("resize", close);
      };
    }, [onOpenChange]);
    return /* @__PURE__ */ jsx(RemoveScroll, { allowPinchZoom: true, children: /* @__PURE__ */ jsx(
      DismissableLayer,
      {
        asChild: true,
        onEscapeKeyDown,
        onPointerDownOutside,
        onFocusOutside: (event) => {
          event.preventDefault();
        },
        onDismiss: () => {
          context.onOpenChange(false);
          context.trigger?.focus({ preventScroll: true });
        },
        children: /* @__PURE__ */ jsx(
          ComboboxPopperPosition,
          {
            role: "listbox",
            id: context.contentId,
            "data-state": context.open ? "open" : "closed",
            onContextMenu: (event) => event.preventDefault(),
            ...contentProps,
            ref: composedRefs,
            style: {
              // flex layout so we can place the scroll buttons properly
              display: "flex",
              flexDirection: "column",
              // reset the outline by default as the content MAY get focused
              outline: "none",
              ...contentProps.style
            }
          }
        )
      }
    ) });
  }
);
ComboboxContentImpl.displayName = "ComboboxContentImpl";
const ComboboxPopperPosition = React.forwardRef(
  (props, forwardedRef) => {
    const { align = "start", collisionPadding = CONTENT_MARGIN$1, ...popperProps } = props;
    return /* @__PURE__ */ jsx(
      PopperPrimitive.Content,
      {
        ...popperProps,
        ref: forwardedRef,
        align,
        collisionPadding,
        style: {
          // Ensure border-box for floating-ui calculations
          boxSizing: "border-box",
          ...popperProps.style,
          // re-namespace exposed content custom properties
          ...{
            "--radix-combobox-content-transform-origin": "var(--radix-popper-transform-origin)",
            "--radix-combobox-content-available-width": "var(--radix-popper-available-width)",
            "--radix-combobox-content-available-height": "var(--radix-popper-available-height)",
            "--radix-combobox-trigger-width": "var(--radix-popper-anchor-width)",
            "--radix-combobox-trigger-height": "var(--radix-popper-anchor-height)"
          }
        }
      }
    );
  }
);
ComboboxPopperPosition.displayName = "ComboboxPopperPosition";
const VIEWPORT_NAME$1 = "ComboboxViewport";
const ComboboxViewport = React.forwardRef((props, forwardedRef) => {
  const comboboxContext = useComboboxContext(VIEWPORT_NAME$1);
  const composedRefs = useComposedRefs(forwardedRef, comboboxContext.onViewportChange);
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(
      "style",
      {
        dangerouslySetInnerHTML: {
          __html: `[data-radix-combobox-viewport]{scrollbar-width:none;-ms-overflow-style:none;-webkit-overflow-scrolling:touch;}[data-radix-combobox-viewport]::-webkit-scrollbar{display:none}`
        }
      }
    ),
    /* @__PURE__ */ jsx(Collection$1.Slot, { scope: void 0, children: /* @__PURE__ */ jsx(
      Primitive.div,
      {
        "data-radix-combobox-viewport": "",
        role: "presentation",
        ...props,
        ref: composedRefs,
        style: {
          // we use position: 'relative' here on the `viewport` so that when we call
          // `selectedItem.offsetTop` in calculations, the offset is relative to the viewport
          // (independent of the scrollUpButton).
          position: "relative",
          flex: 1,
          overflow: "auto",
          ...props.style
        }
      }
    ) })
  ] });
});
ComboboxViewport.displayName = VIEWPORT_NAME$1;
const ITEM_NAME$1 = "ComboboxItem";
const [ComboboxItemProvider, useComboboxItemContext] = createContext(ITEM_NAME$1);
const ComboboxItem = React.forwardRef((props, forwardedRef) => {
  const { value, disabled = false, textValue: textValueProp, ...restProps } = props;
  const [fragment, setFragment] = React.useState();
  useLayoutEffect(() => {
    setFragment(new DocumentFragment());
  }, []);
  const { onTextValueChange, textValue: contextTextValue, ...context } = useComboboxContext(ITEM_NAME$1);
  const textId = useId();
  const [textValue, setTextValue] = React.useState(textValueProp ?? "");
  const isSelected = context.value === value;
  const { startsWith, contains } = useFilter(context.locale, { sensitivity: "base" });
  const handleTextValueChange = React.useCallback((node) => {
    setTextValue((prevTextValue) => {
      return prevTextValue || (node?.textContent ?? "").trim();
    });
  }, []);
  React.useEffect(() => {
    if (isSelected && contextTextValue === void 0 && textValue !== "") {
      onTextValueChange(textValue);
    }
  }, [textValue, isSelected, contextTextValue, onTextValueChange]);
  if (context.autocomplete.type === "both" && textValue && context.filterValue && !startsWith(textValue, context.filterValue) || context.autocomplete.type === "list" && context.autocomplete.filter === "startsWith" && textValue && contextTextValue && !startsWith(textValue, contextTextValue) || context.autocomplete.type === "list" && context.autocomplete.filter === "contains" && textValue && contextTextValue && !contains(textValue, contextTextValue)) {
    return fragment ? ReactDOM.createPortal(
      /* @__PURE__ */ jsx(
        ComboboxItemProvider,
        {
          textId,
          onTextValueChange: handleTextValueChange,
          isSelected,
          textValue,
          children: /* @__PURE__ */ jsx(
            Collection$1.ItemSlot,
            {
              scope: void 0,
              value,
              textValue,
              disabled,
              type: "option",
              isVisible: false,
              children: /* @__PURE__ */ jsx(ComboboxItemImpl, { ref: forwardedRef, value, disabled, ...restProps })
            }
          )
        }
      ),
      fragment
    ) : null;
  }
  return /* @__PURE__ */ jsx(
    ComboboxItemProvider,
    {
      textId,
      onTextValueChange: handleTextValueChange,
      isSelected,
      textValue,
      children: /* @__PURE__ */ jsx(
        Collection$1.ItemSlot,
        {
          scope: void 0,
          value,
          textValue,
          disabled,
          type: "option",
          isVisible: true,
          children: /* @__PURE__ */ jsx(ComboboxItemImpl, { ref: forwardedRef, value, disabled, ...restProps })
        }
      )
    }
  );
});
ComboboxItem.displayName = ITEM_NAME$1;
const ITEM_IMPL_NAME = "ComboboxItemImpl";
const ComboboxItemImpl = React.forwardRef((props, forwardedRef) => {
  const { value, disabled = false, ...restProps } = props;
  const itemRef = React.useRef(null);
  const composedRefs = useComposedRefs(forwardedRef, itemRef);
  const { getItems } = useCollection$1(void 0);
  const { onTextValueChange, visuallyFocussedItem, ...context } = useComboboxContext(ITEM_NAME$1);
  const { isSelected, textValue, textId } = useComboboxItemContext(ITEM_IMPL_NAME);
  const handleSelect = () => {
    if (!disabled) {
      context.onValueChange(value);
      onTextValueChange(textValue);
      context.onOpenChange(false);
      if (context.autocomplete.type === "both") {
        context.onFilterValueChange(textValue);
      }
      context.trigger?.focus({ preventScroll: true });
    }
  };
  const isFocused = React.useMemo(() => {
    return visuallyFocussedItem === getItems().find((item) => item.ref.current === itemRef.current)?.ref.current;
  }, [getItems, visuallyFocussedItem]);
  const id = useId();
  return /* @__PURE__ */ jsx(
    Primitive.div,
    {
      role: "option",
      "aria-labelledby": textId,
      "data-highlighted": isFocused ? "" : void 0,
      "aria-selected": isSelected && isFocused,
      "data-state": isSelected ? "checked" : "unchecked",
      "aria-disabled": disabled || void 0,
      "data-disabled": disabled ? "" : void 0,
      tabIndex: disabled ? void 0 : -1,
      ...restProps,
      id,
      ref: composedRefs,
      onPointerUp: composeEventHandlers$1(restProps.onPointerUp, handleSelect)
    }
  );
});
ComboboxItemImpl.displayName = ITEM_IMPL_NAME;
const ITEM_TEXT_NAME$1 = "ComboboxItemText";
const ComboboxItemText = React.forwardRef((props, forwardedRef) => {
  const { className: _unusedClassName, style: _unusedStyle, ...itemTextProps } = props;
  const itemContext = useComboboxItemContext(ITEM_TEXT_NAME$1);
  const composedRefs = useComposedRefs(forwardedRef, itemContext.onTextValueChange);
  return /* @__PURE__ */ jsx(Primitive.span, { id: itemContext.textId, ...itemTextProps, ref: composedRefs });
});
ComboboxItemText.displayName = ITEM_TEXT_NAME$1;
const ITEM_INDICATOR_NAME$1 = "ComboboxItemIndicator";
const ComboboxItemIndicator = React.forwardRef((props, forwardedRef) => {
  const { isSelected } = useComboboxItemContext(ITEM_INDICATOR_NAME$1);
  return isSelected ? /* @__PURE__ */ jsx(Primitive.span, { "aria-hidden": true, ...props, ref: forwardedRef }) : null;
});
ComboboxItemIndicator.displayName = ITEM_INDICATOR_NAME$1;
const NO_VALUE_FOUND_NAME = "ComboboxNoValueFound";
const ComboboxNoValueFound = React.forwardRef((props, ref) => {
  const {
    textValue = "",
    filterValue = "",
    visible = false,
    locale,
    autocomplete
  } = useComboboxContext(NO_VALUE_FOUND_NAME);
  const [items, setItems] = React.useState([]);
  const { subscribe } = useCollection$1(void 0);
  const { startsWith, contains } = useFilter(locale, { sensitivity: "base" });
  React.useEffect(() => {
    const unsub = subscribe((state) => {
      if (visible) {
        const filteredItems = state.filter((item) => item.type !== "create");
        setItems(filteredItems);
      } else {
        setItems(state);
      }
    });
    return () => {
      unsub();
    };
  }, [visible, subscribe]);
  if (autocomplete.type === "none" && items.length > 0)
    return null;
  if (autocomplete.type === "list" && autocomplete.filter === "startsWith" && items.some((item) => startsWith(item.textValue, textValue))) {
    return null;
  }
  if (autocomplete.type === "both" && items.some((item) => startsWith(item.textValue, filterValue))) {
    return null;
  }
  if (autocomplete.type === "list" && autocomplete.filter === "contains" && items.some((item) => contains(item.textValue, textValue))) {
    return null;
  }
  return /* @__PURE__ */ jsx(Primitive.div, { ...props, ref });
});
ComboboxNoValueFound.displayName = NO_VALUE_FOUND_NAME;
const ComboboxCreateItem = React.forwardRef((props, ref) => {
  const { disabled = false, ...restProps } = props;
  const context = useComboboxContext(NO_VALUE_FOUND_NAME);
  const { textValue, visuallyFocussedItem } = context;
  const { getItems, subscribe } = useCollection$1(void 0);
  const itemRef = React.useRef(null);
  const [show, setShow] = React.useState(false);
  const composedRefs = useComposedRefs(ref, itemRef);
  const isFocused = React.useMemo(() => {
    return visuallyFocussedItem === getItems().find((item) => item.ref.current === itemRef.current)?.ref.current;
  }, [getItems, visuallyFocussedItem]);
  const id = useId();
  const handleSelect = () => {
    if (!disabled && textValue) {
      context.onValueChange(textValue);
      context.onTextValueChange(textValue);
      context.onOpenChange(false);
      if (context.autocomplete.type === "both") {
        context.onFilterValueChange(textValue);
      }
      context.trigger?.focus({ preventScroll: true });
    }
  };
  useLayoutEffect(() => {
    const unsub = subscribe((state) => {
      setShow(!state.some((item) => item.textValue === textValue && item.type !== "create"));
    });
    if (getItems().length === 0) {
      setShow(true);
    }
    return () => {
      unsub();
    };
  }, [textValue, subscribe, getItems]);
  if ((!textValue || !show) && !context.visible) {
    return null;
  }
  return /* @__PURE__ */ jsx(
    Collection$1.ItemSlot,
    {
      scope: void 0,
      value: textValue ?? "",
      textValue: textValue ?? "",
      disabled,
      isVisible: true,
      type: "create",
      children: /* @__PURE__ */ jsx(
        Primitive.div,
        {
          role: "option",
          tabIndex: disabled ? void 0 : -1,
          "aria-disabled": disabled || void 0,
          "data-disabled": disabled ? "" : void 0,
          "data-highlighted": isFocused ? "" : void 0,
          ...restProps,
          id,
          ref: composedRefs,
          onPointerUp: composeEventHandlers$1(restProps.onPointerUp, handleSelect)
        }
      )
    }
  );
});
ComboboxCreateItem.displayName = "ComboboxCreateItem";
const Root$1 = Combobox;
const Trigger$1 = ComboboxTrigger;
const TextInput = ComboxboxTextInput;
const Icon$1 = ComboboxIcon;
const Portal$1 = ComboboxPortal;
const Content$1 = ComboboxContent;
const Viewport$1 = ComboboxViewport;
const Item$1 = ComboboxItem;
const ItemText$1 = ComboboxItemText;
const ItemIndicator$1 = ComboboxItemIndicator;
const NoValueFound = ComboboxNoValueFound;
const CreateItem = ComboboxCreateItem;
function findChangedIndex(a, b) {
  const length = Math.min(a.length, b.length);
  for (let i = 0; i < length; i++) {
    if (a[i] !== b[i]) {
      return i;
    }
  }
  return length;
}
const Combobox$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ComboboxItem,
  Content: Content$1,
  CreateItem,
  Icon: Icon$1,
  Item: Item$1,
  ItemIndicator: ItemIndicator$1,
  ItemText: ItemText$1,
  NoValueFound,
  Portal: Portal$1,
  Root: Root$1,
  TextInput,
  Trigger: Trigger$1,
  Viewport: Viewport$1
}, Symbol.toStringTag, { value: "Module" }));
function useCallbackRef(callback) {
  const callbackRef = React.useRef(callback);
  React.useEffect(() => {
    callbackRef.current = callback;
  });
  return React.useMemo(() => (...args) => callbackRef.current?.(...args), []);
}
const OPEN_KEYS = [" ", "Enter", "ArrowUp", "ArrowDown"];
const SELECTION_KEYS = [" ", "Enter"];
const SELECT_NAME = "Select";
const [Collection, useCollection, createCollectionScope] = createCollection$1(SELECT_NAME);
const [createSelectContext, createSelectScope] = createContextScope(SELECT_NAME, [
  createCollectionScope,
  createPopperScope
]);
const usePopperScope = createPopperScope();
const [SelectProvider, useSelectContext] = createSelectContext(SELECT_NAME);
const [SelectNativeOptionsProvider, useSelectNativeOptionsContext] = createSelectContext(SELECT_NAME);
const Select = (props) => {
  const {
    __scopeSelect,
    children,
    open: openProp,
    defaultOpen,
    onOpenChange,
    value: valueProp,
    defaultValue,
    onValueChange,
    dir,
    // name,
    // autoComplete,
    disabled,
    required,
    multi = false
  } = props;
  const popperScope = usePopperScope(__scopeSelect);
  const [trigger, setTrigger] = React.useState(null);
  const [valueNode, setValueNode] = React.useState(null);
  const [valueNodeHasChildren, setValueNodeHasChildren] = React.useState(false);
  const direction = useDirection(dir);
  const [open = false, setOpen] = useControllableState({
    prop: openProp,
    defaultProp: defaultOpen,
    onChange: onOpenChange
  });
  const [value, setValue] = useControllableState({
    prop: valueProp,
    defaultProp: defaultValue,
    onChange(value2) {
      if (onValueChange) {
        if (Array.isArray(value2)) {
          onValueChange(value2);
        } else {
          onValueChange(value2);
        }
      }
    }
  });
  const triggerPointerDownPosRef = React.useRef(null);
  const [_nativeOptionsSet, setNativeOptionsSet] = React.useState(/* @__PURE__ */ new Set());
  return /* @__PURE__ */ jsx(PopperPrimitive.Root, { ...popperScope, children: /* @__PURE__ */ jsx(
    SelectProvider,
    {
      required,
      scope: __scopeSelect,
      trigger,
      onTriggerChange: setTrigger,
      valueNode,
      onValueNodeChange: setValueNode,
      valueNodeHasChildren,
      onValueNodeHasChildrenChange: setValueNodeHasChildren,
      contentId: useId(),
      value,
      onValueChange: setValue,
      open,
      onOpenChange: setOpen,
      dir: direction,
      triggerPointerDownPosRef,
      disabled,
      multi,
      children: /* @__PURE__ */ jsx(Collection.Provider, { scope: __scopeSelect, children: /* @__PURE__ */ jsx(
        SelectNativeOptionsProvider,
        {
          scope: props.__scopeSelect,
          onNativeOptionAdd: React.useCallback((option) => {
            setNativeOptionsSet((prev) => new Set(prev).add(option));
          }, []),
          onNativeOptionRemove: React.useCallback((option) => {
            setNativeOptionsSet((prev) => {
              const optionsSet = new Set(prev);
              optionsSet.delete(option);
              return optionsSet;
            });
          }, []),
          children
        }
      ) })
    }
  ) });
};
Select.displayName = SELECT_NAME;
const TRIGGER_NAME = "SelectTrigger";
const SelectTrigger = React.forwardRef(
  (props, forwardedRef) => {
    const { __scopeSelect, ...triggerProps } = props;
    const popperScope = usePopperScope(__scopeSelect);
    const context = useSelectContext(TRIGGER_NAME, __scopeSelect);
    const isDisabled = context.disabled;
    const composedRefs = useComposedRefs(forwardedRef, context.onTriggerChange);
    const getItems = useCollection(__scopeSelect);
    const [searchRef, handleTypeaheadSearch, resetTypeahead] = useTypeaheadSearch((search) => {
      const enabledItems = getItems().filter((item) => !item.disabled);
      const currentItem = enabledItems.find((item) => item.value === context.value);
      const nextItem = findNextItem(enabledItems, search, currentItem);
      if (nextItem !== void 0 && !Array.isArray(nextItem.value)) {
        const newValue = context.multi ? [nextItem.value] : nextItem.value;
        context.onValueChange(newValue);
      }
    });
    const handleOpen = () => {
      if (!isDisabled) {
        context.onOpenChange(true);
        resetTypeahead();
      }
    };
    return /* @__PURE__ */ jsx(PopperPrimitive.Anchor, { asChild: true, ...popperScope, children: /* @__PURE__ */ jsx(
      Primitive.div,
      {
        role: "combobox",
        "aria-controls": context.contentId,
        "aria-expanded": context.open,
        "aria-required": context.required,
        "aria-autocomplete": "none",
        dir: context.dir,
        "data-state": context.open ? "open" : "closed",
        "data-disabled": isDisabled ? "" : void 0,
        "data-placeholder": context.value === void 0 ? "" : void 0,
        tabIndex: isDisabled ? void 0 : 0,
        ...triggerProps,
        ref: composedRefs,
        onClick: composeEventHandlers$1(triggerProps.onClick, (event) => {
          event.currentTarget.focus();
        }),
        onPointerDown: composeEventHandlers$1(triggerProps.onPointerDown, (event) => {
          const target = event.target;
          if (target.hasPointerCapture(event.pointerId)) {
            target.releasePointerCapture(event.pointerId);
          }
          const buttonTarg = target.closest("button") ?? target.closest("div");
          if (buttonTarg !== event.currentTarget) {
            return;
          }
          if (event.button === 0 && event.ctrlKey === false) {
            handleOpen();
            context.triggerPointerDownPosRef.current = {
              x: Math.round(event.pageX),
              y: Math.round(event.pageY)
            };
            event.preventDefault();
          }
        }),
        onKeyDown: composeEventHandlers$1(triggerProps.onKeyDown, (event) => {
          const isTypingAhead = searchRef.current !== "";
          const isModifierKey = event.ctrlKey || event.altKey || event.metaKey;
          const target = event.target;
          const buttonTarg = target.closest("button") ?? target.closest("div");
          if (buttonTarg !== event.currentTarget) {
            return;
          }
          if (!isModifierKey && event.key.length === 1)
            handleTypeaheadSearch(event.key);
          if (isTypingAhead && event.key === " ")
            return;
          if (OPEN_KEYS.includes(event.key)) {
            handleOpen();
            event.preventDefault();
          }
        })
      }
    ) });
  }
);
SelectTrigger.displayName = TRIGGER_NAME;
const VALUE_NAME = "SelectValue";
const SelectValue = React.forwardRef(
  (props, forwardedRef) => {
    const { __scopeSelect, children, placeholder, ...valueProps } = props;
    const context = useSelectContext(VALUE_NAME, __scopeSelect);
    const { onValueNodeHasChildrenChange } = context;
    const hasChildren = children !== void 0;
    const composedRefs = useComposedRefs(forwardedRef, context.onValueNodeChange);
    const [valuedItems, setValuedItems] = React.useState([]);
    const getItems = useCollection(__scopeSelect);
    useLayoutEffect(() => {
      onValueNodeHasChildrenChange(hasChildren);
    }, [onValueNodeHasChildrenChange, hasChildren]);
    React.useLayoutEffect(() => {
      if (Array.isArray(context.value) && valuedItems.length !== context.value.length) {
        const timeout = setTimeout(() => {
          const valuedItems2 = getItems().filter(
            (item) => !Array.isArray(item.value) ? context.value?.includes(item.value) : false
          );
          setValuedItems(valuedItems2);
        });
        return () => {
          clearTimeout(timeout);
        };
      }
    }, [context.value, getItems, valuedItems]);
    let renderValue;
    if ((context.value === void 0 || context.value.length === 0) && placeholder !== void 0) {
      renderValue = /* @__PURE__ */ jsx("span", { children: placeholder });
    } else if (typeof children === "function") {
      if (Array.isArray(context.value)) {
        const childrenArray = context.value.map((value) => {
          const valueItem = valuedItems.find((item) => item.value === value);
          if (!valueItem) {
            return null;
          }
          return children({ value, textValue: valueItem?.textValue });
        });
        renderValue = childrenArray.every((child) => child === null) ? placeholder : childrenArray;
      } else {
        renderValue = children(context.value);
      }
    } else {
      renderValue = children;
    }
    return /* @__PURE__ */ jsx(Primitive.span, { ...valueProps, ref: composedRefs, children: renderValue || null });
  }
);
SelectValue.displayName = VALUE_NAME;
const ICON_NAME = "SelectIcon";
const SelectIcon = React.forwardRef(
  (props, forwardedRef) => {
    const { __scopeSelect, children, ...iconProps } = props;
    return /* @__PURE__ */ jsx(Primitive.span, { "aria-hidden": true, ...iconProps, ref: forwardedRef, children: children || "▼" });
  }
);
SelectIcon.displayName = ICON_NAME;
const PORTAL_NAME = "SelectPortal";
const SelectPortal = (props) => {
  return /* @__PURE__ */ jsx(Portal$2, { asChild: true, ...props });
};
SelectPortal.displayName = PORTAL_NAME;
const CONTENT_NAME = "SelectContent";
const SelectContent = React.forwardRef(
  (props, forwardedRef) => {
    const context = useSelectContext(CONTENT_NAME, props.__scopeSelect);
    const [fragment, setFragment] = React.useState();
    useLayoutEffect(() => {
      setFragment(new DocumentFragment());
    }, []);
    if (!context.open) {
      const frag = fragment;
      return frag ? ReactDOM.createPortal(
        /* @__PURE__ */ jsx(SelectContentProvider, { scope: props.__scopeSelect, children: /* @__PURE__ */ jsx(Collection.Slot, { scope: props.__scopeSelect, children: /* @__PURE__ */ jsx("div", { children: props.children }) }) }),
        frag
      ) : null;
    }
    return /* @__PURE__ */ jsx(SelectContentImpl, { ...props, ref: forwardedRef });
  }
);
SelectContent.displayName = CONTENT_NAME;
const CONTENT_MARGIN = 10;
const [SelectContentProvider, useSelectContentContext] = createSelectContext(CONTENT_NAME);
const CONTENT_IMPL_NAME = "SelectContentImpl";
const SelectContentImpl = React.forwardRef(
  (props, forwardedRef) => {
    const {
      __scopeSelect,
      position = "item-aligned",
      onCloseAutoFocus,
      onEscapeKeyDown,
      onPointerDownOutside,
      //
      // PopperContent props
      side,
      sideOffset,
      align,
      alignOffset,
      arrowPadding,
      collisionBoundary,
      collisionPadding,
      sticky,
      hideWhenDetached,
      avoidCollisions,
      //
      ...contentProps
    } = props;
    const context = useSelectContext(CONTENT_NAME, __scopeSelect);
    const [content, setContent] = React.useState(null);
    const [viewport, setViewport] = React.useState(null);
    const composedRefs = useComposedRefs(forwardedRef, (node) => setContent(node));
    const [selectedItem, setSelectedItem] = React.useState(null);
    const [selectedItemText, setSelectedItemText] = React.useState(null);
    const getItems = useCollection(__scopeSelect);
    const [isPositioned, setIsPositioned] = React.useState(false);
    const firstValidItemFoundRef = React.useRef(false);
    React.useEffect(() => {
      if (content)
        return hideOthers(content);
    }, [content]);
    useFocusGuards();
    const focusFirst = React.useCallback(
      (candidates) => {
        const [firstItem, ...restItems] = getItems().map((item) => item.ref.current);
        const [lastItem] = restItems.slice(-1);
        const PREVIOUSLY_FOCUSED_ELEMENT = document.activeElement;
        for (const candidate of candidates) {
          if (candidate === PREVIOUSLY_FOCUSED_ELEMENT)
            return;
          candidate?.scrollIntoView({ block: "nearest" });
          if (candidate === firstItem && viewport)
            viewport.scrollTop = 0;
          if (candidate === lastItem && viewport)
            viewport.scrollTop = viewport.scrollHeight;
          candidate?.focus();
          if (document.activeElement !== PREVIOUSLY_FOCUSED_ELEMENT)
            return;
        }
      },
      [getItems, viewport]
    );
    const focusSelectedItem = React.useCallback(
      () => focusFirst([selectedItem, content]),
      [focusFirst, selectedItem, content]
    );
    React.useEffect(() => {
      if (isPositioned) {
        focusSelectedItem();
      }
    }, [isPositioned, focusSelectedItem]);
    const { onOpenChange, triggerPointerDownPosRef } = context;
    React.useEffect(() => {
      if (content) {
        let pointerMoveDelta = { x: 0, y: 0 };
        const handlePointerMove = (event) => {
          pointerMoveDelta = {
            x: Math.abs(Math.round(event.pageX) - (triggerPointerDownPosRef.current?.x ?? 0)),
            y: Math.abs(Math.round(event.pageY) - (triggerPointerDownPosRef.current?.y ?? 0))
          };
        };
        const handlePointerUp = (event) => {
          if (pointerMoveDelta.x <= 10 && pointerMoveDelta.y <= 10) {
            event.preventDefault();
          } else if (!content.contains(event.target)) {
            onOpenChange(false);
          }
          document.removeEventListener("pointermove", handlePointerMove);
          triggerPointerDownPosRef.current = null;
        };
        if (triggerPointerDownPosRef.current !== null) {
          document.addEventListener("pointermove", handlePointerMove);
          document.addEventListener("pointerup", handlePointerUp, { capture: true, once: true });
        }
        return () => {
          document.removeEventListener("pointermove", handlePointerMove);
          document.removeEventListener("pointerup", handlePointerUp, { capture: true });
        };
      }
    }, [content, onOpenChange, triggerPointerDownPosRef]);
    React.useEffect(() => {
      const close = () => onOpenChange(false);
      window.addEventListener("blur", close);
      window.addEventListener("resize", close);
      return () => {
        window.removeEventListener("blur", close);
        window.removeEventListener("resize", close);
      };
    }, [onOpenChange]);
    const [searchRef, handleTypeaheadSearch] = useTypeaheadSearch((search) => {
      const enabledItems = getItems().filter((item) => !item.disabled);
      const currentItem = enabledItems.find((item) => item.ref.current === document.activeElement);
      const nextItem = findNextItem(enabledItems, search, currentItem);
      if (nextItem) {
        setTimeout(() => nextItem.ref.current.focus());
      }
    });
    const itemRefCallback = React.useCallback(
      (node, value, disabled) => {
        const isFirstValidItem = !firstValidItemFoundRef.current && !disabled;
        const isSelectedItem = context.value !== void 0 && context.value === value;
        if (isSelectedItem || isFirstValidItem) {
          setSelectedItem(node);
          if (isFirstValidItem)
            firstValidItemFoundRef.current = true;
        }
      },
      [context.value]
    );
    const handleItemLeave = React.useCallback(() => content?.focus(), [content]);
    const itemTextRefCallback = React.useCallback(
      (node, value, disabled) => {
        const isFirstValidItem = !firstValidItemFoundRef.current && !disabled;
        const isSelectedItem = context.value !== void 0 && (Array.isArray(value) ? value.every((v) => context.value?.includes(v)) : context.value === value);
        if (isSelectedItem || isFirstValidItem) {
          setSelectedItemText(node);
        }
      },
      [context.value]
    );
    const SelectPosition = position === "popper" ? SelectPopperPosition : SelectItemAlignedPosition;
    const popperContentProps = SelectPosition === SelectPopperPosition ? {
      side,
      sideOffset,
      align,
      alignOffset,
      arrowPadding,
      collisionBoundary,
      collisionPadding,
      sticky,
      hideWhenDetached,
      avoidCollisions
    } : {};
    return /* @__PURE__ */ jsx(
      SelectContentProvider,
      {
        scope: __scopeSelect,
        content,
        viewport,
        onViewportChange: setViewport,
        itemRefCallback,
        selectedItem,
        onItemLeave: handleItemLeave,
        itemTextRefCallback,
        focusSelectedItem,
        selectedItemText,
        position,
        isPositioned,
        searchRef,
        children: /* @__PURE__ */ jsx(RemoveScroll, { as: Slot, allowPinchZoom: true, children: /* @__PURE__ */ jsx(
          FocusScope,
          {
            asChild: true,
            trapped: context.open,
            onMountAutoFocus: (event) => {
              event.preventDefault();
            },
            onUnmountAutoFocus: composeEventHandlers$1(onCloseAutoFocus, (event) => {
              context.trigger?.focus({ preventScroll: true });
              document.getSelection()?.empty();
              event.preventDefault();
            }),
            children: /* @__PURE__ */ jsx(
              DismissableLayer,
              {
                asChild: true,
                disableOutsidePointerEvents: true,
                onEscapeKeyDown,
                onPointerDownOutside,
                onFocusOutside: (event) => event.preventDefault(),
                onDismiss: () => context.onOpenChange(false),
                children: /* @__PURE__ */ jsx(
                  SelectPosition,
                  {
                    role: "listbox",
                    id: context.contentId,
                    "data-state": context.open ? "open" : "closed",
                    "aria-multiselectable": context.multi ? "true" : void 0,
                    dir: context.dir,
                    onContextMenu: (event) => event.preventDefault(),
                    ...contentProps,
                    ...popperContentProps,
                    onPlaced: () => setIsPositioned(true),
                    ref: composedRefs,
                    style: {
                      // flex layout so we can place the scroll buttons properly
                      display: "flex",
                      flexDirection: "column",
                      // reset the outline by default as the content MAY get focused
                      outline: "none",
                      ...contentProps.style
                    },
                    onKeyDown: composeEventHandlers$1(contentProps.onKeyDown, (event) => {
                      const isModifierKey = event.ctrlKey || event.altKey || event.metaKey;
                      if (event.key === "Tab")
                        event.preventDefault();
                      if (!isModifierKey && event.key.length === 1)
                        handleTypeaheadSearch(event.key);
                      if (["ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) {
                        const items = getItems().filter((item) => !item.disabled);
                        let candidateNodes = items.map((item) => item.ref.current);
                        if (["ArrowUp", "End"].includes(event.key)) {
                          candidateNodes = candidateNodes.slice().reverse();
                        }
                        if (["ArrowUp", "ArrowDown"].includes(event.key)) {
                          const currentElement = event.target;
                          const currentIndex = candidateNodes.indexOf(currentElement);
                          candidateNodes = candidateNodes.slice(currentIndex + 1);
                        }
                        setTimeout(() => focusFirst(candidateNodes));
                        event.preventDefault();
                      }
                    })
                  }
                )
              }
            )
          }
        ) })
      }
    );
  }
);
SelectContentImpl.displayName = CONTENT_IMPL_NAME;
const ITEM_ALIGNED_POSITION_NAME = "SelectItemAlignedPosition";
const SelectItemAlignedPosition = React.forwardRef(
  (props, forwardedRef) => {
    const { __scopeSelect, onPlaced, ...popperProps } = props;
    const context = useSelectContext(CONTENT_NAME, __scopeSelect);
    const contentContext = useSelectContentContext(CONTENT_NAME, __scopeSelect);
    const [contentWrapper, setContentWrapper] = React.useState(null);
    const [content, setContent] = React.useState(null);
    const composedRefs = useComposedRefs(forwardedRef, (node) => setContent(node));
    const getItems = useCollection(__scopeSelect);
    const shouldExpandOnScrollRef = React.useRef(false);
    const shouldRepositionRef = React.useRef(true);
    const { viewport, selectedItem, selectedItemText, focusSelectedItem } = contentContext;
    const position = React.useCallback(() => {
      if (context.trigger && context.valueNode && contentWrapper && content && viewport && selectedItem && selectedItemText) {
        const triggerRect = context.trigger.getBoundingClientRect();
        const contentRect = content.getBoundingClientRect();
        const valueNodeRect = context.valueNode.getBoundingClientRect();
        const itemTextRect = selectedItemText.getBoundingClientRect();
        if (context.dir !== "rtl") {
          const itemTextOffset = itemTextRect.left - contentRect.left;
          const left = valueNodeRect.left - itemTextOffset;
          const leftDelta = triggerRect.left - left;
          const minContentWidth = triggerRect.width + leftDelta;
          const contentWidth = Math.max(minContentWidth, contentRect.width);
          const rightEdge = window.innerWidth - CONTENT_MARGIN;
          const clampedLeft = clamp(left, [CONTENT_MARGIN, rightEdge - contentWidth]);
          contentWrapper.style.minWidth = `${minContentWidth}px`;
          contentWrapper.style.left = `${clampedLeft}px`;
        } else {
          const itemTextOffset = contentRect.right - itemTextRect.right;
          const right = window.innerWidth - valueNodeRect.right - itemTextOffset;
          const rightDelta = window.innerWidth - triggerRect.right - right;
          const minContentWidth = triggerRect.width + rightDelta;
          const contentWidth = Math.max(minContentWidth, contentRect.width);
          const leftEdge = window.innerWidth - CONTENT_MARGIN;
          const clampedRight = clamp(right, [CONTENT_MARGIN, leftEdge - contentWidth]);
          contentWrapper.style.minWidth = `${minContentWidth}px`;
          contentWrapper.style.right = `${clampedRight}px`;
        }
        const items = getItems();
        const availableHeight = window.innerHeight - CONTENT_MARGIN * 2;
        const itemsHeight = viewport.scrollHeight;
        const contentStyles = window.getComputedStyle(content);
        const contentBorderTopWidth = parseInt(contentStyles.borderTopWidth, 10);
        const contentPaddingTop = parseInt(contentStyles.paddingTop, 10);
        const contentBorderBottomWidth = parseInt(contentStyles.borderBottomWidth, 10);
        const contentPaddingBottom = parseInt(contentStyles.paddingBottom, 10);
        const fullContentHeight = contentBorderTopWidth + contentPaddingTop + itemsHeight + contentPaddingBottom + contentBorderBottomWidth;
        const minContentHeight = Math.min(selectedItem.offsetHeight * 5, fullContentHeight);
        const viewportStyles = window.getComputedStyle(viewport);
        const viewportPaddingTop = parseInt(viewportStyles.paddingTop, 10);
        const viewportPaddingBottom = parseInt(viewportStyles.paddingBottom, 10);
        const topEdgeToTriggerMiddle = triggerRect.top + triggerRect.height / 2 - CONTENT_MARGIN;
        const triggerMiddleToBottomEdge = availableHeight - topEdgeToTriggerMiddle;
        const selectedItemHalfHeight = selectedItem.offsetHeight / 2;
        const itemOffsetMiddle = selectedItem.offsetTop + selectedItemHalfHeight;
        const contentTopToItemMiddle = contentBorderTopWidth + contentPaddingTop + itemOffsetMiddle;
        const itemMiddleToContentBottom = fullContentHeight - contentTopToItemMiddle;
        const willAlignWithoutTopOverflow = contentTopToItemMiddle <= topEdgeToTriggerMiddle;
        if (willAlignWithoutTopOverflow) {
          const isLastItem = selectedItem === items[items.length - 1].ref.current;
          contentWrapper.style.bottom = `${0}px`;
          const viewportOffsetBottom = content.clientHeight - viewport.offsetTop - viewport.offsetHeight;
          const clampedTriggerMiddleToBottomEdge = Math.max(
            triggerMiddleToBottomEdge,
            selectedItemHalfHeight + // viewport might have padding bottom, include it to avoid a scrollable viewport
            (isLastItem ? viewportPaddingBottom : 0) + viewportOffsetBottom + contentBorderBottomWidth
          );
          const height = contentTopToItemMiddle + clampedTriggerMiddleToBottomEdge;
          contentWrapper.style.height = `${height}px`;
        } else {
          const isFirstItem = selectedItem === items[0].ref.current;
          contentWrapper.style.top = `${0}px`;
          const clampedTopEdgeToTriggerMiddle = Math.max(
            topEdgeToTriggerMiddle,
            contentBorderTopWidth + viewport.offsetTop + // viewport might have padding top, include it to avoid a scrollable viewport
            (isFirstItem ? viewportPaddingTop : 0) + selectedItemHalfHeight
          );
          const height = clampedTopEdgeToTriggerMiddle + itemMiddleToContentBottom;
          contentWrapper.style.height = `${height}px`;
          viewport.scrollTop = contentTopToItemMiddle - topEdgeToTriggerMiddle + viewport.offsetTop;
        }
        contentWrapper.style.margin = `${CONTENT_MARGIN}px 0`;
        contentWrapper.style.minHeight = `${minContentHeight}px`;
        contentWrapper.style.maxHeight = `${availableHeight}px`;
        onPlaced?.();
        requestAnimationFrame(() => shouldExpandOnScrollRef.current = true);
      }
    }, [
      getItems,
      context.trigger,
      context.valueNode,
      contentWrapper,
      content,
      viewport,
      selectedItem,
      selectedItemText,
      context.dir,
      onPlaced
    ]);
    useLayoutEffect(() => position(), [position]);
    const [contentZIndex, setContentZIndex] = React.useState();
    useLayoutEffect(() => {
      if (content)
        setContentZIndex(window.getComputedStyle(content).zIndex);
    }, [content]);
    const handleScrollButtonChange = React.useCallback(
      (node) => {
        if (node && shouldRepositionRef.current === true) {
          position();
          focusSelectedItem?.();
          shouldRepositionRef.current = false;
        }
      },
      [position, focusSelectedItem]
    );
    return /* @__PURE__ */ jsx(
      SelectViewportProvider,
      {
        scope: __scopeSelect,
        contentWrapper,
        shouldExpandOnScrollRef,
        onScrollButtonChange: handleScrollButtonChange,
        children: /* @__PURE__ */ jsx(
          "div",
          {
            ref: setContentWrapper,
            style: {
              display: "flex",
              flexDirection: "column",
              position: "fixed",
              zIndex: contentZIndex
            },
            children: /* @__PURE__ */ jsx(
              Primitive.div,
              {
                ...popperProps,
                ref: composedRefs,
                style: {
                  // When we get the height of the content, it includes borders. If we were to set
                  // the height without having `boxSizing: 'border-box'` it would be too big.
                  boxSizing: "border-box",
                  // We need to ensure the content doesn't get taller than the wrapper
                  maxHeight: "100%",
                  ...popperProps.style
                }
              }
            )
          }
        )
      }
    );
  }
);
SelectItemAlignedPosition.displayName = ITEM_ALIGNED_POSITION_NAME;
const POPPER_POSITION_NAME = "SelectPopperPosition";
const SelectPopperPosition = React.forwardRef(
  (props, forwardedRef) => {
    const { __scopeSelect, align = "start", collisionPadding = CONTENT_MARGIN, ...popperProps } = props;
    const popperScope = usePopperScope(__scopeSelect);
    return /* @__PURE__ */ jsx(
      PopperPrimitive.Content,
      {
        ...popperScope,
        ...popperProps,
        ref: forwardedRef,
        align,
        collisionPadding,
        style: {
          // Ensure border-box for floating-ui calculations
          boxSizing: "border-box",
          ...popperProps.style,
          // re-namespace exposed content custom properties
          ...{
            "--radix-select-content-transform-origin": "var(--radix-popper-transform-origin)",
            "--radix-select-content-available-width": "var(--radix-popper-available-width)",
            "--radix-select-content-available-height": "var(--radix-popper-available-height)",
            "--radix-select-trigger-width": "var(--radix-popper-anchor-width)",
            "--radix-select-trigger-height": "var(--radix-popper-anchor-height)"
          }
        }
      }
    );
  }
);
SelectPopperPosition.displayName = POPPER_POSITION_NAME;
const [SelectViewportProvider, useSelectViewportContext] = createSelectContext(
  CONTENT_NAME,
  {}
);
const VIEWPORT_NAME = "SelectViewport";
const SelectViewport = React.forwardRef(
  (props, forwardedRef) => {
    const { __scopeSelect, ...viewportProps } = props;
    const contentContext = useSelectContentContext(VIEWPORT_NAME, __scopeSelect);
    const viewportContext = useSelectViewportContext(VIEWPORT_NAME, __scopeSelect);
    const composedRefs = useComposedRefs(forwardedRef, contentContext.onViewportChange);
    const prevScrollTopRef = React.useRef(0);
    return /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(
        "style",
        {
          dangerouslySetInnerHTML: {
            __html: `[data-radix-select-viewport]{scrollbar-width:none;-ms-overflow-style:none;-webkit-overflow-scrolling:touch;}[data-radix-select-viewport]::-webkit-scrollbar{display:none}`
          }
        }
      ),
      /* @__PURE__ */ jsx(Collection.Slot, { scope: __scopeSelect, children: /* @__PURE__ */ jsx(
        Primitive.div,
        {
          "data-radix-select-viewport": "",
          role: "presentation",
          ...viewportProps,
          ref: composedRefs,
          style: {
            // we use position: 'relative' here on the `viewport` so that when we call
            // `selectedItem.offsetTop` in calculations, the offset is relative to the viewport
            // (independent of the scrollUpButton).
            position: "relative",
            flex: 1,
            overflow: "auto",
            ...viewportProps.style
          },
          onScroll: composeEventHandlers$1(viewportProps.onScroll, (event) => {
            const viewport = event.currentTarget;
            const { contentWrapper, shouldExpandOnScrollRef } = viewportContext;
            if (shouldExpandOnScrollRef?.current && contentWrapper) {
              const scrolledBy = Math.abs(prevScrollTopRef.current - viewport.scrollTop);
              if (scrolledBy > 0) {
                const availableHeight = window.innerHeight - CONTENT_MARGIN * 2;
                const cssMinHeight = parseFloat(contentWrapper.style.minHeight);
                const cssHeight = parseFloat(contentWrapper.style.height);
                const prevHeight = Math.max(cssMinHeight, cssHeight);
                if (prevHeight < availableHeight) {
                  const nextHeight = prevHeight + scrolledBy;
                  const clampedNextHeight = Math.min(availableHeight, nextHeight);
                  const heightDiff = nextHeight - clampedNextHeight;
                  contentWrapper.style.height = `${clampedNextHeight}px`;
                  if (contentWrapper.style.bottom === "0px") {
                    viewport.scrollTop = heightDiff > 0 ? heightDiff : 0;
                    contentWrapper.style.justifyContent = "flex-end";
                  }
                }
              }
            }
            prevScrollTopRef.current = viewport.scrollTop;
          })
        }
      ) })
    ] });
  }
);
SelectViewport.displayName = VIEWPORT_NAME;
const GROUP_NAME = "SelectGroup";
const [SelectGroupContextProvider, useSelectGroupContext] = createSelectContext(GROUP_NAME);
const SelectGroup = React.forwardRef(
  (props, forwardedRef) => {
    const { __scopeSelect, ...groupProps } = props;
    const groupId = useId();
    return /* @__PURE__ */ jsx(SelectGroupContextProvider, { scope: __scopeSelect, id: groupId, children: /* @__PURE__ */ jsx(Primitive.div, { role: "group", "aria-labelledby": groupId, ...groupProps, ref: forwardedRef }) });
  }
);
SelectGroup.displayName = GROUP_NAME;
const LABEL_NAME = "SelectLabel";
const SelectLabel = React.forwardRef(
  (props, forwardedRef) => {
    const { __scopeSelect, ...labelProps } = props;
    const groupContext = useSelectGroupContext(LABEL_NAME, __scopeSelect);
    return /* @__PURE__ */ jsx(Primitive.div, { id: groupContext.id, ...labelProps, ref: forwardedRef });
  }
);
SelectLabel.displayName = LABEL_NAME;
const ITEM_NAME = "SelectItem";
const [SelectItemContextProvider, useSelectItemContext] = createSelectContext(ITEM_NAME);
const SelectItem = React.forwardRef(
  (props, forwardedRef) => {
    const { __scopeSelect, value, disabled = false, textValue: textValueProp, ...itemProps } = props;
    const context = useSelectContext(ITEM_NAME, __scopeSelect);
    const contentContext = useSelectContentContext(ITEM_NAME, __scopeSelect);
    const isSelected = typeof value === "string" ? Array.isArray(context.value) ? context.value.includes(value) : context.value === value : value.every((v) => context.value?.includes(v));
    const isIntermediate = Array.isArray(context.value) && Array.isArray(value) && value.some((v) => context.value?.includes(v));
    const [textValue, setTextValue] = React.useState(textValueProp ?? "");
    const [isFocused, setIsFocused] = React.useState(false);
    const composedRefs = useComposedRefs(
      forwardedRef,
      (node) => contentContext.itemRefCallback?.(node, value, disabled)
    );
    const textId = useId();
    const handleSelect = () => {
      if (!disabled) {
        let newValue = context.multi && typeof value === "string" ? [value] : value;
        if (isIntermediate && !isSelected) {
          context.onValueChange(newValue);
        } else if (Array.isArray(context.value)) {
          newValue = toggleArrayValue(value, context.value);
        }
        context.onValueChange(newValue);
        if (!context.multi) {
          context.onOpenChange(false);
        }
      }
    };
    if (!context.multi && Array.isArray(value)) {
      throw new Error("You can only pass an array of values in multi selects");
    }
    return /* @__PURE__ */ jsx(
      SelectItemContextProvider,
      {
        scope: __scopeSelect,
        value,
        disabled,
        textId,
        isSelected,
        isIntermediate,
        onItemTextChange: React.useCallback((node) => {
          setTextValue((prevTextValue) => prevTextValue || (node?.textContent ?? "").trim());
        }, []),
        children: /* @__PURE__ */ jsx(Collection.ItemSlot, { scope: __scopeSelect, value, disabled, textValue, children: /* @__PURE__ */ jsx(
          Primitive.div,
          {
            role: "option",
            "aria-labelledby": textId,
            "data-highlighted": isFocused ? "" : void 0,
            "aria-selected": !context.multi ? isSelected && isFocused : void 0,
            "aria-checked": context.multi ? isSelected : void 0,
            "data-state": isSelected ? "checked" : "unchecked",
            "aria-disabled": disabled || void 0,
            "data-disabled": disabled ? "" : void 0,
            tabIndex: disabled ? void 0 : -1,
            ...itemProps,
            ref: composedRefs,
            onFocus: composeEventHandlers$1(itemProps.onFocus, () => setIsFocused(true)),
            onBlur: composeEventHandlers$1(itemProps.onBlur, () => setIsFocused(false)),
            onPointerUp: composeEventHandlers$1(itemProps.onPointerUp, handleSelect),
            onPointerMove: composeEventHandlers$1(itemProps.onPointerMove, (event) => {
              if (disabled) {
                contentContext.onItemLeave?.();
              } else {
                event.currentTarget.focus({ preventScroll: true });
              }
            }),
            onPointerLeave: composeEventHandlers$1(itemProps.onPointerLeave, (event) => {
              if (event.currentTarget === document.activeElement) {
                contentContext.onItemLeave?.();
              }
            }),
            onKeyDown: composeEventHandlers$1(itemProps.onKeyDown, (event) => {
              const isTypingAhead = contentContext.searchRef?.current !== "";
              if (isTypingAhead && event.key === " ")
                return;
              if (SELECTION_KEYS.includes(event.key))
                handleSelect();
              if (event.key === " ")
                event.preventDefault();
            })
          }
        ) })
      }
    );
  }
);
SelectItem.displayName = ITEM_NAME;
const ITEM_TEXT_NAME = "SelectItemText";
const SelectItemText = React.forwardRef(
  (props, forwardedRef) => {
    const { __scopeSelect, className: _className, style: _style, ...itemTextProps } = props;
    const context = useSelectContext(ITEM_TEXT_NAME, __scopeSelect);
    const contentContext = useSelectContentContext(ITEM_TEXT_NAME, __scopeSelect);
    const itemContext = useSelectItemContext(ITEM_TEXT_NAME, __scopeSelect);
    const nativeOptionsContext = useSelectNativeOptionsContext(ITEM_TEXT_NAME, __scopeSelect);
    const [itemTextNode, setItemTextNode] = React.useState(null);
    const composedRefs = useComposedRefs(
      forwardedRef,
      (node) => setItemTextNode(node),
      itemContext.onItemTextChange,
      (node) => contentContext.itemTextRefCallback?.(node, itemContext.value, itemContext.disabled)
    );
    const textContent = itemTextNode?.textContent;
    const nativeOption = React.useMemo(
      () => /* @__PURE__ */ jsx(
        "option",
        {
          value: itemContext.value,
          disabled: itemContext.disabled,
          children: textContent
        },
        Array.isArray(itemContext.value) ? itemContext.value.join(";") : itemContext.value
      ),
      [itemContext.disabled, itemContext.value, textContent]
    );
    const { onNativeOptionAdd, onNativeOptionRemove } = nativeOptionsContext;
    useLayoutEffect(() => {
      onNativeOptionAdd(nativeOption);
      return () => onNativeOptionRemove(nativeOption);
    }, [onNativeOptionAdd, onNativeOptionRemove, nativeOption]);
    return /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(Primitive.span, { id: itemContext.textId, ...itemTextProps, ref: composedRefs }),
      itemContext.isSelected && context.valueNode && !context.valueNodeHasChildren ? ReactDOM.createPortal(itemTextProps.children, context.valueNode) : null
    ] });
  }
);
SelectItemText.displayName = ITEM_TEXT_NAME;
const ITEM_INDICATOR_NAME = "SelectItemIndicator";
const SelectItemIndicator = React.forwardRef(
  (props, forwardedRef) => {
    const { __scopeSelect, children, ...itemIndicatorProps } = props;
    const itemContext = useSelectItemContext(ITEM_INDICATOR_NAME, __scopeSelect);
    if (typeof children === "function") {
      return /* @__PURE__ */ jsx(Primitive.span, { "aria-hidden": true, ...itemIndicatorProps, ref: forwardedRef, children: children({
        isSelected: itemContext.isSelected,
        isIntermediate: itemContext.isIntermediate
      }) });
    }
    return itemContext.isSelected ? /* @__PURE__ */ jsx(Primitive.span, { "aria-hidden": true, ...itemIndicatorProps, ref: forwardedRef, children }) : null;
  }
);
SelectItemIndicator.displayName = ITEM_INDICATOR_NAME;
const SCROLL_UP_BUTTON_NAME = "SelectScrollUpButton";
const SelectScrollUpButton = React.forwardRef(
  (props, forwardedRef) => {
    const contentContext = useSelectContentContext(SCROLL_UP_BUTTON_NAME, props.__scopeSelect);
    const viewportContext = useSelectViewportContext(SCROLL_UP_BUTTON_NAME, props.__scopeSelect);
    const [canScrollUp, setCanScrollUp] = React.useState(false);
    const composedRefs = useComposedRefs(forwardedRef, viewportContext.onScrollButtonChange);
    useLayoutEffect(() => {
      if (contentContext.viewport && contentContext.isPositioned) {
        const viewport = contentContext.viewport;
        const handleScroll = () => {
          const canScrollUp2 = viewport.scrollTop > 0;
          setCanScrollUp(canScrollUp2);
        };
        handleScroll();
        viewport.addEventListener("scroll", handleScroll);
        return () => viewport.removeEventListener("scroll", handleScroll);
      }
    }, [contentContext.viewport, contentContext.isPositioned]);
    return canScrollUp ? /* @__PURE__ */ jsx(
      SelectScrollButtonImpl,
      {
        ...props,
        ref: composedRefs,
        onAutoScroll: () => {
          const { viewport, selectedItem } = contentContext;
          if (viewport && selectedItem) {
            viewport.scrollTop -= selectedItem.offsetHeight;
          }
        }
      }
    ) : null;
  }
);
SelectScrollUpButton.displayName = SCROLL_UP_BUTTON_NAME;
const SCROLL_DOWN_BUTTON_NAME = "SelectScrollDownButton";
const SelectScrollDownButton = React.forwardRef(
  (props, forwardedRef) => {
    const contentContext = useSelectContentContext(SCROLL_DOWN_BUTTON_NAME, props.__scopeSelect);
    const viewportContext = useSelectViewportContext(SCROLL_DOWN_BUTTON_NAME, props.__scopeSelect);
    const [canScrollDown, setCanScrollDown] = React.useState(false);
    const composedRefs = useComposedRefs(forwardedRef, viewportContext.onScrollButtonChange);
    useLayoutEffect(() => {
      if (contentContext.viewport && contentContext.isPositioned) {
        const viewport = contentContext.viewport;
        const handleScroll = () => {
          const maxScroll = viewport.scrollHeight - viewport.clientHeight;
          const canScrollDown2 = Math.ceil(viewport.scrollTop) < maxScroll;
          setCanScrollDown(canScrollDown2);
        };
        handleScroll();
        viewport.addEventListener("scroll", handleScroll);
        return () => viewport.removeEventListener("scroll", handleScroll);
      }
    }, [contentContext.viewport, contentContext.isPositioned]);
    return canScrollDown ? /* @__PURE__ */ jsx(
      SelectScrollButtonImpl,
      {
        ...props,
        ref: composedRefs,
        onAutoScroll: () => {
          const { viewport, selectedItem } = contentContext;
          if (viewport && selectedItem) {
            viewport.scrollTop += selectedItem.offsetHeight;
          }
        }
      }
    ) : null;
  }
);
SelectScrollDownButton.displayName = SCROLL_DOWN_BUTTON_NAME;
const SelectScrollButtonImpl = React.forwardRef(
  (props, forwardedRef) => {
    const { __scopeSelect, onAutoScroll, ...scrollIndicatorProps } = props;
    const contentContext = useSelectContentContext("SelectScrollButton", __scopeSelect);
    const autoScrollTimerRef = React.useRef(null);
    const getItems = useCollection(__scopeSelect);
    const clearAutoScrollTimer = React.useCallback(() => {
      if (autoScrollTimerRef.current !== null) {
        window.clearInterval(autoScrollTimerRef.current);
        autoScrollTimerRef.current = null;
      }
    }, []);
    React.useEffect(() => {
      return () => clearAutoScrollTimer();
    }, [clearAutoScrollTimer]);
    useLayoutEffect(() => {
      const activeItem = getItems().find((item) => item.ref.current === document.activeElement);
      activeItem?.ref.current?.scrollIntoView({ block: "nearest" });
    }, [getItems]);
    return /* @__PURE__ */ jsx(
      Primitive.div,
      {
        "aria-hidden": true,
        ...scrollIndicatorProps,
        ref: forwardedRef,
        style: { flexShrink: 0, ...scrollIndicatorProps.style },
        onPointerMove: composeEventHandlers$1(scrollIndicatorProps.onPointerMove, () => {
          contentContext.onItemLeave?.();
          if (autoScrollTimerRef.current === null) {
            autoScrollTimerRef.current = window.setInterval(onAutoScroll, 50);
          }
        }),
        onPointerLeave: composeEventHandlers$1(scrollIndicatorProps.onPointerLeave, () => {
          clearAutoScrollTimer();
        })
      }
    );
  }
);
SelectScrollButtonImpl.displayName = "SelectScrollButtonImpl";
const SEPARATOR_NAME = "SelectSeparator";
const SelectSeparator = React.forwardRef(
  (props, forwardedRef) => {
    const { __scopeSelect, ...separatorProps } = props;
    return /* @__PURE__ */ jsx(Primitive.div, { "aria-hidden": true, ...separatorProps, ref: forwardedRef });
  }
);
SelectSeparator.displayName = SEPARATOR_NAME;
const ARROW_NAME = "SelectArrow";
const SelectArrow = React.forwardRef(
  (props, forwardedRef) => {
    const { __scopeSelect, ...arrowProps } = props;
    const popperScope = usePopperScope(__scopeSelect);
    const context = useSelectContext(ARROW_NAME, __scopeSelect);
    const contentContext = useSelectContentContext(ARROW_NAME, __scopeSelect);
    return context.open && contentContext.position === "popper" ? /* @__PURE__ */ jsx(PopperPrimitive.Arrow, { ...popperScope, ...arrowProps, ref: forwardedRef }) : null;
  }
);
SelectArrow.displayName = ARROW_NAME;
const BUBBLE_SELECT_NAME = "BubbleSelect";
const BubbleSelect = React.forwardRef(
  (props, forwardedRef) => {
    const { value, ...selectProps } = props;
    const ref = React.useRef(null);
    const composedRefs = useComposedRefs(forwardedRef, ref);
    const prevValue = usePrevious(value);
    const context = useSelectContext(BUBBLE_SELECT_NAME, void 0);
    React.useEffect(() => {
      const select = ref.current;
      const selectProto = window.HTMLSelectElement.prototype;
      const descriptor = Object.getOwnPropertyDescriptor(selectProto, "value");
      const setValue = descriptor.set;
      if (prevValue !== value && setValue) {
        const event = new Event("change", { bubbles: true });
        setValue.call(select, value);
        select.dispatchEvent(event);
      }
    }, [prevValue, value]);
    let defaultValue = value;
    if (context.multi && !Array.isArray(value)) {
      defaultValue = [];
    }
    return /* @__PURE__ */ jsx(VisuallyHidden, { asChild: true, children: /* @__PURE__ */ jsx(
      "select",
      {
        ...selectProps,
        multiple: context.multi ? true : void 0,
        ref: composedRefs,
        defaultValue
      }
    ) });
  }
);
BubbleSelect.displayName = "BubbleSelect";
function useTypeaheadSearch(onSearchChange) {
  const handleSearchChange = useCallbackRef(onSearchChange);
  const searchRef = React.useRef("");
  const timerRef = React.useRef(0);
  const handleTypeaheadSearch = React.useCallback(
    (key) => {
      const search = searchRef.current + key;
      handleSearchChange(search);
      (function updateSearch(value) {
        searchRef.current = value;
        window.clearTimeout(timerRef.current);
        if (value !== "")
          timerRef.current = window.setTimeout(() => updateSearch(""), 1e3);
      })(search);
    },
    [handleSearchChange]
  );
  const resetTypeahead = React.useCallback(() => {
    searchRef.current = "";
    window.clearTimeout(timerRef.current);
  }, []);
  React.useEffect(() => {
    return () => window.clearTimeout(timerRef.current);
  }, []);
  return [searchRef, handleTypeaheadSearch, resetTypeahead];
}
function findNextItem(items, search, currentItem) {
  const isRepeated = search.length > 1 && Array.from(search).every((char) => char === search[0]);
  const normalizedSearch = isRepeated ? search[0] : search;
  const currentItemIndex = currentItem ? items.indexOf(currentItem) : -1;
  let wrappedItems = wrapArray(items, Math.max(currentItemIndex, 0));
  const excludeCurrentItem = normalizedSearch.length === 1;
  if (excludeCurrentItem)
    wrappedItems = wrappedItems.filter((v) => v !== currentItem);
  const nextItem = wrappedItems.find((item) => item.textValue.toLowerCase().startsWith(normalizedSearch.toLowerCase()));
  return nextItem !== currentItem ? nextItem : void 0;
}
function wrapArray(array, startIndex) {
  return array.map((_, index) => array[(startIndex + index) % array.length]);
}
const toggleArrayValue = (value, array = []) => {
  if (Array.isArray(value)) {
    return value.reduce((acc, val) => toggleArrayValue(val, acc), array);
  }
  const index = array.indexOf(value);
  if (index === -1) {
    return [...array, value];
  }
  return [...array.slice(0, index), ...array.slice(index + 1)];
};
const Root = Select;
const Trigger = SelectTrigger;
const Value = SelectValue;
const Icon = SelectIcon;
const Portal = SelectPortal;
const Content = SelectContent;
const Viewport = SelectViewport;
const Group = SelectGroup;
const Label = SelectLabel;
const Item = SelectItem;
const ItemText = SelectItemText;
const ItemIndicator = SelectItemIndicator;
const ScrollUpButton = SelectScrollUpButton;
const ScrollDownButton = SelectScrollDownButton;
const Separator = SelectSeparator;
const Arrow = SelectArrow;
const Select$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Arrow,
  Content,
  Group,
  Icon,
  Item,
  ItemIndicator,
  ItemText,
  Label,
  Portal,
  Root,
  ScrollDownButton,
  ScrollUpButton,
  Select,
  SelectArrow,
  SelectContent,
  SelectGroup,
  SelectIcon,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectLabel,
  SelectPortal,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
  SelectViewport,
  Separator,
  Trigger,
  Value,
  Viewport,
  createSelectScope
}, Symbol.toStringTag, { value: "Module" }));
function composeEventHandlers(originalEventHandler, ourEventHandler, { checkForDefaultPrevented = true } = {}) {
  return function handleEvent(event) {
    originalEventHandler?.(event);
    if (checkForDefaultPrevented === false || !event.defaultPrevented) {
      return ourEventHandler?.(event);
    }
  };
}
export {
  Combobox$1 as Combobox,
  Select$1 as Select,
  composeEventHandlers,
  createCollection,
  useCallbackRef,
  useCollator,
  useFilter,
  usePrev
};
//# sourceMappingURL=index.mjs.map
