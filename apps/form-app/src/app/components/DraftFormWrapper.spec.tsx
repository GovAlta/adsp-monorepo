import { render } from '@testing-library/react';
import { DraftFormWrapper } from './DraftFormWrapper';

const mockDraftForm = jest.fn(() => null);

jest.mock('./DraftForm', () => ({
  DraftForm: (props) => mockDraftForm(props),
}));

describe('DraftFormWrapper', () => {
  beforeEach(() => {
    mockDraftForm.mockClear();
  });

  it('forwards the external navigation contract to the draft form', () => {
    // Arrange
    const navigationTarget = { pageId: 'contact-details', scope: '#/properties/email' };
    const onNavigationChange = jest.fn();

    // Act
    render(
      <DraftFormWrapper
        definition={{ id: 'definition-1', name: 'Example', dataSchema: {}, uiSchema: {} }}
        form={{ id: 'form-1', urn: 'urn:ads:platform:form-service:form:form-1', status: 'draft' }}
        data={{}}
        canSubmit={false}
        showSubmit={false}
        saving={false}
        submitting={false}
        onChange={jest.fn()}
        onSubmit={jest.fn()}
        onSave={jest.fn()}
        navigationTarget={navigationTarget}
        onNavigationChange={onNavigationChange}
      />,
    );

    // Assert
    expect(mockDraftForm).toHaveBeenCalledWith(
      expect.objectContaining({
        navigationTarget,
        onNavigationChange,
      }),
    );
  });
});
