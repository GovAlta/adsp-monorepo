import React from 'react';
import { useState } from 'react';
import { InputLabel } from '@mui/material';
import { GoAFormStepper, GoAFormStep, GoAPages, GoAButton } from '@abgov/react-components-new';

interface RatingProps {
  id?: string;
  value: number;
  updateValue: (newValue: number) => void;
}

declare type Status = 'complete' | 'incomplete';

export const FormStepper: React.FC<RatingProps> = ({ id, value, updateValue }) => {
  const [step, setStep] = useState<number>(-1);
  // controlled by the user based on form completion
  const [status, setStatus] = useState<Status[]>(['complete', 'complete', 'incomplete', 'incomplete']);
  function setPage(page) {
    if (page < 1 || page > 4) return;
    setStep(page);
  }

  return (
    <div id="#/properties/formStepper" className="formStepper">
      <GoAFormStepper testId="form-stepper-test" step={step} onChange={(step) => setStep(step)}>
        <GoAFormStep text="Personal details" status={status[0]} />
        <GoAFormStep text="Employment history" status={status[1]} />
        <GoAFormStep text="References" status={status[2]} />
        <GoAFormStep text="Review" status={status[3]} />
      </GoAFormStepper>
      <GoAPages current={step} mb="xl">
        <div>Page 1</div>
        <div>Page 2</div>
        <div>Page 3</div>
        <div>Page 4</div>
      </GoAPages>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <GoAButton type="secondary" onClick={() => setPage(step - 1)}>
          Previous
        </GoAButton>
        <GoAButton type="primary" onClick={() => setPage(step + 1)}>
          Next
        </GoAButton>
      </div>
    </div>
  );
};
