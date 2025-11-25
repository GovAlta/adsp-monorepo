import CodeMirror from 'codemirror5';
declare function newlineAndIndentContinueMarkdownList(cm: CodeMirror.Editor): {
    toString(): "CodeMirror.PASS";
} | undefined;
export { newlineAndIndentContinueMarkdownList };
