import { render } from '@testing-library/react';

import JsonformsComponents from './jsonforms-components';

describe('JsonformsComponents', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<JsonformsComponents />);
    expect(baseElement).toBeTruthy();
  });
});
