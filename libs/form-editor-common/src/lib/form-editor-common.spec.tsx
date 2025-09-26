import { render } from '@testing-library/react';

import FormEditorCommon from './form-editor-common';

describe('FormEditorCommon', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<FormEditorCommon />);
    expect(baseElement).toBeTruthy();
  });
});
