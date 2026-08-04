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
const EDIT_BUTTON_SELECTOR = "goa-button[testid='email-template-properties-edit']";
const ERROR_BADGE_SELECTOR = "goa-badge[testid='email-template-properties-error']";

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

describe('TemplateEditor properties section', () => {
  it('renders the properties accordion collapsed by default', () => {
    const { baseElement } = renderEditor();

    const accordion = baseElement.querySelector(ACCORDION_SELECTOR);

    expect(accordion).toBeInTheDocument();
    expect(accordion).not.toHaveAttribute('open');
  });

  it('summarizes the current property values, marking blank fields as empty', () => {
    const { getByTestId } = renderEditor();

    const summary = getByTestId('email-template-properties-values');

    expect(summary).toHaveTextContent('Subject: Your application has been approved');
    expect(summary).toHaveTextContent('Title: (empty)');
    expect(summary).toHaveTextContent('Subtitle: (empty)');
  });

  it('keeps the subject, title and subtitle editors mounted while collapsed', () => {
    const { getByTestId } = renderEditor();

    expect(getByTestId('templated-editor-subject')).toBeInTheDocument();
    expect(getByTestId('templated-editor-title')).toBeInTheDocument();
    expect(getByTestId('templated-editor-subtitle')).toBeInTheDocument();
  });

  it('opens the accordion and hides the summary when Edit is clicked', () => {
    const { baseElement, queryByTestId } = renderEditor();

    const editButton = baseElement.querySelector(EDIT_BUTTON_SELECTOR);
    fireEvent(editButton, new CustomEvent('_click'));

    expect(baseElement.querySelector(ACCORDION_SELECTOR)).toHaveAttribute('open', 'true');
    expect(queryByTestId('email-template-properties-values')).not.toBeInTheDocument();
  });

  it('flags a collapsed section that hides a property error', () => {
    const { baseElement } = renderEditor({ errors: { subject: 'Invalid handlebar syntax' } });

    expect(baseElement.querySelector(ERROR_BADGE_SELECTOR)).toBeInTheDocument();
  });

  it('does not flag an error when only the body is invalid', () => {
    const { baseElement } = renderEditor({ errors: { body: 'Invalid handlebar syntax' } });

    expect(baseElement.querySelector(ERROR_BADGE_SELECTOR)).not.toBeInTheDocument();
  });
});
