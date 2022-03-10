export const subjectEditorConfig = {
  'data-testid': 'templateForm-subject',
  height: 50,
  language: 'handlebars',
  options: {
    wordWrap: 'off' as const,
    scrollbar: { horizontal: 'hidden' as const, vertical: 'hidden' as const },
    find: {
      addExtraSpaceOnTop: false,
      autoFindInSelection: 'never' as const,
      seedSearchStringFromSelection: 'never' as const,
      overviewRulerBorder: false,
    },
    minimap: { enabled: false },
    renderLineHighlight: 'none' as const,
    overviewRulerLanes: 0,
    hideCursorInOverviewRuler: true,
    overviewRulerBorder: false,
  },
};

export const bodyEditorConfig = {
  'data-testid': 'templateForm-body',
  language: 'handlebars',
  options: {
    tabSize: 2,
    minimap: { enabled: false },
    overviewRulerBorder: false,
    lineHeight: 25,
    renderLineHighlight: 'line' as const,
    overviewRulerLanes: 0,
    hideCursorInOverviewRuler: true,
  },
};
