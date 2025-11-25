type UseMeasureRect = Pick<DOMRectReadOnly, 'x' | 'y' | 'top' | 'left' | 'right' | 'bottom' | 'height' | 'width'>;
type UseMeasureRef<E extends Element = Element> = (element: E) => void;
type UseMeasureResult<E extends Element = Element> = [UseMeasureRef<E>, UseMeasureRect];
declare function useMeasure<E extends Element = Element>(): UseMeasureResult<E>;
export { useMeasure };
export type { UseMeasureRect, UseMeasureRef, UseMeasureResult };
//# sourceMappingURL=useMeasure.d.ts.map