import { scriptEditorConfig } from './config';

describe('scriptEditorConfig', () => {
  it('lets Monaco relayout itself when the editor pane changes size', () => {
    // Arrange
    const { options } = scriptEditorConfig;

    // Act
    const automaticLayout = options.automaticLayout;

    // Assert
    expect(automaticLayout).toBe(true);
  });
});
