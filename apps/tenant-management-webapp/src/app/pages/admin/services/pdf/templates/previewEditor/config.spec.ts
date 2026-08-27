import { bodyEditorConfig } from './config';

describe('bodyEditorConfig', () => {
  it('lets Monaco relayout itself when the editor pane changes size', () => {
    // Arrange
    const { options } = bodyEditorConfig;

    // Act
    const automaticLayout = options?.automaticLayout;

    // Assert
    expect(automaticLayout).toBe(true);
  });
});
