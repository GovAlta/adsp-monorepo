/**
 * We've forked this from RadixUI to add primarily support for multi-select.
 * This is on their roadmap – https://github.com/radix-ui/primitives/issues/1193
 *
 * The changes are dotted around the codebase but all linked to a primary objective:
 * 1. The Select `value` can now be a string or an array of strings
 * 2. The Select `onValueChange` callback now receives a string or an array of strings
 *
 * Therefore, anywhere you see code handling values. It will accept and manage `string | string[]`,
 * thankfully Typescript is very helpful with this.
 *
 * Hopefully in the future we can remove this fork ✌🏼
 */
import * as React from 'react';
import { DismissableLayer } from '@radix-ui/react-dismissable-layer';
import { FocusScope } from '@radix-ui/react-focus-scope';
import * as PopperPrimitive from '@radix-ui/react-popper';
import { Portal as PortalPrimitive } from '@radix-ui/react-portal';
import { Primitive } from '@radix-ui/react-primitive';
import type { Scope } from '@radix-ui/react-context';
import type * as Radix from '@radix-ui/react-primitive';
type Direction = 'ltr' | 'rtl';
type ScopedProps<P> = P & {
    __scopeSelect?: Scope;
};
declare const createSelectScope: import("@radix-ui/react-context").CreateScope;
interface SharedSelectProps {
    children?: React.ReactNode;
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?(open: boolean): void;
    dir?: Direction;
    name?: string;
    autoComplete?: string;
    disabled?: boolean;
    required?: boolean;
}
interface SingleSelectProps extends SharedSelectProps {
    onValueChange?(value: string): void;
    value?: string;
    defaultValue?: string;
    multi?: false;
}
interface MultiSelectProps extends SharedSelectProps {
    onValueChange?(value: string[]): void;
    value?: string[];
    defaultValue?: string[];
    multi: true;
}
type SelectProps = SingleSelectProps | MultiSelectProps;
declare const Select: {
    (props: ScopedProps<SelectProps>): import("react/jsx-runtime").JSX.Element;
    displayName: string;
};
type PrimitiveButtonProps = Radix.ComponentPropsWithoutRef<typeof Primitive.div>;
type SelectTriggerProps = PrimitiveButtonProps;
declare const SelectTrigger: React.ForwardRefExoticComponent<Pick<Omit<React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>, "ref"> & {
    ref?: ((instance: HTMLDivElement | null) => void) | React.RefObject<HTMLDivElement> | null | undefined;
} & {
    asChild?: boolean | undefined;
}, "key" | keyof React.HTMLAttributes<HTMLDivElement> | "asChild"> & React.RefAttributes<HTMLDivElement>>;
type PrimitiveSpanProps = Radix.ComponentPropsWithoutRef<typeof Primitive.span>;
type SelectValueRenderFn = {
    ({ value, textValue }: {
        value?: string;
        textValue?: string;
    }): React.ReactNode;
    (value?: string): React.ReactNode;
};
interface SelectValueProps extends Omit<PrimitiveSpanProps, 'placeholder' | 'children'> {
    placeholder?: React.ReactNode;
    children?: React.ReactNode | SelectValueRenderFn;
}
declare const SelectValue: React.ForwardRefExoticComponent<SelectValueProps & React.RefAttributes<HTMLSpanElement>>;
type SelectIconProps = PrimitiveSpanProps;
declare const SelectIcon: React.ForwardRefExoticComponent<Pick<Omit<React.DetailedHTMLProps<React.HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>, "ref"> & {
    ref?: ((instance: HTMLSpanElement | null) => void) | React.RefObject<HTMLSpanElement> | null | undefined;
} & {
    asChild?: boolean | undefined;
}, "key" | "asChild" | keyof React.HTMLAttributes<HTMLSpanElement>> & React.RefAttributes<HTMLSpanElement>>;
type PortalProps = React.ComponentPropsWithoutRef<typeof PortalPrimitive>;
interface SelectPortalProps extends Omit<PortalProps, 'asChild'> {
    children?: React.ReactNode;
}
declare const SelectPortal: {
    (props: ScopedProps<SelectPortalProps>): import("react/jsx-runtime").JSX.Element;
    displayName: string;
};
type SelectContentProps = SelectContentImplProps;
declare const SelectContent: React.ForwardRefExoticComponent<SelectContentImplProps & React.RefAttributes<HTMLDivElement>>;
type DismissableLayerProps = React.ComponentPropsWithoutRef<typeof DismissableLayer>;
type FocusScopeProps = Radix.ComponentPropsWithoutRef<typeof FocusScope>;
type SelectPopperPrivateProps = {
    onPlaced?: PopperContentProps['onPlaced'];
};
interface SelectContentImplProps extends Omit<SelectPopperPositionProps, keyof SelectPopperPrivateProps>, Omit<SelectItemAlignedPositionProps, keyof SelectPopperPrivateProps> {
    /**
     * Event handler called when auto-focusing on close.
     * Can be prevented.
     */
    onCloseAutoFocus?: FocusScopeProps['onUnmountAutoFocus'];
    /**
     * Event handler called when the escape key is down.
     * Can be prevented.
     */
    onEscapeKeyDown?: DismissableLayerProps['onEscapeKeyDown'];
    /**
     * Event handler called when the a `pointerdown` event happens outside of the `DismissableLayer`.
     * Can be prevented.
     */
    onPointerDownOutside?: DismissableLayerProps['onPointerDownOutside'];
    position?: 'item-aligned' | 'popper';
}
interface SelectItemAlignedPositionProps extends PrimitiveDivProps, SelectPopperPrivateProps {
}
type PopperContentProps = React.ComponentPropsWithoutRef<typeof PopperPrimitive.Content>;
interface SelectPopperPositionProps extends PopperContentProps, SelectPopperPrivateProps {
}
type PrimitiveDivProps = Radix.ComponentPropsWithoutRef<typeof Primitive.div>;
type SelectViewportProps = PrimitiveDivProps;
declare const SelectViewport: React.ForwardRefExoticComponent<Pick<Omit<React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>, "ref"> & {
    ref?: ((instance: HTMLDivElement | null) => void) | React.RefObject<HTMLDivElement> | null | undefined;
} & {
    asChild?: boolean | undefined;
}, "key" | keyof React.HTMLAttributes<HTMLDivElement> | "asChild"> & React.RefAttributes<HTMLDivElement>>;
type SelectGroupProps = PrimitiveDivProps;
declare const SelectGroup: React.ForwardRefExoticComponent<Pick<Omit<React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>, "ref"> & {
    ref?: ((instance: HTMLDivElement | null) => void) | React.RefObject<HTMLDivElement> | null | undefined;
} & {
    asChild?: boolean | undefined;
}, "key" | keyof React.HTMLAttributes<HTMLDivElement> | "asChild"> & React.RefAttributes<HTMLDivElement>>;
type SelectLabelProps = PrimitiveDivProps;
declare const SelectLabel: React.ForwardRefExoticComponent<Pick<Omit<React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>, "ref"> & {
    ref?: ((instance: HTMLDivElement | null) => void) | React.RefObject<HTMLDivElement> | null | undefined;
} & {
    asChild?: boolean | undefined;
}, "key" | keyof React.HTMLAttributes<HTMLDivElement> | "asChild"> & React.RefAttributes<HTMLDivElement>>;
interface SelectItemProps extends PrimitiveDivProps {
    value: string | string[];
    disabled?: boolean;
    textValue?: string;
}
declare const SelectItem: React.ForwardRefExoticComponent<SelectItemProps & React.RefAttributes<HTMLDivElement>>;
type SelectItemTextProps = PrimitiveSpanProps;
declare const SelectItemText: React.ForwardRefExoticComponent<Pick<Omit<React.DetailedHTMLProps<React.HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>, "ref"> & {
    ref?: ((instance: HTMLSpanElement | null) => void) | React.RefObject<HTMLSpanElement> | null | undefined;
} & {
    asChild?: boolean | undefined;
}, "key" | "asChild" | keyof React.HTMLAttributes<HTMLSpanElement>> & React.RefAttributes<HTMLSpanElement>>;
interface SelectItemIndicatorProps extends Omit<PrimitiveSpanProps, 'children'> {
    children?: React.ReactNode | ((state: {
        isSelected: boolean;
        isIntermediate: boolean;
    }) => React.ReactNode);
}
declare const SelectItemIndicator: React.ForwardRefExoticComponent<SelectItemIndicatorProps & React.RefAttributes<HTMLSpanElement>>;
type SelectScrollUpButtonProps = Omit<SelectScrollButtonImplProps, 'onAutoScroll'>;
declare const SelectScrollUpButton: React.ForwardRefExoticComponent<SelectScrollUpButtonProps & React.RefAttributes<HTMLDivElement>>;
type SelectScrollDownButtonProps = Omit<SelectScrollButtonImplProps, 'onAutoScroll'>;
declare const SelectScrollDownButton: React.ForwardRefExoticComponent<SelectScrollDownButtonProps & React.RefAttributes<HTMLDivElement>>;
interface SelectScrollButtonImplProps extends PrimitiveDivProps {
    onAutoScroll(): void;
}
type SelectSeparatorProps = PrimitiveDivProps;
declare const SelectSeparator: React.ForwardRefExoticComponent<Pick<Omit<React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>, "ref"> & {
    ref?: ((instance: HTMLDivElement | null) => void) | React.RefObject<HTMLDivElement> | null | undefined;
} & {
    asChild?: boolean | undefined;
}, "key" | keyof React.HTMLAttributes<HTMLDivElement> | "asChild"> & React.RefAttributes<HTMLDivElement>>;
type PopperArrowProps = Radix.ComponentPropsWithoutRef<typeof PopperPrimitive.Arrow>;
type SelectArrowProps = PopperArrowProps;
declare const SelectArrow: React.ForwardRefExoticComponent<Pick<PopperPrimitive.PopperArrowProps & React.RefAttributes<SVGSVGElement>, "string" | "children" | "suppressHydrationWarning" | "className" | "id" | "lang" | "style" | "tabIndex" | "role" | "color" | "aria-activedescendant" | "aria-atomic" | "aria-autocomplete" | "aria-braillelabel" | "aria-brailleroledescription" | "aria-busy" | "aria-checked" | "aria-colcount" | "aria-colindex" | "aria-colindextext" | "aria-colspan" | "aria-controls" | "aria-current" | "aria-describedby" | "aria-description" | "aria-details" | "aria-disabled" | "aria-dropeffect" | "aria-errormessage" | "aria-expanded" | "aria-flowto" | "aria-grabbed" | "aria-haspopup" | "aria-hidden" | "aria-invalid" | "aria-keyshortcuts" | "aria-label" | "aria-labelledby" | "aria-level" | "aria-live" | "aria-modal" | "aria-multiline" | "aria-multiselectable" | "aria-orientation" | "aria-owns" | "aria-placeholder" | "aria-posinset" | "aria-pressed" | "aria-readonly" | "aria-relevant" | "aria-required" | "aria-roledescription" | "aria-rowcount" | "aria-rowindex" | "aria-rowindextext" | "aria-rowspan" | "aria-selected" | "aria-setsize" | "aria-sort" | "aria-valuemax" | "aria-valuemin" | "aria-valuenow" | "aria-valuetext" | "dangerouslySetInnerHTML" | "onCopy" | "onCopyCapture" | "onCut" | "onCutCapture" | "onPaste" | "onPasteCapture" | "onCompositionEnd" | "onCompositionEndCapture" | "onCompositionStart" | "onCompositionStartCapture" | "onCompositionUpdate" | "onCompositionUpdateCapture" | "onFocus" | "onFocusCapture" | "onBlur" | "onBlurCapture" | "onChange" | "onChangeCapture" | "onBeforeInput" | "onBeforeInputCapture" | "onInput" | "onInputCapture" | "onReset" | "onResetCapture" | "onSubmit" | "onSubmitCapture" | "onInvalid" | "onInvalidCapture" | "onLoad" | "onLoadCapture" | "onError" | "onErrorCapture" | "onKeyDown" | "onKeyDownCapture" | "onKeyPress" | "onKeyPressCapture" | "onKeyUp" | "onKeyUpCapture" | "onAbort" | "onAbortCapture" | "onCanPlay" | "onCanPlayCapture" | "onCanPlayThrough" | "onCanPlayThroughCapture" | "onDurationChange" | "onDurationChangeCapture" | "onEmptied" | "onEmptiedCapture" | "onEncrypted" | "onEncryptedCapture" | "onEnded" | "onEndedCapture" | "onLoadedData" | "onLoadedDataCapture" | "onLoadedMetadata" | "onLoadedMetadataCapture" | "onLoadStart" | "onLoadStartCapture" | "onPause" | "onPauseCapture" | "onPlay" | "onPlayCapture" | "onPlaying" | "onPlayingCapture" | "onProgress" | "onProgressCapture" | "onRateChange" | "onRateChangeCapture" | "onResize" | "onResizeCapture" | "onSeeked" | "onSeekedCapture" | "onSeeking" | "onSeekingCapture" | "onStalled" | "onStalledCapture" | "onSuspend" | "onSuspendCapture" | "onTimeUpdate" | "onTimeUpdateCapture" | "onVolumeChange" | "onVolumeChangeCapture" | "onWaiting" | "onWaitingCapture" | "onAuxClick" | "onAuxClickCapture" | "onClick" | "onClickCapture" | "onContextMenu" | "onContextMenuCapture" | "onDoubleClick" | "onDoubleClickCapture" | "onDrag" | "onDragCapture" | "onDragEnd" | "onDragEndCapture" | "onDragEnter" | "onDragEnterCapture" | "onDragExit" | "onDragExitCapture" | "onDragLeave" | "onDragLeaveCapture" | "onDragOver" | "onDragOverCapture" | "onDragStart" | "onDragStartCapture" | "onDrop" | "onDropCapture" | "onMouseDown" | "onMouseDownCapture" | "onMouseEnter" | "onMouseLeave" | "onMouseMove" | "onMouseMoveCapture" | "onMouseOut" | "onMouseOutCapture" | "onMouseOver" | "onMouseOverCapture" | "onMouseUp" | "onMouseUpCapture" | "onSelect" | "onSelectCapture" | "onTouchCancel" | "onTouchCancelCapture" | "onTouchEnd" | "onTouchEndCapture" | "onTouchMove" | "onTouchMoveCapture" | "onTouchStart" | "onTouchStartCapture" | "onPointerDown" | "onPointerDownCapture" | "onPointerMove" | "onPointerMoveCapture" | "onPointerUp" | "onPointerUpCapture" | "onPointerCancel" | "onPointerCancelCapture" | "onPointerEnter" | "onPointerLeave" | "onPointerOver" | "onPointerOverCapture" | "onPointerOut" | "onPointerOutCapture" | "onGotPointerCapture" | "onGotPointerCaptureCapture" | "onLostPointerCapture" | "onLostPointerCaptureCapture" | "onScroll" | "onScrollCapture" | "onWheel" | "onWheelCapture" | "onAnimationStart" | "onAnimationStartCapture" | "onAnimationEnd" | "onAnimationEndCapture" | "onAnimationIteration" | "onAnimationIterationCapture" | "onTransitionEnd" | "onTransitionEndCapture" | "key" | "clipPath" | "filter" | "mask" | "path" | "fill" | "values" | "stroke" | "asChild" | "height" | "max" | "media" | "method" | "min" | "name" | "target" | "type" | "width" | "crossOrigin" | "accentHeight" | "accumulate" | "additive" | "alignmentBaseline" | "allowReorder" | "alphabetic" | "amplitude" | "arabicForm" | "ascent" | "attributeName" | "attributeType" | "autoReverse" | "azimuth" | "baseFrequency" | "baselineShift" | "baseProfile" | "bbox" | "begin" | "bias" | "by" | "calcMode" | "capHeight" | "clip" | "clipPathUnits" | "clipRule" | "colorInterpolation" | "colorInterpolationFilters" | "colorProfile" | "colorRendering" | "contentScriptType" | "contentStyleType" | "cursor" | "cx" | "cy" | "d" | "decelerate" | "descent" | "diffuseConstant" | "direction" | "display" | "divisor" | "dominantBaseline" | "dur" | "dx" | "dy" | "edgeMode" | "elevation" | "enableBackground" | "end" | "exponent" | "externalResourcesRequired" | "fillOpacity" | "fillRule" | "filterRes" | "filterUnits" | "floodColor" | "floodOpacity" | "focusable" | "fontFamily" | "fontSize" | "fontSizeAdjust" | "fontStretch" | "fontStyle" | "fontVariant" | "fontWeight" | "format" | "fr" | "from" | "fx" | "fy" | "g1" | "g2" | "glyphName" | "glyphOrientationHorizontal" | "glyphOrientationVertical" | "glyphRef" | "gradientTransform" | "gradientUnits" | "hanging" | "horizAdvX" | "horizOriginX" | "href" | "ideographic" | "imageRendering" | "in2" | "in" | "intercept" | "k1" | "k2" | "k3" | "k4" | "k" | "kernelMatrix" | "kernelUnitLength" | "kerning" | "keyPoints" | "keySplines" | "keyTimes" | "lengthAdjust" | "letterSpacing" | "lightingColor" | "limitingConeAngle" | "local" | "markerEnd" | "markerHeight" | "markerMid" | "markerStart" | "markerUnits" | "markerWidth" | "maskContentUnits" | "maskUnits" | "mathematical" | "mode" | "numOctaves" | "offset" | "opacity" | "operator" | "order" | "orient" | "orientation" | "origin" | "overflow" | "overlinePosition" | "overlineThickness" | "paintOrder" | "panose1" | "pathLength" | "patternContentUnits" | "patternTransform" | "patternUnits" | "pointerEvents" | "points" | "pointsAtX" | "pointsAtY" | "pointsAtZ" | "preserveAlpha" | "preserveAspectRatio" | "primitiveUnits" | "r" | "radius" | "refX" | "refY" | "renderingIntent" | "repeatCount" | "repeatDur" | "requiredExtensions" | "requiredFeatures" | "restart" | "result" | "rotate" | "rx" | "ry" | "scale" | "seed" | "shapeRendering" | "slope" | "spacing" | "specularConstant" | "specularExponent" | "speed" | "spreadMethod" | "startOffset" | "stdDeviation" | "stemh" | "stemv" | "stitchTiles" | "stopColor" | "stopOpacity" | "strikethroughPosition" | "strikethroughThickness" | "strokeDasharray" | "strokeDashoffset" | "strokeLinecap" | "strokeLinejoin" | "strokeMiterlimit" | "strokeOpacity" | "strokeWidth" | "surfaceScale" | "systemLanguage" | "tableValues" | "targetX" | "targetY" | "textAnchor" | "textDecoration" | "textLength" | "textRendering" | "to" | "transform" | "u1" | "u2" | "underlinePosition" | "underlineThickness" | "unicode" | "unicodeBidi" | "unicodeRange" | "unitsPerEm" | "vAlphabetic" | "vectorEffect" | "version" | "vertAdvY" | "vertOriginX" | "vertOriginY" | "vHanging" | "vIdeographic" | "viewBox" | "viewTarget" | "visibility" | "vMathematical" | "widths" | "wordSpacing" | "writingMode" | "x1" | "x2" | "x" | "xChannelSelector" | "xHeight" | "xlinkActuate" | "xlinkArcrole" | "xlinkHref" | "xlinkRole" | "xlinkShow" | "xlinkTitle" | "xlinkType" | "xmlBase" | "xmlLang" | "xmlns" | "xmlnsXlink" | "xmlSpace" | "y1" | "y2" | "y" | "yChannelSelector" | "z" | "zoomAndPan"> & React.RefAttributes<SVGSVGElement>>;
declare const Root: {
    (props: ScopedProps<SelectProps>): import("react/jsx-runtime").JSX.Element;
    displayName: string;
};
declare const Trigger: React.ForwardRefExoticComponent<Pick<Omit<React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>, "ref"> & {
    ref?: ((instance: HTMLDivElement | null) => void) | React.RefObject<HTMLDivElement> | null | undefined;
} & {
    asChild?: boolean | undefined;
}, "key" | keyof React.HTMLAttributes<HTMLDivElement> | "asChild"> & React.RefAttributes<HTMLDivElement>>;
declare const Value: React.ForwardRefExoticComponent<SelectValueProps & React.RefAttributes<HTMLSpanElement>>;
declare const Icon: React.ForwardRefExoticComponent<Pick<Omit<React.DetailedHTMLProps<React.HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>, "ref"> & {
    ref?: ((instance: HTMLSpanElement | null) => void) | React.RefObject<HTMLSpanElement> | null | undefined;
} & {
    asChild?: boolean | undefined;
}, "key" | "asChild" | keyof React.HTMLAttributes<HTMLSpanElement>> & React.RefAttributes<HTMLSpanElement>>;
declare const Portal: {
    (props: ScopedProps<SelectPortalProps>): import("react/jsx-runtime").JSX.Element;
    displayName: string;
};
declare const Content: React.ForwardRefExoticComponent<SelectContentImplProps & React.RefAttributes<HTMLDivElement>>;
declare const Viewport: React.ForwardRefExoticComponent<Pick<Omit<React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>, "ref"> & {
    ref?: ((instance: HTMLDivElement | null) => void) | React.RefObject<HTMLDivElement> | null | undefined;
} & {
    asChild?: boolean | undefined;
}, "key" | keyof React.HTMLAttributes<HTMLDivElement> | "asChild"> & React.RefAttributes<HTMLDivElement>>;
declare const Group: React.ForwardRefExoticComponent<Pick<Omit<React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>, "ref"> & {
    ref?: ((instance: HTMLDivElement | null) => void) | React.RefObject<HTMLDivElement> | null | undefined;
} & {
    asChild?: boolean | undefined;
}, "key" | keyof React.HTMLAttributes<HTMLDivElement> | "asChild"> & React.RefAttributes<HTMLDivElement>>;
declare const Label: React.ForwardRefExoticComponent<Pick<Omit<React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>, "ref"> & {
    ref?: ((instance: HTMLDivElement | null) => void) | React.RefObject<HTMLDivElement> | null | undefined;
} & {
    asChild?: boolean | undefined;
}, "key" | keyof React.HTMLAttributes<HTMLDivElement> | "asChild"> & React.RefAttributes<HTMLDivElement>>;
declare const Item: React.ForwardRefExoticComponent<SelectItemProps & React.RefAttributes<HTMLDivElement>>;
declare const ItemText: React.ForwardRefExoticComponent<Pick<Omit<React.DetailedHTMLProps<React.HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>, "ref"> & {
    ref?: ((instance: HTMLSpanElement | null) => void) | React.RefObject<HTMLSpanElement> | null | undefined;
} & {
    asChild?: boolean | undefined;
}, "key" | "asChild" | keyof React.HTMLAttributes<HTMLSpanElement>> & React.RefAttributes<HTMLSpanElement>>;
declare const ItemIndicator: React.ForwardRefExoticComponent<SelectItemIndicatorProps & React.RefAttributes<HTMLSpanElement>>;
declare const ScrollUpButton: React.ForwardRefExoticComponent<SelectScrollUpButtonProps & React.RefAttributes<HTMLDivElement>>;
declare const ScrollDownButton: React.ForwardRefExoticComponent<SelectScrollDownButtonProps & React.RefAttributes<HTMLDivElement>>;
declare const Separator: React.ForwardRefExoticComponent<Pick<Omit<React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>, "ref"> & {
    ref?: ((instance: HTMLDivElement | null) => void) | React.RefObject<HTMLDivElement> | null | undefined;
} & {
    asChild?: boolean | undefined;
}, "key" | keyof React.HTMLAttributes<HTMLDivElement> | "asChild"> & React.RefAttributes<HTMLDivElement>>;
declare const Arrow: React.ForwardRefExoticComponent<Pick<PopperPrimitive.PopperArrowProps & React.RefAttributes<SVGSVGElement>, "string" | "children" | "suppressHydrationWarning" | "className" | "id" | "lang" | "style" | "tabIndex" | "role" | "color" | "aria-activedescendant" | "aria-atomic" | "aria-autocomplete" | "aria-braillelabel" | "aria-brailleroledescription" | "aria-busy" | "aria-checked" | "aria-colcount" | "aria-colindex" | "aria-colindextext" | "aria-colspan" | "aria-controls" | "aria-current" | "aria-describedby" | "aria-description" | "aria-details" | "aria-disabled" | "aria-dropeffect" | "aria-errormessage" | "aria-expanded" | "aria-flowto" | "aria-grabbed" | "aria-haspopup" | "aria-hidden" | "aria-invalid" | "aria-keyshortcuts" | "aria-label" | "aria-labelledby" | "aria-level" | "aria-live" | "aria-modal" | "aria-multiline" | "aria-multiselectable" | "aria-orientation" | "aria-owns" | "aria-placeholder" | "aria-posinset" | "aria-pressed" | "aria-readonly" | "aria-relevant" | "aria-required" | "aria-roledescription" | "aria-rowcount" | "aria-rowindex" | "aria-rowindextext" | "aria-rowspan" | "aria-selected" | "aria-setsize" | "aria-sort" | "aria-valuemax" | "aria-valuemin" | "aria-valuenow" | "aria-valuetext" | "dangerouslySetInnerHTML" | "onCopy" | "onCopyCapture" | "onCut" | "onCutCapture" | "onPaste" | "onPasteCapture" | "onCompositionEnd" | "onCompositionEndCapture" | "onCompositionStart" | "onCompositionStartCapture" | "onCompositionUpdate" | "onCompositionUpdateCapture" | "onFocus" | "onFocusCapture" | "onBlur" | "onBlurCapture" | "onChange" | "onChangeCapture" | "onBeforeInput" | "onBeforeInputCapture" | "onInput" | "onInputCapture" | "onReset" | "onResetCapture" | "onSubmit" | "onSubmitCapture" | "onInvalid" | "onInvalidCapture" | "onLoad" | "onLoadCapture" | "onError" | "onErrorCapture" | "onKeyDown" | "onKeyDownCapture" | "onKeyPress" | "onKeyPressCapture" | "onKeyUp" | "onKeyUpCapture" | "onAbort" | "onAbortCapture" | "onCanPlay" | "onCanPlayCapture" | "onCanPlayThrough" | "onCanPlayThroughCapture" | "onDurationChange" | "onDurationChangeCapture" | "onEmptied" | "onEmptiedCapture" | "onEncrypted" | "onEncryptedCapture" | "onEnded" | "onEndedCapture" | "onLoadedData" | "onLoadedDataCapture" | "onLoadedMetadata" | "onLoadedMetadataCapture" | "onLoadStart" | "onLoadStartCapture" | "onPause" | "onPauseCapture" | "onPlay" | "onPlayCapture" | "onPlaying" | "onPlayingCapture" | "onProgress" | "onProgressCapture" | "onRateChange" | "onRateChangeCapture" | "onResize" | "onResizeCapture" | "onSeeked" | "onSeekedCapture" | "onSeeking" | "onSeekingCapture" | "onStalled" | "onStalledCapture" | "onSuspend" | "onSuspendCapture" | "onTimeUpdate" | "onTimeUpdateCapture" | "onVolumeChange" | "onVolumeChangeCapture" | "onWaiting" | "onWaitingCapture" | "onAuxClick" | "onAuxClickCapture" | "onClick" | "onClickCapture" | "onContextMenu" | "onContextMenuCapture" | "onDoubleClick" | "onDoubleClickCapture" | "onDrag" | "onDragCapture" | "onDragEnd" | "onDragEndCapture" | "onDragEnter" | "onDragEnterCapture" | "onDragExit" | "onDragExitCapture" | "onDragLeave" | "onDragLeaveCapture" | "onDragOver" | "onDragOverCapture" | "onDragStart" | "onDragStartCapture" | "onDrop" | "onDropCapture" | "onMouseDown" | "onMouseDownCapture" | "onMouseEnter" | "onMouseLeave" | "onMouseMove" | "onMouseMoveCapture" | "onMouseOut" | "onMouseOutCapture" | "onMouseOver" | "onMouseOverCapture" | "onMouseUp" | "onMouseUpCapture" | "onSelect" | "onSelectCapture" | "onTouchCancel" | "onTouchCancelCapture" | "onTouchEnd" | "onTouchEndCapture" | "onTouchMove" | "onTouchMoveCapture" | "onTouchStart" | "onTouchStartCapture" | "onPointerDown" | "onPointerDownCapture" | "onPointerMove" | "onPointerMoveCapture" | "onPointerUp" | "onPointerUpCapture" | "onPointerCancel" | "onPointerCancelCapture" | "onPointerEnter" | "onPointerLeave" | "onPointerOver" | "onPointerOverCapture" | "onPointerOut" | "onPointerOutCapture" | "onGotPointerCapture" | "onGotPointerCaptureCapture" | "onLostPointerCapture" | "onLostPointerCaptureCapture" | "onScroll" | "onScrollCapture" | "onWheel" | "onWheelCapture" | "onAnimationStart" | "onAnimationStartCapture" | "onAnimationEnd" | "onAnimationEndCapture" | "onAnimationIteration" | "onAnimationIterationCapture" | "onTransitionEnd" | "onTransitionEndCapture" | "key" | "clipPath" | "filter" | "mask" | "path" | "fill" | "values" | "stroke" | "asChild" | "height" | "max" | "media" | "method" | "min" | "name" | "target" | "type" | "width" | "crossOrigin" | "accentHeight" | "accumulate" | "additive" | "alignmentBaseline" | "allowReorder" | "alphabetic" | "amplitude" | "arabicForm" | "ascent" | "attributeName" | "attributeType" | "autoReverse" | "azimuth" | "baseFrequency" | "baselineShift" | "baseProfile" | "bbox" | "begin" | "bias" | "by" | "calcMode" | "capHeight" | "clip" | "clipPathUnits" | "clipRule" | "colorInterpolation" | "colorInterpolationFilters" | "colorProfile" | "colorRendering" | "contentScriptType" | "contentStyleType" | "cursor" | "cx" | "cy" | "d" | "decelerate" | "descent" | "diffuseConstant" | "direction" | "display" | "divisor" | "dominantBaseline" | "dur" | "dx" | "dy" | "edgeMode" | "elevation" | "enableBackground" | "end" | "exponent" | "externalResourcesRequired" | "fillOpacity" | "fillRule" | "filterRes" | "filterUnits" | "floodColor" | "floodOpacity" | "focusable" | "fontFamily" | "fontSize" | "fontSizeAdjust" | "fontStretch" | "fontStyle" | "fontVariant" | "fontWeight" | "format" | "fr" | "from" | "fx" | "fy" | "g1" | "g2" | "glyphName" | "glyphOrientationHorizontal" | "glyphOrientationVertical" | "glyphRef" | "gradientTransform" | "gradientUnits" | "hanging" | "horizAdvX" | "horizOriginX" | "href" | "ideographic" | "imageRendering" | "in2" | "in" | "intercept" | "k1" | "k2" | "k3" | "k4" | "k" | "kernelMatrix" | "kernelUnitLength" | "kerning" | "keyPoints" | "keySplines" | "keyTimes" | "lengthAdjust" | "letterSpacing" | "lightingColor" | "limitingConeAngle" | "local" | "markerEnd" | "markerHeight" | "markerMid" | "markerStart" | "markerUnits" | "markerWidth" | "maskContentUnits" | "maskUnits" | "mathematical" | "mode" | "numOctaves" | "offset" | "opacity" | "operator" | "order" | "orient" | "orientation" | "origin" | "overflow" | "overlinePosition" | "overlineThickness" | "paintOrder" | "panose1" | "pathLength" | "patternContentUnits" | "patternTransform" | "patternUnits" | "pointerEvents" | "points" | "pointsAtX" | "pointsAtY" | "pointsAtZ" | "preserveAlpha" | "preserveAspectRatio" | "primitiveUnits" | "r" | "radius" | "refX" | "refY" | "renderingIntent" | "repeatCount" | "repeatDur" | "requiredExtensions" | "requiredFeatures" | "restart" | "result" | "rotate" | "rx" | "ry" | "scale" | "seed" | "shapeRendering" | "slope" | "spacing" | "specularConstant" | "specularExponent" | "speed" | "spreadMethod" | "startOffset" | "stdDeviation" | "stemh" | "stemv" | "stitchTiles" | "stopColor" | "stopOpacity" | "strikethroughPosition" | "strikethroughThickness" | "strokeDasharray" | "strokeDashoffset" | "strokeLinecap" | "strokeLinejoin" | "strokeMiterlimit" | "strokeOpacity" | "strokeWidth" | "surfaceScale" | "systemLanguage" | "tableValues" | "targetX" | "targetY" | "textAnchor" | "textDecoration" | "textLength" | "textRendering" | "to" | "transform" | "u1" | "u2" | "underlinePosition" | "underlineThickness" | "unicode" | "unicodeBidi" | "unicodeRange" | "unitsPerEm" | "vAlphabetic" | "vectorEffect" | "version" | "vertAdvY" | "vertOriginX" | "vertOriginY" | "vHanging" | "vIdeographic" | "viewBox" | "viewTarget" | "visibility" | "vMathematical" | "widths" | "wordSpacing" | "writingMode" | "x1" | "x2" | "x" | "xChannelSelector" | "xHeight" | "xlinkActuate" | "xlinkArcrole" | "xlinkHref" | "xlinkRole" | "xlinkShow" | "xlinkTitle" | "xlinkType" | "xmlBase" | "xmlLang" | "xmlns" | "xmlnsXlink" | "xmlSpace" | "y1" | "y2" | "y" | "yChannelSelector" | "z" | "zoomAndPan"> & React.RefAttributes<SVGSVGElement>>;
export { createSelectScope, Select, SelectTrigger, SelectValue, SelectIcon, SelectPortal, SelectContent, SelectViewport, SelectGroup, SelectLabel, SelectItem, SelectItemText, SelectItemIndicator, SelectScrollUpButton, SelectScrollDownButton, SelectSeparator, SelectArrow, Root, Trigger, Value, Icon, Portal, Content, Viewport, Group, Label, Item, ItemText, ItemIndicator, ScrollUpButton, ScrollDownButton, Separator, Arrow, };
export type { SingleSelectProps, MultiSelectProps, SelectProps, SelectTriggerProps, SelectValueProps, SelectValueRenderFn, SelectIconProps, SelectPortalProps, SelectContentProps, SelectContentImplProps, SelectViewportProps, SelectGroupProps, SelectLabelProps, SelectItemProps, SelectItemTextProps, SelectItemIndicatorProps, SelectScrollUpButtonProps, SelectScrollDownButtonProps, SelectSeparatorProps, SelectArrowProps, };
