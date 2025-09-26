import React from 'react';
import { GoABadge, GoAButton } from '@abgov/react-components';

function fallbackRender({ error, resetErrorBoundary }) {
  return (
    <div role="alert">
      <GoABadge type="emergency" content="Unexpected error in JSON Form" />
      <pre>{error.message}</pre>
      <GoAButton
        onClick={() => {
          resetErrorBoundary();
        }}
      >
        Reset JSON Forms
      </GoAButton>
    </div>
  );
}

export default fallbackRender;
