import { EditorProps } from '@monaco-editor/react';

export const bodyEditorConfig: EditorProps = {
  options: {
    tabSize: 2,
    minimap: { enabled: true },
    overviewRulerBorder: false,
    lineHeight: 25,
    renderLineHighlight: 'line' as const,
    overviewRulerLanes: 0,
    hideCursorInOverviewRuler: true,
  },
};
