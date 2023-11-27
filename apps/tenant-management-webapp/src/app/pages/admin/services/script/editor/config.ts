export const scriptEditorConfig = {
  'data-testid': 'templateForm-body',
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

export const scriptEditorJsonConfig = {
  'data-testid': 'templateForm-test-input',
  options: {
    selectOnLineNumbers: true,
    renderIndentGuides: true,
    colorDecorators: true,
  },
};
