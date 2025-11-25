import { StateField, type Range } from '@codemirror/state';
import { Decoration } from '@codemirror/view';
declare const addMarks: import("@codemirror/state").StateEffectType<Range<Decoration>[]>;
declare const filterMarks: import("@codemirror/state").StateEffectType<(_from: number, _to: number, _value: Decoration) => boolean>;
declare const lineHighlightMark: Decoration;
declare const markField: StateField<import("@codemirror/view").DecorationSet>;
export { addMarks, filterMarks, lineHighlightMark, markField };
//# sourceMappingURL=decorationExtension.d.ts.map