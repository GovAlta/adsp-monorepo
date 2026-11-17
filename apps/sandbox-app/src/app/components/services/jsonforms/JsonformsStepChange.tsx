// clean-code-ignore: RULE-19 — covered by ./JsonformsStepChange.spec.tsx.
//
// Showcase for ContextProvider's onStepChange: a host learning which step the user is on. The form is
// small on purpose, with one page that only appears for a particular answer, so the call log shows
// the callback firing on mount, on each step change and when a page is revealed, and staying silent
// while the user types.
import { useCallback, useMemo, useState } from 'react';
import { GoabCallout, GoabContainer, GoabText } from '@abgov/react-components';
import {
  ContextProviderFactory,
  createDefaultAjv,
  GoACells,
  GoARenderers,
  StepInfo,
  useStepChange,
} from '@abgov/jsonforms-components';
import { JsonForms } from '@jsonforms/react';
import { ServiceContainer } from '../../styled-components';
import { FormContainer, StepInfoPanel, StepLogEntry } from './StepInfoPanel';

const ContextProvider = ContextProviderFactory();

export const stepChangeDataSchema = {
  type: 'object',
  properties: {
    firstName: { type: 'string' },
    lastName: { type: 'string' },
    hasRepresentative: { type: 'string', enum: ['Yes', 'No'] },
    representativeName: { type: 'string' },
    email: { type: 'string', format: 'email' },
  },
};

// No variant, so the Categorization renders with the default stepper.
export const stepChangeUiSchema = {
  type: 'Categorization',
  options: { showNavButtons: true },
  elements: [
    {
      type: 'Category',
      label: 'Your name',
      elements: [
        { type: 'Control', scope: '#/properties/firstName', label: 'First name' },
        { type: 'Control', scope: '#/properties/lastName', label: 'Last name' },
      ],
    },
    {
      type: 'Category',
      label: 'Representative',
      elements: [
        {
          type: 'Control',
          scope: '#/properties/hasRepresentative',
          label: 'Do you have a representative?',
          options: { format: 'radio' },
        },
      ],
    },
    {
      type: 'Category',
      label: 'Representative details',
      rule: { effect: 'SHOW', condition: { scope: '#/properties/hasRepresentative', schema: { const: 'Yes' } } },
      elements: [{ type: 'Control', scope: '#/properties/representativeName', label: 'Representative name' }],
    },
    {
      type: 'Category',
      label: 'Contact',
      elements: [{ type: 'Control', scope: '#/properties/email', label: 'Email' }],
    },
  ],
};

const USAGE_EXAMPLE = `import { ContextProviderFactory, useStepChange } from '@abgov/jsonforms-components';

const ContextProvider = ContextProviderFactory();

const { stepInfo, onStepChange } = useStepChange();

// Outside the form container: host code reads the reported step.
<StepInfoPanel stepInfo={stepInfo} />

// The form container: the form only reports the step out.
<div className="form-container">
  <ContextProvider onStepChange={onStepChange}>
    <JsonForms schema={schema} uischema={uischema} data={data} renderers={GoARenderers} cells={GoACells} />
  </ContextProvider>
</div>`;

// The form lives in its own container; the only thing that leaves it is the onStepChange report.
const StepChangeFormContainer = ({ onStepChange }: { onStepChange: (stepInfo: StepInfo) => void }): JSX.Element => {
  const ajv = useMemo(() => createDefaultAjv(), []);
  const [formData, setFormData] = useState<Record<string, unknown>>({});

  const handleFormChange = useCallback(({ data }: { data: Record<string, unknown> }) => setFormData(data), []);
  const handleSubmit = useCallback(() => {
    //stub submit handler
  }, []);

  return (
    <FormContainer data-testid="step-change-form-container">
      <ContextProvider onStepChange={onStepChange} submit={{ submitForm: handleSubmit, saveForm: handleSubmit }}>
        <JsonForms
          ajv={ajv}
          schema={stepChangeDataSchema}
          uischema={stepChangeUiSchema}
          data={formData}
          renderers={GoARenderers}
          cells={GoACells}
          onChange={handleFormChange}
        />
      </ContextProvider>
    </FormContainer>
  );
};

export const JsonformsStepChange = (): JSX.Element => {
  const [stepLog, setStepLog] = useState<StepLogEntry[]>([]);
  const { stepInfo, onStepChange } = useStepChange((info: StepInfo) =>
    setStepLog((entries) => [{ at: new Date().toLocaleTimeString(), stepInfo: info }, ...entries]),
  );

  return (
    <ServiceContainer>
      <GoabContainer
        accent="thick"
        type="non-interactive"
        width="full"
        testId="JsonformsStepChangeContainer"
        heading="Track the current step (onStepChange)"
      >
        <GoabText size="body-m">
          <code>onStepChange</code> on <code>ContextProvider</code> tells the host which step the user is on. It is
          called once when the form mounts and again whenever the step changes, including when an answer shows or hides
          a page. Typing on a step does not call it.
        </GoabText>

        <GoabCallout type="information" heading="Try it" mt="m" mb="m">
          Move through the steps, answer &quot;Yes&quot; to the representative question to reveal an extra page, and
          type in a field. Each call shows up in the log; typing adds nothing.
        </GoabCallout>

        <StepInfoPanel stepInfo={stepInfo} stepLog={stepLog} />

        <StepChangeFormContainer onStepChange={onStepChange} />

        <h3>Usage</h3>
        <pre data-testid="step-change-usage">
          <code>{USAGE_EXAMPLE}</code>
        </pre>
      </GoabContainer>
    </ServiceContainer>
  );
};

export default JsonformsStepChange;
