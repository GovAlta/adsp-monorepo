import { EditorProps } from '@monaco-editor/react';

export const bodyEditorConfig: EditorProps = {
  options: {
    // The editor pane changes size when it goes full page, so Monaco has to relayout itself.
    automaticLayout: true,
    tabSize: 2,
    minimap: { enabled: false },
    overviewRulerBorder: false,
    lineHeight: 25,
    renderLineHighlight: 'line' as const,
    overviewRulerLanes: 0,
    hideCursorInOverviewRuler: true,
    padding: { top: 20 },
  },
};
