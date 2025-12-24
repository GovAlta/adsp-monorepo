import React from 'react';
import { GoabBadge, GoabButton } from '@abgov/react-components';

function fallbackRender({ error, resetErrorBoundary }) {
  return (
    <div role="alert">
      <GoabBadge type="emergency" content="Unexpected error in JSON Form" />
      <pre>{error.message}</pre>
      <GoabButton
        onClick={() => {
          resetErrorBoundary();
        }}
      >
        Reset JSON Forms
      </GoabButton>
    </div>
  );
}

export default fallbackRender;
