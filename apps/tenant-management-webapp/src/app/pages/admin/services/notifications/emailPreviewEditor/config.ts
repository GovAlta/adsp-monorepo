export const subjectEditorConfig = {
  'data-testid': 'templateForm-subject',
  height: 50,
  language: 'handlebars',
  options: {
    wordWrap: 'off',
    lineNumbers: 'off',
    scrollbar: { horizontal: 'hidden', vertical: 'hidden' },
    find: {
      addExtraSpaceOnTop: false,
      autoFindInSelection: 'never',
      seedSearchStringFromSelection: false,
      overviewRulerBorder: false,
    },
    minimap: { enabled: false },
    renderLineHighlight: 'none',
    overviewRulerLanes: 0,
    hideCursorInOverviewRuler: true,
    overviewRulerBorder: false,
  },
};

export const bodyEditorConfig = {
  'data-testid': 'templateForm-body',
  height: 250,
  language: 'handlebars',
  options: {
    tabSize: 2,
    lineNumbers: 'off',
    minimap: { enabled: false },
    overviewRulerBorder: false,
    lineHeight: 25,
    renderLineHighlight: 'none',
    overviewRulerLanes: 0,
    hideCursorInOverviewRuler: true,
  },
};
