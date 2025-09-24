import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import FormEditorCommon from './form-editor-common';

describe('FormEditorCommon', () => {
  it('should render successfully', () => {
    const { baseElement } = render(
      <MemoryRouter>
        <FormEditorCommon
          session={{}}
          config={{
            tabs: {
              overview: true,
              definition: {
                enabled: true,
                features: {
                  filterByTag: true,
                  filterByProgram: true,
                  filterByMinistry: true,
                  registeredID: true,
                  searchActsOfLegislation: true,
                },
              },
              export: true,
            },
          }}
        />
      </MemoryRouter>
    );
    expect(baseElement).toBeTruthy();
  });
});
