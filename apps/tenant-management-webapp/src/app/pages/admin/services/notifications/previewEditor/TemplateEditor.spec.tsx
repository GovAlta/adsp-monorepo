import React from 'react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';

import { TemplateEditor } from './TemplateEditor';
import { Template } from '@store/notification/models';

// Monaco loads its worker bundle from a CDN and cannot run in jsdom.
jest.mock('@monaco-editor/react', () => ({
  __esModule: true,
  default: () => <div data-testid="monaco-editor-mock" />,
  useMonaco: () => null,
}));

jest.mock('./TemplateAITab', () => ({
  TemplateAITab: () => <div data-testid="template-ai-tab" />,
}));

jest.mock('@store/agent/selectors', () => ({
  agentConnectedSelector: () => false,
  threadSelector: () => null,
}));

jest.mock('@store/agent/actions', () => ({
  connectAgent: () => ({ type: 'agent/connect' }),
  disconnectAgent: () => ({ type: 'agent/disconnect' }),
  startThread: () => ({ type: 'agent/startThread' }),
}));

jest.mock('@store/file/actions', () => ({
  UploadFileService: jest.fn(),
}));

const ACCORDION_SELECTOR = "goa-accordion[testid='email-template-properties']";
const ERROR_BADGE_SELECTOR = "goa-badge[testid='email-template-properties-error']";
const PREVIEW_BUTTON_SELECTOR = "goa-button[testid='toggle-email-preview']";

const mockStore = configureStore([]);

function buildTemplates(overrides: Partial<Template['email']> = {}): Template {
  return {
    email: {
      subject: 'Your application has been approved',
      title: '',
      subtitle: '',
      body: '<p>Hello</p>',
      ...overrides,
    },
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderEditor(props: Record<string, any> = {}) {
  const templates = props.templates ?? buildTemplates();
  const store = mockStore({ config: { featureFlags: {} } });

  return render(
    <Provider store={store}>
      <TemplateEditor
        modelOpen={true}
        mainTitle="Edit a"
        onSubjectChange={jest.fn()}
        onTitleChange={jest.fn()}
        onSubtitleChange={jest.fn()}
        onBodyChange={jest.fn()}
        setPreview={jest.fn()}
        templates={templates}
        savedTemplates={templates}
        validChannels={['email']}
        initialChannel="email"
        resetToSavedAction={jest.fn()}
        saveAndReset={jest.fn()}
        validateEventTemplateFields={() => true}
        eventTemplateFormState={{
          saveOrAddActionText: 'Save all',
          cancelOrBackActionText: 'Close',
          mainTitle: 'Edit',
        }}
        errors={{}}
        serviceName="file-service:file-uploaded"
        {...props}
      />
    </Provider>,
  );
}

function collapseProperties(baseElement: HTMLElement) {
  const accordion = baseElement.querySelector(ACCORDION_SELECTOR);
  fireEvent(accordion, new CustomEvent('_change', { detail: { open: false } }));
}

describe('TemplateEditor properties section', () => {
  it('renders the properties accordion expanded by default', () => {
    const { baseElement } = renderEditor();

    const accordion = baseElement.querySelector(ACCORDION_SELECTOR);

    expect(accordion).toBeInTheDocument();
    expect(accordion).toHaveAttribute('open', 'true');
  });

  it('summarizes the current property values, marking blank fields as empty', () => {
    const { baseElement, getByTestId } = renderEditor();
    collapseProperties(baseElement);

    const summary = getByTestId('email-template-properties-values');

    expect(summary).toHaveTextContent('Subject: Your application has been approved');
    expect(summary).toHaveTextContent('Title: (empty)');
    expect(summary).toHaveTextContent('Subtitle: (empty)');
  });

  it('keeps the subject, title and subtitle editors mounted while collapsed', () => {
    const { baseElement, getByTestId } = renderEditor();
    collapseProperties(baseElement);

    expect(getByTestId('templated-editor-subject')).toBeInTheDocument();
    expect(getByTestId('templated-editor-title')).toBeInTheDocument();
    expect(getByTestId('templated-editor-subtitle')).toBeInTheDocument();
  });

  it('shows the summary when the properties are collapsed', () => {
    const { baseElement, getByTestId } = renderEditor();
    collapseProperties(baseElement);

    expect(baseElement.querySelector(ACCORDION_SELECTOR)).not.toHaveAttribute('open');
    expect(getByTestId('email-template-properties-values')).toBeInTheDocument();
  });

  it('flags a collapsed section that hides a property error', () => {
    const { baseElement } = renderEditor({ errors: { subject: 'Invalid handlebar syntax' } });
    collapseProperties(baseElement);

    expect(baseElement.querySelector(ERROR_BADGE_SELECTOR)).toBeInTheDocument();
  });

  it('does not flag an error when only the body is invalid', () => {
    const { baseElement } = renderEditor({ errors: { body: 'Invalid handlebar syntax' } });
    collapseProperties(baseElement);

    expect(baseElement.querySelector(ERROR_BADGE_SELECTOR)).not.toBeInTheDocument();
  });

  it('groups the property fields and the default template option inside the accordion', () => {
    const { baseElement, getByTestId } = renderEditor();

    expect(getByTestId('template-properties-grid')).toBeInTheDocument();
    const checkbox = getByTestId('default-template-checkbox');
    expect(checkbox.closest('goa-accordion')).not.toBeNull();

    collapseProperties(baseElement);
    expect(getByTestId('default-template-checkbox')).toBeInTheDocument();
  });

  it('toggles the preview from the tab bar action', () => {
    const onTogglePreview = jest.fn();
    const { baseElement, getByText } = renderEditor({ onTogglePreview, previewVisible: true });

    expect(getByText('Hide preview')).toBeInTheDocument();
    fireEvent(baseElement.querySelector(PREVIEW_BUTTON_SELECTOR), new CustomEvent('_click'));

    expect(onTogglePreview).toHaveBeenCalledTimes(1);
  });
});
